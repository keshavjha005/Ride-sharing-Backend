const { validationResult } = require('express-validator');
const PricingService = require('../services/pricingService');
const PricingMultiplier = require('../models/PricingMultiplier');
const logger = require('../utils/logger');

/**
 * Calculate fare for a trip
 * POST /api/pricing/calculate
 */
const calculateFare = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      distance,
      vehicleTypeId,
      departureTime,
      pickupLocation,
      dropoffLocation,
      weather,
      tripId
    } = req.body;

    const result = await PricingService.calculateFare({
      distance,
      vehicleTypeId,
      departureTime,
      pickupLocation,
      dropoffLocation,
      weather,
      tripId
    });

    res.json(result);

  } catch (error) {
    logger.error('Error calculating fare:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate fare',
      error: error.message
    });
  }
};

/**
 * Get vehicle types with pricing information
 * GET /api/pricing/vehicle-types
 */
const getVehicleTypesWithPricing = async (req, res) => {
  try {
    const { activeOnly = 'true' } = req.query;
    const result = await PricingService.getVehicleTypesWithPricing(activeOnly === 'true');

    res.json(result);

  } catch (error) {
    logger.error('Error getting vehicle types with pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vehicle types with pricing',
      error: error.message
    });
  }
};

/**
 * Get vehicle type with detailed pricing information
 * GET /api/pricing/vehicle-types/:id
 */
const getVehicleTypeWithPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PricingService.getVehicleTypeWithPricing(id);

    res.json(result);

  } catch (error) {
    logger.error('Error getting vehicle type with pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vehicle type with pricing',
      error: error.message
    });
  }
};

/**
 * Update vehicle type pricing
 * PUT /api/pricing/vehicle-types/:id
 */
const updateVehicleTypePricing = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { per_km_charges, minimum_fare, maximum_fare } = req.body;

    const result = await PricingService.updateVehicleTypePricing(id, {
      per_km_charges,
      minimum_fare,
      maximum_fare
    });

    res.json(result);

  } catch (error) {
    logger.error('Error updating vehicle type pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle type pricing',
      error: error.message
    });
  }
};

/**
 * Get pricing multipliers for a vehicle type
 * GET /api/pricing/multipliers
 */
const getPricingMultipliers = async (req, res) => {
  try {
    const { vehicleTypeId, multiplierType, activeOnly = 'true' } = req.query;

    let multipliers = [];

    if (vehicleTypeId && multiplierType) {
      multipliers = await PricingMultiplier.findByType(vehicleTypeId, multiplierType, activeOnly === 'true');
    } else if (vehicleTypeId) {
      multipliers = await PricingMultiplier.findByVehicleTypeId(vehicleTypeId, activeOnly === 'true');
    } else {
      multipliers = await PricingMultiplier.findAll(activeOnly === 'true');
    }

    res.json({
      success: true,
      data: multipliers,
      message: 'Pricing multipliers retrieved successfully'
    });

  } catch (error) {
    logger.error('Error getting pricing multipliers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing multipliers',
      error: error.message
    });
  }
};

/**
 * Create pricing multiplier
 * POST /api/pricing/multipliers
 */
const createPricingMultiplier = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { vehicle_type_id, multiplier_type, multiplier_value } = req.body;

    const multiplier = await PricingMultiplier.create({
      vehicle_type_id,
      multiplier_type,
      multiplier_value
    });

    res.status(201).json({
      success: true,
      data: multiplier,
      message: 'Pricing multiplier created successfully'
    });

  } catch (error) {
    logger.error('Error creating pricing multiplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pricing multiplier',
      error: error.message
    });
  }
};

/**
 * Update pricing multiplier
 * PUT /api/pricing/multipliers/:id
 */
const updatePricingMultiplier = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { multiplier_type, multiplier_value, is_active } = req.body;

    const multiplier = await PricingMultiplier.findById(id);
    if (!multiplier) {
      return res.status(404).json({
        success: false,
        message: 'Pricing multiplier not found'
      });
    }

    if (multiplier_type !== undefined) multiplier.multiplier_type = multiplier_type;
    if (multiplier_value !== undefined) multiplier.multiplier_value = multiplier_value;
    if (is_active !== undefined) multiplier.is_active = is_active;

    await multiplier.save();

    res.json({
      success: true,
      data: multiplier,
      message: 'Pricing multiplier updated successfully'
    });

  } catch (error) {
    logger.error('Error updating pricing multiplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pricing multiplier',
      error: error.message
    });
  }
};

/**
 * Delete pricing multiplier
 * DELETE /api/pricing/multipliers/:id
 */
const deletePricingMultiplier = async (req, res) => {
  try {
    const { id } = req.params;

    const multiplier = await PricingMultiplier.findById(id);
    if (!multiplier) {
      return res.status(404).json({
        success: false,
        message: 'Pricing multiplier not found'
      });
    }

    await multiplier.delete();

    res.json({
      success: true,
      message: 'Pricing multiplier deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting pricing multiplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pricing multiplier',
      error: error.message
    });
  }
};

