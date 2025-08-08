const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get admin from database with permissions
    const admins = await executeQuery(
      `SELECT 
        id, 
        role, 
        is_active,
        permissions
      FROM admin_users 
      WHERE id = ?`,
      [decoded.id]
    );

    if (!admins || admins.length === 0 || !admins[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive admin account'
      });
    }

    // Parse permissions from JSON field
    const permissions = admins[0].permissions ? 
      (typeof admins[0].permissions === 'string' ? 
        JSON.parse(admins[0].permissions) : 
        admins[0].permissions) : 
      [];

    // Add admin to request
    req.admin = {
      id: admins[0].id,
      role: admins[0].role,
      permissions: permissions
    };

    next();
  } catch (error) {
    logger.error('Admin auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

const adminRoleAuth = (requiredRole) => (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const roles = {
      super_admin: 3,
      admin: 2,
      moderator: 1
    };

    const userRoleLevel = roles[req.admin.role] || 0;
    const requiredRoleLevel = roles[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role permissions'
      });
    }

    next();
  } catch (error) {
    logger.error('Admin role auth error:', error);
    res.status(403).json({
      success: false,
      message: 'Role verification failed'
    });
  }
};

const adminPermissionAuth = (requiredPermission) => (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Super admin has all permissions
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // Check if admin has the required permission
    if (!req.admin.permissions || !req.admin.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  } catch (error) {
    logger.error('Admin permission auth error:', error);
    res.status(403).json({
      success: false,
      message: 'Permission verification failed'
    });
  }
};

module.exports = { adminAuth, adminRoleAuth, adminPermissionAuth };