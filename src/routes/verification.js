const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const { validateRequest } = require('../middleware/validation');
const DocumentVerificationController = require('../controllers/documentVerificationController');

// Validation schemas
const documentValidation = {
  createRequiredDocument: [
    body('document_type')
      .notEmpty()
      .withMessage('Document type is required'),
    body('document_name_ar')
      .notEmpty()
      .withMessage('Arabic document name is required'),
    body('document_name_en')
      .notEmpty()
      .withMessage('English document name is required'),
    body('is_required')
      .isBoolean()
      .withMessage('Required field must be boolean'),
    body('is_active')
      .isBoolean()
      .withMessage('Active field must be boolean'),
    validateRequest
  ],
  updateRequiredDocument: [
    body('document_name_ar')
      .notEmpty()
      .withMessage('Arabic document name is required'),
    body('document_name_en')
      .notEmpty()
      .withMessage('English document name is required'),
    body('is_required')
      .isBoolean()
      .withMessage('Required field must be boolean'),
    body('is_active')
      .isBoolean()
      .withMessage('Active field must be boolean'),
    validateRequest
  ],
  uploadUserDocument: [
    body('document_type_id')
      .notEmpty()
      .withMessage('Document type ID is required'),
    body('file_url')
      .notEmpty()
      .withMessage('File URL is required'),
    body('file_name')
      .notEmpty()
      .withMessage('File name is required'),
    body('file_size')
      .isNumeric()
      .withMessage('File size is required'),
    body('file_type')
      .notEmpty()
      .withMessage('File type is required'),
    validateRequest
  ],
  rejectUserDocument: [
    body('notes')
      .notEmpty()
      .withMessage('Rejection notes are required'),
    validateRequest
  ],
  updateUserVerificationStatus: [
    body('overall_status')
      .isIn(['not_verified', 'pending', 'verified', 'rejected'])
      .withMessage('Overall status is required'),
    validateRequest
  ]
};

// Admin routes
router.get('/admin/required-documents', adminAuth, asyncHandler(DocumentVerificationController.getRequiredDocuments));
router.post('/admin/required-documents', adminAuth, documentValidation.createRequiredDocument, asyncHandler(DocumentVerificationController.createRequiredDocument));
router.put('/admin/required-documents/:id', adminAuth, documentValidation.updateRequiredDocument, asyncHandler(DocumentVerificationController.updateRequiredDocument));
router.delete('/admin/required-documents/:id', adminAuth, asyncHandler(DocumentVerificationController.deleteRequiredDocument));

router.get('/admin/user-documents', adminAuth, asyncHandler(DocumentVerificationController.getUserDocuments));
router.get('/admin/user-documents/user/:userId', adminAuth, asyncHandler(DocumentVerificationController.getUserDocumentsByUserId));
router.post('/admin/user-documents/:id/approve', adminAuth, asyncHandler(DocumentVerificationController.approveUserDocument));
router.post('/admin/user-documents/:id/reject', adminAuth, documentValidation.rejectUserDocument, asyncHandler(DocumentVerificationController.rejectUserDocument));

router.get('/admin/user-verification-status', adminAuth, asyncHandler(DocumentVerificationController.getUserVerificationStatus));
router.get('/admin/user-verification-status/user/:userId', adminAuth, asyncHandler(DocumentVerificationController.getUserVerificationStatusByUserId));
router.put('/admin/user-verification-status/user/:userId', adminAuth, documentValidation.updateUserVerificationStatus, asyncHandler(DocumentVerificationController.updateUserVerificationStatus));

router.get('/admin/verification-summary', adminAuth, asyncHandler(DocumentVerificationController.getVerificationSummary));

// User routes
router.get('/required-documents', authenticate, asyncHandler(DocumentVerificationController.getRequiredDocumentsForUser));
router.post('/upload-document', authenticate, documentValidation.uploadUserDocument, asyncHandler(DocumentVerificationController.uploadUserDocument));
router.get('/my-documents', authenticate, asyncHandler(DocumentVerificationController.getUserDocumentsForUser));
router.get('/my-status', authenticate, asyncHandler(DocumentVerificationController.getUserVerificationStatusForUser));
router.delete('/documents/:id', authenticate, asyncHandler(DocumentVerificationController.deleteUserDocument));

module.exports = router; 