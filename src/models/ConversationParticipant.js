const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class ConversationParticipant {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.conversationId = data.conversationId;
    this.userId = data.userId;
    this.role = data.role || 'participant';
    this.joinedAt = data.joinedAt;
    this.leftAt = data.leftAt;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  /**
   * Add participant to conversation
   */
  static async add(conversationId, userId, role = 'participant') {
    try {
      // Check if participant already exists
      const existing = await this.findByConversationAndUser(conversationId, userId);
      if (existing) {
        // If exists but inactive, reactivate
        if (!existing.isActive) {
          return await this.reactivate(conversationId, userId);
        }
        return existing;
      }

      const participant = new ConversationParticipant({
        conversationId,
        userId,
        role
      });

      const query = `
        INSERT INTO conversation_participants (
          id, conversation_id, user_id, role, is_active
        ) VALUES (?, ?, ?, ?, ?)
      `;

      const values = [
        participant.id,
        participant.conversationId,
        participant.userId,
        participant.role,
        participant.isActive
      ];

      await executeQuery(query, values);
      logger.info(`Added participant ${userId} to conversation ${conversationId}`);

      return await this.findByConversationAndUser(conversationId, userId);
    } catch (error) {
      logger.error('Error adding conversation participant:', error);
      throw error;
    }
  }

  /**
   * Find participant by conversation and user
   */
  static async findByConversationAndUser(conversationId, userId) {
    try {
      const query = `
        SELECT cp.*, u.name, u.email, u.phone
        FROM conversation_participants cp
        LEFT JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ? AND cp.user_id = ?
      `;

      const results = await executeQuery(query, [conversationId, userId]);
      return results.length > 0 ? new ConversationParticipant(results[0]) : null;
    } catch (error) {
      logger.error('Error finding conversation participant:', error);
      throw error;
    }
  }

  /**
   * Get all participants for a conversation
   */
  static async findByConversationId(conversationId, options = {}) {
    try {
      const { activeOnly = true, limit = 50, offset = 0 } = options;

      let query = `
        SELECT cp.*, u.name, u.email, u.phone, u.avatar_url
        FROM conversation_participants cp
        LEFT JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ?
      `;

      const values = [conversationId];

      if (activeOnly) {
        query += ' AND cp.is_active = true';
      }

      query += ' ORDER BY cp.joined_at ASC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const results = await executeQuery(query, values);
      return results.map(row => new ConversationParticipant(row));
    } catch (error) {
      logger.error('Error finding conversation participants:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   */
  static async findByUserId(userId, options = {}) {
    try {
      const { activeOnly = true, limit = 50, offset = 0 } = options;

      let query = `
        SELECT cp.*, ic.title_ar, ic.title_en, ic.conversation_type, ic.last_message_at
        FROM conversation_participants cp
        LEFT JOIN inbox_conversations ic ON cp.conversation_id = ic.id
        WHERE cp.user_id = ?
      `;

      const values = [userId];

      if (activeOnly) {
        query += ' AND cp.is_active = true';
      }

      query += ' ORDER BY ic.last_message_at DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const results = await executeQuery(query, values);
      return results.map(row => new ConversationParticipant(row));
    } catch (error) {
      logger.error('Error finding user conversations:', error);
      throw error;
    }
  }

  /**
   * Update participant role
   */
  static async updateRole(conversationId, userId, newRole) {
    try {
      const query = `
        UPDATE conversation_participants 
        SET role = ? 
        WHERE conversation_id = ? AND user_id = ?
      `;

      await executeQuery(query, [newRole, conversationId, userId]);
      logger.info(`Updated role for participant ${userId} in conversation ${conversationId} to ${newRole}`);

      return await this.findByConversationAndUser(conversationId, userId);
    } catch (error) {
      logger.error('Error updating participant role:', error);
      throw error;
    }
  }

  /**
   * Remove participant from conversation
   */
  static async remove(conversationId, userId) {
    try {
      const query = `
        UPDATE conversation_participants 
        SET is_active = false, left_at = CURRENT_TIMESTAMP 
        WHERE conversation_id = ? AND user_id = ?
      `;

      await executeQuery(query, [conversationId, userId]);
      logger.info(`Removed participant ${userId} from conversation ${conversationId}`);

      return true;
    } catch (error) {
      logger.error('Error removing conversation participant:', error);
      throw error;
    }
  }

  /**
   * Reactivate participant
   */
  static async reactivate(conversationId, userId) {
    try {
      const query = `
        UPDATE conversation_participants 
        SET is_active = true, left_at = NULL 
        WHERE conversation_id = ? AND user_id = ?
      `;

      await executeQuery(query, [conversationId, userId]);
      logger.info(`Reactivated participant ${userId} in conversation ${conversationId}`);

      return await this.findByConversationAndUser(conversationId, userId);
    } catch (error) {
      logger.error('Error reactivating conversation participant:', error);
      throw error;
    }
  }

  /**
   * Get participant count for conversation
   */
  static async getParticipantCount(conversationId, activeOnly = true) {
    try {
      let query = `
        SELECT COUNT(*) as count
        FROM conversation_participants 
        WHERE conversation_id = ?
      `;

      const values = [conversationId];

      if (activeOnly) {
        query += ' AND is_active = true';
      }

      const results = await executeQuery(query, values);
      return results[0]?.count || 0;
    } catch (error) {
      logger.error('Error getting participant count:', error);
      throw error;
    }
  }

  /**
   * Check if user is participant in conversation
   */
  static async isParticipant(conversationId, userId, activeOnly = true) {
    try {
      let query = `
        SELECT COUNT(*) as count
        FROM conversation_participants 
        WHERE conversation_id = ? AND user_id = ?
      `;

      const values = [conversationId, userId];

      if (activeOnly) {
        query += ' AND is_active = true';
      }

      const results = await executeQuery(query, values);
      return results[0]?.count > 0;
    } catch (error) {
      logger.error('Error checking if user is participant:', error);
      throw error;
    }
  }

  /**
   * Get participants with specific role
   */
  static async findByRole(conversationId, role, activeOnly = true) {
    try {
      let query = `
        SELECT cp.*, u.name, u.email, u.phone, u.avatar_url
        FROM conversation_participants cp
        LEFT JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ? AND cp.role = ?
      `;

      const values = [conversationId, role];

      if (activeOnly) {
        query += ' AND cp.is_active = true';
      }

      query += ' ORDER BY cp.joined_at ASC';

      const results = await executeQuery(query, values);
      return results.map(row => new ConversationParticipant(row));
    } catch (error) {
      logger.error('Error finding participants by role:', error);
      throw error;
    }
  }

  /**
   * Bulk add participants
   */
  static async bulkAdd(conversationId, participants) {
    try {
      const values = [];
      const placeholders = [];

      for (const participant of participants) {
        const id = uuidv4();
        placeholders.push('(?, ?, ?, ?, ?)');
        values.push(
          id,
          conversationId,
          participant.userId,
          participant.role || 'participant',
          true
        );
      }

      const query = `
        INSERT INTO conversation_participants (
          id, conversation_id, user_id, role, is_active
        ) VALUES ${placeholders.join(', ')}
        ON DUPLICATE KEY UPDATE 
          is_active = true, 
          left_at = NULL
      `;

      await executeQuery(query, values);
      logger.info(`Bulk added ${participants.length} participants to conversation ${conversationId}`);

      return await this.findByConversationId(conversationId);
    } catch (error) {
      logger.error('Error bulk adding conversation participants:', error);
      throw error;
    }
  }

  /**
   * Get conversation statistics
   */
  static async getStatistics(conversationId) {
    try {
      const query = `
        SELECT 
          role,
          COUNT(*) as total_participants,
          SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_participants,
          SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_participants
        FROM conversation_participants 
        WHERE conversation_id = ?
        GROUP BY role
      `;

      const results = await executeQuery(query, [conversationId]);
      return results;
    } catch (error) {
      logger.error('Error getting conversation participant statistics:', error);
      throw error;
    }
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      conversationId: this.conversationId,
      userId: this.userId,
      role: this.role,
      joinedAt: this.joinedAt,
      leftAt: this.leftAt,
      isActive: this.isActive,
      name: this.name,
      email: this.email,
      phone: this.phone,
      avatarUrl: this.avatarUrl
    };
  }
}

module.exports = ConversationParticipant; 