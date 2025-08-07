const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

class SystemConfigController {
    constructor() {
        this.dbConfig = config.database;
    }

    async getConnection() {
        return await mysql.createConnection(this.dbConfig);
    }

    // System Settings Management
    async getSystemSettings(req, res) {
        let connection;
        try {
            connection = await this.getConnection();
            const { category, search, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT * FROM system_settings 
                WHERE 1=1
            `;
            const params = [];

            if (category) {
                query += ` AND category = ?`;
                params.push(category);
            }

            if (search) {
                query += ` AND (setting_key LIKE ? OR title_en LIKE ? OR title_ar LIKE ?)`;
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            query += ` ORDER BY category, setting_key LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), offset);

            const [settings] = await connection.execute(query, params);

            // Get total count for pagination
            let countQuery = `SELECT COUNT(*) as total FROM system_settings WHERE 1=1`;
            const countParams = [];

            if (category) {
                countQuery += ` AND category = ?`;
                countParams.push(category);
            }

            if (search) {
                countQuery += ` AND (setting_key LIKE ? OR title_en LIKE ? OR title_ar LIKE ?)`;
                const searchTerm = `%${search}%`;
                countParams.push(searchTerm, searchTerm, searchTerm);
            }

            const [countResult] = await connection.execute(countQuery, countParams);
            const total = countResult[0].total;

            res.json({
                success: true,
                data: settings,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            logger.error('Error fetching system settings:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching system settings'
            });
        } finally {
            if (connection) await connection.end();
        }
    }

    async createSystemSetting(req, res) {
        let connection;
        try {
            const {
                setting_key,
                setting_value,
                setting_type,
                category,
                title_ar,
                title_en,
                description_ar,
                description_en,
                is_public = false,
                is_editable = true,
                validation_rules
            } = req.body;

            // Validate required fields
            if (!setting_key || !setting_type || !category) {
                return res.status(400).json({
                    success: false,
                    message: 'Setting key, type, and category are required'
                });
            }

            connection = await this.getConnection();

            // Check if setting key already exists
            const [existing] = await connection.execute(
                'SELECT id FROM system_settings WHERE setting_key = ?',
                [setting_key]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Setting key already exists'
                });
            }

            const id = uuidv4();
            const validationRulesJson = validation_rules ? JSON.stringify(validation_rules) : null;

