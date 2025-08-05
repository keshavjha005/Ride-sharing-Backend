const Queue = require('bull');
const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Import delivery services
const emailService = require('./emailService');
const smsService = require('./smsService');
const pushNotificationService = require('./pushNotificationService');

class NotificationQueueService {
  constructor() {
    this.redis = null;
    this.queues = {};
    this.initializeRedis();
    this.initializeQueues();
  }

  /**
   * Initialize Redis connection
   */
  initializeRedis() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      this.redis.on('error', (error) => {
        logger.error('Redis connection error:', error);
      });

    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  /**
   * Initialize notification queues
   */
  initializeQueues() {
    try {
      // Email queue
      this.queues.email = new Queue('email-notifications', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: 100,
          removeOnFail: 50
        }
      });

      // SMS queue
      this.queues.sms = new Queue('sms-notifications', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: 100,
          removeOnFail: 50
        }
      });

      // Push notification queue
      this.queues.push = new Queue('push-notifications', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: 100,
          removeOnFail: 50
        }
      });

      // In-app notification queue
      this.queues.inApp = new Queue('in-app-notifications', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD
        },
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: 100,
          removeOnFail: 50
        }
      });

      // Set up queue event handlers
      this.setupQueueEventHandlers();

      // Set up job processors
      this.setupJobProcessors();

      logger.info('Notification queues initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize notification queues:', error);
      throw error;
    }
  }

  /**
   * Set up queue event handlers
   */
  setupQueueEventHandlers() {
    Object.keys(this.queues).forEach(queueName => {
      const queue = this.queues[queueName];

      queue.on('completed', (job, result) => {
        logger.info(`Job completed in ${queueName} queue`, {
          jobId: job.id,
          jobType: job.data.type,
          result
        });
      });

      queue.on('failed', (job, error) => {
        logger.error(`Job failed in ${queueName} queue`, {
          jobId: job.id,
          jobType: job.data.type,
          error: error.message,
          attempts: job.attemptsMade
        });
      });

      queue.on('stalled', (job) => {
        logger.warn(`Job stalled in ${queueName} queue`, {
          jobId: job.id,
          jobType: job.data.type
        });
      });

      queue.on('error', (error) => {
        logger.error(`Queue error in ${queueName} queue:`, error);
      });
    });
  }

  /**
   * Set up job processors
   */
  setupJobProcessors() {
    // Email job processor
    this.queues.email.process(async (job) => {
      return await this.processEmailJob(job);
    });

    // SMS job processor
    this.queues.sms.process(async (job) => {
      return await this.processSMSJob(job);
    });

    // Push notification job processor
    this.queues.push.process(async (job) => {
      return await this.processPushNotificationJob(job);
    });

    // In-app notification job processor
    this.queues.inApp.process(async (job) => {
      return await this.processInAppNotificationJob(job);
    });
  }

  /**
   * Process email job
   */
  async processEmailJob(job) {
    try {
      const { to, subject, content, options } = job.data;
      
      logger.info('Processing email job', {
        jobId: job.id,
        to,
        subject
      });

      const result = await emailService.sendEmail(to, subject, content, options);
      
      // Log delivery result
      await this.logDeliveryResult('email', job.data.notificationId, result);
      
      return result;

    } catch (error) {
      logger.error('Email job processing failed', {
        jobId: job.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process SMS job
   */
  async processSMSJob(job) {
    try {
      const { to, message, options } = job.data;
      
      logger.info('Processing SMS job', {
        jobId: job.id,
        to,
        messageLength: message.length
      });

      const result = await smsService.sendSMS(to, message, options);
      
      // Log delivery result
      await this.logDeliveryResult('sms', job.data.notificationId, result);
      
      return result;

    } catch (error) {
      logger.error('SMS job processing failed', {
        jobId: job.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process push notification job
   */
  async processPushNotificationJob(job) {
    try {
      const { token, notification, data, options } = job.data;
      
      logger.info('Processing push notification job', {
        jobId: job.id,
        token: token.substring(0, 20) + '...',
        title: notification.title
      });

      const result = await pushNotificationService.sendToDevice(token, notification, data, options);
      
      // Log delivery result
      await this.logDeliveryResult('push', job.data.notificationId, result);
      
      return result;

    } catch (error) {
      logger.error('Push notification job processing failed', {
        jobId: job.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process in-app notification job
   */
  async processInAppNotificationJob(job) {
    try {
      const { userId, notification } = job.data;
      
      logger.info('Processing in-app notification job', {
        jobId: job.id,
        userId,
        notificationType: notification.type
      });

      // Send in-app notification via WebSocket
      const socketService = require('./socketService');
      const result = await socketService.sendInAppNotification(userId, notification);
      
      // Log delivery result
      await this.logDeliveryResult('in_app', job.data.notificationId, result);
      
      return result;

    } catch (error) {
      logger.error('In-app notification job processing failed', {
        jobId: job.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Add notification to queue
   */
  async addToQueue(queueName, notificationData, options = {}) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue not found: ${queueName}`);
      }

      const jobId = uuidv4();
      const jobData = {
        ...notificationData,
        jobId,
        timestamp: Date.now()
      };

      const jobOptions = {
        jobId,
        delay: options.delay || 0,
        priority: options.priority || 'normal',
        ...options
      };

      const job = await this.queues[queueName].add(jobData, jobOptions);

      logger.info(`Notification added to ${queueName} queue`, {
        jobId: job.id,
        queueName,
        notificationType: notificationData.type
      });

      return {
        jobId: job.id,
        queueName,
        status: 'queued'
      };

    } catch (error) {
      logger.error(`Failed to add notification to ${queueName} queue:`, error);
      throw error;
    }
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(notificationData, scheduleTime, options = {}) {
    try {
      const delay = scheduleTime.getTime() - Date.now();
      
      if (delay < 0) {
        throw new Error('Schedule time must be in the future');
      }

      return await this.addToQueue(notificationData.queue, notificationData, {
        ...options,
        delay
      });

    } catch (error) {
      logger.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Send notification immediately
   */
  async sendNotification(notificationData, options = {}) {
    try {
      const { type, ...data } = notificationData;
      
      switch (type) {
        case 'email':
          return await emailService.sendEmail(data.to, data.subject, data.content, options);
        
        case 'sms':
          return await smsService.sendSMS(data.to, data.message, options);
        
        case 'push':
          return await pushNotificationService.sendToDevice(data.token, data.notification, data.data, options);
        
        case 'in_app':
          const socketService = require('./socketService');
          return await socketService.sendInAppNotification(data.userId, data.notification);
        
        default:
          throw new Error(`Unsupported notification type: ${type}`);
      }

    } catch (error) {
      logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Send notification with retry logic
   */
  async sendNotificationWithRetry(notificationData, options = {}) {
    try {
      const { type, ...data } = notificationData;
      const queueName = this.getQueueNameForType(type);
      
      return await this.addToQueue(queueName, {
        type,
        ...data
      }, {
        ...options,
        attempts: options.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: options.backoffDelay || 2000
        }
      });

    } catch (error) {
      logger.error('Failed to send notification with retry:', error);
      throw error;
    }
  }

  /**
   * Get queue name for notification type
   */
  getQueueNameForType(type) {
    switch (type) {
      case 'email':
        return 'email';
      case 'sms':
        return 'sms';
      case 'push':
        return 'push';
      case 'in_app':
        return 'inApp';
      default:
        throw new Error(`Unsupported notification type: ${type}`);
    }
  }

  /**
   * Log delivery result
   */
  async logDeliveryResult(method, notificationId, result) {
    try {
      const NotificationLog = require('../models/NotificationLog');
      
      await NotificationLog.create({
        notification_id: notificationId,
        delivery_method: method,
        status: result.success ? 'delivered' : 'failed',
        error_message: result.error || null,
        sent_at: new Date(),
        delivered_at: result.success ? new Date() : null
      });

    } catch (error) {
      logger.error('Failed to log delivery result:', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStatistics() {
    try {
      const stats = {};

      for (const [queueName, queue] of Object.entries(this.queues)) {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaiting(),
          queue.getActive(),
          queue.getCompleted(),
          queue.getFailed(),
          queue.getDelayed()
        ]);

        stats[queueName] = {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
          total: waiting.length + active.length + completed.length + failed.length + delayed.length
        };
      }

      return stats;

    } catch (error) {
      logger.error('Failed to get queue statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up completed jobs
   */
  async cleanupCompletedJobs() {
    try {
      for (const [queueName, queue] of Object.entries(this.queues)) {
        await queue.clean(24 * 60 * 60 * 1000, 'completed'); // Clean jobs older than 24 hours
        await queue.clean(24 * 60 * 60 * 1000, 'failed'); // Clean failed jobs older than 24 hours
      }

      logger.info('Completed jobs cleaned up successfully');

    } catch (error) {
      logger.error('Failed to cleanup completed jobs:', error);
      throw error;
    }
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue not found: ${queueName}`);
      }

      await this.queues[queueName].pause();
      logger.info(`Queue ${queueName} paused successfully`);

    } catch (error) {
      logger.error(`Failed to pause queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue not found: ${queueName}`);
      }

      await this.queues[queueName].resume();
      logger.info(`Queue ${queueName} resumed successfully`);

    } catch (error) {
      logger.error(`Failed to resume queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Test queue service
   */
  async testService() {
    try {
      // Test Redis connection
      await this.redis.ping();
      
      // Test queue operations
      const testJob = await this.queues.email.add({
        type: 'test',
        to: 'test@example.com',
        subject: 'Test Email',
        content: { text: 'Test content', html: '<p>Test content</p>' }
      });

      await testJob.remove();

      return { success: true, message: 'Notification queue service is working' };

    } catch (error) {
      logger.error('Notification queue service test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationQueueService(); 