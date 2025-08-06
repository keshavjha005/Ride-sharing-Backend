const request = require('supertest');
const app = require('../src/app');
const mysql = require('mysql2/promise');
const config = require('../src/config');
const { generateToken } = require('../src/utils/jwt');

describe('Wallet Management System', () => {
  let connection;
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Create database connection
    connection = await mysql.createConnection(config.database);
    
    // Create test user
    const userId = 'test-wallet-user-' + Date.now();
    await connection.query(`
      INSERT INTO users (id, email, phone, password_hash, first_name, last_name, is_verified, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, 'wallet-test@example.com', '+1234567890', 'hashed_password', 'Test', 'User', true, true]);
    
    testUser = { id: userId, email: 'wallet-test@example.com' };
    authToken = generateToken(testUser);
  });

  afterAll(async () => {
    // Clean up test data
    if (connection) {
      await connection.query('DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = ?)', [testUser.id]);
      await connection.query('DELETE FROM wallet_recharge_requests WHERE user_id = ?', [testUser.id]);
      await connection.query('DELETE FROM wallets WHERE user_id = ?', [testUser.id]);
      await connection.query('DELETE FROM users WHERE id = ?', [testUser.id]);
      await connection.end();
    }
  });

  describe('GET /api/wallet/balance', () => {
    it('should create wallet and return balance for new user', async () => {
      const response = await request(app)
        .get('/api/wallet/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('user_id', testUser.id);
      expect(response.body.data).toHaveProperty('balance', 0);
      expect(response.body.data).toHaveProperty('currency_code', 'USD');
      expect(response.body.data).toHaveProperty('is_active', true);
    });

    it('should return existing wallet balance', async () => {
      const response = await request(app)
        .get('/api/wallet/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('balance');
    });
  });

  describe('GET /api/wallet/transactions', () => {
    it('should return empty transaction history for new wallet', async () => {
      const response = await request(app)
        .get('/api/wallet/transactions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toEqual([]);
      expect(response.body.data.pagination).toHaveProperty('total', 0);
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/wallet/transactions?page=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/wallet/recharge', () => {
    it('should create recharge request with valid data', async () => {
      const rechargeData = {
        amount: 100.00,
        paymentMethod: 'card',
        currency: 'USD'
      };

      const response = await request(app)
        .post('/api/wallet/recharge')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rechargeData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('rechargeId');
      expect(response.body.data).toHaveProperty('amount', 100);
      expect(response.body.data).toHaveProperty('paymentUrl');
      expect(response.body.data).toHaveProperty('expiresAt');
    });

    it('should reject invalid amount', async () => {
      const rechargeData = {
        amount: -10,
        paymentMethod: 'card'
      };

      const response = await request(app)
        .post('/api/wallet/recharge')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rechargeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid payment method', async () => {
      const rechargeData = {
        amount: 100,
        paymentMethod: 'invalid_method'
      };

      const response = await request(app)
        .post('/api/wallet/recharge')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rechargeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/wallet/statistics', () => {
    it('should return wallet statistics', async () => {
      const response = await request(app)
        .get('/api/wallet/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('wallet');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data.statistics).toHaveProperty('total_transactions');
      expect(response.body.data.statistics).toHaveProperty('total_credits');
      expect(response.body.data.statistics).toHaveProperty('total_debits');
    });

    it('should accept period parameter', async () => {
      const response = await request(app)
        .get('/api/wallet/statistics?period=7')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/wallet/limits', () => {
    it('should update wallet limits', async () => {
      const limitsData = {
        daily_limit: 500,
        monthly_limit: 5000
      };

      const response = await request(app)
        .put('/api/wallet/limits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(limitsData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Wallet limits updated successfully');
    });

    it('should reject negative limits', async () => {
      const limitsData = {
        daily_limit: -100
      };

      const response = await request(app)
        .put('/api/wallet/limits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(limitsData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/wallet/recharge-requests', () => {
    it('should return recharge requests', async () => {
      const response = await request(app)
        .get('/api/wallet/recharge-requests')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('requests');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/wallet/recharge-requests?status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/wallet/recharge-requests/:id/cancel', () => {
    it('should cancel recharge request', async () => {
      // First create a recharge request
      const rechargeData = {
        amount: 50.00,
        paymentMethod: 'card'
      };

      const createResponse = await request(app)
        .post('/api/wallet/recharge')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rechargeData);

      const rechargeId = createResponse.body.data.rechargeId;

      // Then cancel it
      const response = await request(app)
        .post(`/api/wallet/recharge-requests/${rechargeId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Recharge request cancelled successfully');
    });

    it('should reject invalid recharge request ID', async () => {
      const response = await request(app)
        .post('/api/wallet/recharge-requests/invalid-id/cancel')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'get', path: '/api/wallet/balance' },
        { method: 'get', path: '/api/wallet/transactions' },
        { method: 'post', path: '/api/wallet/recharge' },
        { method: 'get', path: '/api/wallet/statistics' },
        { method: 'put', path: '/api/wallet/limits' },
        { method: 'get', path: '/api/wallet/recharge-requests' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
      }
    });
  });
}); 