            await connection.execute(`
                INSERT INTO system_settings (
                    id, setting_key, setting_value, setting_type, category,
                    title_ar, title_en, description_ar, description_en,
                    is_public, is_editable, validation_rules
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, setting_key, setting_value, setting_type, category,
                title_ar, title_en, description_ar, description_en,
                is_public, is_editable, validationRulesJson
            ]);

            // Log admin activity
            await this.logAdminActivity(req.adminUser.id, 'create', 'system_setting', id, {
                setting_key,
                category,
                setting_type
            });

            res.status(201).json({
                success: true,
                message: 'System setting created successfully',
                data: { id, setting_key }
            });

        } catch (error) {
            logger.error('Error creating system setting:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating system setting'
            });
        } finally {
            if (connection) await connection.end();
        }
    }

    async updateSystemSetting(req, res) {
        let connection;
        try {
            const { key } = req.params;
            const {
                setting_value,
                title_ar,
                title_en,
                description_ar,
                description_en,
                is_public,
                is_editable,
                validation_rules
            } = req.body;

            connection = await this.getConnection();

            // Check if setting exists
            const [existing] = await connection.execute(
                'SELECT * FROM system_settings WHERE setting_key = ?',
                [key]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'System setting not found'
                });
            }

            const setting = existing[0];

            // Check if setting is editable
            if (!setting.is_editable && setting_value !== undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'This setting is not editable'
                });
            }

            // Build update query dynamically
            const updates = [];
            const params = [];

            if (setting_value !== undefined) {
                updates.push('setting_value = ?');
                params.push(setting_value);
            }

            if (title_ar !== undefined) {
                updates.push('title_ar = ?');
                params.push(title_ar);
            }

            if (title_en !== undefined) {
                updates.push('title_en = ?');
                params.push(title_en);
            }

            if (description_ar !== undefined) {
                updates.push('description_ar = ?');
                params.push(description_ar);
            }

            if (description_en !== undefined) {
                updates.push('description_en = ?');
                params.push(description_en);
            }

            if (is_public !== undefined) {
                updates.push('is_public = ?');
                params.push(is_public);
            }

            if (is_editable !== undefined) {
                updates.push('is_editable = ?');
                params.push(is_editable);
            }

            if (validation_rules !== undefined) {
                updates.push('validation_rules = ?');
                params.push(JSON.stringify(validation_rules));
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
            }

            updates.push('updated_at = CURRENT_TIMESTAMP');
            params.push(key);

            await connection.execute(`
                UPDATE system_settings 
                SET ${updates.join(', ')}
                WHERE setting_key = ?
            `, params);

            // Log admin activity
            await this.logAdminActivity(req.adminUser.id, 'update', 'system_setting', setting.id, {
                setting_key: key,
                updated_fields: updates.filter(u => !u.includes('updated_at'))
            });

            res.json({
                success: true,
                message: 'System setting updated successfully'
            });

        } catch (error) {
            logger.error('Error updating system setting:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating system setting'
            });
        } finally {
            if (connection) await connection.end();
        }
    }

    async deleteSystemSetting(req, res) {
        let connection;
        try {
            const { key } = req.params;

            connection = await this.getConnection();

            // Check if setting exists
            const [existing] = await connection.execute(
                'SELECT id FROM system_settings WHERE setting_key = ?',
                [key]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'System setting not found'
                });
            }

            await connection.execute(
                'DELETE FROM system_settings WHERE setting_key = ?',
                [key]
            );

            // Log admin activity
            await this.logAdminActivity(req.adminUser.id, 'delete', 'system_setting', existing[0].id, {
                setting_key: key
            });

            res.json({
                success: true,
                message: 'System setting deleted successfully'
            });

        } catch (error) {
            logger.error('Error deleting system setting:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting system setting'
            });
        } finally {
            if (connection) await connection.end();
        }
    }

    async getSystemSettingsCategories(req, res) {
        let connection;
        try {
            connection = await this.getConnection();

            const [categories] = await connection.execute(`
                SELECT DISTINCT category, COUNT(*) as count
                FROM system_settings
                GROUP BY category
                ORDER BY category
            `);

            res.json({
                success: true,
                data: categories
            });

        } catch (error) {
            logger.error('Error fetching system settings categories:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching system settings categories'
            });
        } finally {
            if (connection) await connection.end();
        }
    }

    async getSystemSettingsByCategory(req, res) {
        let connection;
        try {
            const { category } = req.params;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            connection = await this.getConnection();

            const [settings] = await connection.execute(`
                SELECT * FROM system_settings 
                WHERE category = ?
                ORDER BY setting_key
                LIMIT ? OFFSET ?
            `, [category, parseInt(limit), offset]);

            // Get total count for pagination
            const [countResult] = await connection.execute(
                'SELECT COUNT(*) as total FROM system_settings WHERE category = ?',
                [category]
            );
            const total = countResult[0].total;

            res.json({
                success: true,
                data: settings,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            logger.error('Error fetching system settings by category:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching system settings by category'
            });
        } finally {
            if (connection) await connection.end();
        }
    }

    // Feature Flags Management
    async getFeatureFlags(req, res) {
        let connection;
        try {
            connection = await this.getConnection();
            const { search, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            let query = `
                SELECT * FROM feature_flags 
                WHERE 1=1
            `;
            const params = [];

            if (search) {
                query += ` AND (feature_key LIKE ? OR feature_name_en LIKE ? OR feature_name_ar LIKE ?)`;
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), offset);

            const [flags] = await connection.execute(query, params);

            // Get total count for pagination
            let countQuery = `SELECT COUNT(*) as total FROM feature_flags WHERE 1=1`;
            const countParams = [];

            if (search) {
                countQuery += ` AND (feature_key LIKE ? OR feature_name_en LIKE ? OR feature_name_ar LIKE ?)`;
                const searchTerm = `%${search}%`;
                countParams.push(searchTerm, searchTerm, searchTerm);
            }

            const [countResult] = await connection.execute(countQuery, countParams);
            const total = countResult[0].total;

            res.json({
                success: true,
                data: flags,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            logger.error('Error fetching feature flags:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching feature flags'
            });
        } finally {
            if (connection) await connection.end();
        }
    }

    async createFeatureFlag(req, res) {
        let connection;
        try {
            const {
                feature_key,
                feature_name_ar,
                feature_name_en,
                description_ar,
                description_en,
                is_enabled = false,
                enabled_for_ios = false,
                enabled_for_android = false,
                enabled_for_web = false,
                rollout_percentage = 0,
                target_audience
            } = req.body;

            // Validate required fields
            if (!feature_key || !feature_name_en) {
                return res.status(400).json({
                    success: false,
                    message: 'Feature key and English name are required'
                });
            }

            connection = await this.getConnection();

            // Check if feature key already exists
            const [existing] = await connection.execute(
                'SELECT id FROM feature_flags WHERE feature_key = ?',
                [feature_key]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Feature key already exists'
                });
            }

            const id = uuidv4();
            const targetAudienceJson = target_audience ? JSON.stringify(target_audience) : null;

            await connection.execute(`
                INSERT INTO feature_flags (
                    id, feature_key, feature_name_ar, feature_name_en,
                    description_ar, description_en, is_enabled,
                    enabled_for_ios, enabled_for_android, enabled_for_web,
                    rollout_percentage, target_audience
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, feature_key, feature_name_ar, feature_name_en,
                description_ar, description_en, is_enabled,
                enabled_for_ios, enabled_for_android, enabled_for_web,
                rollout_percentage, targetAudienceJson
            ]);

