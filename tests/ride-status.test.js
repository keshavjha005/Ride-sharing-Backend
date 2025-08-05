const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const RideStatusUpdate = require('../src/models/RideStatusUpdate');
const RideLocationTracking = require('../src/models/RideLocationTracking');
const Ride = require('../src/models/Ride');
const User = require('../src/models/User');
const { generateToken } = require('../src/utils/jwt');

describe('Ride Status Tracking System', () => {
  let testUser, testRide, authToken;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '+1234567890',
      languageCode: 'en',
      currencyCode: 'USD'
    });

    // Create test ride
    testRide = await Ride.create({
      createdBy: testUser.id,
      vehicleInformationId: 'test-vehicle-id',
      totalSeats: 4,
      pricePerSeat: 25.00,
      distance: 50.5,
      estimatedTime: 60,
      departureDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      pickupLocation: {
        address: 'Test Pickup',
        latitude: 40.7128,
        longitude: -74.0060
      },
      dropLocation: {
        address: 'Test Drop',
        latitude: 40.7589,
        longitude: -73.9851
      }
    });

    // Generate auth token
    authToken = generateToken(testUser);
  });

  afterAll(async () => {
    // Clean up test data
    await RideStatusUpdate.deleteOldUpdates(0); // Delete all test status updates
    await RideLocationTracking.deleteOldEntries(0); // Delete all test location entries
    await Ride.delete(testRide.id);
    await User.delete(testUser.id);
    await db.end();
  });

  describe('Ride Status Updates', () => {
    describe('GET /api/rides/:rideId/status', () => {
      it('should get ride status updates', async () => {
        const response = await request(app)
          .get(`/api/rides/${testRide.id}/status`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Ride status updates retrieved successfully');
        expect(response.body.data.rideId).toBe(testRide.id);
        expect(Array.isArray(response.body.data.statusUpdates)).toBe(true);
        expect(response.body.data.pagination).toBeDefined();
      });

      it('should return 404 for non-existent ride', async () => {
        const response = await request(app)
          .get('/api/rides/non-existent-id/status')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Ride not found');
      });
    });

    describe('POST /api/rides/:rideId/status', () => {
      it('should create ride status update', async () => {
        const statusData = {
          status: 'started',
          statusMessageAr: 'بدأت الرحلة',
          statusMessageEn: 'Ride started',
          locationData: {
            latitude: 40.7128,
            longitude: -74.0060,
            address: 'Test Location'
          },
          estimatedArrival: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        };

        const response = await request(app)
          .post(`/api/rides/${testRide.id}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(statusData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Ride status update created successfully');
        expect(response.body.data.rideId).toBe(testRide.id);
        expect(response.body.data.status).toBe('started');
        expect(response.body.data.statusMessageAr).toBe('بدأت الرحلة');
        expect(response.body.data.statusMessageEn).toBe('Ride started');
      });

      it('should return 403 for unauthorized user', async () => {
        const otherUser = await User.create({
          name: 'Other User',
          email: 'other@example.com',
          password: 'password123',
          phone: '+1234567891',
          languageCode: 'en',
          currencyCode: 'USD'
        });

        const otherToken = generateToken(otherUser);

        const statusData = {
          status: 'started',
          statusMessageEn: 'Ride started'
        };

        const response = await request(app)
          .post(`/api/rides/${testRide.id}/status`)
          .set('Authorization', `Bearer ${otherToken}`)
          .send(statusData)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('You do not have permission to update this ride');

        // Clean up
        await User.delete(otherUser.id);
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post(`/api/rides/${testRide.id}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation error');
        expect(response.body.errors).toBeDefined();
      });
    });

    describe('PUT /api/rides/:rideId/estimated-arrival', () => {
      it('should update estimated arrival', async () => {
        const estimatedArrival = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        const response = await request(app)
          .put(`/api/rides/${testRide.id}/estimated-arrival`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ estimatedArrival })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Estimated arrival updated successfully');
        expect(response.body.data.rideId).toBe(testRide.id);
        expect(response.body.data.estimatedArrival).toBe(estimatedArrival);
      });
    });

    describe('PUT /api/rides/:rideId/actual-arrival', () => {
      it('should update actual arrival', async () => {
        const actualArrival = new Date().toISOString();

        const response = await request(app)
          .put(`/api/rides/${testRide.id}/actual-arrival`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ actualArrival })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Actual arrival updated successfully');
        expect(response.body.data.rideId).toBe(testRide.id);
        expect(response.body.data.actualArrival).toBe(actualArrival);
      });
    });
  });

  describe('Ride Location Tracking', () => {
    describe('GET /api/rides/:rideId/location', () => {
      it('should get ride location tracking', async () => {
        const response = await request(app)
          .get(`/api/rides/${testRide.id}/location`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Ride location tracking retrieved successfully');
        expect(response.body.data.rideId).toBe(testRide.id);
        expect(Array.isArray(response.body.data.locations)).toBe(true);
        expect(response.body.data.pagination).toBeDefined();
      });
    });

    describe('POST /api/rides/:rideId/location', () => {
      it('should create location tracking entry', async () => {
        const locationData = {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10.5,
          speed: 45.2,
          heading: 180.0,
          altitude: 100.0
        };

        const response = await request(app)
          .post(`/api/rides/${testRide.id}/location`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(locationData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Ride location tracking entry created successfully');
        expect(response.body.data.rideId).toBe(testRide.id);
        expect(response.body.data.latitude).toBe(40.7128);
        expect(response.body.data.longitude).toBe(-74.0060);
        expect(response.body.data.accuracy).toBe(10.5);
        expect(response.body.data.speed).toBe(45.2);
        expect(response.body.data.heading).toBe(180.0);
        expect(response.body.data.altitude).toBe(100.0);
      });

      it('should validate location coordinates', async () => {
        const invalidLocationData = {
          latitude: 100, // Invalid latitude
          longitude: -74.0060
        };

        const response = await request(app)
          .post(`/api/rides/${testRide.id}/location`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidLocationData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation error');
        expect(response.body.errors).toBeDefined();
      });
    });

    describe('POST /api/rides/:rideId/location/batch', () => {
      it('should create batch location tracking entries', async () => {
        const locationsData = {
          locations: [
            {
              latitude: 40.7128,
              longitude: -74.0060,
              accuracy: 10.5,
              speed: 45.2,
              heading: 180.0,
              altitude: 100.0
            },
            {
              latitude: 40.7130,
              longitude: -74.0058,
              accuracy: 12.0,
              speed: 47.1,
              heading: 182.0,
              altitude: 102.0
            }
          ]
        };

        const response = await request(app)
          .post(`/api/rides/${testRide.id}/location/batch`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(locationsData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Batch location tracking entries created successfully');
        expect(response.body.data.rideId).toBe(testRide.id);
        expect(response.body.data.createdCount).toBe(2);
        expect(Array.isArray(response.body.data.locations)).toBe(true);
        expect(response.body.data.locations).toHaveLength(2);
      });

      it('should validate batch location data', async () => {
        const invalidBatchData = {
          locations: [
            {
              latitude: 100, // Invalid latitude
              longitude: -74.0060
            }
          ]
        };

        const response = await request(app)
          .post(`/api/rides/${testRide.id}/location/batch`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidBatchData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation error');
        expect(response.body.errors).toBeDefined();
      });
    });
  });

  describe('Live Tracking', () => {
    describe('GET /api/rides/:rideId/tracking', () => {
      it('should get live tracking data', async () => {
        const response = await request(app)
          .get(`/api/rides/${testRide.id}/tracking`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Live tracking data retrieved successfully');
        expect(response.body.data.rideId).toBe(testRide.id);
        expect(response.body.data.ride).toBeDefined();
        expect(response.body.data.latestStatus).toBeDefined();
        expect(response.body.data.latestLocation).toBeDefined();
        expect(Array.isArray(response.body.data.locations)).toBe(true);
        expect(response.body.data.statistics).toBeDefined();
      });

      it('should get tracking data with time range', async () => {
        const response = await request(app)
          .get(`/api/rides/${testRide.id}/tracking?timeRange=60`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.rideId).toBe(testRide.id);
      });
    });

    describe('GET /api/rides/:rideId/tracking-statistics', () => {
      it('should get tracking statistics', async () => {
        const response = await request(app)
          .get(`/api/rides/${testRide.id}/tracking-statistics`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Ride tracking statistics retrieved successfully');
        expect(response.body.data.rideId).toBe(testRide.id);
        expect(Array.isArray(response.body.data.statusStatistics)).toBe(true);
        expect(response.body.data.locationStatistics).toBeDefined();
      });
    });
  });

  describe('Model Methods', () => {
    describe('RideStatusUpdate Model', () => {
      it('should create status update', async () => {
        const statusUpdate = await RideStatusUpdate.create({
          rideId: testRide.id,
          status: 'in_progress',
          statusMessageAr: 'الرحلة قيد التنفيذ',
          statusMessageEn: 'Ride in progress'
        });

        expect(statusUpdate.id).toBeDefined();
        expect(statusUpdate.rideId).toBe(testRide.id);
        expect(statusUpdate.status).toBe('in_progress');
        expect(statusUpdate.statusMessageAr).toBe('الرحلة قيد التنفيذ');
        expect(statusUpdate.statusMessageEn).toBe('Ride in progress');
      });

      it('should get status updates by ride ID', async () => {
        const statusUpdates = await RideStatusUpdate.findByRideId(testRide.id);
        expect(Array.isArray(statusUpdates)).toBe(true);
        expect(statusUpdates.length).toBeGreaterThan(0);
      });

      it('should get latest status update', async () => {
        const latestStatus = await RideStatusUpdate.getLatestByRideId(testRide.id);
        expect(latestStatus).toBeDefined();
        expect(latestStatus.rideId).toBe(testRide.id);
      });

      it('should get status updates by status', async () => {
        const statusUpdates = await RideStatusUpdate.findByStatus('in_progress');
        expect(Array.isArray(statusUpdates)).toBe(true);
      });

      it('should get statistics', async () => {
        const statistics = await RideStatusUpdate.getStatistics(testRide.id);
        expect(Array.isArray(statistics)).toBe(true);
      });
    });

    describe('RideLocationTracking Model', () => {
      it('should create location tracking entry', async () => {
        const locationEntry = await RideLocationTracking.create({
          rideId: testRide.id,
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10.5,
          speed: 45.2,
          heading: 180.0,
          altitude: 100.0
        });

        expect(locationEntry.id).toBeDefined();
        expect(locationEntry.rideId).toBe(testRide.id);
        expect(locationEntry.latitude).toBe(40.7128);
        expect(locationEntry.longitude).toBe(-74.0060);
        expect(locationEntry.accuracy).toBe(10.5);
        expect(locationEntry.speed).toBe(45.2);
        expect(locationEntry.heading).toBe(180.0);
        expect(locationEntry.altitude).toBe(100.0);
      });

      it('should get location tracking by ride ID', async () => {
        const locations = await RideLocationTracking.findByRideId(testRide.id);
        expect(Array.isArray(locations)).toBe(true);
        expect(locations.length).toBeGreaterThan(0);
      });

      it('should get latest location', async () => {
        const latestLocation = await RideLocationTracking.getLatestByRideId(testRide.id);
        expect(latestLocation).toBeDefined();
        expect(latestLocation.rideId).toBe(testRide.id);
      });

      it('should get location tracking by time range', async () => {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 60 * 60 * 1000); // 1 hour ago
        const locations = await RideLocationTracking.findByTimeRange(testRide.id, startTime, endTime);
        expect(Array.isArray(locations)).toBe(true);
      });

      it('should get location tracking by speed range', async () => {
        const locations = await RideLocationTracking.findBySpeedRange(testRide.id, 0, 100);
        expect(Array.isArray(locations)).toBe(true);
      });

      it('should calculate distance between points', () => {
        const distance = RideLocationTracking.calculateDistance(40.7128, -74.0060, 40.7589, -73.9851);
        expect(typeof distance).toBe('number');
        expect(distance).toBeGreaterThan(0);
      });

      it('should calculate total distance', async () => {
        const totalDistance = await RideLocationTracking.calculateTotalDistance(testRide.id);
        expect(typeof totalDistance).toBe('number');
        expect(totalDistance).toBeGreaterThanOrEqual(0);
      });

      it('should calculate average speed', async () => {
        const averageSpeed = await RideLocationTracking.calculateAverageSpeed(testRide.id);
        expect(typeof averageSpeed).toBe('number');
        expect(averageSpeed).toBeGreaterThanOrEqual(0);
      });

      it('should get location tracking statistics', async () => {
        const statistics = await RideLocationTracking.getStatistics(testRide.id);
        expect(statistics).toBeDefined();
        expect(statistics.totalPoints).toBeGreaterThanOrEqual(0);
        expect(statistics.averageSpeed).toBeGreaterThanOrEqual(0);
        expect(statistics.totalDistance).toBeGreaterThanOrEqual(0);
      });

      it('should find locations near a point', async () => {
        const locations = await RideLocationTracking.findNearLocation(40.7128, -74.0060, 1);
        expect(Array.isArray(locations)).toBe(true);
      });

      it('should create batch location entries', async () => {
        const locationsData = [
          {
            rideId: testRide.id,
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 10.5,
            speed: 45.2,
            heading: 180.0,
            altitude: 100.0
          },
          {
            rideId: testRide.id,
            latitude: 40.7130,
            longitude: -74.0058,
            accuracy: 12.0,
            speed: 47.1,
            heading: 182.0,
            altitude: 102.0
          }
        ];

        const createdLocations = await RideLocationTracking.createMultiple(locationsData);
        expect(Array.isArray(createdLocations)).toBe(true);
        expect(createdLocations).toHaveLength(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid ride ID format', async () => {
      const response = await request(app)
        .get('/api/rides/invalid-id/status')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should handle missing authentication', async () => {
      const response = await request(app)
        .post(`/api/rides/${testRide.id}/status`)
        .send({ status: 'started' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid token', async () => {
      const response = await request(app)
        .post(`/api/rides/${testRide.id}/status`)
        .set('Authorization', 'Bearer invalid-token')
        .send({ status: 'started' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
}); 