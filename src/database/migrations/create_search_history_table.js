const { executeQuery } = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Migration: Create user_search_history table
 * This table stores user search history for ride searches
 */
async function up() {
  try {
    logger.info('Creating user_search_history table...');

    const query = `
      CREATE TABLE IF NOT EXISTS user_search_history (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        pickup_location VARCHAR(500),
        drop_location VARCHAR(500),
        search_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_search_date (search_date),
        INDEX idx_locations (pickup_location, drop_location)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await executeQuery(query);
    
    logger.info('user_search_history table created successfully');
  } catch (error) {
    logger.error('Error creating user_search_history table:', error);
    throw error;
  }
}

/**
 * Rollback: Drop user_search_history table
 */
async function down() {
  try {
    logger.info('Dropping user_search_history table...');

    const query = 'DROP TABLE IF EXISTS user_search_history';
    await executeQuery(query);
    
    logger.info('user_search_history table dropped successfully');
  } catch (error) {
    logger.error('Error dropping user_search_history table:', error);
    throw error;
  }
}

module.exports = {
  up,
  down,
  description: 'Create user_search_history table for storing user search history'
}; 