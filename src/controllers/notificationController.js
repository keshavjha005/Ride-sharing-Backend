const NotificationTemplate = require('../models/NotificationTemplate');
const UserNotification = require('../models/UserNotification');
const UserNotificationPreferences = require('../models/UserNotificationPreferences');
const FCMToken = require('../models/FCMToken');
const NotificationLog = require('../models/NotificationLog');
const logger = require('../utils/logger');

// Import delivery services
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const pushNotificationService = require('../services/pushNotificationService');
const notificationQueueService = require('../services/notificationQueueService');

class NotificationController {
  /**
   * Get all notification templates
   */
  static async getTemplates(req, res) {
    try {
      const { notification_type, category, is_active, limit = 50, offset = 0 } = req.query;
      
      const filters = {};
      if (notification_type) filters.notification_type = notification_type;
      if (category) filters.category = category;
      if (is_active !== undefined) filters.is_active = is_active === 'true';
      if (limit) filters.limit = parseInt(limit);
      if (offset) filters.offset = parseInt(offset);

      const templates = await NotificationTemplate.findAll(filters);
      
      res.json({
        success: true,
        data: templates,
        pagination: {
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          count: templates.length
        }
      });
    } catch (error) {
      logger.error('Error getting notification templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification templates',
        error: error.message
      });
    }
  }

  /**
   * Get notification template by ID
   */
  static async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const template = await NotificationTemplate.findById(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Notification template not found'
        });
      }
      
      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      logger.error('Error getting notification template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification template',
        error: error.message
      });
    }
  }

  /**
   * Create notification template
   */
  static async createTemplate(req, res) {
    try {
      const templateData = req.body;
      
      // Validate template data
      const errors = NotificationTemplate.validate(templateData);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      const template = await NotificationTemplate.create(templateData);
      
      res.status(201).json({
        success: true,
        message: 'Notification template created successfully',
        data: template
      });
    } catch (error) {
      logger.error('Error creating notification template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notification template',
        error: error.message
      });
    }
  }

  /**
   * Update notification template
   */
  static async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const template = await NotificationTemplate.findById(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Notification template not found'
        });
      }

      const updatedTemplate = await template.update(updateData);
      
      res.json({
        success: true,
        message: 'Notification template updated successfully',
        data: updatedTemplate
      });
    } catch (error) {
      logger.error('Error updating notification template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification template',
        error: error.message
      });
    }
  }

  /**
   * Delete notification template
   */
  static async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      
      const template = await NotificationTemplate.findById(id);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Notification template not found'
        });
      }

      await template.delete();
      
      res.json({
        success: true,
        message: 'Notification template deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting notification template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification template',
        error: error.message
      });
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { notification_type, is_read, is_sent, priority, limit = 50, offset = 0 } = req.query;
      
      const filters = {};
      if (notification_type) filters.notification_type = notification_type;
      if (is_read !== undefined) filters.is_read = is_read === 'true';
      if (is_sent !== undefined) filters.is_sent = is_sent === 'true';
      if (priority) filters.priority = priority;
      if (limit) filters.limit = parseInt(limit);
      if (offset) filters.offset = parseInt(offset);

      const notifications = await UserNotification.findByUserId(userId, filters);
      const totalCount = await UserNotification.getCountByUserId(userId, filters);
      
      res.json({
        success: true,
        data: notifications,
        pagination: {
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          total: totalCount,
          count: notifications.length
        }
      });
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user notifications',
        error: error.message
      });
    }
  }

  /**
   * Get user notification by ID
   */
  static async getUserNotificationById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const notification = await UserNotification.findById(id);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      // Check if notification belongs to user
      if (notification.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      logger.error('Error getting user notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user notification',
        error: error.message
      });
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const notification = await UserNotification.findById(id);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      // Check if notification belongs to user
      if (notification.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const updatedNotification = await notification.markAsRead();
      
      res.json({
        success: true,
        message: 'Notification marked as read',
        data: updatedNotification
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  /**
   * Mark multiple notifications as read
   */
  static async markMultipleNotificationsAsRead(req, res) {
    try {
      const { notification_ids } = req.body;
      const userId = req.user.id;
      
      if (!notification_ids || !Array.isArray(notification_ids)) {
        return res.status(400).json({
          success: false,
          message: 'Notification IDs array is required'
        });
      }

      // Verify all notifications belong to user
      const notifications = await Promise.all(
        notification_ids.map(id => UserNotification.findById(id))
      );

      const invalidNotifications = notifications.filter(n => !n || n.user_id !== userId);
      if (invalidNotifications.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Some notifications are not accessible'
        });
      }

      await UserNotification.markMultipleAsRead(notification_ids);
      
      res.json({
        success: true,
        message: `${notification_ids.length} notifications marked as read`
      });
    } catch (error) {
      logger.error('Error marking multiple notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read',
        error: error.message
      });
    }
  }

  /**
   * Delete user notification
   */
  static async deleteUserNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const notification = await UserNotification.findById(id);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      // Check if notification belongs to user
      if (notification.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await notification.delete();
      
      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting user notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user notification',
        error: error.message
      });
    }
  }

  /**
   * Get user notification preferences
   */
  static async getUserNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;
      
      let preferences = await UserNotificationPreferences.findByUserId(userId);
      if (!preferences) {
        // Create default preferences
        preferences = await UserNotificationPreferences.findOrCreate(userId);
      }
      
      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      logger.error('Error getting user notification preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user notification preferences',
        error: error.message
      });
    }
  }

  /**
   * Update user notification preferences
   */
  static async updateUserNotificationPreferences(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      let preferences = await UserNotificationPreferences.findByUserId(userId);
      if (!preferences) {
        preferences = await UserNotificationPreferences.findOrCreate(userId);
      }

      const updatedPreferences = await preferences.update(updateData);
      
      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: updatedPreferences
      });
    } catch (error) {
      logger.error('Error updating user notification preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user notification preferences',
        error: error.message
      });
    }
  }

  /**
   * Register FCM token
   */
  static async registerFCMToken(req, res) {
    try {
      const userId = req.user.id;
      const { token, device_type, device_id, app_version } = req.body;
      
      if (!token || !device_type) {
        return res.status(400).json({
          success: false,
          message: 'Token and device type are required'
        });
      }

      const tokenData = {
        token,
        device_type,
        device_id,
        app_version
      };

      const fcmToken = await FCMToken.registerToken(userId, tokenData);
      
      res.json({
        success: true,
        message: 'FCM token registered successfully',
        data: fcmToken
      });
    } catch (error) {
      logger.error('Error registering FCM token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register FCM token',
        error: error.message
      });
    }
  }

  /**
   * Delete FCM token
   */
  static async deleteFCMToken(req, res) {
    try {
      const { token } = req.params;
      const userId = req.user.id;
      
      const fcmToken = await FCMToken.findByToken(token);
      if (!fcmToken) {
        return res.status(404).json({
          success: false,
          message: 'FCM token not found'
        });
      }

      // Check if token belongs to user
      if (fcmToken.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await fcmToken.delete();
      
      res.json({
        success: true,
        message: 'FCM token deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting FCM token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete FCM token',
        error: error.message
      });
    }
  }

  /**
   * Send notification to user
   */
  static async sendNotification(req, res) {
    try {
      const { user_id, template_key, variables, data, priority } = req.body;
      
      if (!user_id || !template_key) {
        return res.status(400).json({
          success: false,
          message: 'User ID and template key are required'
        });
      }

      // Check user preferences
      const preferences = await UserNotificationPreferences.findByUserId(user_id);
      if (preferences && preferences.isInQuietHours()) {
        return res.status(200).json({
          success: true,
          message: 'Notification scheduled (quiet hours)',
          data: { scheduled: true }
        });
      }

      const notification = await UserNotification.createFromTemplate(
        user_id,
        template_key,
        variables || {},
        data || {}
      );

      // Override priority if provided
      if (priority) {
        await notification.update({ priority });
      }
      
      res.json({
        success: true,
        message: 'Notification sent successfully',
        data: notification
      });
    } catch (error) {
      logger.error('Error sending notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notification',
        error: error.message
      });
    }
  }

  /**
   * Send bulk notifications
   */
  static async sendBulkNotifications(req, res) {
    try {
      const { user_ids, template_key, variables, data, priority } = req.body;
      
      if (!user_ids || !Array.isArray(user_ids) || !template_key) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array and template key are required'
        });
      }

      const results = [];
      const errors = [];

      for (const userId of user_ids) {
        try {
          // Check user preferences
          const preferences = await UserNotificationPreferences.findByUserId(userId);
          if (preferences && preferences.isInQuietHours()) {
            results.push({ user_id: userId, status: 'scheduled', reason: 'quiet_hours' });
            continue;
          }

          const notification = await UserNotification.createFromTemplate(
            userId,
            template_key,
            variables || {},
            data || {}
          );

          // Override priority if provided
          if (priority) {
            await notification.update({ priority });
          }

          results.push({ user_id: userId, status: 'sent', notification_id: notification.id });
        } catch (error) {
          errors.push({ user_id: userId, error: error.message });
        }
      }
      
      res.json({
        success: true,
        message: `Processed ${user_ids.length} notifications`,
        data: {
          results,
          errors,
          summary: {
            total: user_ids.length,
            sent: results.filter(r => r.status === 'sent').length,
            scheduled: results.filter(r => r.status === 'scheduled').length,
            errors: errors.length
          }
        }
      });
    } catch (error) {
      logger.error('Error sending bulk notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk notifications',
        error: error.message
      });
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStatistics(req, res) {
    try {
      const userId = req.user.id;
      
      const [
        notificationStats,
        unreadCount,
        preferences
      ] = await Promise.all([
        UserNotification.getStatisticsByUserId(userId),
        UserNotification.getUnreadCountByUserId(userId),
        UserNotificationPreferences.findByUserId(userId)
      ]);
      
      res.json({
        success: true,
        data: {
          notification_stats: notificationStats,
          unread_count: unreadCount,
          preferences
        }
      });
    } catch (error) {
      logger.error('Error getting notification statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification statistics',
        error: error.message
      });
    }
  }

  /**
   * Get delivery statistics (admin only)
   */
  static async getDeliveryStatistics(req, res) {
    try {
      const { delivery_method, notification_type, date_from, date_to } = req.query;
      
      const filters = {};
      if (delivery_method) filters.delivery_method = delivery_method;
      if (notification_type) filters.notification_type = notification_type;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      const [
        deliveryStats,
        successRate,
        deliveryTimeStats
      ] = await Promise.all([
        NotificationLog.getDeliveryStatistics(filters),
        NotificationLog.getDeliverySuccessRate(filters),
        NotificationLog.getDeliveryTimeStatistics(filters)
      ]);
      
      res.json({
        success: true,
        data: {
          delivery_statistics: deliveryStats,
          success_rate: successRate,
          delivery_time_statistics: deliveryTimeStats
        }
      });
    } catch (error) {
      logger.error('Error getting delivery statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get delivery statistics',
        error: error.message
      });
    }
  }

  /**
   * Send email notification
   */
  static async sendEmailNotification(req, res) {
    try {
      const { to, template_key, variables, options } = req.body;
      
      if (!to || !template_key) {
        return res.status(400).json({
          success: false,
          message: 'Email address and template key are required'
        });
      }

      const result = await emailService.sendTemplateEmail(to, template_key, variables || {}, options || {});
      
      res.json({
        success: true,
        message: 'Email notification sent successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error sending email notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send email notification',
        error: error.message
      });
    }
  }

  /**
   * Send SMS notification
   */
  static async sendSMSNotification(req, res) {
    try {
      const { to, template_key, variables, options } = req.body;
      
      if (!to || !template_key) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and template key are required'
        });
      }

      const result = await smsService.sendTemplateSMS(to, template_key, variables || {}, options || {});
      
      res.json({
        success: true,
        message: 'SMS notification sent successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error sending SMS notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send SMS notification',
        error: error.message
      });
    }
  }

  /**
   * Send push notification
   */
  static async sendPushNotification(req, res) {
    try {
      const { token, template_key, variables, data, options } = req.body;
      
      if (!token || !template_key) {
        return res.status(400).json({
          success: false,
          message: 'FCM token and template key are required'
        });
      }

      const result = await pushNotificationService.sendTemplateNotification(token, template_key, variables || {}, {
        ...options,
        data: data || {}
      });
      
      res.json({
        success: true,
        message: 'Push notification sent successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error sending push notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send push notification',
        error: error.message
      });
    }
  }

  /**
   * Send in-app notification
   */
  static async sendInAppNotification(req, res) {
    try {
      const { user_id, notification } = req.body;
      
      if (!user_id || !notification) {
        return res.status(400).json({
          success: false,
          message: 'User ID and notification data are required'
        });
      }

      const socketService = require('../services/socketService');
      const result = await socketService.sendInAppNotification(user_id, notification);
      
      res.json({
        success: true,
        message: 'In-app notification sent successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error sending in-app notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send in-app notification',
        error: error.message
      });
    }
  }

  /**
   * Send notification with retry logic
   */
  static async sendNotificationWithRetry(req, res) {
    try {
      const { notificationData, options } = req.body;
      
      if (!notificationData || !notificationData.type) {
        return res.status(400).json({
          success: false,
          message: 'Notification data with type is required'
        });
      }

      const result = await notificationQueueService.sendNotificationWithRetry(notificationData, options || {});
      
      res.json({
        success: true,
        message: 'Notification queued for delivery with retry',
        data: result
      });
    } catch (error) {
      logger.error('Error sending notification with retry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notification with retry',
        error: error.message
      });
    }
  }

  /**
   * Schedule notification
   */
  static async scheduleNotification(req, res) {
    try {
      const { notificationData, scheduleTime, options } = req.body;
      
      if (!notificationData || !scheduleTime) {
        return res.status(400).json({
          success: false,
          message: 'Notification data and schedule time are required'
        });
      }

      const scheduleDate = new Date(scheduleTime);
      if (isNaN(scheduleDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid schedule time format'
        });
      }

      const result = await notificationQueueService.scheduleNotification(notificationData, scheduleDate, options || {});
      
      res.json({
        success: true,
        message: 'Notification scheduled successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error scheduling notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule notification',
        error: error.message
      });
    }
  }

  /**
   * Get admin notifications
   */
  static async getAdminNotifications(req, res) {
    try {
      const { page = 1, limit = 20, type, read } = req.query;
      const offset = (page - 1) * limit;

      const filters = {
        recipient_type: 'admin',
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      if (type) filters.notification_type = type;
      if (read !== undefined) filters.is_read = read === 'true';

      const notifications = await UserNotification.findAll(filters);

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: notifications.length
          }
        }
      });
    } catch (error) {
      logger.error('Error getting admin notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get admin notifications',
        error: error.message
      });
    }
  }

  /**
   * Mark all notifications as read for admin
   */
  static async markAllNotificationsAsRead(req, res) {
    try {
      const adminId = req.admin.id;
      
      await UserNotification.markAllAsRead(adminId, 'admin');

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notifications as read',
        error: error.message
      });
    }
  }

  /**
   * Mark specific notification as read
   */
  static async markNotificationAsRead(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.admin.id;

      await UserNotification.markAsRead(id, adminId);

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStatistics(req, res) {
    try {
      const stats = await notificationQueueService.getQueueStatistics();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting queue statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get queue statistics',
        error: error.message
      });
    }
  }

  /**
   * Test delivery services
   */
  static async testDeliveryServices(req, res) {
    try {
      const results = {
        email: await emailService.testConnection(),
        sms: await smsService.testConnection(),
        push: await pushNotificationService.testConnection(),
        queue: await notificationQueueService.testService()
      };
      
      res.json({
        success: true,
        message: 'Delivery services test completed',
        data: results
      });
    } catch (error) {
      logger.error('Error testing delivery services:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test delivery services',
        error: error.message
      });
    }
  }
}

module.exports = NotificationController; 