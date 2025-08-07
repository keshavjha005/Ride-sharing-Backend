const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class ChatMessage {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.roomId = data.roomId;
    this.senderId = data.senderId;
    this.messageType = data.messageType || 'text';
    this.messageText = data.messageText || null;
    this.messageAr = data.messageAr || null;
    this.messageEn = data.messageEn || null;
    this.mediaUrl = data.mediaUrl || null;
    this.mediaType = data.mediaType || null;
    this.fileSize = data.fileSize || null;
    this.locationData = data.locationData || null;
    this.isEdited = data.isEdited || false;
    this.editedAt = data.editedAt || null;
    this.isDeleted = data.isDeleted || false;
    this.deletedAt = data.deletedAt || null;
    this.createdAt = data.createdAt || new Date();
  }

  // Create a new chat message
  static async create(messageData) {
    try {
      const message = new ChatMessage(messageData);
      
      const query = `
        INSERT INTO chat_messages (
          id, room_id, sender_id, message_type, message_text, message_ar, message_en,
          media_url, media_type, file_size, location_data, is_edited, edited_at,
          is_deleted, deleted_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        message.id,
        message.roomId,
        message.senderId,
        message.messageType,
        message.messageText,
        message.messageAr,
        message.messageEn,
        message.mediaUrl,
        message.mediaType,
        message.fileSize,
        message.locationData ? JSON.stringify(message.locationData) : null,
        message.isEdited,
        message.editedAt,
        message.isDeleted,
        message.deletedAt,
        message.createdAt
      ];

      await executeQuery(query, values);
      
      // Create message status for all room participants
      await this.createMessageStatuses(message.id, message.roomId);
      
      logger.info(`Chat message created successfully with ID: ${message.id}`);
      return this.findById(message.id);
    } catch (error) {
      logger.error('Error creating chat message:', error);
      throw error;
    }
  }

  // Find message by ID
  static async findById(messageId) {
    try {
      const query = `
        SELECT cm.*, 
               u.first_name, u.last_name, u.email, u.profile_image_url,
               cr.room_type, cr.title_en as room_title_en, cr.title_ar as room_title_ar
        FROM chat_messages cm
        INNER JOIN users u ON cm.sender_id = u.id
        INNER JOIN chat_rooms cr ON cm.room_id = cr.id
        WHERE cm.id = ? AND cm.is_deleted = false AND u.is_deleted IS NULL
      `;

      const messages = await executeQuery(query, [messageId]);
      return messages[0] || null;
    } catch (error) {
      logger.error('Error finding chat message by ID:', error);
      throw error;
    }
  }

  // Get messages for a room
  static async findByRoomId(roomId, limit = 50, offset = 0, beforeDate = null) {
    try {
      let query = `
        SELECT cm.*, 
               u.first_name, u.last_name, u.email, u.profile_image_url
        FROM chat_messages cm
        INNER JOIN users u ON cm.sender_id = u.id
        WHERE cm.room_id = ? AND cm.is_deleted = false AND u.is_deleted IS NULL
      `;

      const values = [roomId];

      if (beforeDate) {
        query += ` AND cm.created_at < ?`;
        values.push(beforeDate);
      }

      query += ` ORDER BY cm.created_at DESC LIMIT ? OFFSET ?`;
      values.push(limit, offset);

      const messages = await executeQuery(query, values);
      return messages.reverse(); // Return in chronological order
    } catch (error) {
      logger.error('Error finding chat messages by room ID:', error);
      throw error;
    }
  }

  // Get messages by sender
  static async findBySenderId(senderId, limit = 20, offset = 0) {
    try {
      const query = `
        SELECT cm.*, 
               cr.room_type, cr.title_en as room_title_en, cr.title_ar as room_title_ar
        FROM chat_messages cm
        INNER JOIN chat_rooms cr ON cm.room_id = cr.id
        WHERE cm.sender_id = ? AND cm.is_deleted = false
        ORDER BY cm.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const messages = await executeQuery(query, [senderId, parseInt(limit), parseInt(offset)]);
      return messages;
    } catch (error) {
      logger.error('Error finding chat messages by sender ID:', error);
      throw error;
    }
  }

  // Update message
  static async update(messageId, updateData) {
    try {
      const allowedFields = ['messageText', 'messageAr', 'messageEn', 'isEdited'];
      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          const dbField = key === 'messageText' ? 'message_text' : 
                         key === 'messageAr' ? 'message_ar' : 
                         key === 'messageEn' ? 'message_en' : 
                         key === 'isEdited' ? 'is_edited' : key;
          updates.push(`${dbField} = ?`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      if (updateData.isEdited) {
        updates.push('edited_at = ?');
        values.push(new Date());
      }

      values.push(messageId);

      const query = `
        UPDATE chat_messages 
        SET ${updates.join(', ')}
        WHERE id = ?
      `;

      await executeQuery(query, values);
      
      logger.info(`Chat message updated successfully: ${messageId}`);
      return this.findById(messageId);
    } catch (error) {
      logger.error('Error updating chat message:', error);
      throw error;
    }
  }

  // Delete message (soft delete)
  static async delete(messageId) {
    try {
      const query = `
        UPDATE chat_messages 
        SET is_deleted = true, deleted_at = ?
        WHERE id = ?
      `;

      await executeQuery(query, [new Date(), messageId]);
      
      logger.info(`Chat message deleted successfully: ${messageId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting chat message:', error);
      throw error;
    }
  }

  // Create message statuses for all room participants
  static async createMessageStatuses(messageId, roomId) {
    try {
      const query = `
        INSERT INTO message_status (id, message_id, user_id, status)
        SELECT ?, ?, crp.user_id, 'sent'
        FROM chat_room_participants crp
        WHERE crp.room_id = ? AND crp.is_active = true
      `;

      await executeQuery(query, [uuidv4(), messageId, roomId]);
    } catch (error) {
      logger.error('Error creating message statuses:', error);
      throw error;
    }
  }

  // Update message status
  static async updateMessageStatus(messageId, userId, status) {
    try {
      const query = `
        UPDATE message_status 
        SET status = ?, ${status === 'read' ? 'read_at = ?' : ''}
        WHERE message_id = ? AND user_id = ?
      `;

      const values = status === 'read' ? [status, new Date(), messageId, userId] : [status, messageId, userId];
      await executeQuery(query, values);
      
      logger.info(`Message status updated: ${messageId}, user: ${userId}, status: ${status}`);
      return true;
    } catch (error) {
      logger.error('Error updating message status:', error);
      throw error;
    }
  }

  // Get message status for a user
  static async getMessageStatus(messageId, userId) {
    try {
      const query = `
        SELECT status, read_at
        FROM message_status
        WHERE message_id = ? AND user_id = ?
      `;

      const result = await executeQuery(query, [messageId, userId]);
      return result[0] || null;
    } catch (error) {
      logger.error('Error getting message status:', error);
      throw error;
    }
  }

  // Get unread message count for a user in a room
  static async getUnreadCount(roomId, userId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM chat_messages cm
        INNER JOIN message_status ms ON cm.id = ms.message_id
        WHERE cm.room_id = ? AND ms.user_id = ? AND ms.status != 'read' AND cm.is_deleted = false
      `;

      const result = await executeQuery(query, [roomId, userId]);
      return result[0].count;
    } catch (error) {
      logger.error('Error getting unread message count:', error);
      throw error;
    }
  }

  // Mark messages as read
  static async markAsRead(roomId, userId, beforeDate = null) {
    try {
      let query = `
        UPDATE message_status ms
        INNER JOIN chat_messages cm ON ms.message_id = cm.id
        SET ms.status = 'read', ms.read_at = ?
        WHERE cm.room_id = ? AND ms.user_id = ? AND ms.status != 'read'
      `;

      const values = [new Date(), roomId, userId];

      if (beforeDate) {
        query += ` AND cm.created_at <= ?`;
        values.push(beforeDate);
      }

      await executeQuery(query, values);
      
      logger.info(`Messages marked as read for user: ${userId} in room: ${roomId}`);
      return true;
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Search messages
  static async search(roomId, searchTerm, limit = 20, offset = 0) {
    try {
      const query = `
        SELECT cm.*, 
               u.first_name, u.last_name, u.email, u.profile_image_url
        FROM chat_messages cm
        INNER JOIN users u ON cm.sender_id = u.id
        WHERE cm.room_id = ? AND cm.is_deleted = false AND u.is_deleted IS NULL
        AND (cm.message_text LIKE ? OR cm.message_ar LIKE ? OR cm.message_en LIKE ?)
        ORDER BY cm.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const searchPattern = `%${searchTerm}%`;
      const messages = await executeQuery(query, [roomId, searchPattern, searchPattern, searchPattern, parseInt(limit), parseInt(offset)]);
      return messages;
    } catch (error) {
      logger.error('Error searching chat messages:', error);
      throw error;
    }
  }

  // Get message statistics
  static async getStatistics(roomId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_messages,
          COUNT(CASE WHEN message_type = 'text' THEN 1 END) as text_messages,
          COUNT(CASE WHEN message_type = 'image' THEN 1 END) as image_messages,
          COUNT(CASE WHEN message_type = 'file' THEN 1 END) as file_messages,
          COUNT(CASE WHEN message_type = 'location' THEN 1 END) as location_messages,
          COUNT(CASE WHEN is_edited = true THEN 1 END) as edited_messages,
          MIN(created_at) as first_message_at,
          MAX(created_at) as last_message_at
        FROM chat_messages
        WHERE room_id = ? AND is_deleted = false
      `;

      const result = await executeQuery(query, [roomId]);
      return result[0];
    } catch (error) {
      logger.error('Error getting message statistics:', error);
      throw error;
    }
  }
}

module.exports = ChatMessage; 