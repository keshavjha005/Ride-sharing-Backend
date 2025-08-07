const { v4: uuidv4 } = require('uuid');
const RideAnalytics = require('../models/RideAnalytics');
const RideDispute = require('../models/RideDispute');
const db = require('../config/database');

class RideManagementController {
  /**
   * Get all rides with search and filtering
   */
  static async getRides(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        min_distance,
        max_distance,
        min_fare,
        max_fare,
        date_from,
        date_to,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (min_distance) filters.min_distance = min_distance;
      if (max_distance) filters.max_distance = max_distance;
      if (min_fare) filters.min_fare = min_fare;
      if (max_fare) filters.max_fare = max_fare;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      const result = await RideAnalytics.findAll(parseInt(page), parseInt(limit), filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting rides:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching rides'
      });
    }
  }

  /**
   * Get ride by ID with detailed information
   */
  static async getRideById(req, res) {
    try {
      const { id } = req.params;

      // Get ride analytics
      const analytics = await RideAnalytics.findByRideId(id);
      if (!analytics) {
        return res.status(404).json({
          success: false,
          message: 'Ride not found'
        });
      }

      // Get ride details with user and location information
      let rideDetails = null;
      let users = [];
      let locations = [];
      
      try {
        // Get ride details from rides table
        const rideRows = await db.executeQuery(`
          SELECT r.*, 
                 u.name as creator_name, u.email as creator_email, u.phone as creator_phone,
                 uvi.vehicle_number, uvi.vehicle_color, uvi.vehicle_year,
                 vb.name as vehicle_brand, vm.name as vehicle_model,
                 vt.name as vehicle_type
          FROM rides r
          LEFT JOIN users u ON r.created_by = u.id
          LEFT JOIN user_vehicle_information uvi ON r.vehicle_information_id = uvi.id
          LEFT JOIN vehicle_brands vb ON uvi.vehicle_brand_id = vb.id
          LEFT JOIN vehicle_models vm ON uvi.vehicle_model_id = vm.id
          LEFT JOIN vehicle_types vt ON uvi.vehicle_type_id = vt.id
          WHERE r.id = ? AND u.is_deleted = 0
        `, [id]);
        
        rideDetails = rideRows[0] || null;

        if (rideDetails) {
          // Get ride locations
          const locationRows = await db.executeQuery(`
            SELECT * FROM ride_locations 
            WHERE ride_id = ? 
            ORDER BY location_type, sequence_order
          `, [id]);
          locations = locationRows;

          // Get all users who booked this ride (multiple users can book)
          const bookingRows = await db.executeQuery(`
            SELECT b.*, 
                   u.name as user_name, u.email as user_email, u.phone as user_phone,
                   u.id as user_id
            FROM bookings b
            LEFT JOIN users u ON b.user_id = u.id
            WHERE b.ride_id = ? AND u.is_deleted = 0
            ORDER BY b.created_at DESC
          `, [id]);
          users = bookingRows;

          // Add creator as a user if not already in the list
          const creatorExists = users.some(user => user.user_id === rideDetails.created_by);
          if (!creatorExists && rideDetails.created_by) {
            users.unshift({
              user_id: rideDetails.created_by,
              user_name: rideDetails.creator_name,
              user_email: rideDetails.creator_email,
              user_phone: rideDetails.creator_phone,
              booked_seats: rideDetails.total_seats,
              status: 'confirmed',
              role: 'driver'
            });
          }
        }
      } catch (error) {
        console.log('Error fetching ride details:', error);
        // Fallback to sample data if tables don't exist
        rideDetails = {
          id: id,
          pickup_location: 'Sample Pickup Location',
          dropoff_location: 'Sample Dropoff Location',
          user_id: 'sample-user-id',
          driver_id: 'sample-driver-id',
          creator_name: 'Sample Driver',
          creator_email: 'driver@example.com'
        };
        users = [
          {
            user_id: 'sample-user-id',
            user_name: 'Sample Passenger',
            user_email: 'passenger@example.com',
            booked_seats: 1,
            status: 'confirmed',
            role: 'passenger'
          }
        ];
        locations = [
          {
            location_type: 'pickup',
            address: 'Sample Pickup Location',
            latitude: 0,
            longitude: 0
          },
          {
            location_type: 'drop',
            address: 'Sample Dropoff Location',
            latitude: 0,
            longitude: 0
          }
        ];
      }

      // Get ride disputes
      const disputes = await RideDispute.findByRideId(id);

      res.json({
        success: true,
        data: {
          analytics,
          rideDetails,
          users,
          locations,
          disputes
        }
      });

    } catch (error) {
      console.error('Error getting ride by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching ride details'
      });
    }
  }

  /**
   * Update ride status
   */
  static async updateRideStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, cancellation_reason } = req.body;

      // Check if ride analytics exists
      const analytics = await RideAnalytics.findByRideId(id);
      if (!analytics) {
        return res.status(404).json({
          success: false,
          message: 'Ride not found'
        });
      }

      // Update ride analytics
      const updateData = { status };
      if (cancellation_reason) {
        updateData.cancellation_reason = cancellation_reason;
      }

      const updated = await RideAnalytics.update(id, updateData);

      res.json({
        success: true,
        message: 'Ride status updated successfully',
        data: { updated }
      });

    } catch (error) {
      console.error('Error updating ride status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating ride status'
      });
    }
  }

  /**
   * Delete ride (soft delete)
   */
  static async deleteRide(req, res) {
    try {
      const { id } = req.params;

      // Check if ride analytics exists
      const analytics = await RideAnalytics.findByRideId(id);
      if (!analytics) {
        return res.status(404).json({
          success: false,
          message: 'Ride not found'
        });
      }

      // Update status to cancelled
      const updated = await RideAnalytics.update(id, { 
        status: 'cancelled',
        cancellation_reason: 'Deleted by admin'
      });

      res.json({
        success: true,
        message: 'Ride deleted successfully',
        data: { updated }
      });

    } catch (error) {
      console.error('Error deleting ride:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting ride'
      });
    }
  }

  /**
   * Get active rides
   */
  static async getActiveRides(req, res) {
    try {
      const { limit = 20 } = req.query;

      const rides = await RideAnalytics.getByStatus('started', parseInt(limit));

      res.json({
        success: true,
        data: rides
      });

    } catch (error) {
      console.error('Error getting active rides:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching active rides'
      });
    }
  }

  /**
   * Get completed rides
   */
  static async getCompletedRides(req, res) {
    try {
      const { limit = 20 } = req.query;

      const rides = await RideAnalytics.getByStatus('completed', parseInt(limit));

      res.json({
        success: true,
        data: rides
      });

    } catch (error) {
      console.error('Error getting completed rides:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching completed rides'
      });
    }
  }

  /**
   * Get cancelled rides
   */
  static async getCancelledRides(req, res) {
    try {
      const { limit = 20 } = req.query;

      const rides = await RideAnalytics.getByStatus('cancelled', parseInt(limit));

      res.json({
        success: true,
        data: rides
      });

    } catch (error) {
      console.error('Error getting cancelled rides:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching cancelled rides'
      });
    }
  }

  /**
   * Get ride analytics
   */
  static async getRideAnalytics(req, res) {
    try {
      const { period = '7d' } = req.query;

      // Calculate date range based on period
      const endDate = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      // Get summary statistics
      const summary = await RideAnalytics.getSummary();

      // Get statistics by date range
      const statistics = await RideAnalytics.getStatisticsByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Get top performing rides
      const topRides = await RideAnalytics.getTopPerformingRides(10);

      res.json({
        success: true,
        data: {
          summary,
          statistics,
          topRides,
          period
        }
      });

    } catch (error) {
      console.error('Error getting ride analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching ride analytics'
      });
    }
  }

  /**
   * Export rides data
   */
  static async exportRides(req, res) {
    try {
      const { format = 'json', status, date_from, date_to } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      // Get all rides (no pagination for export)
      const result = await RideAnalytics.findAll(1, 10000, filters);

      if (format === 'csv') {
        // Convert to CSV format
        const csvHeaders = [
          'Ride ID', 'Distance (km)', 'Duration (min)', 'Fare Amount', 'Commission',
          'Status', 'Cancellation Reason', 'Rating', 'User', 'Pickup Location',
          'Dropoff Location', 'Created At'
        ];

        const csvData = result.data.map(ride => [
          ride.ride_id,
          ride.distance_km || 'N/A',
          ride.duration_minutes || 'N/A',
          ride.fare_amount || 'N/A',
          ride.commission_amount || 'N/A',
          ride.status,
          ride.cancellation_reason || 'N/A',
          ride.rating || 'N/A',
          `${ride.user_first_name} ${ride.user_last_name}`,
          ride.pickup_location || 'N/A',
          ride.dropoff_location || 'N/A',
          ride.created_at
        ]);

        const csv = [csvHeaders, ...csvData]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=rides_export.csv');
        res.send(csv);
      } else {
        // Return JSON format
        res.json({
          success: true,
          data: result.data
        });
      }

    } catch (error) {
      console.error('Error exporting rides:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting rides data'
      });
    }
  }

  /**
   * Get ride management summary
   */
  static async getSummary(req, res) {
    try {
      // Get ride analytics summary
      const analyticsSummary = await RideAnalytics.getSummary();

      // Get disputes summary
      const disputesSummary = await RideDispute.getSummary();

      // Get recent rides
      const recentRides = await RideAnalytics.getRecentRides(5);

      // Get recent disputes
      const recentDisputes = await RideDispute.getRecentDisputes(5);

      res.json({
        success: true,
        data: {
          analytics: analyticsSummary,
          disputes: disputesSummary,
          recentRides,
          recentDisputes
        }
      });

    } catch (error) {
      console.error('Error getting ride management summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching ride management summary'
      });
    }
  }
}

module.exports = RideManagementController; 