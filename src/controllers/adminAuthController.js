const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const AdminUser = require('../models/AdminUser');
const config = require('../config');

class AdminAuthController {
    /**
     * Admin login
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Find admin user
            const adminUser = await AdminUser.findByEmail(email);
            if (!adminUser || !adminUser.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials or account inactive'
                });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, adminUser.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    adminId: adminUser.id,
                    email: adminUser.email,
                    role: adminUser.role
                },
                config.admin.jwtSecret,
                { expiresIn: '24h' }
            );

            // Update last login
            await AdminUser.updateLastLogin(adminUser.id);

            // Return success response
            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    admin: {
                        id: adminUser.id,
                        email: adminUser.email,
                        first_name: adminUser.first_name,
                        last_name: adminUser.last_name,
                        role: adminUser.role,
                        language_code: adminUser.language_code,
                        timezone: adminUser.timezone
                    }
                }
            });

        } catch (error) {
            console.error('Admin login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Admin logout
     */
    static async logout(req, res) {
        try {
            // In a real implementation, you might want to blacklist the token
            // For now, we'll just return success
            res.json({
                success: true,
                message: 'Logout successful'
            });

        } catch (error) {
            console.error('Admin logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Get admin profile
     */
    static async getProfile(req, res) {
        try {
            const adminUser = await AdminUser.findById(req.admin.id);
            
            if (!adminUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin user not found'
                });
            }

            res.json({
                success: true,
                data: {
                    id: adminUser.id,
                    email: adminUser.email,
                    first_name: adminUser.first_name,
                    last_name: adminUser.last_name,
                    role: adminUser.role,
                    language_code: adminUser.language_code,
                    timezone: adminUser.timezone,
                    is_active: adminUser.is_active,
                    last_login_at: adminUser.last_login_at,
                    created_at: adminUser.created_at
                }
            });

        } catch (error) {
            console.error('Get admin profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Update admin profile
     */
    static async updateProfile(req, res) {
        try {
            const { first_name, last_name, language_code, timezone } = req.body;
            
            const updateData = {};
            if (first_name !== undefined) updateData.first_name = first_name;
            if (last_name !== undefined) updateData.last_name = last_name;
            if (language_code !== undefined) updateData.language_code = language_code;
            if (timezone !== undefined) updateData.timezone = timezone;

            const updatedAdmin = await AdminUser.update(req.admin.id, updateData);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    id: updatedAdmin.id,
                    email: updatedAdmin.email,
                    first_name: updatedAdmin.first_name,
                    last_name: updatedAdmin.last_name,
                    role: updatedAdmin.role,
                    language_code: updatedAdmin.language_code,
                    timezone: updatedAdmin.timezone
                }
            });

        } catch (error) {
            console.error('Update admin profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    /**
     * Refresh admin token
     */
    static async refreshToken(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token required'
                });
            }

            // Verify current token
            const decoded = jwt.verify(token, config.admin.jwtSecret);
            
            // Check if admin still exists and is active
            const adminUser = await AdminUser.findById(decoded.adminId);
            if (!adminUser || !adminUser.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired session'
                });
            }

            // Generate new token
            const newToken = jwt.sign(
                {
                    adminId: decoded.adminId,
                    email: decoded.email,
                    role: decoded.role
                },
                config.admin.jwtSecret,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    token: newToken
                }
            });

        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    }
}

module.exports = AdminAuthController; 