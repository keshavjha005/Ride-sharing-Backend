const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (connection) => {
    try {
      // Create rides table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS rides (
          id VARCHAR(36) PRIMARY KEY,
          created_by VARCHAR(36) NOT NULL,
          vehicle_information_id VARCHAR(36) NOT NULL,
          total_seats INT NOT NULL,
          booked_seats INT DEFAULT 0,
          price_per_seat DECIMAL(10,2) NOT NULL,
          distance DECIMAL(10,2),
          estimated_time INT,
          luggage_allowed BOOLEAN DEFAULT true,
          women_only BOOLEAN DEFAULT false,
          driver_verified BOOLEAN DEFAULT false,
          two_passenger_max_back BOOLEAN DEFAULT false,
          status ENUM('draft', 'published', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
          is_published BOOLEAN DEFAULT false,
          departure_datetime TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (vehicle_information_id) REFERENCES user_vehicle_information(id)
        )
      `);

      // Create ride locations table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS ride_locations (
          id VARCHAR(36) PRIMARY KEY,
          ride_id VARCHAR(36) NOT NULL,
          location_type ENUM('pickup', 'drop', 'stopover') NOT NULL,
          address VARCHAR(500) NOT NULL,
          latitude DECIMAL(10,8) NOT NULL,
          longitude DECIMAL(11,8) NOT NULL,
          sequence_order INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
        )
      `);

      // Create ride travel preferences table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS ride_travel_preferences (
          id VARCHAR(36) PRIMARY KEY,
          ride_id VARCHAR(36) NOT NULL,
          chattiness ENUM('love_to_chat', 'chatty_when_comfortable', 'quiet_type'),
          smoking ENUM('fine_with_smoking', 'breaks_outside_ok', 'no_smoking'),
          music ENUM('playlist_important', 'depends_on_mood', 'silence_golden'),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
        )
      `);

      // Create bookings table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS bookings (
          id VARCHAR(36) PRIMARY KEY,
          ride_id VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          booked_seats INT NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
          payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
          payment_type ENUM('wallet', 'card', 'cash') DEFAULT 'wallet',
          pickup_location_id VARCHAR(36),
          drop_location_id VARCHAR(36),
          stopover_id VARCHAR(36),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (pickup_location_id) REFERENCES ride_locations(id),
          FOREIGN KEY (drop_location_id) REFERENCES ride_locations(id),
          FOREIGN KEY (stopover_id) REFERENCES ride_locations(id)
        )
      `);

      // Create booking taxes table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS booking_taxes (
          id VARCHAR(36) PRIMARY KEY,
          booking_id VARCHAR(36) NOT NULL,
          tax_name VARCHAR(100) NOT NULL,
          tax_percentage DECIMAL(5,2) NOT NULL,
          tax_amount DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
        )
      `);

      // Create search history table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_search_history (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          pickup_location VARCHAR(500),
          drop_location VARCHAR(500),
          search_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create ride statistics table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS ride_statistics (
          id VARCHAR(36) PRIMARY KEY,
          ride_id VARCHAR(36) NOT NULL,
          total_bookings INT DEFAULT 0,
          total_revenue DECIMAL(10,2) DEFAULT 0.00,
          average_rating DECIMAL(3,2) DEFAULT 0.00,
          total_ratings INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
        )
      `);

      console.log('✅ Ride tables created successfully');
    } catch (error) {
      console.error('❌ Error creating ride tables:', error);
      throw error;
    }
  },

  down: async (connection) => {
    try {
      await connection.execute('DROP TABLE IF EXISTS ride_statistics');
      await connection.execute('DROP TABLE IF EXISTS user_search_history');
      await connection.execute('DROP TABLE IF EXISTS booking_taxes');
      await connection.execute('DROP TABLE IF EXISTS bookings');
      await connection.execute('DROP TABLE IF EXISTS ride_travel_preferences');
      await connection.execute('DROP TABLE IF EXISTS ride_locations');
      await connection.execute('DROP TABLE IF EXISTS rides');
      console.log('✅ Ride tables dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping ride tables:', error);
      throw error;
    }
  }
}; 