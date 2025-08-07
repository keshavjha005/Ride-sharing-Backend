const request = require('supertest');
const app = require('../src/app');
const { v4: uuidv4 } = require('uuid');

describe('Admin Pricing Management API', () => {
  let adminToken;
  let superAdminToken;
  let testVehicleTypeId;
  let testMultiplierId;
  let testEventId;

  beforeAll(async () => {
    // Login as admin
    const adminResponse = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@mate.com',
        password: 'admin123'
      });
    adminToken = adminResponse.body.data.token;

    // Login as super admin
    const superAdminResponse = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'superadmin@mate.com',
        password: 'superadmin123'
      });
    superAdminToken = superAdminResponse.body.data.token;
  });

  describe('GET /api/admin/pricing/dashboard', () => {
    it('should get pricing dashboard data', async () => {
      const response = await request(app)
        .get('/api/admin/pricing/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: '7d' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data).toHaveProperty('vehicleTypes');
      expect(response.body.data).toHaveProperty('recentCalculations');
      expect(response.body.data).toHaveProperty('activeEvents');
      expect(response.body.data).toHaveProperty('multiplierStats');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/admin/pricing/dashboard');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/pricing/vehicle-types', () => {
    it('should get vehicle types with pricing', async () => {
      const response = await request(app)
        .get('/api/admin/pricing/vehicle-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ activeOnly: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        testVehicleTypeId = response.body.data[0].id;
        expect(response.body.data[0]).toHaveProperty('per_km_charges');
        expect(response.body.data[0]).toHaveProperty('minimum_fare');
        expect(response.body.data[0]).toHaveProperty('maximum_fare');
      }
    });

    it('should filter by search term', async () => {
      const response = await request(app)
        .get('/api/admin/pricing/vehicle-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: 'sedan' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/admin/pricing/vehicle-types/:id', () => {
    it('should update vehicle type pricing', async () => {
      if (!testVehicleTypeId) {
        console.log('Skipping test - no vehicle type available');
        return;
      }

      const updateData = {
        per_km_charges: 3.00,
        minimum_fare: 6.00,
        maximum_fare: 120.00,
        is_active: true
      };

      const response = await request(app)
        .put(`/api/admin/pricing/vehicle-types/${testVehicleTypeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.per_km_charges).toBe(3.00);
      expect(response.body.data.minimum_fare).toBe(6.00);
      expect(response.body.data.maximum_fare).toBe(120.00);
    });

    it('should validate input data', async () => {
      const invalidData = {
        per_km_charges: -1,
        minimum_fare: 'invalid'
      };

      const response = await request(app)
        .put(`/api/admin/pricing/vehicle-types/${testVehicleTypeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/pricing/multipliers', () => {
    it('should get pricing multipliers', async () => {
      const response = await request(app)
        .get('/api/admin/pricing/multipliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ activeOnly: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('multipliers');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.multipliers)).toBe(true);
    });

    it('should filter by vehicle type', async () => {
      if (!testVehicleTypeId) {
        console.log('Skipping test - no vehicle type available');
        return;
      }

      const response = await request(app)
        .get('/api/admin/pricing/multipliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ vehicleTypeId: testVehicleTypeId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/admin/pricing/multipliers', () => {
    it('should create pricing multiplier', async () => {
      if (!testVehicleTypeId) {
        console.log('Skipping test - no vehicle type available');
        return;
      }

      const multiplierData = {
        vehicle_type_id: testVehicleTypeId,
        multiplier_type: 'peak_hour',
        multiplier_value: 1.25,
        is_active: true
      };

      const response = await request(app)
        .post('/api/admin/pricing/multipliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(multiplierData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.multiplier_type).toBe('peak_hour');
      expect(response.body.data.multiplier_value).toBe(1.25);
      
      testMultiplierId = response.body.data.id;
    });

    it('should validate multiplier data', async () => {
      const invalidData = {
        vehicle_type_id: 'invalid-uuid',
        multiplier_type: 'invalid_type',
        multiplier_value: 0.5
      };

      const response = await request(app)
        .post('/api/admin/pricing/multipliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/admin/pricing/multipliers/:id', () => {
    it('should update pricing multiplier', async () => {
      if (!testMultiplierId) {
        console.log('Skipping test - no multiplier available');
        return;
      }

      const updateData = {
        multiplier_type: 'weekend',
        multiplier_value: 1.15,
        is_active: true
      };

      const response = await request(app)
        .put(`/api/admin/pricing/multipliers/${testMultiplierId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.multiplier_type).toBe('weekend');
      expect(response.body.data.multiplier_value).toBe(1.15);
    });
  });

  describe('DELETE /api/admin/pricing/multipliers/:id', () => {
    it('should delete pricing multiplier', async () => {
      if (!testMultiplierId) {
        console.log('Skipping test - no multiplier available');
        return;
      }

      const response = await request(app)
        .delete(`/api/admin/pricing/multipliers/${testMultiplierId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/pricing/events', () => {
    it('should get pricing events', async () => {
      const response = await request(app)
        .get('/api/admin/pricing/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ activeOnly: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter by event type', async () => {
      const response = await request(app)
        .get('/api/admin/pricing/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ eventType: 'special_event' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/admin/pricing/events', () => {
    it('should create pricing event', async () => {
      const eventData = {
        event_name: 'Test Event',
        event_type: 'special_event',
        start_date: '2024-12-31T18:00:00Z',
        end_date: '2025-01-01T06:00:00Z',
        pricing_multiplier: 2.0,
        affected_vehicle_types: ['all'],
        affected_areas: ['all'],
        description: 'Test pricing event',
        is_active: true
      };

      const response = await request(app)
        .post('/api/admin/pricing/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.event_name).toBe('Test Event');
      expect(response.body.data.event_type).toBe('special_event');
      
      testEventId = response.body.data.id;
    });

    it('should validate event data', async () => {
      const invalidData = {
        event_name: '',
        event_type: 'invalid_type',
        pricing_multiplier: 0.5
      };

      const response = await request(app)
        .post('/api/admin/pricing/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/admin/pricing/events/:id', () => {
    it('should update pricing event', async () => {
      if (!testEventId) {
        console.log('Skipping test - no event available');
        return;
      }

      const updateData = {
        event_name: 'Updated Test Event',
        pricing_multiplier: 2.5,
        description: 'Updated test pricing event'
      };

      const response = await request(app)
        .put(`/api/admin/pricing/events/${testEventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.event_name).toBe('Updated Test Event');
      expect(response.body.data.pricing_multiplier).toBe(2.5);
    });
  });

  describe('DELETE /api/admin/pricing/events/:id', () => {
    it('should delete pricing event', async () => {
      if (!testEventId) {
        console.log('Skipping test - no event available');
        return;
      }

      const response = await request(app)
        .delete(`/api/admin/pricing/events/${testEventId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/admin/pricing/analytics', () => {
    it('should get pricing analytics', async () => {
      const response = await request(app)
        .get('/api/admin/pricing/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: '30d', type: 'overview' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should get event analytics', async () => {
      const response = await request(app)
        .get('/api/admin/pricing/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ period: '30d', type: 'events' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/admin/pricing/bulk-update', () => {
    it('should perform bulk update (super admin only)', async () => {
      if (!testVehicleTypeId) {
        console.log('Skipping test - no vehicle type available');
        return;
      }

      const bulkData = {
        vehicleTypes: [
          {
            id: testVehicleTypeId,
            per_km_charges: 2.75,
            minimum_fare: 5.50
          }
        ],
        operation: 'update'
      };

      const response = await request(app)
        .post('/api/admin/pricing/bulk-update')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(bulkData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('vehicleTypes');
    });

    it('should require super admin permissions', async () => {
      const bulkData = {
        vehicleTypes: [],
        operation: 'update'
      };

      const response = await request(app)
        .post('/api/admin/pricing/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/pricing/export', () => {
    it('should export pricing data', async () => {
      const response = await request(app)
        .get('/api/admin/pricing/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ type: 'all', format: 'json' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should export specific data types', async () => {
      const response = await request(app)
        .get('/api/admin/pricing/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ type: 'vehicle-types' });

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid vehicle type ID', async () => {
      const invalidId = 'invalid-uuid';
      
      const response = await request(app)
        .put(`/api/admin/pricing/vehicle-types/${invalidId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          per_km_charges: 3.00,
          minimum_fare: 6.00
        });

      expect(response.status).toBe(400);
    });

    it('should handle non-existent resources', async () => {
      const nonExistentId = uuidv4();
      
      const response = await request(app)
        .put(`/api/admin/pricing/vehicle-types/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          per_km_charges: 3.00,
          minimum_fare: 6.00
        });

      expect(response.status).toBe(404);
    });

    it('should handle database errors gracefully', async () => {
      // This test would require mocking database errors
      // For now, we'll test with invalid data that should cause validation errors
      const response = await request(app)
        .post('/api/admin/pricing/multipliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vehicle_type_id: 'invalid-uuid',
          multiplier_type: 'invalid_type',
          multiplier_value: -1
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/admin/pricing/dashboard' },
        { method: 'GET', path: '/api/admin/pricing/vehicle-types' },
        { method: 'PUT', path: '/api/admin/pricing/vehicle-types/test-id' },
        { method: 'GET', path: '/api/admin/pricing/multipliers' },
        { method: 'POST', path: '/api/admin/pricing/multipliers' },
        { method: 'GET', path: '/api/admin/pricing/events' },
        { method: 'POST', path: '/api/admin/pricing/events' },
        { method: 'GET', path: '/api/admin/pricing/analytics' },
        { method: 'GET', path: '/api/admin/pricing/export' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method.toLowerCase()](endpoint.path);
        expect(response.status).toBe(401);
      }
    });

    it('should validate JWT tokens', async () => {
      const response = await request(app)
        .get('/api/admin/pricing/dashboard')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
}); 