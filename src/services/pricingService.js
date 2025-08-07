const VehicleType = require('../models/VehicleType');
const PricingMultiplier = require('../models/PricingMultiplier');
const PricingCalculation = require('../models/PricingCalculation');
const PricingEvent = require('../models/PricingEvent');
const PricingEventApplication = require('../models/PricingEventApplication');
const db = require('../config/database');
const logger = require('../utils/logger');

class PricingService {
  /**
   * Calculate fare for a trip based on distance and vehicle type
   * @param {Object} tripDetails - Trip details including distance, vehicle type, etc.
   * @returns {Promise<Object>} - Calculated fare details
   */
  static async calculateFare(tripDetails) {
    try {
      const {
        distance,
        vehicleTypeId,
        departureTime,
        pickupLocation,
        dropoffLocation,
        weather = null,
        tripId = null
      } = tripDetails;

      // Validate inputs
      if (!distance || distance <= 0) {
        throw new Error('Invalid distance provided');
      }

      if (!vehicleTypeId) {
        throw new Error('Vehicle type ID is required');
      }

      // Get vehicle type with pricing
      const vehicleType = await VehicleType.findById(vehicleTypeId);
      if (!vehicleType) {
        throw new Error('Vehicle type not found');
      }

      if (!vehicleType.is_active) {
        throw new Error('Vehicle type is not active');
      }

      // Calculate base fare
      const baseFare = distance * vehicleType.per_km_charges;

      // Get applicable multipliers
      const applicableMultipliers = await PricingMultiplier.getApplicableMultipliers(
        vehicleTypeId,
        {
          departureTime,
          location: pickupLocation,
          weather
        }
      );

      // Apply multipliers
      let finalFare = baseFare;
      const appliedMultipliers = [];

      for (const multiplier of applicableMultipliers) {
        finalFare *= multiplier.multiplier_value;
        appliedMultipliers.push({
          id: multiplier.id,
          multiplier_type: multiplier.multiplier_type,
          multiplier_value: multiplier.multiplier_value,
          applied_value: finalFare
        });
      }

      // Apply minimum fare constraint
      if (finalFare < vehicleType.minimum_fare) {
        finalFare = vehicleType.minimum_fare;
      }

      // Apply maximum fare constraint
      if (vehicleType.maximum_fare && finalFare > vehicleType.maximum_fare) {
        finalFare = vehicleType.maximum_fare;
      }

      // Apply event-based pricing
      const eventPricingResult = await this.applyEventPricing(
        finalFare, 
        departureTime, 
        pickupLocation, 
        vehicleType.name,
        tripId
      );

      finalFare = eventPricingResult.finalFare;

      // Round to 2 decimal places
      finalFare = Math.round(finalFare * 100) / 100;

      // Create calculation details
      const calculationDetails = {
        base_calculation: {
          distance_km: distance,
          per_km_rate: vehicleType.per_km_charges,
          base_fare: baseFare
        },
        constraints: {
          minimum_fare: vehicleType.minimum_fare,
          maximum_fare: vehicleType.maximum_fare,
          minimum_applied: finalFare === vehicleType.minimum_fare,
          maximum_applied: vehicleType.maximum_fare ? finalFare === vehicleType.maximum_fare : false
        },
        multipliers: appliedMultipliers,
        event_pricing: eventPricingResult.eventDetails,
        trip_details: {
          departure_time: departureTime,
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation,
          weather: weather
        }
      };

      // Store calculation history if trip ID is provided
      if (tripId) {
        await PricingCalculation.create({
          trip_id: tripId,
          vehicle_type_id: vehicleTypeId,
          base_distance: distance,
          base_fare: baseFare,
          applied_multipliers: appliedMultipliers,
          final_fare: finalFare,
          calculation_details: calculationDetails
        });
      }

      return {
        success: true,
        data: {
          base_fare: baseFare,
          final_fare: finalFare,
          distance_km: distance,
          vehicle_type: {
            id: vehicleType.id,
            name: vehicleType.name,
            per_km_charges: vehicleType.per_km_charges,
            minimum_fare: vehicleType.minimum_fare,
            maximum_fare: vehicleType.maximum_fare
          },
          applied_multipliers: appliedMultipliers,
          event_pricing: eventPricingResult.eventDetails,
          calculation_details: calculationDetails
        }
      };

    } catch (error) {
      logger.error('Error calculating fare:', error);
      throw error;
    }
  }

