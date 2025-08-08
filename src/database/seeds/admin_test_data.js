const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { executeQuery, executeTransaction } = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Comprehensive seed data script for testing the Mate admin panel
 * Creates realistic test data across all major entities
 */

// Helper function to generate random date within range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to generate random number within range
const randomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper function to generate random decimal
const randomDecimal = (min, max, decimals = 2) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
};

// Sample data arrays
const FIRST_NAMES = [
  'Ahmed', 'Mohammed', 'Ali', 'Omar', 'Hassan', 'Youssef', 'Khaled', 'Mahmoud',
  'John', 'Michael', 'David', 'James', 'Robert', 'William', 'Richard', 'Thomas',
  'Sarah', 'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia',
  'Fatima', 'Aisha', 'Maryam', 'Khadija', 'Zainab', 'Nour', 'Layla', 'Yasmin'
];

const LAST_NAMES = [
  'Al-Rashid', 'Al-Mahmoud', 'Al-Hassan', 'Al-Ahmad', 'Al-Mohamed', 'Al-Salem',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'
];

const CITIES = [
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
  { name: 'Houston', lat: 29.7604, lng: -95.3698 },
  { name: 'Phoenix', lat: 33.4484, lng: -112.0740 },
  { name: 'Philadelphia', lat: 39.9526, lng: -75.1652 },
  { name: 'San Antonio', lat: 29.4241, lng: -98.4936 },
  { name: 'San Diego', lat: 32.7157, lng: -117.1611 },
  { name: 'Dallas', lat: 32.7767, lng: -96.7970 },
  { name: 'San Jose', lat: 37.3382, lng: -121.8863 }
];

const VEHICLE_COLORS = [
  'White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown', 'Gold', 'Beige'
];

const PHONE_PREFIXES = ['+1', '+44', '+971', '+966', '+20', '+33', '+49', '+39', '+34', '+91'];

class AdminTestDataSeeder {
  constructor() {
    this.createdIds = {
      users: [],
      adminUsers: [],
      vehicleTypes: [],
      vehicleBrands: [],
      vehicleModels: [],
      userVehicles: [],
      rides: [],
      bookings: [],
      wallets: [],
      currencies: [],
      languages: []
    };
  }

  async seedAll() {
    try {
      logger.info('Starting comprehensive admin test data seeding...');

      // Seed in dependency order
      await this.seedLanguages();
      await this.seedCurrencies();
      await this.seedUsers();
      await this.seedAdminUsers();
      await this.seedVehicleData();
      await this.seedWallets();
      await this.seedRides();
      await this.seedBookings();
      await this.seedPricingData();
      await this.seedNotifications();
      await this.seedReports();
      await this.seedSystemSettings();
      await this.seedAnalyticsData();

      logger.info('Admin test data seeding completed successfully!');
      return this.createdIds;
    } catch (error) {
      logger.error('Error seeding admin test data:', error);
      throw error;
    }
  }

  async seedLanguages() {
    logger.info('Seeding languages...');
    
    const languages = [
      { code: 'en', name: 'English', native_name: 'English', is_rtl: false, is_active: true },
      { code: 'ar', name: 'Arabic', native_name: 'العربية', is_rtl: true, is_active: true },
      { code: 'es', name: 'Spanish', native_name: 'Español', is_rtl: false, is_active: true },
      { code: 'fr', name: 'French', native_name: 'Français', is_rtl: false, is_active: true },
      { code: 'de', name: 'German', native_name: 'Deutsch', is_rtl: false, is_active: false },
      { code: 'it', name: 'Italian', native_name: 'Italiano', is_rtl: false, is_active: false }
    ];

    for (const lang of languages) {
      try {
        await executeQuery(`
          INSERT IGNORE INTO languages (code, name, native_name, is_rtl, is_active) 
          VALUES (?, ?, ?, ?, ?)
        `, [lang.code, lang.name, lang.native_name, lang.is_rtl, lang.is_active]);
        
        this.createdIds.languages.push(lang.code);
      } catch (error) {
        logger.warn(`Failed to insert language ${lang.code}:`, error.message);
      }
    }
  }

