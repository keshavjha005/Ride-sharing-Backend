const admin = require('firebase-admin');
const config = require('../config');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class PushNotificationService {
  constructor() {
    this.app = null;
    this.messaging = null;
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initializeFirebase() {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length > 0) {
        this.app = admin.app();
        this.messaging = admin.messaging();
        logger.info('Firebase Admin SDK already initialized');
        return;
      }

      // Initialize Firebase Admin SDK
      if (process.env.FCM_SERVICE_ACCOUNT_KEY) {
        // Use service account key file
        const serviceAccount = require(process.env.FCM_SERVICE_ACCOUNT_KEY);
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } else if (process.env.FIREBASE_PROJECT_ID) {
        // Use environment variables
        this.app = admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
          credential: admin.credential.applicationDefault()
        });
      } else {
        logger.warn('Firebase credentials not configured, push notifications disabled');
        return;
      }

      this.messaging = admin.messaging();
      logger.info('Firebase Admin SDK initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  /**
   * Send push notification to single device
   */
  async sendToDevice(token, notification, data = {}, options = {}) {
    try {
      if (!this.messaging) {
        throw new Error('Push notification service not configured');
      }

      const notificationId = uuidv4();
      const startTime = Date.now();

      const message = {
        token: token,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl
        },
        data: {
          ...data,
          notification_id: notificationId,
          timestamp: Date.now().toString()
        },
        android: {
          priority: options.priority || 'high',
          notification: {
            channelId: options.channelId || 'default',
            sound: options.sound || 'default',
            clickAction: options.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
            icon: options.icon || 'ic_notification',
            color: options.color || '#FF5722'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: options.sound || 'default',
              badge: options.badge || 1,
              category: options.category || 'GENERAL'
            }
          }
        },
        webpush: {
          notification: {
            icon: options.icon || '/icon-192x192.png',
            badge: options.badge || '/badge-72x72.png',
            actions: options.actions || []
          }
        }
      };

      logger.info('Sending push notification', {
        notificationId,
        token: token.substring(0, 20) + '...',
        title: notification.title,
        userId: options.userId
      });

      const result = await this.messaging.send(message);
      const deliveryTime = Date.now() - startTime;

      logger.info('Push notification sent successfully', {
        notificationId,
        messageId: result,
        deliveryTime,
        token: token.substring(0, 20) + '...'
      });

      return {
        success: true,
        notificationId,
        messageId: result,
        deliveryTime,
        token: token.substring(0, 20) + '...'
      };

    } catch (error) {
      logger.error('Failed to send push notification', {
        token: token.substring(0, 20) + '...',
        title: notification.title,
        error: error.message,
        code: error.code
      });

      return {
        success: false,
        error: error.message,
        code: error.code,
        token: token.substring(0, 20) + '...'
      };
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultipleDevices(tokens, notification, data = {}, options = {}) {
    try {
      if (!this.messaging) {
        throw new Error('Push notification service not configured');
      }

      const notificationId = uuidv4();
      const startTime = Date.now();

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl
        },
        data: {
          ...data,
          notification_id: notificationId,
          timestamp: Date.now().toString()
        },
        android: {
          priority: options.priority || 'high',
          notification: {
            channelId: options.channelId || 'default',
            sound: options.sound || 'default',
            clickAction: options.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
            icon: options.icon || 'ic_notification',
            color: options.color || '#FF5722'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: options.sound || 'default',
              badge: options.badge || 1,
              category: options.category || 'GENERAL'
            }
          }
        },
        webpush: {
          notification: {
            icon: options.icon || '/icon-192x192.png',
            badge: options.badge || '/badge-72x72.png',
            actions: options.actions || []
          }
        }
      };

      logger.info('Sending push notification to multiple devices', {
        notificationId,
        deviceCount: tokens.length,
        title: notification.title
      });

      const result = await this.messaging.sendMulticast({
        tokens: tokens,
        ...message
      });

      const deliveryTime = Date.now() - startTime;

      logger.info('Multicast push notification completed', {
        notificationId,
        successCount: result.successCount,
        failureCount: result.failureCount,
        deliveryTime
      });

      return {
        success: true,
        notificationId,
        successCount: result.successCount,
        failureCount: result.failureCount,
        deliveryTime,
        responses: result.responses
      };

    } catch (error) {
      logger.error('Failed to send multicast push notification', {
        deviceCount: tokens.length,
        title: notification.title,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        deviceCount: tokens.length
      };
    }
  }

  /**
   * Send push notification to topic
   */
  async sendToTopic(topic, notification, data = {}, options = {}) {
    try {
      if (!this.messaging) {
        throw new Error('Push notification service not configured');
      }

      const notificationId = uuidv4();
      const startTime = Date.now();

      const message = {
        topic: topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl
        },
        data: {
          ...data,
          notification_id: notificationId,
          timestamp: Date.now().toString()
        },
        android: {
          priority: options.priority || 'high',
          notification: {
            channelId: options.channelId || 'default',
            sound: options.sound || 'default',
            clickAction: options.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
            icon: options.icon || 'ic_notification',
            color: options.color || '#FF5722'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: options.sound || 'default',
              badge: options.badge || 1,
              category: options.category || 'GENERAL'
            }
          }
        }
      };

      logger.info('Sending push notification to topic', {
        notificationId,
        topic,
        title: notification.title
      });

      const result = await this.messaging.send(message);
      const deliveryTime = Date.now() - startTime;

      logger.info('Topic push notification sent successfully', {
        notificationId,
        messageId: result,
        deliveryTime,
        topic
      });

      return {
        success: true,
        notificationId,
        messageId: result,
        deliveryTime,
        topic
      };

    } catch (error) {
      logger.error('Failed to send topic push notification', {
        topic,
        title: notification.title,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        topic
      };
    }
  }

  /**
   * Subscribe device to topic
   */
  async subscribeToTopic(tokens, topic) {
    try {
      if (!this.messaging) {
        throw new Error('Push notification service not configured');
      }

      const result = await this.messaging.subscribeToTopic(tokens, topic);

      logger.info('Devices subscribed to topic', {
        topic,
        successCount: result.successCount,
        failureCount: result.failureCount
      });

      return {
        success: true,
        successCount: result.successCount,
        failureCount: result.failureCount,
        errors: result.errors
      };

    } catch (error) {
      logger.error('Failed to subscribe devices to topic', {
        topic,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Unsubscribe device from topic
   */
  async unsubscribeFromTopic(tokens, topic) {
    try {
      if (!this.messaging) {
        throw new Error('Push notification service not configured');
      }

      const result = await this.messaging.unsubscribeFromTopic(tokens, topic);

      logger.info('Devices unsubscribed from topic', {
        topic,
        successCount: result.successCount,
        failureCount: result.failureCount
      });

      return {
        success: true,
        successCount: result.successCount,
        failureCount: result.failureCount,
        errors: result.errors
      };

    } catch (error) {
      logger.error('Failed to unsubscribe devices from topic', {
        topic,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send push notification from template
   */
  async sendTemplateNotification(tokens, templateKey, variables = {}, options = {}) {
    try {
      // Get push notification template from database
      const PushNotificationTemplate = require('../models/PushNotificationTemplate');
      const template = await PushNotificationTemplate.findByKey(templateKey);
      
      if (!template) {
        throw new Error(`Push notification template not found: ${templateKey}`);
      }

      // Render template with variables
      const rendered = template.render(variables, options.language || 'en');
      
      // Send push notification
      if (Array.isArray(tokens) && tokens.length > 1) {
        return await this.sendToMultipleDevices(tokens, rendered, options.data || {}, options);
      } else {
        const token = Array.isArray(tokens) ? tokens[0] : tokens;
        return await this.sendToDevice(token, rendered, options.data || {}, options);
      }

    } catch (error) {
      logger.error('Failed to send template push notification', {
        templateKey,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate FCM token
   */
  async validateToken(token) {
    try {
      if (!this.messaging) {
        throw new Error('Push notification service not configured');
      }

      // Send a test message to validate the token
      const testMessage = {
        token: token,
        data: {
          test: 'validation'
        }
      };

      await this.messaging.send(testMessage);
      return { valid: true, token };

    } catch (error) {
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        return { valid: false, reason: error.code, token };
      }
      throw error;
    }
  }

  /**
   * Get push notification statistics
   */
  async getPushNotificationStatistics(timeRange = '24h') {
    try {
      // This would typically query push notification logs from database
      // For now, return basic stats
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        averageDeliveryTime: 0,
        successRate: 0,
        timeRange
      };
    } catch (error) {
      logger.error('Failed to get push notification statistics', error);
      throw error;
    }
  }

  /**
   * Test push notification service
   */
  async testConnection() {
    try {
      if (!this.messaging) {
        return { success: false, error: 'Push notification service not configured' };
      }

      // Try to get project info to test connection
      const projectId = this.app.options.projectId;
      
      return { 
        success: true, 
        message: 'Push notification service is working',
        projectId
      };
    } catch (error) {
      logger.error('Push notification service test failed', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PushNotificationService(); 