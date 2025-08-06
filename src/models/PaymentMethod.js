const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

class PaymentMethod {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.payment_type = data.payment_type;
    this.gateway = data.gateway;
    this.gateway_payment_method_id = data.gateway_payment_method_id;
    this.card_last4 = data.card_last4;
    this.card_brand = data.card_brand;
    this.card_exp_month = data.card_exp_month;
    this.card_exp_year = data.card_exp_year;
    this.is_default = data.is_default;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
  }

  static async create(data) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      // Validate required fields
      const errors = [];
      if (!data.user_id) errors.push('User ID is required');
      if (!data.payment_type) errors.push('Payment type is required');
      if (!data.gateway) errors.push('Gateway is required');
      if (!data.gateway_payment_method_id) errors.push('Gateway payment method ID is required');
      
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // If this is set as default, unset other default methods for this user
      if (data.is_default) {
        await connection.query(
          'UPDATE payment_methods SET is_default = false WHERE user_id = ?',
          [data.user_id]
        );
      }

      const paymentMethodId = uuidv4();
      const [result] = await connection.query(
        `INSERT INTO payment_methods (
          id, user_id, payment_type, gateway, gateway_payment_method_id,
          card_last4, card_brand, card_exp_month, card_exp_year,
          is_default, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentMethodId,
          data.user_id,
          data.payment_type,
          data.gateway,
          data.gateway_payment_method_id,
          data.card_last4 || null,
          data.card_brand || null,
          data.card_exp_month || null,
          data.card_exp_year || null,
          data.is_default || false,
          data.is_active !== false
        ]
      );

      logger.info(`Payment method created: ${paymentMethodId} for user: ${data.user_id}`);
      
      return await PaymentMethod.getById(paymentMethodId);
      
    } finally {
      await connection.end();
    }
  }

  static async getById(id) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM payment_methods WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new PaymentMethod(rows[0]);
      
    } finally {
      await connection.end();
    }
  }

  static async getByUserId(userId, options = {}) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      let query = 'SELECT * FROM payment_methods WHERE user_id = ?';
      const values = [userId];
      
      if (options.active_only !== false) {
        query += ' AND is_active = true';
      }
      
      if (options.payment_type) {
        query += ' AND payment_type = ?';
        values.push(options.payment_type);
      }
      
      if (options.gateway) {
        query += ' AND gateway = ?';
        values.push(options.gateway);
      }
      
      query += ' ORDER BY is_default DESC, created_at DESC';
      
      const [rows] = await connection.query(query, values);
      
      return rows.map(row => new PaymentMethod(row));
      
    } finally {
      await connection.end();
    }
  }

  static async getDefaultByUserId(userId) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM payment_methods WHERE user_id = ? AND is_default = true AND is_active = true',
        [userId]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new PaymentMethod(rows[0]);
      
    } finally {
      await connection.end();
    }
  }

  static async update(id, updates) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const allowedFields = [
        'card_last4', 'card_brand', 'card_exp_month', 'card_exp_year',
        'is_default', 'is_active'
      ];
      
      const updateFields = [];
      const values = [];
      
      for (const [field, value] of Object.entries(updates)) {
        if (allowedFields.includes(field)) {
          updateFields.push(`${field} = ?`);
          values.push(value);
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      // If setting as default, unset other default methods for this user
      if (updates.is_default) {
        const [currentMethod] = await connection.query(
          'SELECT user_id FROM payment_methods WHERE id = ?',
          [id]
        );
        
        if (currentMethod.length > 0) {
          await connection.query(
            'UPDATE payment_methods SET is_default = false WHERE user_id = ? AND id != ?',
            [currentMethod[0].user_id, id]
          );
        }
      }
      
      values.push(id);
      
      const [result] = await connection.query(
        `UPDATE payment_methods SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Payment method not found');
      }
      
      logger.info(`Payment method updated: ${id}`);
      
      return await PaymentMethod.getById(id);
      
    } finally {
      await connection.end();
    }
  }

  static async delete(id) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const [result] = await connection.query(
        'DELETE FROM payment_methods WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Payment method not found');
      }
      
      logger.info(`Payment method deleted: ${id}`);
      
      return true;
      
    } finally {
      await connection.end();
    }
  }

  static async deactivate(id) {
    return await PaymentMethod.update(id, { is_active: false });
  }

  static async setAsDefault(id) {
    return await PaymentMethod.update(id, { is_default: true });
  }

  static async validate(data) {
    const errors = [];
    
    if (!data.user_id) {
      errors.push('User ID is required');
    }
    
    if (!data.payment_type || !['card', 'paypal', 'bank_account'].includes(data.payment_type)) {
      errors.push('Valid payment type is required (card, paypal, bank_account)');
    }
    
    if (!data.gateway || !['stripe', 'paypal'].includes(data.gateway)) {
      errors.push('Valid gateway is required (stripe, paypal)');
    }
    
    if (!data.gateway_payment_method_id) {
      errors.push('Gateway payment method ID is required');
    }
    
    // Validate card-specific fields
    if (data.payment_type === 'card') {
      if (!data.card_last4 || data.card_last4.length !== 4) {
        errors.push('Valid card last 4 digits are required');
      }
      
      if (!data.card_brand) {
        errors.push('Card brand is required');
      }
      
      if (!data.card_exp_month || data.card_exp_month < 1 || data.card_exp_month > 12) {
        errors.push('Valid card expiration month is required (1-12)');
      }
      
      if (!data.card_exp_year || data.card_exp_year < new Date().getFullYear()) {
        errors.push('Valid card expiration year is required');
      }
    }
    
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      payment_type: this.payment_type,
      gateway: this.gateway,
      gateway_payment_method_id: this.gateway_payment_method_id,
      card_last4: this.card_last4,
      card_brand: this.card_brand,
      card_exp_month: this.card_exp_month,
      card_exp_year: this.card_exp_year,
      is_default: this.is_default,
      is_active: this.is_active,
      created_at: this.created_at
    };
  }

  // Mask sensitive data for API responses
  toPublicJSON() {
    const data = this.toJSON();
    
    // Mask gateway payment method ID
    if (data.gateway_payment_method_id) {
      data.gateway_payment_method_id = data.gateway_payment_method_id.substring(0, 8) + '...';
    }
    
    return data;
  }
}

module.exports = PaymentMethod; 