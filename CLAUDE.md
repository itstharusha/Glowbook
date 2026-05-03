# GlowBook — Project Memory

## Architecture Overview

3-sided marketplace: Customer / Vendor / Admin  
Stack: React Native (Expo 54) + Node.js + Express + MongoDB Atlas  
Auth: JWT (Bearer token), stored in AsyncStorage  
Images: Cloudinary (multer-storage-cloudinary)

```
glowbook-backend/   ← Express API (port 5000)
glowbook-mobile/    ← Expo React Native app
```

## Role Logic

- `customer` — default on register, browses + books
- `vendor` — chosen on register, must create salon before using app
- `admin` — set manually in DB, never selectable on register
- Vendor without `ownedSalon` → redirected to VendorSetupStack
- Vendor with `ownedSalon` → VendorTabs

## Backend — Key Patterns

### API Response Format (ALWAYS)
```js
// Success
res.status(200).json({ success: true, data: payload });
// Error
res.status(4xx).json({ success: false, message: 'description' });
```

### Ownership Check Pattern
```js
const item = await Model.findById(id).populate('salonId');
if (item.salonId.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
  return res.status(403).json({ success: false, message: 'Access denied' });
}
```

### Route Ordering (CRITICAL)
Always define specific routes BEFORE parameterized routes:
```js
router.get('/my', ...);           // MUST come before /:id
router.get('/vendor-salon', ...); // MUST come before /:id
router.get('/salon/:id', ...);    // MUST come before /:id
router.get('/:id', ...);
```

### Cascade Delete (when deleting a salon)
Delete in this order: Service → Stylist → Appointment → Review → PortfolioItem → then salon

### Cloudinary
- `upload` → general uploads (`glowbook/` folder)
- `uploadPortfolio` → portfolio images (`glowbook/portfolio/` folder)
- Both exported from `config/cloudinary.js`

## Backend — Routes Reference

| Prefix | File | Status |
|--------|------|--------|
| /api/auth | authRoutes.js | ✅ Complete |
| /api/users | userRoutes.js | ✅ Complete |
| /api/salons | salonRoutes.js | ✅ Complete |
| /api/services | serviceRoutes.js | ✅ Complete |
| /api/stylists | stylistRoutes.js | ✅ Complete |
| /api/appointments | appointmentRoutes.js | ✅ Complete (vendor + admin + customer) |
| /api/portfolio | portfolioRoutes.js | ✅ Complete |
| /api/reviews | reviewRoutes.js | ✅ Complete |

## Appointment Routes
- `GET /my` — customer's own appointments (protect)
- `POST /` — customer books (protect)
- `PUT /:id/cancel` — customer cancels (protect)
- `GET /vendor-salon` — vendor views their salon's bookings (protect, isVendor)
- `PUT /:id/status` — vendor/admin updates status (protect, isVendorOrAdmin)
- `GET /admin/all` — admin sees all (protect, admin)

## Review Routes
- `GET /salon/:salonId` — public, all reviews for a salon
- `GET /my/:salonId` — current user's review for a salon (protect)
- `POST /` — create review (protect; requires completed appointment; one per user/salon)
- `DELETE /:id` — delete own review or admin (protect)
- avgRating on Salon auto-updates after every create/delete

## Backend — Schema Quick Reference

**Salon:** name, description, location, phoneNumber, category, openingHours, images[], avgRating, owner(User), isVerified  
**Service:** salonId(Salon), name, category, description, price, duration, isActive, image  
**Stylist:** salonId(Salon), name, bio, specializations[], portfolio[], availability(Object)  
**Appointment:** userId, salonId, serviceId, stylistId, date, timeSlot, status(Pending/Confirmed/Completed/Cancelled), notes  
**Review:** userId, salonId, rating(1-5), comment  
**PortfolioItem:** salonId(Salon), stylistId(Stylist?), title, description, images[], category, tags[], isPublic

## Frontend — Navigation Structure

