const request = require('supertest');
const app = require('../src/app');
const { executeQuery } = require('../src/config/database');
const { generateAccessToken } = require('../src/utils/jwt');

describe('Pricing System API', () => {
  let authToken;
  let testVehicleTypeId;

  beforeAll(async () => {
    // Create a test user and get auth token
    const testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User'
    };
    authToken = generateAccessToken(testUser);

    // Get a vehicle type ID for testing
    const vehicleTypes = await executeQuery('SELECT id FROM vehicle_types LIMIT 1');
    testVehicleTypeId = vehicleTypes[0].id;
  });

  describe('POST /api/pricing/calculate', () => {
    it('should calculate fare for a trip', async () => {
      const tripData = {
        distance: 25.5,
        vehicleTypeId: testVehicleTypeId,
        departureTime: '2024-01-15T10:00:00Z',
        pickupLocation: {
          latitude: 40.7128,
          longitude: -74.0060
        },
        dropoffLocation: {
          latitude: 40.7589,
          longitude: -73.9851
        }
      };

      const response = await request(app)
        .post('/api/pricing/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tripData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('base_fare');
      expect(response.body.data).toHaveProperty('final_fare');
      expect(response.body.data).toHaveProperty('distance_km');
      expect(response.body.data).toHaveProperty('vehicle_type');
      expect(response.body.data).toHaveProperty('applied_multipliers');
      expect(response.body.data).toHaveProperty('calculation_details');
    });

    it('should return 400 for invalid distance', async () => {
      const tripData = {
        distance: -5,
        vehicleTypeId: testVehicleTypeId,
        departureTime: '2024-01-15T10:00:00Z',
        pickupLocation: {
          latitude: 40.7128,
          longitude: -74.0060
        },
        dropoffLocation: {
          latitude: 40.7589,
          longitude: -73.9851
        }
      };

      const response = await request(app)
        .post('/api/pricing/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tripData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid vehicle type ID', async () => {
      const tripData = {
        distance: 25.5,
        vehicleTypeId: 'invalid-uuid',
        departureTime: '2024-01-15T10:00:00Z',
        pickupLocation: {
          latitude: 40.7128,
          longitude: -74.0060
        },
        dropoffLocation: {
          latitude: 40.7589,
          longitude: -73.9851
        }
      };

      const response = await request(app)
        .post('/api/pricing/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tripData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/pricing/vehicle-types', () => {
    it('should get vehicle types with pricing information', async () => {
      const response = await request(app)
        .get('/api/pricing/vehicle-types')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      const vehicleType = response.body.data[0];
      expect(vehicleType).toHaveProperty('id');
      expect(vehicleType).toHaveProperty('name');
      expect(vehicleType).toHaveProperty('per_km_charges');
      expect(vehicleType).toHaveProperty('minimum_fare');
      expect(vehicleType).toHaveProperty('maximum_fare');
      expect(vehicleType).toHaveProperty('multiplier_count');
    });

    it('should filter by activeOnly parameter', async () => {
      const response = await request(app)
        .get('/api/pricing/vehicle-types?activeOnly=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/pricing/vehicle-types/:id', () => {
    it('should get vehicle type with detailed pricing information', async () => {
      const response = await request(app)
        .get(`/api/pricing/vehicle-types/${testVehicleTypeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('per_km_charges');
      expect(response.body.data).toHaveProperty('minimum_fare');
      expect(response.body.data).toHaveProperty('maximum_fare');
      expect(response.body.data).toHaveProperty('multipliers');
      expect(Array.isArray(response.body.data.multipliers)).toBe(true);
    });

    it('should return 404 for non-existent vehicle type', async () => {
      const response = await request(app)
        .get('/api/pricing/vehicle-types/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/pricing/vehicle-types/:id', () => {
    it('should update vehicle type pricing', async () => {
      const updateData = {
        per_km_charges: 3.00,
        minimum_fare: 6.00,
        maximum_fare: 120.00
      };

      const response = await request(app)
        .put(`/api/pricing/vehicle-types/${testVehicleTypeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.per_km_charges).toBe(3.00);
      expect(response.body.data.minimum_fare).toBe(6.00);
      expect(response.body.data.maximum_fare).toBe(120.00);
    });

    it('should return 400 for invalid pricing data', async () => {
      const updateData = {
        per_km_charges: -1
      };

      const response = await request(app)
        .put(`/api/pricing/vehicle-types/${testVehicleTypeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/pricing/multipliers', () => {
    it('should get pricing multipliers', async () => {
      const response = await request(app)
        .get('/api/pricing/multipliers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter multipliers by vehicle type', async () => {
      const response = await request(app)
        .get(`/api/pricing/multipliers?vehicleTypeId=${testVehicleTypeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter multipliers by type', async () => {
      const response = await request(app)
        .get('/api/pricing/multipliers?multiplierType=peak_hour')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/pricing/multipliers', () => {
    it('should create a new pricing multiplier', async () => {
      const multiplierData = {
        vehicle_type_id: testVehicleTypeId,
        multiplier_type: 'peak_hour',
        multiplier_value: 1.30
      };

      const response = await request(app)
        .post('/api/pricing/multipliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(multiplierData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.multiplier_type).toBe('peak_hour');
      expect(response.body.data.multiplier_value).toBe(1.30);
    });

    it('should return 400 for invalid multiplier data', async () => {
      const multiplierData = {
        vehicle_type_id: 'invalid-uuid',
        multiplier_type: 'invalid_type',
        multiplier_value: 0.5
      };

      const response = await request(app)
        .post('/api/pricing/multipliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(multiplierData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/pricing/statistics/:vehicleTypeId', () => {
    it('should get pricing statistics for a vehicle type', async () => {
      const response = await request(app)
        .get(`/api/pricing/statistics/${testVehicleTypeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('vehicle_type');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('multiplier_usage');
    });

    it('should accept period parameter', async () => {
      const response = await request(app)
        .get(`/api/pricing/statistics/${testVehicleTypeId}?period=7`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/pricing/history', () => {
    it('should get pricing calculation history', async () => {
      const response = await request(app)
        .get('/api/pricing/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400); // Should fail without vehicleTypeId or tripId

      expect(response.body.success).toBe(false);
    });

    it('should get pricing history for a vehicle type', async () => {
      const response = await request(app)
        .get(`/api/pricing/history?vehicleTypeId=${testVehicleTypeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
    });
  });



  describe('PricingService.getRecentPricingCalculations', () => {
    it('should get recent pricing calculations without LIMIT parameter error', async () => {
      const PricingService = require('../src/services/pricingService');
      
      // This test specifically checks that the LIMIT parameter issue is fixed
      const result = await PricingService.getRecentPricingCalculations({ limit: 5 });
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('limit');
      expect(result.pagination.limit).toBe(5);
    });

    it('should handle different limit values correctly', async () => {
      const PricingService = require('../src/services/pricingService');
      
      const result = await PricingService.getRecentPricingCalculations({ limit: 10 });
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('limit');
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'POST', path: '/api/pricing/calculate' },
        { method: 'GET', path: '/api/pricing/vehicle-types' },
        { method: 'GET', path: `/api/pricing/vehicle-types/${testVehicleTypeId}` },
        { method: 'PUT', path: `/api/pricing/vehicle-types/${testVehicleTypeId}` },
        { method: 'GET', path: '/api/pricing/multipliers' },
        { method: 'POST', path: '/api/pricing/multipliers' },
        { method: 'GET', path: `/api/pricing/statistics/${testVehicleTypeId}` },
        { method: 'GET', path: '/api/pricing/history' }
      ];

      for (const endpoint of endpoints) {
        const requestBuilder = request(app)[endpoint.method.toLowerCase()](endpoint.path);
        
        if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
          requestBuilder.send({});
        }
        
        await requestBuilder.expect(401);
      }
    });
  });
}); 