  /**
   * Get pricing statistics for a vehicle type
   * @param {string} vehicleTypeId - Vehicle type ID
   * @param {string} period - Period in days (default: 30)
   * @returns {Promise<Object>} - Pricing statistics
   */
  static async getPricingStatistics(vehicleTypeId, period = '30') {
    try {
      const vehicleType = await VehicleType.findById(vehicleTypeId);
      if (!vehicleType) {
        throw new Error('Vehicle type not found');
      }

      const statistics = await PricingCalculation.getStatistics(vehicleTypeId, period);
      const multiplierUsage = await PricingCalculation.getMultiplierUsage(vehicleTypeId, period);

      return {
        success: true,
        data: {
          vehicle_type: {
            id: vehicleType.id,
            name: vehicleType.name,
            per_km_charges: vehicleType.per_km_charges,
            minimum_fare: vehicleType.minimum_fare,
            maximum_fare: vehicleType.maximum_fare
          },
          statistics,
          multiplier_usage: multiplierUsage,
          period_days: parseInt(period)
        }
      };

    } catch (error) {
      logger.error('Error getting pricing statistics:', error);
      throw error;
    }
  }

  /**
   * Get overall pricing statistics for all vehicle types
   * @param {string} period - Period in days (default: 30)
   * @returns {Promise<Object>} - Overall pricing statistics
   */
  static async getOverallPricingStatistics(period = '30') {
    try {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const query = `
        SELECT 
          COUNT(*) as total_calculations,
          AVG(base_fare) as avg_base_fare,
          AVG(final_fare) as avg_final_fare,
          MIN(base_fare) as min_base_fare,
          MAX(base_fare) as max_base_fare,
          MIN(final_fare) as min_final_fare,
          MAX(final_fare) as max_final_fare,
          AVG(base_distance) as avg_distance,
          SUM(final_fare) as total_revenue
        FROM pricing_calculations 
        WHERE created_at >= ?
      `;
      
      const rows = await db.executeQuery(query, [startDate]);
      
      if (rows.length === 0) {
        return {
          total_calculations: 0,
          avg_base_fare: 0,
          avg_final_fare: 0,
          min_base_fare: 0,
          max_base_fare: 0,
          min_final_fare: 0,
          max_final_fare: 0,
          avg_distance: 0,
          total_revenue: 0
        };
      }
      
      return rows[0];
    } catch (error) {
      logger.error('Error getting overall pricing statistics:', error);
      throw error;
    }
  }

  /**
   * Get all vehicle types with pricing information
   * @param {boolean} activeOnly - Return only active vehicle types
   * @returns {Promise<Object>} - Vehicle types with pricing
   */
  static async getVehicleTypesWithPricing(activeOnly = true) {
    try {
      const vehicleTypes = await VehicleType.findWithPricing(activeOnly);

      return {
        success: true,
        data: vehicleTypes.map(type => ({
          id: type.id,
          name: type.name,
          description: type.description,
          per_km_charges: type.per_km_charges,
          minimum_fare: type.minimum_fare,
          maximum_fare: type.maximum_fare,
          is_active: type.is_active,
          multiplier_count: type.multiplier_count || 0,
          created_at: type.created_at,
          updated_at: type.updated_at
        }))
      };

    } catch (error) {
      logger.error('Error getting vehicle types with pricing:', error);
      throw error;
    }
  }

  /**
   * Get vehicle type with detailed pricing information
   * @param {string} vehicleTypeId - Vehicle type ID
   * @returns {Promise<Object>} - Vehicle type with detailed pricing
   */
  static async getVehicleTypeWithPricing(vehicleTypeId) {
    try {
      const vehicleType = await VehicleType.findByIdWithPricing(vehicleTypeId);
      if (!vehicleType) {
        throw new Error('Vehicle type not found');
      }

      return {
        success: true,
        data: {
          id: vehicleType.id,
          name: vehicleType.name,
          description: vehicleType.description,
          per_km_charges: vehicleType.per_km_charges,
          minimum_fare: vehicleType.minimum_fare,
          maximum_fare: vehicleType.maximum_fare,
          is_active: vehicleType.is_active,
          multipliers: vehicleType.multipliers || [],
          created_at: vehicleType.created_at,
          updated_at: vehicleType.updated_at
        }
      };

    } catch (error) {
      logger.error('Error getting vehicle type with pricing:', error);
      throw error;
    }
  }

