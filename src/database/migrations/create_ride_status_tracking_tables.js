const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (connection) => {
    try {
      // Create ride status updates table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS ride_status_updates (
          id VARCHAR(36) PRIMARY KEY,
          ride_id VARCHAR(36) NOT NULL,
          status ENUM('pending', 'confirmed', 'started', 'in_progress', 'completed', 'cancelled') NOT NULL,
          status_message_ar VARCHAR(255),
          status_message_en VARCHAR(255),
          location_data JSON,
          estimated_arrival TIMESTAMP,
          actual_arrival TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
          INDEX idx_ride_status_updates_ride_id (ride_id),
          INDEX idx_ride_status_updates_status (status),
          INDEX idx_ride_status_updates_created_at (created_at)
        )
      `);

      // Create ride location tracking table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS ride_location_tracking (
          id VARCHAR(36) PRIMARY KEY,
          ride_id VARCHAR(36) NOT NULL,
          latitude DECIMAL(10,8) NOT NULL,
          longitude DECIMAL(11,8) NOT NULL,
          accuracy DECIMAL(5,2),
          speed DECIMAL(5,2),
          heading DECIMAL(5,2),
          altitude DECIMAL(8,2),
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
          INDEX idx_ride_location_tracking_ride_id (ride_id),
          INDEX idx_ride_location_tracking_timestamp (timestamp),
          INDEX idx_ride_location_tracking_coordinates (latitude, longitude)
        )
      `);

      console.log('✅ Ride status tracking tables created successfully');
    } catch (error) {
      console.error('❌ Error creating ride status tracking tables:', error);
      throw error;
    }
  },

  down: async (connection) => {
    try {
      // Drop tables in reverse order
      await connection.execute('DROP TABLE IF EXISTS ride_location_tracking');
      await connection.execute('DROP TABLE IF EXISTS ride_status_updates');
      
      console.log('✅ Ride status tracking tables dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping ride status tracking tables:', error);
      throw error;
    }
  }
}; 