const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class WithdrawalMethod {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.user_id = data.user_id;
    this.method_type = data.method_type;
    this.account_name = data.account_name;
    this.account_details = data.account_details;
    this.is_default = data.is_default || false;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create a new withdrawal method
   */
  static async create(data) {
    try {
      const withdrawalMethod = new WithdrawalMethod(data);
      
      // If this is set as default, unset other default methods for this user
      if (withdrawalMethod.is_default) {
        await this.unsetDefaultForUser(withdrawalMethod.user_id);
      }
      
      const query = `
        INSERT INTO withdrawal_methods (
          id, user_id, method_type, account_name, account_details, 
          is_default, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const values = [
        withdrawalMethod.id,
        withdrawalMethod.user_id,
        withdrawalMethod.method_type,
        withdrawalMethod.account_name,
        JSON.stringify(withdrawalMethod.account_details),
        withdrawalMethod.is_default,
        withdrawalMethod.is_active
      ];

      await db.query(query, values);

      logger.info(`Withdrawal method created: ${withdrawalMethod.id} for user: ${withdrawalMethod.user_id}`);
      return withdrawalMethod;
    } catch (error) {
      logger.error('Error creating withdrawal method:', error);
      throw error;
    }
  }

  /**
   * Find withdrawal method by ID
   */
  static async findById(id) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM withdrawal_methods WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      const data = rows[0];
      if (data.account_details) {
        data.account_details = JSON.parse(data.account_details);
      } else {
        data.account_details = {};
      }

      return new WithdrawalMethod(data);
    } catch (error) {
      logger.error('Error finding withdrawal method by ID:', error);
      throw error;
    }
  }

  /**
   * Find withdrawal methods by user ID
   */
  static async findByUserId(userId, activeOnly = true) {
    try {
      let query = 'SELECT * FROM withdrawal_methods WHERE user_id = ?';
      const values = [userId];

      if (activeOnly) {
        query += ' AND is_active = true';
      }

      query += ' ORDER BY is_default DESC, created_at DESC';

      const [rows] = await db.query(query, values);

      // Parse JSON fields
      return rows.map(row => {
        if (row.account_details) {
          row.account_details = JSON.parse(row.account_details);
        } else {
          row.account_details = {};
        }
        return new WithdrawalMethod(row);
      });
    } catch (error) {
      logger.error('Error finding withdrawal methods by user ID:', error);
      throw error;
    }
  }

  /**
   * Find default withdrawal method for user
   */
  static async findDefaultByUserId(userId) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM withdrawal_methods WHERE user_id = ? AND is_default = true AND is_active = true',
        [userId]
      );

      if (rows.length === 0) {
        return null;
      }

      const data = rows[0];
      if (data.account_details) {
        data.account_details = JSON.parse(data.account_details);
      } else {
        data.account_details = {};
      }

      return new WithdrawalMethod(data);
    } catch (error) {
      logger.error('Error finding default withdrawal method by user ID:', error);
      throw error;
    }
  }

  /**
   * Update withdrawal method
   */
  async update(data) {
    try {
      const updates = [];
      const values = [];

      if (data.account_name !== undefined) {
        updates.push('account_name = ?');
        values.push(data.account_name);
      }

      if (data.account_details !== undefined) {
        updates.push('account_details = ?');
        values.push(JSON.stringify(data.account_details));
      }

      if (data.is_default !== undefined) {
        updates.push('is_default = ?');
        values.push(data.is_default);
        
        // If setting as default, unset other default methods
        if (data.is_default) {
          await WithdrawalMethod.unsetDefaultForUser(this.user_id);
        }
      }

      if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(data.is_active);
      }

      if (updates.length === 0) {
        return this;
      }

      updates.push('updated_at = NOW()');
      values.push(this.id);

      const query = `UPDATE withdrawal_methods SET ${updates.join(', ')} WHERE id = ?`;
      await db.query(query, values);

      // Update local properties
      Object.assign(this, data);
      this.updated_at = new Date();

      logger.info(`Withdrawal method updated: ${this.id}`);
      return this;
    } catch (error) {
      logger.error('Error updating withdrawal method:', error);
      throw error;
    }
  }

  /**
   * Delete withdrawal method
   */
  async delete() {
    try {
      await db.query('DELETE FROM withdrawal_methods WHERE id = ?', [this.id]);
      logger.info(`Withdrawal method deleted: ${this.id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting withdrawal method:', error);
      throw error;
    }
  }

  /**
   * Set as default withdrawal method
   */
  async setAsDefault() {
    try {
      // Unset other default methods for this user
      await WithdrawalMethod.unsetDefaultForUser(this.user_id);
      
      // Set this method as default
      await db.query(
        'UPDATE withdrawal_methods SET is_default = true, updated_at = NOW() WHERE id = ?',
        [this.id]
      );

      this.is_default = true;
      this.updated_at = new Date();

      logger.info(`Withdrawal method set as default: ${this.id}`);
      return this;
    } catch (error) {
      logger.error('Error setting withdrawal method as default:', error);
      throw error;
    }
  }

  /**
   * Unset default for user
   */
  static async unsetDefaultForUser(userId) {
    try {
      await db.query(
        'UPDATE withdrawal_methods SET is_default = false, updated_at = NOW() WHERE user_id = ? AND is_default = true',
        [userId]
      );
    } catch (error) {
      logger.error('Error unsetting default withdrawal method for user:', error);
      throw error;
    }
  }

  /**
   * Get withdrawal method statistics
   */
  static async getStatistics() {
    try {
      const query = `
        SELECT 
          method_type,
          COUNT(*) as total_methods,
          SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_methods,
          SUM(CASE WHEN is_default = true THEN 1 ELSE 0 END) as default_methods
        FROM withdrawal_methods 
        GROUP BY method_type
      `;

      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      logger.error('Error getting withdrawal method statistics:', error);
      throw error;
    }
  }

  /**
   * Validate account details based on method type
   */
  static validateAccountDetails(methodType, accountDetails) {
    const errors = [];

    switch (methodType) {
      case 'bank_transfer':
        if (!accountDetails.accountNumber || accountDetails.accountNumber.length < 5) {
          errors.push('Bank account number is required and must be at least 5 characters');
        }
        if (!accountDetails.routingNumber || accountDetails.routingNumber.length !== 9) {
          errors.push('Routing number is required and must be 9 digits');
        }
        if (!accountDetails.accountHolderName) {
          errors.push('Account holder name is required');
        }
        if (!accountDetails.bankName) {
          errors.push('Bank name is required');
        }
        break;

      case 'paypal':
        if (!accountDetails.email || !accountDetails.email.includes('@')) {
          errors.push('Valid PayPal email is required');
        }
        break;

      case 'stripe':
        if (!accountDetails.accountId) {
          errors.push('Stripe account ID is required');
        }
        break;

      default:
        errors.push('Invalid withdrawal method type');
    }

    return errors;
  }

  /**
   * Mask sensitive account details for display
   */
  getMaskedAccountDetails() {
    const masked = { ...this.account_details };

    switch (this.method_type) {
      case 'bank_transfer':
        if (masked.accountNumber) {
          masked.accountNumber = `****${masked.accountNumber.slice(-4)}`;
        }
        if (masked.routingNumber) {
          masked.routingNumber = `****${masked.routingNumber.slice(-4)}`;
        }
        break;

      case 'paypal':
        if (masked.email) {
          const [local, domain] = masked.email.split('@');
          masked.email = `${local.slice(0, 2)}***@${domain}`;
        }
        break;

      case 'stripe':
        if (masked.accountId) {
          masked.accountId = `****${masked.accountId.slice(-4)}`;
        }
        break;
    }

    return masked;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      method_type: this.method_type,
      account_name: this.account_name,
      account_details: this.getMaskedAccountDetails(),
      is_default: this.is_default,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Convert to JSON with full details (for internal use)
   */
  toJSONFull() {
    return {
      id: this.id,
      user_id: this.user_id,
      method_type: this.method_type,
      account_name: this.account_name,
      account_details: this.account_details,
      is_default: this.is_default,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = WithdrawalMethod; 