  /**
   * Update vehicle type pricing
   * @param {string} vehicleTypeId - Vehicle type ID
   * @param {Object} pricingData - New pricing data
   * @returns {Promise<Object>} - Updated vehicle type
   */
  static async updateVehicleTypePricing(vehicleTypeId, pricingData) {
    try {
      const vehicleType = await VehicleType.findById(vehicleTypeId);
      if (!vehicleType) {
        throw new Error('Vehicle type not found');
      }

      // Update pricing fields
      if (pricingData.per_km_charges !== undefined) {
        vehicleType.per_km_charges = pricingData.per_km_charges;
      }
      if (pricingData.minimum_fare !== undefined) {
        vehicleType.minimum_fare = pricingData.minimum_fare;
      }
      if (pricingData.maximum_fare !== undefined) {
        vehicleType.maximum_fare = pricingData.maximum_fare;
      }

      await vehicleType.save();

      return {
        success: true,
        data: {
          id: vehicleType.id,
          name: vehicleType.name,
          description: vehicleType.description,
          per_km_charges: vehicleType.per_km_charges,
          minimum_fare: vehicleType.minimum_fare,
          maximum_fare: vehicleType.maximum_fare,
          is_active: vehicleType.is_active,
          updated_at: vehicleType.updated_at
        }
      };

    } catch (error) {
      logger.error('Error updating vehicle type pricing:', error);
      throw error;
    }
  }

  /**
   * Get pricing calculation history
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Pricing calculation history
   */
  static async getPricingHistory(options = {}) {
    try {
      const {
        vehicleTypeId,
        tripId,
        page = 1,
        limit = 20,
        startDate,
        endDate
      } = options;

      let calculations = [];

      if (tripId) {
        calculations = await PricingCalculation.findByTripId(tripId);
      } else if (vehicleTypeId) {
        calculations = await PricingCalculation.findByVehicleTypeId(vehicleTypeId, {
          page,
          limit,
          startDate,
          endDate
        });
      } else {
        throw new Error('Either vehicleTypeId or tripId must be provided');
      }

      return {
        success: true,
        data: calculations.map(calc => calc.toJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: calculations.length
        }
      };

    } catch (error) {
      logger.error('Error getting pricing history:', error);
      throw error;
    }
  }

  /**
   * Get recent pricing calculations for dashboard
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Recent pricing calculations
   */
  static async getRecentPricingCalculations(options = {}) {
    try {
      const { limit = 10 } = options;
      
      // Ensure limit is a valid number
      const limitValue = Math.max(1, Math.min(1000, parseInt(limit) || 10));
      
      // Debug logging
      logger.info('Pricing calculations query params:', { limit, limitValue, type: typeof limitValue });
      
      const query = `
        SELECT 
          pc.*,
          vt.name as vehicle_type_name
        FROM pricing_calculations pc
        LEFT JOIN vehicle_types vt ON pc.vehicle_type_id = vt.id
        ORDER BY pc.created_at DESC
        LIMIT ${limitValue}
      `;
      
      const rows = await db.executeQuery(query, []);
      
      return {
        success: true,
        data: rows.map(row => ({
          id: row.id,
          trip_id: row.trip_id,
          vehicle_type_id: row.vehicle_type_id,
          vehicle_type_name: row.vehicle_type_name,
          base_distance: row.base_distance,
          base_fare: row.base_fare,
          final_fare: row.final_fare,
          applied_multipliers: row.applied_multipliers ? JSON.parse(row.applied_multipliers) : [],
          calculation_details: row.calculation_details ? JSON.parse(row.calculation_details) : {},
          created_at: row.created_at
        })),
        pagination: {
          limit: limitValue,
          total: rows.length
        }
      };

    } catch (error) {
      logger.error('Error getting recent pricing calculations:', error);
      throw error;
    }
  }

