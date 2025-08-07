const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class PricingEvent {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.event_name = data.event_name;
    this.event_type = data.event_type;
    this.start_date = data.start_date;
    this.end_date = data.end_date;
    this.pricing_multiplier = data.pricing_multiplier;
    this.affected_vehicle_types = data.affected_vehicle_types;
    this.affected_areas = data.affected_areas;
    this.description = data.description;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Create a new pricing event
   * @param {Object} eventData - Pricing event data
   * @returns {Promise<PricingEvent>}
   */
  static async create(eventData) {
    try {
      const event = new PricingEvent(eventData);
      
      const query = `
        INSERT INTO pricing_events (
          id, event_name, event_type, start_date, end_date, 
          pricing_multiplier, affected_vehicle_types, affected_areas, 
          description, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        event.id,
        event.event_name,
        event.event_type,
        event.start_date,
        event.end_date,
        event.pricing_multiplier,
        JSON.stringify(event.affected_vehicle_types),
        JSON.stringify(event.affected_areas),
        event.description,
        event.is_active,
        event.created_at,
        event.updated_at
      ];

      await executeQuery(query, values);
      return event;
    } catch (error) {
      logger.error('Error creating pricing event:', error);
      throw new Error(`Failed to create pricing event: ${error.message}`);
    }
  }

  /**
   * Find pricing event by ID
   * @param {string} id - Event ID
   * @returns {Promise<PricingEvent|null>}
   */
  static async findById(id) {
    try {
      const rows = await executeQuery(
        'SELECT * FROM pricing_events WHERE id = ?',
        [id]
      );

      if (!rows || rows.length === 0) {
        return null;
      }

      const row = rows[0];
      if (!row) {
        return null;
      }

      return new PricingEvent({
        ...row,
        affected_vehicle_types: Array.isArray(row.affected_vehicle_types) ? row.affected_vehicle_types : JSON.parse(row.affected_vehicle_types || '[]'),
        affected_areas: Array.isArray(row.affected_areas) ? row.affected_areas : JSON.parse(row.affected_areas || '[]')
      });
    } catch (error) {
      logger.error('Error finding pricing event by ID:', error);
      throw new Error(`Failed to find pricing event: ${error.message}`);
    }
  }

  /**
   * Find all pricing events with optional filtering
   * @param {Object} options - Query options
   * @returns {Promise<PricingEvent[]>}
   */
  static async findAll(options = {}) {
    try {
      const {
        activeOnly = false,
        eventType = null,
        limit = 50,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'DESC'
      } = options;

      let query = 'SELECT * FROM pricing_events WHERE 1=1';
      const values = [];

      if (activeOnly) {
        query += ' AND is_active = true';
      }

      if (eventType) {
        query += ' AND event_type = ?';
        values.push(eventType);
      }

      query += ` ORDER BY ${orderBy} ${orderDirection}`;
      query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

      const rows = await executeQuery(query, values);

      return rows.map(row => new PricingEvent({
        ...row,
        affected_vehicle_types: Array.isArray(row.affected_vehicle_types) ? row.affected_vehicle_types : JSON.parse(row.affected_vehicle_types || '[]'),
        affected_areas: Array.isArray(row.affected_areas) ? row.affected_areas : JSON.parse(row.affected_areas || '[]')
      }));
    } catch (error) {
      logger.error('Error finding pricing events:', error);
      throw new Error(`Failed to find pricing events: ${error.message}`);
    }
  }

  /**
   * Find active pricing events for a specific date and location
   * @param {Date} date - Date to check
   * @param {Object} location - Location details
   * @param {string} vehicleTypeName - Vehicle type name
   * @returns {Promise<PricingEvent[]>}
   */
  static async findActiveEvents(date, location = null, vehicleTypeName = null) {
    try {
      const query = `
        SELECT * FROM pricing_events 
        WHERE is_active = true 
        AND start_date <= ? 
        AND end_date >= ?
      `;

      const rows = await executeQuery(query, [date, date]);

      const events = rows.map(row => new PricingEvent({
        ...row,
        affected_vehicle_types: Array.isArray(row.affected_vehicle_types) ? row.affected_vehicle_types : JSON.parse(row.affected_vehicle_types || '[]'),
        affected_areas: Array.isArray(row.affected_areas) ? row.affected_areas : JSON.parse(row.affected_areas || '[]')
      }));

      // Filter events based on vehicle type and location
      return events.filter(event => {
        // Check vehicle type applicability
        if (vehicleTypeName && event.affected_vehicle_types.length > 0) {
          if (!event.affected_vehicle_types.includes('all') && 
              !event.affected_vehicle_types.includes(vehicleTypeName)) {
            return false;
          }
        }

        // Check location applicability
        if (location && event.affected_areas.length > 0) {
          if (!event.affected_areas.includes('all')) {
            // Simple area matching - can be enhanced with geospatial queries
            const locationArea = this.getLocationArea(location);
            if (!event.affected_areas.includes(locationArea)) {
              return false;
            }
          }
        }

        return true;
      });
    } catch (error) {
      logger.error('Error finding active pricing events:', error);
      throw new Error(`Failed to find active pricing events: ${error.message}`);
    }
  }

  /**
   * Find all currently active pricing events for dashboard
   * @returns {Promise<PricingEvent[]>}
   */
  static async findActiveEventsForDashboard() {
    try {
      const currentDate = new Date();
      const query = `
        SELECT * FROM pricing_events 
        WHERE is_active = true 
        AND start_date <= ? 
        AND end_date >= ?
        ORDER BY created_at DESC
      `;

      const rows = await executeQuery(query, [currentDate, currentDate]);

      return rows.map(row => new PricingEvent({
        ...row,
        affected_vehicle_types: Array.isArray(row.affected_vehicle_types) ? row.affected_vehicle_types : JSON.parse(row.affected_vehicle_types || '[]'),
        affected_areas: Array.isArray(row.affected_areas) ? row.affected_areas : JSON.parse(row.affected_areas || '[]')
      }));
    } catch (error) {
      logger.error('Error finding active pricing events for dashboard:', error);
      throw new Error(`Failed to find active pricing events for dashboard: ${error.message}`);
    }
  }

  /**
   * Update pricing event
   * @param {string} id - Event ID
   * @param {Object} updates - Update data
   * @returns {Promise<PricingEvent>}
   */
  static async update(id, updates) {
    try {
      const event = await this.findById(id);
      if (!event) {
        throw new Error('Pricing event not found');
      }

      const allowedFields = [
        'event_name', 'event_type', 'start_date', 'end_date',
        'pricing_multiplier', 'affected_vehicle_types', 'affected_areas',
        'description', 'is_active'
      ];

      const updateFields = [];
      const values = [];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = ?`);
          if (key === 'affected_vehicle_types' || key === 'affected_areas') {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push('updated_at = ?');
      values.push(new Date());
      values.push(id);

      const query = `
        UPDATE pricing_events 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `;

      await executeQuery(query, values);

      return await this.findById(id);
    } catch (error) {
      logger.error('Error updating pricing event:', error);
      throw new Error(`Failed to update pricing event: ${error.message}`);
    }
  }

  /**
   * Delete pricing event
   * @param {string} id - Event ID
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    try {
      const result = await executeQuery(
        'DELETE FROM pricing_events WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error deleting pricing event:', error);
      throw new Error(`Failed to delete pricing event: ${error.message}`);
    }
  }

  /**
   * Get pricing event statistics
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async getStatistics(options = {}) {
    try {
      const { period = '30' } = options;
      
      const query = `
        SELECT 
          COUNT(*) as total_events,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_events,
          COUNT(CASE WHEN event_type = 'seasonal' THEN 1 END) as seasonal_events,
          COUNT(CASE WHEN event_type = 'holiday' THEN 1 END) as holiday_events,
          COUNT(CASE WHEN event_type = 'special_event' THEN 1 END) as special_events,
          COUNT(CASE WHEN event_type = 'demand_surge' THEN 1 END) as demand_events,
          AVG(pricing_multiplier) as avg_multiplier,
          MAX(pricing_multiplier) as max_multiplier,
          MIN(pricing_multiplier) as min_multiplier
        FROM pricing_events 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `;

      const rows = await executeQuery(query, [period]);
      return rows[0];
    } catch (error) {
      logger.error('Error getting pricing event statistics:', error);
      throw new Error(`Failed to get pricing event statistics: ${error.message}`);
    }
  }

  /**
   * Check if event is currently active
   * @param {Date} date - Date to check
   * @returns {boolean}
   */
  isActive(date = new Date()) {
    return this.is_active && 
           new Date(this.start_date) <= date && 
           new Date(this.end_date) >= date;
  }

  /**
   * Check if event applies to vehicle type
   * @param {string} vehicleTypeName - Vehicle type name
   * @returns {boolean}
   */
  appliesToVehicleType(vehicleTypeName) {
    return this.affected_vehicle_types.includes('all') || 
           this.affected_vehicle_types.includes(vehicleTypeName);
  }

  /**
   * Check if event applies to location
   * @param {Object} location - Location details
   * @returns {boolean}
   */
  appliesToLocation(location) {
    if (this.affected_areas.includes('all')) {
      return true;
    }

    const locationArea = PricingEvent.getLocationArea(location);
    return this.affected_areas.includes(locationArea);
  }

  /**
   * Get location area from coordinates
   * @param {Object} location - Location with latitude/longitude
   * @returns {string}
   */
  static getLocationArea(location) {
    if (!location || !location.latitude || !location.longitude) {
      return 'unknown';
    }

    // Simple area detection based on coordinates
    // This can be enhanced with more sophisticated geospatial logic
    const { latitude, longitude } = location;

    // Example area detection (simplified)
    if (latitude >= 40.7 && latitude <= 40.8 && longitude >= -74.0 && longitude <= -73.9) {
      return 'downtown';
    } else if (latitude >= 40.6 && latitude <= 40.7 && longitude >= -73.8 && longitude <= -73.7) {
      return 'airport';
    } else if (latitude >= 40.7 && latitude <= 40.8 && longitude >= -73.9 && longitude <= -73.8) {
      return 'midtown';
    }

    return 'suburban';
  }

  /**
   * Convert to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      event_name: this.event_name,
      event_type: this.event_type,
      start_date: this.start_date,
      end_date: this.end_date,
      pricing_multiplier: this.pricing_multiplier,
      affected_vehicle_types: this.affected_vehicle_types,
      affected_areas: this.affected_areas,
      description: this.description,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = PricingEvent; 