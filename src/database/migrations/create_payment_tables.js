require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../../config');
const logger = require('../../utils/logger');

const createPaymentTables = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection(config.database);
    logger.info('Creating payment tables...');
    
    // Create payment methods table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        payment_type ENUM('card', 'paypal', 'bank_account') NOT NULL,
        gateway VARCHAR(50) NOT NULL, -- 'stripe', 'paypal'
        gateway_payment_method_id VARCHAR(255),
        card_last4 VARCHAR(4),
        card_brand VARCHAR(20),
        card_exp_month INT,
        card_exp_year INT,
        is_default BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_payment_type (payment_type),
        INDEX idx_gateway (gateway),
        INDEX idx_is_default (is_default),
        INDEX idx_is_active (is_active)
      );
    `);
    
    // Create payment transactions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        payment_method_id VARCHAR(36),
        gateway VARCHAR(50) NOT NULL,
        gateway_transaction_id VARCHAR(255),
        gateway_payment_intent_id VARCHAR(255),
        status ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled') DEFAULT 'pending',
        failure_reason TEXT,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_gateway (gateway),
        INDEX idx_status (status),
        INDEX idx_gateway_transaction_id (gateway_transaction_id),
        INDEX idx_gateway_payment_intent_id (gateway_payment_intent_id),
        INDEX idx_created_at (created_at)
      );
    `);
    
    logger.info('Payment tables created successfully');
    
  } catch (error) {
    logger.error('Error creating payment tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run migration if called directly
if (require.main === module) {
  createPaymentTables()
    .then(() => {
      logger.info('Payment tables migration completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Payment tables migration failed:', error);
      process.exit(1);
    });
}

module.exports = createPaymentTables; 