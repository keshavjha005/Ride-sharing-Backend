#!/usr/bin/env node

/**
 * Script to verify the seeded test data
 * Usage: node verify_data.js
 */

const { executeQuery } = require('./src/config/database');
const logger = require('./src/utils/logger');

async function verifyData() {
  try {
    logger.info('🔍 Verifying seeded test data...\n');

    // Check users
    const [userStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
        COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_users,
        COUNT(CASE WHEN email LIKE '%@example.com' THEN 1 END) as test_users
      FROM users
    `);

    console.log('👥 USERS:');
    console.log(`  Total Users: ${userStats.total_users}`);
    console.log(`  Active Users: ${userStats.active_users}`);
    console.log(`  Verified Users: ${userStats.verified_users}`);
    console.log(`  Test Users: ${userStats.test_users}\n`);

    // Check admin users
    const [adminStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_admins,
        COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN role = 'support' THEN 1 END) as support_users,
        COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderators
      FROM admin_users
    `);

    console.log('🔑 ADMIN USERS:');
    console.log(`  Total Admins: ${adminStats.total_admins}`);
    console.log(`  Super Admins: ${adminStats.super_admins}`);
    console.log(`  Admins: ${adminStats.admins}`);
    console.log(`  Support: ${adminStats.support_users}`);
    console.log(`  Moderators: ${adminStats.moderators}\n`);

    // Check vehicles
    const [vehicleStats] = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM vehicle_types) as vehicle_types,
        (SELECT COUNT(*) FROM vehicle_brands) as vehicle_brands,
        (SELECT COUNT(*) FROM vehicle_models) as vehicle_models,
        (SELECT COUNT(*) FROM user_vehicle_information) as user_vehicles,
        (SELECT COUNT(*) FROM user_vehicle_information WHERE is_verified = 1) as verified_vehicles
    `);

    console.log('🚗 VEHICLES:');
    console.log(`  Vehicle Types: ${vehicleStats.vehicle_types}`);
    console.log(`  Vehicle Brands: ${vehicleStats.vehicle_brands}`);
    console.log(`  Vehicle Models: ${vehicleStats.vehicle_models}`);
    console.log(`  User Vehicles: ${vehicleStats.user_vehicles}`);
    console.log(`  Verified Vehicles: ${vehicleStats.verified_vehicles}\n`);

    // Check rides
    const [rideStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_rides,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_rides,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_rides,
        ROUND(AVG(price_per_seat), 2) as avg_price_per_seat,
        ROUND(AVG(distance), 2) as avg_distance
      FROM rides
    `);

    console.log('🚀 RIDES:');
    console.log(`  Total Rides: ${rideStats.total_rides}`);
    console.log(`  Published Rides: ${rideStats.published_rides}`);
    console.log(`  Completed Rides: ${rideStats.completed_rides}`);
    console.log(`  Cancelled Rides: ${rideStats.cancelled_rides}`);
    console.log(`  Average Price per Seat: $${rideStats.avg_price_per_seat}`);
    console.log(`  Average Distance: ${rideStats.avg_distance} km\n`);

    // Check bookings
    const [bookingStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_bookings,
        ROUND(AVG(total_amount), 2) as avg_booking_amount,
        ROUND(SUM(total_amount), 2) as total_revenue
      FROM bookings
    `);

    console.log('📅 BOOKINGS:');
    console.log(`  Total Bookings: ${bookingStats.total_bookings}`);
    console.log(`  Confirmed Bookings: ${bookingStats.confirmed_bookings}`);
    console.log(`  Paid Bookings: ${bookingStats.paid_bookings}`);
    console.log(`  Average Booking Amount: $${bookingStats.avg_booking_amount}`);
    console.log(`  Total Revenue: $${bookingStats.total_revenue}\n`);

    // Check wallets
    const [walletStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_wallets,
        ROUND(AVG(balance), 2) as avg_balance,
        ROUND(SUM(balance), 2) as total_balance,
        (SELECT COUNT(*) FROM wallet_transactions) as total_transactions
      FROM wallets
    `);

    console.log('💰 WALLETS:');
    console.log(`  Total Wallets: ${walletStats.total_wallets}`);
    console.log(`  Average Balance: $${walletStats.avg_balance}`);
    console.log(`  Total Balance: $${walletStats.total_balance}`);
    console.log(`  Total Transactions: ${walletStats.total_transactions}\n`);

    // Check system data
    const [systemStats] = await executeQuery(`
      SELECT 
        (SELECT COUNT(*) FROM languages) as languages,
        (SELECT COUNT(*) FROM currencies) as currencies,
        (SELECT COUNT(*) FROM system_settings) as system_settings,
        (SELECT COUNT(*) FROM pricing_multipliers) as pricing_multipliers,
        (SELECT COUNT(*) FROM user_notifications) as notifications
    `);

    console.log('⚙️ SYSTEM DATA:');
    console.log(`  Languages: ${systemStats.languages}`);
    console.log(`  Currencies: ${systemStats.currencies}`);
    console.log(`  System Settings: ${systemStats.system_settings}`);
    console.log(`  Pricing Multipliers: ${systemStats.pricing_multipliers}`);
    console.log(`  Notifications: ${systemStats.notifications}\n`);

    // Sample admin credentials
    const adminUsers = await executeQuery(`
      SELECT email, role, is_active 
      FROM admin_users 
      WHERE email LIKE '%@mate.com' 
      ORDER BY role, email
    `);

    console.log('🔐 ADMIN LOGIN CREDENTIALS:');
    adminUsers.forEach(admin => {
      const password = admin.email.split('@')[0].replace('.', '') + '123';
      console.log(`  ${admin.role.toUpperCase()}: ${admin.email} / ${password} ${admin.is_active ? '✅' : '❌'}`);
    });

    console.log('\n✅ Data verification completed successfully!');
    console.log('🎉 Your admin panel is ready for testing with realistic data!');

  } catch (error) {
    logger.error('❌ Data verification failed:', error);
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
