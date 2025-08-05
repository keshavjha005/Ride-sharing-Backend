const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  upload,
  uploadSingle,
  uploadMultiple,
  getFileInfo,
  deleteFile,
  getUploadStats,
} = require('../controllers/uploadController');

// Public routes
router.get('/stats', asyncHandler(getUploadStats));
router.get('/file/:filename', asyncHandler(getFileInfo));

// Protected routes
router.post('/single', optionalAuth, upload.single('file'), asyncHandler(uploadSingle));
router.post('/multiple', optionalAuth, upload.array('files', 10), asyncHandler(uploadMultiple));
router.delete('/file/:filename', authenticate, asyncHandler(deleteFile));

module.exports = router; 