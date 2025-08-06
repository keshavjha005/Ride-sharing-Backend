const CommissionReport = require('../models/CommissionReport');
const CommissionTransaction = require('../models/CommissionTransaction');
const BookingPayment = require('../models/BookingPayment');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get commission settings (Admin only)
 * GET /api/admin/commission/settings
 */
const getCommissionSettings = async (req, res) => {
  try {
    const settings = await BookingPayment.getCommissionSettings();
    
    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    logger.error('Error getting commission settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission settings',
      error: error.message
    });
  }
};

/**
 * Update commission settings (Admin only)
 * PUT /api/admin/commission/settings
 */
const updateCommissionSettings = async (req, res) => {
  try {
    const { commissionType, commissionPercentage, commissionAmount, minimumAmount, maximumAmount } = req.body;

    // Validate input
    if (!commissionType || !['booking', 'withdrawal', 'per_km'].includes(commissionType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid commission type is required'
      });
    }

    if (commissionPercentage !== undefined && (commissionPercentage < 0 || commissionPercentage > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Commission percentage must be between 0 and 100'
      });
    }

    if (commissionAmount !== undefined && commissionAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Commission amount cannot be negative'
      });
    }

    if (minimumAmount !== undefined && minimumAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount cannot be negative'
      });
    }

    if (maximumAmount !== undefined && maximumAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Maximum amount cannot be negative'
      });
    }

    // Deactivate current settings
    await db.execute(
      'UPDATE commission_settings SET is_active = false WHERE commission_type = ?',
      [commissionType]
    );

    // Create new settings
    const query = `
      INSERT INTO commission_settings (
        id, commission_type, commission_percentage, commission_amount,
        minimum_amount, maximum_amount, is_active, effective_from
      ) VALUES (UUID(), ?, ?, ?, ?, ?, true, NOW())
    `;

    await db.execute(query, [
      commissionType,
      commissionPercentage || 0,
      commissionAmount || null,
      minimumAmount || 0,
      maximumAmount || null
    ]);

    // Get updated settings
    const updatedSettings = await BookingPayment.getCommissionSettings(commissionType);

    res.json({
      success: true,
      message: 'Commission settings updated successfully',
      data: updatedSettings
    });

  } catch (error) {
    logger.error('Error updating commission settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update commission settings',
      error: error.message
    });
  }
};

/**
 * Get commission reports (Admin only)
 * GET /api/admin/commission/reports
 */
const getCommissionReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate
    };

    const result = await CommissionReport.findAll(options);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error getting commission reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission reports',
      error: error.message
    });
  }
};

/**
 * Generate commission report for a specific date (Admin only)
 * POST /api/admin/commission/reports/generate
 */
const generateCommissionReport = async (req, res) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Validate date format
    const reportDate = new Date(date);
    if (isNaN(reportDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const report = await CommissionReport.generateReport(date);

    res.json({
      success: true,
      message: 'Commission report generated successfully',
      data: report.toJSON()
    });

  } catch (error) {
    logger.error('Error generating commission report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate commission report',
      error: error.message
    });
  }
};

/**
 * Get commission analytics (Admin only)
 * GET /api/admin/commission/analytics
 */
const getCommissionAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;

    // Get commission statistics
    const stats = await CommissionReport.getStatistics(period);
    
    // Get commission trends
    const trends = await CommissionReport.getTrends(period);
    
    // Get commission transaction statistics
    const transactionStats = await CommissionTransaction.getStatistics(period);
    const transactionStatsByType = await CommissionTransaction.getStatisticsByType(period);

    // Get top earning days
    const topEarningDaysQuery = `
      SELECT 
        report_date,
        net_commission,
        total_bookings,
        total_booking_amount
      FROM commission_reports
      WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY net_commission DESC
      LIMIT 10
    `;

    const [topEarningDays] = await db.execute(topEarningDaysQuery, [period]);

    // Get commission breakdown by type
    const commissionBreakdownQuery = `
      SELECT 
        transaction_type,
        COUNT(*) as count,
        SUM(commission_amount) as total_amount,
        AVG(commission_percentage) as average_percentage
      FROM commission_transactions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY transaction_type
    `;

    const [commissionBreakdown] = await db.execute(commissionBreakdownQuery, [period]);

    const analytics = {
      overview: {
        period: period,
        total_reports: stats.total_reports || 0,
        total_bookings: stats.total_bookings || 0,
        total_booking_amount: stats.total_booking_amount || 0,
        total_commission_amount: stats.total_commission_amount || 0,
        total_withdrawals: stats.total_withdrawals || 0,
        total_withdrawal_fees: stats.total_withdrawal_fees || 0,
        total_net_commission: stats.total_net_commission || 0,
        average_daily_commission: stats.average_daily_commission || 0
      },
      trends: trends,
      transaction_statistics: {
        overall: transactionStats,
        by_type: transactionStatsByType
      },
      top_earning_days: topEarningDays,
      commission_breakdown: commissionBreakdown,
      generated_at: new Date()
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Error getting commission analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission analytics',
      error: error.message
    });
  }
};

