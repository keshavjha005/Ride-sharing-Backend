const logger = require('../utils/logger');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const PaymentTransaction = require('../models/PaymentTransaction');
const BookingPayment = require('../models/BookingPayment');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const CommissionTransaction = require('../models/CommissionTransaction');
const User = require('../models/User');
const { executeQuery } = require('../config/database');
const moment = require('moment');

/**
 * Financial Controller
 * Handles comprehensive financial reporting and analytics for admin panel
 */

/**
 * Get financial dashboard data (Admin only)
 * GET /api/admin/financial/dashboard
 */
const getFinancialDashboard = async (req, res) => {
  try {
    const today = moment().startOf('day');
    const thisMonth = moment().startOf('month');
    const lastMonth = moment().subtract(1, 'month').startOf('month');

    // Get today's metrics
    const todayMetrics = await getDailyMetrics(today);
    
    // Get this month's metrics
    const thisMonthMetrics = await getMonthlyMetrics(thisMonth);
    
    // Get last month's metrics for comparison
    const lastMonthMetrics = await getMonthlyMetrics(lastMonth);
    
    // Get recent transactions
    const recentTransactions = await getRecentTransactions(10);
    
    // Get top performing users
    const topUsers = await getTopPerformingUsers(5);
    
    // Get financial alerts
    const alerts = await getFinancialAlerts();

    const dashboard = {
      today: todayMetrics,
      thisMonth: thisMonthMetrics,
      lastMonth: lastMonthMetrics,
      comparison: {
        revenueChange: calculatePercentageChange(thisMonthMetrics.totalRevenue, lastMonthMetrics.totalRevenue),
        transactionChange: calculatePercentageChange(thisMonthMetrics.totalTransactions, lastMonthMetrics.totalTransactions),
        userChange: calculatePercentageChange(thisMonthMetrics.activeUsers, lastMonthMetrics.activeUsers)
      },
      recentTransactions,
      topUsers,
      alerts
    };

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    logger.error('Error getting financial dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get financial dashboard'
    });
  }
};

/**
 * Get revenue reports (Admin only)
 * GET /api/admin/financial/revenue
 */
const getRevenueReports = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      period = 'daily',
      page = 1, 
      limit = 20 
    } = req.query;

    const start = startDate ? moment(startDate).startOf('day') : moment().subtract(30, 'days').startOf('day');
    const end = endDate ? moment(endDate).endOf('day') : moment().endOf('day');

    const offset = (page - 1) * limit;

    // Get revenue data based on period
    let revenueData;
    switch (period) {
      case 'hourly':
        revenueData = await getHourlyRevenue(start, end, limit, offset);
        break;
      case 'daily':
        revenueData = await getDailyRevenue(start, end, limit, offset);
        break;
      case 'weekly':
        revenueData = await getWeeklyRevenue(start, end, limit, offset);
        break;
      case 'monthly':
        revenueData = await getMonthlyRevenue(start, end, limit, offset);
        break;
      default:
        revenueData = await getDailyRevenue(start, end, limit, offset);
    }

    // Get summary statistics
    const summary = await getRevenueSummary(start, end);

    res.json({
      success: true,
      data: {
        revenue: revenueData,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: summary.totalRecords
        }
      }
    });

  } catch (error) {
    logger.error('Error getting revenue reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue reports'
    });
  }
};

/**
 * Get transaction reports (Admin only)
 * GET /api/admin/financial/transactions
 */
const getTransactionReports = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      type,
      status,
      page = 1, 
      limit = 20 
    } = req.query;

    const start = startDate ? moment(startDate).startOf('day') : moment().subtract(30, 'days').startOf('day');
    const end = endDate ? moment(endDate).endOf('day') : moment().endOf('day');

    const offset = (page - 1) * limit;

    // Get transactions with filters
    const transactions = await getTransactionsWithFilters(start, end, type, status, limit, offset);
    const totalCount = await getTransactionCount(start, end, type, status);

    // Get transaction summary
    const summary = await getTransactionSummary(start, end, type, status);

    res.json({
      success: true,
      data: {
        transactions: transactions,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount
        }
      }
    });

  } catch (error) {
    logger.error('Error getting transaction reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction reports'
    });
  }
};

/**
 * Get user financial report (Admin only)
 * GET /api/admin/financial/users/:id
 */
const getUserFinancialReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? moment(startDate).startOf('day') : moment().subtract(30, 'days').startOf('day');
    const end = endDate ? moment(endDate).endOf('day') : moment().endOf('day');

    // Get user details
    const user = await User.getById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user wallet
    const wallet = await Wallet.getByUserId(id);

    // Get user transactions
    const transactions = await WalletTransaction.getByUserId(id, {
      startDate: start.toDate(),
      endDate: end.toDate()
    });

    // Get user bookings and payments
    const bookings = await BookingPayment.getByUserId(id, {
      startDate: start.toDate(),
      endDate: end.toDate()
    });

    // Get user withdrawals
    const withdrawals = await WithdrawalRequest.getByUserId(id, {
      startDate: start.toDate(),
      endDate: end.toDate()
    });

    // Calculate user statistics
    const stats = calculateUserFinancialStats(transactions, bookings, withdrawals);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        },
        wallet: {
          balance: wallet.balance,
          currency: wallet.currency_code,
          dailyLimit: wallet.daily_limit,
          monthlyLimit: wallet.monthly_limit
        },
        statistics: stats,
        transactions,
        bookings,
        withdrawals
      }
    });

  } catch (error) {
    logger.error('Error getting user financial report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user financial report'
    });
  }
};

/**
 * Export financial data (Admin only)
 * POST /api/admin/financial/export
 */
