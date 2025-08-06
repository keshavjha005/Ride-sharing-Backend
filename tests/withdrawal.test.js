const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const { createTestUser, createTestWallet, cleanupTestData } = require('./testHelpers');

describe('Withdrawal System API', () => {
  let testUser, testUserToken, testWallet;

  beforeAll(async () => {
    // Create test user and wallet
    testUser = await createTestUser();
    testUserToken = testUser.token;
    testWallet = await createTestWallet(testUser.id, 1000.00); // $1000 balance
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser && testUser.id) {
      await cleanupTestData(testUser.id);
    }
  });

  beforeEach(async () => {
    // Clear withdrawal data before each test
    if (testUser && testUser.id) {
      const connection = await db.getConnection();
      try {
        await connection.query('DELETE FROM withdrawal_requests WHERE user_id = ?', [testUser.id]);
        await connection.query('DELETE FROM withdrawal_methods WHERE user_id = ?', [testUser.id]);
      } finally {
        connection.release();
      }
    }
  });

  describe('POST /api/withdrawals/request', () => {
    it('should create a withdrawal request successfully', async () => {
      const withdrawalData = {
        amount: 100.00,
        withdrawalMethod: 'bank_transfer',
        accountDetails: {
          accountNumber: '1234567890',
          routingNumber: '021000021',
          accountHolderName: 'John Doe',
          bankName: 'Test Bank'
        }
      };

      const response = await request(app)
        .post('/api/withdrawals/request')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(withdrawalData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(100.00);
      expect(response.body.data.withdrawal_method).toBe('bank_transfer');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.user_id).toBe(testUser.id);
    });

    it('should reject withdrawal request with insufficient balance', async () => {
      const withdrawalData = {
        amount: 2000.00, // More than wallet balance
        withdrawalMethod: 'bank_transfer',
        accountDetails: {
          accountNumber: '1234567890',
          routingNumber: '021000021',
          accountHolderName: 'John Doe',
          bankName: 'Test Bank'
        }
      };

      const response = await request(app)
        .post('/api/withdrawals/request')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(withdrawalData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient wallet balance');
    });

    it('should reject withdrawal request below minimum amount', async () => {
      const withdrawalData = {
        amount: 5.00, // Below minimum $10
        withdrawalMethod: 'bank_transfer',
        accountDetails: {
          accountNumber: '1234567890',
          routingNumber: '021000021',
          accountHolderName: 'John Doe',
          bankName: 'Test Bank'
        }
      };

      const response = await request(app)
        .post('/api/withdrawals/request')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(withdrawalData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Minimum withdrawal amount');
    });

    it('should reject withdrawal request with invalid method', async () => {
      const withdrawalData = {
        amount: 100.00,
        withdrawalMethod: 'invalid_method',
        accountDetails: {
          accountNumber: '1234567890',
          routingNumber: '021000021',
          accountHolderName: 'John Doe',
          bankName: 'Test Bank'
        }
      };

      const response = await request(app)
        .post('/api/withdrawals/request')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(withdrawalData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/withdrawals/requests', () => {
    beforeEach(async () => {
      // Create test withdrawal requests
      await db.query(`
        INSERT INTO withdrawal_requests (id, user_id, amount, withdrawal_method, account_details, status)
        VALUES 
        (UUID(), ?, 100.00, 'bank_transfer', '{"accountNumber":"1234567890"}', 'pending'),
        (UUID(), ?, 200.00, 'paypal', '{"email":"test@example.com"}', 'completed'),
        (UUID(), ?, 150.00, 'stripe', '{"accountId":"acct_123"}', 'rejected')
      `, [testUser.id, testUser.id, testUser.id]);
    });

    it('should get withdrawal requests for user', async () => {
      const response = await request(app)
        .get('/api/withdrawals/requests')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.withdrawalRequests).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter withdrawal requests by status', async () => {
      const response = await request(app)
        .get('/api/withdrawals/requests?status=pending')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.withdrawalRequests).toHaveLength(1);
      expect(response.body.data.withdrawalRequests[0].status).toBe('pending');
    });

    it('should filter withdrawal requests by method', async () => {
      const response = await request(app)
        .get('/api/withdrawals/requests?withdrawal_method=paypal')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.withdrawalRequests).toHaveLength(1);
      expect(response.body.data.withdrawalRequests[0].withdrawal_method).toBe('paypal');
    });
  });

  describe('GET /api/withdrawals/requests/:id', () => {
    let withdrawalRequestId;

    beforeEach(async () => {
      // Create a test withdrawal request
      const [result] = await db.query(`
        INSERT INTO withdrawal_requests (id, user_id, amount, withdrawal_method, account_details, status)
        VALUES (UUID(), ?, 100.00, 'bank_transfer', '{"accountNumber":"1234567890"}', 'pending')
      `, [testUser.id]);
      
      withdrawalRequestId = result.insertId;
    });

    it('should get withdrawal request details', async () => {
      const response = await request(app)
        .get(`/api/withdrawals/requests/${withdrawalRequestId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.withdrawalRequest.id).toBe(withdrawalRequestId);
      expect(response.body.data.withdrawalRequest.amount).toBe(100.00);
    });

    it('should return 404 for non-existent withdrawal request', async () => {
      const response = await request(app)
        .get('/api/withdrawals/requests/999999')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/withdrawals/methods', () => {
    it('should add withdrawal method successfully', async () => {
      const methodData = {
        method_type: 'bank_transfer',
        account_name: 'My Bank Account',
        account_details: {
          accountNumber: '1234567890',
          routingNumber: '021000021',
          accountHolderName: 'John Doe',
          bankName: 'Test Bank'
        },
        is_default: true
      };

      const response = await request(app)
        .post('/api/withdrawals/methods')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(methodData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.method_type).toBe('bank_transfer');
      expect(response.body.data.account_name).toBe('My Bank Account');
      expect(response.body.data.is_default).toBe(true);
    });

    it('should reject invalid account details', async () => {
      const methodData = {
        method_type: 'bank_transfer',
        account_name: 'My Bank Account',
        account_details: {
          accountNumber: '123', // Too short
          routingNumber: '021000021',
          accountHolderName: 'John Doe',
          bankName: 'Test Bank'
        }
      };

      const response = await request(app)
        .post('/api/withdrawals/methods')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(methodData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Bank account number is required and must be at least 5 characters');
    });
  });

  describe('GET /api/withdrawals/methods', () => {
    beforeEach(async () => {
      // Create test withdrawal methods
      await db.query(`
        INSERT INTO withdrawal_methods (id, user_id, method_type, account_name, account_details, is_default)
        VALUES 
        (UUID(), ?, 'bank_transfer', 'Bank Account', '{"accountNumber":"1234567890"}', true),
        (UUID(), ?, 'paypal', 'PayPal Account', '{"email":"test@example.com"}', false)
      `, [testUser.id, testUser.id]);
    });

    it('should get withdrawal methods for user', async () => {
      const response = await request(app)
        .get('/api/withdrawals/methods')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].is_default).toBe(true);
    });
  });

  describe('PUT /api/withdrawals/methods/:id', () => {
    let methodId;

    beforeEach(async () => {
      // Create a test withdrawal method
      const [result] = await db.query(`
        INSERT INTO withdrawal_methods (id, user_id, method_type, account_name, account_details, is_default)
        VALUES (UUID(), ?, 'bank_transfer', 'Old Name', '{"accountNumber":"1234567890"}', false)
      `, [testUser.id]);
      
      methodId = result.insertId;
    });

    it('should update withdrawal method successfully', async () => {
      const updateData = {
        account_name: 'Updated Bank Account',
        is_default: true
      };

      const response = await request(app)
        .put(`/api/withdrawals/methods/${methodId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.account_name).toBe('Updated Bank Account');
      expect(response.body.data.is_default).toBe(true);
    });
  });

  describe('DELETE /api/withdrawals/methods/:id', () => {
    let methodId;

    beforeEach(async () => {
      // Create a test withdrawal method
      const [result] = await db.query(`
        INSERT INTO withdrawal_methods (id, user_id, method_type, account_name, account_details, is_default)
        VALUES (UUID(), ?, 'bank_transfer', 'Test Account', '{"accountNumber":"1234567890"}', false)
      `, [testUser.id]);
      
      methodId = result.insertId;
    });

    it('should delete withdrawal method successfully', async () => {
      const response = await request(app)
        .delete(`/api/withdrawals/methods/${methodId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/withdrawals/summary', () => {
    beforeEach(async () => {
      // Create test withdrawal requests with different statuses
      await db.query(`
        INSERT INTO withdrawal_requests (id, user_id, amount, withdrawal_method, account_details, status)
        VALUES 
        (UUID(), ?, 100.00, 'bank_transfer', '{"accountNumber":"1234567890"}', 'pending'),
        (UUID(), ?, 200.00, 'paypal', '{"email":"test@example.com"}', 'completed'),
        (UUID(), ?, 150.00, 'stripe', '{"accountId":"acct_123"}', 'completed')
      `, [testUser.id, testUser.id, testUser.id]);
    });

    it('should get user withdrawal summary', async () => {
      const response = await request(app)
        .get('/api/withdrawals/summary')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pending_amount).toBe(100.00);
      expect(response.body.data.total_withdrawn).toBe(350.00); // 200 + 150
      expect(response.body.data.recent_requests).toHaveLength(3);
    });
  });

  describe('GET /api/withdrawals/settings', () => {
    it('should get withdrawal settings', async () => {
      const response = await request(app)
        .get('/api/withdrawals/settings')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.withdrawal_limits).toBeDefined();
      expect(response.body.data.withdrawal_fees).toBeDefined();
      expect(response.body.data.processing_times).toBeDefined();
    });
  });

  describe('GET /api/withdrawals/statistics', () => {
    it('should get withdrawal statistics', async () => {
      const response = await request(app)
        .get('/api/withdrawals/statistics')
        .set('Authorization', `Bearer ${testUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.requests).toBeDefined();
      expect(response.body.data.by_method).toBeDefined();
      expect(response.body.data.payouts).toBeDefined();
    });
  });

  describe('Admin Operations', () => {
    let withdrawalRequestId;

    beforeEach(async () => {
      // Create a test withdrawal request
      const [result] = await db.query(`
        INSERT INTO withdrawal_requests (id, user_id, amount, withdrawal_method, account_details, status)
        VALUES (UUID(), ?, 100.00, 'bank_transfer', '{"accountNumber":"1234567890"}', 'pending')
      `, [testUser.id]);
      
      withdrawalRequestId = result.insertId;
    });

    it('should approve withdrawal request', async () => {
      const response = await request(app)
        .put(`/api/withdrawals/requests/${withdrawalRequestId}/approve`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ adminNotes: 'Approved for processing' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
    });

    it('should reject withdrawal request', async () => {
      const response = await request(app)
        .put(`/api/withdrawals/requests/${withdrawalRequestId}/reject`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ adminNotes: 'Rejected due to insufficient documentation' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
    });

    it('should cancel withdrawal request', async () => {
      const response = await request(app)
        .put(`/api/withdrawals/requests/${withdrawalRequestId}/cancel`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ adminNotes: 'Cancelled by user request' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for unauthorized requests', async () => {
      const response = await request(app)
        .get('/api/withdrawals/requests')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid withdrawal request data', async () => {
      const response = await request(app)
        .post('/api/withdrawals/request')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
}); 