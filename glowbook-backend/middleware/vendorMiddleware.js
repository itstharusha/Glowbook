const isVendor = (req, res, next) => {
  if (req.user && req.user.role === 'vendor') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Vendor access required' });
};

const isVendorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'vendor' || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Vendor or Admin access required' });
};

module.exports = { isVendor, isVendorOrAdmin };
