const request = require('supertest');
const app = require('../src/app');
const { executeQuery, closePool } = require('../src/config/database');
const { v4: uuidv4 } = require('uuid');

describe('Booking System API', () => {
  let authToken;
  let testUserId;
  let testRideId;
  let testBookingId;
  let testPickupLocationId;
  let testDropLocationId;

  beforeAll(async () => {
    // Create test user and get auth token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        first_name: 'Test',
        last_name: 'User',
        email: 'testuser@example.com',
        password: 'Password123!',
        phone: '+1234567890'
      });

    testUserId = userResponse.body.data.user.id;
    authToken = userResponse.body.data.token;

    // Create test ride
    const rideResponse = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        vehicleInformationId: 'test-vehicle-id',
        totalSeats: 4,
        pricePerSeat: 25.00,
        departureDateTime: '2024-12-25T10:00:00Z',
        pickupLocation: {
          address: '123 Test St',
          latitude: 40.7128,
          longitude: -74.0060
        },
        dropLocation: {
          address: '456 Test Ave',
          latitude: 40.7589,
          longitude: -73.9851
        }
      });

    testRideId = rideResponse.body.data.ride.id;
    
    // Get location IDs from the created ride
    const rideDetails = await request(app)
      .get(`/api/rides/${testRideId}`)
      .set('Authorization', `Bearer ${authToken}`);

    testPickupLocationId = rideDetails.body.data.ride.pickupLocation.id;
    testDropLocationId = rideDetails.body.data.ride.dropLocation.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testBookingId) {
      await executeQuery('DELETE FROM bookings WHERE id = ?', [testBookingId]);
    }
    if (testRideId) {
      await executeQuery('DELETE FROM rides WHERE id = ?', [testRideId]);
    }
    if (testUserId) {
      await executeQuery('DELETE FROM users WHERE id = ?', [testUserId]);
    }
    await closePool();
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking successfully', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rideId: testRideId,
          bookedSeats: 2,
          pickupLocationId: testPickupLocationId,
          dropLocationId: testDropLocationId,
          paymentType: 'wallet'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking created successfully');
      expect(response.body.data.booking).toBeDefined();
      expect(response.body.data.booking.ride_id).toBe(testRideId);
      expect(response.body.data.booking.user_id).toBe(testUserId);
      expect(response.body.data.booking.booked_seats).toBe(2);
      expect(response.body.data.booking.status).toBe('pending');
      expect(response.body.data.booking.payment_status).toBe('pending');

      testBookingId = response.body.data.booking.id;
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate booked seats range', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rideId: testRideId,
          bookedSeats: 0, // Invalid: must be at least 1
          pickupLocationId: testPickupLocationId,
          dropLocationId: testDropLocationId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should prevent booking more seats than available', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rideId: testRideId,
          bookedSeats: 10, // More than available
          pickupLocationId: testPickupLocationId,
          dropLocationId: testDropLocationId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Only');
    });

    it('should prevent booking own ride', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rideId: testRideId,
          bookedSeats: 1,
          pickupLocationId: testPickupLocationId,
          dropLocationId: testDropLocationId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot book your own ride');
    });

    it('should prevent duplicate bookings', async () => {
      // First booking should succeed
      const response1 = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rideId: testRideId,
          bookedSeats: 1,
          pickupLocationId: testPickupLocationId,
          dropLocationId: testDropLocationId
        });

      expect(response1.status).toBe(201);

      // Second booking should fail
      const response2 = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rideId: testRideId,
          bookedSeats: 1,
          pickupLocationId: testPickupLocationId,
          dropLocationId: testDropLocationId
        });

      expect(response2.status).toBe(400);
      expect(response2.body.success).toBe(false);
      expect(response2.body.message).toBe('You already have a booking for this ride');
    });
  });

  describe('GET /api/bookings/:id', () => {
    it('should get booking details successfully', async () => {
      const response = await request(app)
        .get(`/api/bookings/${testBookingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.booking).toBeDefined();
      expect(response.body.data.booking.id).toBe(testBookingId);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .get(`/api/bookings/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for unauthorized access', async () => {
      // Create another user and try to access the booking
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Other',
          last_name: 'User',
          email: 'otheruser@example.com',
          password: 'Password123!',
          phone: '+1234567891'
        });

      const otherAuthToken = otherUserResponse.body.data.token;

      const response = await request(app)
        .get(`/api/bookings/${testBookingId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      // Clean up
      await executeQuery('DELETE FROM users WHERE id = ?', [otherUserResponse.body.data.user.id]);
    });
  });

  describe('GET /api/bookings/my-bookings', () => {
    it('should get user bookings successfully', async () => {
      const response = await request(app)
        .get('/api/bookings/my-bookings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/bookings/my-bookings?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/bookings/my-bookings?status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.bookings.every(booking => booking.status === 'pending')).toBe(true);
    });
  });

  describe('PUT /api/bookings/:id/cancel', () => {
    it('should cancel booking successfully', async () => {
      const response = await request(app)
        .put(`/api/bookings/${testBookingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking cancelled successfully');
      expect(response.body.data.booking.status).toBe('cancelled');
    });

    it('should prevent cancelling already cancelled booking', async () => {
      const response = await request(app)
        .put(`/api/bookings/${testBookingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Booking is already cancelled');
    });
  });

  describe('PUT /api/bookings/:id/confirm', () => {
    it('should confirm booking successfully', async () => {
      // First, create a new booking in pending status
      const createResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rideId: testRideId,
          bookedSeats: 1,
          pickupLocationId: testPickupLocationId,
          dropLocationId: testDropLocationId
        });

      const newBookingId = createResponse.body.data.booking.id;

      const response = await request(app)
        .put(`/api/bookings/${newBookingId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking confirmed successfully');
      expect(response.body.data.booking.status).toBe('confirmed');

      // Clean up
      await executeQuery('DELETE FROM bookings WHERE id = ?', [newBookingId]);
    });

    it('should prevent confirming cancelled booking', async () => {
      const response = await request(app)
        .put(`/api/bookings/${testBookingId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Booking is not in pending status');
    });
  });

  describe('PUT /api/bookings/:id/complete', () => {
    it('should complete confirmed booking successfully', async () => {
      // Create a confirmed booking
      const createResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rideId: testRideId,
          bookedSeats: 1,
          pickupLocationId: testPickupLocationId,
          dropLocationId: testDropLocationId
        });

      const newBookingId = createResponse.body.data.booking.id;

      // Confirm the booking
      await request(app)
        .put(`/api/bookings/${newBookingId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`);

      // Complete the booking
      const response = await request(app)
        .put(`/api/bookings/${newBookingId}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Booking completed successfully');
      expect(response.body.data.booking.status).toBe('completed');

      // Clean up
      await executeQuery('DELETE FROM bookings WHERE id = ?', [newBookingId]);
    });
  });

  describe('PUT /api/bookings/:id/payment-status', () => {
    it('should update payment status successfully', async () => {
      // Create a new booking
      const createResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rideId: testRideId,
          bookedSeats: 1,
          pickupLocationId: testPickupLocationId,
          dropLocationId: testDropLocationId
        });

      const newBookingId = createResponse.body.data.booking.id;

      const response = await request(app)
        .put(`/api/bookings/${newBookingId}/payment-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentStatus: 'paid'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment status updated successfully');
      expect(response.body.data.booking.payment_status).toBe('paid');

      // Clean up
      await executeQuery('DELETE FROM bookings WHERE id = ?', [newBookingId]);
    });

    it('should validate payment status', async () => {
      const response = await request(app)
        .put(`/api/bookings/${testBookingId}/payment-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentStatus: 'invalid_status'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/bookings/statistics', () => {
    it('should get booking statistics successfully', async () => {
      const response = await request(app)
        .get('/api/bookings/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.total_bookings).toBeDefined();
      expect(response.body.data.statistics.pending_bookings).toBeDefined();
      expect(response.body.data.statistics.confirmed_bookings).toBeDefined();
      expect(response.body.data.statistics.cancelled_bookings).toBeDefined();
      expect(response.body.data.statistics.completed_bookings).toBeDefined();
    });
  });

  describe('GET /api/bookings/availability/:rideId', () => {
    it('should check seat availability successfully', async () => {
      const response = await request(app)
        .get(`/api/bookings/availability/${testRideId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.rideId).toBe(testRideId);
      expect(response.body.data.totalSeats).toBeDefined();
      expect(response.body.data.bookedSeats).toBeDefined();
      expect(response.body.data.availableSeats).toBeDefined();
      expect(response.body.data.pricePerSeat).toBeDefined();
    });

    it('should return 404 for non-existent ride', async () => {
      const response = await request(app)
        .get(`/api/bookings/availability/${uuidv4()}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/bookings/ride/:rideId', () => {
    it('should get ride bookings for ride owner', async () => {
      const response = await request(app)
        .get(`/api/bookings/ride/${testRideId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.bookings).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should return 403 for non-owner', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          first_name: 'Other',
          last_name: 'User',
          email: 'otheruser2@example.com',
          password: 'Password123!',
          phone: '+1234567892'
        });

      const otherAuthToken = otherUserResponse.body.data.token;

      const response = await request(app)
        .get(`/api/bookings/ride/${testRideId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      // Clean up
      await executeQuery('DELETE FROM users WHERE id = ?', [otherUserResponse.body.data.user.id]);
    });
  });
}); 