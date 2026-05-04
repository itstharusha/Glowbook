/**
 * GlowBook API — Full Integration Test Suite
 *
 * Tests every CRUD operation across all resources and verifies the
 * customer ↔ vendor integration (e.g. customer books → vendor sees it).
 *
 * Uses an in-memory MongoDB so the real Atlas database is never touched.
 * Cloudinary is mocked: uploads return a fake URL, destroys are no-ops.
 */

// ─── Cloudinary mock (must be declared before any require that loads routes) ───
jest.mock('../config/cloudinary', () => ({
  cloudinary: {
    uploader: {
      destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
    },
  },
  upload: {
    single: () => (req, res, next) => next(),
    array:  () => (req, res, next) => { req.files = []; next(); },
  },
  uploadPortfolio: {
    single: () => (req, res, next) => next(),
    array:  () => (req, res, next) => {
      req.files = [{ path: 'https://res.cloudinary.com/test/image/upload/glowbook/portfolio/test.jpg' }];
      next();
    },
  },
}));

// ─── Test JWT secret (read at call time by authController / authMiddleware) ───
process.env.JWT_SECRET = 'glowbook-test-secret-2024';
process.env.JWT_EXPIRE  = '1d';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose  = require('mongoose');
const request   = require('supertest');
const bcrypt    = require('bcryptjs');
const app       = require('../app');

// ─── Shared test state (populated as tests run in order) ───────────────────
let mongoServer;

let customerToken, vendorToken, adminToken;
let customerId,    vendorId;
let salonId, serviceId, stylistId;
let appointmentId, cancelApptId;
let portfolioId, reviewId;

// Dates far enough in the future to pass the "must be future" validation
const futureDate1 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  .toISOString().split('T')[0];   // 30 days out
const futureDate2 = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000)
  .toISOString().split('T')[0];   // 31 days out (cancel flow)

// ─── Setup / teardown ──────────────────────────────────────────────────────
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Seed the admin user directly (the register endpoint forbids role=admin)
  const User = require('../models/User');
  const hash = await bcrypt.hash('AdminPass123!', 10);
  await User.create({ name: 'Admin User', email: 'admin@test.com', password: hash, role: 'admin' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════════════
describe('1 · Authentication', () => {
  test('register — customer (201)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Customer', email: 'customer@test.com',
      password: 'pass123456', role: 'customer',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.token).toBeDefined();
    customerId = res.body.data.user._id;
  });

  test('register — vendor (201)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Vendor', email: 'vendor@test.com',
      password: 'pass123456', role: 'vendor',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('vendor');
    vendorId = res.body.data.user._id;
  });

  test('register — rejects role=admin (400)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Hacker', email: 'hacker@test.com',
      password: 'pass123456', role: 'admin',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('register — rejects duplicate email (400)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Dup', email: 'customer@test.com', password: 'pass123456',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already in use/i);
  });

  test('register — rejects missing required fields (400)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'nobody@test.com',
    });
    expect(res.status).toBe(400);
  });

  test('login — customer (200 + token)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'customer@test.com', password: 'pass123456',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    customerToken = res.body.data.token;
    expect(customerToken).toBeDefined();
  });

  test('login — vendor (200 + token)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'vendor@test.com', password: 'pass123456',
    });
    expect(res.status).toBe(200);
    vendorToken = res.body.data.token;
    expect(vendorToken).toBeDefined();
  });

  test('login — admin seeded user (200 + token)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com', password: 'AdminPass123!',
    });
    expect(res.status).toBe(200);
    adminToken = res.body.data.token;
    expect(adminToken).toBeDefined();
  });

  test('login — rejects wrong password (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'customer@test.com', password: 'wrongpassword',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  test('login — rejects missing fields (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'customer@test.com' });
    expect(res.status).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. USER PROFILE
