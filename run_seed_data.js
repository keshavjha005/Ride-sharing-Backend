#!/usr/bin/env node

/**
 * Script to run the admin test data seeder
 * Usage: node run_seed_data.js [--clear]
 */

const AdminTestDataSeeder = require('./src/database/seeds/admin_test_data');
const { testConnection } = require('./src/config/database');
const logger = require('./src/utils/logger');

async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');

  try {
    // Test database connection first
    logger.info('Testing database connection...');
    await testConnection();
    logger.info('Database connection successful!');

    const seeder = new AdminTestDataSeeder();

    if (shouldClear) {
      logger.info('Clearing existing test data...');
      await seeder.clearExistingData();
      logger.info('Existing test data cleared!');
    }

    logger.info('Starting test data seeding...');
    const createdIds = await seeder.seedAll();

    logger.info('🎉 Test data seeding completed successfully!');
    logger.info('📊 Summary of created test data:', {
      '👥 Users': createdIds.users.length,
      '🔑 Admin Users': createdIds.adminUsers.length,
      '🚗 User Vehicles': createdIds.userVehicles.length,
      '🚀 Rides': createdIds.rides.length,
      '📅 Bookings': createdIds.bookings.length,
      '💰 Wallets': createdIds.wallets.length,
      '🌐 Languages': createdIds.languages.length,
      '💵 Currencies': createdIds.currencies.length
    });

    logger.info('🔐 Admin Login Credentials:');
    logger.info('  Super Admin: super.admin@mate.com / superadmin123');
    logger.info('  Admin Manager: admin.manager@mate.com / adminmanager123');
    logger.info('  Support Lead: support.lead@mate.com / supportlead123');
    logger.info('  Moderator: moderator@mate.com / moderator123');
    
    logger.info('✅ You can now test the admin panel with realistic data!');
    process.exit(0);

  } catch (error) {
    logger.error('❌ Failed to seed test data:', error);
    console.error('\n🚨 Error Details:', error.message);
    
    if (error.code) {
      console.error('🔍 Error Code:', error.code);
    }
    
    if (error.errno) {
      console.error('🔢 Error Number:', error.errno);
    }

    console.error('\n💡 Troubleshooting Tips:');
    console.error('1. Make sure MySQL is running');
    console.error('2. Check your database configuration in .env file');
    console.error('3. Ensure the database exists and migrations have been run');
    console.error('4. Verify database user has proper permissions');
    
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the main function
main();
