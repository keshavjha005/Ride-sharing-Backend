const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const config = require('../config');

/**
 * Admin authentication middleware
 */
const adminAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, config.admin.jwtSecret);
        
        // Find admin user
        const adminUser = await AdminUser.findById(decoded.adminId);
        if (!adminUser || !adminUser.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired session'
            });
        }

        // Add admin user to request
        req.admin = {
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
            permissions: adminUser.permissions
        };

        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

/**
 * Admin role-based authorization middleware
 */
const adminRoleAuth = (requiredRoles = []) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Super admin has access to everything
        if (req.admin.role === 'super_admin') {
            return next();
        }

        // Check if user has required role
        if (requiredRoles.length > 0 && !requiredRoles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

/**
 * Admin permission-based authorization middleware
 */
const adminPermissionAuth = (requiredPermission) => {
    return (req, res, next) => {
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

        // Check if user has required permission
        const permissions = typeof req.admin.permissions === 'string' 
            ? JSON.parse(req.admin.permissions) 
            : req.admin.permissions;

        if (!permissions[requiredPermission]) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

module.exports = {
    adminAuth,
    adminRoleAuth,
    adminPermissionAuth
}; 