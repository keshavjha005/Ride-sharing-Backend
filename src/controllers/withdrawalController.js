const { validationResult } = require('express-validator');
const WithdrawalService = require('../services/withdrawalService');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const PayoutTransaction = require('../models/PayoutTransaction');
const logger = require('../utils/logger');

/**
 * Create withdrawal request
 * POST /api/withdrawals/request
 */
const createWithdrawalRequest = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { amount, withdrawalMethod, accountDetails } = req.body;
    const userId = req.user.id;

    // Create withdrawal request
    const withdrawalRequest = await WithdrawalService.createWithdrawalRequest(
      userId,
      amount,
      withdrawalMethod,
      accountDetails
    );

    logger.info(`Withdrawal request created: ${withdrawalRequest.id} by user: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      data: withdrawalRequest.toJSON()
    });

  } catch (error) {
    logger.error('Error creating withdrawal request:', error);
    
    if (error.message.includes('Minimum') || error.message.includes('Maximum') || 
        error.message.includes('limit exceeded') || error.message.includes('Insufficient') ||
        error.message.includes('pending') || error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create withdrawal request',
      error: error.message
    });
  }
};

/**
 * Get withdrawal requests for user
 * GET /api/withdrawals/requests
 */
const getWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      status,
      withdrawal_method
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      withdrawal_method
    };

    const result = await WithdrawalRequest.findByUserId(userId, options);

    res.json({
      success: true,
      data: {
        withdrawalRequests: result.withdrawalRequests.map(req => req.toJSON()),
        pagination: result.pagination
      }
    });

  } catch (error) {
    logger.error('Error getting withdrawal requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal requests',
      error: error.message
    });
  }
};

/**
 * Get withdrawal request details
 * GET /api/withdrawals/requests/:id
 */
const getWithdrawalRequestDetails = async (req, res) => {
  try {
    const { id: withdrawalRequestId } = req.params;
    const userId = req.user.id;

    const withdrawalRequest = await WithdrawalRequest.findById(withdrawalRequestId);
    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawalRequest.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this withdrawal request'
      });
    }

    // Get payout transactions
    const payoutTransactions = await PayoutTransaction.findByWithdrawalRequestId(withdrawalRequestId);

    const result = {
      withdrawalRequest: withdrawalRequest.toJSON(),
      payoutTransactions: payoutTransactions.map(pt => pt.toJSON())
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error getting withdrawal request details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal request details',
      error: error.message
    });
  }
};

/**
 * Approve withdrawal request (Admin only)
 * PUT /api/withdrawals/requests/:id/approve
 */
const approveWithdrawalRequest = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id: withdrawalRequestId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.id;

    // Process withdrawal request
    const withdrawalRequest = await WithdrawalService.processWithdrawalRequest(
      withdrawalRequestId,
      'approve',
      adminNotes
    );

    logger.info(`Withdrawal request approved: ${withdrawalRequestId} by admin: ${adminId}`);

    res.json({
      success: true,
      message: 'Withdrawal request approved successfully',
      data: withdrawalRequest.toJSON()
    });

  } catch (error) {
    logger.error('Error approving withdrawal request:', error);
    
    if (error.message.includes('not found') || error.message.includes('not in pending status')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to approve withdrawal request',
      error: error.message
    });
  }
};

/**
 * Reject withdrawal request (Admin only)
 * PUT /api/withdrawals/requests/:id/reject
 */
const rejectWithdrawalRequest = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id: withdrawalRequestId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.id;

    // Process withdrawal request
    const withdrawalRequest = await WithdrawalService.processWithdrawalRequest(
      withdrawalRequestId,
      'reject',
      adminNotes
    );

    logger.info(`Withdrawal request rejected: ${withdrawalRequestId} by admin: ${adminId}`);

    res.json({
      success: true,
      message: 'Withdrawal request rejected successfully',
      data: withdrawalRequest.toJSON()
    });

  } catch (error) {
    logger.error('Error rejecting withdrawal request:', error);
    
    if (error.message.includes('not found') || error.message.includes('not in pending status')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to reject withdrawal request',
      error: error.message
    });
  }
};

/**
 * Cancel withdrawal request (Admin only)
 * PUT /api/withdrawals/requests/:id/cancel
 */
const cancelWithdrawalRequest = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id: withdrawalRequestId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.id;

    // Process withdrawal request
    const withdrawalRequest = await WithdrawalService.processWithdrawalRequest(
      withdrawalRequestId,
      'cancel',
      adminNotes
    );

    logger.info(`Withdrawal request cancelled: ${withdrawalRequestId} by admin: ${adminId}`);

    res.json({
      success: true,
      message: 'Withdrawal request cancelled successfully',
      data: withdrawalRequest.toJSON()
    });

  } catch (error) {
    logger.error('Error cancelling withdrawal request:', error);
    
    if (error.message.includes('not found') || error.message.includes('cannot be cancelled')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to cancel withdrawal request',
      error: error.message
    });
  }
};

/**
 * Get all withdrawal requests (Admin only)
 * GET /api/withdrawals/requests
 */
const getAllWithdrawalRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      withdrawal_method,
      startDate,
      endDate
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      withdrawal_method,
      startDate,
      endDate
    };

    const result = await WithdrawalRequest.findAll(options);

    res.json({
      success: true,
      data: {
        withdrawalRequests: result.withdrawalRequests.map(req => req.toJSON()),
        pagination: result.pagination
      }
    });

  } catch (error) {
    logger.error('Error getting all withdrawal requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal requests',
      error: error.message
    });
  }
};

/**
 * Get withdrawal methods for user
 * GET /api/withdrawals/methods
 */
const getWithdrawalMethods = async (req, res) => {
  try {
    const userId = req.user.id;

    const methods = await WithdrawalService.getUserWithdrawalMethods(userId);

    res.json({
      success: true,
      data: methods
    });

  } catch (error) {
    logger.error('Error getting withdrawal methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal methods',
      error: error.message
    });
  }
};

/**
 * Add withdrawal method for user
 * POST /api/withdrawals/methods
 */
const addWithdrawalMethod = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { method_type, account_name, account_details, is_default } = req.body;
    const userId = req.user.id;

    const method = await WithdrawalService.addWithdrawalMethod(userId, {
      method_type,
      account_name,
      account_details,
      is_default
    });

    logger.info(`Withdrawal method added: ${method.id} by user: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Withdrawal method added successfully',
      data: method
    });

  } catch (error) {
    logger.error('Error adding withdrawal method:', error);
    
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add withdrawal method',
      error: error.message
    });
  }
};

