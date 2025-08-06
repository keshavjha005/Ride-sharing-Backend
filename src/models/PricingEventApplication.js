const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class PricingEventApplication {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.trip_id = data.trip_id;
    this.pricing_event_id = data.pricing_event_id;
    this.original_fare = data.original_fare;
    this.adjusted_fare = data.adjusted_fare;
    this.multiplier_applied = data.multiplier_applied;
    this.created_at = data.created_at || new Date();
  }

  /**
   * Create a new pricing event application
   * @param {Object} applicationData - Application data
   * @returns {Promise<PricingEventApplication>}
   */
  static async create(applicationData) {
    try {
      const application = new PricingEventApplication(applicationData);
      
      const query = `
        INSERT INTO pricing_event_applications (
          id, trip_id, pricing_event_id, original_fare, 
          adjusted_fare, multiplier_applied, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        application.id,
        application.trip_id,
        application.pricing_event_id,
        application.original_fare,
        application.adjusted_fare,
        application.multiplier_applied,
        application.created_at
      ];

      await executeQuery(query, values);
      return application;
    } catch (error) {
      logger.error('Error creating pricing event application:', error);
      throw new Error(`Failed to create pricing event application: ${error.message}`);
    }
  }

  /**
   * Find pricing event application by ID
   * @param {string} id - Application ID
   * @returns {Promise<PricingEventApplication|null>}
   */
  static async findById(id) {
    try {
      const rows = await executeQuery(
        'SELECT * FROM pricing_event_applications WHERE id = ?',
        [id]
      );

      if (!rows || rows.length === 0) {
        return null;
      }

      return new PricingEventApplication(rows[0]);
    } catch (error) {
      logger.error('Error finding pricing event application by ID:', error);
      throw new Error(`Failed to find pricing event application: ${error.message}`);
    }
  }

  /**
   * Find applications by trip ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<PricingEventApplication[]>}
   */
  static async findByTripId(tripId) {
    try {
      const rows = await executeQuery(
        'SELECT * FROM pricing_event_applications WHERE trip_id = ? ORDER BY created_at DESC',
        [tripId]
      );

      return rows.map(row => new PricingEventApplication(row));
    } catch (error) {
      logger.error('Error finding pricing event applications by trip ID:', error);
      throw new Error(`Failed to find pricing event applications: ${error.message}`);
    }
  }

  /**
   * Find applications by pricing event ID
   * @param {string} eventId - Pricing event ID
   * @param {Object} options - Query options
   * @returns {Promise<PricingEventApplication[]>}
   */
  static async findByEventId(eventId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const query = `
        SELECT * FROM pricing_event_applications 
        WHERE pricing_event_id = ? 
        ORDER BY created_at DESC 
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;

      const rows = await executeQuery(query, [eventId]);

      return rows.map(row => new PricingEventApplication(row));
    } catch (error) {
      logger.error('Error finding pricing event applications by event ID:', error);
      throw new Error(`Failed to find pricing event applications: ${error.message}`);
    }
  }

  /**
   * Find all applications with optional filtering
   * @param {Object} options - Query options
   * @returns {Promise<PricingEventApplication[]>}
   */
  static async findAll(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'DESC',
        startDate = null,
        endDate = null
      } = options;

      let query = 'SELECT * FROM pricing_event_applications WHERE 1=1';
      const values = [];

      if (startDate) {
        query += ' AND created_at >= ?';
        values.push(startDate);
      }

      if (endDate) {
        query += ' AND created_at <= ?';
        values.push(endDate);
      }

      query += ` ORDER BY ${orderBy} ${orderDirection}`;
      query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

      const rows = await executeQuery(query, values);

      return rows.map(row => new PricingEventApplication(row));
    } catch (error) {
      logger.error('Error finding pricing event applications:', error);
      throw new Error(`Failed to find pricing event applications: ${error.message}`);
    }
  }

  /**
   * Get application statistics
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async getStatistics(options = {}) {
    try {
      const { period = '30', eventId = null } = options;
      
      let query = `
        SELECT 
          COUNT(*) as total_applications,
          SUM(original_fare) as total_original_fare,
          SUM(adjusted_fare) as total_adjusted_fare,
          SUM(adjusted_fare - original_fare) as total_fare_increase,
          AVG(multiplier_applied) as avg_multiplier,
          MAX(multiplier_applied) as max_multiplier,
          MIN(multiplier_applied) as min_multiplier,
          COUNT(DISTINCT trip_id) as unique_trips,
          COUNT(DISTINCT pricing_event_id) as unique_events
        FROM pricing_event_applications 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `;

      const values = [period];

      if (eventId) {
        query += ' AND pricing_event_id = ?';
        values.push(eventId);
      }

      const rows = await executeQuery(query, values);
      return rows[0];
    } catch (error) {
      logger.error('Error getting pricing event application statistics:', error);
      throw new Error(`Failed to get pricing event application statistics: ${error.message}`);
    }
  }

  /**
   * Get applications with event details
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>}
   */
  static async findWithEventDetails(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        tripId = null,
        eventId = null
      } = options;

      let query = `
        SELECT 
          pea.*,
          pe.event_name,
          pe.event_type,
          pe.pricing_multiplier as event_multiplier
        FROM pricing_event_applications pea
        LEFT JOIN pricing_events pe ON pea.pricing_event_id = pe.id
        WHERE 1=1
      `;

      const values = [];

      if (tripId) {
        query += ' AND pea.trip_id = ?';
        values.push(tripId);
      }

      if (eventId) {
        query += ' AND pea.pricing_event_id = ?';
        values.push(eventId);
      }

      query += ` ORDER BY pea.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

      const rows = await executeQuery(query, values);

      return rows.map(row => ({
        ...new PricingEventApplication(row),
        event_name: row.event_name,
        event_type: row.event_type,
        event_multiplier: row.event_multiplier
      }));
    } catch (error) {
      logger.error('Error finding pricing event applications with details:', error);
      throw new Error(`Failed to find pricing event applications with details: ${error.message}`);
    }
  }

  /**
   * Delete application by ID
   * @param {string} id - Application ID
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    try {
      const [result] = await executeQuery(
        'DELETE FROM pricing_event_applications WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting pricing event application:', error);
      throw new Error(`Failed to delete pricing event application: ${error.message}`);
    }
  }

  /**
   * Delete applications by trip ID
   * @param {string} tripId - Trip ID
   * @returns {Promise<boolean>}
   */
  static async deleteByTripId(tripId) {
    try {
      const [result] = await executeQuery(
        'DELETE FROM pricing_event_applications WHERE trip_id = ?',
        [tripId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting pricing event applications by trip ID:', error);
      throw new Error(`Failed to delete pricing event applications: ${error.message}`);
    }
  }

  /**
   * Get fare increase amount
   * @returns {number}
   */
  getFareIncrease() {
    return this.adjusted_fare - this.original_fare;
  }

  /**
   * Get fare increase percentage
   * @returns {number}
   */
  getFareIncreasePercentage() {
    if (this.original_fare === 0) return 0;
    return ((this.adjusted_fare - this.original_fare) / this.original_fare) * 100;
  }

  /**
   * Convert to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      trip_id: this.trip_id,
      pricing_event_id: this.pricing_event_id,
      original_fare: this.original_fare,
      adjusted_fare: this.adjusted_fare,
      multiplier_applied: this.multiplier_applied,
      fare_increase: this.getFareIncrease(),
      fare_increase_percentage: this.getFareIncreasePercentage(),
      created_at: this.created_at
    };
  }
}

module.exports = PricingEventApplication; 