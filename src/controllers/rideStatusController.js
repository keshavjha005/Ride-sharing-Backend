const { validationResult } = require('express-validator');
const RideStatusUpdate = require('../models/RideStatusUpdate');
const RideLocationTracking = require('../models/RideLocationTracking');
const Ride = require('../models/Ride');
const logger = require('../utils/logger');

/**
 * Get ride status updates
 * GET /api/rides/:rideId/status
 */
const getRideStatusUpdates = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { rideId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Get status updates
    const statusUpdates = await RideStatusUpdate.findByRideId(rideId, parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      message: 'Ride status updates retrieved successfully',
      data: {
        rideId,
        statusUpdates,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: statusUpdates.length
        }
      }
    });

  } catch (error) {
    logger.error('Error getting ride status updates:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create ride status update
 * POST /api/rides/:rideId/status
 */
const createRideStatusUpdate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { rideId } = req.params;
    const { 
      status, 
      statusMessageAr, 
      statusMessageEn, 
      locationData, 
      estimatedArrival, 
      actualArrival 
    } = req.body;
    const { userId } = req.user;

    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user has permission to update this ride
    if (ride.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this ride'
      });
    }

    // Create status update
    const statusUpdate = await RideStatusUpdate.create({
      rideId,
      status,
      statusMessageAr,
      statusMessageEn,
      locationData,
      estimatedArrival,
      actualArrival
    });

    // Update ride status in main rides table
    await Ride.updateStatus(rideId, status, userId);

    res.status(201).json({
      success: true,
      message: 'Ride status update created successfully',
      data: statusUpdate
    });

  } catch (error) {
    logger.error('Error creating ride status update:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get ride location tracking
 * GET /api/rides/:rideId/location
 */
const getRideLocationTracking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { rideId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Get location tracking
    const locations = await RideLocationTracking.findByRideId(rideId, parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      message: 'Ride location tracking retrieved successfully',
      data: {
        rideId,
        locations,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: locations.length
        }
      }
    });

  } catch (error) {
    logger.error('Error getting ride location tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create ride location tracking entry
 * POST /api/rides/:rideId/location
 */
const createRideLocationTracking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { rideId } = req.params;
    const { 
      latitude, 
      longitude, 
      accuracy, 
      speed, 
      heading, 
      altitude 
    } = req.body;
    const { userId } = req.user;

    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user has permission to update this ride
    if (ride.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this ride'
      });
    }

    // Create location tracking entry
    const locationEntry = await RideLocationTracking.create({
      rideId,
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      altitude
    });

    res.status(201).json({
      success: true,
      message: 'Ride location tracking entry created successfully',
      data: locationEntry
    });

  } catch (error) {
    logger.error('Error creating ride location tracking entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get live tracking data for a ride
 * GET /api/rides/:rideId/tracking
 */
const getRideTracking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { rideId } = req.params;
    const { timeRange } = req.query;

    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Get latest status update
    const latestStatus = await RideStatusUpdate.getLatestByRideId(rideId);
    
    // Get latest location
    const latestLocation = await RideLocationTracking.getLatestByRideId(rideId);

    // Get location tracking based on time range
    let locations = [];
    if (timeRange) {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (parseInt(timeRange) * 60 * 1000)); // timeRange in minutes
      locations = await RideLocationTracking.findByTimeRange(rideId, startTime, endTime);
    } else {
      // Get last 10 locations
      locations = await RideLocationTracking.findByRideId(rideId, 10);
    }

    // Calculate statistics
    const statistics = await RideLocationTracking.getStatistics(rideId);

    res.json({
      success: true,
      message: 'Ride tracking data retrieved successfully',
      data: {
        rideId,
        ride: {
          id: ride.id,
          status: ride.status,
          departureDateTime: ride.departureDateTime,
          distance: ride.distance,
          estimatedTime: ride.estimatedTime
        },
        latestStatus,
        latestLocation,
        locations,
        statistics
      }
    });

  } catch (error) {
    logger.error('Error getting ride tracking data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update estimated arrival time
 * PUT /api/rides/:rideId/estimated-arrival
 */
const updateEstimatedArrival = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { rideId } = req.params;
    const { estimatedArrival } = req.body;
    const { userId } = req.user;

    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user has permission to update this ride
    if (ride.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this ride'
      });
    }

    // Update estimated arrival
    const updated = await RideStatusUpdate.updateEstimatedArrival(rideId, estimatedArrival);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'No status update found for this ride'
      });
    }

    res.json({
      success: true,
      message: 'Estimated arrival updated successfully',
      data: {
        rideId,
        estimatedArrival
      }
    });

  } catch (error) {
    logger.error('Error updating estimated arrival:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update actual arrival time
 * PUT /api/rides/:rideId/actual-arrival
 */
const updateActualArrival = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { rideId } = req.params;
    const { actualArrival } = req.body;
    const { userId } = req.user;

    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user has permission to update this ride
    if (ride.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this ride'
      });
    }

    // Update actual arrival
    const updated = await RideStatusUpdate.updateActualArrival(rideId, actualArrival);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'No status update found for this ride'
      });
    }

    res.json({
      success: true,
      message: 'Actual arrival updated successfully',
      data: {
        rideId,
        actualArrival
      }
    });

  } catch (error) {
    logger.error('Error updating actual arrival:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get ride tracking statistics
 * GET /api/rides/:rideId/tracking-statistics
 */
const getRideTrackingStatistics = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { rideId } = req.params;

    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Get status update statistics
    const statusStatistics = await RideStatusUpdate.getStatistics(rideId);
    
    // Get location tracking statistics
    const locationStatistics = await RideLocationTracking.getStatistics(rideId);

    res.json({
      success: true,
      message: 'Ride tracking statistics retrieved successfully',
      data: {
        rideId,
        statusStatistics,
        locationStatistics
      }
    });

  } catch (error) {
    logger.error('Error getting ride tracking statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Batch create location tracking entries
 * POST /api/rides/:rideId/location/batch
 */
const createBatchLocationTracking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { rideId } = req.params;
    const { locations } = req.body;
    const { userId } = req.user;

    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user has permission to update this ride
    if (ride.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this ride'
      });
    }

    // Add rideId to each location entry
    const locationsWithRideId = locations.map(location => ({
      ...location,
      rideId
    }));

    // Create batch location tracking entries
    const createdLocations = await RideLocationTracking.createMultiple(locationsWithRideId);

    res.status(201).json({
      success: true,
      message: 'Batch location tracking entries created successfully',
      data: {
        rideId,
        createdCount: createdLocations.length,
        locations: createdLocations
      }
    });

  } catch (error) {
    logger.error('Error creating batch location tracking entries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getRideStatusUpdates,
  createRideStatusUpdate,
  getRideLocationTracking,
  createRideLocationTracking,
  getRideTracking,
  updateEstimatedArrival,
  updateActualArrival,
  getRideTrackingStatistics,
  createBatchLocationTracking
}; 