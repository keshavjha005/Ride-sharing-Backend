const request = require('supertest');
const app = require('../src/app');
const { executeQuery } = require('../src/config/database');
const NotificationTemplate = require('../src/models/NotificationTemplate');
const UserNotification = require('../src/models/UserNotification');
const UserNotificationPreferences = require('../src/models/UserNotificationPreferences');
const FCMToken = require('../src/models/FCMToken');
const NotificationLog = require('../src/models/NotificationLog');

describe('Notification System Tests', () => {
  let authToken;
  let testUserId;
  let testTemplateId;
  let testNotificationId;

  beforeAll(async () => {
    // Create test user and get auth token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'notification-test@example.com',
        password: 'TestPassword123!',
        first_name: 'Test',
        last_name: 'User',
        phone: '+1234567890'
      });

    testUserId = userResponse.body.data.user.id;
    authToken = userResponse.body.data.token;
  });

  afterAll(async () => {
    // Cleanup test data
    await executeQuery('DELETE FROM notification_logs WHERE user_id = ?', [testUserId]);
    await executeQuery('DELETE FROM fcm_tokens WHERE user_id = ?', [testUserId]);
    await executeQuery('DELETE FROM user_notification_preferences WHERE user_id = ?', [testUserId]);
    await executeQuery('DELETE FROM user_notifications WHERE user_id = ?', [testUserId]);
    await executeQuery('DELETE FROM notification_templates WHERE template_key = ?', ['test_template']);
    await executeQuery('DELETE FROM users WHERE id = ?', [testUserId]);
  });

  describe('Notification Templates', () => {
    test('should create notification template', async () => {
      const templateData = {
        template_key: 'test_template',
        title_ar: 'اختبار',
        title_en: 'Test Template',
        body_ar: 'هذا اختبار',
        body_en: 'This is a test',
        notification_type: 'system',
        category: 'test',
        priority: 'normal'
      };

      const response = await request(app)
        .post('/api/notification-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.template_key).toBe('test_template');
      expect(response.body.data.title_en).toBe('Test Template');
      expect(response.body.data.title_ar).toBe('اختبار');

      testTemplateId = response.body.data.id;
    });

    test('should get notification templates', async () => {
      const response = await request(app)
        .get('/api/notification-templates')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should get notification template by ID', async () => {
      const response = await request(app)
        .get(`/api/notification-templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testTemplateId);
    });

    test('should update notification template', async () => {
      const updateData = {
        title_en: 'Updated Test Template',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/notification-templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title_en).toBe('Updated Test Template');
      expect(response.body.data.priority).toBe('high');
    });

    test('should filter templates by notification type', async () => {
      const response = await request(app)
        .get('/api/notification-templates?notification_type=system')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(t => t.notification_type === 'system')).toBe(true);
    });
  });

  describe('User Notifications', () => {
    test('should create notification from template', async () => {
      const notificationData = {
        user_id: testUserId,
        template_key: 'test_template',
        variables: { name: 'John' },
        data: { custom_field: 'test_value' }
      };

      const response = await request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(testUserId);

      testNotificationId = response.body.data.id;
    });

    test('should get user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    test('should get user notification by ID', async () => {
      const response = await request(app)
        .get(`/api/notifications/${testNotificationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testNotificationId);
      expect(response.body.data.user_id).toBe(testUserId);
    });

    test('should mark notification as read', async () => {
      const response = await request(app)
        .put(`/api/notifications/${testNotificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_read).toBe(true);
    });

    test('should mark multiple notifications as read', async () => {
      // Create another notification
      const notificationData = {
        user_id: testUserId,
        template_key: 'test_template',
        variables: { name: 'Jane' }
      };

      const createResponse = await request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData);

      const secondNotificationId = createResponse.body.data.id;

      const response = await request(app)
        .post('/api/notifications/mark-read')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notification_ids: [testNotificationId, secondNotificationId]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should filter notifications by type', async () => {
      const response = await request(app)
        .get('/api/notifications?notification_type=system')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(n => n.notification_type === 'system')).toBe(true);
    });

    test('should filter unread notifications', async () => {
      const response = await request(app)
        .get('/api/notifications?is_read=false')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.every(n => !n.is_read)).toBe(true);
    });
  });

  describe('User Notification Preferences', () => {
    test('should get user notification preferences', async () => {
      const response = await request(app)
        .get('/api/users/notification-preferences')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(testUserId);
      expect(response.body.data.email_enabled).toBe(true);
      expect(response.body.data.push_enabled).toBe(true);
    });

    test('should update user notification preferences', async () => {
      const updateData = {
        email_enabled: false,
        push_enabled: true,
        notification_types: ['chat', 'ride'],
        quiet_hours_start: '23:00:00',
        quiet_hours_end: '07:00:00',
        language_code: 'ar'
      };

      const response = await request(app)
        .put('/api/users/notification-preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email_enabled).toBe(false);
      expect(response.body.data.push_enabled).toBe(true);
      expect(response.body.data.notification_types).toEqual(['chat', 'ride']);
      expect(response.body.data.quiet_hours_start).toBe('23:00:00');
      expect(response.body.data.language_code).toBe('ar');
    });

    test('should respect quiet hours', async () => {
      // Set quiet hours to current time
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 8);
      
      await request(app)
        .put('/api/users/notification-preferences')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quiet_hours_start: currentTime,
          quiet_hours_end: currentTime
        });

      const notificationData = {
        user_id: testUserId,
        template_key: 'test_template',
        variables: { name: 'Quiet Hours Test' }
      };

      const response = await request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData);

      expect(response.status).toBe(200);
      expect(response.body.data.scheduled).toBe(true);
    });
  });

  describe('FCM Token Management', () => {
    test('should register FCM token', async () => {
      const tokenData = {
        token: 'test-fcm-token-123456789',
        device_type: 'android',
        device_id: 'test-device-123',
        app_version: '1.0.0'
      };

      const response = await request(app)
        .post('/api/fcm/token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tokenData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(testUserId);
      expect(response.body.data.token).toBe('test-fcm-token-123456789');
      expect(response.body.data.device_type).toBe('android');
    });

    test('should update existing FCM token', async () => {
      const tokenData = {
        token: 'test-fcm-token-123456789',
        device_type: 'ios',
        device_id: 'test-device-456',
        app_version: '1.1.0'
      };

      const response = await request(app)
        .post('/api/fcm/token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tokenData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.device_type).toBe('ios');
      expect(response.body.data.app_version).toBe('1.1.0');
    });

    test('should delete FCM token', async () => {
      const response = await request(app)
        .delete('/api/fcm/token/test-fcm-token-123456789')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Bulk Notifications', () => {
    test('should send bulk notifications', async () => {
      const bulkData = {
        user_ids: [testUserId],
        template_key: 'test_template',
        variables: { name: 'Bulk Test' },
        data: { bulk_test: true },
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/notifications/send-bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bulkData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.total).toBe(1);
      expect(response.body.data.summary.sent).toBeGreaterThan(0);
    });
  });

  describe('Notification Statistics', () => {
    test('should get notification statistics', async () => {
      const response = await request(app)
        .get('/api/notifications/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notification_stats).toBeDefined();
      expect(response.body.data.unread_count).toBeDefined();
      expect(response.body.data.preferences).toBeDefined();
    });
  });

  describe('Delivery Statistics', () => {
    test('should get delivery statistics', async () => {
      const response = await request(app)
        .get('/api/notifications/delivery-statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.delivery_statistics).toBeDefined();
      expect(response.body.data.success_rate).toBeDefined();
      expect(response.body.data.delivery_time_statistics).toBeDefined();
    });

    test('should filter delivery statistics by method', async () => {
      const response = await request(app)
        .get('/api/notifications/delivery-statistics?delivery_method=push')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid template key', async () => {
      const notificationData = {
        user_id: testUserId,
        template_key: 'non_existent_template',
        variables: { name: 'Test' }
      };

      const response = await request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    test('should handle invalid notification ID', async () => {
      const response = await request(app)
        .get('/api/notifications/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    test('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/notification-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Model Tests', () => {
    test('should validate notification template data', () => {
      const errors = NotificationTemplate.validate({});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('Template key is required'))).toBe(true);
    });

    test('should validate user notification data', () => {
      const errors = UserNotification.validate({});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('User ID is required'))).toBe(true);
    });

    test('should validate FCM token data', () => {
      const errors = FCMToken.validate({});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('Token is required'))).toBe(true);
    });

    test('should validate notification preferences data', () => {
      const errors = UserNotificationPreferences.validate({});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('User ID is required'))).toBe(true);
    });

    test('should check FCM token format validation', () => {
      expect(FCMToken.isValidTokenFormat('valid-token-123')).toBe(true);
      expect(FCMToken.isValidTokenFormat('')).toBe(false);
      expect(FCMToken.isValidTokenFormat(null)).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    test('should create and send notification with template rendering', async () => {
      // Create a template with variables
      const templateData = {
        template_key: 'welcome_template',
        title_ar: 'مرحباً {name}',
        title_en: 'Welcome {name}',
        body_ar: 'أهلاً وسهلاً بك في {app_name}',
        body_en: 'Welcome to {app_name}',
        notification_type: 'system',
        category: 'welcome'
      };

      await request(app)
        .post('/api/notification-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData);

      // Send notification with variables
      const notificationData = {
        user_id: testUserId,
        template_key: 'welcome_template',
        variables: { name: 'Ahmed', app_name: 'Mate' }
      };

      const response = await request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send(notificationData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should handle notification lifecycle', async () => {
      // Create notification
      const createResponse = await request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          user_id: testUserId,
          template_key: 'test_template',
          variables: { name: 'Lifecycle Test' }
        });

      const notificationId = createResponse.body.data.id;

      // Mark as read
      await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify it's marked as read
      const getResponse = await request(app)
        .get(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.data.is_read).toBe(true);

      // Delete notification
      const deleteResponse = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);
    });
  });
}); 