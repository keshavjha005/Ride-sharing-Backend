const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const config = require('../config');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create upload directory if it doesn't exist
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create upload directory', { error: error.message });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new ValidationError('Invalid file type'), false);
  }
  
  if (file.size > maxSize) {
    return cb(new ValidationError('File size too large (max 5MB)'), false);
  }
  
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Upload single file
const uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }
    
    const fileInfo = {
      id: uuidv4(),
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.file.filename}`,
      uploadedBy: req.user?.id || 'anonymous',
      uploadedAt: new Date().toISOString(),
    };
    
    logger.business('file_uploaded', {
      fileId: fileInfo.id,
      originalName: fileInfo.originalName,
      size: fileInfo.size,
      uploadedBy: fileInfo.uploadedBy,
    });
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file: fileInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Upload multiple files
const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ValidationError('No files uploaded');
    }
    
    const files = req.files.map(file => ({
      id: uuidv4(),
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/${file.filename}`,
      uploadedBy: req.user?.id || 'anonymous',
      uploadedAt: new Date().toISOString(),
    }));
    
    logger.business('files_uploaded', {
      count: files.length,
      uploadedBy: req.user?.id || 'anonymous',
    });
    
    res.json({
      success: true,
      message: `${files.length} files uploaded successfully`,
      data: {
        files,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get file info
const getFileInfo = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);
    
    try {
      const stats = await fs.stat(filePath);
      
      const fileInfo = {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: `/uploads/${filename}`,
      };
      
      res.json({
        success: true,
        data: {
          file: fileInfo,
        },
      });
    } catch (error) {
      throw new ValidationError('File not found');
    }
  } catch (error) {
    next(error);
  }
};

// Delete file
const deleteFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);
    
    try {
      await fs.unlink(filePath);
      
      logger.business('file_deleted', {
        filename,
        deletedBy: req.user?.id || 'anonymous',
      });
      
      res.json({
        success: true,
        message: 'File deleted successfully',
        data: {
          filename,
        },
      });
    } catch (error) {
      throw new ValidationError('File not found or could not be deleted');
    }
  } catch (error) {
    next(error);
  }
};

// Get upload statistics
const getUploadStats = async (req, res, next) => {
  try {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    try {
      const files = await fs.readdir(uploadDir);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(uploadDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
      
      const stats = {
        totalFiles: files.length,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      };
      
      res.json({
        success: true,
        data: {
          stats,
        },
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          stats: {
            totalFiles: 0,
            totalSize: 0,
            totalSizeMB: '0.00',
          },
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  getFileInfo,
  deleteFile,
  getUploadStats,
}; 