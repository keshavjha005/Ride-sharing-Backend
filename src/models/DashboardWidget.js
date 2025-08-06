const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class DashboardWidget {
    constructor(data) {
        this.id = data.id;
        this.widget_key = data.widget_key;
        this.title_ar = data.title_ar;
        this.title_en = data.title_en;
        this.description_ar = data.description_ar;
        this.description_en = data.description_en;
        this.widget_type = data.widget_type;
        this.config = data.config;
        this.position = data.position;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Get localized title based on language
     */
    getTitle(language = 'en') {
        return language === 'ar' ? this.title_ar : this.title_en;
    }

    /**
     * Get localized description based on language
     */
    getDescription(language = 'en') {
        return language === 'ar' ? this.description_ar : this.description_en;
    }

    /**
     * Get parsed config
     */
    getConfig() {
        return typeof this.config === 'string' ? JSON.parse(this.config) : this.config;
    }

    /**
     * Find widget by ID
     */
    static async findById(id) {
        try {
            const rows = await db.executeQuery(
                'SELECT * FROM admin_dashboard_widgets WHERE id = ?',
                [id]
            );
            return rows.length > 0 ? new DashboardWidget(rows[0]) : null;
        } catch (error) {
            console.error('Error finding dashboard widget by ID:', error);
            throw error;
        }
    }

    /**
     * Find widget by key
     */
    static async findByKey(widgetKey) {
        try {
            const rows = await db.executeQuery(
                'SELECT * FROM admin_dashboard_widgets WHERE widget_key = ?',
                [widgetKey]
            );
            return rows.length > 0 ? new DashboardWidget(rows[0]) : null;
        } catch (error) {
            console.error('Error finding dashboard widget by key:', error);
            throw error;
        }
    }

    /**
     * Get all active widgets
     */
    static async findAllActive(language = 'en') {
        try {
            const rows = await db.executeQuery(
                'SELECT * FROM admin_dashboard_widgets WHERE is_active = true ORDER BY position ASC'
            );
            
            return rows.map(row => {
                const widget = new DashboardWidget(row);
                return {
                    ...widget,
                    title: widget.getTitle(language),
                    description: widget.getDescription(language),
                    config: widget.getConfig()
                };
            });
        } catch (error) {
            console.error('Error finding active dashboard widgets:', error);
            throw error;
        }
    }

    /**
     * Create new widget
     */
    static async create(data) {
        try {
            const id = uuidv4();
            const config = typeof data.config === 'object' ? JSON.stringify(data.config) : data.config;
            
            await db.executeQuery(
                `INSERT INTO admin_dashboard_widgets (
                    id, widget_key, title_ar, title_en, description_ar, description_en,
                    widget_type, config, position, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    data.widget_key,
                    data.title_ar || null,
                    data.title_en || null,
                    data.description_ar || null,
                    data.description_en || null,
                    data.widget_type,
                    config,
                    data.position || 0,
                    data.is_active !== undefined ? data.is_active : true
                ]
            );
            
            return this.findById(id);
        } catch (error) {
            console.error('Error creating dashboard widget:', error);
            throw error;
        }
    }

    /**
     * Update widget
     */
    static async update(id, data) {
        try {
            const updateFields = [];
            const updateValues = [];

            if (data.widget_key !== undefined) {
                updateFields.push('widget_key = ?');
                updateValues.push(data.widget_key);
            }
            if (data.title_ar !== undefined) {
                updateFields.push('title_ar = ?');
                updateValues.push(data.title_ar);
            }
            if (data.title_en !== undefined) {
                updateFields.push('title_en = ?');
                updateValues.push(data.title_en);
            }
            if (data.description_ar !== undefined) {
                updateFields.push('description_ar = ?');
                updateValues.push(data.description_ar);
            }
            if (data.description_en !== undefined) {
                updateFields.push('description_en = ?');
                updateValues.push(data.description_en);
            }
            if (data.widget_type !== undefined) {
                updateFields.push('widget_type = ?');
                updateValues.push(data.widget_type);
            }
            if (data.config !== undefined) {
                updateFields.push('config = ?');
                updateValues.push(typeof data.config === 'object' ? JSON.stringify(data.config) : data.config);
            }
            if (data.position !== undefined) {
                updateFields.push('position = ?');
                updateValues.push(data.position);
            }
            if (data.is_active !== undefined) {
                updateFields.push('is_active = ?');
                updateValues.push(data.is_active);
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(id);

            await db.executeQuery(
                `UPDATE admin_dashboard_widgets SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );

            return this.findById(id);
        } catch (error) {
            console.error('Error updating dashboard widget:', error);
            throw error;
        }
    }

    /**
     * Delete widget
     */
    static async delete(id) {
        try {
            const result = await db.executeQuery(
                'DELETE FROM admin_dashboard_widgets WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting dashboard widget:', error);
            throw error;
        }
    }

    /**
     * Get widgets by type
     */
    static async findByType(widgetType, language = 'en') {
        try {
            const rows = await db.executeQuery(
                'SELECT * FROM admin_dashboard_widgets WHERE widget_type = ? AND is_active = true ORDER BY position ASC',
                [widgetType]
            );
            
            return rows.map(row => {
                const widget = new DashboardWidget(row);
                return {
                    ...widget,
                    title: widget.getTitle(language),
                    description: widget.getDescription(language),
                    config: widget.getConfig()
                };
            });
        } catch (error) {
            console.error('Error finding widgets by type:', error);
            throw error;
        }
    }
}

module.exports = DashboardWidget; 