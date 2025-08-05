const { validationResult } = require('express-validator');
const locationService = require('../services/locationService');
const logger = require('../utils/logger');

/**
 * Search for locations using Google Places API
 * @route GET /api/location/search
 */
const searchLocations = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { query, types, location, radius, language } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long',
      });
    }

    const places = await locationService.searchLocations({
      query,
      types,
      location,
      radius,
      language,
    });

    res.json({
      success: true,
      message: 'Locations found successfully',
      data: {
        places,
        total: places.length,
        query,
      },
    });
  } catch (error) {
    logger.error('Error in searchLocations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Geocode an address to get coordinates
 * @route GET /api/location/geocode
 */
const geocodeAddress = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { address, placeId } = req.query;

    if (!address && !placeId) {
      return res.status(400).json({
        success: false,
        message: 'Either address or placeId is required',
      });
    }

    const result = await locationService.geocodeAddress(address, placeId);
    
    res.json({
      success: true,
      message: 'Address geocoded successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error in geocodeAddress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Calculate distance between two points
 * @route GET /api/location/distance
 */
const calculateDistance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { origin, destination, mode = 'driving', units = 'metric' } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required',
      });
    }

    const result = await locationService.calculateDistance({
      origin,
      destination,
      mode,
      units,
    });
    
    res.json({
      success: true,
      message: 'Distance calculated successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error in calculateDistance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get route information between two points
 * @route GET /api/location/route
 */
const getRoute = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { 
      origin, 
      destination, 
      waypoints, 
      mode = 'driving', 
      avoid = [], 
      units = 'metric',
      alternatives = false 
    } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination are required',
      });
    }

    const routes = await locationService.getRoute({
      origin,
      destination,
      waypoints,
      mode,
      avoid,
      units,
      alternatives,
    });
    
    res.json({
      success: true,
      message: 'Route information retrieved successfully',
      data: {
        routes,
        total: routes.length,
        origin: routes[0]?.startLocation?.address,
        destination: routes[0]?.endLocation?.address,
        mode,
        units,
      },
    });
  } catch (error) {
    logger.error('Error in getRoute:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Validate location coordinates
 * @route POST /api/location/validate
 */
const validateLocation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const { latitude, longitude, address } = req.body;

    // Basic coordinate validation
    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates provided',
        });
      }

      if (lat < -90 || lat > 90) {
        return res.status(400).json({
          success: false,
          message: 'Latitude must be between -90 and 90 degrees',
        });
      }

      if (lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Longitude must be between -180 and 180 degrees',
        });
      }

      // If address is also provided, verify it matches coordinates
      if (address) {
        try {
          const result = await locationService.geocodeAddress(address);
          const resultLocation = result.coordinates;
          
          // Check if coordinates are within reasonable distance (1km)
          const distance = locationService.calculateHaversineDistance(
            lat, lng,
            resultLocation.latitude, resultLocation.longitude
          );

          if (distance > 1) { // More than 1km difference
            return res.status(400).json({
              success: false,
              message: 'Address and coordinates do not match',
              data: {
                providedCoordinates: { latitude: lat, longitude: lng },
                geocodedCoordinates: resultLocation,
                distance: distance.toFixed(2) + ' km',
              },
            });
          }
        } catch (error) {
          // If geocoding fails, we'll just validate the coordinates
          logger.warn('Failed to geocode address for validation:', error.message);
        }
      }

      res.json({
        success: true,
        message: 'Location coordinates are valid',
        data: {
          coordinates: { latitude: lat, longitude: lng },
          isValid: true,
        },
      });
    } else if (address) {
      // Validate address by attempting to geocode it
      try {
        const result = await locationService.geocodeAddress(address);
        
        res.json({
          success: true,
          message: 'Address is valid',
          data: {
            address: result.address,
            coordinates: result.coordinates,
            isValid: true,
          },
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address provided',
          data: {
            address,
            isValid: false,
          },
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either coordinates (latitude, longitude) or address is required',
      });
    }
  } catch (error) {
    logger.error('Error in validateLocation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};



module.exports = {
  searchLocations,
  geocodeAddress,
  calculateDistance,
  getRoute,
  validateLocation,
}; 