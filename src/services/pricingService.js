const VehicleType = require('../models/VehicleType');
const PricingMultiplier = require('../models/PricingMultiplier');
const PricingCalculation = require('../models/PricingCalculation');
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
}

module.exports = PricingService; 