  async seedCurrencies() {
    logger.info('Seeding currencies...');
    
    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', exchange_rate: 1.00, is_active: true },
      { code: 'EUR', name: 'Euro', symbol: '€', exchange_rate: 0.85, is_active: true },
      { code: 'GBP', name: 'British Pound', symbol: '£', exchange_rate: 0.73, is_active: true },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exchange_rate: 3.67, is_active: true },
      { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', exchange_rate: 3.75, is_active: true },
      { code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م', exchange_rate: 30.90, is_active: false }
    ];

    for (const currency of currencies) {
      try {
        await executeQuery(`
          INSERT IGNORE INTO currencies (code, name, symbol, exchange_rate, is_active) 
          VALUES (?, ?, ?, ?, ?)
        `, [currency.code, currency.name, currency.symbol, currency.exchange_rate, currency.is_active]);
        
        this.createdIds.currencies.push(currency.code);
      } catch (error) {
        logger.warn(`Failed to insert currency ${currency.code}:`, error.message);
      }
    }
  }

  async seedUsers() {
    logger.info('Seeding users...');
    
    const userCount = 150; // Create 150 test users
    
    for (let i = 0; i < userCount; i++) {
      const userId = uuidv4();
      const firstName = FIRST_NAMES[randomNumber(0, FIRST_NAMES.length - 1)];
      const lastName = LAST_NAMES[randomNumber(0, LAST_NAMES.length - 1)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}${i}@example.com`;
      const phone = `${PHONE_PREFIXES[randomNumber(0, PHONE_PREFIXES.length - 1)]}${randomNumber(1000000000, 9999999999)}`;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const userData = {
        id: userId,
        email: email,
        phone: phone,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        profile_image_url: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=fd7a00&color=fff`,
        date_of_birth: randomDate(new Date(1970, 0, 1), new Date(2000, 11, 31)),
        gender: Math.random() > 0.5 ? 'male' : 'female',
        language_code: ['en', 'ar', 'es', 'fr'][randomNumber(0, 3)],
        currency_code: ['USD', 'EUR', 'GBP', 'AED'][randomNumber(0, 3)],
        is_verified: Math.random() > 0.2, // 80% verified
        is_active: Math.random() > 0.1, // 90% active
        last_login_at: Math.random() > 0.3 ? randomDate(new Date(2024, 0, 1), new Date()) : null,
        created_at: randomDate(new Date(2023, 0, 1), new Date())
      };

      try {
        await executeQuery(`
          INSERT INTO users (
            id, email, phone, password_hash, first_name, last_name, 
            profile_image_url, date_of_birth, gender, language_code, currency_code,
            is_verified, is_active, last_login_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userData.id, userData.email, userData.phone, userData.password_hash,
          userData.first_name, userData.last_name, userData.profile_image_url,
          userData.date_of_birth, userData.gender, userData.language_code, userData.currency_code,
          userData.is_verified, userData.is_active, userData.last_login_at, userData.created_at
        ]);

        this.createdIds.users.push(userId);
      } catch (error) {
        logger.warn(`Failed to create user ${email}:`, error.message);
      }
    }
  }

  async seedAdminUsers() {
    logger.info('Seeding admin users...');
    
    const adminUsers = [
      {
        email: 'super.admin@mate.com',
        password: 'superadmin123',
        first_name: 'Super',
        last_name: 'Admin',
        role: 'super_admin',
        permissions: {
          users: ['read', 'write', 'delete'],
          rides: ['read', 'write', 'delete'],
          analytics: ['read', 'write'],
          settings: ['read', 'write', 'delete'],
          reports: ['read', 'write', 'delete'],
          admin_management: ['read', 'write', 'delete'],
          localization: ['read', 'write', 'delete'],
          pricing: ['read', 'write', 'delete'],
          vehicles: ['read', 'write', 'delete']
        }
      },
      {
        email: 'admin.manager@mate.com',
        password: 'adminmanager123',
        first_name: 'Admin',
        last_name: 'Manager',
        role: 'admin',
        permissions: {
          users: ['read', 'write'],
          rides: ['read', 'write'],
          analytics: ['read'],
          settings: ['read', 'write'],
          reports: ['read', 'write'],
          vehicles: ['read', 'write']
        }
      },
      {
        email: 'support.lead@mate.com',
        password: 'supportlead123',
        first_name: 'Support',
        last_name: 'Lead',
        role: 'support',
        permissions: {
          users: ['read', 'write'],
          rides: ['read'],
          analytics: ['read'],
          reports: ['read']
        }
      },
      {
        email: 'moderator@mate.com',
        password: 'moderator123',
        first_name: 'Content',
        last_name: 'Moderator',
        role: 'moderator',
        permissions: {
          users: ['read'],
          rides: ['read'],
          analytics: ['read']
        }
      }
    ];

    for (const admin of adminUsers) {
      const adminId = uuidv4();
      const passwordHash = await bcrypt.hash(admin.password, 12);
      
      try {
        await executeQuery(`
          INSERT IGNORE INTO admin_users (
            id, email, password_hash, first_name, last_name, role, 
            permissions, language_code, timezone, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          adminId, admin.email, passwordHash, admin.first_name, admin.last_name,
          admin.role, JSON.stringify(admin.permissions), 'en', 'UTC', true
        ]);

        this.createdIds.adminUsers.push(adminId);
      } catch (error) {
        logger.warn(`Failed to create admin user ${admin.email}:`, error.message);
      }
    }
  }

  async seedVehicleData() {
    logger.info('Seeding vehicle data...');
    
    // Get existing vehicle types, brands, and models
    const vehicleTypes = await executeQuery('SELECT * FROM vehicle_types');
    const vehicleBrands = await executeQuery('SELECT * FROM vehicle_brands');
    
    // Create vehicle models for each brand
    const modelNames = {
      'Toyota': ['Camry', 'Corolla', 'Prius', 'RAV4', 'Highlander', 'Sienna'],
      'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Fit'],
      'Ford': ['Focus', 'Mustang', 'Explorer', 'F-150', 'Escape', 'Edge'],
      'Chevrolet': ['Malibu', 'Cruze', 'Equinox', 'Tahoe', 'Silverado', 'Suburban'],
      'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Armada', 'Versa'],
      'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'X7', 'i3'],
      'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'Sprinter'],
      'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7'],
      'Volkswagen': ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf', 'Beetle'],
      'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Accent']
    };

    // Create vehicle models
    for (const brand of vehicleBrands) {
      const models = modelNames[brand.name] || ['Model 1', 'Model 2', 'Model 3'];
      
      for (const modelName of models) {
        const modelId = uuidv4();
        
        try {
          await executeQuery(`
            INSERT IGNORE INTO vehicle_models (id, brand_id, name, is_active)
            VALUES (?, ?, ?, ?)
          `, [modelId, brand.id, modelName, true]);
          
          this.createdIds.vehicleModels.push(modelId);
        } catch (error) {
          logger.warn(`Failed to create vehicle model ${modelName}:`, error.message);
        }
      }
    }

    // Create user vehicles
    const allModels = await executeQuery(`
      SELECT vm.*, vb.name as brand_name 
      FROM vehicle_models vm 
      JOIN vehicle_brands vb ON vm.brand_id = vb.id
    `);

    const userVehicleCount = Math.min(100, this.createdIds.users.length); // Create up to 100 user vehicles
    
    for (let i = 0; i < userVehicleCount; i++) {
      const vehicleId = uuidv4();
      const userId = this.createdIds.users[randomNumber(0, this.createdIds.users.length - 1)];
      const vehicleType = vehicleTypes[randomNumber(0, vehicleTypes.length - 1)];
      const model = allModels[randomNumber(0, allModels.length - 1)];
      const color = VEHICLE_COLORS[randomNumber(0, VEHICLE_COLORS.length - 1)];
      const year = randomNumber(2015, 2024);
      
      // Generate realistic license plate
      const plateLetters = String.fromCharCode(65 + randomNumber(0, 25)) + 
                          String.fromCharCode(65 + randomNumber(0, 25)) + 
                          String.fromCharCode(65 + randomNumber(0, 25));
      const plateNumbers = randomNumber(1000, 9999);
      const vehicleNumber = `${plateLetters}${plateNumbers}`;

      try {
        await executeQuery(`
          INSERT INTO user_vehicle_information (
            id, user_id, vehicle_type_id, vehicle_brand_id, vehicle_model_id,
            vehicle_number, vehicle_color, vehicle_year, vehicle_image,
            is_verified, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          vehicleId, userId, vehicleType.id, model.brand_id, model.id,
          vehicleNumber, color, year, 
          `https://via.placeholder.com/400x300/fd7a00/ffffff?text=${model.brand_name}+${model.name}`,
          Math.random() > 0.3, // 70% verified
          Math.random() > 0.1   // 90% active
        ]);

        this.createdIds.userVehicles.push(vehicleId);
      } catch (error) {
        logger.warn(`Failed to create user vehicle ${vehicleNumber}:`, error.message);
      }
    }
  }

  async seedWallets() {
    logger.info('Seeding wallets and transactions...');
    
    // Create wallets for all users
    for (const userId of this.createdIds.users) {
      const walletId = uuidv4();
      const balance = randomDecimal(0, 1000, 2);
      
      try {
        await executeQuery(`
          INSERT INTO wallets (id, user_id, balance, currency_code, is_active)
          VALUES (?, ?, ?, ?, ?)
        `, [walletId, userId, balance, 'USD', true]);

        this.createdIds.wallets.push(walletId);

        // Create some wallet transactions
        const transactionCount = randomNumber(1, 10);
        let currentBalance = 0;

        for (let i = 0; i < transactionCount; i++) {
          const transactionId = uuidv4();
          const transactionType = Math.random() > 0.5 ? 'credit' : 'debit';
          const amount = randomDecimal(5, 100, 2);
          const balanceBefore = currentBalance;
          
          if (transactionType === 'credit') {
            currentBalance += amount;
          } else if (currentBalance >= amount) {
            currentBalance -= amount;
          } else {
            continue; // Skip if insufficient balance
          }

          const categories = ['ride_payment', 'ride_earning', 'wallet_recharge', 'withdrawal', 'refund', 'commission', 'bonus'];
          const category = categories[randomNumber(0, categories.length - 1)];

          await executeQuery(`
            INSERT INTO wallet_transactions (
              id, wallet_id, transaction_type, amount, balance_before, balance_after,
              transaction_category, description, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            transactionId, walletId, transactionType, amount, balanceBefore, currentBalance,
            category, `${category.replace('_', ' ')} transaction`, 'completed',
            randomDate(new Date(2023, 0, 1), new Date())
          ]);
        }

        // Update wallet with final balance
        await executeQuery('UPDATE wallets SET balance = ? WHERE id = ?', [currentBalance, walletId]);

      } catch (error) {
        logger.warn(`Failed to create wallet for user ${userId}:`, error.message);
      }
    }
  }

  async seedRides() {
    logger.info('Seeding rides...');
    
    const rideCount = 200; // Create 200 test rides
    
    for (let i = 0; i < rideCount; i++) {
      const rideId = uuidv4();
      const userId = this.createdIds.users[randomNumber(0, this.createdIds.users.length - 1)];
      const vehicleId = this.createdIds.userVehicles[randomNumber(0, this.createdIds.userVehicles.length - 1)];
      
      if (!vehicleId) continue;

      const totalSeats = randomNumber(2, 8);
      const bookedSeats = randomNumber(0, totalSeats);
      const pricePerSeat = randomDecimal(10, 100, 2);
      const distance = randomDecimal(5, 500, 2);
      const estimatedTime = Math.round(distance * 1.5); // Rough estimate
      
      const statuses = ['draft', 'published', 'in_progress', 'completed', 'cancelled'];
      const status = statuses[randomNumber(0, statuses.length - 1)];
      const isPublished = status !== 'draft';
      
      const departureDate = randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31));

      try {
        await executeQuery(`
          INSERT INTO rides (
            id, created_by, vehicle_information_id, total_seats, booked_seats,
            price_per_seat, distance, estimated_time, luggage_allowed, women_only,
            driver_verified, two_passenger_max_back, status, is_published,
            departure_datetime, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          rideId, userId, vehicleId, totalSeats, bookedSeats, pricePerSeat,
          distance, estimatedTime, Math.random() > 0.2, Math.random() > 0.8,
          Math.random() > 0.3, Math.random() > 0.7, status, isPublished,
          departureDate, randomDate(new Date(2023, 6, 1), departureDate)
        ]);

        // Create ride locations
        const pickupCity = CITIES[randomNumber(0, CITIES.length - 1)];
        const dropCity = CITIES[randomNumber(0, CITIES.length - 1)];

        // Pickup location
        await executeQuery(`
          INSERT INTO ride_locations (
            id, ride_id, location_type, address, latitude, longitude, sequence_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(), rideId, 'pickup', 
          `${randomNumber(100, 999)} ${pickupCity.name} St, ${pickupCity.name}`,
          pickupCity.lat + randomDecimal(-0.1, 0.1, 6),
          pickupCity.lng + randomDecimal(-0.1, 0.1, 6),
          0
        ]);

        // Drop location
        await executeQuery(`
          INSERT INTO ride_locations (
            id, ride_id, location_type, address, latitude, longitude, sequence_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(), rideId, 'drop',
          `${randomNumber(100, 999)} ${dropCity.name} Ave, ${dropCity.name}`,
          dropCity.lat + randomDecimal(-0.1, 0.1, 6),
          dropCity.lng + randomDecimal(-0.1, 0.1, 6),
          1
        ]);

        // Maybe add a stopover
        if (Math.random() > 0.7) {
          const stopCity = CITIES[randomNumber(0, CITIES.length - 1)];
          await executeQuery(`
            INSERT INTO ride_locations (
              id, ride_id, location_type, address, latitude, longitude, sequence_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            uuidv4(), rideId, 'stopover',
            `${randomNumber(100, 999)} ${stopCity.name} Blvd, ${stopCity.name}`,
            stopCity.lat + randomDecimal(-0.1, 0.1, 6),
            stopCity.lng + randomDecimal(-0.1, 0.1, 6),
            1
          ]);
        }

        // Create travel preferences
        const chattiness = ['love_to_chat', 'chatty_when_comfortable', 'quiet_type'];
        const smoking = ['fine_with_smoking', 'breaks_outside_ok', 'no_smoking'];
        const music = ['playlist_important', 'depends_on_mood', 'silence_golden'];

        await executeQuery(`
          INSERT INTO ride_travel_preferences (
            id, ride_id, chattiness, smoking, music
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          uuidv4(), rideId,
          chattiness[randomNumber(0, chattiness.length - 1)],
          smoking[randomNumber(0, smoking.length - 1)],
          music[randomNumber(0, music.length - 1)]
        ]);

        this.createdIds.rides.push(rideId);
      } catch (error) {
        logger.warn(`Failed to create ride ${rideId}:`, error.message);
      }
    }
  }

  async seedBookings() {
    logger.info('Seeding bookings...');
    
    const publishedRides = await executeQuery(`
      SELECT id, created_by, total_seats, booked_seats, price_per_seat 
      FROM rides 
      WHERE status IN ('published', 'in_progress', 'completed')
    `);

    for (const ride of publishedRides) {
      const bookingCount = Math.min(ride.booked_seats || randomNumber(0, ride.total_seats), 3);
      
      for (let i = 0; i < bookingCount; i++) {
        const bookingId = uuidv4();
        let userId;
        
        // Make sure booking user is different from ride creator
        do {
          userId = this.createdIds.users[randomNumber(0, this.createdIds.users.length - 1)];
        } while (userId === ride.created_by);

        const bookedSeats = randomNumber(1, 2);
        const totalAmount = bookedSeats * ride.price_per_seat;
        
        const statuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
        const paymentTypes = ['wallet', 'card', 'cash'];
        
        const status = statuses[randomNumber(0, statuses.length - 1)];
        const paymentStatus = status === 'completed' ? 'paid' : paymentStatuses[randomNumber(0, paymentStatuses.length - 1)];
        const paymentType = paymentTypes[randomNumber(0, paymentTypes.length - 1)];

        try {
          await executeQuery(`
            INSERT INTO bookings (
              id, ride_id, user_id, booked_seats, total_amount, status,
              payment_status, payment_type, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            bookingId, ride.id, userId, bookedSeats, totalAmount, status,
            paymentStatus, paymentType, randomDate(new Date(2023, 6, 1), new Date())
          ]);

          this.createdIds.bookings.push(bookingId);
        } catch (error) {
          logger.warn(`Failed to create booking ${bookingId}:`, error.message);
        }
      }
    }
  }

  async seedPricingData() {
    logger.info('Seeding pricing data...');
    
    // Create pricing events
    const events = [
      {
        name: 'New Year Surge',
        type: 'special_event',
        start_date: '2024-12-31 18:00:00',
        end_date: '2025-01-01 06:00:00',
        multiplier: 2.5,
        description: 'Premium pricing for New Year celebrations'
      },
      {
        name: 'Summer Peak',
        type: 'seasonal',
        start_date: '2024-06-01 00:00:00',
        end_date: '2024-08-31 23:59:59',
        multiplier: 1.3,
        description: 'Summer season pricing adjustment'
      },
      {
        name: 'Christmas Holiday',
        type: 'holiday',
        start_date: '2024-12-24 00:00:00',
        end_date: '2024-12-26 23:59:59',
        multiplier: 1.8,
        description: 'Christmas holiday premium pricing'
      },
      {
        name: 'Rush Hour Premium',
        type: 'demand_surge',
        start_date: '2024-01-01 07:00:00',
        end_date: '2024-12-31 09:00:00',
        multiplier: 1.4,
        description: 'Morning rush hour pricing'
      }
    ];

    for (const event of events) {
      const eventId = uuidv4();
      
      try {
        await executeQuery(`
          INSERT INTO pricing_events (
            id, event_name, event_type, start_date, end_date, pricing_multiplier,
            affected_vehicle_types, affected_areas, description, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          eventId, event.name, event.type, event.start_date, event.end_date,
          event.multiplier, JSON.stringify(['all']), JSON.stringify(['all']),
          event.description, true
        ]);
      } catch (error) {
        logger.warn(`Failed to create pricing event ${event.name}:`, error.message);
      }
    }

    // Create some pricing calculations
    for (let i = 0; i < 50; i++) {
      const calculationId = uuidv4();
      const rideId = this.createdIds.rides[randomNumber(0, this.createdIds.rides.length - 1)];
      const vehicleTypes = await executeQuery('SELECT id FROM vehicle_types LIMIT 5');
      const vehicleType = vehicleTypes[randomNumber(0, vehicleTypes.length - 1)];
      
      const baseDistance = randomDecimal(5, 200, 2);
      const baseFare = randomDecimal(10, 150, 2);
      const finalFare = baseFare * randomDecimal(1.0, 2.0, 2);
      
      try {
        await executeQuery(`
          INSERT INTO pricing_calculations (
            id, trip_id, vehicle_type_id, base_distance, base_fare,
            applied_multipliers, final_fare, calculation_details
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          calculationId, rideId, vehicleType.id, baseDistance, baseFare,
          JSON.stringify([{ type: 'peak_hour', value: 1.25 }]),
          finalFare,
          JSON.stringify({ calculation_time: new Date().toISOString() })
        ]);
      } catch (error) {
        logger.warn(`Failed to create pricing calculation:`, error.message);
      }
    }
  }

  async seedNotifications() {
    logger.info('Seeding notifications...');
    
    const notificationTypes = [
      'booking_confirmed', 'booking_cancelled', 'ride_started', 'ride_completed',
      'payment_successful', 'payment_failed', 'wallet_recharged', 'profile_updated'
    ];

    for (let i = 0; i < 100; i++) {
      const notificationId = uuidv4();
      const userId = this.createdIds.users[randomNumber(0, this.createdIds.users.length - 1)];
      const type = notificationTypes[randomNumber(0, notificationTypes.length - 1)];
      
      try {
        await executeQuery(`
          INSERT INTO user_notifications (
            id, user_id, notification_type, title, message, is_read,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          notificationId, userId, type,
          `${type.replace('_', ' ')} notification`,
          `This is a test ${type.replace('_', ' ')} notification message.`,
          Math.random() > 0.3, // 70% read
          randomDate(new Date(2023, 0, 1), new Date())
        ]);
      } catch (error) {
        logger.warn(`Failed to create notification:`, error.message);
      }
    }
  }

  async seedReports() {
    logger.info('Seeding reports...');
    
    // Create user reports
    for (let i = 0; i < 20; i++) {
      const reportId = uuidv4();
      const reportedUserId = this.createdIds.users[randomNumber(0, this.createdIds.users.length - 1)];
      const reporterUserId = this.createdIds.users[randomNumber(0, this.createdIds.users.length - 1)];
      
      if (reportedUserId === reporterUserId) continue;

      const reportTypes = ['inappropriate_behavior', 'safety_concern', 'fraud', 'other'];
      const reportType = reportTypes[randomNumber(0, reportTypes.length - 1)];
      const statuses = ['pending', 'under_review', 'resolved', 'dismissed'];
      const status = statuses[randomNumber(0, statuses.length - 1)];

      try {
        await executeQuery(`
          INSERT INTO user_reports (
            id, reported_user_id, reporter_user_id, report_type, description,
            status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          reportId, reportedUserId, reporterUserId, reportType,
          `Test report for ${reportType.replace('_', ' ')}`,
          status, randomDate(new Date(2023, 0, 1), new Date())
        ]);
      } catch (error) {
        logger.warn(`Failed to create user report:`, error.message);
      }
    }
  }

  async seedSystemSettings() {
    logger.info('Seeding additional system settings...');
    
    const additionalSettings = [
      { key: 'ride_booking_timeout', value: '15', type: 'number', category: 'ride' },
      { key: 'max_passengers_per_ride', value: '8', type: 'number', category: 'ride' },
      { key: 'driver_rating_threshold', value: '4.0', type: 'number', category: 'quality' },
      { key: 'auto_cancel_unpaid_bookings', value: 'true', type: 'boolean', category: 'booking' },
      { key: 'enable_ride_sharing', value: 'true', type: 'boolean', category: 'feature' },
      { key: 'support_email', value: 'support@mate.com', type: 'string', category: 'contact' },
      { key: 'support_phone', value: '+1-800-MATE-APP', type: 'string', category: 'contact' }
    ];

    for (const setting of additionalSettings) {
      try {
        await executeQuery(`
          INSERT IGNORE INTO system_settings (
            id, setting_key, setting_value, setting_type, category,
            title_en, description_en, is_public, is_editable
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(), setting.key, setting.value, setting.type, setting.category,
          setting.key.replace('_', ' ').toUpperCase(),
          `Configuration for ${setting.key.replace('_', ' ')}`,
          false, true
        ]);
      } catch (error) {
        logger.warn(`Failed to create system setting ${setting.key}:`, error.message);
      }
    }
  }

  async seedAnalyticsData() {
    logger.info('Seeding analytics data...');
    
    // Create user analytics
    for (const userId of this.createdIds.users.slice(0, 50)) { // First 50 users
      try {
        await executeQuery(`
          INSERT INTO user_analytics (
            id, user_id, total_rides_as_driver, total_rides_as_passenger,
            total_earnings, total_spent, average_rating_as_driver,
            average_rating_as_passenger, total_distance_driven, total_distance_traveled
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(), userId,
          randomNumber(0, 50), randomNumber(0, 100),
          randomDecimal(0, 5000, 2), randomDecimal(0, 2000, 2),
          randomDecimal(3.5, 5.0, 2), randomDecimal(3.5, 5.0, 2),
          randomDecimal(0, 10000, 2), randomDecimal(0, 5000, 2)
        ]);
      } catch (error) {
        logger.warn(`Failed to create user analytics for ${userId}:`, error.message);
      }
    }

    // Create ride analytics
    for (const rideId of this.createdIds.rides.slice(0, 50)) { // First 50 rides
      try {
        await executeQuery(`
          INSERT INTO ride_analytics (
            id, ride_id, total_bookings, total_revenue, average_rating,
            total_ratings, completion_rate
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          uuidv4(), rideId,
          randomNumber(0, 8), randomDecimal(0, 800, 2),
          randomDecimal(3.5, 5.0, 2), randomNumber(0, 10),
          randomDecimal(0.7, 1.0, 2)
        ]);
      } catch (error) {
        logger.warn(`Failed to create ride analytics for ${rideId}:`, error.message);
      }
    }
  }

  async clearExistingData() {
    logger.info('Clearing existing test data...');
    
    const tables = [
      'user_notifications', 'user_reports', 'user_analytics', 'ride_analytics',
      'pricing_calculations', 'pricing_events', 'booking_taxes', 'bookings',
      'ride_travel_preferences', 'ride_locations', 'rides',
      'wallet_transactions', 'wallet_recharge_requests', 'wallets',
      'user_vehicle_information', 'vehicle_models', 'admin_activity_logs',
      'admin_sessions'
    ];

    for (const table of tables) {
      try {
        await executeQuery(`DELETE FROM ${table} WHERE created_at >= '2023-01-01'`);
      } catch (error) {
        logger.warn(`Failed to clear table ${table}:`, error.message);
      }
    }

    // Clear test users (but keep admin users)
    try {
      await executeQuery(`DELETE FROM users WHERE email LIKE '%@example.com'`);
    } catch (error) {
      logger.warn('Failed to clear test users:', error.message);
    }
  }
}

// Export the seeder class
module.exports = AdminTestDataSeeder;

// If run directly, execute the seeder
if (require.main === module) {
  const seeder = new AdminTestDataSeeder();
  
  seeder.seedAll()
    .then((createdIds) => {
      logger.info('Test data seeding completed successfully!');
      logger.info('Created IDs summary:', {
        users: createdIds.users.length,
        adminUsers: createdIds.adminUsers.length,
        userVehicles: createdIds.userVehicles.length,
        rides: createdIds.rides.length,
        bookings: createdIds.bookings.length,
        wallets: createdIds.wallets.length
      });
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Test data seeding failed:', error);
      process.exit(1);
    });
}
