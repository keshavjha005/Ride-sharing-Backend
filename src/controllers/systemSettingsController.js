const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const auditService = require('../services/auditService');

class SystemSettingsController {
  async getSettings(req, res) {
    try {
      const settings = await executeQuery(
        'SELECT * FROM system_settings ORDER BY category, setting_key'
      );

      // Group settings by category for frontend consumption
      const groupedSettings = settings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
      }, {});

      res.json({
        success: true,
        data: settings,
        grouped: groupedSettings
      });
    } catch (error) {
      logger.error('Error fetching system settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system settings'
      });
    }
  }

  async getSetting(req, res) {
    try {
      const { key } = req.params;
      const [setting] = await executeQuery(
        'SELECT * FROM system_settings WHERE setting_key = ?',
        [key]
      );

      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Setting not found'
        });
      }

      res.json({
        success: true,
        data: setting
      });
    } catch (error) {
      logger.error('Error fetching system setting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system setting'
      });
    }
  }

  async updateSetting(req, res) {
    try {
      const { key } = req.params;
      const { setting_value } = req.body;

      // Get current setting
      const [setting] = await executeQuery(
        'SELECT * FROM system_settings WHERE setting_key = ?',
        [key]
      );

      if (!setting) {
        return res.status(404).json({
          success: false,
          message: 'Setting not found'
        });
      }

      // Check if setting is editable
      if (!setting.is_editable) {
        return res.status(403).json({
          success: false,
          message: 'This setting cannot be modified'
        });
      }

      // Check if setting requires super admin
      const validationRules = JSON.parse(setting.validation_rules || '{}');
      if (validationRules.requires_super_admin && req.admin.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can modify this setting'
        });
      }

      // Validate setting value based on type and rules
      const error = this.validateSettingValue(setting_value, setting.setting_type, validationRules);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error
        });
      }

      // Update the setting
      await executeQuery(
        'UPDATE system_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
        [setting_value, key]
      );

      // Log the change
      await auditService.logSettingChange(req.admin.id, key, setting.setting_value, setting_value, req);

      res.json({
        success: true,
        message: 'Setting updated successfully'
      });
    } catch (error) {
      logger.error('Error updating system setting:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update system setting'
      });
    }
  }

  validateSettingValue(value, type, rules) {
    switch (type) {
      case 'boolean':
        if (value !== 'true' && value !== 'false') {
          return 'Boolean settings must be "true" or "false"';
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
  }


}

module.exports = new SystemSettingsController();