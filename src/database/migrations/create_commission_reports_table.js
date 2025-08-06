const db = require('../../config/database');
const logger = require('../../utils/logger');

const createCommissionReportsTable = async () => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Create commission_reports table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS commission_reports (
        id VARCHAR(36) PRIMARY KEY,
        report_date DATE NOT NULL,
        total_bookings INT DEFAULT 0,
        total_booking_amount DECIMAL(12,2) DEFAULT 0.00,
        total_commission_amount DECIMAL(12,2) DEFAULT 0.00,
        total_withdrawals INT DEFAULT 0,
        total_withdrawal_fees DECIMAL(12,2) DEFAULT 0.00,
        net_commission DECIMAL(12,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_report_date (report_date),
        INDEX idx_created_at (created_at)
      )
    `);

    await connection.commit();
    logger.info('Commission reports table created successfully');
    
  } catch (error) {
    await connection.rollback();
    logger.error('Error creating commission reports table:', error);
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = createCommissionReportsTable; 