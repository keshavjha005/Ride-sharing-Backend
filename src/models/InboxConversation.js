const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class InboxConversation {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.userId = data.userId;
    this.conversationType = data.conversationType;
    this.titleAr = data.titleAr;
    this.titleEn = data.titleEn;
    this.lastMessageAr = data.lastMessageAr;
    this.lastMessageEn = data.lastMessageEn;
    this.lastMessageAt = data.lastMessageAt;
    this.unreadCount = data.unreadCount || 0;
    this.isArchived = data.isArchived || false;
    this.isMuted = data.isMuted || false;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Create a new inbox conversation
   */
  static async create(conversationData) {
    try {
      const conversation = new InboxConversation(conversationData);
      
      const query = `
        INSERT INTO inbox_conversations (
          id, user_id, conversation_type, title_ar, title_en,
          last_message_ar, last_message_en, last_message_at,
          unread_count, is_archived, is_muted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        conversation.id,
        conversation.userId,
        conversation.conversationType,
        conversation.titleAr,
        conversation.titleEn,
        conversation.lastMessageAr,
        conversation.lastMessageEn,
        conversation.lastMessageAt,
        conversation.unreadCount,
        conversation.isArchived,
        conversation.isMuted
      ];

      await executeQuery(query, values);
      logger.info(`Created inbox conversation: ${conversation.id}`);
      
      return await this.findById(conversation.id);
    } catch (error) {
      logger.error('Error creating inbox conversation:', error);
      throw error;
    }
  }

  /**
   * Find conversation by ID
   */
  static async findById(id) {
    try {
      const query = `
        SELECT 
          ic.*,
          COUNT(cp.id) as participant_count
        FROM inbox_conversations ic
        LEFT JOIN conversation_participants cp ON ic.id = cp.conversation_id AND cp.is_active = true
        WHERE ic.id = ?
        GROUP BY ic.id
      `;
      
      const results = await executeQuery(query, [id]);
      return results.length > 0 ? new InboxConversation(results[0]) : null;
    } catch (error) {
      logger.error('Error finding inbox conversation by ID:', error);
      throw error;
    }
  }

  /**
   * Get user's conversations with filtering and pagination
   */
  static async findByUserId(userId, options = {}) {
    try {
      const {
        conversationType,
        isArchived = false,
        isMuted = false,
        limit = 20,
        offset = 0,
        sortBy = 'last_message_at',
        sortOrder = 'DESC'
      } = options;

      let query = `
        SELECT 
          ic.*,
          COUNT(cp.id) as participant_count
        FROM inbox_conversations ic
        LEFT JOIN conversation_participants cp ON ic.id = cp.conversation_id AND cp.is_active = true
        WHERE ic.user_id = ?
      `;
      
      const values = [userId];

      if (conversationType) {
        query += ' AND ic.conversation_type = ?';
        values.push(conversationType);
      }

      query += ' AND ic.is_archived = ? AND ic.is_muted = ?';
      values.push(isArchived, isMuted);

      query += ` GROUP BY ic.id ORDER BY ic.${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
      values.push(limit, offset);

      const results = await executeQuery(query, values);
      return results.map(row => new InboxConversation(row));
    } catch (error) {
      logger.error('Error finding inbox conversations by user ID:', error);
      throw error;
    }
  }

  /**
   * Update conversation
   */
  static async update(id, updateData) {
    try {
      const allowedFields = [
        'titleAr', 'titleEn', 'lastMessageAr', 'lastMessageEn',
        'lastMessageAt', 'unreadCount', 'isArchived', 'isMuted'
      ];

      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          updates.push(`${dbField} = ?`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const query = `UPDATE inbox_conversations SET ${updates.join(', ')} WHERE id = ?`;
      await executeQuery(query, values);

      logger.info(`Updated inbox conversation: ${id}`);
      return await this.findById(id);
    } catch (error) {
      logger.error('Error updating inbox conversation:', error);
      throw error;
    }
  }

  /**
   * Delete conversation
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM inbox_conversations WHERE id = ?';
      await executeQuery(query, [id]);
      
      logger.info(`Deleted inbox conversation: ${id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting inbox conversation:', error);
      throw error;
    }
  }

  /**
   * Archive conversation
   */
  static async archive(id) {
    try {
      const query = 'UPDATE inbox_conversations SET is_archived = true, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await executeQuery(query, [id]);
      
      logger.info(`Archived inbox conversation: ${id}`);
      return await this.findById(id);
    } catch (error) {
      logger.error('Error archiving inbox conversation:', error);
      throw error;
    }
  }

  /**
   * Unarchive conversation
   */
  static async unarchive(id) {
    try {
      const query = 'UPDATE inbox_conversations SET is_archived = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await executeQuery(query, [id]);
      
      logger.info(`Unarchived inbox conversation: ${id}`);
      return await this.findById(id);
    } catch (error) {
      logger.error('Error unarchiving inbox conversation:', error);
      throw error;
    }
  }

  /**
   * Mute conversation
   */
  static async mute(id) {
    try {
      const query = 'UPDATE inbox_conversations SET is_muted = true, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await executeQuery(query, [id]);
      
      logger.info(`Muted inbox conversation: ${id}`);
      return await this.findById(id);
    } catch (error) {
      logger.error('Error muting inbox conversation:', error);
      throw error;
    }
  }

  /**
   * Unmute conversation
   */
  static async unmute(id) {
    try {
      const query = 'UPDATE inbox_conversations SET is_muted = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await executeQuery(query, [id]);
      
      logger.info(`Unmuted inbox conversation: ${id}`);
      return await this.findById(id);
    } catch (error) {
      logger.error('Error unmuting inbox conversation:', error);
      throw error;
    }
  }

  /**
   * Update last message
   */
  static async updateLastMessage(id, messageData) {
    try {
      const { messageAr, messageEn } = messageData;
      const query = `
        UPDATE inbox_conversations 
        SET last_message_ar = ?, last_message_en = ?, last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      await executeQuery(query, [messageAr, messageEn, id]);
      
      logger.info(`Updated last message for conversation: ${id}`);
      return await this.findById(id);
    } catch (error) {
      logger.error('Error updating last message:', error);
      throw error;
    }
  }

  /**
   * Increment unread count
   */
  static async incrementUnreadCount(id) {
    try {
      const query = 'UPDATE inbox_conversations SET unread_count = unread_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await executeQuery(query, [id]);
      
      logger.info(`Incremented unread count for conversation: ${id}`);
      return await this.findById(id);
    } catch (error) {
      logger.error('Error incrementing unread count:', error);
      throw error;
    }
  }

  /**
   * Reset unread count
   */
  static async resetUnreadCount(id) {
    try {
      const query = 'UPDATE inbox_conversations SET unread_count = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await executeQuery(query, [id]);
      
      logger.info(`Reset unread count for conversation: ${id}`);
      return await this.findById(id);
    } catch (error) {
      logger.error('Error resetting unread count:', error);
      throw error;
    }
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId) {
    try {
      const query = `
        SELECT SUM(unread_count) as total_unread
        FROM inbox_conversations 
        WHERE user_id = ? AND is_archived = false AND is_muted = false
      `;
      
      const results = await executeQuery(query, [userId]);
      return results[0]?.total_unread || 0;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Search conversations
   */
  static async search(userId, searchQuery, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;
      
      const query = `
        SELECT 
          ic.*,
          COUNT(cp.id) as participant_count
        FROM inbox_conversations ic
        LEFT JOIN conversation_participants cp ON ic.id = cp.conversation_id AND cp.is_active = true
        WHERE ic.user_id = ? 
        AND ic.is_archived = false
        AND (
          ic.title_ar LIKE ? OR ic.title_en LIKE ? OR 
          ic.last_message_ar LIKE ? OR ic.last_message_en LIKE ?
        )
        GROUP BY ic.id 
        ORDER BY ic.last_message_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      const searchTerm = `%${searchQuery}%`;
      const values = [userId, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset];
      
      const results = await executeQuery(query, values);
      return results.map(row => new InboxConversation(row));
    } catch (error) {
      logger.error('Error searching inbox conversations:', error);
      throw error;
    }
  }

  /**
   * Get conversation statistics
   */
  static async getStatistics(userId) {
    try {
      const query = `
        SELECT 
          conversation_type,
          COUNT(*) as total_conversations,
          SUM(unread_count) as total_unread,
          SUM(CASE WHEN is_archived = true THEN 1 ELSE 0 END) as archived_count,
          SUM(CASE WHEN is_muted = true THEN 1 ELSE 0 END) as muted_count
        FROM inbox_conversations 
        WHERE user_id = ?
        GROUP BY conversation_type
      `;
      
      const results = await executeQuery(query, [userId]);
      return results;
    } catch (error) {
      logger.error('Error getting conversation statistics:', error);
      throw error;
    }
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      conversationType: this.conversationType,
      titleAr: this.titleAr,
      titleEn: this.titleEn,
      lastMessageAr: this.lastMessageAr,
      lastMessageEn: this.lastMessageEn,
      lastMessageAt: this.lastMessageAt,
      unreadCount: this.unreadCount,
      isArchived: this.isArchived,
      isMuted: this.isMuted,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      participantCount: this.participantCount
    };
  }
}

module.exports = InboxConversation; 