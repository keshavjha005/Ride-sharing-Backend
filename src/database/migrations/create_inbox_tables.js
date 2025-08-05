const { v4: uuidv4 } = require('uuid');

/**
 * Migration: Create Inbox Management Tables
 * Task 3.5: Inbox Management System
 */
exports.up = async (connection) => {
  try {
    console.log('Creating inbox_conversations table...');
    await connection.execute(`
      CREATE TABLE inbox_conversations (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        conversation_type ENUM('ride', 'support', 'system', 'marketing') NOT NULL,
        title_ar VARCHAR(255),
        title_en VARCHAR(255),
        last_message_ar TEXT,
        last_message_en TEXT,
        last_message_at TIMESTAMP,
        unread_count INT DEFAULT 0,
        is_archived BOOLEAN DEFAULT false,
        is_muted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_inbox_conversations_user_id (user_id),
        INDEX idx_inbox_conversations_type (conversation_type),
        INDEX idx_inbox_conversations_last_message (last_message_at),
        INDEX idx_inbox_conversations_archived (is_archived),
        INDEX idx_inbox_conversations_muted (is_muted)
      )
    `);

    console.log('Creating conversation_participants table...');
    await connection.execute(`
      CREATE TABLE conversation_participants (
        id VARCHAR(36) PRIMARY KEY,
        conversation_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        role ENUM('participant', 'admin', 'support') DEFAULT 'participant',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        left_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        FOREIGN KEY (conversation_id) REFERENCES inbox_conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_conversation_participant (conversation_id, user_id),
        INDEX idx_conversation_participants_conversation_id (conversation_id),
        INDEX idx_conversation_participants_user_id (user_id),
        INDEX idx_conversation_participants_active (is_active)
      )
    `);

    console.log('✅ Inbox tables created successfully');
  } catch (error) {
    console.error('❌ Error creating inbox tables:', error);
    throw error;
  }
};

exports.down = async (connection) => {
  try {
    console.log('Dropping conversation_participants table...');
    await connection.execute('DROP TABLE IF EXISTS conversation_participants');

    console.log('Dropping inbox_conversations table...');
    await connection.execute('DROP TABLE IF EXISTS inbox_conversations');

    console.log('✅ Inbox tables dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping inbox tables:', error);
    throw error;
  }
}; 