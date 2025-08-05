const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class RideLocation {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.rideId = data.rideId;
    this.locationType = data.locationType; // 'pickup', 'drop', 'stopover'
    this.address = data.address;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.sequenceOrder = data.sequenceOrder || 0;
    this.createdAt = data.createdAt || new Date();
  }

  // Create ride location
  static async create(locationData) {
    try {
      const location = new RideLocation(locationData);
      
      const query = `
        INSERT INTO ride_locations (
          id, ride_id, location_type, address, latitude, longitude, 
          sequence_order, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        location.id, location.rideId, location.locationType,
        location.address, location.latitude, location.longitude,
        location.sequenceOrder, location.createdAt
      ];

      await db.execute(query, values);
      
      logger.info(`Ride location created successfully with ID: ${location.id}`);
      return location;
    } catch (error) {
      logger.error('Error creating ride location:', error);
      throw error;
    }
  }

  // Create multiple ride locations
  static async createMultiple(locationsData) {
    try {
      const locations = [];
      
      for (const locationData of locationsData) {
        const location = await this.create(locationData);
        locations.push(location);
      }
      
      return locations;
    } catch (error) {
      logger.error('Error creating multiple ride locations:', error);
      throw error;
    }
  }

  // Get locations by ride ID
  static async findByRideId(rideId) {
    try {
      const query = `
        SELECT * FROM ride_locations 
        WHERE ride_id = ? 
        ORDER BY location_type, sequence_order
      `;

      const [rows] = await db.execute(query, [rideId]);
      return rows;
    } catch (error) {
      logger.error('Error finding ride locations by ride ID:', error);
      throw error;
    }
  }

  // Get pickup location for a ride
  static async getPickupLocation(rideId) {
    try {
      const query = `
        SELECT * FROM ride_locations 
        WHERE ride_id = ? AND location_type = 'pickup'
        ORDER BY sequence_order LIMIT 1
      `;

      const [rows] = await db.execute(query, [rideId]);
      return rows[0] || null;
    } catch (error) {
      logger.error('Error getting pickup location:', error);
      throw error;
    }
  }

  // Get drop location for a ride
  static async getDropLocation(rideId) {
    try {
      const query = `
        SELECT * FROM ride_locations 
        WHERE ride_id = ? AND location_type = 'drop'
        ORDER BY sequence_order DESC LIMIT 1
      `;

      const [rows] = await db.execute(query, [rideId]);
      return rows[0] || null;
    } catch (error) {
      logger.error('Error getting drop location:', error);
      throw error;
    }
  }

  // Get stopover locations for a ride
  static async getStopoverLocations(rideId) {
    try {
      const query = `
        SELECT * FROM ride_locations 
        WHERE ride_id = ? AND location_type = 'stopover'
        ORDER BY sequence_order
      `;

      const [rows] = await db.execute(query, [rideId]);
      return rows;
    } catch (error) {
      logger.error('Error getting stopover locations:', error);
      throw error;
    }
  }

  // Update ride location
  static async update(locationId, updateData) {
    try {
      const allowedFields = [
        'address', 'latitude', 'longitude', 'sequenceOrder'
      ];

      const updateFields = [];
      const values = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          updateFields.push(`${dbField} = ?`);
          values.push(value);
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(locationId);

      const query = `
        UPDATE ride_locations 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      const [result] = await db.execute(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('Ride location not found');
      }

      logger.info(`Ride location updated successfully: ${locationId}`);
      return result;
    } catch (error) {
      logger.error('Error updating ride location:', error);
      throw error;
    }
  }

  // Delete ride location
  static async delete(locationId) {
    try {
      const query = `DELETE FROM ride_locations WHERE id = ?`;
      const [result] = await db.execute(query, [locationId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Ride location not found');
      }

      logger.info(`Ride location deleted successfully: ${locationId}`);
      return result;
    } catch (error) {
      logger.error('Error deleting ride location:', error);
      throw error;
    }
  }

  // Delete all locations for a ride
  static async deleteByRideId(rideId) {
    try {
      const query = `DELETE FROM ride_locations WHERE ride_id = ?`;
      const [result] = await db.execute(query, [rideId]);
      
      logger.info(`All ride locations deleted for ride: ${rideId}`);
      return result;
    } catch (error) {
      logger.error('Error deleting ride locations by ride ID:', error);
      throw error;
    }
  }

  // Validate location data
  static validateLocationData(locationData) {
    const errors = [];

    if (!locationData.address || locationData.address.trim() === '') {
      errors.push('Address is required');
    }

    if (typeof locationData.latitude !== 'number' || 
        locationData.latitude < -90 || locationData.latitude > 90) {
      errors.push('Valid latitude is required (-90 to 90)');
    }

    if (typeof locationData.longitude !== 'number' || 
        locationData.longitude < -180 || locationData.longitude > 180) {
      errors.push('Valid longitude is required (-180 to 180)');
    }

    if (!['pickup', 'drop', 'stopover'].includes(locationData.locationType)) {
      errors.push('Valid location type is required (pickup, drop, stopover)');
    }

    if (locationData.sequenceOrder !== undefined && 
        (typeof locationData.sequenceOrder !== 'number' || locationData.sequenceOrder < 0)) {
      errors.push('Sequence order must be a non-negative number');
    }

    return errors;
  }
}

module.exports = RideLocation; 