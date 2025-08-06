require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../../config');
const logger = require('../../utils/logger');

const createWalletTables = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection(config.database);
    logger.info('Creating wallet tables...');
    
    // Create wallets table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL UNIQUE,
        balance DECIMAL(12,2) DEFAULT 0.00,
        currency_code VARCHAR(10) DEFAULT 'USD',
        is_active BOOLEAN DEFAULT true,
        daily_limit DECIMAL(12,2) DEFAULT 1000.00,
        monthly_limit DECIMAL(12,2) DEFAULT 10000.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_currency_code (currency_code),
        INDEX idx_is_active (is_active)
      );
    `);
    
    // Create wallet transactions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id VARCHAR(36) PRIMARY KEY,
        wallet_id VARCHAR(36) NOT NULL,
        transaction_type ENUM('credit', 'debit') NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        balance_before DECIMAL(12,2) NOT NULL,
        balance_after DECIMAL(12,2) NOT NULL,
        transaction_category ENUM('ride_payment', 'ride_earning', 'wallet_recharge', 'withdrawal', 'refund', 'commission', 'bonus') NOT NULL,
        reference_id VARCHAR(36), -- booking_id, withdrawal_id, etc.
        reference_type VARCHAR(50), -- 'booking', 'withdrawal', 'recharge'
        description TEXT,
        status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
        INDEX idx_wallet_id (wallet_id),
        INDEX idx_transaction_type (transaction_type),
        INDEX idx_transaction_category (transaction_category),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        INDEX idx_reference (reference_id, reference_type)
      );
    `);
    
    // Create wallet recharge requests table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS wallet_recharge_requests (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        payment_method ENUM('card', 'bank_transfer', 'paypal', 'stripe') NOT NULL,
        payment_gateway VARCHAR(50),
        gateway_transaction_id VARCHAR(255),
        status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
        failure_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_payment_method (payment_method),
        INDEX idx_created_at (created_at)
      );
    `);
    
    logger.info('Wallet tables created successfully');
    
  } catch (error) {
    logger.error('Error creating wallet tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run migration if called directly
if (require.main === module) {
  createWalletTables()
    .then(() => {
      logger.info('Wallet tables migration completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Wallet tables migration failed:', error);
      process.exit(1);
    });
}

module.exports = createWalletTables; 