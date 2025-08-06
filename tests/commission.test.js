const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const { generateAccessToken } = require('../src/utils/jwt');
const CommissionReport = require('../src/models/CommissionReport');
const CommissionTransaction = require('../src/models/CommissionTransaction');
const BookingPayment = require('../src/models/BookingPayment');

describe('Admin Commission System', () => {
  let adminToken;
  let testUserId;
  let testBookingPaymentId;
  let testCommissionTransactionId;

  beforeAll(async () => {
    // Create test user and admin token
    testUserId = 'test-user-id-123';
    adminToken = generateAccessToken({ userId: 'admin-user-id', role: 'admin' });

    // Create test booking payment
    const testBookingPayment = await BookingPayment.create({
      booking_id: 'test-booking-id',
      user_id: testUserId,
      amount: 100.00,
      payment_method: 'wallet',
      status: 'completed',
      admin_commission_amount: 10.00,
      driver_earning_amount: 90.00
    });
    testBookingPaymentId = testBookingPayment.id;

    // Create test commission transaction
    const testCommissionTransaction = await CommissionTransaction.create({
      booking_payment_id: testBookingPaymentId,
      commission_amount: 10.00,
      commission_percentage: 10.00,
      transaction_type: 'booking_commission',
      status: 'collected'
    });
    testCommissionTransactionId = testCommissionTransaction.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.query('DELETE FROM commission_transactions WHERE id = ?', [testCommissionTransactionId]);
    await db.query('DELETE FROM booking_payments WHERE id = ?', [testBookingPaymentId]);
    await db.query('DELETE FROM commission_reports WHERE report_date = ?', ['2024-01-15']);
    await db.end();
  });

  describe('GET /api/admin/commission/settings', () => {
    it('should get commission settings', async () => {
      const response = await request(app)
        .get('/api/admin/commission/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/admin/commission/settings')
        .expect(401);
    });
  });

  describe('PUT /api/admin/commission/settings', () => {
    it('should update commission settings', async () => {
      const updateData = {
        commissionType: 'booking',
        commissionPercentage: 15.00,
        minimumAmount: 5.00,
        maximumAmount: 50.00
      };

      const response = await request(app)
        .put('/api/admin/commission/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Commission settings updated successfully');
    });

    it('should validate commission percentage range', async () => {
      const updateData = {
        commissionType: 'booking',
        commissionPercentage: 150.00 // Invalid: > 100
      };

      const response = await request(app)
        .put('/api/admin/commission/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate commission type', async () => {
      const updateData = {
        commissionType: 'invalid_type',
        commissionPercentage: 10.00
      };

      const response = await request(app)
        .put('/api/admin/commission/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/commission/reports', () => {
    it('should get commission reports', async () => {
      const response = await request(app)
        .get('/api/admin/commission/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.reports).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter reports by date range', async () => {
      const response = await request(app)
        .get('/api/admin/commission/reports?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/admin/commission/reports?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });

  describe('POST /api/admin/commission/reports/generate', () => {
    it('should generate commission report for a specific date', async () => {
      const reportData = {
        date: '2024-01-15'
      };

      const response = await request(app)
        .post('/api/admin/commission/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(reportData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Commission report generated successfully');
      expect(response.body.data.report_date).toBe('2024-01-15');
    });

    it('should validate date format', async () => {
      const reportData = {
        date: 'invalid-date'
      };

      const response = await request(app)
        .post('/api/admin/commission/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(reportData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should require date parameter', async () => {
      const response = await request(app)
        .post('/api/admin/commission/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/commission/analytics', () => {
    it('should get commission analytics', async () => {
      const response = await request(app)
        .get('/api/admin/commission/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.transaction_statistics).toBeDefined();
    });

    it('should accept period parameter', async () => {
      const response = await request(app)
        .get('/api/admin/commission/analytics?period=7')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview.period).toBe('7');
    });
  });

  describe('GET /api/admin/commission/dashboard', () => {
    it('should get commission dashboard data', async () => {
      const response = await request(app)
        .get('/api/admin/commission/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.today).toBeDefined();
      expect(response.body.data.yesterday).toBeDefined();
      expect(response.body.data.this_month).toBeDefined();
      expect(response.body.data.pending_commissions).toBeDefined();
      expect(response.body.data.recent_transactions).toBeDefined();
    });
  });

  describe('GET /api/admin/commission/export', () => {
    it('should export commission data', async () => {
      const response = await request(app)
        .get('/api/admin/commission/export?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.period).toBeDefined();
      expect(response.body.data.reports).toBeDefined();
      expect(response.body.data.transactions).toBeDefined();
      expect(response.body.data.summary).toBeDefined();
    });

    it('should require start and end dates', async () => {
      const response = await request(app)
        .get('/api/admin/commission/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate date format', async () => {
      const response = await request(app)
        .get('/api/admin/commission/export?startDate=invalid&endDate=invalid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept format parameter', async () => {
      const response = await request(app)
        .get('/api/admin/commission/export?startDate=2024-01-01&endDate=2024-12-31&format=json')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('CommissionReport Model', () => {
    it('should create commission report', async () => {
      const reportData = {
        report_date: '2024-01-16',
        total_bookings: 5,
        total_booking_amount: 500.00,
        total_commission_amount: 50.00,
        total_withdrawals: 2,
        total_withdrawal_fees: 5.00,
        net_commission: 55.00
      };

      const report = await CommissionReport.create(reportData);
      expect(report).toBeDefined();
      expect(report.report_date).toBe('2024-01-16');
      expect(report.total_bookings).toBe(5);
      expect(report.net_commission).toBe(55.00);

      // Clean up
      await db.query('DELETE FROM commission_reports WHERE id = ?', [report.id]);
    });

    it('should find commission report by date', async () => {
      // Create a test report
      const reportData = {
        report_date: '2024-01-17',
        total_bookings: 3,
        total_booking_amount: 300.00,
        total_commission_amount: 30.00,
        total_withdrawals: 1,
        total_withdrawal_fees: 2.50,
        net_commission: 32.50
      };

      const createdReport = await CommissionReport.create(reportData);
      const foundReport = await CommissionReport.findByDate('2024-01-17');

      expect(foundReport).toBeDefined();
      expect(foundReport.id).toBe(createdReport.id);

      // Clean up
      await db.query('DELETE FROM commission_reports WHERE id = ?', [createdReport.id]);
    });

    it('should generate commission report', async () => {
      const report = await CommissionReport.generateReport('2024-01-18');
      expect(report).toBeDefined();
      expect(report.report_date).toBe('2024-01-18');

      // Clean up
      await db.query('DELETE FROM commission_reports WHERE id = ?', [report.id]);
    });

    it('should get commission statistics', async () => {
      const stats = await CommissionReport.getStatistics('30');
      expect(stats).toBeDefined();
      expect(stats.total_reports).toBeDefined();
      expect(stats.total_bookings).toBeDefined();
      expect(stats.total_net_commission).toBeDefined();
    });

    it('should get commission trends', async () => {
      const trends = await CommissionReport.getTrends('30');
      expect(Array.isArray(trends)).toBe(true);
    });
  });

  describe('CommissionReport Validation', () => {
    it('should validate report data', () => {
      const validData = {
        report_date: '2024-01-19',
        total_bookings: 5,
        total_booking_amount: 500.00,
        total_commission_amount: 50.00,
        total_withdrawals: 2,
        total_withdrawal_fees: 5.00,
        net_commission: 55.00
      };

      const errors = CommissionReport.validateReportData(validData);
      expect(errors.length).toBe(0);
    });

    it('should detect validation errors', () => {
      const invalidData = {
        report_date: null,
        total_bookings: -1,
        total_booking_amount: -100.00,
        total_commission_amount: -10.00,
        total_withdrawals: -1,
        total_withdrawal_fees: -5.00,
        net_commission: -55.00
      };

      const errors = CommissionReport.validateReportData(invalidData);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.includes('Report date is required'))).toBe(true);
      expect(errors.some(error => error.includes('cannot be negative'))).toBe(true);
    });
  });
}); 