            // Log admin activity
            await this.logAdminActivity(req.adminUser.id, 'create', 'feature_flag', id, {
                feature_key,
                is_enabled
            });

            res.status(201).json({
                success: true,
                message: 'Feature flag created successfully',
                data: { id, feature_key }
            });

        } catch (error) {
            logger.error('Error creating feature flag:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating feature flag'
            });
        } finally {
            if (connection) await connection.end();
        }
    }

    async updateFeatureFlag(req, res) {
        let connection;
        try {
            const { id } = req.params;
            const {
                feature_name_ar,
                feature_name_en,
                description_ar,
                description_en,
                is_enabled,
                enabled_for_ios,
                enabled_for_android,
                enabled_for_web,
                rollout_percentage,
                target_audience
            } = req.body;

            connection = await this.getConnection();

            // Check if feature flag exists
            const [existing] = await connection.execute(
                'SELECT * FROM feature_flags WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Feature flag not found'
                });
            }

            // Build update query dynamically
            const updates = [];
            const params = [];

            if (feature_name_ar !== undefined) {
                updates.push('feature_name_ar = ?');
                params.push(feature_name_ar);
            }

            if (feature_name_en !== undefined) {
                updates.push('feature_name_en = ?');
                params.push(feature_name_en);
            }

            if (description_ar !== undefined) {
                updates.push('description_ar = ?');
                params.push(description_ar);
            }

            if (description_en !== undefined) {
                updates.push('description_en = ?');
                params.push(description_en);
            }

            if (is_enabled !== undefined) {
                updates.push('is_enabled = ?');
                params.push(is_enabled);
            }

            if (enabled_for_ios !== undefined) {
                updates.push('enabled_for_ios = ?');
                params.push(enabled_for_ios);
            }

            if (enabled_for_android !== undefined) {
                updates.push('enabled_for_android = ?');
                params.push(enabled_for_android);
            }

            if (enabled_for_web !== undefined) {
                updates.push('enabled_for_web = ?');
                params.push(enabled_for_web);
            }

            if (rollout_percentage !== undefined) {
                updates.push('rollout_percentage = ?');
                params.push(rollout_percentage);
            }

            if (target_audience !== undefined) {
                updates.push('target_audience = ?');
                params.push(JSON.stringify(target_audience));
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
            }

            updates.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);

            await connection.execute(`
                UPDATE feature_flags 
                SET ${updates.join(', ')}
                WHERE id = ?
            `, params);

            // Log admin activity
            await this.logAdminActivity(req.adminUser.id, 'update', 'feature_flag', id, {
                feature_key: existing[0].feature_key,
                updated_fields: updates.filter(u => !u.includes('updated_at'))
            });

            res.json({
                success: true,
                message: 'Feature flag updated successfully'
            });

        } catch (error) {
            logger.error('Error updating feature flag:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating feature flag'
            });
        } finally {
            if (connection) await connection.end();
        }
    }

    async deleteFeatureFlag(req, res) {
        let connection;
        try {
            const { id } = req.params;

            connection = await this.getConnection();

            // Check if feature flag exists
            const [existing] = await connection.execute(
                'SELECT feature_key FROM feature_flags WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Feature flag not found'
                });
            }

            await connection.execute(
                'DELETE FROM feature_flags WHERE id = ?',
                [id]
            );

            // Log admin activity
            await this.logAdminActivity(req.adminUser.id, 'delete', 'feature_flag', id, {
                feature_key: existing[0].feature_key
            });

            res.json({
                success: true,
                message: 'Feature flag deleted successfully'
            });

        } catch (error) {
            logger.error('Error deleting feature flag:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting feature flag'
            });
        } finally {
            if (connection) await connection.end();
        }
    }

    // System Health Monitoring
    async getSystemHealth(req, res) {
        let connection;
        try {
            connection = await this.getConnection();

            // Get recent health logs
            const [healthLogs] = await connection.execute(`
                SELECT * FROM system_health_logs 
                ORDER BY created_at DESC 
                LIMIT 50
            `);

            // Calculate system status based on recent logs
            const recentLogs = healthLogs.filter(log => {
                const logTime = new Date(log.created_at);
                const now = new Date();
                return (now - logTime) < 5 * 60 * 1000; // Last 5 minutes
            });

            let systemStatus = 'healthy';
            if (recentLogs.some(log => log.status === 'critical')) {
                systemStatus = 'critical';
            } else if (recentLogs.some(log => log.status === 'error')) {
                systemStatus = 'error';
            } else if (recentLogs.some(log => log.status === 'warning')) {
                systemStatus = 'warning';
            }

            // Get service status summary
            const [serviceSummary] = await connection.execute(`
                SELECT 
                    service_name,
                    status,
                    COUNT(*) as count,
                    MAX(created_at) as last_check
                FROM system_health_logs 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
                GROUP BY service_name, status
                ORDER BY service_name, status
            `);

            res.json({
                success: true,
                data: {
                    system_status: systemStatus,
                    recent_logs: healthLogs.slice(0, 10),
                    service_summary: serviceSummary,
                    last_updated: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('Error fetching system health:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching system health'
            });
        } finally {
            if (connection) await connection.end();
        }
    }

    async getSystemHealthLogs(req, res) {
        let connection;
        try {
            const { service, status, page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            connection = await this.getConnection();

            let query = `
                SELECT * FROM system_health_logs 
                WHERE 1=1
            `;
            const params = [];

            if (service) {
                query += ` AND service_name = ?`;
                params.push(service);
            }

            if (status) {
                query += ` AND status = ?`;
                params.push(status);
            }

            query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), offset);

            const [logs] = await connection.execute(query, params);

            // Get total count for pagination
            let countQuery = `SELECT COUNT(*) as total FROM system_health_logs WHERE 1=1`;
            const countParams = [];

            if (service) {
                countQuery += ` AND service_name = ?`;
                countParams.push(service);
            }

            if (status) {
                countQuery += ` AND status = ?`;
                countParams.push(status);
            }

            const [countResult] = await connection.execute(countQuery, countParams);
            const total = countResult[0].total;

            res.json({
                success: true,
                data: logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            logger.error('Error fetching system health logs:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching system health logs'
            });
        } finally {
            if (connection) await connection.end();
        }
    }

    async checkSystemHealth(req, res) {
        let connection;
        try {
            const { service_name = 'admin_api' } = req.body;

            connection = await this.getConnection();

            // Simulate health check
            const startTime = Date.now();
            
            // Test database connection
            await connection.execute('SELECT 1');
            
            const responseTime = Date.now() - startTime;
            const status = responseTime < 1000 ? 'healthy' : responseTime < 3000 ? 'warning' : 'error';

            // Log health check result
            const id = uuidv4();
            await connection.execute(`
                INSERT INTO system_health_logs (
                    id, service_name, status, message_en, message_ar, 
                    details, response_time_ms
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                id,
                service_name,
                status,
                `Health check completed in ${responseTime}ms`,
                `تم إكمال فحص الصحة في ${responseTime} مللي ثانية`,
                JSON.stringify({
                    timestamp: new Date().toISOString(),
                    response_time_ms: responseTime
                }),
                responseTime
            ]);

            res.json({
                success: true,
                data: {
                    service_name,
                    status,
                    response_time_ms: responseTime,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('Error during system health check:', error);
            
            // Log error
            try {
                const id = uuidv4();
                await connection.execute(`
                    INSERT INTO system_health_logs (
                        id, service_name, status, message_en, message_ar, 
                        details, response_time_ms
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    id,
                    req.body.service_name || 'admin_api',
                    'critical',
                    'Health check failed',
                    'فشل فحص الصحة',
                    JSON.stringify({
                        error: error.message,
                        timestamp: new Date().toISOString()
                    }),
                    0
                ]);
            } catch (logError) {
                logger.error('Error logging health check failure:', logError);
            }

            res.status(500).json({
                success: false,
                message: 'System health check failed'
            });
        } finally {
            if (connection) await connection.end();
        }
    }

    // Helper method to log admin activity
    async logAdminActivity(adminUserId, action, resourceType, resourceId, details) {
        let connection;
        try {
            connection = await this.getConnection();
            
            await connection.execute(`
                INSERT INTO admin_activity_logs (
                    id, admin_user_id, action, resource_type, resource_id, details
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
                uuidv4(),
                adminUserId,
                action,
                resourceType,
                resourceId,
                JSON.stringify(details)
            ]);
        } catch (error) {
            logger.error('Error logging admin activity:', error);
        } finally {
            if (connection) await connection.end();
        }
    }
}

module.exports = new SystemConfigController(); 