/**
 * Update withdrawal method
 * PUT /api/withdrawals/methods/:id
 */
const updateWithdrawalMethod = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id: methodId } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const method = await WithdrawalService.updateWithdrawalMethod(methodId, userId, updateData);

    logger.info(`Withdrawal method updated: ${methodId} by user: ${userId}`);

    res.json({
      success: true,
      message: 'Withdrawal method updated successfully',
      data: method
    });

  } catch (error) {
    logger.error('Error updating withdrawal method:', error);
    
    if (error.message.includes('not found') || error.message.includes('Not authorized') ||
        error.message.includes('required') || error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update withdrawal method',
      error: error.message
    });
  }
};

/**
 * Delete withdrawal method
 * DELETE /api/withdrawals/methods/:id
 */
const deleteWithdrawalMethod = async (req, res) => {
  try {
    const { id: methodId } = req.params;
    const userId = req.user.id;

    await WithdrawalService.deleteWithdrawalMethod(methodId, userId);

    logger.info(`Withdrawal method deleted: ${methodId} by user: ${userId}`);

    res.json({
      success: true,
      message: 'Withdrawal method deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting withdrawal method:', error);
    
    if (error.message.includes('not found') || error.message.includes('Not authorized')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete withdrawal method',
      error: error.message
    });
  }
};

/**
 * Get withdrawal statistics (Admin only)
 * GET /api/withdrawals/statistics
 */
const getWithdrawalStatistics = async (req, res) => {
  try {
    const { period = '30' } = req.query;

    const statistics = await WithdrawalService.getWithdrawalStatistics(parseInt(period));

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    logger.error('Error getting withdrawal statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal statistics',
      error: error.message
    });
  }
};

/**
 * Get user withdrawal summary
 * GET /api/withdrawals/summary
 */
const getUserWithdrawalSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const summary = await WithdrawalService.getUserWithdrawalSummary(userId);

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    logger.error('Error getting user withdrawal summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal summary',
      error: error.message
    });
  }
};

/**
 * Get withdrawal settings
 * GET /api/withdrawals/settings
 */
const getWithdrawalSettings = async (req, res) => {
  try {
    const settings = await WithdrawalService.getWithdrawalSettings();

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    logger.error('Error getting withdrawal settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get withdrawal settings',
      error: error.message
    });
  }
};

module.exports = {
  createWithdrawalRequest,
  getWithdrawalRequests,
  getWithdrawalRequestDetails,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  cancelWithdrawalRequest,
  getAllWithdrawalRequests,
  getWithdrawalMethods,
  addWithdrawalMethod,
  updateWithdrawalMethod,
  deleteWithdrawalMethod,
  getWithdrawalStatistics,
  getUserWithdrawalSummary,
  getWithdrawalSettings
}; 