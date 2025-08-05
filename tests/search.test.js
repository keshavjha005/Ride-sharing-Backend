const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const { generateToken } = require('../src/utils/jwt');

describe('Search and Filtering API', () => {
  let authToken;
  let testUserId;
  let testRideId;

  beforeAll(async () => {
    // Create test user and get auth token
    const testUser = {
      id: 'test-user-search-123',
      name: 'Test User Search',
      email: 'testsearch@example.com',
      password: 'password123'
    };

    // Insert test user
    await db.execute(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [testUser.id, testUser.name, testUser.email, 'hashedpassword']
    );

    testUserId = testUser.id;
    authToken = generateToken(testUser);

    // Create test vehicle
    await db.execute(`
      INSERT INTO vehicle_types (id, name, description) 
      VALUES ('test-type-123', 'Sedan', 'Test vehicle type')
    `);

    await db.execute(`
      INSERT INTO vehicle_brands (id, name) 
      VALUES ('test-brand-123', 'Toyota')
    `);

    await db.execute(`
      INSERT INTO vehicle_models (id, brand_id, name) 
      VALUES ('test-model-123', 'test-brand-123', 'Camry')
    `);

    await db.execute(`
      INSERT INTO user_vehicle_information (id, user_id, vehicle_type_id, vehicle_brand_id, vehicle_model_id, vehicle_number, vehicle_color, vehicle_year)
      VALUES ('test-vehicle-123', ?, 'test-type-123', 'test-brand-123', 'test-model-123', 'ABC123', 'Red', 2020)
    `, [testUserId]);

    // Create test ride
    const rideData = {
      id: 'test-ride-search-123',
      createdBy: testUserId,
      vehicleInformationId: 'test-vehicle-123',
      totalSeats: 4,
      pricePerSeat: 25.00,
      distance: 100.5,
      estimatedTime: 120,
      departureDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: 'published',
      isPublished: true
    };

    await db.execute(`
      INSERT INTO rides (id, created_by, vehicle_information_id, total_seats, booked_seats, price_per_seat, distance, estimated_time, departure_datetime, status, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      rideData.id, rideData.createdBy, rideData.vehicleInformationId,
      rideData.totalSeats, 0, rideData.pricePerSeat, rideData.distance,
      rideData.estimatedTime, rideData.departureDateTime, rideData.status, rideData.isPublished
    ]);

    testRideId = rideData.id;

    // Create test ride locations
    await db.execute(`
      INSERT INTO ride_locations (id, ride_id, location_type, address, latitude, longitude, sequence_order)
      VALUES 
        ('test-location-1', ?, 'pickup', 'New York, NY', 40.7128, -74.0060, 0),
        ('test-location-2', ?, 'drop', 'Boston, MA', 42.3601, -71.0589, 1)
    `, [testRideId, testRideId]);
  });

  afterAll(async () => {
    // Clean up test data
    await db.execute('DELETE FROM ride_locations WHERE ride_id = ?', [testRideId]);
    await db.execute('DELETE FROM rides WHERE id = ?', [testRideId]);
    await db.execute('DELETE FROM user_vehicle_information WHERE id = ?', ['test-vehicle-123']);
    await db.execute('DELETE FROM vehicle_models WHERE id = ?', ['test-model-123']);
    await db.execute('DELETE FROM vehicle_brands WHERE id = ?', ['test-brand-123']);
    await db.execute('DELETE FROM vehicle_types WHERE id = ?', ['test-type-123']);
    await db.execute('DELETE FROM user_search_history WHERE user_id = ?', [testUserId]);
    await db.execute('DELETE FROM users WHERE id = ?', [testUserId]);
    await db.end();
  });

  describe('GET /api/rides/search', () => {
    it('should search rides with basic parameters', async () => {
      const response = await request(app)
        .get('/api/rides/search')
        .query({
          pickupLocation: 'New York',
          dropLocation: 'Boston',
          passengers: 2,
          maxPrice: 50
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Rides found successfully');
      expect(response.body.data).toHaveProperty('rides');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data).toHaveProperty('filters');
      expect(Array.isArray(response.body.data.rides)).toBe(true);
    });

    it('should search rides with all filters', async () => {
      const response = await request(app)
        .get('/api/rides/search')
        .query({
          pickupLocation: 'New York',
          dropLocation: 'Boston',
          departureDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          passengers: 2,
          maxPrice: 50,
          womenOnly: false,
          driverVerified: true,
          sortBy: 'price',
          sortOrder: 'asc',
          page: 1,
          limit: 10
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters).toMatchObject({
        pickupLocation: 'New York',
        dropLocation: 'Boston',
        passengers: 2,
        maxPrice: 50,
        womenOnly: false,
        driverVerified: true
      });
    });

    it('should validate sort parameters', async () => {
      const response = await request(app)
        .get('/api/rides/search')
        .query({
          sortBy: 'invalid_field',
          sortOrder: 'invalid_order'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid sort field');
    });

    it('should handle empty search results', async () => {
      const response = await request(app)
        .get('/api/rides/search')
        .query({
          pickupLocation: 'Non-existent City',
          dropLocation: 'Another Non-existent City'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rides).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });

  describe('GET /api/rides/filter', () => {
    it('should filter rides with price range', async () => {
      const response = await request(app)
        .get('/api/rides/filter')
        .query({
          priceMin: 20,
          priceMax: 30,
          sortBy: 'price',
          sortOrder: 'asc'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Rides filtered successfully');
      expect(response.body.data).toHaveProperty('rides');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data).toHaveProperty('filters');
    });

    it('should filter rides with date range', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .get('/api/rides/filter')
        .query({
          dateFrom: tomorrow.toISOString(),
          dateTo: nextWeek.toISOString(),
          sortBy: 'departure_time',
          sortOrder: 'asc'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters).toMatchObject({
        dateFrom: tomorrow.toISOString(),
        dateTo: nextWeek.toISOString()
      });
    });

    it('should filter rides with vehicle information', async () => {
      const response = await request(app)
        .get('/api/rides/filter')
        .query({
          vehicleType: 'Sedan',
          vehicleBrand: 'Toyota',
          sortBy: 'created_at',
          sortOrder: 'desc'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.filters).toMatchObject({
        vehicleType: 'Sedan',
        vehicleBrand: 'Toyota'
      });
    });

    it('should validate filter parameters', async () => {
      const response = await request(app)
        .get('/api/rides/filter')
        .query({
          priceMin: -10, // Invalid negative price
          sortBy: 'invalid_field'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/search/history', () => {
    it('should get user search history when authenticated', async () => {
      const response = await request(app)
        .get('/api/search/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Search history retrieved successfully');
      expect(response.body.data).toHaveProperty('history');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.history)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/search/history')
        .expect(401);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/search/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 0, limit: 200 }) // Invalid values
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/search/history', () => {
    it('should save search to history', async () => {
      const searchData = {
        pickupLocation: 'New York, NY',
        dropLocation: 'Boston, MA'
      };

      const response = await request(app)
        .post('/api/search/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send(searchData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Search saved to history successfully');
      expect(response.body.data).toHaveProperty('searchId');
    });

    it('should require at least one location', async () => {
      const response = await request(app)
        .post('/api/search/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('At least one location');
    });

    it('should validate location data', async () => {
      const response = await request(app)
        .post('/api/search/history')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          pickupLocation: 'a'.repeat(600) // Too long
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/search/history')
        .send({ pickupLocation: 'New York' })
        .expect(401);
    });
  });

  describe('DELETE /api/search/history/:id', () => {
    let searchHistoryId;

    beforeEach(async () => {
      // Create a test search history item
      const [result] = await db.execute(`
        INSERT INTO user_search_history (id, user_id, pickup_location, drop_location)
        VALUES (?, ?, ?, ?)
      `, ['test-search-123', testUserId, 'Test Pickup', 'Test Drop']);

      searchHistoryId = 'test-search-123';
    });

    afterEach(async () => {
      // Clean up test search history
      await db.execute('DELETE FROM user_search_history WHERE id = ?', [searchHistoryId]);
    });

    it('should delete search history item', async () => {
      const response = await request(app)
        .delete(`/api/search/history/${searchHistoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Search history item deleted successfully');
    });

    it('should require authentication', async () => {
      await request(app)
        .delete(`/api/search/history/${searchHistoryId}`)
        .expect(401);
    });

    it('should return 404 for non-existent item', async () => {
      await request(app)
        .delete('/api/search/history/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should validate UUID format', async () => {
      await request(app)
        .delete('/api/search/history/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/search/suggestions', () => {
    it('should get location suggestions', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({
          query: 'New York',
          type: 'location'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Search suggestions retrieved successfully');
      expect(response.body.data).toHaveProperty('suggestions');
      expect(response.body.data).toHaveProperty('query');
      expect(response.body.data).toHaveProperty('type');
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
    });

    it('should get popular search suggestions', async () => {
      // First, create some search history
      await db.execute(`
        INSERT INTO user_search_history (id, user_id, pickup_location, drop_location)
        VALUES 
          ('suggestion-1', ?, 'New York', 'Boston'),
          ('suggestion-2', ?, 'New York', 'Philadelphia'),
          ('suggestion-3', ?, 'New York', 'Washington DC')
      `, [testUserId, testUserId, testUserId]);

      const response = await request(app)
        .get('/api/search/suggestions')
        .query({
          query: 'New York',
          type: 'popular'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('popular');
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);

      // Clean up
      await db.execute('DELETE FROM user_search_history WHERE id IN (?, ?, ?)', 
        ['suggestion-1', 'suggestion-2', 'suggestion-3']);
    });

    it('should validate query parameter', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({ query: 'a' }) // Too short
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate type parameter', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({
          query: 'New York',
          type: 'invalid_type'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require query parameter', async () => {
      await request(app)
        .get('/api/search/suggestions')
        .expect(400);
    });
  });

  describe('Integration Tests', () => {
    it('should save search history when searching rides', async () => {
      // First, search for rides
      await request(app)
        .get('/api/rides/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          pickupLocation: 'Integration Test Pickup',
          dropLocation: 'Integration Test Drop'
        })
        .expect(200);

      // Then check if search was saved to history
      const historyResponse = await request(app)
        .get('/api/search/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const savedSearch = historyResponse.body.data.history.find(
        search => search.pickupLocation === 'Integration Test Pickup' && 
                 search.dropLocation === 'Integration Test Drop'
      );

      expect(savedSearch).toBeDefined();
    });

    it('should provide consistent pagination', async () => {
      const response1 = await request(app)
        .get('/api/rides/search')
        .query({ page: 1, limit: 5 })
        .expect(200);

      const response2 = await request(app)
        .get('/api/rides/search')
        .query({ page: 2, limit: 5 })
        .expect(200);

      expect(response1.body.data.pagination.page).toBe(1);
      expect(response2.body.data.pagination.page).toBe(2);
      expect(response1.body.data.pagination.limit).toBe(5);
      expect(response2.body.data.pagination.limit).toBe(5);
    });
  });
}); 