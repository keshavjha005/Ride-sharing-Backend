const request = require('supertest');
const app = require('../src/app');
const { executeQuery, closePool } = require('../src/config/database');
const { generateAccessToken } = require('../src/utils/jwt');

describe('Ride Management API', () => {
  let authToken;
  let testUserId;
  let testVehicleId;
  let testRideId;

  beforeAll(async () => {
    // Create a test user and get authentication token
    const testUser = {
      id: 'test-user-123',
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'password123'
    };

    // Insert test user directly into database
    await executeQuery(
      'INSERT INTO users (id, first_name, last_name, email, password_hash, is_deleted) VALUES (?, ?, ?, ?, ?, ?)',
      [testUser.id, 'Test', 'User', testUser.email, 'hashedpassword', null]
    );

    testUserId = testUser.id;
    authToken = generateAccessToken({ id: testUser.id, email: testUser.email });

    // Create test vehicle
    const vehicleData = {
      id: 'test-vehicle-123',
      user_id: testUserId,
      vehicle_type_id: 'test-type-123',
      vehicle_brand_id: 'test-brand-123',
      vehicle_model_id: 'test-model-123',
      vehicle_number: 'TEST123',
      vehicle_color: 'Red',
      vehicle_year: 2020
    };

    await executeQuery(
      'INSERT INTO user_vehicle_information (id, user_id, vehicle_type_id, vehicle_brand_id, vehicle_model_id, vehicle_number, vehicle_color, vehicle_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [vehicleData.id, vehicleData.user_id, vehicleData.vehicle_type_id, vehicleData.vehicle_brand_id, vehicleData.vehicle_model_id, vehicleData.vehicle_number, vehicleData.vehicle_color, vehicleData.vehicle_year]
    );

    testVehicleId = vehicleData.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testRideId) {
      await executeQuery('DELETE FROM ride_travel_preferences WHERE ride_id = ?', [testRideId]);
      await executeQuery('DELETE FROM ride_locations WHERE ride_id = ?', [testRideId]);
      await executeQuery('DELETE FROM rides WHERE id = ?', [testRideId]);
    }
    if (testVehicleId) {
      await executeQuery('DELETE FROM user_vehicle_information WHERE id = ?', [testVehicleId]);
    }
    if (testUserId) {
      await executeQuery('DELETE FROM users WHERE id = ?', [testUserId]);
    }
    await closePool();
  });

  describe('POST /api/rides', () => {
    it('should create a new ride successfully', async () => {
      const rideData = {
        vehicleInformationId: testVehicleId,
        totalSeats: 4,
        pricePerSeat: 25.00,
        luggageAllowed: true,
        womenOnly: false,
        driverVerified: true,
        twoPassengerMaxBack: false,
        departureDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        pickupLocation: {
          address: '123 Main St, New York, NY',
          latitude: 40.7128,
          longitude: -74.0060
        },
        dropLocation: {
          address: '456 Oak Ave, New York, NY',
          latitude: 40.7589,
          longitude: -73.9851
        },
        stopOvers: [
          {
            address: '789 Pine St, New York, NY',
            latitude: 40.7505,
            longitude: -73.9934,
            sequenceOrder: 1
          }
        ],
        travelPreferences: {
          chattiness: 'chatty_when_comfortable',
          smoking: 'no_smoking',
          music: 'playlist_important'
        }
      };

      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rideData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Ride created successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.created_by).toBe(testUserId);
      expect(response.body.data.vehicle_information_id).toBe(testVehicleId);
      expect(response.body.data.total_seats).toBe(4);
      expect(response.body.data.price_per_seat).toBe(25.00);
      expect(response.body.data.status).toBe('draft');
      expect(response.body.data.is_published).toBe(false);
      expect(response.body.data.locations).toBeDefined();
      expect(response.body.data.locations.length).toBe(3); // pickup, stopover, drop
      expect(response.body.data.travelPreferences).toBeDefined();

      testRideId = response.body.data.id;
    });

    it('should return 400 for invalid vehicle information ID', async () => {
      const rideData = {
        vehicleInformationId: 'invalid-uuid',
        totalSeats: 4,
        pricePerSeat: 25.00,
        departureDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        pickupLocation: {
          address: '123 Main St, New York, NY',
          latitude: 40.7128,
          longitude: -74.0060
        },
        dropLocation: {
          address: '456 Oak Ave, New York, NY',
          latitude: 40.7589,
          longitude: -73.9851
        }
      };

      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rideData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for past departure date', async () => {
      const rideData = {
        vehicleInformationId: testVehicleId,
        totalSeats: 4,
        pricePerSeat: 25.00,
        departureDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        pickupLocation: {
          address: '123 Main St, New York, NY',
          latitude: 40.7128,
          longitude: -74.0060
        },
        dropLocation: {
          address: '456 Oak Ave, New York, NY',
          latitude: 40.7589,
          longitude: -73.9851
        }
      };

      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rideData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Departure date must be in the future');
    });

    it('should return 401 without authentication', async () => {
      const rideData = {
        vehicleInformationId: testVehicleId,
        totalSeats: 4,
        pricePerSeat: 25.00,
        departureDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        pickupLocation: {
          address: '123 Main St, New York, NY',
          latitude: 40.7128,
          longitude: -74.0060
        },
        dropLocation: {
          address: '456 Oak Ave, New York, NY',
          latitude: 40.7589,
          longitude: -73.9851
        }
      };

      await request(app)
        .post('/api/rides')
        .send(rideData)
        .expect(401);
    });
  });

  describe('GET /api/rides/:id', () => {
    it('should get ride details by ID', async () => {
      const response = await request(app)
        .get(`/api/rides/${testRideId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Ride details retrieved successfully');
      expect(response.body.data.id).toBe(testRideId);
      expect(response.body.data.locations).toBeDefined();
      expect(response.body.data.travelPreferences).toBeDefined();
    });

    it('should return 404 for non-existent ride', async () => {
      const response = await request(app)
        .get('/api/rides/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Ride not found');
    });
  });

  describe('PUT /api/rides/:id', () => {
    it('should update ride successfully', async () => {
      const updateData = {
        totalSeats: 6,
        pricePerSeat: 30.00,
        departureDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        pickupLocation: {
          address: 'Updated Pickup Address',
          latitude: 40.7200,
          longitude: -74.0100
        },
        dropLocation: {
          address: 'Updated Drop Address',
          latitude: 40.7600,
          longitude: -73.9800
        }
      };

      const response = await request(app)
        .put(`/api/rides/${testRideId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Ride updated successfully');
      expect(response.body.data.total_seats).toBe(6);
      expect(response.body.data.price_per_seat).toBe(30.00);
    });

    it('should return 403 for unauthorized user', async () => {
      const otherUserToken = generateToken({ id: 'other-user', email: 'other@example.com' });
      
      const updateData = {
        totalSeats: 6
      };

      const response = await request(app)
        .put(`/api/rides/${testRideId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized');
    });
  });

  describe('POST /api/rides/:id/publish', () => {
    it('should publish ride successfully', async () => {
      const response = await request(app)
        .post(`/api/rides/${testRideId}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Ride published successfully');

      // Verify ride is published
      const rideResponse = await request(app)
        .get(`/api/rides/${testRideId}`)
        .expect(200);

      expect(rideResponse.body.data.status).toBe('published');
      expect(rideResponse.body.data.is_published).toBe(true);
    });
  });

  describe('POST /api/rides/:id/unpublish', () => {
    it('should unpublish ride successfully', async () => {
      const response = await request(app)
        .post(`/api/rides/${testRideId}/unpublish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Ride unpublished successfully');

      // Verify ride is unpublished
      const rideResponse = await request(app)
        .get(`/api/rides/${testRideId}`)
        .expect(200);

      expect(rideResponse.body.data.status).toBe('draft');
      expect(rideResponse.body.data.is_published).toBe(false);
    });
  });

  describe('GET /api/rides/my-rides', () => {
    it('should get user rides successfully', async () => {
      const response = await request(app)
        .get('/api/rides/my-rides')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User rides retrieved successfully');
      expect(response.body.data.rides).toBeDefined();
      expect(Array.isArray(response.body.data.rides)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter rides by status', async () => {
      const response = await request(app)
        .get('/api/rides/my-rides?status=draft')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rides).toBeDefined();
    });
  });

  describe('GET /api/rides/:id/available-seats', () => {
    it('should get available seats successfully', async () => {
      const response = await request(app)
        .get(`/api/rides/${testRideId}/available-seats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Available seats retrieved successfully');
      expect(response.body.data.rideId).toBe(testRideId);
      expect(response.body.data.availableSeats).toBeDefined();
      expect(typeof response.body.data.availableSeats).toBe('number');
    });
  });

  describe('DELETE /api/rides/:id', () => {
    it('should cancel ride successfully', async () => {
      const response = await request(app)
        .delete(`/api/rides/${testRideId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Ride cancelled successfully');

      // Verify ride is cancelled
      const rideResponse = await request(app)
        .get(`/api/rides/${testRideId}`)
        .expect(200);

      expect(rideResponse.body.data.status).toBe('cancelled');
    });
  });
}); 