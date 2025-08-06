const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AdminUser {
    constructor(data) {
        this.id = data.id;
        this.email = data.email;
        this.password_hash = data.password_hash;
        this.first_name = data.first_name;
        this.last_name = data.last_name;
        this.role = data.role;
        this.permissions = data.permissions;
        this.language_code = data.language_code;
        this.timezone = data.timezone;
        this.is_active = data.is_active;
        this.last_login_at = data.last_login_at;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Find admin user by ID
     */
    static async findById(id) {
        try {
            const rows = await db.executeQuery(
                'SELECT * FROM admin_users WHERE id = ?',
                [id]
            );
            return rows.length > 0 ? new AdminUser(rows[0]) : null;
        } catch (error) {
            console.error('Error finding admin user by ID:', error);
            throw error;
        }
    }

    /**
     * Find admin user by email
     */
    static async findByEmail(email) {
        try {
            const rows = await db.executeQuery(
                'SELECT * FROM admin_users WHERE email = ?',
                [email]
            );
            return rows.length > 0 ? new AdminUser(rows[0]) : null;
        } catch (error) {
            console.error('Error finding admin user by email:', error);
            throw error;
        }
    }

    /**
     * Create new admin user
     */
    static async create(data) {
        try {
            const id = uuidv4();
            const result = await db.executeQuery(
                `INSERT INTO admin_users (
                    id, email, password_hash, first_name, last_name, role, 
                    permissions, language_code, timezone, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    data.email,
                    data.password_hash,
                    data.first_name || null,
                    data.last_name || null,
                    data.role || 'admin',
                    JSON.stringify(data.permissions || {}),
                    data.language_code || 'en',
                    data.timezone || 'UTC',
                    data.is_active !== undefined ? data.is_active : true
                ]
            );
            return this.findById(id);
        } catch (error) {
            console.error('Error creating admin user:', error);
            throw error;
        }
    }

    /**
     * Update admin user
     */
    static async update(id, data) {
        try {
            const updateFields = [];
            const updateValues = [];

            if (data.email !== undefined) {
                updateFields.push('email = ?');
                updateValues.push(data.email);
            }
            if (data.password_hash !== undefined) {
                updateFields.push('password_hash = ?');
                updateValues.push(data.password_hash);
            }
            if (data.first_name !== undefined) {
                updateFields.push('first_name = ?');
                updateValues.push(data.first_name);
            }
            if (data.last_name !== undefined) {
                updateFields.push('last_name = ?');
                updateValues.push(data.last_name);
            }
            if (data.role !== undefined) {
                updateFields.push('role = ?');
                updateValues.push(data.role);
            }
            if (data.permissions !== undefined) {
                updateFields.push('permissions = ?');
                updateValues.push(JSON.stringify(data.permissions));
            }
            if (data.language_code !== undefined) {
                updateFields.push('language_code = ?');
                updateValues.push(data.language_code);
            }
            if (data.timezone !== undefined) {
                updateFields.push('timezone = ?');
                updateValues.push(data.timezone);
            }
            if (data.is_active !== undefined) {
                updateFields.push('is_active = ?');
                updateValues.push(data.is_active);
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(id);

            const result = await db.executeQuery(
                `UPDATE admin_users SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            return this.findById(id);
        } catch (error) {
            console.error('Error updating admin user:', error);
            throw error;
        }
    }

    /**
     * Update last login timestamp
     */
    static async updateLastLogin(id) {
        try {
            await db.executeQuery(
                'UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );
        } catch (error) {
            console.error('Error updating last login:', error);
            throw error;
        }
    }

    /**
     * Delete admin user
     */
    static async delete(id) {
        try {
            const result = await db.executeQuery(
                'DELETE FROM admin_users WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting admin user:', error);
            throw error;
        }
    }

    /**
     * Get all admin users with pagination
     */
    static async findAll(options = {}) {
        try {
            const { page = 1, limit = 10, role, is_active } = options;
            const offset = (page - 1) * limit;

            let whereClause = 'WHERE 1=1';
            const whereValues = [];

            if (role) {
                whereClause += ' AND role = ?';
                whereValues.push(role);
            }
            if (is_active !== undefined) {
                whereClause += ' AND is_active = ?';
                whereValues.push(is_active);
            }

            const rows = await db.executeQuery(
                `SELECT * FROM admin_users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
                [...whereValues, limit, offset]
            );

            const countResult = await db.executeQuery(
                `SELECT COUNT(*) as total FROM admin_users ${whereClause}`,
                whereValues
            );

            return {
                users: rows.map(row => new AdminUser(row)),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            };
        } catch (error) {
            console.error('Error finding admin users:', error);
            throw error;
        }
    }

    /**
     * Check if admin has permission
     */
    hasPermission(permission) {
        if (!this.permissions) return false;
        
        const permissions = typeof this.permissions === 'string' 
            ? JSON.parse(this.permissions) 
            : this.permissions;

        // Super admin has all permissions
        if (this.role === 'super_admin') return true;

        // Check specific permission
        return permissions[permission] === true;
    }

    /**
     * Get full name
     */
    getFullName() {
        return `${this.first_name || ''} ${this.last_name || ''}`.trim();
    }
}

module.exports = AdminUser; 