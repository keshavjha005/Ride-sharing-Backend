const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (connection) => {
    try {
      // Create chat rooms table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS chat_rooms (
          id VARCHAR(36) PRIMARY KEY,
          room_type ENUM('ride', 'support', 'group') NOT NULL,
          ride_id VARCHAR(36),
          title_ar VARCHAR(255),
          title_en VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
        )
      `);

      // Create chat room participants table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS chat_room_participants (
          id VARCHAR(36) PRIMARY KEY,
          room_id VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          role ENUM('participant', 'admin', 'moderator') DEFAULT 'participant',
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          left_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_participant (room_id, user_id)
        )
      `);

      // Create chat messages table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id VARCHAR(36) PRIMARY KEY,
          room_id VARCHAR(36) NOT NULL,
          sender_id VARCHAR(36) NOT NULL,
          message_type ENUM('text', 'image', 'file', 'location', 'system') DEFAULT 'text',
          message_text TEXT,
          message_ar TEXT,
          message_en TEXT,
          media_url VARCHAR(500),
          media_type VARCHAR(50),
          file_size INT,
          location_data JSON,
          is_edited BOOLEAN DEFAULT false,
          edited_at TIMESTAMP,
          is_deleted BOOLEAN DEFAULT false,
          deleted_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create message status table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS message_status (
          id VARCHAR(36) PRIMARY KEY,
          message_id VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_message_status (message_id, user_id)
        )
      `);

      console.log('✅ Chat tables created successfully');
    } catch (error) {
      console.error('❌ Error creating chat tables:', error);
      throw error;
    }
  },

  down: async (connection) => {
    try {
      // Drop tables in reverse order due to foreign key constraints
      await connection.execute('DROP TABLE IF EXISTS message_status');
      await connection.execute('DROP TABLE IF EXISTS chat_messages');
      await connection.execute('DROP TABLE IF EXISTS chat_room_participants');
      await connection.execute('DROP TABLE IF EXISTS chat_rooms');

      console.log('✅ Chat tables dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping chat tables:', error);
      throw error;
    }
  }
}; 