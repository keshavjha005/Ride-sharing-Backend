const { validationResult } = require('express-validator');
const Ride = require('../models/Ride');
const RideLocation = require('../models/RideLocation');
const RideTravelPreferences = require('../models/RideTravelPreferences');
const UserVehicle = require('../models/UserVehicle');
const locationService = require('../services/locationService');
const logger = require('../utils/logger');

/**
 * Create a new ride
 * POST /api/rides
 */
const createRide = async (req, res) => {
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
      vehicleInformationId,
      totalSeats,
      pricePerSeat,
      luggageAllowed = true,
      womenOnly = false,
      driverVerified = false,
      twoPassengerMaxBack = false,
      departureDateTime,
      pickupLocation,
      dropLocation,
      stopOvers = [],
      travelPreferences
    } = req.body;

    const userId = req.user.id;

    // Validate vehicle information belongs to user
    const vehicleInfo = await UserVehicle.findById(vehicleInformationId);
    if (!vehicleInfo || vehicleInfo.user_id !== userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle information or not authorized'
      });
    }

    // Validate departure date is in the future
    const departureDate = new Date(departureDateTime);
    if (departureDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Departure date must be in the future'
      });
    }

    // Calculate distance and estimated time using location service
    let distance = null;
    let estimatedTime = null;

    try {
      const origin = `${pickupLocation.latitude},${pickupLocation.longitude}`;
      const destination = `${dropLocation.latitude},${dropLocation.longitude}`;
      
      const distanceData = await locationService.calculateDistance(origin, destination, 'driving');
      distance = distanceData.distance.value / 1000; // Convert to kilometers
      estimatedTime = distanceData.duration.value / 60; // Convert to minutes
    } catch (error) {
      logger.warn('Could not calculate distance/time, using default values:', error.message);
      // Use default values if location service fails
      distance = 0;
      estimatedTime = 0;
    }

    // Create ride
    const rideData = {
      createdBy: userId,
      vehicleInformationId,
      totalSeats,
      pricePerSeat,
      distance,
      estimatedTime,
      luggageAllowed,
      womenOnly,
      driverVerified,
      twoPassengerMaxBack,
      departureDateTime: departureDate
    };

    const ride = await Ride.create(rideData);

    // Create ride locations
    const locationsData = [];

    // Add pickup location
    locationsData.push({
      rideId: ride.id,
      locationType: 'pickup',
      address: pickupLocation.address,
      latitude: pickupLocation.latitude,
      longitude: pickupLocation.longitude,
      sequenceOrder: 0
    });

    // Add stopover locations
    stopOvers.forEach((stopover, index) => {
      locationsData.push({
        rideId: ride.id,
        locationType: 'stopover',
        address: stopover.address,
        latitude: stopover.latitude,
        longitude: stopover.longitude,
        sequenceOrder: stopover.sequenceOrder || index + 1
      });
    });

    // Add drop location
    locationsData.push({
      rideId: ride.id,
      locationType: 'drop',
      address: dropLocation.address,
      latitude: dropLocation.latitude,
      longitude: dropLocation.longitude,
      sequenceOrder: stopOvers.length + 1
    });

    await RideLocation.createMultiple(locationsData);

    // Create travel preferences if provided
    if (travelPreferences) {
      const preferencesErrors = RideTravelPreferences.validatePreferencesData(travelPreferences);
      if (preferencesErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid travel preferences',
          errors: preferencesErrors
        });
      }

      await RideTravelPreferences.create({
        rideId: ride.id,
        ...travelPreferences
      });
    }

    // Get complete ride data
    const completeRide = await Ride.findById(ride.id);

    res.status(201).json({
      success: true,
      message: 'Ride created successfully',
      data: completeRide
    });

  } catch (error) {
    logger.error('Error creating ride:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get ride details by ID
 * GET /api/rides/:id
 */
const getRideById = async (req, res) => {
  try {
    const { id } = req.params;

    const ride = await Ride.findById(id);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    res.json({
      success: true,
      message: 'Ride details retrieved successfully',
      data: ride
    });

  } catch (error) {
    logger.error('Error getting ride by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update ride
 * PUT /api/rides/:id
 */
const updateRide = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Check if user can modify the ride
    const canModify = await Ride.canModify(id, userId);
    if (!canModify.canModify) {
      return res.status(403).json({
        success: false,
        message: canModify.reason
      });
    }

    // Validate departure date if provided
    if (updateData.departureDateTime) {
      const departureDate = new Date(updateData.departureDateTime);
      if (departureDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Departure date must be in the future'
        });
      }
    }

    // Update ride
    await Ride.update(id, updateData);

    // Update locations if provided
    if (updateData.pickupLocation || updateData.dropLocation || updateData.stopOvers) {
      // Delete existing locations
      await RideLocation.deleteByRideId(id);

      // Create new locations
      const locationsData = [];

      if (updateData.pickupLocation) {
        locationsData.push({
          rideId: id,
          locationType: 'pickup',
          address: updateData.pickupLocation.address,
          latitude: updateData.pickupLocation.latitude,
          longitude: updateData.pickupLocation.longitude,
          sequenceOrder: 0
        });
      }

      if (updateData.stopOvers) {
        updateData.stopOvers.forEach((stopover, index) => {
          locationsData.push({
            rideId: id,
            locationType: 'stopover',
            address: stopover.address,
            latitude: stopover.latitude,
            longitude: stopover.longitude,
            sequenceOrder: stopover.sequenceOrder || index + 1
          });
        });
      }

      if (updateData.dropLocation) {
        locationsData.push({
          rideId: id,
          locationType: 'drop',
          address: updateData.dropLocation.address,
          latitude: updateData.dropLocation.latitude,
          longitude: updateData.dropLocation.longitude,
          sequenceOrder: (updateData.stopOvers?.length || 0) + 1
        });
      }

      if (locationsData.length > 0) {
        await RideLocation.createMultiple(locationsData);
      }
    }

    // Update travel preferences if provided
    if (updateData.travelPreferences) {
      const preferencesErrors = RideTravelPreferences.validatePreferencesData(updateData.travelPreferences);
      if (preferencesErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid travel preferences',
          errors: preferencesErrors
        });
      }

      await RideTravelPreferences.createOrUpdate(id, updateData.travelPreferences);
    }

    // Get updated ride data
    const updatedRide = await Ride.findById(id);

    res.json({
      success: true,
      message: 'Ride updated successfully',
      data: updatedRide
    });

  } catch (error) {
    logger.error('Error updating ride:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete ride (cancel)
 * DELETE /api/rides/:id
 */
const deleteRide = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user can modify the ride
    const canModify = await Ride.canModify(id, userId);
    if (!canModify.canModify) {
      return res.status(403).json({
        success: false,
        message: canModify.reason
      });
    }

    await Ride.delete(id);

    res.json({
      success: true,
      message: 'Ride cancelled successfully'
    });

  } catch (error) {
    logger.error('Error deleting ride:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Publish ride
 * POST /api/rides/:id/publish
 */
const publishRide = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user can modify the ride
    const canModify = await Ride.canModify(id, userId);
    if (!canModify.canModify) {
      return res.status(403).json({
        success: false,
        message: canModify.reason
      });
    }

    await Ride.publish(id);

    res.json({
      success: true,
      message: 'Ride published successfully'
    });

  } catch (error) {
    logger.error('Error publishing ride:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Unpublish ride
 * POST /api/rides/:id/unpublish
 */
const unpublishRide = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user can modify the ride
    const canModify = await Ride.canModify(id, userId);
    if (!canModify.canModify) {
      return res.status(403).json({
        success: false,
        message: canModify.reason
      });
    }

    await Ride.unpublish(id);

    res.json({
      success: true,
      message: 'Ride unpublished successfully'
    });

  } catch (error) {
    logger.error('Error unpublishing ride:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get user's rides
 * GET /api/rides/my-rides
 */
const getMyRides = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    const rides = await Ride.findByUserId(userId, status, parseInt(limit), offset);

    res.json({
      success: true,
      message: 'User rides retrieved successfully',
      data: {
        rides,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: rides.length
        }
      }
    });

  } catch (error) {
    logger.error('Error getting user rides:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get available seats for a ride
 * GET /api/rides/:id/available-seats
 */
const getAvailableSeats = async (req, res) => {
  try {
    const { id } = req.params;

    const availableSeats = await Ride.getAvailableSeats(id);

    res.json({
      success: true,
      message: 'Available seats retrieved successfully',
      data: {
        rideId: id,
        availableSeats
      }
    });

  } catch (error) {
    logger.error('Error getting available seats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Search rides with advanced filtering
 * GET /api/rides/search
 */
const searchRides = async (req, res) => {
  try {
    const {
      pickupLocation,
      dropLocation,
      departureDate,
      passengers = 1,
      maxPrice,
      womenOnly,
      driverVerified,
      sortBy = 'departure_time',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = req.query;

    // Validate sort parameters
    const validSortFields = ['price', 'departure_time', 'distance', 'created_at'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort field. Valid options: price, departure_time, distance, created_at'
      });
    }

    if (!validSortOrders.includes(sortOrder)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort order. Valid options: asc, desc'
      });
    }

    // Build search criteria
    const searchCriteria = {
      status: 'published', // Only search published rides
      passengers: parseInt(passengers),
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      womenOnly: womenOnly === 'true',
      driverVerified: driverVerified === 'true',
      departureDate: departureDate ? new Date(departureDate) : null,
      pickupLocation,
      dropLocation,
      sortBy,
      sortOrder,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    // Perform search
    const searchResults = await Ride.search(searchCriteria);

    // Save search to history if user is authenticated
    if (req.user && (pickupLocation || dropLocation)) {
      try {
        await saveSearchHistoryHelper(req.user.id, pickupLocation, dropLocation);
      } catch (error) {
        logger.warn('Failed to save search history:', error.message);
      }
    }

    res.json({
      success: true,
      message: 'Rides found successfully',
      data: {
        rides: searchResults.rides,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: searchResults.total,
          totalPages: Math.ceil(searchResults.total / parseInt(limit))
        },
        filters: {
          pickupLocation,
          dropLocation,
          departureDate,
          passengers: parseInt(passengers),
          maxPrice: maxPrice ? parseFloat(maxPrice) : null,
          womenOnly: womenOnly === 'true',
          driverVerified: driverVerified === 'true'
        }
      }
    });

  } catch (error) {
    logger.error('Error searching rides:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Filter rides with specific criteria
 * GET /api/rides/filter
 */
const filterRides = async (req, res) => {
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
    } = req.query;

    // Validate sort parameters
    const validSortFields = ['price', 'departure_time', 'distance', 'created_at'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort field. Valid options: price, departure_time, distance, created_at'
      });
    }

    if (!validSortOrders.includes(sortOrder)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort order. Valid options: asc, desc'
      });
    }

    // Build filter criteria
    const filterCriteria = {
      status: status ? status.split(',') : null,
      priceMin: priceMin ? parseFloat(priceMin) : null,
      priceMax: priceMax ? parseFloat(priceMax) : null,
      distanceMin: distanceMin ? parseFloat(distanceMin) : null,
      distanceMax: distanceMax ? parseFloat(distanceMax) : null,
      dateFrom: dateFrom ? new Date(dateFrom) : null,
      dateTo: dateTo ? new Date(dateTo) : null,
      vehicleType,
      vehicleBrand,
      sortBy,
      sortOrder,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    // Perform filtering
    const filterResults = await Ride.filter(filterCriteria);

    res.json({
      success: true,
      message: 'Rides filtered successfully',
      data: {
        rides: filterResults.rides,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filterResults.total,
          totalPages: Math.ceil(filterResults.total / parseInt(limit))
        },
        filters: filterCriteria
      }
    });

  } catch (error) {
    logger.error('Error filtering rides:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get search history for authenticated user
 * GET /api/search/history
 */
const getSearchHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;
    const history = await Ride.getSearchHistory(userId, parseInt(limit), offset);

    res.json({
      success: true,
      message: 'Search history retrieved successfully',
      data: {
        history: history.searches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: history.total
        }
      }
    });

  } catch (error) {
    logger.error('Error getting search history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Save search to history
 * POST /api/search/history
 */
const saveSearchHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { pickupLocation, dropLocation } = req.body;

    if (!pickupLocation && !dropLocation) {
      return res.status(400).json({
        success: false,
        message: 'At least one location (pickup or drop) is required'
      });
    }

    const searchId = await Ride.saveSearchHistory(userId, pickupLocation, dropLocation);

    res.status(201).json({
      success: true,
      message: 'Search saved to history successfully',
      data: {
        searchId
      }
    });

  } catch (error) {
    logger.error('Error saving search history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete search history item
 * DELETE /api/search/history/:id
 */
const deleteSearchHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = await Ride.deleteSearchHistory(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Search history item not found or not authorized'
      });
    }

    res.json({
      success: true,
      message: 'Search history item deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting search history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get search suggestions based on popular searches
 * GET /api/search/suggestions
 */
const getSearchSuggestions = async (req, res) => {
  try {
    const { query, type = 'location' } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    let suggestions = [];

    if (type === 'location') {
      // Get location suggestions using location service
      try {
        const locationSuggestions = await locationService.searchLocations(query);
        suggestions = locationSuggestions.places || [];
      } catch (error) {
        logger.warn('Location service failed, using fallback suggestions:', error.message);
        // Fallback to basic suggestions
        suggestions = [
          { description: `${query} - Popular destination` },
          { description: `${query} - City center` },
          { description: `${query} - Airport` }
        ];
      }
    } else if (type === 'popular') {
      // Get popular search combinations
      suggestions = await Ride.getPopularSearches(query);
    }

    res.json({
      success: true,
      message: 'Search suggestions retrieved successfully',
      data: {
        suggestions,
        query,
        type
      }
    });

  } catch (error) {
    logger.error('Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update ride status
 * PUT /api/rides/:id/status
 */
const updateRideStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Validate status
    const validStatuses = ['draft', 'published', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ride status. Must be one of: draft, published, in_progress, completed, cancelled'
      });
    }

    // Update ride status
    await Ride.updateStatus(id, status, userId);

    // Get updated ride data
    const updatedRide = await Ride.findById(id);

    res.json({
      success: true,
      message: 'Ride status updated successfully',
      data: {
        ride: updatedRide
      }
    });
  } catch (error) {
    logger.error('Error updating ride status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update ride status'
    });
  }
};

/**
 * Complete ride
 * POST /api/rides/:id/complete
 */
const completeRide = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Complete the ride
    await Ride.completeRide(id, userId);

    // Get updated ride data
    const completedRide = await Ride.findById(id);

    res.json({
      success: true,
      message: 'Ride completed successfully',
      data: {
        ride: completedRide
      }
    });
  } catch (error) {
    logger.error('Error completing ride:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete ride'
    });
  }
};

/**
 * Get ride statistics
 * GET /api/rides/:id/statistics
 */
const getRideStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get ride statistics
    const statistics = await Ride.getStatistics(id, userId);

    res.json({
      success: true,
      message: 'Ride statistics retrieved successfully',
      data: {
        statistics
      }
    });
  } catch (error) {
    logger.error('Error getting ride statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get ride statistics'
    });
  }
};

/**
 * Get user ride statistics
 * GET /api/rides/my-statistics
 */
const getUserRideStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user ride statistics
    const statistics = await Ride.getUserRideStatistics(userId);

    res.json({
      success: true,
      message: 'User ride statistics retrieved successfully',
      data: {
        statistics
      }
    });
  } catch (error) {
    logger.error('Error getting user ride statistics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user ride statistics'
    });
  }
};

// Helper function to save search history (used internally)
const saveSearchHistoryHelper = async (userId, pickupLocation, dropLocation) => {
  return await Ride.saveSearchHistory(userId, pickupLocation, dropLocation);
};

module.exports = {
  createRide,
  getRideById,
  updateRide,
  deleteRide,
  publishRide,
  unpublishRide,
  getMyRides,
  getAvailableSeats,
  searchRides,
  filterRides,
  getSearchHistory,
  saveSearchHistory,
  deleteSearchHistory,
  getSearchSuggestions,
  updateRideStatus,
  completeRide,
  getRideStatistics,
  getUserRideStatistics
}; 