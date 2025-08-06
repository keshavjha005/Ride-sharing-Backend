require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../../config');
const logger = require('../../utils/logger');

const createBookingPaymentTables = async () => {
  let connection;
  
  try {
    connection = await mysql.createConnection(config.database);
    logger.info('Creating booking payment tables...');

    // Create booking_payments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS booking_payments (
        id VARCHAR(36) PRIMARY KEY,
        booking_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        payment_method ENUM('wallet', 'card', 'paypal') NOT NULL,
        payment_transaction_id VARCHAR(36),
        status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        admin_commission_amount DECIMAL(12,2) DEFAULT 0.00,
        driver_earning_amount DECIMAL(12,2) DEFAULT 0.00,
        pricing_details JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id) ON DELETE SET NULL,
        INDEX idx_booking_id (booking_id),
        INDEX idx_user_id (user_id),
        INDEX idx_payment_method (payment_method),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `);

    // Create commission_transactions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS commission_transactions (
        id VARCHAR(36) PRIMARY KEY,
        booking_payment_id VARCHAR(36) NOT NULL,
        commission_amount DECIMAL(12,2) NOT NULL,
        commission_percentage DECIMAL(5,2) NOT NULL,
        transaction_type ENUM('booking_commission', 'withdrawal_fee') NOT NULL,
        status ENUM('pending', 'collected', 'refunded') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_payment_id) REFERENCES booking_payments(id) ON DELETE CASCADE,
        INDEX idx_booking_payment_id (booking_payment_id),
        INDEX idx_transaction_type (transaction_type),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      )
    `);

    // Create commission_settings table for configurable commission rates
    await connection.query(`
      CREATE TABLE IF NOT EXISTS commission_settings (
        id VARCHAR(36) PRIMARY KEY,
        commission_type ENUM('booking', 'withdrawal', 'per_km') NOT NULL,
        commission_percentage DECIMAL(5,2) NOT NULL,
        commission_amount DECIMAL(12,2),
        minimum_amount DECIMAL(12,2) DEFAULT 0.00,
        maximum_amount DECIMAL(12,2),
        is_active BOOLEAN DEFAULT true,
        effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_commission_type (commission_type),
        INDEX idx_is_active (is_active)
      )
    `);

    // Insert default commission settings
    await connection.query(`
      INSERT IGNORE INTO commission_settings (id, commission_type, commission_percentage, commission_amount, minimum_amount, maximum_amount, is_active) VALUES
      (UUID(), 'booking', 10.00, NULL, 0.00, NULL, true),
      (UUID(), 'withdrawal', 2.50, NULL, 0.00, NULL, true),
      (UUID(), 'per_km', 5.00, NULL, 0.00, NULL, true)
    `);

    logger.info('✅ Booking payment tables created successfully');

  } catch (error) {
    logger.error('❌ Error creating booking payment tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run migration if called directly
if (require.main === module) {
  createBookingPaymentTables()
    .then(() => {
      logger.info('Booking payment tables migration completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Booking payment tables migration failed:', error);
      process.exit(1);
    });
}

module.exports = createBookingPaymentTables; 