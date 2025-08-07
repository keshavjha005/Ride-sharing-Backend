const { v4: uuidv4 } = require('uuid');
const UserReport = require('../models/UserReport');
const UserAnalytics = require('../models/UserAnalytics');

class UserReportsController {
  /**
   * Get all user reports with filtering
   */
  static async getReports(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        report_type,
        reported_user_id,
        date_from,
        date_to,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (report_type) filters.report_type = report_type;
      if (reported_user_id) filters.reported_user_id = reported_user_id;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      const result = await UserReport.findAll(parseInt(page), parseInt(limit), filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error getting user reports:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user reports'
      });
    }
  }

  /**
   * Get report by ID
   */
  static async getReportById(req, res) {
    try {
      const { id } = req.params;
      console.log('Looking for report with ID:', id);

      const report = await UserReport.findById(id);
      console.log('Report found:', report);
      
      if (!report) {
        console.log('Report not found for ID:', id);
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      console.error('Error getting report by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching report details'
      });
    }
  }

  /**
   * Create new report
   */
  static async createReport(req, res) {
    try {
      const {
        reported_user_id,
        reporter_user_id,
        report_type,
        report_reason_ar,
        report_reason_en,
        evidence_files
      } = req.body;

      // Validate required fields
      if (!reported_user_id || !reporter_user_id || !report_type) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      const reportData = {
        id: uuidv4(),
        reported_user_id,
        reporter_user_id,
        report_type,
        report_reason_ar,
        report_reason_en,
        evidence_files: evidence_files ? JSON.stringify(evidence_files) : null
      };

      const report = await UserReport.create(reportData);

      // Update risk score for reported user
      const riskScore = await UserAnalytics.calculateRiskScore(reported_user_id);
      await UserAnalytics.update(reported_user_id, { risk_score: riskScore });

      res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: report
      });

    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating report'
      });
    }
  }

  /**
   * Update report status
   */
  static async updateReportStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, admin_notes } = req.body;
      const adminId = req.admin.id;

      // Validate status
      const validStatuses = ['pending', 'investigating', 'resolved', 'dismissed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      // Check if report exists
      const report = await UserReport.findById(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      // Update report status
      const updated = await UserReport.updateStatus(id, status, adminId, admin_notes);

      if (updated) {
        // If report is resolved or dismissed, recalculate risk score
        if (status === 'resolved' || status === 'dismissed') {
          const riskScore = await UserAnalytics.calculateRiskScore(report.reported_user_id);
          await UserAnalytics.update(report.reported_user_id, { risk_score: riskScore });
        }

        res.json({
          success: true,
          message: 'Report status updated successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to update report status'
        });
      }

    } catch (error) {
      console.error('Error updating report status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating report status'
      });
    }
  }

  /**
   * Update admin notes
   */
  static async updateAdminNotes(req, res) {
    try {
      const { id } = req.params;
      const { admin_notes } = req.body;
      const adminId = req.admin.id;

      // Check if report exists
      const report = await UserReport.findById(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      // Update admin notes
      const updated = await UserReport.updateAdminNotes(id, admin_notes, adminId);

      if (updated) {
        res.json({
          success: true,
          message: 'Admin notes updated successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to update admin notes'
        });
      }

    } catch (error) {
      console.error('Error updating admin notes:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating admin notes'
      });
    }
  }

  /**
   * Get reports summary
   */
  static async getReportsSummary(req, res) {
    try {
      const summary = await UserReport.getSummary();

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Error getting reports summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching reports summary'
      });
    }
  }

  /**
   * Get recent reports
   */
  static async getRecentReports(req, res) {
    try {
      const { limit = 10 } = req.query;

      const reports = await UserReport.getRecentReports(parseInt(limit));

      res.json({
        success: true,
        data: reports
      });

    } catch (error) {
      console.error('Error getting recent reports:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching recent reports'
      });
    }
  }

  /**
   * Get reports by user ID
   */
  static async getReportsByUserId(req, res) {
    try {
      const { userId } = req.params;

      const reports = await UserReport.findByReportedUserId(userId);

      res.json({
        success: true,
        data: reports
      });

    } catch (error) {
      console.error('Error getting reports by user ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user reports'
      });
    }
  }

  /**
   * Bulk update report statuses
   */
  static async bulkUpdateReports(req, res) {
    try {
      const { report_ids, status, admin_notes } = req.body;
      const adminId = req.admin.id;

      if (!Array.isArray(report_ids) || report_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Report IDs array is required'
        });
      }

      // Validate status
      const validStatuses = ['pending', 'investigating', 'resolved', 'dismissed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      let updatedCount = 0;
      const updatedReports = [];

      for (const reportId of report_ids) {
        try {
          const updated = await UserReport.updateStatus(reportId, status, adminId, admin_notes);
          if (updated) {
            updatedCount++;
            updatedReports.push(reportId);
          }
        } catch (error) {
          console.error(`Error updating report ${reportId}:`, error);
        }
      }

      res.json({
        success: true,
        message: `Updated ${updatedCount} out of ${report_ids.length} reports`,
        data: {
          updatedCount,
          updatedReports
        }
      });

    } catch (error) {
      console.error('Error bulk updating reports:', error);
      res.status(500).json({
        success: false,
        message: 'Error bulk updating reports'
      });
    }
  }

  /**
   * Export reports
   */
  static async exportReports(req, res) {
    try {
      const { format = 'json', status, report_type, date_from, date_to } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (report_type) filters.report_type = report_type;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      // Get all reports (no pagination for export)
      const result = await UserReport.findAll(1, 10000, filters);

      if (format === 'csv') {
        // Convert to CSV format
        const csvHeaders = [
          'ID', 'Reported User', 'Reporter', 'Report Type', 'Status',
          'Reason (EN)', 'Reason (AR)', 'Admin Notes', 'Created At',
          'Resolved By', 'Resolved At'
        ];

        const csvData = result.data.map(report => [
          report.id,
          `${report.reported_first_name} ${report.reported_last_name} (${report.reported_email})`,
          `${report.reporter_first_name} ${report.reporter_last_name} (${report.reporter_email})`,
          report.report_type,
          report.status,
          report.report_reason_en || '',
          report.report_reason_ar || '',
          report.admin_notes || '',
          report.created_at,
          report.admin_first_name ? `${report.admin_first_name} ${report.admin_last_name}` : '',
          report.resolved_at || ''
        ]);

        const csv = [csvHeaders, ...csvData]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=user_reports_export.csv');
        res.send(csv);
      } else {
        // Return JSON format
        res.json({
          success: true,
          data: result.data
        });
      }

    } catch (error) {
      console.error('Error exporting reports:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting reports data'
      });
    }
  }
}

module.exports = UserReportsController; 