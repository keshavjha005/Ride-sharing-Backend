const WithdrawalRequest = require('../models/WithdrawalRequest');
const PayoutTransaction = require('../models/PayoutTransaction');
const WithdrawalMethod = require('../models/WithdrawalMethod');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const CommissionTransaction = require('../models/CommissionTransaction');
const db = require('../config/database');
const logger = require('../utils/logger');

class WithdrawalService {
  /**
   * Get withdrawal settings
   */
  static async getWithdrawalSettings() {
    try {
      const [rows] = await db.query('SELECT * FROM withdrawal_settings WHERE is_active = true');
      
      const settings = {};
      rows.forEach(row => {
        settings[row.setting_key] = JSON.parse(row.setting_value);
      });
      
      return settings;
    } catch (error) {
      logger.error('Error getting withdrawal settings:', error);
      throw error;
    }
  }

  /**
   * Validate withdrawal request
   */
  static async validateWithdrawalRequest(userId, amount, withdrawalMethod) {
    const errors = [];
    const settings = await this.getWithdrawalSettings();
    const limits = settings.withdrawal_limits || {};

    // Check minimum amount
    if (amount < (limits.minimum_amount || 10.00)) {
      errors.push(`Minimum withdrawal amount is $${limits.minimum_amount || 10.00}`);
    }

    // Check maximum amount
    if (amount > (limits.maximum_amount || 10000.00)) {
      errors.push(`Maximum withdrawal amount is $${limits.maximum_amount || 10000.00}`);
    }

    // Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [dailyRows] = await db.query(
      'SELECT SUM(amount) as total FROM withdrawal_requests WHERE user_id = ? AND created_at >= ? AND created_at < ?',
      [userId, today, tomorrow]
    );

    const dailyTotal = (dailyRows[0].total || 0) + amount;
    if (dailyTotal > (limits.daily_limit || 5000.00)) {
      errors.push(`Daily withdrawal limit exceeded. Daily limit: $${limits.daily_limit || 5000.00}`);
    }

    // Check monthly limit
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [monthlyRows] = await db.query(
      'SELECT SUM(amount) as total FROM withdrawal_requests WHERE user_id = ? AND created_at >= ?',
      [userId, monthStart]
    );

    const monthlyTotal = (monthlyRows[0].total || 0) + amount;
    if (monthlyTotal > (limits.monthly_limit || 50000.00)) {
      errors.push(`Monthly withdrawal limit exceeded. Monthly limit: $${limits.monthly_limit || 50000.00}`);
    }

    // Check if user has pending requests
    const hasPending = await WithdrawalRequest.hasPendingRequests(userId);
    if (hasPending) {
      errors.push('You have pending withdrawal requests. Please wait for them to be processed.');
    }

    // Check wallet balance
    const wallet = await Wallet.findByUserId(userId);
    if (!wallet) {
      errors.push('Wallet not found');
    } else if (wallet.balance < amount) {
      errors.push('Insufficient wallet balance');
    }

