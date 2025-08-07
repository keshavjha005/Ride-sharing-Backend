const { v4: uuidv4 } = require('uuid');
const RideDispute = require('../models/RideDispute');
const RideAnalytics = require('../models/RideAnalytics');

class RideDisputesController {
  /**
   * Get all disputes with filtering
   */
  static async getDisputes(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        dispute_type,
        ride_id,
        date_from,
        date_to
      } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (dispute_type) filters.dispute_type = dispute_type;
      if (ride_id) filters.ride_id = ride_id;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      const result = await RideDispute.findAll(parseInt(page), parseInt(limit), filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting disputes:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching disputes'
      });
    }
  }

  /**
   * Get dispute by ID
   */
  static async getDisputeById(req, res) {
    try {
      const { id } = req.params;

      const dispute = await RideDispute.findById(id);
      if (!dispute) {
        return res.status(404).json({
          success: false,
          message: 'Dispute not found'
        });
      }

      res.json({
        success: true,
        data: dispute
      });

    } catch (error) {
      console.error('Error getting dispute by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dispute details'
      });
    }
  }

  /**
   * Create new dispute
   */
  static async createDispute(req, res) {
    try {
      const { 
        ride_id, 
        dispute_type, 
        dispute_reason_ar, 
        dispute_reason_en, 
        evidence_files 
      } = req.body;

      // Validate required fields
      if (!ride_id || !dispute_type || !dispute_reason_en) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Check if ride exists
      const rideAnalytics = await RideAnalytics.findByRideId(ride_id);
      if (!rideAnalytics) {
        return res.status(404).json({
          success: false,
          message: 'Ride not found'
        });
      }

      // Check if dispute already exists for this ride
      const existingDisputes = await RideDispute.findByRideId(ride_id);
      if (existingDisputes.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Dispute already exists for this ride'
        });
      }

      const disputeData = {
        id: uuidv4(),
        ride_id,
        dispute_type,
        dispute_reason_ar: dispute_reason_ar || dispute_reason_en,
        dispute_reason_en,
        evidence_files: evidence_files ? JSON.stringify(evidence_files) : null
      };

      const dispute = await RideDispute.create(disputeData);

      res.status(201).json({
        success: true,
        message: 'Dispute created successfully',
        data: dispute
      });

    } catch (error) {
      console.error('Error creating dispute:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating dispute'
      });
    }
  }

  /**
   * Resolve dispute
   */
  static async resolveDispute(req, res) {
    try {
      const { id } = req.params;
      const { status, resolution_ar, resolution_en } = req.body;
      const adminId = req.admin.id;

      // Validate status
      const validStatuses = ['open', 'investigating', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      // Check if dispute exists
      const dispute = await RideDispute.findById(id);
      if (!dispute) {
        return res.status(404).json({
          success: false,
          message: 'Dispute not found'
        });
      }

      // Update dispute status
      const updated = await RideDispute.updateStatus(
        id, 
        status, 
        adminId, 
        resolution_ar, 
        resolution_en
      );

      res.json({
        success: true,
        message: 'Dispute status updated successfully',
        data: { updated }
      });

    } catch (error) {
      console.error('Error resolving dispute:', error);
      res.status(500).json({
        success: false,
        message: 'Error resolving dispute'
      });
    }
  }

  /**
   * Get disputes summary
   */
  static async getDisputesSummary(req, res) {
    try {
      const summary = await RideDispute.getSummary();

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Error getting disputes summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching disputes summary'
      });
    }
  }

  /**
   * Get recent disputes
   */
  static async getRecentDisputes(req, res) {
    try {
      const { limit = 10 } = req.query;

      const disputes = await RideDispute.getRecentDisputes(parseInt(limit));

      res.json({
        success: true,
        data: disputes
      });

    } catch (error) {
      console.error('Error getting recent disputes:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching recent disputes'
      });
    }
  }

  /**
   * Get disputes by status
   */
  static async getDisputesByStatus(req, res) {
    try {
      const { status } = req.params;
      const { limit = 20 } = req.query;

      const validStatuses = ['open', 'investigating', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const disputes = await RideDispute.getByStatus(status, parseInt(limit));

      res.json({
        success: true,
        data: disputes
      });

    } catch (error) {
      console.error('Error getting disputes by status:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching disputes by status'
      });
    }
  }

  /**
   * Get disputes by type
   */
  static async getDisputesByType(req, res) {
    try {
      const { type } = req.params;
      const { limit = 20 } = req.query;

      const validTypes = ['payment', 'service', 'safety', 'other'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid dispute type'
        });
      }

      const disputes = await RideDispute.getByType(type, parseInt(limit));

      res.json({
        success: true,
        data: disputes
      });

    } catch (error) {
      console.error('Error getting disputes by type:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching disputes by type'
      });
    }
  }

  /**
   * Export disputes data
   */
  static async exportDisputes(req, res) {
    try {
      const { format = 'json', status, dispute_type, date_from, date_to } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (dispute_type) filters.dispute_type = dispute_type;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      // Get all disputes (no pagination for export)
      const result = await RideDispute.findAll(1, 10000, filters);

      if (format === 'csv') {
        // Convert to CSV format
        const csvHeaders = [
          'Dispute ID', 'Ride ID', 'Dispute Type', 'Dispute Reason (EN)', 'Dispute Reason (AR)',
          'Status', 'Resolution (EN)', 'Resolution (AR)', 'Resolved By', 'Resolved At',
          'User', 'Pickup Location', 'Dropoff Location', 'Created At'
        ];

        const csvData = result.data.map(dispute => [
          dispute.id,
          dispute.ride_id,
          dispute.dispute_type,
          dispute.dispute_reason_en || 'N/A',
          dispute.dispute_reason_ar || 'N/A',
          dispute.status,
          dispute.resolution_en || 'N/A',
          dispute.resolution_ar || 'N/A',
          dispute.admin_email ? `${dispute.admin_first_name} ${dispute.admin_last_name}` : 'N/A',
          dispute.resolved_at || 'N/A',
          `${dispute.user_first_name} ${dispute.user_last_name}`,
          dispute.pickup_location || 'N/A',
          dispute.dropoff_location || 'N/A',
          dispute.created_at
        ]);

        const csv = [csvHeaders, ...csvData]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=disputes_export.csv');
        res.send(csv);
      } else {
        // Return JSON format
        res.json({
          success: true,
          data: result.data
        });
      }

    } catch (error) {
      console.error('Error exporting disputes:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting disputes data'
      });
    }
  }

  /**
   * Get disputes by ride ID
   */
  static async getDisputesByRideId(req, res) {
    try {
      const { rideId } = req.params;

      const disputes = await RideDispute.findByRideId(rideId);

      res.json({
        success: true,
        data: disputes
      });

    } catch (error) {
      console.error('Error getting disputes by ride ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching disputes by ride ID'
      });
    }
  }
}

module.exports = RideDisputesController; 