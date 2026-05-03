const PortfolioItem = require('../models/PortfolioItem');
const Salon         = require('../models/Salon');
const { cloudinary } = require('../config/cloudinary');

// Extract Cloudinary public_id from a URL
const extractPublicId = (url) => {
  try {
    const parts = url.split('/');
    const folderIndex = parts.indexOf('glowbook');
    if (folderIndex !== -1) {
      const pathParts = parts.slice(folderIndex);
      const fileWithExt = pathParts[pathParts.length - 1];
      const file = fileWithExt.split('.')[0];
      pathParts[pathParts.length - 1] = file;
      return pathParts.join('/');
    }
    // Fallback: last segment without extension
    const last = parts[parts.length - 1];
    return last.split('.')[0];
  } catch {
    return null;
  }
};

// POST /api/portfolio
const createPortfolioItem = async (req, res) => {
  try {
    let salonId;

    if (req.user.role === 'vendor') {
      const salon = await Salon.findOne({ owner: req.user._id });
      if (!salon) {
        return res.status(404).json({ success: false, message: 'You do not have a registered salon' });
      }
      salonId = salon._id;
    } else {
      // admin supplies salonId explicitly
      salonId = req.body.salonId;
      if (!salonId) {
        return res.status(400).json({ success: false, message: 'salonId is required' });
      }
      const salon = await Salon.findById(salonId);
      if (!salon) {
        return res.status(404).json({ success: false, message: 'Salon not found' });
      }
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    const { title, description, category, stylistId, isPublic } = req.body;
    let tags = req.body.tags;

    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required' });
    }

    // Parse tags — frontend sends comma-separated string or array
    if (typeof tags === 'string') {
      tags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (Array.isArray(tags) && tags.length > 10) {
      tags = tags.slice(0, 10);
    }

    const images = req.files.map(f => f.path);

    const item = await PortfolioItem.create({
      salonId,
      stylistId: stylistId || null,
      title,
      description: description || '',
      images,
      category,
      tags: tags || [],
      isPublic: isPublic === 'false' ? false : true,
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('createPortfolioItem error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/portfolio/salon/:salonId (public)
const getPortfoliosBySalon = async (req, res) => {
  try {
    const filter = { salonId: req.params.salonId, isPublic: true };
    if (req.query.category) filter.category = req.query.category;

    const items = await PortfolioItem.find(filter)
      .populate('stylistId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('getPortfoliosBySalon error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/portfolio/my (vendor — sees all including drafts)
const getVendorPortfolios = async (req, res) => {
  try {
    const salon = await Salon.findOne({ owner: req.user._id });
    if (!salon) {
      return res.status(404).json({ success: false, message: 'No salon found for this vendor' });
    }

    const items = await PortfolioItem.find({ salonId: salon._id })
      .populate('stylistId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('getVendorPortfolios error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/portfolio/:id (public — with isPublic enforcement)
const getPortfolioItem = async (req, res) => {
  try {
    const item = await PortfolioItem.findById(req.params.id)
      .populate('salonId', 'name owner')
      .populate('stylistId', 'name');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' });
    }

    // Draft visibility: only the owning vendor or an admin can see non-public items
    if (!item.isPublic) {
      const requestingUser = req.user;
      if (!requestingUser) {
        return res.status(401).json({ success: false, message: 'Authentication required to view this portfolio item' });
      }
      const isOwner = item.salonId.owner.toString() === requestingUser._id.toString();
      const isAdmin = requestingUser.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'This portfolio item is not public' });
      }
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('getPortfolioItem error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/portfolio/:id (text fields only — images managed separately)
const updatePortfolioItem = async (req, res) => {
  try {
    const item = await PortfolioItem.findById(req.params.id).populate('salonId');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' });
    }
    if (
      item.salonId.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'You can only manage your own portfolio' });
    }

    const { title, description, category, stylistId, isPublic } = req.body;
    let { tags } = req.body;

    if (typeof tags === 'string') {
      tags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (Array.isArray(tags) && tags.length > 10) {
      tags = tags.slice(0, 10);
    }

    const update = {};
    if (title !== undefined)       update.title = title;
    if (description !== undefined) update.description = description;
    if (category !== undefined)    update.category = category;
    if (stylistId !== undefined)   update.stylistId = stylistId || null;
    if (isPublic !== undefined)    update.isPublic = isPublic === 'false' ? false : Boolean(isPublic);
    if (tags !== undefined)        update.tags = tags;

    const updated = await PortfolioItem.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    ).populate('stylistId', 'name');

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('updatePortfolioItem error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/portfolio/:id/images (append images to existing item)
const addImagesToItem = async (req, res) => {
  try {
    const item = await PortfolioItem.findById(req.params.id).populate('salonId');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' });
    }
    if (
      item.salonId.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'You can only manage your own portfolio' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images provided' });
    }

    if (item.images.length + req.files.length > 5) {
      return res.status(400).json({
        success: false,
        message: `Maximum 5 images per portfolio item. Currently has ${item.images.length}.`,
      });
    }

    const newUrls = req.files.map(f => f.path);

    const updated = await PortfolioItem.findByIdAndUpdate(
      req.params.id,
      { $push: { images: { $each: newUrls } } },
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('addImagesToItem error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/portfolio/:id/images (remove one image by URL + Cloudinary cleanup)
const removeImageFromItem = async (req, res) => {
  try {
    const item = await PortfolioItem.findById(req.params.id).populate('salonId');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' });
    }
    if (
      item.salonId.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'You can only manage your own portfolio' });
    }

    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'imageUrl is required' });
    }

    if (!item.images.includes(imageUrl)) {
      return res.status(404).json({ success: false, message: 'Image not found in this portfolio item' });
    }

    // Cloudinary cleanup
    const publicId = extractPublicId(imageUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudErr) {
        console.error('Cloudinary destroy error:', cloudErr.message);
      }
    }

    const updated = await PortfolioItem.findByIdAndUpdate(
      req.params.id,
      { $pull: { images: imageUrl } },
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('removeImageFromItem error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/portfolio/:id (full delete with Cloudinary cleanup)
const deletePortfolioItem = async (req, res) => {
  try {
    const item = await PortfolioItem.findById(req.params.id).populate('salonId');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Portfolio item not found' });
    }
    if (
      item.salonId.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'You can only manage your own portfolio' });
    }

    // Destroy all Cloudinary images
    for (const url of item.images) {
      const publicId = extractPublicId(url);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudErr) {
          console.error('Cloudinary destroy error:', cloudErr.message);
        }
      }
    }

    await item.deleteOne();

    res.json({ success: true, data: {} });
  } catch (error) {
    console.error('deletePortfolioItem error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createPortfolioItem,
  getPortfoliosBySalon,
  getVendorPortfolios,
  getPortfolioItem,
  updatePortfolioItem,
  addImagesToItem,
  removeImageFromItem,
  deletePortfolioItem,
};