// ══════════════════════════════════════════════════════════════════════════════
describe('2 · User Profile', () => {
  test('GET /profile — returns current user (200)', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('customer@test.com');
  });

  test('GET /profile — rejected without token (401)', async () => {
    const res = await request(app).get('/api/users/profile');
    expect(res.status).toBe(401);
  });

  test('PUT /profile — update name (200)', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Updated Customer' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Customer');
  });

  test('GET /all — admin returns paginated user list (200)', async () => {
    const res = await request(app)
      .get('/api/users/all')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3); // admin + customer + vendor
  });

  test('GET /all — rejected for customer (403)', async () => {
    const res = await request(app)
      .get('/api/users/all')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. SALON CRUD
// ══════════════════════════════════════════════════════════════════════════════
describe('3 · Salon CRUD', () => {
  test('POST /api/salons — vendor creates salon (201)', async () => {
    const res = await request(app)
      .post('/api/salons')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        name: 'Glow Studio', description: 'A premium beauty salon for all your needs',
        location: '123 Test Street, Colombo', phoneNumber: '+94771234567',
        category: 'Hair', openingHours: 'Mon-Sat 9am-7pm',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Glow Studio');
    salonId = res.body.data._id;
  });

  test('POST /api/salons — vendor cannot create second salon (400)', async () => {
    const res = await request(app)
      .post('/api/salons')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        name: 'Second Salon', description: 'Should fail',
        location: '456 St', phoneNumber: '+94770000000',
        category: 'Nails', openingHours: 'Mon-Fri 9am-5pm',
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already have a registered salon/i);
  });

  test('POST /api/salons — rejected for customer (403)', async () => {
    const res = await request(app)
      .post('/api/salons')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Fake Salon', description: 'x', location: 'x',
        phoneNumber: '0', category: 'Hair', openingHours: 'x',
      });
    expect(res.status).toBe(403);
  });

  test('GET /api/salons/my — vendor sees their salon (200)', async () => {
    const res = await request(app)
      .get('/api/salons/my')
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(salonId);
  });

  test('GET /api/salons — public list includes new salon (200)', async () => {
    const res = await request(app).get('/api/salons');
    expect(res.status).toBe(200);
    expect(res.body.data.some(s => s._id === salonId)).toBe(true);
  });

  test('GET /api/salons/:id — public detail (200)', async () => {
    const res = await request(app).get(`/api/salons/${salonId}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(salonId);
    expect(res.body.data.phoneNumber).toBe('+94771234567');
  });

  test('GET /api/salons/:id — 404 for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/salons/${fakeId}`);
    expect(res.status).toBe(404);
  });

  test('PUT /api/salons/:id — vendor updates salon (200)', async () => {
    const res = await request(app)
      .put(`/api/salons/${salonId}`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ description: 'Updated description for the salon' });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Updated description for the salon');
  });

  test('PUT /api/salons/:id — rejected for customer (403)', async () => {
    const res = await request(app)
      .put(`/api/salons/${salonId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ description: 'Hacked' });
    expect(res.status).toBe(403);
  });

  test('PATCH /api/salons/:id/verify — admin verifies salon (200)', async () => {
    const res = await request(app)
      .patch(`/api/salons/${salonId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isVerified: true });
    expect(res.status).toBe(200);
    expect(res.body.data.isVerified).toBe(true);
  });

  test('PATCH /api/salons/:id/verify — rejected for vendor (403)', async () => {
    const res = await request(app)
      .patch(`/api/salons/${salonId}/verify`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ isVerified: false });
    expect(res.status).toBe(403);
  });

  test('GET /api/salons/admin/stats — admin stats (200)', async () => {
    const res = await request(app)
      .get('/api/salons/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalSalons).toBeGreaterThanOrEqual(1);
    expect(typeof res.body.data.vendorCount).toBe('number');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. SERVICE CRUD
// ══════════════════════════════════════════════════════════════════════════════
describe('4 · Service CRUD', () => {
  test('POST /api/services — vendor creates service (201)', async () => {
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        salonId, name: 'Classic Haircut',
        category: 'Hair', description: 'Precision scissor cut',
        price: 2500, duration: 45,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Classic Haircut');
    expect(res.body.data.isActive).toBe(true);
    serviceId = res.body.data._id;
  });

  test('POST /api/services — rejected for customer (403)', async () => {
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ salonId, name: 'Fake', category: 'Hair', price: 100, duration: 30 });
    expect(res.status).toBe(403);
  });

  test('GET /api/services/salon/:salonId — public (200)', async () => {
    const res = await request(app).get(`/api/services/salon/${salonId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(serviceId);
  });

  test('PUT /api/services/:id — vendor updates service (200)', async () => {
    const res = await request(app)
      .put(`/api/services/${serviceId}`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ price: 2800, description: 'Updated cut description' });
    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(2800);
  });

  test('PUT /api/services/:id/toggle — vendor toggles isActive (200)', async () => {
    const res = await request(app)
      .put(`/api/services/${serviceId}/toggle`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false); // was true, now false

    // toggle back so appointment booking works later
    const res2 = await request(app)
      .put(`/api/services/${serviceId}/toggle`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res2.body.data.isActive).toBe(true);
  });

  test('PUT /api/services/:id — rejected for customer (403)', async () => {
    const res = await request(app)
      .put(`/api/services/${serviceId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ price: 0 });
    expect(res.status).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. STYLIST CRUD
// ══════════════════════════════════════════════════════════════════════════════
describe('5 · Stylist CRUD', () => {
  test('POST /api/stylists — vendor creates stylist (201)', async () => {
    const res = await request(app)
      .post('/api/stylists')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        salonId, name: 'Maya Silva',
        bio: 'Expert in balayage and precision cuts',
        specializations: ['Balayage', 'Precision Cut'],
      });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Maya Silva');
    stylistId = res.body.data._id;
  });

  test('POST /api/stylists — rejected for customer (403)', async () => {
    const res = await request(app)
      .post('/api/stylists')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ salonId, name: 'Fake' });
    expect(res.status).toBe(403);
  });

  test('GET /api/stylists/salon/:salonId — public list (200)', async () => {
    const res = await request(app).get(`/api/stylists/salon/${salonId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(stylistId);
  });

  test('PUT /api/stylists/:id — vendor updates stylist (200)', async () => {
    const res = await request(app)
      .put(`/api/stylists/${stylistId}`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ bio: 'Updated bio — specialist in colour corrections' });
    expect(res.status).toBe(200);
    expect(res.body.data.bio).toBe('Updated bio — specialist in colour corrections');
  });

  test('PUT /api/stylists/:id — rejected for customer (403)', async () => {
    const res = await request(app)
      .put(`/api/stylists/${stylistId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. PORTFOLIO CRUD (Cloudinary mocked)
// ══════════════════════════════════════════════════════════════════════════════
describe('6 · Portfolio CRUD', () => {
  test('POST /api/portfolio — vendor creates item with mocked image (201)', async () => {
    // Send JSON so express.json() populates req.body; the cloudinary mock injects req.files
    const res = await request(app)
      .post('/api/portfolio')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        title: 'Balayage Transformation',
        category: 'Hair',
        description: 'Beautiful balayage on dark base',
        tags: 'balayage,colour,transformation',
        isPublic: 'true',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Balayage Transformation');
    expect(res.body.data.images.length).toBe(1);
    portfolioId = res.body.data._id;
  });

  test('GET /api/portfolio/salon/:salonId — public list (200)', async () => {
    const res = await request(app).get(`/api/portfolio/salon/${salonId}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0]._id).toBe(portfolioId);
  });

  test('GET /api/portfolio/my — vendor sees all including drafts (200)', async () => {
    const res = await request(app)
      .get('/api/portfolio/my')
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  test('GET /api/portfolio/my — rejected for customer (403)', async () => {
    const res = await request(app)
      .get('/api/portfolio/my')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  test('GET /api/portfolio/:id — public item (200)', async () => {
    const res = await request(app).get(`/api/portfolio/${portfolioId}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(portfolioId);
  });

  test('GET /api/portfolio/:id — 404 for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/portfolio/${fakeId}`);
    expect(res.status).toBe(404);
  });

  test('PUT /api/portfolio/:id — vendor updates text fields (200)', async () => {
    const res = await request(app)
      .put(`/api/portfolio/${portfolioId}`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ title: 'Balayage Transformation — Updated', description: 'New description' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Balayage Transformation — Updated');
  });

  test('PUT /api/portfolio/:id — rejected for customer (403)', async () => {
    const res = await request(app)
      .put(`/api/portfolio/${portfolioId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. APPOINTMENT — CUSTOMER ↔ VENDOR INTEGRATION
// ══════════════════════════════════════════════════════════════════════════════
describe('7 · Appointment: customer books → vendor sees → status flow', () => {
  test('POST /api/appointments — customer books appointment (201)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        salonId, serviceId, stylistId,
        date: futureDate1, timeSlot: '10:00',
        notes: 'Please keep it natural',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('Pending');
    expect(res.body.data.salonId._id).toBe(salonId);
    expect(res.body.data.serviceId._id).toBe(serviceId);
    expect(res.body.data.stylistId._id).toBe(stylistId);
    appointmentId = res.body.data._id;
  });

  test('POST /api/appointments — rejects double-booking same slot (409)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        salonId, serviceId, stylistId,
        date: futureDate1, timeSlot: '10:00',
      });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already booked/i);
  });

  test('POST /api/appointments — rejects past date (400)', async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ salonId, serviceId, stylistId, date: pastDate, timeSlot: '09:00' });
    expect(res.status).toBe(400);
  });

  test('GET /api/appointments/my — customer sees their booking (200)', async () => {
    const res = await request(app)
      .get('/api/appointments/my')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(appointmentId);
    expect(res.body.data[0].status).toBe('Pending');
  });

  // ── INTEGRATION CHECK: vendor's view of the same booking ──────────────────
  test('[INTEGRATION] GET /api/appointments/vendor-salon — VENDOR sees the customer booking (200)', async () => {
    const res = await request(app)
      .get('/api/appointments/vendor-salon')
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const found = res.body.data.find(a => a._id === appointmentId);
    expect(found).toBeDefined();
    expect(found.status).toBe('Pending');
    expect(found.userId.email).toBe('customer@test.com'); // customer info populated
  });

  test('GET /api/appointments/:id — vendor gets detail view (200)', async () => {
    const res = await request(app)
      .get(`/api/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.userId.email).toBe('customer@test.com');
    expect(res.body.data.serviceId.name).toBe('Classic Haircut');
  });

  test('GET /api/appointments/:id — rejected for customer (403)', async () => {
    const res = await request(app)
      .get(`/api/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  test('PUT /:id/status — vendor confirms appointment (Pending → Confirmed)', async () => {
    const res = await request(app)
      .put(`/api/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ status: 'Confirmed' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Confirmed');
  });

  // ── INTEGRATION CHECK: customer now sees Confirmed ─────────────────────────
  test('[INTEGRATION] GET /my — customer sees the Confirmed status (200)', async () => {
    const res = await request(app)
      .get('/api/appointments/my')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    const appt = res.body.data.find(a => a._id === appointmentId);
    expect(appt.status).toBe('Confirmed');
  });

  test('PUT /:id/status — vendor marks appointment Completed (Confirmed → Completed)', async () => {
    const res = await request(app)
      .put(`/api/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ status: 'Completed' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Completed');
  });

  // ── INTEGRATION CHECK: customer now sees Completed ─────────────────────────
  test('[INTEGRATION] GET /my — customer sees the Completed status (200)', async () => {
    const res = await request(app)
      .get('/api/appointments/my')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    const appt = res.body.data.find(a => a._id === appointmentId);
    expect(appt.status).toBe('Completed');
  });

  test('PUT /:id/status — rejects invalid transition (Completed → Pending) (400)', async () => {
    const res = await request(app)
      .put(`/api/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Pending' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot transition/i);
  });

  test('PUT /:id/status — vendor cannot set status=Cancelled (400)', async () => {
    // Need a fresh Pending appointment for this check
    const newAppt = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ salonId, serviceId, stylistId, date: futureDate1, timeSlot: '14:00' });
    const newId = newAppt.body.data._id;

    const res = await request(app)
      .put(`/api/appointments/${newId}/status`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ status: 'Cancelled' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/confirm or complete/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. CANCEL FLOW
// ══════════════════════════════════════════════════════════════════════════════
describe('8 · Cancel flow', () => {
  test('POST /api/appointments — customer books second appointment (201)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        salonId, serviceId, stylistId,
        date: futureDate2, timeSlot: '11:00',
        notes: 'Will cancel this one',
      });
    expect(res.status).toBe(201);
    cancelApptId = res.body.data._id;
  });

  test('PUT /:id/cancel — customer cancels (200)', async () => {
    const res = await request(app)
      .put(`/api/appointments/${cancelApptId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Cancelled');
  });

  // ── INTEGRATION CHECK: vendor also sees Cancelled ──────────────────────────
  test('[INTEGRATION] vendor-salon — vendor sees the Cancelled appointment (200)', async () => {
    const res = await request(app)
      .get('/api/appointments/vendor-salon')
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    const found = res.body.data.find(a => a._id === cancelApptId);
    expect(found).toBeDefined();
    expect(found.status).toBe('Cancelled');
  });

  test('PUT /:id/cancel — cannot cancel a Cancelled appointment (400)', async () => {
    const res = await request(app)
      .put(`/api/appointments/${cancelApptId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot cancel/i);
  });

  test('PUT /:id/cancel — cannot cancel someone else\'s appointment (403)', async () => {
    // vendorToken tries to cancel customer's appointment via cancel endpoint
    const res = await request(app)
      .put(`/api/appointments/${cancelApptId}/cancel`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. REVIEWS
// ══════════════════════════════════════════════════════════════════════════════
describe('9 · Reviews', () => {
  test('POST /api/reviews — blocked without completed appointment (403)', async () => {
    // Use a salonId the customer has never visited (random ObjectId)
    const fakeSalonId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ salonId: fakeSalonId, rating: 5, comment: 'Great!' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/completed appointment/i);
  });

  test('POST /api/reviews — customer reviews salon with completed appointment (201)', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ salonId, rating: 5, comment: 'Absolutely loved the service!' });
    expect(res.status).toBe(201);
    expect(res.body.data.rating).toBe(5);
    reviewId = res.body.data._id;
  });

  test('POST /api/reviews — duplicate review rejected (400)', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ salonId, rating: 4, comment: 'Second review attempt' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already reviewed/i);
  });

  test('GET /api/reviews/salon/:salonId — public list includes review (200)', async () => {
    const res = await request(app).get(`/api/reviews/salon/${salonId}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0]._id).toBe(reviewId);
    expect(res.body.data[0].rating).toBe(5);
  });

  test('GET /api/reviews/my/:salonId — customer gets their own review (200)', async () => {
    const res = await request(app)
      .get(`/api/reviews/my/${salonId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(reviewId);
  });

  test('GET /api/salons/:id — salon avgRating updated to 5 after review (200)', async () => {
    const res = await request(app).get(`/api/salons/${salonId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.avgRating).toBe(5);
  });

  test('POST /api/reviews — rejected for vendor (not a customer use case)', async () => {
    // Vendor has no completed appointment so they also get 403
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({ salonId, rating: 5, comment: 'Self-review attempt' });
    expect(res.status).toBe(403);
  });

  test('DELETE /api/reviews/:id — customer deletes own review (200)', async () => {
    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });

  test('GET /api/salons/:id — avgRating reset to 0 after review deleted (200)', async () => {
    const res = await request(app).get(`/api/salons/${salonId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.avgRating).toBe(0);
  });

  test('DELETE /api/reviews/:id — 404 for already-deleted review', async () => {
    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. ADMIN OPERATIONS
// ══════════════════════════════════════════════════════════════════════════════
describe('10 · Admin operations', () => {
  test('GET /api/appointments/admin/all — paginated list of all appointments (200)', async () => {
    const res = await request(app)
      .get('/api/appointments/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(2); // booking + cancel + helper
  });

  test('GET /api/appointments/admin/all — filter by status=Completed (200)', async () => {
    const res = await request(app)
      .get('/api/appointments/admin/all?status=Completed')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every(a => a.status === 'Completed')).toBe(true);
  });

  test('GET /api/appointments/admin/all — rejected for vendor (403)', async () => {
    const res = await request(app)
      .get('/api/appointments/admin/all')
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(403);
  });

  test('GET /api/salons/admin/stats — returns all counters (200)', async () => {
    const res = await request(app)
      .get('/api/salons/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalSalons).toBe(1);
    expect(res.body.data.vendorCount).toBe(1);
    expect(typeof res.body.data.activeBookings).toBe('number');
    expect(typeof res.body.data.totalReviews).toBe('number');
  });

  test('GET /api/users/all — admin verifies admin can delete review (200)', async () => {
    // Re-create a review so we can test admin delete
    const aptRes = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ salonId, rating: 4, comment: 'Great visit' });
    expect(aptRes.status).toBe(201);
    const tempReviewId = aptRes.body.data._id;

    const delRes = await request(app)
      .delete(`/api/reviews/${tempReviewId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(delRes.status).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. PORTFOLIO DELETE
// ══════════════════════════════════════════════════════════════════════════════
describe('11 · Portfolio delete', () => {
  test('DELETE /api/portfolio/:id — vendor deletes item + Cloudinary cleanup (200)', async () => {
    const res = await request(app)
      .delete(`/api/portfolio/${portfolioId}`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });

  test('GET /api/portfolio/salon/:salonId — now empty after delete (200)', async () => {
    const res = await request(app).get(`/api/portfolio/salon/${salonId}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  test('DELETE /api/portfolio/:id — 404 for already-deleted item', async () => {
    const res = await request(app)
      .delete(`/api/portfolio/${portfolioId}`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. STYLIST DELETE
// ══════════════════════════════════════════════════════════════════════════════
describe('12 · Stylist delete', () => {
  test('DELETE /api/stylists/:id — vendor deletes stylist (200)', async () => {
    const res = await request(app)
      .delete(`/api/stylists/${stylistId}`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });

  test('GET /api/stylists/salon/:salonId — now empty (200)', async () => {
    const res = await request(app).get(`/api/stylists/salon/${salonId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. SERVICE DELETE
// ══════════════════════════════════════════════════════════════════════════════
describe('13 · Service delete', () => {
  test('DELETE /api/services/:id — vendor deletes service (200)', async () => {
    const res = await request(app)
      .delete(`/api/services/${serviceId}`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });

  test('GET /api/services/salon/:salonId — now empty (200)', async () => {
    const res = await request(app).get(`/api/services/salon/${salonId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. SALON DELETE (cascade)
// ══════════════════════════════════════════════════════════════════════════════
describe('14 · Salon delete (cascade)', () => {
  test('DELETE /api/salons/:id — vendor deletes salon + all child records (200)', async () => {
    const res = await request(app)
      .delete(`/api/salons/${salonId}`)
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });

  test('GET /api/salons/:id — 404 after deletion', async () => {
    const res = await request(app).get(`/api/salons/${salonId}`);
    expect(res.status).toBe(404);
  });

  test('GET /api/salons — public list no longer contains the salon (200)', async () => {
    const res = await request(app).get('/api/salons');
    expect(res.status).toBe(200);
    expect(res.body.data.every(s => s._id !== salonId)).toBe(true);
  });

  test('GET /api/salons/my — vendor has no salon after deletion (200)', async () => {
    const res = await request(app)
      .get('/api/salons/my')
      .set('Authorization', `Bearer ${vendorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.hasSalon).toBe(false);
    expect(res.body.data).toBeNull();
  });
});
