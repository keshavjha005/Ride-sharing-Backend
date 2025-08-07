const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class ChatRoom {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.roomType = data.roomType;
    this.rideId = data.rideId || null;
    this.titleAr = data.titleAr || null;
    this.titleEn = data.titleEn || null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new chat room
  static async create(roomData) {
    try {
      const room = new ChatRoom(roomData);
      
      const query = `
        INSERT INTO chat_rooms (
          id, room_type, ride_id, title_ar, title_en, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        room.id,
        room.roomType,
        room.rideId,
        room.titleAr,
        room.titleEn,
        room.isActive,
        room.createdAt,
        room.updatedAt
      ];

      await executeQuery(query, values);
      
      logger.info(`Chat room created successfully with ID: ${room.id}`);
      return this.findById(room.id);
    } catch (error) {
      logger.error('Error creating chat room:', error);
      throw error;
    }
  }

  // Find chat room by ID
  static async findById(roomId) {
    try {
      const query = `
        SELECT cr.*, 
               COUNT(crp.user_id) as participant_count,
               COUNT(cm.id) as message_count
        FROM chat_rooms cr
        LEFT JOIN chat_room_participants crp ON cr.id = crp.room_id AND crp.is_active = true
        LEFT JOIN chat_messages cm ON cr.id = cm.room_id AND cm.is_deleted = false
        WHERE cr.id = ? AND cr.is_active = true
        GROUP BY cr.id
      `;

      const rooms = await executeQuery(query, [roomId]);
      return rooms[0] || null;
    } catch (error) {
      logger.error('Error finding chat room by ID:', error);
      throw error;
    }
  }

  // Find chat room by ride ID
  static async findByRideId(rideId) {
    try {
      const query = `
        SELECT cr.*, 
               COUNT(crp.user_id) as participant_count,
               COUNT(cm.id) as message_count
        FROM chat_rooms cr
        LEFT JOIN chat_room_participants crp ON cr.id = crp.room_id AND crp.is_active = true
        LEFT JOIN chat_messages cm ON cr.id = cm.room_id AND cm.is_deleted = false
        WHERE cr.ride_id = ? AND cr.is_active = true
        GROUP BY cr.id
      `;

      const rooms = await executeQuery(query, [rideId]);
      return rooms[0] || null;
    } catch (error) {
      logger.error('Error finding chat room by ride ID:', error);
      throw error;
    }
  }

  // Get user's chat rooms
  static async findByUserId(userId, limit = 20, offset = 0) {
    try {
      const query = `
        SELECT cr.*, 
               COUNT(crp2.user_id) as participant_count,
               COUNT(cm.id) as message_count,
               MAX(cm.created_at) as last_message_at,
               crp.role as user_role
        FROM chat_rooms cr
        INNER JOIN chat_room_participants crp ON cr.id = crp.room_id
        LEFT JOIN chat_room_participants crp2 ON cr.id = crp2.room_id AND crp2.is_active = true
        LEFT JOIN chat_messages cm ON cr.id = cm.room_id AND cm.is_deleted = false
        WHERE crp.user_id = ? AND crp.is_active = true AND cr.is_active = true
        GROUP BY cr.id
        ORDER BY last_message_at DESC, cr.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const rooms = await executeQuery(query, [userId, parseInt(limit), parseInt(offset)]);
      return rooms;
    } catch (error) {
      logger.error('Error finding chat rooms by user ID:', error);
      throw error;
    }
  }

  // Update chat room
  static async update(roomId, updateData) {
    try {
      const allowedFields = ['titleAr', 'titleEn', 'isActive'];
      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          const dbField = key === 'titleAr' ? 'title_ar' : 
                         key === 'titleEn' ? 'title_en' : 
                         key === 'isActive' ? 'is_active' : key;
          updates.push(`${dbField} = ?`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      updates.push('updated_at = ?');
      values.push(new Date());
      values.push(roomId);

      const query = `
        UPDATE chat_rooms 
        SET ${updates.join(', ')}
        WHERE id = ?
      `;

      await executeQuery(query, values);
      
      logger.info(`Chat room updated successfully: ${roomId}`);
      return this.findById(roomId);
    } catch (error) {
      logger.error('Error updating chat room:', error);
      throw error;
    }
  }

  // Delete chat room (soft delete)
  static async delete(roomId) {
    try {
      const query = `
        UPDATE chat_rooms 
        SET is_active = false, updated_at = ?
        WHERE id = ?
      `;

      await executeQuery(query, [new Date(), roomId]);
      
      logger.info(`Chat room deleted successfully: ${roomId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting chat room:', error);
      throw error;
    }
  }

  // Add participant to room
  static async addParticipant(roomId, userId, role = 'participant') {
    try {
      const query = `
        INSERT INTO chat_room_participants (id, room_id, user_id, role)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        is_active = true, 
        left_at = NULL,
        role = VALUES(role)
      `;

      await executeQuery(query, [uuidv4(), roomId, userId, role]);
      
      logger.info(`Participant added to chat room: ${roomId}, user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error adding participant to chat room:', error);
      throw error;
    }
  }

  // Remove participant from room
  static async removeParticipant(roomId, userId) {
    try {
      const query = `
        UPDATE chat_room_participants 
        SET is_active = false, left_at = ?
        WHERE room_id = ? AND user_id = ?
      `;

      await executeQuery(query, [new Date(), roomId, userId]);
      
      logger.info(`Participant removed from chat room: ${roomId}, user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error removing participant from chat room:', error);
      throw error;
    }
  }

  // Get room participants
  static async getParticipants(roomId) {
    try {
      const query = `
        SELECT crp.*, u.first_name, u.last_name, u.email, u.profile_image_url
        FROM chat_room_participants crp
        INNER JOIN users u ON crp.user_id = u.id
        WHERE crp.room_id = ? AND crp.is_active = true AND u.is_deleted IS NULL
        ORDER BY crp.joined_at ASC
      `;

      const participants = await executeQuery(query, [roomId]);
      return participants;
    } catch (error) {
      logger.error('Error getting chat room participants:', error);
      throw error;
    }
  }

  // Check if user is participant
  static async isParticipant(roomId, userId) {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM chat_room_participants
        WHERE room_id = ? AND user_id = ? AND is_active = true
      `;

      const result = await executeQuery(query, [roomId, userId]);
      return result[0].count > 0;
    } catch (error) {
      logger.error('Error checking if user is participant:', error);
      throw error;
    }
  }

  // Get user's role in room
  static async getUserRole(roomId, userId) {
    try {
      const query = `
        SELECT role
        FROM chat_room_participants
        WHERE room_id = ? AND user_id = ? AND is_active = true
      `;

      const result = await executeQuery(query, [roomId, userId]);
      return result[0]?.role || null;
    } catch (error) {
      logger.error('Error getting user role in chat room:', error);
      throw error;
    }
  }

  // Search chat rooms
  static async search(searchTerm, userId = null, limit = 20, offset = 0) {
    try {
      let query = `
        SELECT cr.*, 
               COUNT(crp.user_id) as participant_count,
               COUNT(cm.id) as message_count
        FROM chat_rooms cr
        LEFT JOIN chat_room_participants crp ON cr.id = crp.room_id AND crp.is_active = true
        LEFT JOIN chat_messages cm ON cr.id = cm.room_id AND cm.is_deleted = false
        WHERE cr.is_active = true
      `;

      const values = [];

      if (searchTerm) {
        query += ` AND (cr.title_en LIKE ? OR cr.title_ar LIKE ?)`;
        values.push(`%${searchTerm}%`, `%${searchTerm}%`);
      }

      if (userId) {
        query += ` AND cr.id IN (
          SELECT room_id 
          FROM chat_room_participants 
          WHERE user_id = ? AND is_active = true
        )`;
        values.push(userId);
      }

      query += `
        GROUP BY cr.id
        ORDER BY cr.updated_at DESC
        LIMIT ? OFFSET ?
      `;

      values.push(limit, offset);

      const rooms = await executeQuery(query, values);
      return rooms;
    } catch (error) {
      logger.error('Error searching chat rooms:', error);
      throw error;
    }
  }
}

module.exports = ChatRoom; 