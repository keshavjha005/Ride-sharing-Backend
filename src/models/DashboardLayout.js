const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class DashboardLayout {
    constructor(data) {
        this.id = data.id;
        this.admin_user_id = data.admin_user_id;
        this.layout_name = data.layout_name;
        this.layout_config = data.layout_config;
        this.is_default = data.is_default;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Get parsed layout config
     */
    getLayoutConfig() {
        return typeof this.layout_config === 'string' ? JSON.parse(this.layout_config) : this.layout_config;
    }

    /**
     * Find layout by ID
     */
    static async findById(id) {
        try {
            const rows = await db.executeQuery(
                'SELECT * FROM admin_dashboard_layouts WHERE id = ?',
                [id]
            );
            return rows.length > 0 ? new DashboardLayout(rows[0]) : null;
        } catch (error) {
            console.error('Error finding dashboard layout by ID:', error);
            throw error;
        }
    }

    /**
     * Get default layout for admin user
     */
    static async getDefaultLayout(adminUserId) {
        try {
            const rows = await db.executeQuery(
                'SELECT * FROM admin_dashboard_layouts WHERE admin_user_id = ? AND is_default = true',
                [adminUserId]
            );
            return rows.length > 0 ? new DashboardLayout(rows[0]) : null;
        } catch (error) {
            console.error('Error finding default dashboard layout:', error);
            throw error;
        }
    }

    /**
     * Get all layouts for admin user
     */
    static async findByAdminUser(adminUserId) {
        try {
            const rows = await db.executeQuery(
                'SELECT * FROM admin_dashboard_layouts WHERE admin_user_id = ? ORDER BY is_default DESC, created_at DESC',
                [adminUserId]
            );
            return rows.map(row => new DashboardLayout(row));
        } catch (error) {
            console.error('Error finding dashboard layouts by admin user:', error);
            throw error;
        }
    }

    /**
     * Create new layout
     */
    static async create(data) {
        try {
            const id = uuidv4();
            const layoutConfig = typeof data.layout_config === 'object' ? JSON.stringify(data.layout_config) : data.layout_config;
            
            // If this is set as default, unset other defaults for this user
            if (data.is_default) {
                await db.executeQuery(
                    'UPDATE admin_dashboard_layouts SET is_default = false WHERE admin_user_id = ?',
                    [data.admin_user_id]
                );
            }
            
            await db.executeQuery(
                `INSERT INTO admin_dashboard_layouts (
                    id, admin_user_id, layout_name, layout_config, is_default
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    id,
                    data.admin_user_id,
                    data.layout_name,
                    layoutConfig,
                    data.is_default || false
                ]
            );
            
            return this.findById(id);
        } catch (error) {
            console.error('Error creating dashboard layout:', error);
            throw error;
        }
    }

    /**
     * Update layout
     */
    static async update(id, data) {
        try {
            const updateFields = [];
            const updateValues = [];

            if (data.layout_name !== undefined) {
                updateFields.push('layout_name = ?');
                updateValues.push(data.layout_name);
            }
            if (data.layout_config !== undefined) {
                updateFields.push('layout_config = ?');
                updateValues.push(typeof data.layout_config === 'object' ? JSON.stringify(data.layout_config) : data.layout_config);
            }
            if (data.is_default !== undefined) {
                updateFields.push('is_default = ?');
                updateValues.push(data.is_default);
                
                // If setting as default, unset other defaults for this user
                if (data.is_default) {
                    const layout = await this.findById(id);
                    if (layout) {
                        await db.executeQuery(
                            'UPDATE admin_dashboard_layouts SET is_default = false WHERE admin_user_id = ? AND id != ?',
                            [layout.admin_user_id, id]
                        );
                    }
                }
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(id);

            await db.executeQuery(
                `UPDATE admin_dashboard_layouts SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            return this.findById(id);
        } catch (error) {
            console.error('Error updating dashboard layout:', error);
            throw error;
        }
    }

    /**
     * Delete layout
     */
    static async delete(id) {
        try {
            const result = await db.executeQuery(
                'DELETE FROM admin_dashboard_layouts WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting dashboard layout:', error);
            throw error;
        }
    }

    /**
     * Set layout as default
     */
    static async setAsDefault(id) {
        try {
            const layout = await this.findById(id);
            if (!layout) {
                throw new Error('Layout not found');
            }

            // Unset other defaults for this user
            await db.executeQuery(
                'UPDATE admin_dashboard_layouts SET is_default = false WHERE admin_user_id = ?',
                [layout.admin_user_id]
            );

            // Set this layout as default
            await db.executeQuery(
                'UPDATE admin_dashboard_layouts SET is_default = true WHERE id = ?',
                [id]
            );

            return this.findById(id);
        } catch (error) {
            console.error('Error setting layout as default:', error);
            throw error;
        }
    }

    /**
     * Get layout with widgets data
     */
    static async getLayoutWithWidgets(adminUserId, language = 'en') {
        try {
            const layout = await this.getDefaultLayout(adminUserId);
            if (!layout) {
                return null;
            }

            const layoutConfig = layout.getLayoutConfig();
            const DashboardWidget = require('./DashboardWidget');

            // Get all widgets
            const widgets = await DashboardWidget.findAllActive(language);
            const widgetsMap = {};
            widgets.forEach(widget => {
                widgetsMap[widget.widget_key] = widget;
            });

            // Add widget data to layout config
            if (layoutConfig.widgets) {
                layoutConfig.widgets = layoutConfig.widgets.map(widgetConfig => {
                    const widget = widgetsMap[widgetConfig.widget_key];
                    return {
                        ...widgetConfig,
                        widget: widget || null
                    };
                });
            }

            return {
                ...layout,
                layout_config: layoutConfig
            };
        } catch (error) {
            console.error('Error getting layout with widgets:', error);
            throw error;
        }
    }
}

module.exports = DashboardLayout; 