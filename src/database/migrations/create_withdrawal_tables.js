const { v4: uuidv4 } = require('uuid');

/**
 * Migration: Create withdrawal and payout tables
 * Task 4.6: Withdrawal and Payout System
 */
async function up({ execute }) {
  console.log('Creating withdrawal and payout tables...');

  // Create withdrawal_requests table
  await execute(`
    CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      withdrawal_method ENUM('bank_transfer', 'paypal', 'stripe') NOT NULL,
      account_details JSON, -- encrypted account information
      status ENUM('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled') DEFAULT 'pending',
      admin_notes TEXT,
      processed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    )
  `);

  // Create payout_transactions table
  await execute(`
    CREATE TABLE IF NOT EXISTS payout_transactions (
      id VARCHAR(36) PRIMARY KEY,
      withdrawal_request_id VARCHAR(36) NOT NULL,
      gateway VARCHAR(50) NOT NULL, -- 'stripe', 'paypal'
      gateway_payout_id VARCHAR(255),
      amount DECIMAL(12,2) NOT NULL,
      fee_amount DECIMAL(12,2) DEFAULT 0.00,
      net_amount DECIMAL(12,2) NOT NULL,
      status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
      failure_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (withdrawal_request_id) REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
      INDEX idx_withdrawal_request_id (withdrawal_request_id),
      INDEX idx_gateway (gateway),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    )
  `);

  // Create withdrawal_methods table for user's saved withdrawal methods
  await execute(`
    CREATE TABLE IF NOT EXISTS withdrawal_methods (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      method_type ENUM('bank_transfer', 'paypal', 'stripe') NOT NULL,
      account_name VARCHAR(255) NOT NULL,
      account_details JSON NOT NULL, -- encrypted account information
      is_default BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_method_type (method_type),
      INDEX idx_is_default (is_default)
    )
  `);

  // Create withdrawal_settings table for system-wide withdrawal settings
  await execute(`
    CREATE TABLE IF NOT EXISTS withdrawal_settings (
      id VARCHAR(36) PRIMARY KEY,
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_value JSON NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Insert default withdrawal settings
  const defaultSettings = [
    {
      id: uuidv4(),
      setting_key: 'withdrawal_limits',
      setting_value: JSON.stringify({
        minimum_amount: 10.00,
        maximum_amount: 10000.00,
        daily_limit: 5000.00,
        monthly_limit: 50000.00
      }),
      description: 'Default withdrawal limits'
    },
    {
      id: uuidv4(),
      setting_key: 'withdrawal_fees',
      setting_value: JSON.stringify({
        bank_transfer: { percentage: 0.00, fixed: 0.00 },
        paypal: { percentage: 2.90, fixed: 0.30 },
        stripe: { percentage: 0.25, fixed: 0.25 }
      }),
      description: 'Withdrawal fees by method'
    },
    {
      id: uuidv4(),
      setting_key: 'processing_times',
      setting_value: JSON.stringify({
        bank_transfer: { min_hours: 24, max_hours: 72 },
        paypal: { min_hours: 1, max_hours: 24 },
        stripe: { min_hours: 1, max_hours: 24 }
      }),
      description: 'Processing times by method'
    }
  ];

  for (const setting of defaultSettings) {
    await execute(`
      INSERT INTO withdrawal_settings (id, setting_key, setting_value, description)
      VALUES (?, ?, ?, ?)
    `, [setting.id, setting.setting_key, setting.setting_value, setting.description]);
  }

  console.log('Withdrawal and payout tables created successfully');
}

async function down({ execute }) {
  console.log('Dropping withdrawal and payout tables...');

  // Drop tables in reverse order
  await execute('DROP TABLE IF EXISTS payout_transactions');
  await execute('DROP TABLE IF EXISTS withdrawal_requests');
  await execute('DROP TABLE IF EXISTS withdrawal_methods');
  await execute('DROP TABLE IF EXISTS withdrawal_settings');

  console.log('Withdrawal and payout tables dropped successfully');
}

module.exports = { up, down }; 