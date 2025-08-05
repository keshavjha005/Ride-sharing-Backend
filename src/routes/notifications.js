const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationTemplate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         template_key:
 *           type: string
 *           description: Unique key for the template
 *         title_ar:
 *           type: string
 *           description: Arabic title
 *         title_en:
 *           type: string
 *           description: English title
 *         body_ar:
 *           type: string
 *           description: Arabic body content
 *         body_en:
 *           type: string
 *           description: English body content
 *         notification_type:
 *           type: string
 *           enum: [chat, booking, ride, payment, system, marketing]
 *         category:
 *           type: string
 *           description: Template category
 *         priority:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *           default: normal
 *         is_active:
 *           type: boolean
 *           default: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     
 *     UserNotification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         template_id:
 *           type: string
 *           format: uuid
 *         title_ar:
 *           type: string
 *         title_en:
 *           type: string
 *         body_ar:
 *           type: string
 *         body_en:
 *           type: string
 *         notification_type:
 *           type: string
 *           enum: [chat, booking, ride, payment, system, marketing]
 *         data:
 *           type: object
 *           description: Additional notification data
 *         priority:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *         is_read:
 *           type: boolean
 *           default: false
 *         is_sent:
 *           type: boolean
 *           default: false
 *         sent_at:
 *           type: string
 *           format: date-time
 *         read_at:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 *     
 *     UserNotificationPreferences:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         email_enabled:
 *           type: boolean
 *           default: true
 *         sms_enabled:
 *           type: boolean
 *           default: true
 *         push_enabled:
 *           type: boolean
 *           default: true
 *         in_app_enabled:
 *           type: boolean
 *           default: true
 *         notification_types:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of enabled notification types
 *         quiet_hours_start:
 *           type: string
 *           format: time
 *           default: "22:00:00"
 *         quiet_hours_end:
 *           type: string
 *           format: time
 *           default: "08:00:00"
 *         timezone:
 *           type: string
 *           default: "UTC"
 *         language_code:
 *           type: string
 *           default: "en"
 *     
 *     FCMToken:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         token:
 *           type: string
 *           description: Firebase Cloud Messaging token
 *         device_type:
 *           type: string
 *           enum: [android, ios, web]
 *         device_id:
 *           type: string
 *         app_version:
 *           type: string
 *         is_active:
 *           type: boolean
 *           default: true
 *         last_used_at:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/notification-templates:
 *   get:
 *     summary: Get all notification templates
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: notification_type
 *         schema:
 *           type: string
 *           enum: [chat, booking, ride, payment, system, marketing]
 *         description: Filter by notification type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: List of notification templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NotificationTemplate'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     count:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/notification-templates', authenticate, NotificationController.getTemplates);