```
AppNavigator
├── AuthStack (no user)
│   └── Splash → Onboarding → Login → Register
├── CustomerTabs (role=customer/user)
│   ├── Home → CustomerHomeStack
│   │   ├── CustomerHomeScreen
│   │   ├── SalonDetailScreen (4 tabs: Services|Stylists|Portfolio|Reviews)
│   │   ├── BookAppointmentScreen
│   │   └── CustomerPortfolioViewScreen
│   ├── Explore → CustomerExploreStack
│   │   ├── ExploreScreen (search + category filter)
│   │   ├── SalonDetailScreen
│   │   ├── BookAppointmentScreen
│   │   └── CustomerPortfolioViewScreen
│   ├── Bookings → CustomerBookingsStack
│   │   ├── CustomerBookingsScreen (filter by status, cancel, leave review)
│   │   └── LeaveReviewScreen
│   └── Profile → ProfileScreen (real stats, My Bookings nav)
├── VendorSetupStack (role=vendor, no ownedSalon)
│   └── VendorWelcome → VendorCreateSalon
├── VendorTabs (role=vendor, has ownedSalon)
│   ├── Dashboard → VendorDashboardStack
│   │   └── VendorDashboardScreen (real stats, quick-nav to MySalon screens)
│   ├── MySalon → MySalonStack
│   │   ├── VendorSalonScreen (3 tabs: Services|Stylists|Portfolio)
│   │   ├── VendorEditSalonScreen
│   │   ├── VendorAddEditServiceScreen
│   │   ├── VendorAddEditStylistScreen
│   │   ├── VendorAddEditPortfolioScreen
│   │   └── VendorPortfolioScreen
│   ├── Bookings → VendorBookingsStack
│   │   ├── VendorBookingsScreen
│   │   └── VendorBookingDetailScreen
│   └── Profile → ProfileScreen
└── AdminStack (role=admin)
    ├── AdminDashboardScreen (real stats from API)
    ├── ManageSalonsScreen (verify/delete)
    ├── ManageAppointmentsScreen
    └── AdminUsersScreen
```

## Frontend — Key Rules

- ALWAYS use `api` from `services/api.js` — never `fetch()`
- ALWAYS use `theme.js` constants — never hardcode colors or font sizes
- ALWAYS use `SafeAreaView` on every screen
- ALWAYS handle loading + error states on every API call
- `user.ownedSalon` — the vendor's salon ObjectId (null until they create one)
- Navigate cross-tab with `navigation.navigate('TabName', { screen: 'ScreenName', params: {...} })`

## Components

- `PortfolioCard` — vendor+customer portfolio item card, `showActions` prop toggles edit/delete buttons
- `SalonCard` — salon display card, `horizontal` prop for horizontal scroll vs. vertical list

## Booking Flow (Customer)
1. Home/Explore → tap salon → SalonDetailScreen
2. Services tab → tap "Book" → BookAppointmentScreen
3. Select stylist + date + time slot + notes → Confirm
4. View in Bookings tab → Cancel (Pending/Confirmed) or Leave Review (Completed)

## Review Rules
- Customer must have a **Completed** appointment at that salon
- One review per customer per salon (enforced backend)
- avgRating on Salon recalculated after each create/delete

## Portfolio Management System

Added in v2.0 as replacement for User Management module.  
Vendors showcase their work (photos + metadata). Customers browse.

**Vendor entry point:** MySalon tab → Portfolio sub-tab in VendorSalonScreen

## Known Limitations

- Salon `phoneNumber` field (schema) vs `phone` field (blueprint) — use `phoneNumber`
- Salon `images` field (schema) vs `gallery` field (blueprint) — use `images`
- Stylist `availability` stored as plain Object `{}` — not the array structure in blueprint
- No real-time notifications (appointments are status-polled, not pushed)
- No saved/favourited salons feature (ProfileScreen shows placeholder menu item)

## Commands

```bash
# Backend
cd glowbook-backend
npm run dev        # nodemon
npm start          # production
npm run seed:roles # seed 3 test users

# Frontend
cd glowbook-mobile
npx expo start
npx expo start --android
npx expo start --ios
```

## Test Users (seeded)

| Email | Password | Role |
|-------|----------|------|
| customer@glowbook.com | password123 | customer |
| vendor@glowbook.com | password123 | vendor |
| admin@glowbook.com | password123 | admin |

## Things to NEVER Do

- Never commit `.env` to git
- Never use `fetch()` — use the `api` Axios instance
- Never hardcode colors — use `theme.js`
- Never allow `role: 'admin'` to be set via the register endpoint
- Never define `/:id` routes before `/my` or `/vendor-salon` in the same router
- Never mutate vendor data without an ownership check
- Never call `alert()` — always use `Alert.alert()` from react-native
