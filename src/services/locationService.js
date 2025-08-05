const { Client } = require('@googlemaps/google-maps-services-js');
const config = require('../config');
const logger = require('../utils/logger');

// Initialize Google Maps client
const googleMapsClient = new Client({});

class LocationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get cached data or fetch from API
   * @param {string} key - Cache key
   * @param {Function} fetchFunction - Function to fetch data if not cached
   * @returns {Promise<any>} - Cached or fresh data
   */
  async getCachedOrFetch(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await fetchFunction();
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  /**
   * Search for locations with caching
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} - Search results
   */
  async searchLocations(params) {
    const cacheKey = `search:${JSON.stringify(params)}`;
    
    return this.getCachedOrFetch(cacheKey, async () => {
      const request = {
        params: {
          input: params.query,
          key: config.googleMaps.apiKey,
          types: params.types || 'geocode',
          language: params.language || 'en',
          components: 'country:us',
        },
      };

      if (params.location) {
        const [lat, lng] = params.location.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          request.params.location = `${lat},${lng}`;
          request.params.radius = params.radius || '50000';
        }
      }

      const response = await googleMapsClient.placeAutocomplete(request);
      
      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status}`);
      }

      return response.data.predictions.map(place => ({
        id: place.place_id,
        description: place.description,
        structuredFormatting: place.structured_formatting,
        types: place.types,
        matchedSubstrings: place.matched_substrings,
      }));
    });
  }

  /**
   * Geocode address with caching
   * @param {string} address - Address to geocode
   * @param {string} placeId - Optional place ID
   * @returns {Promise<Object>} - Geocoding results
   */
  async geocodeAddress(address, placeId = null) {
    const cacheKey = placeId ? `geocode:${placeId}` : `geocode:${address}`;
    
    return this.getCachedOrFetch(cacheKey, async () => {
      if (placeId) {
        const request = {
          params: {
            place_id: placeId,
            key: config.googleMaps.apiKey,
            fields: 'geometry,formatted_address,name,place_id',
          },
        };

        const response = await googleMapsClient.placeDetails(request);
        
        if (response.data.status !== 'OK') {
          throw new Error(`Google Place Details API error: ${response.data.status}`);
        }

        const place = response.data.result;
        const location = place.geometry.location;

        return {
          address: place.formatted_address,
          name: place.name,
          placeId: place.place_id,
          coordinates: {
            latitude: location.lat,
            longitude: location.lng,
          },
        };
      } else {
        const request = {
          params: {
            address: address,
            key: config.googleMaps.apiKey,
          },
        };

        const response = await googleMapsClient.geocode(request);
        
        if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
          throw new Error(`Google Geocoding API error: ${response.data.status}`);
        }

        if (response.data.results.length === 0) {
          throw new Error('No results found for the provided address');
        }

        const result = response.data.results[0];
        const location = result.geometry.location;

        return {
          address: result.formatted_address,
          placeId: result.place_id,
          coordinates: {
            latitude: location.lat,
            longitude: location.lng,
          },
          components: result.address_components,
        };
      }
    });
  }

  /**
   * Calculate distance with caching
   * @param {Object} params - Distance calculation parameters
   * @returns {Promise<Object>} - Distance results
   */
  async calculateDistance(params) {
    const cacheKey = `distance:${params.origin}:${params.destination}:${params.mode}:${params.units}`;
    
    return this.getCachedOrFetch(cacheKey, async () => {
      const request = {
        params: {
          origins: params.origin,
          destinations: params.destination,
          key: config.googleMaps.apiKey,
          mode: params.mode || 'driving',
          units: params.units || 'metric',
        },
      };

      const response = await googleMapsClient.distancematrix(request);
      
      if (response.data.status !== 'OK') {
        throw new Error(`Google Distance Matrix API error: ${response.data.status}`);
      }

      const element = response.data.rows[0].elements[0];
      
      if (element.status !== 'OK') {
        throw new Error(`Could not calculate distance: ${element.status}`);
      }

      return {
        origin: response.data.origin_addresses[0],
        destination: response.data.destination_addresses[0],
        distance: {
          text: element.distance.text,
          value: element.distance.value,
        },
        duration: {
          text: element.duration.text,
          value: element.duration.value,
        },
        mode: params.mode || 'driving',
        units: params.units || 'metric',
      };
    });
  }

  /**
   * Get route with caching
   * @param {Object} params - Route parameters
   * @returns {Promise<Object>} - Route results
   */
  async getRoute(params) {
    const cacheKey = `route:${params.origin}:${params.destination}:${params.mode}:${params.units}:${params.alternatives}`;
    
    return this.getCachedOrFetch(cacheKey, async () => {
      const request = {
        params: {
          origin: params.origin,
          destination: params.destination,
          key: config.googleMaps.apiKey,
          mode: params.mode || 'driving',
          units: params.units || 'metric',
          alternatives: params.alternatives === 'true',
        },
      };

      if (params.waypoints) {
        const waypointsArray = Array.isArray(params.waypoints) ? params.waypoints : [params.waypoints];
        request.params.waypoints = waypointsArray.join('|');
      }

      if (params.avoid && params.avoid.length > 0) {
        request.params.avoid = params.avoid.join('|');
      }

      const response = await googleMapsClient.directions(request);
      
      if (response.data.status !== 'OK') {
        throw new Error(`Google Directions API error: ${response.data.status}`);
      }

      return response.data.routes.map(route => {
        const leg = route.legs[0];
        return {
          routeId: route.overview_polyline.points,
          summary: route.summary,
          distance: {
            text: leg.distance.text,
            value: leg.distance.value,
          },
          duration: {
            text: leg.duration.text,
            value: leg.duration.value,
          },
          startLocation: {
            address: leg.start_address,
            coordinates: {
              latitude: leg.start_location.lat,
              longitude: leg.start_location.lng,
            },
          },
          endLocation: {
            address: leg.end_address,
            coordinates: {
              latitude: leg.end_location.lat,
              longitude: leg.end_location.lng,
            },
          },
          steps: leg.steps.map(step => ({
            instruction: step.html_instructions,
            distance: {
              text: step.distance.text,
              value: step.distance.value,
            },
            duration: {
              text: step.duration.text,
              value: step.duration.value,
            },
            travelMode: step.travel_mode,
            maneuver: step.maneuver,
          })),
          polyline: route.overview_polyline.points,
          warnings: route.warnings || [],
          fare: route.fare || null,
        };
      });
    });
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in kilometers
   */
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Validate coordinates
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {boolean} - Whether coordinates are valid
   */
  validateCoordinates(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return false;
    }

    if (lat < -90 || lat > 90) {
      return false;
    }

    if (lng < -180 || lng > 180) {
      return false;
    }

    return true;
  }

  /**
   * Format coordinates for API requests
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {string} - Formatted coordinates string
   */
  formatCoordinates(latitude, longitude) {
    return `${latitude},${longitude}`;
  }

  /**
   * Parse coordinates from string
   * @param {string} coordinates - Coordinates string (lat,lng)
   * @returns {Object|null} - Parsed coordinates or null if invalid
   */
  parseCoordinates(coordinates) {
    if (!coordinates || typeof coordinates !== 'string') {
      return null;
    }

    const parts = coordinates.split(',');
    if (parts.length !== 2) {
      return null;
    }

    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());

    if (!this.validateCoordinates(lat, lng)) {
      return null;
    }

    return { latitude: lat, longitude: lng };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Location service cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    const validEntries = entries.filter(([key, value]) => now - value.timestamp < this.cacheTimeout);
    
    return {
      totalEntries: entries.length,
      validEntries: validEntries.length,
      expiredEntries: entries.length - validEntries.length,
      cacheTimeout: this.cacheTimeout,
    };
  }
}

module.exports = new LocationService(); 