    return errors;
  }

  /**
   * Create withdrawal request
   */
  static async createWithdrawalRequest(userId, amount, withdrawalMethod, accountDetails) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Validate withdrawal request
      const validationErrors = await this.validateWithdrawalRequest(userId, amount, withdrawalMethod);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Validate account details
      const accountValidationErrors = WithdrawalMethod.validateAccountDetails(withdrawalMethod, accountDetails);
      if (accountValidationErrors.length > 0) {
        throw new Error(accountValidationErrors.join(', '));
      }

      // Create withdrawal request
      const withdrawalRequest = await WithdrawalRequest.create({
        user_id: userId,
        amount: amount,
        withdrawal_method: withdrawalMethod,
        account_details: accountDetails
      });

      // Deduct amount from wallet
      const wallet = await Wallet.findByUserId(userId);
      await wallet.debit(amount, 'withdrawal', withdrawalRequest.id, 'withdrawal_request');

      // Create commission transaction for withdrawal fee
      const settings = await this.getWithdrawalSettings();
      const fees = settings.withdrawal_fees || {};
      const methodFees = fees[withdrawalMethod] || { percentage: 0, fixed: 0 };
      
      const feeAmount = (amount * methodFees.percentage / 100) + methodFees.fixed;
      
      if (feeAmount > 0) {
        await CommissionTransaction.create({
          booking_payment_id: null,
          commission_amount: feeAmount,
          commission_percentage: methodFees.percentage,
          transaction_type: 'withdrawal_fee',
          reference_id: withdrawalRequest.id,
          reference_type: 'withdrawal_request'
        });
      }

      await connection.commit();

      logger.info(`Withdrawal request created successfully: ${withdrawalRequest.id}`);
      return withdrawalRequest;

    } catch (error) {
      await connection.rollback();
      logger.error('Error creating withdrawal request:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Process withdrawal request (admin)
   */
  static async processWithdrawalRequest(withdrawalRequestId, action, adminNotes = null) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const withdrawalRequest = await WithdrawalRequest.findById(withdrawalRequestId);
      if (!withdrawalRequest) {
        throw new Error('Withdrawal request not found');
      }

      if (action === 'approve') {
        if (withdrawalRequest.status !== 'pending') {
          throw new Error('Withdrawal request is not in pending status');
        }

        // Update status to approved
        await withdrawalRequest.updateStatus('approved', adminNotes);

        // Create payout transaction
        const payoutTransaction = await PayoutTransaction.create({
          withdrawal_request_id: withdrawalRequest.id,
          gateway: withdrawalRequest.withdrawal_method === 'bank_transfer' ? 'bank_transfer' : withdrawalRequest.withdrawal_method,
          amount: withdrawalRequest.amount,
          net_amount: withdrawalRequest.amount, // Will be updated with fees
          status: 'pending'
        });

        // Process payout based on method
        await this.processPayout(payoutTransaction, withdrawalRequest);

      } else if (action === 'reject') {
        if (withdrawalRequest.status !== 'pending') {
          throw new Error('Withdrawal request is not in pending status');
        }

        // Update status to rejected
        await withdrawalRequest.updateStatus('rejected', adminNotes);

        // Refund amount to wallet
        const wallet = await Wallet.findByUserId(withdrawalRequest.user_id);
        await wallet.credit(withdrawalRequest.amount, 'refund', withdrawalRequest.id, 'withdrawal_request');

        // Refund commission if any
        const commissionTransactions = await CommissionTransaction.findByReferenceId(withdrawalRequest.id);
        for (const commission of commissionTransactions) {
          if (commission.transaction_type === 'withdrawal_fee') {
            await commission.updateStatus('refunded');
          }
        }

      } else if (action === 'cancel') {
        if (!['pending', 'approved'].includes(withdrawalRequest.status)) {
          throw new Error('Withdrawal request cannot be cancelled');
        }

        // Update status to cancelled
        await withdrawalRequest.updateStatus('cancelled', adminNotes);

        // Refund amount to wallet if not already processed
        if (withdrawalRequest.status === 'pending') {
          const wallet = await Wallet.findByUserId(withdrawalRequest.user_id);
          await wallet.credit(withdrawalRequest.amount, 'refund', withdrawalRequest.id, 'withdrawal_request');
        }

      } else {
        throw new Error('Invalid action');
      }

      await connection.commit();

      logger.info(`Withdrawal request ${action}ed: ${withdrawalRequestId}`);
      return withdrawalRequest;

    } catch (error) {
      await connection.rollback();
      logger.error('Error processing withdrawal request:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Process payout
   */
  static async processPayout(payoutTransaction, withdrawalRequest) {
    try {
      // Update status to processing
      await payoutTransaction.updateStatus('processing');

      // Simulate payout processing (in real implementation, this would call payment gateway APIs)
      const settings = await this.getWithdrawalSettings();
      const processingTimes = settings.processing_times || {};
      const methodProcessing = processingTimes[withdrawalRequest.withdrawal_method] || { min_hours: 24, max_hours: 72 };

      // Calculate fees
      const fees = settings.withdrawal_fees || {};
      const methodFees = fees[withdrawalRequest.withdrawal_method] || { percentage: 0, fixed: 0 };
      const feeAmount = (withdrawalRequest.amount * methodFees.percentage / 100) + methodFees.fixed;
      const netAmount = withdrawalRequest.amount - feeAmount;

      // Update payout transaction with fees
      await payoutTransaction.update({
        fee_amount: feeAmount,
        net_amount: netAmount
      });

      // Simulate successful payout after processing time
      setTimeout(async () => {
        try {
          await payoutTransaction.updateStatus('completed');
          await withdrawalRequest.markAsProcessed();
          
          logger.info(`Payout completed: ${payoutTransaction.id}`);
        } catch (error) {
          logger.error('Error completing payout:', error);
          await payoutTransaction.updateStatus('failed', 'Processing timeout');
        }
      }, methodProcessing.min_hours * 60 * 60 * 1000); // Convert hours to milliseconds

      return payoutTransaction;

    } catch (error) {
      logger.error('Error processing payout:', error);
      await payoutTransaction.updateStatus('failed', error.message);
      throw error;
    }
  }

  /**
   * Get withdrawal statistics
   */
  static async getWithdrawalStatistics(period = 30) {
    try {
      const [requestStats, methodStats, payoutStats] = await Promise.all([
        WithdrawalRequest.getStatistics(period),
        WithdrawalRequest.getStatisticsByMethod(period),
        PayoutTransaction.getStatistics(period)
      ]);

      return {
        requests: requestStats,
        by_method: methodStats,
        payouts: payoutStats,
        period: period,
        generated_at: new Date()
      };
    } catch (error) {
      logger.error('Error getting withdrawal statistics:', error);
      throw error;
    }
  }

  /**
   * Get user withdrawal summary
   */
  static async getUserWithdrawalSummary(userId) {
    try {
      const [pendingAmount, totalWithdrawn, recentRequests] = await Promise.all([
        WithdrawalRequest.getPendingAmount(userId),
        this.getTotalWithdrawnAmount(userId),
        WithdrawalRequest.findByUserId(userId, { limit: 5 })
      ]);

      return {
        pending_amount: pendingAmount,
        total_withdrawn: totalWithdrawn,
        recent_requests: recentRequests.withdrawalRequests,
        generated_at: new Date()
      };
    } catch (error) {
      logger.error('Error getting user withdrawal summary:', error);
      throw error;
    }
  }

  /**
   * Get total withdrawn amount for user
   */
  static async getTotalWithdrawnAmount(userId) {
    try {
      const [rows] = await db.query(
        'SELECT SUM(amount) as total FROM withdrawal_requests WHERE user_id = ? AND status = "completed"',
        [userId]
      );

      return rows[0].total || 0;
    } catch (error) {
      logger.error('Error getting total withdrawn amount:', error);
      throw error;
    }
  }

  /**
   * Get withdrawal methods for user
   */
  static async getUserWithdrawalMethods(userId) {
    try {
      const methods = await WithdrawalMethod.findByUserId(userId);
      return methods.map(method => method.toJSON());
    } catch (error) {
      logger.error('Error getting user withdrawal methods:', error);
      throw error;
    }
  }

  /**
   * Add withdrawal method for user
   */
  static async addWithdrawalMethod(userId, methodData) {
    try {
      // Validate account details
      const validationErrors = WithdrawalMethod.validateAccountDetails(methodData.method_type, methodData.account_details);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const method = await WithdrawalMethod.create({
        user_id: userId,
        method_type: methodData.method_type,
        account_name: methodData.account_name,
        account_details: methodData.account_details,
        is_default: methodData.is_default || false
      });

      return method.toJSON();
    } catch (error) {
      logger.error('Error adding withdrawal method:', error);
      throw error;
    }
  }

  /**
   * Update withdrawal method
   */
  static async updateWithdrawalMethod(methodId, userId, updateData) {
    try {
      const method = await WithdrawalMethod.findById(methodId);
      if (!method) {
        throw new Error('Withdrawal method not found');
      }

      if (method.user_id !== userId) {
        throw new Error('Not authorized to update this withdrawal method');
      }

      // Validate account details if being updated
      if (updateData.account_details) {
        const validationErrors = WithdrawalMethod.validateAccountDetails(method.method_type, updateData.account_details);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join(', '));
        }
      }

      await method.update(updateData);
      return method.toJSON();
    } catch (error) {
      logger.error('Error updating withdrawal method:', error);
      throw error;
    }
  }

  /**
   * Delete withdrawal method
   */
  static async deleteWithdrawalMethod(methodId, userId) {
    try {
      const method = await WithdrawalMethod.findById(methodId);
      if (!method) {
        throw new Error('Withdrawal method not found');
      }

      if (method.user_id !== userId) {
        throw new Error('Not authorized to delete this withdrawal method');
      }

      await method.delete();
      return true;
    } catch (error) {
      logger.error('Error deleting withdrawal method:', error);
      throw error;
    }
  }
}

module.exports = WithdrawalService; 