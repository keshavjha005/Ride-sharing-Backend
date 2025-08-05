const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class RideStatusUpdate {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.rideId = data.rideId;
    this.status = data.status;
    this.statusMessageAr = data.statusMessageAr;
    this.statusMessageEn = data.statusMessageEn;
    this.locationData = data.locationData;
    this.estimatedArrival = data.estimatedArrival;
    this.actualArrival = data.actualArrival;
    this.createdAt = data.createdAt || new Date();
  }

  // Create a new ride status update
  static async create(statusUpdateData) {
    try {
      const statusUpdate = new RideStatusUpdate(statusUpdateData);
      
      const query = `
        INSERT INTO ride_status_updates (
          id, ride_id, status, status_message_ar, status_message_en,
          location_data, estimated_arrival, actual_arrival, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        statusUpdate.id,
        statusUpdate.rideId,
        statusUpdate.status,
        statusUpdate.statusMessageAr,
        statusUpdate.statusMessageEn,
        statusUpdate.locationData ? JSON.stringify(statusUpdate.locationData) : null,
        statusUpdate.estimatedArrival,
        statusUpdate.actualArrival,
        statusUpdate.createdAt
      ];

      await db.execute(query, values);
      
      logger.info(`Ride status update created successfully with ID: ${statusUpdate.id}`);
      return statusUpdate;
    } catch (error) {
      logger.error('Error creating ride status update:', error);
      throw error;
    }
  }

  // Get status updates for a ride
  static async findByRideId(rideId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM ride_status_updates 
        WHERE ride_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;

      const [rows] = await db.execute(query, [rideId, limit, offset]);
      
      return rows.map(row => ({
        id: row.id,
        rideId: row.ride_id,
        status: row.status,
        statusMessageAr: row.status_message_ar,
        statusMessageEn: row.status_message_en,
        locationData: row.location_data ? JSON.parse(row.location_data) : null,
        estimatedArrival: row.estimated_arrival,
        actualArrival: row.actual_arrival,
        createdAt: row.created_at
      }));
    } catch (error) {
      logger.error('Error fetching ride status updates:', error);
      throw error;
    }
  }

  // Get latest status update for a ride
  static async getLatestByRideId(rideId) {
    try {
      const query = `
        SELECT * FROM ride_status_updates 
        WHERE ride_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const [rows] = await db.execute(query, [rideId]);
      
      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        id: row.id,
        rideId: row.ride_id,
        status: row.status,
        statusMessageAr: row.status_message_ar,
        statusMessageEn: row.status_message_en,
        locationData: row.location_data ? JSON.parse(row.location_data) : null,
        estimatedArrival: row.estimated_arrival,
        actualArrival: row.actual_arrival,
        createdAt: row.created_at
      };
    } catch (error) {
      logger.error('Error fetching latest ride status update:', error);
      throw error;
    }
  }

  // Get status updates by status
  static async findByStatus(status, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM ride_status_updates 
        WHERE status = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;

      const [rows] = await db.execute(query, [status, limit, offset]);
      
      return rows.map(row => ({
        id: row.id,
        rideId: row.ride_id,
        status: row.status,
        statusMessageAr: row.status_message_ar,
        statusMessageEn: row.status_message_en,
        locationData: row.location_data ? JSON.parse(row.location_data) : null,
        estimatedArrival: row.estimated_arrival,
        actualArrival: row.actual_arrival,
        createdAt: row.created_at
      }));
    } catch (error) {
      logger.error('Error fetching ride status updates by status:', error);
      throw error;
    }
  }

  // Get status updates within a date range
  static async findByDateRange(startDate, endDate, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM ride_status_updates 
        WHERE created_at BETWEEN ? AND ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;

      const [rows] = await db.execute(query, [startDate, endDate, limit, offset]);
      
      return rows.map(row => ({
        id: row.id,
        rideId: row.ride_id,
        status: row.status,
        statusMessageAr: row.status_message_ar,
        statusMessageEn: row.status_message_en,
        locationData: row.location_data ? JSON.parse(row.location_data) : null,
        estimatedArrival: row.estimated_arrival,
        actualArrival: row.actual_arrival,
        createdAt: row.created_at
      }));
    } catch (error) {
      logger.error('Error fetching ride status updates by date range:', error);
      throw error;
    }
  }

  // Update estimated arrival
  static async updateEstimatedArrival(rideId, estimatedArrival) {
    try {
      const query = `
        UPDATE ride_status_updates 
        SET estimated_arrival = ? 
        WHERE ride_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const [result] = await db.execute(query, [estimatedArrival, rideId]);
      
      if (result.affectedRows > 0) {
        logger.info(`Updated estimated arrival for ride: ${rideId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error updating estimated arrival:', error);
      throw error;
    }
  }

  // Update actual arrival
  static async updateActualArrival(rideId, actualArrival) {
    try {
      const query = `
        UPDATE ride_status_updates 
        SET actual_arrival = ? 
        WHERE ride_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      const [result] = await db.execute(query, [actualArrival, rideId]);
      
      if (result.affectedRows > 0) {
        logger.info(`Updated actual arrival for ride: ${rideId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error updating actual arrival:', error);
      throw error;
    }
  }

  // Get status update statistics
  static async getStatistics(rideId = null) {
    try {
      let query = `
        SELECT 
          status,
          COUNT(*) as count,
          MIN(created_at) as first_update,
          MAX(created_at) as last_update
        FROM ride_status_updates
      `;
      
      const params = [];
      
      if (rideId) {
        query += ' WHERE ride_id = ?';
        params.push(rideId);
      }
      
      query += ' GROUP BY status ORDER BY status';

      const [rows] = await db.execute(query, params);
      
      return rows;
    } catch (error) {
      logger.error('Error fetching ride status update statistics:', error);
      throw error;
    }
  }

  // Delete old status updates (cleanup)
  static async deleteOldUpdates(daysOld = 30) {
    try {
      const query = `
        DELETE FROM ride_status_updates 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `;

      const [result] = await db.query(query, [daysOld]);
      
      logger.info(`Deleted ${result.affectedRows} old ride status updates`);
      return result.affectedRows;
    } catch (error) {
      logger.error('Error deleting old ride status updates:', error);
      throw error;
    }
  }
}

module.exports = RideStatusUpdate; 