const db = require('../config/database');

class RideAnalytics {
  /**
   * Find analytics by ride ID
   */
  static async findByRideId(rideId) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM ride_analytics WHERE ride_id = ?',
        [rideId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding ride analytics by ride ID:', error);
      throw error;
    }
  }

  /**
   * Create ride analytics
   */
  static async create(analyticsData) {
    try {
      const { id, ride_id, distance_km, duration_minutes, fare_amount, commission_amount, status, cancellation_reason, rating } = analyticsData;
      
      const result = await db.executeQuery(`
        INSERT INTO ride_analytics (
          id, ride_id, distance_km, duration_minutes, fare_amount, 
          commission_amount, status, cancellation_reason, rating
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, ride_id, distance_km, duration_minutes, fare_amount, commission_amount, status, cancellation_reason, rating]);

      return { id, ...analyticsData };
    } catch (error) {
      console.error('Error creating ride analytics:', error);
      throw error;
    }
  }

  /**
   * Update ride analytics
   */
  static async update(rideId, updateData) {
    try {
      const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updateData);
      values.push(rideId);

      const result = await db.executeQuery(`
        UPDATE ride_analytics 
        SET ${fields}
        WHERE ride_id = ?
      `, values);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating ride analytics:', error);
      throw error;
    }
  }

  /**
   * Get all ride analytics with pagination and filters
   */
  static async findAll(page = 1, limit = 20, filters = {}) {
    try {
      let whereClause = 'WHERE ra.ride_id IS NOT NULL';
      const params = [];

      // Apply filters
      if (filters.status) {
        whereClause += ' AND ra.status = ?';
        params.push(filters.status);
      }

      if (filters.min_distance) {
        whereClause += ' AND ra.distance_km >= ?';
        params.push(parseFloat(filters.min_distance));
      }

      if (filters.max_distance) {
        whereClause += ' AND ra.distance_km <= ?';
        params.push(parseFloat(filters.max_distance));
      }

      if (filters.min_fare) {
        whereClause += ' AND ra.fare_amount >= ?';
        params.push(parseFloat(filters.min_fare));
      }

      if (filters.max_fare) {
        whereClause += ' AND ra.fare_amount <= ?';
        params.push(parseFloat(filters.max_fare));
      }

      if (filters.date_from) {
        whereClause += ' AND DATE(ra.created_at) >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        whereClause += ' AND DATE(ra.created_at) <= ?';
        params.push(filters.date_to);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const limitValue = parseInt(limit);

      // Get ride analytics (simplified without rides table join)
      const rows = await db.executeQuery(`
        SELECT 
          ra.*,
          'Sample Pickup' as pickup_location,
          'Sample Dropoff' as dropoff_location,
          'sample-user-id' as user_id,
          'sample-driver-id' as driver_id,
          'user@example.com' as user_email,
          'John' as user_first_name,
          'Doe' as user_last_name
        FROM ride_analytics ra
        ${whereClause}
        ORDER BY ra.created_at DESC
        LIMIT ${limitValue} OFFSET ${offset}
      `, params);

      // Get total count
      const countResult = await db.executeQuery(`
        SELECT COUNT(*) as total
        FROM ride_analytics ra
        ${whereClause}
      `, params);

      return {
        data: rows,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };
    } catch (error) {
      console.error('Error finding all ride analytics:', error);
      throw error;
    }
  }

  /**
   * Get ride analytics summary
   */
  static async getSummary() {
    try {
      const rows = await db.executeQuery(`
        SELECT 
          COUNT(*) as total_rides,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_rides,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_rides,
          AVG(distance_km) as avg_distance,
          AVG(duration_minutes) as avg_duration,
          AVG(fare_amount) as avg_fare,
          AVG(commission_amount) as avg_commission,
          AVG(rating) as avg_rating,
          SUM(fare_amount) as total_revenue,
          SUM(commission_amount) as total_commission
        FROM ride_analytics
      `);

      return rows[0];
    } catch (error) {
      console.error('Error getting ride analytics summary:', error);
      throw error;
    }
  }

  /**
   * Get rides by status
   */
  static async getByStatus(status, limit = 20) {
    try {
      const rows = await db.executeQuery(`
        SELECT 
          ra.*,
          'Sample Pickup' as pickup_location,
          'Sample Dropoff' as dropoff_location,
          'sample-user-id' as user_id,
          'sample-driver-id' as driver_id,
          'user@example.com' as user_email,
          'John' as user_first_name,
          'Doe' as user_last_name
        FROM ride_analytics ra
        WHERE ra.status = ?
        ORDER BY ra.created_at DESC
        LIMIT ?
      `, [status, limit]);

      return rows;
    } catch (error) {
      console.error('Error getting rides by status:', error);
      throw error;
    }
  }

  /**
   * Get recent rides
   */
  static async getRecentRides(limit = 10) {
    try {
      const rows = await db.executeQuery(`
        SELECT 
          ra.*,
          'Sample Pickup' as pickup_location,
          'Sample Dropoff' as dropoff_location,
          'sample-user-id' as user_id,
          'sample-driver-id' as driver_id,
          'user@example.com' as user_email,
          'John' as user_first_name,
          'Doe' as user_last_name
        FROM ride_analytics ra
        ORDER BY ra.created_at DESC
        LIMIT ?
      `, [limit]);

      return rows;
    } catch (error) {
      console.error('Error getting recent rides:', error);
      throw error;
    }
  }

  /**
   * Get ride statistics by date range
   */
  static async getStatisticsByDateRange(startDate, endDate) {
    try {
      const rows = await db.executeQuery(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_rides,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_rides,
          AVG(distance_km) as avg_distance,
          AVG(fare_amount) as avg_fare,
          SUM(fare_amount) as total_revenue,
          AVG(rating) as avg_rating
        FROM ride_analytics
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date
      `, [startDate, endDate]);

      return rows;
    } catch (error) {
      console.error('Error getting ride statistics by date range:', error);
      throw error;
    }
  }

  /**
   * Get top performing rides
   */
  static async getTopPerformingRides(limit = 10) {
    try {
      const rows = await db.executeQuery(`
        SELECT 
          ra.*,
          'Sample Pickup' as pickup_location,
          'Sample Dropoff' as dropoff_location,
          'sample-user-id' as user_id,
          'sample-driver-id' as driver_id,
          'user@example.com' as user_email,
          'John' as user_first_name,
          'Doe' as user_last_name
        FROM ride_analytics ra
        WHERE ra.status = 'completed' AND ra.rating IS NOT NULL
        ORDER BY ra.rating DESC, ra.fare_amount DESC
        LIMIT ?
      `, [limit]);

      return rows;
    } catch (error) {
      console.error('Error getting top performing rides:', error);
      throw error;
    }
  }
}

module.exports = RideAnalytics; 