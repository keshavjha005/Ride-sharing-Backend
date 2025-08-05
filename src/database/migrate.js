const { pool, executeQuery } = require('../config/database');
const logger = require('../utils/logger');

// Import migrations
const createVehicleTables = require('./migrations/create_vehicle_tables');
const createRideTables = require('./migrations/create_ride_tables');
const createSearchHistoryTable = require('./migrations/create_search_history_table');
const createChatTables = require('./migrations/create_chat_tables');

// Migration registry
const migrations = [
  {
    name: 'create_vehicle_tables',
    migration: createVehicleTables,
    description: 'Create vehicle management tables'
  },
  {
    name: 'create_ride_tables',
    migration: createRideTables,
    description: 'Create ride management tables'
  },
  {
    name: 'create_search_history_table',
    migration: createSearchHistoryTable,
    description: 'Create search history table'
  },
  {
    name: 'create_chat_tables',
    migration: createChatTables,
    description: 'Create chat system tables'
  }
];

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');
    
    // Create migrations table if it doesn't exist
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        description TEXT
      )
    `);

    // Get executed migrations
    const executedMigrations = await executeQuery('SELECT name FROM migrations');
    const executedMigrationNames = executedMigrations.map(m => m.name);

    // Run pending migrations
    for (const migration of migrations) {
      if (!executedMigrationNames.includes(migration.name)) {
        logger.info(`Running migration: ${migration.name} - ${migration.description}`);
        
        try {
          await migration.migration.up({ execute: executeQuery });
          
          // Record successful migration
          await executeQuery(
            'INSERT INTO migrations (name, description) VALUES (?, ?)',
            [migration.name, migration.description]
          );
          
          logger.info(`✅ Migration ${migration.name} completed successfully`);
        } catch (error) {
          logger.error(`❌ Migration ${migration.name} failed:`, error);
          throw error;
        }
      } else {
        logger.info(`⏭️  Migration ${migration.name} already executed, skipping`);
      }
    }

    logger.info('🎉 All migrations completed successfully!');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations }; 