  /**
   * Apply event-based pricing to fare
   * @param {number} baseFare - Base fare before event pricing
   * @param {Date} departureTime - Trip departure time
   * @param {Object} location - Trip location
   * @param {string} vehicleTypeName - Vehicle type name
   * @param {string} tripId - Trip ID for tracking
   * @returns {Promise<Object>} - Event pricing result
   */
  static async applyEventPricing(baseFare, departureTime, location, vehicleTypeName, tripId = null) {
    try {
      const activeEvents = await PricingEvent.findActiveEvents(
        departureTime, 
        location, 
        vehicleTypeName
      );

      let finalFare = baseFare;
      const appliedEvents = [];
      const eventApplications = [];

      for (const event of activeEvents) {
        if (event.appliesToVehicleType(vehicleTypeName) && event.appliesToLocation(location)) {
          const originalFare = finalFare;
          finalFare *= event.pricing_multiplier;
          
          appliedEvents.push({
            id: event.id,
            event_name: event.event_name,
            event_type: event.event_type,
            pricing_multiplier: event.pricing_multiplier,
            original_fare: originalFare,
            adjusted_fare: finalFare,
            fare_increase: finalFare - originalFare
          });

          // Track event application if trip ID is provided
          if (tripId) {
            try {
              await PricingEventApplication.create({
                trip_id: tripId,
                pricing_event_id: event.id,
                original_fare: originalFare,
                adjusted_fare: finalFare,
                multiplier_applied: event.pricing_multiplier
              });
            } catch (error) {
              logger.error('Error tracking event application:', error);
              // Don't fail the pricing calculation if tracking fails
            }
          }
        }
      }

      return {
        finalFare: Math.round(finalFare * 100) / 100,
        eventDetails: {
          applied_events: appliedEvents,
          total_events_applied: appliedEvents.length,
          total_fare_increase: finalFare - baseFare
        }
      };

    } catch (error) {
      logger.error('Error applying event pricing:', error);
      // Return original fare if event pricing fails
      return {
        finalFare: baseFare,
        eventDetails: {
          applied_events: [],
          total_events_applied: 0,
          total_fare_increase: 0,
          error: error.message
        }
      };
    }
  }

  /**
   * Get all pricing events with optional filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Pricing events
   */
  static async getPricingEvents(options = {}) {
    try {
      const events = await PricingEvent.findAll(options);

      return {
        success: true,
        data: events.map(event => event.toJSON()),
        pagination: {
          total: events.length,
          limit: options.limit || 50,
          offset: options.offset || 0
        }
      };

    } catch (error) {
      logger.error('Error getting pricing events:', error);
      throw error;
    }
  }

  /**
   * Get pricing event by ID
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} - Pricing event
   */
  static async getPricingEvent(eventId) {
    try {
      const event = await PricingEvent.findById(eventId);
      if (!event) {
        throw new Error('Pricing event not found');
      }

      return {
        success: true,
        data: event.toJSON()
      };

    } catch (error) {
      logger.error('Error getting pricing event:', error);
      throw error;
    }
  }

  /**
   * Create new pricing event
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} - Created event
   */
  static async createPricingEvent(eventData) {
    try {
      const event = await PricingEvent.create(eventData);

      return {
        success: true,
        data: event.toJSON()
      };

    } catch (error) {
      logger.error('Error creating pricing event:', error);
      throw error;
    }
  }

  /**
   * Update pricing event
   * @param {string} eventId - Event ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} - Updated event
   */
  static async updatePricingEvent(eventId, updates) {
    try {
      const event = await PricingEvent.update(eventId, updates);

      return {
        success: true,
        data: event.toJSON()
      };

    } catch (error) {
      logger.error('Error updating pricing event:', error);
      throw error;
    }
  }

  /**
   * Delete pricing event
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} - Deletion result
   */
  static async deletePricingEvent(eventId) {
    try {
      const deleted = await PricingEvent.delete(eventId);

      return {
        success: true,
        data: { deleted }
      };

    } catch (error) {
      logger.error('Error deleting pricing event:', error);
      throw error;
    }
  }

  /**
   * Get active pricing events
   * @param {Date} date - Date to check
   * @param {Object} location - Location details
   * @param {string} vehicleTypeName - Vehicle type name
   * @returns {Promise<Object>} - Active events
   */
  static async getActivePricingEvents(date = new Date(), location = null, vehicleTypeName = null) {
    try {
      const events = await PricingEvent.findActiveEvents(date, location, vehicleTypeName);

      return {
        success: true,
        data: events.map(event => event.toJSON())
      };

    } catch (error) {
      logger.error('Error getting active pricing events:', error);
      throw error;
    }
  }

  /**
   * Get pricing event analytics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Event analytics
   */
  static async getPricingEventAnalytics(options = {}) {
    try {
      const eventStats = await PricingEvent.getStatistics(options);
      const applicationStats = await PricingEventApplication.getStatistics(options);

      return {
        success: true,
        data: {
          event_statistics: eventStats,
          application_statistics: applicationStats,
          period_days: options.period || 30
        }
      };

    } catch (error) {
      logger.error('Error getting pricing event analytics:', error);
      throw error;
    }
  }