/**
 * @swagger
 * /api/notification-templates/{id}:
 *   get:
 *     summary: Get notification template by ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Notification template details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/NotificationTemplate'
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/notification-templates/:id', authenticate, NotificationController.getTemplateById);

/**
 * @swagger
 * /api/notification-templates:
 *   post:
 *     summary: Create notification template
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - template_key
 *               - notification_type
 *             properties:
 *               template_key:
 *                 type: string
 *                 description: Unique key for the template
 *               title_ar:
 *                 type: string
 *                 description: Arabic title
 *               title_en:
 *                 type: string
 *                 description: English title
 *               body_ar:
 *                 type: string
 *                 description: Arabic body content
 *               body_en:
 *                 type: string
 *                 description: English body content
 *               notification_type:
 *                 type: string
 *                 enum: [chat, booking, ride, payment, system, marketing]
 *               category:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/NotificationTemplate'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/notification-templates', authenticate, NotificationController.createTemplate);

/**
 * @swagger
 * /api/notification-templates/{id}:
 *   put:
 *     summary: Update notification template
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title_ar:
 *                 type: string
 *               title_en:
 *                 type: string
 *               body_ar:
 *                 type: string
 *               body_en:
 *                 type: string
 *               notification_type:
 *                 type: string
 *                 enum: [chat, booking, ride, payment, system, marketing]
 *               category:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/notification-templates/:id', authenticate, NotificationController.updateTemplate);

/**
 * @swagger
 * /api/notification-templates/{id}:
 *   delete:
 *     summary: Delete notification template
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/notification-templates/:id', authenticate, NotificationController.deleteTemplate);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: notification_type
 *         schema:
 *           type: string
 *           enum: [chat, booking, ride, payment, system, marketing]
 *         description: Filter by notification type
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: is_sent
 *         schema:
 *           type: boolean
 *         description: Filter by sent status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: List of user notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserNotification'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     count:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/notifications', authenticate, NotificationController.getUserNotifications);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get user notification by ID
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserNotification'
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/notifications/:id', authenticate, NotificationController.getUserNotificationById);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.put('/notifications/:id/read', authenticate, NotificationController.markNotificationAsRead);

/**
 * @swagger
 * /api/notifications/mark-read:
 *   post:
 *     summary: Mark multiple notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notification_ids
 *             properties:
 *               notification_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of notification IDs to mark as read
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/notifications/mark-read', authenticate, NotificationController.markMultipleNotificationsAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete user notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.delete('/notifications/:id', authenticate, NotificationController.deleteUserNotification);

/**
 * @swagger
 * /api/users/notification-preferences:
 *   get:
 *     summary: Get user notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User notification preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserNotificationPreferences'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/users/notification-preferences', authenticate, NotificationController.getUserNotificationPreferences);

/**
 * @swagger
 * /api/users/notification-preferences:
 *   put:
 *     summary: Update user notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email_enabled:
 *                 type: boolean
 *               sms_enabled:
 *                 type: boolean
 *               push_enabled:
 *                 type: boolean
 *               in_app_enabled:
 *                 type: boolean
 *               notification_types:
 *                 type: array
 *                 items:
 *                   type: string
 *               quiet_hours_start:
 *                 type: string
 *                 format: time
 *               quiet_hours_end:
 *                 type: string
 *                 format: time
 *               timezone:
 *                 type: string
 *               language_code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/users/notification-preferences', authenticate, NotificationController.updateUserNotificationPreferences);

/**
 * @swagger
 * /api/fcm/token:
 *   post:
 *     summary: Register FCM token
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - device_type
 *             properties:
 *               token:
 *                 type: string
 *                 description: Firebase Cloud Messaging token
 *               device_type:
 *                 type: string
 *                 enum: [android, ios, web]
 *               device_id:
 *                 type: string
 *               app_version:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token registered successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/fcm/token', authenticate, NotificationController.registerFCMToken);

/**
 * @swagger
 * /api/fcm/token/{token}:
 *   delete:
 *     summary: Delete FCM token
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: FCM token to delete
 *     responses:
 *       200:
 *         description: FCM token deleted successfully
 *       404:
 *         description: Token not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.delete('/fcm/token/:token', authenticate, NotificationController.deleteFCMToken);

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Send notification to user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - template_key
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               template_key:
 *                 type: string
 *               variables:
 *                 type: object
 *                 description: Template variables for substitution
 *               data:
 *                 type: object
 *                 description: Additional notification data
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/notifications/send', authenticate, NotificationController.sendNotification);

/**
 * @swagger
 * /api/notifications/send-bulk:
 *   post:
 *     summary: Send bulk notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_ids
 *               - template_key
 *             properties:
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               template_key:
 *                 type: string
 *               variables:
 *                 type: object
 *               data:
 *                 type: object
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *     responses:
 *       200:
 *         description: Bulk notifications processed
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/notifications/send-bulk', authenticate, NotificationController.sendBulkNotifications);

/**
 * @swagger
 * /api/notifications/statistics:
 *   get:
 *     summary: Get notification statistics for user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     notification_stats:
 *                       type: array
 *                     unread_count:
 *                       type: integer
 *                     preferences:
 *                       $ref: '#/components/schemas/UserNotificationPreferences'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/notifications/statistics', authenticate, NotificationController.getNotificationStatistics);

/**
 * @swagger
 * /api/notifications/delivery-statistics:
 *   get:
 *     summary: Get delivery statistics (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: delivery_method
 *         schema:
 *           type: string
 *           enum: [email, sms, push, in_app]
 *         description: Filter by delivery method
 *       - in: query
 *         name: notification_type
 *         schema:
 *           type: string
 *           enum: [chat, booking, ride, payment, system, marketing]
 *         description: Filter by notification type
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: Delivery statistics
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/notifications/delivery-statistics', authenticate, NotificationController.getDeliveryStatistics);

/**
 * @swagger
 * /api/notifications/send-email:
 *   post:
 *     summary: Send email notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - template_key
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Recipient email address
 *               template_key:
 *                 type: string
 *                 description: Email template key
 *               variables:
 *                 type: object
 *                 description: Template variables
 *               options:
 *                 type: object
 *                 description: Email options
 *     responses:
 *       200:
 *         description: Email sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/notifications/send-email', authenticate, NotificationController.sendEmailNotification);

/**
 * @swagger
 * /api/notifications/send-sms:
 *   post:
 *     summary: Send SMS notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - template_key
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient phone number
 *               template_key:
 *                 type: string
 *                 description: SMS template key
 *               variables:
 *                 type: object
 *                 description: Template variables
 *               options:
 *                 type: object
 *                 description: SMS options
 *     responses:
 *       200:
 *         description: SMS sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/notifications/send-sms', authenticate, NotificationController.sendSMSNotification);

/**
 * @swagger
 * /api/notifications/send-push:
 *   post:
 *     summary: Send push notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - template_key
 *             properties:
 *               token:
 *                 type: string
 *                 description: FCM token
 *               template_key:
 *                 type: string
 *                 description: Push notification template key
 *               variables:
 *                 type: object
 *                 description: Template variables
 *               data:
 *                 type: object
 *                 description: Additional notification data
 *               options:
 *                 type: object
 *                 description: Push notification options
 *     responses:
 *       200:
 *         description: Push notification sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/notifications/send-push', authenticate, NotificationController.sendPushNotification);

/**
 * @swagger
 * /api/notifications/send-in-app:
 *   post:
 *     summary: Send in-app notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - notification
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: Target user ID
 *               notification:
 *                 type: object
 *                 description: Notification data
 *     responses:
 *       200:
 *         description: In-app notification sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/notifications/send-in-app', authenticate, NotificationController.sendInAppNotification);

/**
 * @swagger
 * /api/notifications/send-with-retry:
 *   post:
 *     summary: Send notification with retry logic
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationData
 *             properties:
 *               notificationData:
 *                 type: object
 *                 required:
 *                   - type
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [email, sms, push, in_app]
 *                     description: Notification type
 *               options:
 *                 type: object
 *                 description: Retry options
 *     responses:
 *       200:
 *         description: Notification queued with retry
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/notifications/send-with-retry', authenticate, NotificationController.sendNotificationWithRetry);

/**
 * @swagger
 * /api/notifications/schedule:
 *   post:
 *     summary: Schedule notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationData
 *               - scheduleTime
 *             properties:
 *               notificationData:
 *                 type: object
 *                 description: Notification data
 *               scheduleTime:
 *                 type: string
 *                 format: date-time
 *                 description: Schedule time
 *               options:
 *                 type: object
 *                 description: Schedule options
 *     responses:
 *       200:
 *         description: Notification scheduled successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/notifications/schedule', authenticate, NotificationController.scheduleNotification);

/**
 * @swagger
 * /api/notifications/queue-statistics:
 *   get:
 *     summary: Get queue statistics
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: object
 *                     sms:
 *                       type: object
 *                     push:
 *                       type: object
 *                     inApp:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/notifications/queue-statistics', authenticate, NotificationController.getQueueStatistics);

/**
 * @swagger
 * /api/notifications/test-delivery:
 *   post:
 *     summary: Test delivery services
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery services test results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: object
 *                     sms:
 *                       type: object
 *                     push:
 *                       type: object
 *                     queue:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/notifications/test-delivery', authenticate, NotificationController.testDeliveryServices);

module.exports = router; 