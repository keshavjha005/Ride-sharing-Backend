const request = require('supertest');
const app = require('../src/app');
const mysql = require('mysql2/promise');
const config = require('../src/config');
const { v4: uuidv4 } = require('uuid');
const logger = require('../src/utils/logger');

describe('Transaction Processing System', () => {
  let testUser, testBooking, authToken, testPayment, connection;

  beforeAll(async () => {
    // Create database connection
    connection = await mysql.createConnection(config.database);
    
    // Create test user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: `testuser-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        phone: '+1234567890'
      });

    testUser = userResponse.body.data.user;
    authToken = userResponse.body.data.token;

    // Create a test booking (simplified for testing)
    const bookingData = {
      rideId: uuidv4(),
      bookedSeats: 2,
      totalAmount: 50.00,
      paymentType: 'wallet'
    };

    // Insert test booking directly
    const [bookingResult] = await connection.execute(`
      INSERT INTO bookings (id, ride_id, user_id, booked_seats, total_amount, status, payment_status, payment_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [uuidv4(), bookingData.rideId, testUser.id, bookingData.bookedSeats, bookingData.totalAmount, 'pending', 'pending', bookingData.paymentType]);

    testBooking = {
      id: bookingResult.insertId,
      ...bookingData
    };
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await connection.execute('DELETE FROM users WHERE id = ?', [testUser.id]);
    }
    if (testBooking) {
      await connection.execute('DELETE FROM bookings WHERE id = ?', [testBooking.id]);
    }
    if (connection) {
      await connection.end();
    }
  });

  describe('POST /api/bookings/:id/pay', () => {
    it('should process wallet payment successfully', async () => {
      const response = await request(app)
        .post(`/api/bookings/${testBooking.id}/pay`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50.00,
          paymentMethod: 'wallet',
          pricingDetails: {
            baseFare: 45.00,
            commission: 5.00,
            total: 50.00
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toBeDefined();
      expect(response.body.data.payment.amount).toBe(50.00);
      expect(response.body.data.payment.payment_method).toBe('wallet');
      expect(response.body.data.payment.status).toBe('completed');
      expect(response.body.data.commission).toBeDefined();

      testPayment = response.body.data.payment;
    });

    it('should reject payment for non-existent booking', async () => {
      const response = await request(app)
        .post(`/api/bookings/${uuidv4()}/pay`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50.00,
          paymentMethod: 'wallet'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject payment with invalid amount', async () => {
      const response = await request(app)
        .post(`/api/bookings/${testBooking.id}/pay`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: -10.00,
          paymentMethod: 'wallet'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject payment with invalid payment method', async () => {
      const response = await request(app)
        .post(`/api/bookings/${testBooking.id}/pay`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50.00,
          paymentMethod: 'invalid_method'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/bookings/:id/refund', () => {
    it('should process refund successfully', async () => {
      const response = await request(app)
        .post(`/api/bookings/${testPayment.id}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          refundAmount: 25.00,
          reason: 'Partial refund due to cancellation'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.refundPayment).toBeDefined();
      expect(response.body.data.refundAmount).toBe(25.00);
    });

    it('should reject refund for non-existent payment', async () => {
      const response = await request(app)
        .post(`/api/bookings/${uuidv4()}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          refundAmount: 25.00,
          reason: 'Test refund'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject refund with amount exceeding payment amount', async () => {
      const response = await request(app)
        .post(`/api/bookings/${testPayment.id}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          refundAmount: 100.00,
          reason: 'Excessive refund'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/transactions', () => {
    it('should get transaction history', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: 1,
          limit: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter transactions by status', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          status: 'completed'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter transactions by payment method', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          paymentMethod: 'wallet'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should get transaction details', async () => {
      const response = await request(app)
        .get(`/api/transactions/${testPayment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toBeDefined();
      expect(response.body.data.commissions).toBeDefined();
    });

    it('should reject access to non-existent transaction', async () => {
      const response = await request(app)
        .get(`/api/transactions/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/transactions/statistics', () => {
    it('should get transaction statistics', async () => {
      const response = await request(app)
        .get('/api/transactions/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          period: '30'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toBeDefined();
      expect(response.body.data.commissions).toBeDefined();
    });
  });

  describe('GET /api/transactions/payments/:id', () => {
    it('should get booking payment details', async () => {
      const response = await request(app)
        .get(`/api/transactions/payments/${testPayment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment).toBeDefined();
      expect(response.body.data.commissions).toBeDefined();
    });
  });

  describe('POST /api/transactions/reconcile', () => {
    it('should reconcile transactions', async () => {
      const response = await request(app)
        .post('/api/transactions/reconcile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          status: 'completed'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toBeDefined();
      expect(response.body.data.commissions).toBeDefined();
    });
  });

  describe('GET /api/transactions/commissions', () => {
    it('should get commission transactions', async () => {
      const response = await request(app)
        .get('/api/transactions/commissions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: 1,
          limit: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.commissions).toBeDefined();
    });

    it('should filter commission transactions by type', async () => {
      const response = await request(app)
        .get('/api/transactions/commissions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          transactionType: 'booking_commission'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/transactions/commissions/statistics', () => {
    it('should get commission statistics', async () => {
      const response = await request(app)
        .get('/api/transactions/commissions/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          period: '30'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overall).toBeDefined();
      expect(response.body.data.by_type).toBeDefined();
    });
  });

  describe('Validation and Error Handling', () => {
    it('should validate required fields for payment', async () => {
      const response = await request(app)
        .post(`/api/bookings/${testBooking.id}/pay`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate required fields for refund', async () => {
      const response = await request(app)
        .post(`/api/bookings/${testPayment.id}/refund`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'POST', url: `/api/bookings/${testBooking.id}/pay` },
        { method: 'POST', url: `/api/bookings/${testPayment.id}/refund` },
        { method: 'GET', url: '/api/transactions' },
        { method: 'GET', url: `/api/transactions/${testPayment.id}` },
        { method: 'GET', url: '/api/transactions/statistics' },
        { method: 'POST', url: '/api/transactions/reconcile' },
        { method: 'GET', url: '/api/transactions/commissions' },
        { method: 'GET', url: '/api/transactions/commissions/statistics' },
        { method: 'GET', url: `/api/transactions/payments/${testPayment.id}` }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method.toLowerCase()](endpoint.url);
        expect(response.status).toBe(401);
      }
    });
  });
}); 