  /**
   * Get pricing event applications
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Event applications
   */
  static async getPricingEventApplications(options = {}) {
    try {
      const applications = await PricingEventApplication.findWithEventDetails(options);

      return {
        success: true,
        data: applications,
        pagination: {
          total: applications.length,
          limit: options.limit || 50,
          offset: options.offset || 0
        }
      };

    } catch (error) {
      logger.error('Error getting pricing event applications:', error);
      throw error;
    }
  }

  /**
   * Get multiplier usage analytics for a specific vehicle type
   * @param {string} vehicleTypeId - Vehicle type ID
   * @param {string} period - Period in days (default: 30)
   * @returns {Promise<Object>} - Multiplier usage analytics
   */
  static async getMultiplierUsageAnalytics(vehicleTypeId, period = '30') {
    try {
      const vehicleType = await VehicleType.findById(vehicleTypeId);
      if (!vehicleType) {
        throw new Error('Vehicle type not found');
      }

      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const query = `
        SELECT 
          JSON_EXTRACT(applied_multipliers, '$[*].multiplier_type') as multiplier_types,
          COUNT(*) as usage_count,
          AVG(JSON_EXTRACT(applied_multipliers, '$[*].multiplier_value')) as avg_multiplier_value
        FROM pricing_calculations 
        WHERE vehicle_type_id = ? AND created_at >= ? AND applied_multipliers IS NOT NULL
        GROUP BY multiplier_types
        ORDER BY usage_count DESC
      `;
      
      const rows = await db.executeQuery(query, [vehicleTypeId, startDate]);
      
      return {
        success: true,
        data: {
          vehicle_type: {
            id: vehicleType.id,
            name: vehicleType.name
          },
          multiplier_usage: rows,
          total_applications: rows.reduce((sum, row) => sum + row.usage_count, 0),
          period_days: days
        }
      };
    } catch (error) {
      logger.error('Error getting multiplier usage analytics:', error);
      throw error;
    }
  }

  /**
   * Get overall multiplier usage analytics
   * @param {string} period - Period in days (default: 30)
   * @returns {Promise<Object>} - Overall multiplier usage analytics
   */
  static async getOverallMultiplierUsageAnalytics(period = '30') {
    try {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const query = `
        SELECT 
          JSON_EXTRACT(applied_multipliers, '$[*].multiplier_type') as multiplier_types,
          COUNT(*) as usage_count,
          AVG(JSON_EXTRACT(applied_multipliers, '$[*].multiplier_value')) as avg_multiplier_value
        FROM pricing_calculations 
        WHERE created_at >= ? AND applied_multipliers IS NOT NULL
        GROUP BY multiplier_types
        ORDER BY usage_count DESC
      `;
      
      const rows = await db.executeQuery(query, [startDate]);
      
      return {
        success: true,
        data: {
          multiplier_usage: rows,
          total_applications: rows.reduce((sum, row) => sum + row.usage_count, 0),
          period_days: days
        }
      };
    } catch (error) {
      logger.error('Error getting overall multiplier usage analytics:', error);
      throw error;
    }
  }

  /**
   * Get revenue analytics
   * @param {string} period - Period in days (default: 30)
   * @returns {Promise<Object>} - Revenue analytics
   */
  static async getRevenueAnalytics(period = '30') {
    try {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const query = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_calculations,
          SUM(final_fare) as daily_revenue,
          AVG(final_fare) as avg_fare
        FROM pricing_calculations 
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      
      const rows = await db.executeQuery(query, [startDate]);
      
      const totalRevenue = rows.reduce((sum, row) => sum + parseFloat(row.daily_revenue || 0), 0);
      const totalCalculations = rows.reduce((sum, row) => sum + row.total_calculations, 0);
      
      return {
        success: true,
        data: {
          daily_revenue: rows,
          total_revenue: totalRevenue,
          total_calculations: totalCalculations,
          avg_fare: totalCalculations > 0 ? totalRevenue / totalCalculations : 0,
          period_days: days
        }
      };
    } catch (error) {
      logger.error('Error getting revenue analytics:', error);
      throw error;
    }
  }
}

module.exports = PricingService; 