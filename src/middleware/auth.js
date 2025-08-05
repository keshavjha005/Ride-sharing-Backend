const { verifyAccessToken } = require('../utils/jwt');
const { AuthenticationError } = require('./errorHandler');
const logger = require('../utils/logger');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Access token is required');
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      throw new AuthenticationError('Access token is required');
    }
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Add user info to request
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      language: decoded.language,
      currency: decoded.currency,
    };
    
    logger.auth('user_authenticated', req.user.id, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    next();
  } catch (error) {
    logger.security('authentication_failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    next(new AuthenticationError('Invalid or expired token'));
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Add user info to request
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      language: decoded.language,
      currency: decoded.currency,
    };
    
    logger.auth('user_authenticated_optional', req.user.id);
    
    next();
  } catch (error) {
    // Don't fail, just continue without user
    logger.warn('Optional authentication failed', {
      error: error.message,
      ip: req.ip,
    });
    
    next();
  }
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    // First authenticate user
    await authenticate(req, res, (error) => {
      if (error) {
        return next(error);
      }
      
      // Check if user is admin
      if (!req.user.role || !['admin', 'super_admin', 'moderator'].includes(req.user.role)) {
        logger.security('admin_access_denied', {
          userId: req.user.id,
          role: req.user.role,
          ip: req.ip,
        });
        
        return next(new AuthenticationError('Admin access required'));
      }
      
      logger.auth('admin_authenticated', req.user.id, {
        role: req.user.role,
        ip: req.ip,
      });
      
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Super admin authentication middleware
const authenticateSuperAdmin = async (req, res, next) => {
  try {
    // First authenticate user
    await authenticate(req, res, (error) => {
      if (error) {
        return next(error);
      }
      
      // Check if user is super admin
      if (!req.user.role || req.user.role !== 'super_admin') {
        logger.security('super_admin_access_denied', {
          userId: req.user.id,
          role: req.user.role,
          ip: req.ip,
        });
        
        return next(new AuthenticationError('Super admin access required'));
      }
      
      logger.auth('super_admin_authenticated', req.user.id, {
        ip: req.ip,
      });
      
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      logger.security('role_access_denied', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        ip: req.ip,
      });
      
      return next(new AuthenticationError('Insufficient permissions'));
    }
    
    logger.auth('role_authorized', req.user.id, {
      role: req.user.role,
      requiredRoles: roles,
    });
    
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authenticateAdmin,
  authenticateSuperAdmin,
  authorize,
}; 