const exportFinancialData = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      type = 'transactions',
      format = 'json' 
    } = req.body;

    const start = moment(startDate).startOf('day');
    const end = moment(endDate).endOf('day');

    let data;
    let filename;

    switch (type) {
      case 'transactions':
        data = await exportTransactions(start, end);
        filename = `transactions_${start.format('YYYY-MM-DD')}_${end.format('YYYY-MM-DD')}`;
        break;
      case 'revenue':
        data = await exportRevenue(start, end);
        filename = `revenue_${start.format('YYYY-MM-DD')}_${end.format('YYYY-MM-DD')}`;
        break;
      case 'users':
        data = await exportUserFinancials(start, end);
        filename = `users_financial_${start.format('YYYY-MM-DD')}_${end.format('YYYY-MM-DD')}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    if (format === 'csv') {
      const csvData = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json(data);
    }

  } catch (error) {
    logger.error('Error exporting financial data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export financial data'
    });
  }
};

/**
 * Get financial alerts (Admin only)
 * GET /api/admin/financial/alerts
 */
const getFinancialAlerts = async (req, res) => {
  try {
    const alerts = await generateFinancialAlerts();

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    logger.error('Error getting financial alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get financial alerts'
    });
  }
};

// Helper functions

/**
 * Get daily metrics
 */
const getDailyMetrics = async (date) => {
  const startOfDay = date.toDate();
  const endOfDay = date.endOf('day').toDate();

  const [
    totalRevenue,
    totalTransactions,
    activeUsers,
    newUsers,
    totalWithdrawals,
    totalCommission
  ] = await Promise.all([
    // Total revenue
    getTotalRevenue(startOfDay, endOfDay),
    // Total transactions
    getTotalTransactions(startOfDay, endOfDay),
    // Active users (users with transactions)
    getActiveUsers(startOfDay, endOfDay),
    // New users
    getNewUsers(startOfDay, endOfDay),
    // Total withdrawals
    getTotalWithdrawals(startOfDay, endOfDay),
    // Total commission
    getTotalCommission(startOfDay, endOfDay)
  ]);

  return {
    totalRevenue,
    totalTransactions,
    activeUsers,
    newUsers,
    totalWithdrawals,
    totalCommission
  };
};

/**
 * Get monthly metrics
 */
const getMonthlyMetrics = async (monthStart) => {
  const startOfMonth = monthStart.toDate();
  const endOfMonth = monthStart.endOf('month').toDate();

  return await getDailyMetrics(moment(startOfMonth));
};

/**
 * Get recent transactions
 */
const getRecentTransactions = async (limit = 10) => {
  const query = `
    SELECT wt.*, w.user_id, u.name, u.email
    FROM wallet_transactions wt
    JOIN wallets w ON wt.wallet_id = w.id
    JOIN users u ON w.user_id = u.id
    ORDER BY wt.created_at DESC
    LIMIT ?
  `;
  
  const rows = await executeQuery(query, [parseInt(limit)]);
  return rows;
};

/**
 * Get top performing users
 */
const getTopPerformingUsers = async (limit = 5) => {
  const query = `
    SELECT w.user_id, u.name, u.email, 
           SUM(wt.amount) as totalAmount, 
           COUNT(wt.id) as transactionCount
    FROM wallet_transactions wt
    JOIN wallets w ON wt.wallet_id = w.id
    JOIN users u ON w.user_id = u.id
    WHERE wt.transaction_type = 'credit' AND wt.status = 'completed'
    GROUP BY w.user_id
    ORDER BY totalAmount DESC
    LIMIT ?
  `;
  
  const rows = await executeQuery(query, [parseInt(limit)]);
  return rows;
};

/**
 * Calculate percentage change
 */
const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Get revenue summary
 */
const getRevenueSummary = async (start, end) => {
  const query = `
    SELECT 
      SUM(amount) as totalRevenue,
      COUNT(*) as totalTransactions,
      AVG(amount) as averageTransaction,
      COUNT(DISTINCT user_id) as totalUsers
    FROM booking_payments 
    WHERE status = 'completed' 
    AND created_at BETWEEN ? AND ?
  `;
  
  const rows = await executeQuery(query, [start.toDate(), end.toDate()]);
  const result = rows[0];
  
  return {
    totalRevenue: parseFloat(result.totalRevenue) || 0,
    totalTransactions: parseInt(result.totalTransactions) || 0,
    averageTransaction: parseFloat(result.averageTransaction) || 0,
    totalUsers: parseInt(result.totalUsers) || 0,
    totalRecords: parseInt(result.totalTransactions) || 0
  };
};

/**
 * Get daily revenue
 */
const getDailyRevenue = async (start, end, limit, offset) => {
  const query = `
    SELECT 
      DATE(created_at) as date,
      SUM(amount) as revenue,
      COUNT(*) as transactions
    FROM booking_payments 
    WHERE status = 'completed' 
    AND created_at BETWEEN ? AND ?
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `;
  
  const rows = await executeQuery(query, [start.toDate(), end.toDate(), parseInt(limit), parseInt(offset)]);
  return rows;
};

/**
 * Get hourly revenue
 */
const getHourlyRevenue = async (start, end, limit, offset) => {
  const query = `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as hour,
      SUM(amount) as revenue,
      COUNT(*) as transactions
    FROM booking_payments 
    WHERE status = 'completed' 
    AND created_at BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00')
    ORDER BY hour DESC
    LIMIT ? OFFSET ?
  `;
  
  const rows = await executeQuery(query, [start.toDate(), end.toDate(), parseInt(limit), parseInt(offset)]);
  return rows;
};

/**
 * Get weekly revenue
 */
const getWeeklyRevenue = async (start, end, limit, offset) => {
  const query = `
    SELECT 
      YEARWEEK(created_at) as week,
      SUM(amount) as revenue,
      COUNT(*) as transactions
    FROM booking_payments 
    WHERE status = 'completed' 
    AND created_at BETWEEN ? AND ?
    GROUP BY YEARWEEK(created_at)
    ORDER BY week DESC
    LIMIT ? OFFSET ?
  `;
  
  const rows = await executeQuery(query, [start.toDate(), end.toDate(), parseInt(limit), parseInt(offset)]);
  return rows;
};

/**
 * Get monthly revenue
 */
const getMonthlyRevenue = async (start, end, limit, offset) => {
  const query = `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m') as month,
      SUM(amount) as revenue,
      COUNT(*) as transactions
    FROM booking_payments 
    WHERE status = 'completed' 
    AND created_at BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
    ORDER BY month DESC
    LIMIT ? OFFSET ?
  `;
  
  const rows = await executeQuery(query, [start.toDate(), end.toDate(), parseInt(limit), parseInt(offset)]);
  return rows;
};

/**
 * Get transactions with filters
 */
const getTransactionsWithFilters = async (start, end, type, status, limit, offset) => {
  let query = `
    SELECT wt.*, w.user_id, u.name, u.email
    FROM wallet_transactions wt
    JOIN wallets w ON wt.wallet_id = w.id
    JOIN users u ON w.user_id = u.id
    WHERE wt.created_at BETWEEN ? AND ?
  `;
  
  const values = [start.toDate(), end.toDate()];
  
  if (type) {
    query += ' AND wt.transaction_type = ?';
    values.push(type);
  }
  
  if (status) {
    query += ' AND wt.status = ?';
    values.push(status);
  }
  
  query += ' ORDER BY wt.created_at DESC LIMIT ? OFFSET ?';
  values.push(parseInt(limit), parseInt(offset));
  
  const rows = await executeQuery(query, values);
  return rows;
};

/**
 * Get transaction count
 */
const getTransactionCount = async (start, end, type, status) => {
  let query = `
    SELECT COUNT(*) as count
    FROM wallet_transactions wt
    WHERE wt.created_at BETWEEN ? AND ?
  `;
  
  const values = [start.toDate(), end.toDate()];
  
  if (type) {
    query += ' AND wt.transaction_type = ?';
    values.push(type);
  }
  
  if (status) {
    query += ' AND wt.status = ?';
    values.push(status);
  }
  
  const rows = await executeQuery(query, values);
  return parseInt(rows[0].count);
};

/**
 * Get transaction summary
 */
const getTransactionSummary = async (start, end, type, status) => {
  let query = `
    SELECT 
      SUM(amount) as totalAmount,
      COUNT(*) as totalTransactions,
      AVG(amount) as averageAmount
    FROM wallet_transactions 
    WHERE created_at BETWEEN ? AND ?
  `;
  
  const values = [start.toDate(), end.toDate()];
  
  if (type) {
    query += ' AND transaction_type = ?';
    values.push(type);
  }
  
  if (status) {
    query += ' AND status = ?';
    values.push(status);
  }
  
  const rows = await executeQuery(query, values);
  const result = rows[0];
  
  return {
    totalAmount: parseFloat(result.totalAmount) || 0,
    totalTransactions: parseInt(result.totalTransactions) || 0,
    averageAmount: parseFloat(result.averageAmount) || 0
  };
};

/**
 * Calculate user financial stats
 */
const calculateUserFinancialStats = (transactions, bookings, withdrawals) => {
  const totalSpent = bookings.reduce((sum, booking) => sum + parseFloat(booking.amount || 0), 0);
  const totalEarned = transactions
    .filter(t => t.transaction_type === 'credit')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);

  return {
    totalSpent,
    totalEarned,
    totalWithdrawn,
    netBalance: totalEarned - totalSpent - totalWithdrawn,
    transactionCount: transactions.length,
    bookingCount: bookings.length,
    withdrawalCount: withdrawals.length
  };
};

/**
 * Generate financial alerts
 */
const generateFinancialAlerts = async () => {
  const alerts = [];

  // Check for low balance wallets
  const lowBalanceQuery = `
    SELECT w.*, u.name, u.email
    FROM wallets w
    JOIN users u ON w.user_id = u.id
    WHERE w.balance < 10.00
  `;
  
  const lowBalanceWallets = await executeQuery(lowBalanceQuery);
  
  lowBalanceWallets.forEach(wallet => {
    alerts.push({
      type: 'low_balance',
      severity: 'warning',
      message: `User ${wallet.name} has low balance: $${wallet.balance}`,
      userId: wallet.user_id,
      data: { balance: wallet.balance }
    });
  });

  // Check for high value transactions
  const highValueQuery = `
    SELECT wt.*, w.user_id, u.name, u.email
    FROM wallet_transactions wt
    JOIN wallets w ON wt.wallet_id = w.id
    JOIN users u ON w.user_id = u.id
    WHERE wt.amount > 1000.00
    AND wt.created_at >= ?
  `;
  
  const highValueTransactions = await executeQuery(highValueQuery, [moment().subtract(24, 'hours').toDate()]);
  
  highValueTransactions.forEach(transaction => {
    alerts.push({
      type: 'high_transaction',
      severity: 'info',
      message: `High value transaction: $${transaction.amount} by ${transaction.name}`,
      userId: transaction.user_id,
      data: { amount: transaction.amount, transactionId: transaction.id }
    });
  });

  return alerts;
};

/**
 * Export transactions
 */
const exportTransactions = async (start, end) => {
  const query = `
    SELECT wt.id, w.user_id, u.name, u.email, wt.transaction_type, wt.amount, 
           wt.balance_after, wt.transaction_category, wt.status, wt.description, wt.created_at
    FROM wallet_transactions wt
    JOIN wallets w ON wt.wallet_id = w.id
    JOIN users u ON w.user_id = u.id
    WHERE wt.created_at BETWEEN ? AND ?
    ORDER BY wt.created_at DESC
  `;
  
  const rows = await executeQuery(query, [start.toDate(), end.toDate()]);
  
  return rows.map(t => ({
    id: t.id,
    userId: t.user_id,
    userName: t.name,
    userEmail: t.email,
    type: t.transaction_type,
    amount: t.amount,
    balance: t.balance_after,
    category: t.transaction_category,
    status: t.status,
    description: t.description,
    createdAt: t.created_at
  }));
};

/**
 * Export revenue
 */
const exportRevenue = async (start, end) => {
  const query = `
    SELECT bp.id, bp.user_id, u.name, u.email, bp.amount, bp.payment_method, 
           bp.status, bp.admin_commission_amount, bp.driver_earning_amount, bp.created_at
    FROM booking_payments bp
    JOIN users u ON bp.user_id = u.id
    WHERE bp.status = 'completed' AND bp.created_at BETWEEN ? AND ?
    ORDER BY bp.created_at DESC
  `;
  
  const rows = await executeQuery(query, [start.toDate(), end.toDate()]);
  
  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    userName: r.name,
    userEmail: r.email,
    amount: r.amount,
    paymentMethod: r.payment_method,
    status: r.status,
    commission: r.admin_commission_amount,
    driverEarning: r.driver_earning_amount,
    createdAt: r.created_at
  }));
};

/**
 * Export user financials
 */
const exportUserFinancials = async (start, end) => {
  const query = `
    SELECT u.id, u.name, u.email, w.balance as currentBalance
    FROM users u
    LEFT JOIN wallets w ON u.id = w.user_id
  `;
  
  const users = await executeQuery(query);
  
  const result = [];
  for (const user of users) {
    const transactions = await WalletTransaction.getByUserId(user.id, {
      startDate: start.toDate(),
      endDate: end.toDate()
    });
    
    const totalSpent = transactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const totalEarned = transactions
      .filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    result.push({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      currentBalance: user.currentBalance || 0,
      totalSpent,
      totalEarned,
      netBalance: totalEarned - totalSpent,
      transactionCount: transactions.length
    });
  }
  
  return result;
};

/**
 * Convert data to CSV
 */
const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
};

// Database helper functions
const getTotalRevenue = async (start, end) => {
  const query = `
    SELECT SUM(amount) as total
    FROM booking_payments 
    WHERE status = 'completed' AND created_at BETWEEN ? AND ?
  `;
  const rows = await executeQuery(query, [start, end]);
  return parseFloat(rows[0].total) || 0;
};

const getTotalTransactions = async (start, end) => {
  const query = `
    SELECT COUNT(*) as total
    FROM wallet_transactions 
    WHERE status = 'completed' AND created_at BETWEEN ? AND ?
  `;
  const rows = await executeQuery(query, [start, end]);
  return parseInt(rows[0].total) || 0;
};

const getActiveUsers = async (start, end) => {
  const query = `
    SELECT COUNT(DISTINCT w.user_id) as total
    FROM wallet_transactions wt
    JOIN wallets w ON wt.wallet_id = w.id
    WHERE wt.created_at BETWEEN ? AND ?
  `;
  const rows = await executeQuery(query, [start, end]);
  return parseInt(rows[0].total) || 0;
};

const getNewUsers = async (start, end) => {
  const query = `
    SELECT COUNT(*) as total
    FROM users 
    WHERE created_at BETWEEN ? AND ?
  `;
  const rows = await executeQuery(query, [start, end]);
  return parseInt(rows[0].total) || 0;
};

const getTotalWithdrawals = async (start, end) => {
  const query = `
    SELECT SUM(amount) as total
    FROM withdrawal_requests 
    WHERE status = 'completed' AND created_at BETWEEN ? AND ?
  `;
  const rows = await executeQuery(query, [start, end]);
  return parseFloat(rows[0].total) || 0;
};

const getTotalCommission = async (start, end) => {
  const query = `
    SELECT SUM(commission_amount) as total
    FROM commission_transactions 
    WHERE status = 'collected' AND created_at BETWEEN ? AND ?
  `;
  const rows = await executeQuery(query, [start, end]);
  return parseFloat(rows[0].total) || 0;
};

module.exports = {
  getFinancialDashboard,
  getRevenueReports,
  getTransactionReports,
  getUserFinancialReport,
  exportFinancialData,
  getFinancialAlerts
}; 