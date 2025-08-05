const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class Ride {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.createdBy = data.createdBy;
    this.vehicleInformationId = data.vehicleInformationId;
    this.totalSeats = data.totalSeats;
    this.bookedSeats = data.bookedSeats || 0;
    this.pricePerSeat = data.pricePerSeat;
    this.distance = data.distance;
    this.estimatedTime = data.estimatedTime;
    this.luggageAllowed = data.luggageAllowed !== undefined ? data.luggageAllowed : true;
    this.womenOnly = data.womenOnly || false;
    this.driverVerified = data.driverVerified || false;
    this.twoPassengerMaxBack = data.twoPassengerMaxBack || false;
    this.status = data.status || 'draft';
    this.isPublished = data.isPublished || false;
    this.departureDateTime = data.departureDateTime;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Create a new ride
  static async create(rideData) {
    try {
      const ride = new Ride(rideData);
      
      const query = `
        INSERT INTO rides (
          id, created_by, vehicle_information_id, total_seats, booked_seats,
          price_per_seat, distance, estimated_time, luggage_allowed, women_only,
          driver_verified, two_passenger_max_back, status, is_published,
          departure_datetime, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        ride.id, ride.createdBy, ride.vehicleInformationId, ride.totalSeats,
        ride.bookedSeats, ride.pricePerSeat, ride.distance, ride.estimatedTime,
        ride.luggageAllowed, ride.womenOnly, ride.driverVerified,
        ride.twoPassengerMaxBack, ride.status, ride.isPublished,
        ride.departureDateTime, ride.createdAt, ride.updatedAt
      ];

      await db.execute(query, values);
      
      logger.info(`Ride created successfully with ID: ${ride.id}`);
      return ride;
    } catch (error) {
      logger.error('Error creating ride:', error);
      throw error;
    }
  }

  // Get ride by ID with locations and preferences
  static async findById(rideId) {
    try {
      const query = `
        SELECT r.*, 
               u.name as creator_name, u.email as creator_email,
               uvi.vehicle_number, uvi.vehicle_color, uvi.vehicle_year,
               vb.name as vehicle_brand, vm.name as vehicle_model,
               vt.name as vehicle_type
        FROM rides r
        LEFT JOIN users u ON r.created_by = u.id
        LEFT JOIN user_vehicle_information uvi ON r.vehicle_information_id = uvi.id
        LEFT JOIN vehicle_brands vb ON uvi.vehicle_brand_id = vb.id
        LEFT JOIN vehicle_models vm ON uvi.vehicle_model_id = vm.id
        LEFT JOIN vehicle_types vt ON uvi.vehicle_type_id = vt.id
        WHERE r.id = ? AND u.is_deleted = 0
      `;

      const [rows] = await db.execute(query, [rideId]);
      
      if (rows.length === 0) {
        return null;
      }

      const ride = rows[0];
      
      // Get ride locations
      const locationsQuery = `
        SELECT * FROM ride_locations 
        WHERE ride_id = ? 
        ORDER BY location_type, sequence_order
      `;
      const [locationRows] = await db.execute(locationsQuery, [rideId]);
      ride.locations = locationRows;

      // Get travel preferences
      const preferencesQuery = `
        SELECT * FROM ride_travel_preferences 
        WHERE ride_id = ?
      `;
      const [preferenceRows] = await db.execute(preferencesQuery, [rideId]);
      ride.travelPreferences = preferenceRows[0] || null;

      return ride;
    } catch (error) {
      logger.error('Error finding ride by ID:', error);
      throw error;
    }
  }

  // Get user's rides
  static async findByUserId(userId, status = null, limit = 20, offset = 0) {
    try {
      let query = `
        SELECT r.*, 
               uvi.vehicle_number, uvi.vehicle_color,
               vb.name as vehicle_brand, vm.name as vehicle_model,
               vt.name as vehicle_type
        FROM rides r
        LEFT JOIN user_vehicle_information uvi ON r.vehicle_information_id = uvi.id
        LEFT JOIN vehicle_brands vb ON uvi.vehicle_brand_id = vb.id
        LEFT JOIN vehicle_models vm ON uvi.vehicle_model_id = vm.id
        LEFT JOIN vehicle_types vt ON uvi.vehicle_type_id = vt.id
        WHERE r.created_by = ?
      `;

      const values = [userId];

      if (status) {
        query += ' AND r.status = ?';
        values.push(status);
      }

      query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const [rows] = await db.execute(query, values);
      return rows;
    } catch (error) {
      logger.error('Error finding rides by user ID:', error);
      throw error;
    }
  }

  // Update ride
  static async update(rideId, updateData) {
    try {
      const allowedFields = [
        'totalSeats', 'pricePerSeat', 'distance', 'estimatedTime',
        'luggageAllowed', 'womenOnly', 'driverVerified', 'twoPassengerMaxBack',
        'status', 'isPublished', 'departureDateTime'
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

      updateFields.push('updated_at = ?');
      values.push(new Date());
      values.push(rideId);

      const query = `
        UPDATE rides 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      const [result] = await db.execute(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('Ride not found');
      }

      logger.info(`Ride updated successfully: ${rideId}`);
      return result;
    } catch (error) {
      logger.error('Error updating ride:', error);
      throw error;
    }
  }

  // Delete ride (soft delete by setting status to cancelled)
  static async delete(rideId) {
    try {
      const query = `
        UPDATE rides 
        SET status = 'cancelled', updated_at = ?
        WHERE id = ?
      `;

      const [result] = await db.execute(query, [new Date(), rideId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Ride not found');
      }

      logger.info(`Ride cancelled successfully: ${rideId}`);
      return result;
    } catch (error) {
      logger.error('Error deleting ride:', error);
      throw error;
    }
  }

  // Publish ride
  static async publish(rideId) {
    try {
      const query = `
        UPDATE rides 
        SET status = 'published', is_published = true, updated_at = ?
        WHERE id = ?
      `;

      const [result] = await db.execute(query, [new Date(), rideId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Ride not found');
      }

      logger.info(`Ride published successfully: ${rideId}`);
      return result;
    } catch (error) {
      logger.error('Error publishing ride:', error);
      throw error;
    }
  }

  // Unpublish ride
  static async unpublish(rideId) {
    try {
      const query = `
        UPDATE rides 
        SET status = 'draft', is_published = false, updated_at = ?
        WHERE id = ?
      `;

      const [result] = await db.execute(query, [new Date(), rideId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Ride not found');
      }

      logger.info(`Ride unpublished successfully: ${rideId}`);
      return result;
    } catch (error) {
      logger.error('Error unpublishing ride:', error);
      throw error;
    }
  }

  // Check if user can modify ride
  static async canModify(rideId, userId) {
    try {
      const query = `
        SELECT created_by, status 
        FROM rides 
        WHERE id = ?
      `;

      const [rows] = await db.execute(query, [rideId]);
      
      if (rows.length === 0) {
        return { canModify: false, reason: 'Ride not found' };
      }

      const ride = rows[0];
      
      if (ride.created_by !== userId) {
        return { canModify: false, reason: 'Not authorized' };
      }

      if (['in_progress', 'completed'].includes(ride.status)) {
        return { canModify: false, reason: 'Ride is in progress or completed' };
      }

      return { canModify: true };
    } catch (error) {
      logger.error('Error checking ride modification permissions:', error);
      throw error;
    }
  }

  // Get available seats
  static async getAvailableSeats(rideId) {
    try {
      const query = `
        SELECT total_seats, booked_seats 
        FROM rides 
        WHERE id = ?
      `;

      const [rows] = await db.execute(query, [rideId]);
      
      if (rows.length === 0) {
        return 0;
      }

      const ride = rows[0];
      return Math.max(0, ride.total_seats - ride.booked_seats);
    } catch (error) {
      logger.error('Error getting available seats:', error);
      throw error;
    }
  }

  // Update booked seats
  static async updateBookedSeats(rideId, seatsToAdd) {
    try {
      const query = `
        UPDATE rides 
        SET booked_seats = booked_seats + ?, updated_at = ?
        WHERE id = ? AND (booked_seats + ?) <= total_seats
      `;

      const [result] = await db.execute(query, [seatsToAdd, new Date(), rideId, seatsToAdd]);
      
      if (result.affectedRows === 0) {
        throw new Error('Cannot book seats - insufficient availability');
      }

      return result;
    } catch (error) {
      logger.error('Error updating booked seats:', error);
      throw error;
    }
  }
}

module.exports = Ride; 