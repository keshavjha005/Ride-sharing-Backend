const request = require('supertest');
const app = require('../src/app');
const { executeQuery, closePool } = require('../src/config/database');
const { generateAccessToken } = require('../src/utils/jwt');

describe('Sprint 1 & 2 Integration Tests', () => {
  let authToken;
  let testUserId;
  let testVehicleId;
  let testRideId;
  let testBookingId;

  beforeAll(async () => {
    // Create test user
    const testUser = {
      id: 'integration-test-user-123',
      email: `integration-test-${Date.now()}@example.com`,
      phone: '+1234567890',
      password: 'password123',
      firstName: 'Integration',
      lastName: 'Test'
    };

    // Insert test user
    await executeQuery(
      'INSERT INTO users (id, email, phone, password_hash, first_name, last_name, language, currency, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [testUser.id, testUser.email, testUser.phone, 'hashedpassword', testUser.firstName, testUser.lastName, 'en', 'USD', null]
    );

    testUserId = testUser.id;
    authToken = generateAccessToken({ id: testUser.id, email: testUser.email });

    // Create test vehicle data
    await executeQuery(
      'INSERT INTO vehicle_types (id, name, description, is_active) VALUES (?, ?, ?, ?)',
      ['integration-test-type-123', 'Sedan', 'Test sedan vehicle', true]
    );

    await executeQuery(
      'INSERT INTO vehicle_brands (id, name, logo, is_active) VALUES (?, ?, ?, ?)',
      ['integration-test-brand-123', 'Toyota', 'https://example.com/toyota-logo.png', true]
    );

    await executeQuery(
      'INSERT INTO vehicle_models (id, brand_id, name, is_active) VALUES (?, ?, ?, ?)',
      ['integration-test-model-123', 'integration-test-brand-123', 'Camry', true]
    );

    // Create test vehicle
    await executeQuery(
      'INSERT INTO user_vehicle_information (id, user_id, vehicle_type_id, vehicle_brand_id, vehicle_model_id, vehicle_number, vehicle_color, vehicle_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['integration-test-vehicle-123', testUserId, 'integration-test-type-123', 'integration-test-brand-123', 'integration-test-model-123', 'TEST123', 'Red', 2020]
    );

    testVehicleId = 'integration-test-vehicle-123';
  });

  afterAll(async () => {
    // Clean up test data
    if (testBookingId) {
      await executeQuery('DELETE FROM bookings WHERE id = ?', [testBookingId]);
    }
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
    
    // Clean up vehicle data
    await executeQuery('DELETE FROM vehicle_models WHERE id = ?', ['integration-test-model-123']);
    await executeQuery('DELETE FROM vehicle_brands WHERE id = ?', ['integration-test-brand-123']);
    await executeQuery('DELETE FROM vehicle_types WHERE id = ?', ['integration-test-type-123']);
    
    await closePool();
  });

  describe('Sprint 1: Foundation Tests', () => {
    describe('Health Check', () => {
      it('should return basic health status', async () => {
        const response = await request(app)
          .get('/health')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('OK');
        expect(response.body.data.environment).toBeDefined();
        expect(response.body.data.version).toBeDefined();
      });

      it('should return detailed health status', async () => {
        const response = await request(app)
          .get('/health/detailed')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('OK');
        expect(response.body.data.services.database).toBeDefined();
      });
    });

    describe('Authentication', () => {
      it('should register a new user', async () => {
        const userData = {
          email: `new-user-${Date.now()}@example.com`,
          phone: '+1987654321',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          language: 'en',
          currency: 'USD'
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();

        // Clean up
        await executeQuery('DELETE FROM users WHERE email = ?', [userData.email]);
      });

      it('should login user', async () => {
        const loginData = {
          identifier: 'integration-test-user-123',
          password: 'password123'
        };

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.accessToken).toBeDefined();
      });

      it('should get user profile', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.id).toBe(testUserId);
        expect(response.body.data.user.email).toBeDefined();
      });
    });

    describe('Multi-language Support', () => {
      it('should get languages', async () => {
        const response = await request(app)
          .get('/api/languages')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.languages).toBeDefined();
        expect(Array.isArray(response.body.data.languages)).toBe(true);
      });
    });

    describe('Multi-currency Support', () => {
      it('should get currencies', async () => {
        const response = await request(app)
          .get('/api/currencies')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.currencies).toBeDefined();
        expect(Array.isArray(response.body.data.currencies)).toBe(true);
      });
    });
  });

  describe('Sprint 2: Core Ride Management Tests', () => {
    describe('Vehicle Management', () => {
      it('should get vehicle brands', async () => {
        const response = await request(app)
          .get('/api/vehicles/brands')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.brands).toBeDefined();
        expect(Array.isArray(response.body.data.brands)).toBe(true);
      });

      it('should get vehicle types', async () => {
        const response = await request(app)
          .get('/api/vehicles/types')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.types).toBeDefined();
        expect(Array.isArray(response.body.data.types)).toBe(true);
      });

      it('should get user vehicles', async () => {
        const response = await request(app)
          .get('/api/vehicles/user-vehicles')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.vehicles).toBeDefined();
        expect(Array.isArray(response.body.data.vehicles)).toBe(true);
      });
    });

    describe('Location Services', () => {
      it('should search locations', async () => {
        const response = await request(app)
          .get('/api/location/search')
          .query({ query: 'New York' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });

      it('should calculate distance', async () => {
        const response = await request(app)
          .get('/api/location/distance')
          .query({
            origin: 'New York, NY',
            destination: 'Boston, MA'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });
    });

    describe('Ride Management', () => {
      it('should create a ride', async () => {
        const rideData = {
          vehicleInformationId: testVehicleId,
          totalSeats: 4,
          pricePerSeat: 25.00,
          luggageAllowed: true,
          womenOnly: false,
          driverVerified: true,
          twoPassengerMaxBack: false,
          departureDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          pickupLocation: {
            address: '123 Main St, New York, NY',
            latitude: 40.7128,
            longitude: -74.0060
          },
          dropLocation: {
            address: '456 Oak Ave, Boston, MA',
            latitude: 42.3601,
            longitude: -71.0589
          },
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
        expect(response.body.data.ride).toBeDefined();
        testRideId = response.body.data.ride.id;
      });

      it('should get ride details', async () => {
        const response = await request(app)
          .get(`/api/rides/${testRideId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.ride.id).toBe(testRideId);
      });

      it('should publish ride', async () => {
        const response = await request(app)
          .post(`/api/rides/${testRideId}/publish`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.ride.status).toBe('published');
      });

      it('should get user rides', async () => {
        const response = await request(app)
          .get('/api/rides/my-rides')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.rides).toBeDefined();
        expect(Array.isArray(response.body.data.rides)).toBe(true);
      });
    });

    describe('Search and Filtering', () => {
      it('should search rides', async () => {
        const response = await request(app)
          .get('/api/rides/search')
          .query({
            pickupLocation: 'New York',
            dropLocation: 'Boston',
            departureDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            passengers: 2
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.rides).toBeDefined();
        expect(Array.isArray(response.body.data.rides)).toBe(true);
      });

      it('should filter rides', async () => {
        const response = await request(app)
          .get('/api/rides/filter')
          .query({
            status: 'published',
            maxPrice: 50
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.rides).toBeDefined();
        expect(Array.isArray(response.body.data.rides)).toBe(true);
      });
    });

    describe('Booking System', () => {
      it('should create a booking', async () => {
        const bookingData = {
          rideId: testRideId,
          bookedSeats: 2,
          paymentType: 'wallet'
        };

        const response = await request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${authToken}`)
          .send(bookingData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.booking).toBeDefined();
        testBookingId = response.body.data.booking.id;
      });

      it('should get booking details', async () => {
        const response = await request(app)
          .get(`/api/bookings/${testBookingId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.booking.id).toBe(testBookingId);
      });

      it('should get user bookings', async () => {
        const response = await request(app)
          .get('/api/bookings/my-bookings')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.bookings).toBeDefined();
        expect(Array.isArray(response.body.data.bookings)).toBe(true);
      });

      it('should confirm booking', async () => {
        const response = await request(app)
          .post(`/api/bookings/${testBookingId}/confirm`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.booking.status).toBe('confirmed');
      });
    });

    describe('Ride Status Management', () => {
      it('should update ride status', async () => {
        const response = await request(app)
          .put(`/api/rides/${testRideId}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status: 'in_progress' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.ride.status).toBe('in_progress');
      });

      it('should complete ride', async () => {
        const response = await request(app)
          .post(`/api/rides/${testRideId}/complete`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.ride.status).toBe('completed');
      });

      it('should get ride statistics', async () => {
        const response = await request(app)
          .get(`/api/rides/${testRideId}/statistics`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.statistics).toBeDefined();
        expect(response.body.data.statistics.totalBookings).toBeDefined();
        expect(response.body.data.statistics.totalRevenue).toBeDefined();
      });

      it('should get user ride statistics', async () => {
        const response = await request(app)
          .get('/api/rides/my-statistics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.statistics).toBeDefined();
        expect(response.body.data.statistics.totalRides).toBeDefined();
        expect(response.body.data.statistics.completedRides).toBeDefined();
      });
    });
  });

  describe('API Documentation', () => {
    it('should serve Swagger documentation', async () => {
      const response = await request(app)
        .get('/api-docs')
        .expect(200);

      expect(response.text).toContain('swagger');
      expect(response.text).toContain('Mate Backend API');
    });
  });
}); 