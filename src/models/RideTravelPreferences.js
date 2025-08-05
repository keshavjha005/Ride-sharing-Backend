const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class RideTravelPreferences {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.rideId = data.rideId;
    this.chattiness = data.chattiness; // 'love_to_chat', 'chatty_when_comfortable', 'quiet_type'
    this.smoking = data.smoking; // 'fine_with_smoking', 'breaks_outside_ok', 'no_smoking'
    this.music = data.music; // 'playlist_important', 'depends_on_mood', 'silence_golden'
    this.createdAt = data.createdAt || new Date();
  }

  // Create travel preferences
  static async create(preferencesData) {
    try {
      const preferences = new RideTravelPreferences(preferencesData);
      
      const query = `
        INSERT INTO ride_travel_preferences (
          id, ride_id, chattiness, smoking, music, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      const values = [
        preferences.id, preferences.rideId, preferences.chattiness,
        preferences.smoking, preferences.music, preferences.createdAt
      ];

      await db.execute(query, values);
      
      logger.info(`Ride travel preferences created successfully with ID: ${preferences.id}`);
      return preferences;
    } catch (error) {
      logger.error('Error creating ride travel preferences:', error);
      throw error;
    }
  }

  // Get travel preferences by ride ID
  static async findByRideId(rideId) {
    try {
      const query = `
        SELECT * FROM ride_travel_preferences 
        WHERE ride_id = ?
      `;

      const [rows] = await db.execute(query, [rideId]);
      return rows[0] || null;
    } catch (error) {
      logger.error('Error finding travel preferences by ride ID:', error);
      throw error;
    }
  }

  // Update travel preferences
  static async update(rideId, updateData) {
    try {
      const allowedFields = ['chattiness', 'smoking', 'music'];
      const updateFields = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(rideId);

      const query = `
        UPDATE ride_travel_preferences 
        SET ${updateFields.join(', ')}
        WHERE ride_id = ?
      `;

      const [result] = await db.execute(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('Travel preferences not found');
      }

      logger.info(`Travel preferences updated successfully for ride: ${rideId}`);
      return result;
    } catch (error) {
      logger.error('Error updating travel preferences:', error);
      throw error;
    }
  }

  // Delete travel preferences
  static async delete(rideId) {
    try {
      const query = `DELETE FROM ride_travel_preferences WHERE ride_id = ?`;
      const [result] = await db.execute(query, [rideId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Travel preferences not found');
      }

      logger.info(`Travel preferences deleted successfully for ride: ${rideId}`);
      return result;
    } catch (error) {
      logger.error('Error deleting travel preferences:', error);
      throw error;
    }
  }

  // Create or update travel preferences
  static async createOrUpdate(rideId, preferencesData) {
    try {
      const existingPreferences = await this.findByRideId(rideId);
      
      if (existingPreferences) {
        return await this.update(rideId, preferencesData);
      } else {
        return await this.create({ ...preferencesData, rideId });
      }
    } catch (error) {
      logger.error('Error creating or updating travel preferences:', error);
      throw error;
    }
  }

  // Validate preferences data
  static validatePreferencesData(preferencesData) {
    const errors = [];

    const validChattiness = ['love_to_chat', 'chatty_when_comfortable', 'quiet_type'];
    const validSmoking = ['fine_with_smoking', 'breaks_outside_ok', 'no_smoking'];
    const validMusic = ['playlist_important', 'depends_on_mood', 'silence_golden'];

    if (preferencesData.chattiness && !validChattiness.includes(preferencesData.chattiness)) {
      errors.push('Invalid chattiness preference');
    }

    if (preferencesData.smoking && !validSmoking.includes(preferencesData.smoking)) {
      errors.push('Invalid smoking preference');
    }

    if (preferencesData.music && !validMusic.includes(preferencesData.music)) {
      errors.push('Invalid music preference');
    }

    return errors;
  }

  // Get preference labels for display
  static getPreferenceLabels() {
    return {
      chattiness: {
        love_to_chat: 'Love to Chat',
        chatty_when_comfortable: 'Chatty when Comfortable',
        quiet_type: 'Quiet Type'
      },
      smoking: {
        fine_with_smoking: 'Fine with Smoking',
        breaks_outside_ok: 'Breaks Outside OK',
        no_smoking: 'No Smoking'
      },
      music: {
        playlist_important: 'Playlist Important',
        depends_on_mood: 'Depends on Mood',
        silence_golden: 'Silence Golden'
      }
    };
  }
}

module.exports = RideTravelPreferences; 