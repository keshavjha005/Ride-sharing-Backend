const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class RideLocationTracking {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.rideId = data.rideId;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.accuracy = data.accuracy;
    this.speed = data.speed;
    this.heading = data.heading;
    this.altitude = data.altitude;
    this.timestamp = data.timestamp || new Date();
  }

  // Create a new location tracking entry
  static async create(locationData) {
    try {
      const location = new RideLocationTracking(locationData);
      
      const query = `
        INSERT INTO ride_location_tracking (
          id, ride_id, latitude, longitude, accuracy, speed, heading, altitude, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        location.id,
        location.rideId,
        location.latitude,
        location.longitude,
        location.accuracy,
        location.speed,
        location.heading,
        location.altitude,
        location.timestamp
      ];

      await db.execute(query, values);
      
      logger.info(`Ride location tracking entry created successfully with ID: ${location.id}`);
      return location;
    } catch (error) {
      logger.error('Error creating ride location tracking entry:', error);
      throw error;
    }
  }

  // Get location tracking for a ride
  static async findByRideId(rideId, limit = 100, offset = 0) {
    try {
      const query = `
        SELECT * FROM ride_location_tracking 
        WHERE ride_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ? OFFSET ?
      `;

      const [rows] = await db.execute(query, [rideId, limit, offset]);
      
      return rows.map(row => ({
        id: row.id,
        rideId: row.ride_id,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        accuracy: row.accuracy ? parseFloat(row.accuracy) : null,
        speed: row.speed ? parseFloat(row.speed) : null,
        heading: row.heading ? parseFloat(row.heading) : null,
        altitude: row.altitude ? parseFloat(row.altitude) : null,
        timestamp: row.timestamp
      }));
    } catch (error) {
      logger.error('Error fetching ride location tracking:', error);
      throw error;
    }
  }

  // Get latest location for a ride
  static async getLatestByRideId(rideId) {
    try {
      const query = `
        SELECT * FROM ride_location_tracking 
        WHERE ride_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
      `;

      const [rows] = await db.execute(query, [rideId]);
      
      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        id: row.id,
        rideId: row.ride_id,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        accuracy: row.accuracy ? parseFloat(row.accuracy) : null,
        speed: row.speed ? parseFloat(row.speed) : null,
        heading: row.heading ? parseFloat(row.heading) : null,
        altitude: row.altitude ? parseFloat(row.altitude) : null,
        timestamp: row.timestamp
      };
    } catch (error) {
      logger.error('Error fetching latest ride location:', error);
      throw error;
    }
  }

  // Get location tracking within a time range
  static async findByTimeRange(rideId, startTime, endTime, limit = 100) {
    try {
      const query = `
        SELECT * FROM ride_location_tracking 
        WHERE ride_id = ? AND timestamp BETWEEN ? AND ? 
        ORDER BY timestamp ASC 
        LIMIT ?
      `;

      const [rows] = await db.execute(query, [rideId, startTime, endTime, limit]);
      
      return rows.map(row => ({
        id: row.id,
        rideId: row.ride_id,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        accuracy: row.accuracy ? parseFloat(row.accuracy) : null,
        speed: row.speed ? parseFloat(row.speed) : null,
        heading: row.heading ? parseFloat(row.heading) : null,
        altitude: row.altitude ? parseFloat(row.altitude) : null,
        timestamp: row.timestamp
      }));
    } catch (error) {
      logger.error('Error fetching ride location tracking by time range:', error);
      throw error;
    }
  }

  // Get location tracking with speed filter
  static async findBySpeedRange(rideId, minSpeed, maxSpeed, limit = 100) {
    try {
      const query = `
        SELECT * FROM ride_location_tracking 
        WHERE ride_id = ? AND speed BETWEEN ? AND ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;

      const [rows] = await db.execute(query, [rideId, minSpeed, maxSpeed, limit]);
      
      return rows.map(row => ({
        id: row.id,
        rideId: row.ride_id,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        accuracy: row.accuracy ? parseFloat(row.accuracy) : null,
        speed: row.speed ? parseFloat(row.speed) : null,
        heading: row.heading ? parseFloat(row.heading) : null,
        altitude: row.altitude ? parseFloat(row.altitude) : null,
        timestamp: row.timestamp
      }));
    } catch (error) {
      logger.error('Error fetching ride location tracking by speed range:', error);
      throw error;
    }
  }

  // Calculate distance between two points
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Calculate total distance for a ride
  static async calculateTotalDistance(rideId) {
    try {
      const locations = await this.findByRideId(rideId, 1000, 0);
      
      if (locations.length < 2) {
        return 0;
      }

      let totalDistance = 0;
      
      for (let i = 1; i < locations.length; i++) {
        const prev = locations[i - 1];
        const curr = locations[i];
        
        const distance = this.calculateDistance(
          prev.latitude, prev.longitude,
          curr.latitude, curr.longitude
        );
        
        totalDistance += distance;
      }
      
      return totalDistance;
    } catch (error) {
      logger.error('Error calculating total distance:', error);
      throw error;
    }
  }

  // Calculate average speed for a ride
  static async calculateAverageSpeed(rideId) {
    try {
      const query = `
        SELECT AVG(speed) as avg_speed, COUNT(*) as total_points
        FROM ride_location_tracking 
        WHERE ride_id = ? AND speed IS NOT NULL AND speed > 0
      `;

      const [rows] = await db.execute(query, [rideId]);
      
      if (rows.length === 0 || rows[0].total_points === 0) {
        return 0;
      }
      
      return parseFloat(rows[0].avg_speed);
    } catch (error) {
      logger.error('Error calculating average speed:', error);
      throw error;
    }
  }

  // Get location tracking statistics
  static async getStatistics(rideId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_points,
          MIN(timestamp) as first_location,
          MAX(timestamp) as last_location,
          AVG(speed) as avg_speed,
          MAX(speed) as max_speed,
          MIN(speed) as min_speed,
          AVG(accuracy) as avg_accuracy
        FROM ride_location_tracking 
        WHERE ride_id = ?
      `;

      const [rows] = await db.execute(query, [rideId]);
      
      if (rows.length === 0) {
        return null;
      }

      const stats = rows[0];
      
      // Calculate total distance
      const totalDistance = await this.calculateTotalDistance(rideId);
      
      return {
        totalPoints: parseInt(stats.total_points),
        firstLocation: stats.first_location,
        lastLocation: stats.last_location,
        averageSpeed: stats.avg_speed ? parseFloat(stats.avg_speed) : 0,
        maxSpeed: stats.max_speed ? parseFloat(stats.max_speed) : 0,
        minSpeed: stats.min_speed ? parseFloat(stats.min_speed) : 0,
        averageAccuracy: stats.avg_accuracy ? parseFloat(stats.avg_accuracy) : 0,
        totalDistance: totalDistance
      };
    } catch (error) {
      logger.error('Error fetching ride location tracking statistics:', error);
      throw error;
    }
  }

  // Get locations near a specific point
  static async findNearLocation(latitude, longitude, radiusKm = 1, limit = 50) {
    try {
      // Using Haversine formula in SQL
      const query = `
        SELECT *, 
          (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
           cos(radians(longitude) - radians(?)) + 
           sin(radians(?)) * sin(radians(latitude)))) AS distance
        FROM ride_location_tracking 
        HAVING distance < ?
        ORDER BY distance ASC
        LIMIT ?
      `;

      const [rows] = await db.execute(query, [latitude, longitude, latitude, radiusKm, limit]);
      
      return rows.map(row => ({
        id: row.id,
        rideId: row.ride_id,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
        accuracy: row.accuracy ? parseFloat(row.accuracy) : null,
        speed: row.speed ? parseFloat(row.speed) : null,
        heading: row.heading ? parseFloat(row.heading) : null,
        altitude: row.altitude ? parseFloat(row.altitude) : null,
        timestamp: row.timestamp,
        distance: parseFloat(row.distance)
      }));
    } catch (error) {
      logger.error('Error finding locations near point:', error);
      throw error;
    }
  }

  // Delete old location tracking entries (cleanup)
  static async deleteOldEntries(daysOld = 7) {
    try {
      const query = `
        DELETE FROM ride_location_tracking 
        WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)
      `;

      const [result] = await db.query(query, [daysOld]);
      
      logger.info(`Deleted ${result.affectedRows} old ride location tracking entries`);
      return result.affectedRows;
    } catch (error) {
      logger.error('Error deleting old ride location tracking entries:', error);
      throw error;
    }
  }

  // Batch insert multiple location entries
  static async createMultiple(locationsData) {
    try {
      if (locationsData.length === 0) {
        return [];
      }

      const query = `
        INSERT INTO ride_location_tracking (
          id, ride_id, latitude, longitude, accuracy, speed, heading, altitude, timestamp
        ) VALUES ?
      `;

      const values = locationsData.map(location => [
        location.id || uuidv4(),
        location.rideId,
        location.latitude,
        location.longitude,
        location.accuracy,
        location.speed,
        location.heading,
        location.altitude,
        location.timestamp || new Date()
      ]);

      await db.execute(query, [values]);
      
      logger.info(`Created ${locationsData.length} ride location tracking entries`);
      return locationsData;
    } catch (error) {
      logger.error('Error creating multiple ride location tracking entries:', error);
      throw error;
    }
  }
}

module.exports = RideLocationTracking; 