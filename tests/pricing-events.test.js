const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

describe('Pricing Events API', () => {
  let authToken;
  let testEventId;
  let testVehicleTypeId;

  beforeAll(async () => {
    // Create test user and get auth token
    const testUser = {
      id: uuidv4(),
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User'
    };

    // Insert test user
    await db.execute(
      'INSERT INTO users (id, email, password, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
      [testUser.id, testUser.email, testUser.password, testUser.first_name, testUser.last_name]
    );

    // Create auth token
    authToken = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET || 'test-secret');

    // Get a test vehicle type
    const [vehicleTypes] = await db.execute('SELECT id FROM vehicle_types LIMIT 1');
    testVehicleTypeId = vehicleTypes[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.execute('DELETE FROM pricing_event_applications WHERE pricing_event_id = ?', [testEventId]);
    await db.execute('DELETE FROM pricing_events WHERE id = ?', [testEventId]);
    await db.execute('DELETE FROM users WHERE email = ?', ['test@example.com']);
    await db.end();
  });

  describe('POST /api/pricing/events', () => {
    it('should create a new pricing event', async () => {
      const eventData = {
        event_name: 'Test Event',
        event_type: 'special_event',
        start_date: '2024-12-31T18:00:00Z',
        end_date: '2025-01-01T06:00:00Z',
        pricing_multiplier: 2.0,
        affected_vehicle_types: ['all'],
        affected_areas: ['all'],
        description: 'Test pricing event'
      };

      const response = await request(app)
        .post('/api/pricing/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event_name).toBe(eventData.event_name);
      expect(response.body.data.event_type).toBe(eventData.event_type);
      expect(response.body.data.pricing_multiplier).toBe(eventData.pricing_multiplier);
      expect(response.body.data.is_active).toBe(true);

      testEventId = response.body.data.id;
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/pricing/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate event type', async () => {
      const eventData = {
        event_name: 'Test Event',
        event_type: 'invalid_type',
        start_date: '2024-12-31T18:00:00Z',
        end_date: '2025-01-01T06:00:00Z',
        pricing_multiplier: 2.0,
        affected_vehicle_types: ['all'],
        affected_areas: ['all']
      };

      const response = await request(app)
        .post('/api/pricing/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/pricing/events', () => {
    it('should get all pricing events', async () => {
      const response = await request(app)
        .get('/api/pricing/events')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by active events only', async () => {
      const response = await request(app)
        .get('/api/pricing/events?activeOnly=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by event type', async () => {
      const response = await request(app)
        .get('/api/pricing/events?eventType=special_event')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/pricing/events/:id', () => {
    it('should get a specific pricing event', async () => {
      const response = await request(app)
        .get(`/api/pricing/events/${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testEventId);
      expect(response.body.data.event_name).toBe('Test Event');
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = uuidv4();
      const response = await request(app)
        .get(`/api/pricing/events/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/pricing/events/:id', () => {
    it('should update a pricing event', async () => {
      const updateData = {
        event_name: 'Updated Test Event',
        pricing_multiplier: 2.5
      };

      const response = await request(app)
        .put(`/api/pricing/events/${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.event_name).toBe(updateData.event_name);
      expect(response.body.data.pricing_multiplier).toBe(updateData.pricing_multiplier);
    });

    it('should validate update data', async () => {
      const updateData = {
        pricing_multiplier: 0.5 // Invalid - less than 1.0
      };

      const response = await request(app)
        .put(`/api/pricing/events/${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/pricing/events/active', () => {
    it('should get active pricing events for current date', async () => {
      const response = await request(app)
        .get('/api/pricing/events/active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get active events for specific date', async () => {
      const response = await request(app)
        .get('/api/pricing/events/active?date=2024-12-31T20:00:00Z')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by location and vehicle type', async () => {
      const location = JSON.stringify({ latitude: 40.7128, longitude: -74.0060 });
      const response = await request(app)
        .get(`/api/pricing/events/active?location=${encodeURIComponent(location)}&vehicleTypeName=Sedan`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/pricing/events/analytics', () => {
    it('should get pricing event analytics', async () => {
      const response = await request(app)
        .get('/api/pricing/events/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('event_statistics');
      expect(response.body.data).toHaveProperty('application_statistics');
    });

    it('should get analytics for specific period', async () => {
      const response = await request(app)
        .get('/api/pricing/events/analytics?period=7')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period_days).toBe(7);
    });
  });

  describe('GET /api/pricing/events/applications', () => {
    it('should get pricing event applications', async () => {
      const response = await request(app)
        .get('/api/pricing/events/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter applications by event ID', async () => {
      const response = await request(app)
        .get(`/api/pricing/events/applications?eventId=${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/pricing/events/:id', () => {
    it('should delete a pricing event', async () => {
      const response = await request(app)
        .delete(`/api/pricing/events/${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = uuidv4();
      const response = await request(app)
        .delete(`/api/pricing/events/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Integration with fare calculation', () => {
    it('should apply event pricing to fare calculation', async () => {
      // Create a test event that should apply
      const eventData = {
        event_name: 'Test Integration Event',
        event_type: 'special_event',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        pricing_multiplier: 1.5,
        affected_vehicle_types: ['all'],
        affected_areas: ['all'],
        description: 'Test integration event'
      };

      const createResponse = await request(app)
        .post('/api/pricing/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData)
        .expect(201);

      const eventId = createResponse.body.data.id;

      // Calculate fare with event pricing
      const fareData = {
        distance: 25.5,
        vehicleTypeId: testVehicleTypeId,
        departureTime: new Date().toISOString(),
        pickupLocation: { latitude: 40.7128, longitude: -74.0060 },
        dropoffLocation: { latitude: 40.7589, longitude: -73.9851 },
        tripId: uuidv4()
      };

      const fareResponse = await request(app)
        .post('/api/pricing/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(fareData)
        .expect(200);

      expect(fareResponse.body.success).toBe(true);
      expect(fareResponse.body.data).toHaveProperty('event_pricing');
      expect(fareResponse.body.data.event_pricing).toHaveProperty('applied_events');
      expect(fareResponse.body.data.event_pricing).toHaveProperty('total_events_applied');

      // Clean up test event
      await request(app)
        .delete(`/api/pricing/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });
  });
}); 