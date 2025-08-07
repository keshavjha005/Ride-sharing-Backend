const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const AdminUser = require('../models/AdminUser');
const config = require('../config');

class AdminManagementController {
    /**
     * Get all admin users with pagination and filtering
     */
    static async getAdmins(req, res) {
        try {
            const { page = 1, limit = 10, role, is_active, search } = req.query;
            const db = require('../config/database');
            
            // Build WHERE clause
            let whereClause = 'WHERE 1=1';
            const whereValues = [];

            if (role) {
                whereClause += ' AND role = ?';
                whereValues.push(role);
            }
            if (is_active !== undefined) {
                whereClause += ' AND is_active = ?';
                whereValues.push(is_active === 'true' ? 1 : 0);
            }
            if (search) {
                whereClause += ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR role LIKE ?)';
                const searchPattern = `%${search}%`;
                whereValues.push(searchPattern, searchPattern, searchPattern, searchPattern);
            }

            // Get total count
            const countQuery = `SELECT COUNT(*) as total FROM admin_users ${whereClause}`;
            const countResult = await db.executeQuery(countQuery, whereValues);
            const total = countResult[0].total;

            // Calculate pagination
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / parseInt(limit))
            };

            // Get admins with pagination
            const query = `SELECT * FROM admin_users ${whereClause} ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
            const admins = await db.executeQuery(query, whereValues);

            res.json({
                success: true,
                data: {
                    admins: admins.map(admin => ({
                        id: admin.id,
                        email: admin.email,
                        first_name: admin.first_name,
                        last_name: admin.last_name,
                        role: admin.role,
                        permissions: admin.permissions,
                        language_code: admin.language_code,
                        timezone: admin.timezone,
                        is_active: admin.is_active,
                        last_login_at: admin.last_login_at,
                        created_at: admin.created_at,
                        updated_at: admin.updated_at
                    })),
                    pagination: pagination
                }
            });
        } catch (error) {
            console.error('Error getting admins:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving admin users'
            });
        }
    }

    /**
     * Get admin by ID
     */
    static async getAdminById(req, res) {
        try {
            const { id } = req.params;
            const admin = await AdminUser.findById(id);
            
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin user not found'
                });
            }

            res.json({
                success: true,
                data: {
                    id: admin.id,
                    email: admin.email,
                    first_name: admin.first_name,
                    last_name: admin.last_name,
                    role: admin.role,
                    permissions: admin.permissions,
                    language_code: admin.language_code,
                    timezone: admin.timezone,
                    is_active: admin.is_active,
                    last_login_at: admin.last_login_at,
                    created_at: admin.created_at,
                    updated_at: admin.updated_at
                }
            });
        } catch (error) {
            console.error('Error getting admin by ID:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving admin user'
            });
        }
    }

    /**
     * Create new admin user
     */
    static async createAdmin(req, res) {
        try {
            const { email, password, first_name, last_name, role, permissions, language_code, timezone } = req.body;

            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            // Check if email already exists
            const existingAdmin = await AdminUser.findByEmail(email);
            if (existingAdmin) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

            // Create admin user
            const adminData = {
                email,
                password_hash: passwordHash,
                first_name,
                last_name,
                role: role || 'admin',
                permissions: permissions || config.admin.defaultPermissions,
                language_code: language_code || 'en',
                timezone: timezone || 'UTC',
                is_active: true
            };

            const newAdmin = await AdminUser.create(adminData);

            res.status(201).json({
                success: true,
                message: 'Admin user created successfully',
                data: {
                    id: newAdmin.id,
                    email: newAdmin.email,
                    first_name: newAdmin.first_name,
                    last_name: newAdmin.last_name,
                    role: newAdmin.role,
                    permissions: newAdmin.permissions,
                    language_code: newAdmin.language_code,
                    timezone: newAdmin.timezone,
                    is_active: newAdmin.is_active,
                    created_at: newAdmin.created_at
                }
            });
        } catch (error) {
            console.error('Error creating admin:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating admin user'
            });
        }
    }

    /**
     * Update admin user
     */
    static async updateAdmin(req, res) {
        try {
            const { id } = req.params;
            const { email, password, first_name, last_name, role, permissions, language_code, timezone, is_active } = req.body;

            // Check if admin exists
            const existingAdmin = await AdminUser.findById(id);
            if (!existingAdmin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin user not found'
                });
            }

            // Prevent updating super admin role unless it's the same user
            if (existingAdmin.role === 'super_admin' && req.admin.id !== id && role !== 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot modify super admin role'
                });
            }

            // Build update data
            const updateData = {};
            if (email !== undefined) updateData.email = email;
            if (first_name !== undefined) updateData.first_name = first_name;
            if (last_name !== undefined) updateData.last_name = last_name;
            if (role !== undefined) updateData.role = role;
            if (permissions !== undefined) updateData.permissions = permissions;
            if (language_code !== undefined) updateData.language_code = language_code;
            if (timezone !== undefined) updateData.timezone = timezone;
            if (is_active !== undefined) updateData.is_active = is_active;

            // Hash password if provided
            if (password) {
                updateData.password_hash = await bcrypt.hash(password, config.security.bcryptRounds);
            }

            // Update admin user
            const updatedAdmin = await AdminUser.update(id, updateData);

            res.json({
                success: true,
                message: 'Admin user updated successfully',
                data: {
                    id: updatedAdmin.id,
                    email: updatedAdmin.email,
                    first_name: updatedAdmin.first_name,
                    last_name: updatedAdmin.last_name,
                    role: updatedAdmin.role,
                    permissions: updatedAdmin.permissions,
                    language_code: updatedAdmin.language_code,
                    timezone: updatedAdmin.timezone,
                    is_active: updatedAdmin.is_active,
                    updated_at: updatedAdmin.updated_at
                }
            });
        } catch (error) {
            console.error('Error updating admin:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating admin user'
            });
        }
    }

    /**
     * Delete admin user
     */
    static async deleteAdmin(req, res) {
        try {
            const { id } = req.params;

            // Check if admin exists
            const existingAdmin = await AdminUser.findById(id);
            if (!existingAdmin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin user not found'
                });
            }

            // Prevent deleting super admin
            if (existingAdmin.role === 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot delete super admin user'
                });
            }

            // Prevent deleting self
            if (req.admin.id === id) {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot delete your own account'
                });
            }

            // Delete admin user
            await AdminUser.delete(id);

            res.json({
                success: true,
                message: 'Admin user deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting admin:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting admin user'
            });
        }
    }

    /**
     * Toggle admin status (activate/deactivate)
     */
    static async toggleAdminStatus(req, res) {
        try {
            const { id } = req.params;

            // Check if admin exists
            const existingAdmin = await AdminUser.findById(id);
            if (!existingAdmin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin user not found'
                });
            }

            // Prevent deactivating super admin
            if (existingAdmin.role === 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Cannot deactivate super admin user'
                });
            }

            // Toggle status
            const newStatus = !existingAdmin.is_active;
            const updatedAdmin = await AdminUser.update(id, { is_active: newStatus });

            res.json({
                success: true,
                message: `Admin user ${newStatus ? 'activated' : 'deactivated'} successfully`,
                data: {
                    id: updatedAdmin.id,
                    is_active: updatedAdmin.is_active
                }
            });
        } catch (error) {
            console.error('Error toggling admin status:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating admin status'
            });
        }
    }

    /**
     * Get admin roles and permissions
     */
    static async getRolesAndPermissions(req, res) {
        try {
            const roles = [
                {
                    value: 'super_admin',
                    label: 'Super Admin',
                    description: 'Full system access with all permissions',
                    permissions: ['*']
                },
                {
                    value: 'admin',
                    label: 'Admin',
                    description: 'Full administrative access',
                    permissions: ['users', 'rides', 'analytics', 'settings', 'reports', 'localization']
                },
                {
                    value: 'moderator',
                    label: 'Moderator',
                    description: 'Limited administrative access for content moderation',
                    permissions: ['users', 'rides', 'reports']
                },
                {
                    value: 'support',
                    label: 'Support',
                    description: 'Customer support access',
                    permissions: ['users', 'rides']
                }
            ];

            const availablePermissions = [
                { key: 'users', label: 'User Management', description: 'Manage user accounts and data' },
                { key: 'rides', label: 'Ride Management', description: 'Manage rides and ride-related data' },
                { key: 'analytics', label: 'Analytics', description: 'Access to analytics and reporting' },
                { key: 'settings', label: 'System Settings', description: 'Manage system configuration' },
                { key: 'reports', label: 'Reports', description: 'Generate and view reports' },
                { key: 'localization', label: 'Localization', description: 'Manage multi-language content' },
                { key: 'admin_management', label: 'Admin Management', description: 'Manage other admin users' },
                { key: 'security', label: 'Security', description: 'Access to security settings and logs' }
            ];

            res.json({
                success: true,
                data: {
                    roles,
                    permissions: availablePermissions
                }
            });
        } catch (error) {
            console.error('Error getting roles and permissions:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving roles and permissions'
            });
        }
    }

    /**
     * Get admin statistics
     */
    static async getAdminStats(req, res) {
        try {
            // Use direct database queries instead of the findAll method
            const db = require('../config/database');
            
            // Get all admins with a simple query
            const allAdmins = await db.executeQuery('SELECT * FROM admin_users');
            
            const stats = {
                total: allAdmins.length,
                active: allAdmins.filter(admin => admin.is_active).length,
                inactive: allAdmins.filter(admin => !admin.is_active).length,
                byRole: {
                    super_admin: allAdmins.filter(admin => admin.role === 'super_admin').length,
                    admin: allAdmins.filter(admin => admin.role === 'admin').length,
                    moderator: allAdmins.filter(admin => admin.role === 'moderator').length,
                    support: allAdmins.filter(admin => admin.role === 'support').length
                },
                recentLogins: allAdmins
                    .filter(admin => admin.last_login_at)
                    .sort((a, b) => new Date(b.last_login_at) - new Date(a.last_login_at))
                    .slice(0, 5)
                    .map(admin => ({
                        id: admin.id,
                        email: admin.email,
                        name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim(),
                        last_login_at: admin.last_login_at
                    }))
            };

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error getting admin stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving admin statistics'
            });
        }
    }
}

module.exports = AdminManagementController; 