const request = require('supertest');
const app = require('../src/app');

const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const WalletTransaction = require('../src/models/WalletTransaction');
const BookingPayment = require('../src/models/BookingPayment');
const WithdrawalRequest = require('../src/models/WithdrawalRequest');
const CommissionTransaction = require('../src/models/CommissionTransaction');
const { generateAccessToken } = require('../src/utils/jwt');
const moment = require('moment');

describe('Financial Controller', () => {
  let adminToken;
  let testUser;
  let testWallet;
  const testId = Date.now().toString();

  beforeAll(async () => {
    // Create test admin user
    const adminUser = await User.create({
      id: `admin-test-${testId}`,
      email: `admin-financial-test-${testId}@test.com`,
      phone: `+123456789${testId.slice(-1)}`,
      password_hash: 'hashedpassword',
      first_name: 'Admin',
      last_name: 'Test',
      role: 'admin'
    });

    adminToken = generateAccessToken(adminUser);

    // Create test user
    testUser = await User.create({
      id: `user-test-${testId}`,
      email: `user-financial-test-${testId}@test.com`,
      phone: `+123456788${testId.slice(-1)}`,
      password_hash: 'hashedpassword',
      first_name: 'Test',
      last_name: 'User',
      role: 'user'
    });

    // Create test wallet using direct query
    const walletId = `wallet-test-${testId}`;
    const db = require('../src/config/database');
    
    await db.executeQuery(`
      INSERT INTO wallets (id, user_id, balance, currency_code, is_active, daily_limit, monthly_limit, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      walletId,
      testUser.id,
      1000.00,
      'USD',
      true,
      1000.00,
      10000.00
    ]);
    testWallet = { id: walletId, user_id: testUser.id, balance: 1000.00, currency_code: 'USD' };

    // Create test transactions using direct database queries
    
    await db.executeQuery(`
      INSERT INTO wallet_transactions (id, wallet_id, transaction_type, amount, balance_before, balance_after, 
                                      transaction_category, status, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [`transaction-1-${testId}`, testWallet.id, 'credit', 500.00, 500.00, 1000.00, 'ride_earning', 'completed', 'Ride earning']);

    await db.executeQuery(`
      INSERT INTO wallet_transactions (id, wallet_id, transaction_type, amount, balance_before, balance_after, 
                                      transaction_category, status, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [`transaction-2-${testId}`, testWallet.id, 'debit', 100.00, 1000.00, 900.00, 'ride_payment', 'completed', 'Ride payment']);

    // Create test bookings
    await db.executeQuery(`
      INSERT INTO booking_payments (id, booking_id, user_id, amount, payment_method, status, 
                                   admin_commission_amount, driver_earning_amount, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [`booking-1-${testId}`, 'booking-ref-1', testUser.id, 50.00, 'wallet', 'completed', 5.00, 45.00]);

    await db.executeQuery(`
      INSERT INTO booking_payments (id, booking_id, user_id, amount, payment_method, status, 
                                   admin_commission_amount, driver_earning_amount, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [`booking-2-${testId}`, 'booking-ref-2', testUser.id, 75.00, 'card', 'completed', 7.50, 67.50]);

    // Create test withdrawals
    await db.executeQuery(`
      INSERT INTO withdrawal_requests (id, user_id, amount, withdrawal_method, status, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [`withdrawal-1-${testId}`, testUser.id, 200.00, 'bank_transfer', 'completed']);

    await db.executeQuery(`
      INSERT INTO withdrawal_requests (id, user_id, amount, withdrawal_method, status, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [`withdrawal-2-${testId}`, testUser.id, 150.00, 'paypal', 'pending']);

    // Create test commission transactions
    await db.executeQuery(`
      INSERT INTO commission_transactions (id, booking_payment_id, commission_amount, commission_percentage, 
                                          transaction_type, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [`commission-1-${testId}`, `booking-1-${testId}`, 5.00, 10.00, 'booking_commission', 'collected']);

    await db.executeQuery(`
      INSERT INTO commission_transactions (id, booking_payment_id, commission_amount, commission_percentage, 
                                          transaction_type, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [`commission-2-${testId}`, `booking-2-${testId}`, 7.50, 10.00, 'booking_commission', 'collected']);
  });

  afterAll(async () => {
    // Clean up test data using direct database queries
    const db = require('../src/config/database');
    
    await db.executeQuery('DELETE FROM commission_transactions WHERE id LIKE ?', [`%${testId}%`]);
    await db.executeQuery('DELETE FROM withdrawal_requests WHERE id LIKE ?', [`%${testId}%`]);
    await db.executeQuery('DELETE FROM booking_payments WHERE id LIKE ?', [`%${testId}%`]);
    await db.executeQuery('DELETE FROM wallet_transactions WHERE id LIKE ?', [`%${testId}%`]);
    await db.executeQuery('DELETE FROM wallets WHERE id LIKE ?', [`%${testId}%`]);
    await db.executeQuery('DELETE FROM users WHERE id LIKE ?', [`%${testId}%`]);
  });

  describe('GET /api/admin/financial/dashboard', () => {
    it('should get financial dashboard data', async () => {
      const response = await request(app)
        .get('/api/admin/financial/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('today');
      expect(response.body.data).toHaveProperty('thisMonth');
      expect(response.body.data).toHaveProperty('lastMonth');
      expect(response.body.data).toHaveProperty('comparison');
      expect(response.body.data).toHaveProperty('recentTransactions');
      expect(response.body.data).toHaveProperty('topUsers');
      expect(response.body.data).toHaveProperty('alerts');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/admin/financial/dashboard')
        .expect(401);
    });
  });

  describe('GET /api/admin/financial/revenue', () => {
    it('should get revenue reports with default parameters', async () => {
      const response = await request(app)
        .get('/api/admin/financial/revenue')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('revenue');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should get revenue reports with custom parameters', async () => {
      const startDate = moment().subtract(7, 'days').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');

      const response = await request(app)
        .get(`/api/admin/financial/revenue?startDate=${startDate}&endDate=${endDate}&period=daily&page=1&limit=10`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.revenue).toBeInstanceOf(Array);
    });

    it('should handle invalid date parameters', async () => {
      const response = await request(app)
        .get('/api/admin/financial/revenue?startDate=invalid-date')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should handle invalid period parameter', async () => {
      const response = await request(app)
        .get('/api/admin/financial/revenue?period=invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/admin/financial/transactions', () => {
    it('should get transaction reports with default parameters', async () => {
      const response = await request(app)
        .get('/api/admin/financial/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transactions');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should get transaction reports with filters', async () => {
      const response = await request(app)
        .get('/api/admin/financial/transactions?type=credit&status=completed&page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toBeInstanceOf(Array);
    });

    it('should handle invalid transaction type filter', async () => {
      const response = await request(app)
        .get('/api/admin/financial/transactions?type=invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/admin/financial/users/:id', () => {
    it('should get user financial report', async () => {
      const response = await request(app)
        .get(`/api/admin/financial/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('wallet');
      expect(response.body.data).toHaveProperty('statistics');
      expect(response.body.data).toHaveProperty('transactions');
      expect(response.body.data).toHaveProperty('bookings');
      expect(response.body.data).toHaveProperty('withdrawals');
    });

    it('should get user financial report with date range', async () => {
      const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');

      const response = await request(app)
        .get(`/api/admin/financial/users/${testUser.id}?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/admin/financial/users/non-existent-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should handle invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/admin/financial/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('POST /api/admin/financial/export', () => {
    it('should export transactions data as JSON', async () => {
      const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');

      const response = await request(app)
        .post('/api/admin/financial/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate,
          endDate,
          type: 'transactions',
          format: 'json'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should export revenue data as CSV', async () => {
      const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');

      const response = await request(app)
        .post('/api/admin/financial/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate,
          endDate,
          type: 'revenue',
          format: 'csv'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should export user financials data', async () => {
      const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');

      const response = await request(app)
        .post('/api/admin/financial/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate,
          endDate,
          type: 'users',
          format: 'json'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should handle invalid export type', async () => {
      const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');

      const response = await request(app)
        .post('/api/admin/financial/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate,
          endDate,
          type: 'invalid',
          format: 'json'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid export type');
    });

    it('should handle invalid date format', async () => {
      const response = await request(app)
        .post('/api/admin/financial/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate: 'invalid-date',
          endDate: 'invalid-date',
          type: 'transactions',
          format: 'json'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/admin/financial/alerts', () => {
    it('should get financial alerts', async () => {
      const response = await request(app)
        .get('/api/admin/financial/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/admin/financial/alerts')
        .expect(401);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a database error by temporarily closing the connection
      const originalQuery = sequelize.query;
      sequelize.query = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/admin/financial/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to get financial dashboard');

      // Restore original query function
      sequelize.query = originalQuery;
    });
  });

  describe('Data validation', () => {
    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/financial/revenue?page=0&limit=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate limit maximum', async () => {
      const response = await request(app)
        .get('/api/admin/financial/revenue?limit=101')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('Performance tests', () => {
    it('should handle large date ranges efficiently', async () => {
      const startDate = moment().subtract(365, 'days').format('YYYY-MM-DD');
      const endDate = moment().format('YYYY-MM-DD');

      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/admin/financial/revenue?startDate=${startDate}&endDate=${endDate}&limit=50`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
}); 