/**
 * Get pricing statistics
 * GET /api/pricing/statistics/:vehicleTypeId
 */
const getPricingStatistics = async (req, res) => {
  try {
    const { vehicleTypeId } = req.params;
    const { period = '30' } = req.query;

    const result = await PricingService.getPricingStatistics(vehicleTypeId, period);

    res.json(result);

  } catch (error) {
    logger.error('Error getting pricing statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing statistics',
      error: error.message
    });
  }
};

/**
 * Get pricing calculation history
 * GET /api/pricing/history
 */
const getPricingHistory = async (req, res) => {
  try {
    const { vehicleTypeId, tripId, page, limit, startDate, endDate } = req.query;

    const result = await PricingService.getPricingHistory({
      vehicleTypeId,
      tripId,
      page,
      limit,
      startDate,
      endDate
    });

    res.json(result);

  } catch (error) {
    logger.error('Error getting pricing history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing history',
      error: error.message
    });
  }
};

/**
 * Get all pricing events
 * GET /api/pricing/events
 */
const getPricingEvents = async (req, res) => {
  try {
    const { 
      activeOnly, 
      eventType, 
      limit, 
      offset, 
      orderBy, 
      orderDirection 
    } = req.query;

    const result = await PricingService.getPricingEvents({
      activeOnly: activeOnly === 'true',
      eventType,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      orderBy,
      orderDirection
    });

    res.json(result);

  } catch (error) {
    logger.error('Error getting pricing events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing events',
      error: error.message
    });
  }
};

/**
 * Get pricing event by ID
 * GET /api/pricing/events/:id
 */
const getPricingEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PricingService.getPricingEvent(id);

    res.json(result);

  } catch (error) {
    logger.error('Error getting pricing event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing event',
      error: error.message
    });
  }
};

/**
 * Create new pricing event
 * POST /api/pricing/events
 */
const createPricingEvent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      event_name,
      event_type,
      start_date,
      end_date,
      pricing_multiplier,
      affected_vehicle_types,
      affected_areas,
      description,
      is_active
    } = req.body;

    const result = await PricingService.createPricingEvent({
      event_name,
      event_type,
      start_date,
      end_date,
      pricing_multiplier,
      affected_vehicle_types,
      affected_areas,
      description,
      is_active
    });

    res.status(201).json(result);

  } catch (error) {
    logger.error('Error creating pricing event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pricing event',
      error: error.message
    });
  }
};

/**
 * Update pricing event
 * PUT /api/pricing/events/:id
 */
const updatePricingEvent = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updates = req.body;

    const result = await PricingService.updatePricingEvent(id, updates);

    res.json(result);

  } catch (error) {
    logger.error('Error updating pricing event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pricing event',
      error: error.message
    });
  }
};

/**
 * Delete pricing event
 * DELETE /api/pricing/events/:id
 */
const deletePricingEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PricingService.deletePricingEvent(id);

    res.json(result);

  } catch (error) {
    logger.error('Error deleting pricing event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pricing event',
      error: error.message
    });
  }
};

/**
 * Get active pricing events
 * GET /api/pricing/events/active
 */
const getActivePricingEvents = async (req, res) => {
  try {
    const { date, location, vehicleTypeName } = req.query;

    const result = await PricingService.getActivePricingEvents(
      date ? new Date(date) : new Date(),
      location ? JSON.parse(location) : null,
      vehicleTypeName
    );

    res.json(result);

  } catch (error) {
    logger.error('Error getting active pricing events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active pricing events',
      error: error.message
    });
  }
};

/**
 * Get pricing event analytics
 * GET /api/pricing/events/analytics
 */
const getPricingEventAnalytics = async (req, res) => {
  try {
    const { period, eventId } = req.query;

    const result = await PricingService.getPricingEventAnalytics({
      period: parseInt(period) || 30,
      eventId
    });

    res.json(result);

  } catch (error) {
    logger.error('Error getting pricing event analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing event analytics',
      error: error.message
    });
  }
};

/**
 * Get pricing event applications
 * GET /api/pricing/events/applications
 */
const getPricingEventApplications = async (req, res) => {
  try {
    const { 
      tripId, 
      eventId, 
      limit, 
      offset, 
      startDate, 
      endDate 
    } = req.query;

    const result = await PricingService.getPricingEventApplications({
      tripId,
      eventId,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      startDate,
      endDate
    });

    res.json(result);

  } catch (error) {
    logger.error('Error getting pricing event applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing event applications',
      error: error.message
    });
  }
};

module.exports = {
  calculateFare,
  getVehicleTypesWithPricing,
  getVehicleTypeWithPricing,
  updateVehicleTypePricing,
  getPricingMultipliers,
  createPricingMultiplier,
  updatePricingMultiplier,
  deletePricingMultiplier,
  getPricingStatistics,
  getPricingHistory,
  getPricingEvents,
  getPricingEvent,
  createPricingEvent,
  updatePricingEvent,
  deletePricingEvent,
  getActivePricingEvents,
  getPricingEventAnalytics,
  getPricingEventApplications
}; 