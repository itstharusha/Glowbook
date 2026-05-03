const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User          = require('../models/User');
const Salon         = require('../models/Salon');
const Service       = require('../models/Service');
const Stylist       = require('../models/Stylist');
const Appointment   = require('../models/Appointment');
const Review        = require('../models/Review');
const PortfolioItem = require('../models/PortfolioItem');

// ── Helpers ────────────────────────────────────────────────────────────────────

const past   = (days) => new Date(Date.now() - days * 86400000);
const future = (days) => new Date(Date.now() + days * 86400000);

const weekdaySlots = (days) => {
  const slots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
  const schedule = {};
  days.forEach((d) => { schedule[d] = { isOpen: true, slots }; });
  return schedule;
};

const updateAvgRating = async (salonId) => {
  const reviews = await Review.find({ salonId });
  if (!reviews.length) return;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Salon.findByIdAndUpdate(salonId, { avgRating: Math.round(avg * 10) / 10 });
};

// ── Main ───────────────────────────────────────────────────────────────────────

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected\n');

    // Wipe in safe dependency order
    await PortfolioItem.deleteMany({});
    await Review.deleteMany({});
    await Appointment.deleteMany({});
    await Stylist.deleteMany({});
    await Service.deleteMany({});
    await Salon.deleteMany({});
    await User.deleteMany({});
    console.log('All collections cleared\n');

    // ── Users ──────────────────────────────────────────────────────────────────
    const hashed = await bcrypt.hash('password123', 10);

    const [alice, bob, sarah, marcus, admin] = await User.insertMany([
      { name: 'Alice Chen',   email: 'customer@glowbook.com',  password: hashed, role: 'customer' },
      { name: 'Bob Kumar',    email: 'customer2@glowbook.com', password: hashed, role: 'customer' },
      { name: 'Sarah Willis', email: 'vendor@glowbook.com',    password: hashed, role: 'vendor'   },
      { name: 'Marcus Obi',   email: 'vendor2@glowbook.com',   password: hashed, role: 'vendor'   },
      { name: 'Admin User',   email: 'admin@glowbook.com',     password: hashed, role: 'admin'    },
    ]);
    console.log('5 users seeded');

    // ── Salons ─────────────────────────────────────────────────────────────────
    const [glowSalon, nailSalon] = await Salon.insertMany([
      {
        name: 'Glow & Co',
        description: 'Premium hair salon offering balayage, precision cuts, and blowouts in the heart of the city.',
        location: '14 Queen Street, Colombo 03',
        phoneNumber: '+94 77 123 4567',
        category: 'Hair',
        openingHours: 'Mon–Sat: 9:00 AM – 7:00 PM',
        images: [],
        owner: sarah._id,
        isVerified: true,
      },
      {
        name: 'The Nail Bar',
        description: 'Specialising in gel manicures, acrylic sets, and luxury pedicures.',
        location: '8 Galle Road, Colombo 04',
        phoneNumber: '+94 77 987 6543',
        category: 'Nails',
        openingHours: 'Mon–Fri: 10:00 AM – 8:00 PM',
        images: [],
        owner: marcus._id,
        isVerified: true,
      },
    ]);

    // Link salons to vendor accounts
    await User.findByIdAndUpdate(sarah._id,  { ownedSalon: glowSalon._id });
    await User.findByIdAndUpdate(marcus._id, { ownedSalon: nailSalon._id });
    console.log('2 salons seeded');

    // ── Services ───────────────────────────────────────────────────────────────
    const [haircut, balayage, blowout] = await Service.insertMany([
      { salonId: glowSalon._id, name: 'Classic Haircut', category: 'Hair',  description: 'Precision cut with a wash and blow-dry finish.',        price: 35,  duration: 30  },
      { salonId: glowSalon._id, name: 'Balayage',        category: 'Hair',  description: 'Sun-kissed hand-painted highlights with a soft blend.',  price: 120, duration: 120 },
      { salonId: glowSalon._id, name: 'Blowout',         category: 'Hair',  description: 'Salon-quality blowout for any occasion.',                price: 45,  duration: 45  },
    ]);

    const [gelMani, acrylicSet, pedicure] = await Service.insertMany([
      { salonId: nailSalon._id, name: 'Gel Manicure',    category: 'Nails', description: 'Long-lasting gel colour with cuticle care.',             price: 40, duration: 45 },
      { salonId: nailSalon._id, name: 'Acrylic Full Set', category: 'Nails', description: 'Sculpted acrylic nails in any shape and length.',        price: 60, duration: 60 },
      { salonId: nailSalon._id, name: 'Pedicure',         category: 'Nails', description: 'Relaxing foot soak, scrub, and polish.',                 price: 35, duration: 45 },
    ]);
    console.log('6 services seeded');

    // ── Stylists ───────────────────────────────────────────────────────────────
    const [emma, liam] = await Stylist.insertMany([
      {
        salonId: glowSalon._id,
        name: 'Emma Park',
        bio: 'Senior stylist with 8 years in balayage and colour correction.',
        specializations: ['Balayage', 'Haircut', 'Blowout'],
        availability: weekdaySlots(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
      },
      {
        salonId: glowSalon._id,
        name: 'Liam Grant',
        bio: "Expert in precision cuts and men's grooming with a modern edge.",
        specializations: ['Haircut', 'Blowout'],
        availability: weekdaySlots(['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      },
    ]);

    const [priya] = await Stylist.insertMany([
      {
        salonId: nailSalon._id,
        name: 'Priya Nair',
        bio: 'Nail artist specialising in gel, acrylics, and intricate nail art.',
        specializations: ['Gel Manicure', 'Acrylic Full Set', 'Pedicure'],
        availability: weekdaySlots(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
      },
    ]);
    console.log('3 stylists seeded');

    // ── Appointments ───────────────────────────────────────────────────────────
    // Completed appointments are required before a review can be left.
    // One review per customer per salon — enforced below.
    await Appointment.insertMany([
      // Alice @ Glow & Co — Completed (unlocks her review)
      { userId: alice._id, salonId: glowSalon._id, serviceId: haircut._id,    stylistId: emma._id,  date: past(14),  timeSlot: '10:00 AM', status: 'Completed', notes: 'Just a trim please'     },
      // Bob @ Glow & Co — Completed (unlocks his review)
      { userId: bob._id,   salonId: glowSalon._id, serviceId: balayage._id,   stylistId: emma._id,  date: past(10),  timeSlot: '02:00 PM', status: 'Completed', notes: ''                       },
      // Alice @ Glow & Co — Confirmed (upcoming)
      { userId: alice._id, salonId: glowSalon._id, serviceId: blowout._id,    stylistId: liam._id,  date: future(5), timeSlot: '11:00 AM', status: 'Confirmed', notes: 'Before my wedding'      },
      // Alice @ The Nail Bar — Completed (unlocks her nail bar review)
      { userId: alice._id, salonId: nailSalon._id, serviceId: gelMani._id,    stylistId: priya._id, date: past(7),   timeSlot: '12:00 PM', status: 'Completed', notes: ''                       },
      // Bob @ The Nail Bar — Pending (upcoming)
      { userId: bob._id,   salonId: nailSalon._id, serviceId: acrylicSet._id, stylistId: priya._id, date: future(3), timeSlot: '03:00 PM', status: 'Pending',   notes: 'Matte finish please'    },
      // Alice @ The Nail Bar — Cancelled (older booking)
      { userId: alice._id, salonId: nailSalon._id, serviceId: pedicure._id,   stylistId: priya._id, date: past(20),  timeSlot: '09:00 AM', status: 'Cancelled', notes: ''                       },
    ]);
    console.log('6 appointments seeded (2 Completed, 1 Confirmed, 1 Pending, 1 Cancelled)');

    // ── Reviews ────────────────────────────────────────────────────────────────
    // Each review is valid: customer has a Completed appointment at that salon.
    // One per customer per salon — matches backend enforcement.
    await Review.insertMany([
      { salonId: glowSalon._id, userId: alice._id, rating: 5, comment: 'Absolutely loved my haircut! Emma is so talented.' },
      { salonId: glowSalon._id, userId: bob._id,   rating: 4, comment: 'Great balayage result. Will definitely be back.'   },
      { salonId: nailSalon._id, userId: alice._id, rating: 4, comment: 'Priya did an amazing job — very clean and precise.' },
    ]);

    // Recalculate salon avgRating from actual review data
    await Promise.all([
      updateAvgRating(glowSalon._id),   // (5 + 4) / 2 = 4.5
      updateAvgRating(nailSalon._id),   // (4)     / 1 = 4.0
    ]);
    console.log('3 reviews seeded, avgRating recalculated');

    // ── Portfolio Items ────────────────────────────────────────────────────────
    await PortfolioItem.insertMany([
      { salonId: glowSalon._id, stylistId: emma._id,  title: 'Sun-Kissed Balayage',  description: 'Natural hand-painted highlights with a warm, soft blend.', images: [], category: 'Hair',  tags: ['balayage', 'highlights', 'blonde'],  isPublic: true },
      { salonId: glowSalon._id, stylistId: liam._id,  title: 'Textured Bob Cut',     description: 'A modern bob with added texture and volume.',               images: [], category: 'Hair',  tags: ['bob', 'cut', 'short hair'],          isPublic: true },
      { salonId: nailSalon._id, stylistId: priya._id, title: 'Pastel Gel Set',       description: 'Soft pastel gel manicure with delicate floral nail art.',   images: [], category: 'Nails', tags: ['gel', 'pastel', 'nail art'],         isPublic: true },
      { salonId: nailSalon._id, stylistId: priya._id, title: 'Classic French Tips',  description: 'Timeless French tip acrylic set, any length.',              images: [], category: 'Nails', tags: ['french', 'acrylic', 'classic'],      isPublic: true },
    ]);
    console.log('4 portfolio items seeded');

    // ── Summary ────────────────────────────────────────────────────────────────
    const [glowFinal, nailFinal] = await Promise.all([
      Salon.findById(glowSalon._id),
      Salon.findById(nailSalon._id),
    ]);

    console.log('\n── Seed complete ─────────────────────────────────────────────────────');
    console.log('\nTest credentials (password: password123)');
    console.log('  customer@glowbook.com   → Alice Chen   (customer)');
    console.log('  customer2@glowbook.com  → Bob Kumar    (customer)');
    console.log('  vendor@glowbook.com     → Sarah Willis (vendor → Glow & Co)');
    console.log('  vendor2@glowbook.com    → Marcus Obi   (vendor → The Nail Bar)');
    console.log('  admin@glowbook.com      → Admin User   (admin)');
    console.log('\nSalons:');
    console.log(`  Glow & Co     Hair   verified  avgRating: ${glowFinal.avgRating}`);
    console.log(`  The Nail Bar  Nails  verified  avgRating: ${nailFinal.avgRating}`);
    console.log('\nData:');
    console.log('  6 services   (3 per salon)');
    console.log('  3 stylists   (Emma, Liam → Glow; Priya → Nails)');
    console.log('  6 appointments (2 Completed, 1 Confirmed, 1 Pending, 1 Cancelled)');
    console.log('  3 reviews    (Alice→Glow 5★, Bob→Glow 4★, Alice→Nails 4★)');
    console.log('  4 portfolio items (2 per salon)');
    console.log('──────────────────────────────────────────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

run();
