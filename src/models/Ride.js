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

  // Search rides with advanced filtering
  static async search(searchCriteria) {
    try {
      const {
        status = 'published',
        passengers = 1,
        maxPrice,
        womenOnly,
        driverVerified,
        departureDate,
        pickupLocation,
        dropLocation,
        sortBy = 'departure_time',
        sortOrder = 'asc',
        page = 1,
        limit = 20
      } = searchCriteria;

      let conditions = ['r.status = ?', 'r.is_published = true', 'r.departure_datetime > NOW()'];
      let params = [status];

      // Add passenger capacity filter
      conditions.push('(r.total_seats - r.booked_seats) >= ?');
      params.push(passengers);

      // Add price filter
      if (maxPrice) {
        conditions.push('r.price_per_seat <= ?');
        params.push(maxPrice);
      }

      // Add women only filter
      if (womenOnly !== undefined) {
        conditions.push('r.women_only = ?');
        params.push(womenOnly);
      }

      // Add driver verified filter
      if (driverVerified !== undefined) {
        conditions.push('r.driver_verified = ?');
        params.push(driverVerified);
      }

      // Add departure date filter
      if (departureDate) {
        const date = new Date(departureDate);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        conditions.push('r.departure_datetime >= ? AND r.departure_datetime < ?');
        params.push(date, nextDay);
      }

      // Add location filters if provided
      if (pickupLocation || dropLocation) {
        conditions.push('EXISTS (SELECT 1 FROM ride_locations rl WHERE rl.ride_id = r.id)');
      }

      // Build the main query
      let query = `
        SELECT DISTINCT r.*, 
               u.name as creator_name, u.email as creator_email,
               uvi.vehicle_number, uvi.vehicle_color, uvi.vehicle_year,
               vb.name as vehicle_brand, vm.name as vehicle_model,
               vt.name as vehicle_type,
               (r.total_seats - r.booked_seats) as available_seats
        FROM rides r
        LEFT JOIN users u ON r.created_by = u.id
        LEFT JOIN user_vehicle_information uvi ON r.vehicle_information_id = uvi.id
        LEFT JOIN vehicle_brands vb ON uvi.vehicle_brand_id = vb.id
        LEFT JOIN vehicle_models vm ON uvi.vehicle_model_id = vm.id
        LEFT JOIN vehicle_types vt ON uvi.vehicle_type_id = vt.id
        WHERE ${conditions.join(' AND ')}
        AND u.is_deleted = 0
      `;

      // Add sorting
      const sortField = sortBy === 'departure_time' ? 'r.departure_datetime' : 
                       sortBy === 'price' ? 'r.price_per_seat' :
                       sortBy === 'distance' ? 'r.distance' : 'r.created_at';
      
      query += ` ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;

      // Add pagination
      const offset = (page - 1) * limit;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [rows] = await db.execute(query, params);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT r.id) as total
        FROM rides r
        LEFT JOIN users u ON r.created_by = u.id
        WHERE ${conditions.join(' AND ')}
        AND u.is_deleted = 0
      `;
      
      const [countRows] = await db.execute(countQuery, params.slice(0, -2));
      const total = countRows[0].total;

      // Get locations for each ride
      for (let ride of rows) {
        const locationsQuery = `
          SELECT * FROM ride_locations 
          WHERE ride_id = ? 
          ORDER BY location_type, sequence_order
        `;
        const [locationRows] = await db.execute(locationsQuery, [ride.id]);
        ride.locations = locationRows;

        // Get travel preferences
        const preferencesQuery = `
          SELECT * FROM ride_travel_preferences 
          WHERE ride_id = ?
        `;
        const [preferenceRows] = await db.execute(preferencesQuery, [ride.id]);
        ride.travelPreferences = preferenceRows[0] || null;
      }

      return {
        rides: rows,
        total: total
      };
    } catch (error) {
      logger.error('Error searching rides:', error);
      throw error;
    }
  }

  // Filter rides with specific criteria
  static async filter(filterCriteria) {
    try {
      const {
        status,
        priceMin,
        priceMax,
        distanceMin,
        distanceMax,
        dateFrom,
        dateTo,
        vehicleType,
        vehicleBrand,
        sortBy = 'created_at',
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = filterCriteria;

      let conditions = ['r.departure_datetime > NOW()'];
      let params = [];

      // Add status filter
      if (status && status.length > 0) {
        const placeholders = status.map(() => '?').join(',');
        conditions.push(`r.status IN (${placeholders})`);
        params.push(...status);
      }

      // Add price filters
      if (priceMin) {
        conditions.push('r.price_per_seat >= ?');
        params.push(priceMin);
      }
      if (priceMax) {
        conditions.push('r.price_per_seat <= ?');
        params.push(priceMax);
      }

      // Add distance filters
      if (distanceMin) {
        conditions.push('r.distance >= ?');
        params.push(distanceMin);
      }
      if (distanceMax) {
        conditions.push('r.distance <= ?');
        params.push(distanceMax);
      }

      // Add date filters
      if (dateFrom) {
        conditions.push('r.departure_datetime >= ?');
        params.push(dateFrom);
      }
      if (dateTo) {
        conditions.push('r.departure_datetime <= ?');
        params.push(dateTo);
      }

      // Add vehicle filters
      if (vehicleType) {
        conditions.push('vt.name = ?');
        params.push(vehicleType);
      }
      if (vehicleBrand) {
        conditions.push('vb.name = ?');
        params.push(vehicleBrand);
      }

      // Build the main query
      let query = `
        SELECT DISTINCT r.*, 
               u.name as creator_name, u.email as creator_email,
               uvi.vehicle_number, uvi.vehicle_color, uvi.vehicle_year,
               vb.name as vehicle_brand, vm.name as vehicle_model,
               vt.name as vehicle_type,
               (r.total_seats - r.booked_seats) as available_seats
        FROM rides r
        LEFT JOIN users u ON r.created_by = u.id
        LEFT JOIN user_vehicle_information uvi ON r.vehicle_information_id = uvi.id
        LEFT JOIN vehicle_brands vb ON uvi.vehicle_brand_id = vb.id
        LEFT JOIN vehicle_models vm ON uvi.vehicle_model_id = vm.id
        LEFT JOIN vehicle_types vt ON uvi.vehicle_type_id = vt.id
        WHERE ${conditions.join(' AND ')}
        AND u.is_deleted = 0
      `;

      // Add sorting
      const sortField = sortBy === 'departure_time' ? 'r.departure_datetime' : 
                       sortBy === 'price' ? 'r.price_per_seat' :
                       sortBy === 'distance' ? 'r.distance' : 'r.created_at';
      
      query += ` ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;

      // Add pagination
      const offset = (page - 1) * limit;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [rows] = await db.execute(query, params);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(DISTINCT r.id) as total
        FROM rides r
        LEFT JOIN users u ON r.created_by = u.id
        LEFT JOIN user_vehicle_information uvi ON r.vehicle_information_id = uvi.id
        LEFT JOIN vehicle_brands vb ON uvi.vehicle_brand_id = vb.id
        LEFT JOIN vehicle_types vt ON uvi.vehicle_type_id = vt.id
        WHERE ${conditions.join(' AND ')}
        AND u.is_deleted = 0
      `;
      
      const [countRows] = await db.execute(countQuery, params.slice(0, -2));
      const total = countRows[0].total;

      // Get locations and preferences for each ride
      for (let ride of rows) {
        const locationsQuery = `
          SELECT * FROM ride_locations 
          WHERE ride_id = ? 
          ORDER BY location_type, sequence_order
        `;
        const [locationRows] = await db.execute(locationsQuery, [ride.id]);
        ride.locations = locationRows;

        const preferencesQuery = `
          SELECT * FROM ride_travel_preferences 
          WHERE ride_id = ?
        `;
        const [preferenceRows] = await db.execute(preferencesQuery, [ride.id]);
        ride.travelPreferences = preferenceRows[0] || null;
      }

      return {
        rides: rows,
        total: total
      };
    } catch (error) {
      logger.error('Error filtering rides:', error);
      throw error;
    }
  }

  // Save search to history
  static async saveSearchHistory(userId, pickupLocation, dropLocation) {
    try {
      const searchId = uuidv4();
      const query = `
        INSERT INTO user_search_history (id, user_id, pickup_location, drop_location, search_date)
        VALUES (?, ?, ?, ?, ?)
      `;

      await db.execute(query, [searchId, userId, pickupLocation, dropLocation, new Date()]);
      
      logger.info(`Search history saved for user: ${userId}`);
      return searchId;
    } catch (error) {
      logger.error('Error saving search history:', error);
      throw error;
    }
  }

  // Get search history for user
  static async getSearchHistory(userId, limit = 20, offset = 0) {
    try {
      const query = `
        SELECT id, pickup_location, drop_location, search_date
        FROM user_search_history
        WHERE user_id = ?
        ORDER BY search_date DESC
        LIMIT ? OFFSET ?
      `;

      const [rows] = await db.execute(query, [userId, limit, offset]);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_search_history
        WHERE user_id = ?
      `;
      const [countRows] = await db.execute(countQuery, [userId]);
      const total = countRows[0].total;

      return {
        searches: rows,
        total: total
      };
    } catch (error) {
      logger.error('Error getting search history:', error);
      throw error;
    }
  }

  // Delete search history item
  static async deleteSearchHistory(searchId, userId) {
    try {
      const query = `
        DELETE FROM user_search_history
        WHERE id = ? AND user_id = ?
      `;

      const [result] = await db.execute(query, [searchId, userId]);
      
      if (result.affectedRows === 0) {
        return false;
      }

      logger.info(`Search history deleted: ${searchId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting search history:', error);
      throw error;
    }
  }

  // Get popular searches
  static async getPopularSearches(query) {
    try {
      const searchQuery = `
        SELECT pickup_location, drop_location, COUNT(*) as search_count
        FROM user_search_history
        WHERE (pickup_location LIKE ? OR drop_location LIKE ?)
        GROUP BY pickup_location, drop_location
        ORDER BY search_count DESC
        LIMIT 5
      `;

      const searchPattern = `%${query}%`;
      const [rows] = await db.execute(searchQuery, [searchPattern, searchPattern]);

      return rows.map(row => ({
        description: `${row.pickup_location || 'Any'} → ${row.drop_location || 'Any'}`,
        pickupLocation: row.pickup_location,
        dropLocation: row.drop_location,
        searchCount: row.search_count
      }));
    } catch (error) {
      logger.error('Error getting popular searches:', error);
      throw error;
    }
  }

  // Update ride status
  static async updateStatus(rideId, status, userId = null) {
    try {
      const validStatuses = ['draft', 'published', 'in_progress', 'completed', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid ride status');
      }

      // Check if user can modify the ride
      if (userId) {
        const canModify = await this.canModify(rideId, userId);
        if (!canModify.canModify) {
          throw new Error(canModify.reason);
        }
      }

      const query = `
        UPDATE rides 
        SET status = ?, updated_at = ?
        WHERE id = ?
      `;

      const [result] = await db.execute(query, [status, new Date(), rideId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Ride not found');
      }

      logger.info(`Ride status updated: ${rideId} to ${status} by user: ${userId}`);
      return result;
    } catch (error) {
      logger.error('Error updating ride status:', error);
      throw error;
    }
  }

  // Complete ride
  static async completeRide(rideId, userId) {
    try {
      // Check if user can modify the ride
      const canModify = await this.canModify(rideId, userId);
      if (!canModify.canModify) {
        throw new Error(canModify.reason);
      }

      // Get current ride status
      const ride = await this.findById(rideId);
      if (!ride) {
        throw new Error('Ride not found');
      }

      if (ride.status === 'completed') {
        throw new Error('Ride is already completed');
      }

      if (ride.status === 'cancelled') {
        throw new Error('Cannot complete a cancelled ride');
      }

      // Update ride status to completed
      const query = `
        UPDATE rides 
        SET status = 'completed', updated_at = ?
        WHERE id = ?
      `;

      const [result] = await db.execute(query, [new Date(), rideId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Ride not found');
      }

      // Update ride statistics
      await this.updateRideStatistics(rideId);

      logger.info(`Ride completed: ${rideId} by user: ${userId}`);
      return result;
    } catch (error) {
      logger.error('Error completing ride:', error);
      throw error;
    }
  }

  // Get ride statistics
  static async getStatistics(rideId, userId = null) {
    try {
      // Check if user has access to ride statistics
      if (userId) {
        const ride = await this.findById(rideId);
        if (!ride) {
          throw new Error('Ride not found');
        }
        
        if (ride.created_by !== userId) {
          throw new Error('Not authorized to view ride statistics');
        }
      }

      const query = `
        SELECT 
          rs.total_bookings,
          rs.total_revenue,
          rs.average_rating,
          rs.total_ratings,
          r.total_seats,
          r.booked_seats,
          r.status,
          r.created_at,
          r.departure_datetime
        FROM ride_statistics rs
        RIGHT JOIN rides r ON rs.ride_id = r.id
        WHERE r.id = ?
      `;

      const [rows] = await db.execute(query, [rideId]);
      
      if (rows.length === 0) {
        throw new Error('Ride not found');
      }

      const stats = rows[0];
      
      // Calculate additional statistics
      const availableSeats = stats.total_seats - stats.booked_seats;
      const occupancyRate = stats.total_seats > 0 ? (stats.booked_seats / stats.total_seats) * 100 : 0;
      
      return {
        totalBookings: stats.total_bookings || 0,
        totalRevenue: parseFloat(stats.total_revenue || 0),
        averageRating: parseFloat(stats.average_rating || 0),
        totalRatings: stats.total_ratings || 0,
        totalSeats: stats.total_seats,
        bookedSeats: stats.booked_seats,
        availableSeats,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        status: stats.status,
        createdAt: stats.created_at,
        departureDateTime: stats.departure_datetime
      };
    } catch (error) {
      logger.error('Error getting ride statistics:', error);
      throw error;
    }
  }

  // Update ride statistics
  static async updateRideStatistics(rideId) {
    try {
      // Get booking statistics for the ride
      const bookingQuery = `
        SELECT 
          COUNT(*) as total_bookings,
          SUM(total_amount) as total_revenue
        FROM bookings 
        WHERE ride_id = ? AND status != 'cancelled'
      `;

      const [bookingRows] = await db.execute(bookingQuery, [rideId]);
      const bookingStats = bookingRows[0];

      // Get rating statistics (placeholder for future rating system)
      const ratingQuery = `
        SELECT 
          AVG(rating) as average_rating,
          COUNT(*) as total_ratings
        FROM ride_ratings 
        WHERE ride_id = ?
      `;

      let averageRating = 0;
      let totalRatings = 0;

      try {
        const [ratingRows] = await db.execute(ratingQuery, [rideId]);
        if (ratingRows.length > 0) {
          averageRating = parseFloat(ratingRows[0].average_rating || 0);
          totalRatings = parseInt(ratingRows[0].total_ratings || 0);
        }
      } catch (error) {
        // Rating table might not exist yet, use default values
        logger.warn('Rating table not found, using default values');
      }

      // Insert or update ride statistics
      const upsertQuery = `
        INSERT INTO ride_statistics (ride_id, total_bookings, total_revenue, average_rating, total_ratings, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          total_bookings = VALUES(total_bookings),
          total_revenue = VALUES(total_revenue),
          average_rating = VALUES(average_rating),
          total_ratings = VALUES(total_ratings)
      `;

      await db.execute(upsertQuery, [
        rideId,
        bookingStats.total_bookings || 0,
        bookingStats.total_revenue || 0,
        averageRating,
        totalRatings,
        new Date()
      ]);

      logger.info(`Ride statistics updated: ${rideId}`);
    } catch (error) {
      logger.error('Error updating ride statistics:', error);
      throw error;
    }
  }

  // Get user ride statistics
  static async getUserRideStatistics(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_rides,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_rides,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_rides,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as active_rides,
          SUM(total_seats) as total_seats_offered,
          SUM(booked_seats) as total_seats_booked,
          AVG(price_per_seat) as average_price_per_seat,
          SUM(booked_seats * price_per_seat) as total_revenue
        FROM rides 
        WHERE created_by = ?
      `;

      const [rows] = await db.execute(query, [userId]);
      
      if (rows.length === 0) {
        return {
          totalRides: 0,
          completedRides: 0,
          cancelledRides: 0,
          activeRides: 0,
          totalSeatsOffered: 0,
          totalSeatsBooked: 0,
          averagePricePerSeat: 0,
          totalRevenue: 0,
          completionRate: 0,
          occupancyRate: 0
        };
      }

      const stats = rows[0];
      const totalRides = parseInt(stats.total_rides || 0);
      const completedRides = parseInt(stats.completed_rides || 0);
      const totalSeatsOffered = parseInt(stats.total_seats_offered || 0);
      const totalSeatsBooked = parseInt(stats.total_seats_booked || 0);

      return {
        totalRides,
        completedRides: parseInt(stats.completed_rides || 0),
        cancelledRides: parseInt(stats.cancelled_rides || 0),
        activeRides: parseInt(stats.active_rides || 0),
        totalSeatsOffered,
        totalSeatsBooked,
        averagePricePerSeat: parseFloat(stats.average_price_per_seat || 0),
        totalRevenue: parseFloat(stats.total_revenue || 0),
        completionRate: totalRides > 0 ? Math.round((completedRides / totalRides) * 100) : 0,
        occupancyRate: totalSeatsOffered > 0 ? Math.round((totalSeatsBooked / totalSeatsOffered) * 100) : 0
      };
    } catch (error) {
      logger.error('Error getting user ride statistics:', error);
      throw error;
    }
  }
}

module.exports = Ride; 