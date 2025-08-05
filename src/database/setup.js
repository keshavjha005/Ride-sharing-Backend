require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config');
const logger = require('../utils/logger');

// Database setup queries
const setupQueries = [
  // Create database if not exists
  `CREATE DATABASE IF NOT EXISTS ${config.database.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
  
  // Use database
  `USE ${config.database.database};`,
  
  // Create languages table
  `CREATE TABLE IF NOT EXISTS languages (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    is_rtl BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );`,
  
  // Create currencies table
  `CREATE TABLE IF NOT EXISTS currencies (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    symbol_at_right BOOLEAN DEFAULT false,
    decimal_digits INT DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );`,
  
  // Create users table
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_image_url VARCHAR(500),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    language_code VARCHAR(10) DEFAULT 'en',
    currency_code VARCHAR(10) DEFAULT 'USD',
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_deleted TIMESTAMP NULL,
    fcm_token TEXT,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_language (language_code),
    INDEX idx_currency (currency_code),
    INDEX idx_is_deleted (is_deleted)
  );`,
  
  // Create localized_content table
  `CREATE TABLE IF NOT EXISTS localized_content (
    id VARCHAR(36) PRIMARY KEY,
    content_key VARCHAR(100) UNIQUE NOT NULL,
    content_ar TEXT,
    content_en TEXT,
    content_type ENUM('notification', 'error', 'ui_text', 'email', 'sms') NOT NULL,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_content_key (content_key),
    INDEX idx_content_type (content_type),
    INDEX idx_category (category)
  );`,
  
  // Create user_settings table
  `CREATE TABLE IF NOT EXISTS user_settings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    language_code VARCHAR(10) DEFAULT 'en',
    currency_code VARCHAR(10) DEFAULT 'USD',
    notification_preferences JSON,
    privacy_settings JSON,
    theme_preference ENUM('light', 'dark', 'auto') DEFAULT 'auto',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
  );`,
  
  // Create system_settings table
  `CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL,
    category VARCHAR(50),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key),
    INDEX idx_category (category)
  );`,
  
  // Create admin_users table
  `CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
  );`,
];

// Seed data queries
const seedQueries = [
  // Insert default languages
  `INSERT IGNORE INTO languages (id, code, name, native_name, is_rtl, is_active, is_default) VALUES
    (UUID(), 'en', 'English', 'English', false, true, true),
    (UUID(), 'ar', 'Arabic', 'العربية', true, true, false);`,
  
  // Insert default currencies
  `INSERT IGNORE INTO currencies (id, code, name, symbol, symbol_at_right, decimal_digits, is_active, is_default) VALUES
    (UUID(), 'USD', 'US Dollar', '$', false, 2, true, true),
    (UUID(), 'EUR', 'Euro', '€', false, 2, true, false),
    (UUID(), 'JOD', 'Jordanian Dinar', 'د.أ', false, 3, true, false),
    (UUID(), 'SAR', 'Saudi Riyal', 'ر.س', false, 2, true, false),
    (UUID(), 'AED', 'UAE Dirham', 'د.إ', false, 2, true, false);`,
  
  // Insert sample localized content
  `INSERT IGNORE INTO localized_content (id, content_key, content_ar, content_en, content_type, category) VALUES
    (UUID(), 'welcome_message', 'مرحباً بك في تطبيقنا', 'Welcome to our app', 'ui_text', 'auth'),
    (UUID(), 'booking_success', 'تم الحجز بنجاح', 'Booking successful', 'notification', 'booking'),
    (UUID(), 'payment_failed', 'فشل في الدفع', 'Payment failed', 'error', 'payment'),
    (UUID(), 'ride_cancelled', 'تم إلغاء الرحلة', 'Ride cancelled', 'notification', 'ride'),
    (UUID(), 'login_success', 'تم تسجيل الدخول بنجاح', 'Login successful', 'notification', 'auth'),
    (UUID(), 'logout_success', 'تم تسجيل الخروج بنجاح', 'Logout successful', 'notification', 'auth');`,
  
  // Insert default system settings
  `INSERT IGNORE INTO system_settings (id, setting_key, setting_value, setting_type, category, is_public) VALUES
    (UUID(), 'app_name', 'Mate', 'string', 'app', true),
    (UUID(), 'app_version', '1.0.0', 'string', 'app', true),
    (UUID(), 'maintenance_mode', 'false', 'boolean', 'app', true),
    (UUID(), 'max_file_size', '10485760', 'number', 'upload', false),
    (UUID(), 'session_timeout', '3600', 'number', 'security', false);`,
];

// Setup database
const setupDatabase = async () => {
  let connection;
  
  try {
    // Create connection without database
    connection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      port: config.database.port,
    });
    
    logger.info('Starting database setup...');
    
    // Execute setup queries
    for (const query of setupQueries) {
      await connection.query(query);
    }
    
    logger.info('Database tables created successfully');
    
    // Execute seed queries
    for (const query of seedQueries) {
      await connection.query(query);
    }
    
    logger.info('Database seeded successfully');
    
    // Verify setup
    const [tables] = await connection.query('SHOW TABLES');
    logger.info(`Database setup complete. Created ${tables.length} tables:`, {
      tables: tables.map(table => Object.values(table)[0]),
    });
    
  } catch (error) {
    logger.error('Database setup failed', {
      error: error.message,
      code: error.code,
    });
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run setup if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      logger.info('Database setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database setup failed', { error: error.message });
      process.exit(1);
    });
}

module.exports = { setupDatabase }; 