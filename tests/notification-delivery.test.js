const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/database');
const logger = require('../src/utils/logger');

// Mock external services
jest.mock('../src/services/emailService');
jest.mock('../src/services/smsService');
jest.mock('../src/services/pushNotificationService');
jest.mock('../src/services/notificationQueueService');

const emailService = require('../src/services/emailService');
const smsService = require('../src/services/smsService');
const pushNotificationService = require('../src/services/pushNotificationService');
const notificationQueueService = require('../src/services/notificationQueueService');

describe('Notification Delivery System', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Create test user and get auth token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!',
        first_name: 'Test',
        last_name: 'User',
        phone: '+966501234567'
      });

    authToken = userResponse.body.data.token;
    testUserId = userResponse.body.data.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.execute('DELETE FROM users WHERE email = ?', ['test@example.com']);
    await pool.end();
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Email Notification Delivery', () => {
    it('should send email notification successfully', async () => {
      // Mock email service
      emailService.sendTemplateEmail.mockResolvedValue({
        success: true,
        emailId: 'test-email-id',
        messageId: 'test-message-id',
        deliveryTime: 150,
        to: 'test@example.com'
      });

      const response = await request(app)
        .post('/api/notifications/send-email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: 'test@example.com',
          template_key: 'welcome_email',
          variables: {
            name: 'Test User'
          },
          options: {
            language: 'en'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email notification sent successfully');
      expect(emailService.sendTemplateEmail).toHaveBeenCalledWith(
        'test@example.com',
        'welcome_email',
        { name: 'Test User' },
        { language: 'en' }
      );
    });

    it('should handle email service errors', async () => {
      // Mock email service error
      emailService.sendTemplateEmail.mockRejectedValue(new Error('Email service unavailable'));

      const response = await request(app)
        .post('/api/notifications/send-email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: 'test@example.com',
          template_key: 'welcome_email',
          variables: { name: 'Test User' }
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to send email notification');
    });

    it('should validate required fields for email notification', async () => {
      const response = await request(app)
        .post('/api/notifications/send-email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: 'test@example.com'
          // Missing template_key
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email address and template key are required');
    });
  });

  describe('SMS Notification Delivery', () => {
    it('should send SMS notification successfully', async () => {
      // Mock SMS service
      smsService.sendTemplateSMS.mockResolvedValue({
        success: true,
        smsId: 'test-sms-id',
        messageSid: 'test-message-sid',
        deliveryTime: 200,
        to: '+966501234567',
        status: 'delivered'
      });

      const response = await request(app)
        .post('/api/notifications/send-sms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: '+966501234567',
          template_key: 'welcome_sms',
          variables: {
            name: 'Test User'
          },
          options: {
            language: 'en'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('SMS notification sent successfully');
      expect(smsService.sendTemplateSMS).toHaveBeenCalledWith(
        '+966501234567',
        'welcome_sms',
        { name: 'Test User' },
        { language: 'en' }
      );
    });

    it('should handle SMS service errors', async () => {
      // Mock SMS service error
      smsService.sendTemplateSMS.mockRejectedValue(new Error('SMS service unavailable'));

      const response = await request(app)
        .post('/api/notifications/send-sms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: '+966501234567',
          template_key: 'welcome_sms',
          variables: { name: 'Test User' }
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to send SMS notification');
    });

    it('should validate required fields for SMS notification', async () => {
      const response = await request(app)
        .post('/api/notifications/send-sms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          template_key: 'welcome_sms'
          // Missing to
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Phone number and template key are required');
    });
  });

  describe('Push Notification Delivery', () => {
    it('should send push notification successfully', async () => {
      // Mock push notification service
      pushNotificationService.sendTemplateNotification.mockResolvedValue({
        success: true,
        notificationId: 'test-notification-id',
        messageId: 'test-message-id',
        deliveryTime: 100,
        token: 'test-fcm-token'
      });

      const response = await request(app)
        .post('/api/notifications/send-push')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          token: 'test-fcm-token',
          template_key: 'ride_confirmation',
          variables: {
            pickup: 'Home',
            destination: 'Work'
          },
          data: {
            ride_id: 'test-ride-id'
          },
          options: {
            priority: 'high'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Push notification sent successfully');
      expect(pushNotificationService.sendTemplateNotification).toHaveBeenCalledWith(
        'test-fcm-token',
        'ride_confirmation',
        { pickup: 'Home', destination: 'Work' },
        {
          priority: 'high',
          data: { ride_id: 'test-ride-id' }
        }
      );
    });

    it('should handle push notification service errors', async () => {
      // Mock push notification service error
      pushNotificationService.sendTemplateNotification.mockRejectedValue(
        new Error('Push notification service unavailable')
      );

      const response = await request(app)
        .post('/api/notifications/send-push')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          token: 'test-fcm-token',
          template_key: 'ride_confirmation',
          variables: { pickup: 'Home', destination: 'Work' }
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to send push notification');
    });
  });

  describe('In-App Notification Delivery', () => {
    it('should send in-app notification successfully', async () => {
      const response = await request(app)
        .post('/api/notifications/send-in-app')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          user_id: testUserId,
          notification: {
            type: 'ride_update',
            title: 'Ride Update',
            body: 'Your ride has been confirmed',
            data: {
              ride_id: 'test-ride-id'
            }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('In-app notification sent successfully');
    });

    it('should validate required fields for in-app notification', async () => {
      const response = await request(app)
        .post('/api/notifications/send-in-app')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          user_id: testUserId
          // Missing notification
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User ID and notification data are required');
    });
  });

  describe('Notification Queue System', () => {
    it('should send notification with retry logic', async () => {
      // Mock queue service
      notificationQueueService.sendNotificationWithRetry.mockResolvedValue({
        jobId: 'test-job-id',
        queueName: 'email',
        status: 'queued'
      });

      const response = await request(app)
        .post('/api/notifications/send-with-retry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notificationData: {
            type: 'email',
            to: 'test@example.com',
            template_key: 'welcome_email',
            variables: { name: 'Test User' }
          },
          options: {
            attempts: 3,
            backoffDelay: 2000
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notification queued for delivery with retry');
      expect(notificationQueueService.sendNotificationWithRetry).toHaveBeenCalled();
    });

    it('should schedule notification', async () => {
      // Mock queue service
      notificationQueueService.scheduleNotification.mockResolvedValue({
        jobId: 'test-job-id',
        queueName: 'email',
        status: 'scheduled'
      });

      const scheduleTime = new Date(Date.now() + 60000); // 1 minute from now

      const response = await request(app)
        .post('/api/notifications/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notificationData: {
            type: 'email',
            to: 'test@example.com',
            template_key: 'ride_reminder',
            variables: { name: 'Test User' }
          },
          scheduleTime: scheduleTime.toISOString(),
          options: {
            priority: 'normal'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notification scheduled successfully');
      expect(notificationQueueService.scheduleNotification).toHaveBeenCalled();
    });

    it('should validate schedule time', async () => {
      const pastTime = new Date(Date.now() - 60000); // 1 minute ago

      const response = await request(app)
        .post('/api/notifications/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notificationData: {
            type: 'email',
            to: 'test@example.com',
            template_key: 'ride_reminder'
          },
          scheduleTime: pastTime.toISOString()
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid schedule time format');
    });

    it('should get queue statistics', async () => {
      // Mock queue statistics
      notificationQueueService.getQueueStatistics.mockResolvedValue({
        email: {
          waiting: 5,
          active: 2,
          completed: 100,
          failed: 3,
          delayed: 1,
          total: 111
        },
        sms: {
          waiting: 3,
          active: 1,
          completed: 50,
          failed: 2,
          delayed: 0,
          total: 56
        }
      });

      const response = await request(app)
        .get('/api/notifications/queue-statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('sms');
      expect(notificationQueueService.getQueueStatistics).toHaveBeenCalled();
    });
  });

  describe('Delivery Service Testing', () => {
    it('should test all delivery services', async () => {
      // Mock service test results
      emailService.testConnection.mockResolvedValue({
        success: true,
        message: 'Email service is working'
      });

      smsService.testConnection.mockResolvedValue({
        success: true,
        message: 'SMS service is working'
      });

      pushNotificationService.testConnection.mockResolvedValue({
        success: true,
        message: 'Push notification service is working'
      });

      notificationQueueService.testService.mockResolvedValue({
        success: true,
        message: 'Notification queue service is working'
      });

      const response = await request(app)
        .post('/api/notifications/test-delivery')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Delivery services test completed');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('sms');
      expect(response.body.data).toHaveProperty('push');
      expect(response.body.data).toHaveProperty('queue');

      expect(emailService.testConnection).toHaveBeenCalled();
      expect(smsService.testConnection).toHaveBeenCalled();
      expect(pushNotificationService.testConnection).toHaveBeenCalled();
      expect(notificationQueueService.testService).toHaveBeenCalled();
    });

    it('should handle service test failures', async () => {
      // Mock service test failure
      emailService.testConnection.mockResolvedValue({
        success: false,
        error: 'Email service not configured'
      });

      const response = await request(app)
        .post('/api/notifications/test-delivery')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email.success).toBe(false);
      expect(response.body.data.email.error).toBe('Email service not configured');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for delivery endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/api/notifications/send-email' },
        { method: 'post', path: '/api/notifications/send-sms' },
        { method: 'post', path: '/api/notifications/send-push' },
        { method: 'post', path: '/api/notifications/send-in-app' },
        { method: 'post', path: '/api/notifications/send-with-retry' },
        { method: 'post', path: '/api/notifications/schedule' },
        { method: 'get', path: '/api/notifications/queue-statistics' },
        { method: 'post', path: '/api/notifications/test-delivery' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path)
          .send({});

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Access token required');
      }
    });

    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .post('/api/notifications/send-email')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          to: 'test@example.com',
          template_key: 'welcome_email'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing notification data', async () => {
      const response = await request(app)
        .post('/api/notifications/send-with-retry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notificationData: {
            // Missing type
            to: 'test@example.com'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Notification data with type is required');
    });

    it('should handle invalid notification type', async () => {
      const response = await request(app)
        .post('/api/notifications/send-with-retry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notificationData: {
            type: 'invalid_type',
            to: 'test@example.com'
          }
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
}); 