const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class SystemSetting {
    constructor(data) {
        this.id = data.id;
        this.setting_key = data.setting_key;
        this.setting_value = data.setting_value;
        this.setting_type = data.setting_type;
        this.category = data.category;
        this.title_en = data.title_en;
        this.title_ar = data.title_ar;
        this.description_en = data.description_en;
        this.description_ar = data.description_ar;
        this.is_public = data.is_public;
        this.is_editable = data.is_editable;
        this.validation_rules = data.validation_rules;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    /**
     * Get all system settings
     */
    static async findAll() {
        try {
            const rows = await db.executeQuery(
                'SELECT * FROM system_settings ORDER BY category, setting_key'
            );
            return rows.map(row => new SystemSetting(row));
        } catch (error) {
            logger.error('Error finding system settings:', error);
            throw error;
        }
    }

    /**
     * Find setting by key
     */
    static async findByKey(key) {
        try {
            const rows = await db.executeQuery(
                'SELECT * FROM system_settings WHERE setting_key = ?',
                [key]
            );
            return rows.length > 0 ? new SystemSetting(rows[0]) : null;
        } catch (error) {
            logger.error('Error finding system setting by key:', error);
            throw error;
        }
    }

    /**
     * Create new system setting
     */
    static async create(data) {
        try {
            const id = uuidv4();
            const result = await db.executeQuery(
                `INSERT INTO system_settings (
                    id, setting_key, setting_value, setting_type, category,
                    title_en, title_ar, description_en, description_ar,
                    is_public, is_editable, validation_rules
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    data.setting_key,
                    data.setting_value,
                    data.setting_type,
                    data.category,
                    data.title_en,
                    data.title_ar,
                    data.description_en,
                    data.description_ar,
                    data.is_public || false,
                    data.is_editable !== undefined ? data.is_editable : true,
                    data.validation_rules ? JSON.stringify(data.validation_rules) : null
                ]
            );
            return this.findByKey(data.setting_key);
        } catch (error) {
            logger.error('Error creating system setting:', error);
            throw error;
        }
    }

    /**
     * Update system setting
     */
    static async update(key, data) {
        try {
            const updateFields = [];
            const updateValues = [];

            if (data.setting_value !== undefined) {
                updateFields.push('setting_value = ?');
                updateValues.push(data.setting_value);
            }
            if (data.title_en !== undefined) {
                updateFields.push('title_en = ?');
                updateValues.push(data.title_en);
            }
            if (data.title_ar !== undefined) {
                updateFields.push('title_ar = ?');
                updateValues.push(data.title_ar);
            }
            if (data.description_en !== undefined) {
                updateFields.push('description_en = ?');
                updateValues.push(data.description_en);
            }
            if (data.description_ar !== undefined) {
                updateFields.push('description_ar = ?');
                updateValues.push(data.description_ar);
            }
            if (data.is_public !== undefined) {
                updateFields.push('is_public = ?');
                updateValues.push(data.is_public);
            }
            if (data.is_editable !== undefined) {
                updateFields.push('is_editable = ?');
                updateValues.push(data.is_editable);
            }
            if (data.validation_rules !== undefined) {
                updateFields.push('validation_rules = ?');
                updateValues.push(JSON.stringify(data.validation_rules));
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(key);

            const result = await db.executeQuery(
                `UPDATE system_settings SET ${updateFields.join(', ')} WHERE setting_key = ?`,
                updateValues
            );

            return this.findByKey(key);
        } catch (error) {
            logger.error('Error updating system setting:', error);
            throw error;
        }
    }

    /**
     * Delete system setting
     */
    static async delete(key) {
        try {
            const result = await db.executeQuery(
                'DELETE FROM system_settings WHERE setting_key = ?',
                [key]
            );
            return result.affectedRows > 0;
        } catch (error) {
            logger.error('Error deleting system setting:', error);
            throw error;
        }
    }

    /**
     * Get settings by category
     */
    static async findByCategory(category) {
        try {
            const rows = await db.executeQuery(
                'SELECT * FROM system_settings WHERE category = ? ORDER BY setting_key',
                [category]
            );
            return rows.map(row => new SystemSetting(row));
        } catch (error) {
            logger.error('Error finding system settings by category:', error);
            throw error;
        }
    }

    /**
     * Get public settings
     */
    static async findPublic() {
        try {
            const rows = await db.executeQuery(
                'SELECT * FROM system_settings WHERE is_public = true ORDER BY category, setting_key'
            );
            return rows.map(row => new SystemSetting(row));
        } catch (error) {
            logger.error('Error finding public system settings:', error);
            throw error;
        }
    }

    /**
     * Validate setting value based on type and rules
     */
    validateValue(value) {
        try {
            const rules = this.validation_rules ? JSON.parse(this.validation_rules) : {};

            switch (this.setting_type) {
                case 'boolean':
                    if (value !== 'true' && value !== 'false') {
                        return 'Value must be "true" or "false"';
                    }
                    break;

                case 'number':
                    const numValue = Number(value);
                    if (isNaN(numValue)) {
                        return 'Value must be a number';
                    }
                    if (rules.min !== undefined && numValue < rules.min) {
                        return `Value must be at least ${rules.min}`;
                    }
                    if (rules.max !== undefined && numValue > rules.max) {
                        return `Value must be at most ${rules.max}`;
                    }
                    break;

                case 'string':
                    if (rules.pattern) {
                        const regex = new RegExp(rules.pattern);
                        if (!regex.test(value)) {
                            return 'Value does not match required pattern';
                        }
                    }
                    break;

                case 'json':
                    try {
                        JSON.parse(value);
                    } catch (e) {
                        return 'Value must be valid JSON';
                    }
                    break;
            }

            return null;
        } catch (error) {
            logger.error('Error validating setting value:', error);
            return 'Invalid validation rules';
        }
    }
}

module.exports = SystemSetting;