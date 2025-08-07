const { validationResult } = require('express-validator');
const RequiredDocument = require('../models/RequiredDocument');
const UserDocument = require('../models/UserDocument');
const UserVerificationStatus = require('../models/UserVerificationStatus');
const User = require('../models/User');
const logger = require('../utils/logger');

class DocumentVerificationController {
  /**
   * Get all required documents (admin)
   * GET /api/admin/required-documents
   */
  static async getRequiredDocuments(req, res) {
    try {
      const { page = 1, limit = 20, is_active, document_type } = req.query;
      const filters = {};

      if (is_active !== undefined) {
        filters.is_active = is_active === 'true';
      }

      if (document_type) {
        filters.document_type = document_type;
      }

      const documents = await RequiredDocument.findAll(filters);
      
      res.json({
        success: true,
        message: 'Required documents retrieved successfully',
        data: documents
      });
    } catch (error) {
      logger.error('Error getting required documents:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving required documents'
      });
    }
  }

  /**
   * Create required document (admin)
   * POST /api/admin/required-documents
   */
  static async createRequiredDocument(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const documentData = {
        ...req.body,
        created_by: req.user.id
      };

      const document = await RequiredDocument.create(documentData);
      
      res.status(201).json({
        success: true,
        message: 'Required document created successfully',
        data: document
      });
    } catch (error) {
      logger.error('Error creating required document:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating required document'
      });
    }
  }

  /**
   * Update required document (admin)
   * PUT /api/admin/required-documents/:id
   */
  static async updateRequiredDocument(req, res) {
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
      const document = await RequiredDocument.update(id, req.body);
      
      res.json({
        success: true,
        message: 'Required document updated successfully',
        data: document
      });
    } catch (error) {
      logger.error('Error updating required document:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating required document'
      });
    }
  }

  /**
   * Delete required document (admin)
   * DELETE /api/admin/required-documents/:id
   */
  static async deleteRequiredDocument(req, res) {
    try {
      const { id } = req.params;
      await RequiredDocument.delete(id);
      
      res.json({
        success: true,
        message: 'Required document deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting required document:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting required document'
      });
    }
  }

  /**
   * Get user documents (admin)
   * GET /api/admin/user-documents
   */
  static async getUserDocuments(req, res) {
    try {
      const { page = 1, limit = 20, user_id, verification_status, document_type } = req.query;
      const filters = {};

      if (user_id) {
        filters.user_id = user_id;
      }

      if (verification_status) {
        filters.verification_status = verification_status;
      }

      if (document_type) {
        filters.document_type = document_type;
      }

      const result = await UserDocument.findAll(page, limit, filters);
      
      res.json({
        success: true,
        message: 'User documents retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error getting user documents:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user documents'
      });
    }
  }

  /**
   * Get user documents by user ID (admin)
   * GET /api/admin/user-documents/user/:userId
   */
  static async getUserDocumentsByUserId(req, res) {
    try {
      const { userId } = req.params;
      const { verification_status } = req.query;
      const filters = {};

      if (verification_status) {
        filters.verification_status = verification_status;
      }

      const documents = await UserDocument.findByUserId(userId, filters);
      
      res.json({
        success: true,
        message: 'User documents retrieved successfully',
        data: documents
      });
    } catch (error) {
      logger.error('Error getting user documents by user ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user documents'
      });
    }
  }

  /**
   * Approve user document (admin)
   * POST /api/admin/user-documents/:id/approve
   */
  static async approveUserDocument(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.user.id;

      const document = await UserDocument.updateVerificationStatus(id, 'approved', adminId, notes);
      
      // Update user verification status
      await UserVerificationStatus.calculateVerificationStatus(document.user_id);
      
      res.json({
        success: true,
        message: 'Document approved successfully',
        data: document
      });
    } catch (error) {
      logger.error('Error approving user document:', error);
      res.status(500).json({
        success: false,
        message: 'Error approving document'
      });
    }
  }

  /**
   * Reject user document (admin)
   * POST /api/admin/user-documents/:id/reject
   */
  static async rejectUserDocument(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.user.id;

      if (!notes) {
        return res.status(400).json({
          success: false,
          message: 'Rejection notes are required'
        });
      }

      const document = await UserDocument.updateVerificationStatus(id, 'rejected', adminId, notes);
      
      // Update user verification status
      await UserVerificationStatus.calculateVerificationStatus(document.user_id);
      
      res.json({
        success: true,
        message: 'Document rejected successfully',
        data: document
      });
    } catch (error) {
      logger.error('Error rejecting user document:', error);
      res.status(500).json({
        success: false,
        message: 'Error rejecting document'
      });
    }
  }

  /**
   * Get user verification status (admin)
   * GET /api/admin/user-verification-status
   */
  static async getUserVerificationStatus(req, res) {
    try {
      const { page = 1, limit = 20, overall_status, user_id } = req.query;
      const filters = {};

      if (overall_status) {
        filters.overall_status = overall_status;
      }

      if (user_id) {
        filters.user_id = user_id;
      }

      const result = await UserVerificationStatus.findAll(page, limit, filters);
      
      res.json({
        success: true,
        message: 'User verification status retrieved successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error getting user verification status:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user verification status'
      });
    }
  }

  /**
   * Get user verification status by user ID (admin)
   * GET /api/admin/user-verification-status/user/:userId
   */
  static async getUserVerificationStatusByUserId(req, res) {
    try {
      const { userId } = req.params;
      const status = await UserVerificationStatus.findByUserId(userId);
      
      res.json({
        success: true,
        message: 'User verification status retrieved successfully',
        data: status
      });
    } catch (error) {
      logger.error('Error getting user verification status by user ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user verification status'
      });
    }
  }

  /**
   * Update user verification status (admin)
   * PUT /api/admin/user-verification-status/user/:userId
   */
  static async updateUserVerificationStatus(req, res) {
    try {
      const { userId } = req.params;
      const { overall_status, rejection_reason } = req.body;
      const adminId = req.user.id;

      const status = await UserVerificationStatus.updateOverallStatus(
        userId, 
        overall_status, 
        adminId, 
        rejection_reason
      );
      
      res.json({
        success: true,
        message: 'User verification status updated successfully',
        data: status
      });
    } catch (error) {
      logger.error('Error updating user verification status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user verification status'
      });
    }
  }

  /**
   * Get verification summary (admin)
   * GET /api/admin/verification-summary
   */
  static async getVerificationSummary(req, res) {
    try {
      const summary = await UserVerificationStatus.getSummary();
      
      res.json({
        success: true,
        message: 'Verification summary retrieved successfully',
        data: summary
      });
    } catch (error) {
      logger.error('Error getting verification summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving verification summary'
      });
    }
  }

  // User endpoints

  /**
   * Get required documents for user
   * GET /api/verification/required-documents
   */
  static async getRequiredDocumentsForUser(req, res) {
    try {
      const documents = await RequiredDocument.getActiveDocuments();
      
      res.json({
        success: true,
        message: 'Required documents retrieved successfully',
        data: documents
      });
    } catch (error) {
      logger.error('Error getting required documents for user:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving required documents'
      });
    }
  }

  /**
   * Upload user document
   * POST /api/verification/upload-document
   */
  static async uploadUserDocument(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { document_type_id, file_url, file_name, file_size, file_type } = req.body;
      const userId = req.user.id;

      const documentData = {
        user_id: userId,
        document_type_id,
        file_url,
        file_name,
        file_size,
        file_type
      };

      const document = await UserDocument.create(documentData);
      
      // Update user verification status
      await UserVerificationStatus.calculateVerificationStatus(userId);
      
      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document
      });
    } catch (error) {
      logger.error('Error uploading user document:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading document'
      });
    }
  }

  /**
   * Get user's documents
   * GET /api/verification/my-documents
   */
  static async getUserDocumentsForUser(req, res) {
    try {
      const userId = req.user.id;
      const { verification_status } = req.query;
      const filters = {};

      if (verification_status) {
        filters.verification_status = verification_status;
      }

      const documents = await UserDocument.findByUserId(userId, filters);
      
      res.json({
        success: true,
        message: 'User documents retrieved successfully',
        data: documents
      });
    } catch (error) {
      logger.error('Error getting user documents:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user documents'
      });
    }
  }

  /**
   * Get user's verification status
   * GET /api/verification/my-status
   */
  static async getUserVerificationStatusForUser(req, res) {
    try {
      const userId = req.user.id;
      const status = await UserVerificationStatus.findByUserId(userId);
      
      res.json({
        success: true,
        message: 'User verification status retrieved successfully',
        data: status
      });
    } catch (error) {
      logger.error('Error getting user verification status:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user verification status'
      });
    }
  }

  /**
   * Delete user document
   * DELETE /api/verification/documents/:id
   */
  static async deleteUserDocument(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if document belongs to user
      const document = await UserDocument.findById(id);
      if (!document || document.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      await UserDocument.delete(id);
      
      // Update user verification status
      await UserVerificationStatus.calculateVerificationStatus(userId);
      
      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting user document:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting document'
      });
    }
  }
}

module.exports = DocumentVerificationController; 