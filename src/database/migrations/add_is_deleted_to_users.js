const { executeQuery } = require('../../config/database');
const logger = require('../../utils/logger');

const addIsDeletedToUsers = async () => {
  try {
    logger.info('Starting migration: add is_deleted column to users table');
    
    // Check if column already exists
    const checkColumnQuery = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'is_deleted'
    `;
    
    const existingColumns = await executeQuery(checkColumnQuery);
    
    if (existingColumns.length === 0) {
      // Add the column
      const addColumnQuery = `
        ALTER TABLE users 
        ADD COLUMN is_deleted TIMESTAMP NULL,
        ADD INDEX idx_is_deleted (is_deleted)
      `;
      
      await executeQuery(addColumnQuery);
      logger.info('Successfully added is_deleted column to users table');
    } else {
      logger.info('is_deleted column already exists in users table');
    }
    
  } catch (error) {
    logger.error('Migration failed: add is_deleted column to users table', {
      error: error.message,
    });
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  require('dotenv').config();
  addIsDeletedToUsers()
    .then(() => {
      logger.info('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed', { error: error.message });
      process.exit(1);
    });
}

module.exports = { addIsDeletedToUsers }; 