/**
 * Get commission dashboard data (Admin only)
 * GET /api/admin/commission/dashboard
 */
const getCommissionDashboard = async (req, res) => {
  try {
    // Get today's commission data
    const today = new Date().toISOString().split('T')[0];
    const todayReport = await CommissionReport.findByDate(today);

    // Get this month's commission data
    const thisMonthQuery = `
      SELECT 
        SUM(total_bookings) as total_bookings,
        SUM(total_booking_amount) as total_booking_amount,
        SUM(total_commission_amount) as total_commission_amount,
        SUM(total_withdrawals) as total_withdrawals,
        SUM(total_withdrawal_fees) as total_withdrawal_fees,
        SUM(net_commission) as total_net_commission
      FROM commission_reports
      WHERE YEAR(report_date) = YEAR(CURDATE()) 
      AND MONTH(report_date) = MONTH(CURDATE())
    `;

    const [thisMonthData] = await db.execute(thisMonthQuery);

    // Get yesterday's commission data for comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    const yesterdayReport = await CommissionReport.findByDate(yesterdayDate);

    // Get pending commission transactions
    const pendingCommissionsQuery = `
      SELECT COUNT(*) as count, SUM(commission_amount) as total_amount
      FROM commission_transactions
      WHERE status = 'pending'
    `;

    const [pendingCommissions] = await db.execute(pendingCommissionsQuery);

    // Get recent commission transactions
    const recentTransactionsQuery = `
      SELECT ct.*, 
             bp.amount as booking_payment_amount,
             u.first_name, u.last_name
      FROM commission_transactions ct
      LEFT JOIN booking_payments bp ON ct.booking_payment_id = bp.id
      LEFT JOIN users u ON bp.user_id = u.id
      ORDER BY ct.created_at DESC
      LIMIT 10
    `;

    const [recentTransactions] = await db.execute(recentTransactionsQuery);

    const dashboard = {
      today: todayReport ? todayReport.toJSON() : {
        report_date: today,
        total_bookings: 0,
        total_booking_amount: 0,
        total_commission_amount: 0,
        total_withdrawals: 0,
        total_withdrawal_fees: 0,
        net_commission: 0
      },
      yesterday: yesterdayReport ? yesterdayReport.toJSON() : {
        report_date: yesterdayDate,
        total_bookings: 0,
        total_booking_amount: 0,
        total_commission_amount: 0,
        total_withdrawals: 0,
        total_withdrawal_fees: 0,
        net_commission: 0
      },
      this_month: thisMonthData[0] || {
        total_bookings: 0,
        total_booking_amount: 0,
        total_commission_amount: 0,
        total_withdrawals: 0,
        total_withdrawal_fees: 0,
        total_net_commission: 0
      },
      pending_commissions: pendingCommissions[0] || {
        count: 0,
        total_amount: 0
      },
      recent_transactions: recentTransactions,
      generated_at: new Date()
    };

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    logger.error('Error getting commission dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission dashboard',
      error: error.message
    });
  }
};

/**
 * Export commission data (Admin only)
 * GET /api/admin/commission/export
 */
const exportCommissionData = async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Get commission reports for the date range
    const reportsQuery = `
      SELECT * FROM commission_reports
      WHERE report_date >= ? AND report_date <= ?
      ORDER BY report_date DESC
    `;

    const [reports] = await db.execute(reportsQuery, [startDate, endDate]);

    // Get commission transactions for the date range
    const transactionsQuery = `
      SELECT ct.*, 
             bp.amount as booking_payment_amount,
             bp.payment_method,
             u.first_name, u.last_name, u.email
      FROM commission_transactions ct
      LEFT JOIN booking_payments bp ON ct.booking_payment_id = bp.id
      LEFT JOIN users u ON bp.user_id = u.id
      WHERE ct.created_at >= ? AND ct.created_at <= ?
      ORDER BY ct.created_at DESC
    `;

    const [transactions] = await db.execute(transactionsQuery, [startDate, endDate]);

    const exportData = {
      period: {
        start_date: startDate,
        end_date: endDate
      },
      reports: reports,
      transactions: transactions,
      summary: {
        total_reports: reports.length,
        total_transactions: transactions.length,
        total_commission: reports.reduce((sum, report) => sum + parseFloat(report.net_commission), 0)
      },
      exported_at: new Date()
    };

    if (format === 'csv') {
      // TODO: Implement CSV export
      res.json({
        success: true,
        message: 'CSV export not yet implemented',
        data: exportData
      });
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }

  } catch (error) {
    logger.error('Error exporting commission data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export commission data',
      error: error.message
    });
  }
};

module.exports = {
  getCommissionSettings,
  updateCommissionSettings,
  getCommissionReports,
  generateCommissionReport,
  getCommissionAnalytics,
  getCommissionDashboard,
  exportCommissionData
}; 