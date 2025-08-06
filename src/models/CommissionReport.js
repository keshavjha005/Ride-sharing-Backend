const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class CommissionReport {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.report_date = data.report_date;
    this.total_bookings = data.total_bookings || 0;
    this.total_booking_amount = data.total_booking_amount || 0.00;
    this.total_commission_amount = data.total_commission_amount || 0.00;
    this.total_withdrawals = data.total_withdrawals || 0;
    this.total_withdrawal_fees = data.total_withdrawal_fees || 0.00;
    this.net_commission = data.net_commission || 0.00;
    this.created_at = data.created_at || new Date();
  }

  // Create a new commission report
  static async create(reportData) {
    try {
      const report = new CommissionReport(reportData);
      
      const query = `
        INSERT INTO commission_reports (
          id, report_date, total_bookings, total_booking_amount,
          total_commission_amount, total_withdrawals, total_withdrawal_fees,
          net_commission, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        report.id, report.report_date, report.total_bookings,
        report.total_booking_amount, report.total_commission_amount,
        report.total_withdrawals, report.total_withdrawal_fees,
        report.net_commission, report.created_at
      ];

      await db.execute(query, values);
      
      return report;
    } catch (error) {
      logger.error('Error creating commission report:', error);
      throw error;
    }
  }

  // Find commission report by ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM commission_reports WHERE id = ?';
      const [rows] = await db.execute(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      return new CommissionReport(rows[0]);
    } catch (error) {
      logger.error('Error finding commission report by ID:', error);
      throw error;
    }
  }

  // Find commission report by date
  static async findByDate(date) {
    try {
      const query = 'SELECT * FROM commission_reports WHERE report_date = ?';
      const [rows] = await db.execute(query, [date]);
      
      if (rows.length === 0) {
        return null;
      }

      return new CommissionReport(rows[0]);
    } catch (error) {
      logger.error('Error finding commission report by date:', error);
      throw error;
    }
  }

  // Find all commission reports with filtering
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        startDate = null,
        endDate = null
      } = options;

      const offset = (page - 1) * limit;
      const conditions = [];
      const values = [];

      if (startDate) {
        conditions.push('report_date >= ?');
        values.push(startDate);
      }

      if (endDate) {
        conditions.push('report_date <= ?');
        values.push(endDate);
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      const query = `
        SELECT * FROM commission_reports
        ${whereClause}
        ORDER BY report_date DESC
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM commission_reports
        ${whereClause}
      `;

      values.push(limit, offset);
      const [rows] = await db.execute(query, values);
      const [countRows] = await db.execute(countQuery, values.slice(0, -2));

      const reports = rows.map(row => new CommissionReport(row));
      const total = countRows[0].total;

      return {
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding commission reports:', error);
      throw error;
    }
  }

  // Generate commission report for a specific date
  static async generateReport(date) {
    try {
      // Check if report already exists for this date
      const existingReport = await this.findByDate(date);
      if (existingReport) {
        return existingReport;
      }

      // Get booking data for the date
      const bookingQuery = `
        SELECT 
          COUNT(*) as total_bookings,
          SUM(amount) as total_booking_amount,
          SUM(admin_commission_amount) as total_commission_amount
        FROM booking_payments
        WHERE DATE(created_at) = ? AND status = 'completed'
      `;

      const [bookingRows] = await db.execute(bookingQuery, [date]);
      const bookingData = bookingRows[0];

      // Get withdrawal data for the date
      const withdrawalQuery = `
        SELECT 
          COUNT(*) as total_withdrawals,
          SUM(amount) as total_withdrawal_amount
        FROM withdrawal_requests
        WHERE DATE(created_at) = ? AND status = 'completed'
      `;

      const [withdrawalRows] = await db.execute(withdrawalQuery, [date]);
      const withdrawalData = withdrawalRows[0];

      // Get withdrawal fees for the date
      const withdrawalFeesQuery = `
        SELECT SUM(commission_amount) as total_withdrawal_fees
        FROM commission_transactions
        WHERE transaction_type = 'withdrawal_fee' 
        AND DATE(created_at) = ? 
        AND status = 'collected'
      `;

      const [withdrawalFeesRows] = await db.execute(withdrawalFeesQuery, [date]);
      const withdrawalFeesData = withdrawalFeesRows[0];

      // Calculate net commission
      const netCommission = (bookingData.total_commission_amount || 0) + (withdrawalFeesData.total_withdrawal_fees || 0);

      // Create report data
      const reportData = {
        report_date: date,
        total_bookings: bookingData.total_bookings || 0,
        total_booking_amount: bookingData.total_booking_amount || 0.00,
        total_commission_amount: bookingData.total_commission_amount || 0.00,
        total_withdrawals: withdrawalData.total_withdrawals || 0,
        total_withdrawal_fees: withdrawalFeesData.total_withdrawal_fees || 0.00,
        net_commission: netCommission
      };

      return await this.create(reportData);
    } catch (error) {
      logger.error('Error generating commission report:', error);
      throw error;
    }
  }

  // Get commission statistics
  static async getStatistics(period = '30') {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_reports,
          SUM(total_bookings) as total_bookings,
          SUM(total_booking_amount) as total_booking_amount,
          SUM(total_commission_amount) as total_commission_amount,
          SUM(total_withdrawals) as total_withdrawals,
          SUM(total_withdrawal_fees) as total_withdrawal_fees,
          SUM(net_commission) as total_net_commission,
          AVG(net_commission) as average_daily_commission
        FROM commission_reports
        WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      `;

      const [rows] = await db.execute(query, [period]);
      return rows[0];
    } catch (error) {
      logger.error('Error getting commission statistics:', error);
      throw error;
    }
  }

  // Get commission trends
  static async getTrends(period = '30') {
    try {
      const query = `
        SELECT 
          report_date,
          total_bookings,
          total_booking_amount,
          total_commission_amount,
          net_commission
        FROM commission_reports
        WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ORDER BY report_date ASC
      `;

      const [rows] = await db.execute(query, [period]);
      return rows;
    } catch (error) {
      logger.error('Error getting commission trends:', error);
      throw error;
    }
  }

  // Validate report data
  static validateReportData(data) {
    const errors = [];

    if (!data.report_date) {
      errors.push('Report date is required');
    }

    if (data.total_bookings && data.total_bookings < 0) {
      errors.push('Total bookings cannot be negative');
    }

    if (data.total_booking_amount && data.total_booking_amount < 0) {
      errors.push('Total booking amount cannot be negative');
    }

    if (data.total_commission_amount && data.total_commission_amount < 0) {
      errors.push('Total commission amount cannot be negative');
    }

    if (data.total_withdrawals && data.total_withdrawals < 0) {
      errors.push('Total withdrawals cannot be negative');
    }

    if (data.total_withdrawal_fees && data.total_withdrawal_fees < 0) {
      errors.push('Total withdrawal fees cannot be negative');
    }

    if (data.net_commission && data.net_commission < 0) {
      errors.push('Net commission cannot be negative');
    }

    return errors;
  }

  // Convert to JSON for API response
  toJSON() {
    return {
      id: this.id,
      report_date: this.report_date,
      total_bookings: this.total_bookings,
      total_booking_amount: this.total_booking_amount,
      total_commission_amount: this.total_commission_amount,
      total_withdrawals: this.total_withdrawals,
      total_withdrawal_fees: this.total_withdrawal_fees,
      net_commission: this.net_commission,
      created_at: this.created_at
    };
  }
}

module.exports = CommissionReport; 