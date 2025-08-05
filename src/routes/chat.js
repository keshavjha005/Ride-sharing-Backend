const express = require('express');
const { body, param, query } = require('express-validator');
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatRoom:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         room_type:
 *           type: string
 *           enum: [ride, support, group]
 *         ride_id:
 *           type: string
 *           format: uuid
 *         title_ar:
 *           type: string
 *         title_en:
 *           type: string
 *         is_active:
 *           type: boolean
 *         participant_count:
 *           type: integer
 *         message_count:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     ChatMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         room_id:
 *           type: string
 *           format: uuid
 *         sender_id:
 *           type: string
 *           format: uuid
 *         message_type:
 *           type: string
 *           enum: [text, image, file, location, system]
 *         message_text:
 *           type: string
 *         message_ar:
 *           type: string
 *         message_en:
 *           type: string
 *         media_url:
 *           type: string
 *         media_type:
 *           type: string
 *         file_size:
 *           type: integer
 *         location_data:
 *           type: object
 *         is_edited:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *     ChatParticipant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         room_id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         role:
 *           type: string
 *           enum: [participant, admin, moderator]
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         email:
 *           type: string
 *         profile_image_url:
 *           type: string
 *         joined_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/chat/rooms:
 *   get:
 *     summary: Get user's chat rooms
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of rooms to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of rooms to skip
 *     responses:
 *       200:
 *         description: List of chat rooms
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
 *                     $ref: '#/components/schemas/ChatRoom'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/rooms', auth, chatController.getUserChatRooms);

/**
 * @swagger
 * /api/chat/rooms:
 *   post:
 *     summary: Create a new chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - room_type
 *             properties:
 *               room_type:
 *                 type: string
 *                 enum: [ride, support, group]
 *               ride_id:
 *                 type: string
 *                 format: uuid
 *               title_ar:
 *                 type: string
 *               title_en:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Chat room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ChatRoom'
 *       400:
 *         description: Validation error or ride not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/rooms', [
  auth,
  body('room_type').isIn(['ride', 'support', 'group']).withMessage('Room type must be ride, support, or group'),
  body('ride_id').optional().isUUID().withMessage('Ride ID must be a valid UUID'),
  body('title_ar').optional().isString().trim().isLength({ max: 255 }).withMessage('Arabic title must be a string with max 255 characters'),
  body('title_en').optional().isString().trim().isLength({ max: 255 }).withMessage('English title must be a string with max 255 characters'),
  body('participants').optional().isArray().withMessage('Participants must be an array'),
  body('participants.*').optional().isUUID().withMessage('Each participant ID must be a valid UUID'),
  validate
], chatController.createChatRoom);

/**
 * @swagger
 * /api/chat/rooms/{roomId}:
 *   get:
 *     summary: Get chat room by ID
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat room ID
 *     responses:
 *       200:
 *         description: Chat room details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/ChatRoom'
 *                     - type: object
 *                       properties:
 *                         participants:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/ChatParticipant'
 *                         unread_count:
 *                           type: integer
 *       403:
 *         description: Access denied
 *       404:
 *         description: Chat room not found
 *       500:
 *         description: Internal server error
 */
router.get('/rooms/:roomId', [
  auth,
  param('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
  validate
], chatController.getChatRoom);

/**
 * @swagger
 * /api/chat/rooms/{roomId}:
 *   put:
 *     summary: Update chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat room ID
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
 *     responses:
 *       200:
 *         description: Chat room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ChatRoom'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       404:
 *         description: Chat room not found
 *       500:
 *         description: Internal server error
 */
router.put('/rooms/:roomId', [
  auth,
  param('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
  body('title_ar').optional().isString().trim().isLength({ max: 255 }).withMessage('Arabic title must be a string with max 255 characters'),
  body('title_en').optional().isString().trim().isLength({ max: 255 }).withMessage('English title must be a string with max 255 characters'),
  validate
], chatController.updateChatRoom);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages:
 *   get:
 *     summary: Get chat messages for a room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat room ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of messages to skip
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get messages before this date
 *     responses:
 *       200:
 *         description: List of chat messages
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
 *                     $ref: '#/components/schemas/ChatMessage'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/rooms/:roomId/messages', [
  auth,
  param('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer'),
  query('before').optional().isISO8601().withMessage('Before must be a valid ISO 8601 date'),
  validate
], chatController.getChatMessages);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages:
 *   post:
 *     summary: Send a message to a chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message_type:
 *                 type: string
 *                 enum: [text, image, file, location, system]
 *                 default: text
 *               message_text:
 *                 type: string
 *               message_ar:
 *                 type: string
 *               message_en:
 *                 type: string
 *               media_url:
 *                 type: string
 *               media_type:
 *                 type: string
 *               file_size:
 *                 type: integer
 *               location_data:
 *                 type: object
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ChatMessage'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/rooms/:roomId/messages', [
  auth,
  param('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
  body('message_type').optional().isIn(['text', 'image', 'file', 'location', 'system']).withMessage('Message type must be text, image, file, location, or system'),
  body('message_text').optional().isString().trim().withMessage('Message text must be a string'),
  body('message_ar').optional().isString().trim().withMessage('Arabic message must be a string'),
  body('message_en').optional().isString().trim().withMessage('English message must be a string'),
  body('media_url').optional().isURL().withMessage('Media URL must be a valid URL'),
  body('media_type').optional().isString().trim().isLength({ max: 50 }).withMessage('Media type must be a string with max 50 characters'),
  body('file_size').optional().isInt({ min: 0 }).withMessage('File size must be a non-negative integer'),
  body('location_data').optional().isObject().withMessage('Location data must be an object'),
  validate
], chatController.sendMessage);

/**
 * @swagger
 * /api/chat/messages/{messageId}:
 *   put:
 *     summary: Update a message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message_text:
 *                 type: string
 *               message_ar:
 *                 type: string
 *               message_en:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ChatMessage'
 *       400:
 *         description: Validation error or message too old
 *       403:
 *         description: Access denied
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
router.put('/messages/:messageId', [
  auth,
  param('messageId').isUUID().withMessage('Message ID must be a valid UUID'),
  body('message_text').optional().isString().trim().withMessage('Message text must be a string'),
  body('message_ar').optional().isString().trim().withMessage('Arabic message must be a string'),
  body('message_en').optional().isString().trim().withMessage('English message must be a string'),
  validate
], chatController.updateMessage);

/**
 * @swagger
 * /api/chat/messages/{messageId}:
 *   delete:
 *     summary: Delete a message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Access denied
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
router.delete('/messages/:messageId', [
  auth,
  param('messageId').isUUID().withMessage('Message ID must be a valid UUID'),
  validate
], chatController.deleteMessage);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/participants:
 *   get:
 *     summary: Get chat room participants
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat room ID
 *     responses:
 *       200:
 *         description: List of participants
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
 *                     $ref: '#/components/schemas/ChatParticipant'
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/rooms/:roomId/participants', [
  auth,
  param('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
  validate
], chatController.getChatRoomParticipants);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/participants:
 *   post:
 *     summary: Add participant to chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               role:
 *                 type: string
 *                 enum: [participant, admin, moderator]
 *                 default: participant
 *     responses:
 *       201:
 *         description: Participant added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or user not found
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/rooms/:roomId/participants', [
  auth,
  param('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
  body('userId').isUUID().withMessage('User ID must be a valid UUID'),
  body('role').optional().isIn(['participant', 'admin', 'moderator']).withMessage('Role must be participant, admin, or moderator'),
  validate
], chatController.addChatRoomParticipant);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/participants/{userId}:
 *   delete:
 *     summary: Remove participant from chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat room ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: Participant removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: User is not a participant
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.delete('/rooms/:roomId/participants/:userId', [
  auth,
  param('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
  param('userId').isUUID().withMessage('User ID must be a valid UUID'),
  validate
], chatController.removeChatRoomParticipant);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/search:
 *   get:
 *     summary: Search messages in a chat room
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat room ID
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Search results
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
 *                     $ref: '#/components/schemas/ChatMessage'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       400:
 *         description: Search query required
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/rooms/:roomId/search', [
  auth,
  param('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
  query('query').notEmpty().withMessage('Search query is required'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer'),
  validate
], chatController.searchMessages);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/mark-read:
 *   post:
 *     summary: Mark messages as read
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat room ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               before:
 *                 type: string
 *                 format: date-time
 *                 description: Mark messages as read before this date
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/rooms/:roomId/mark-read', [
  auth,
  param('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
  body('before').optional().isISO8601().withMessage('Before must be a valid ISO 8601 date'),
  validate
], chatController.markMessagesAsRead);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/statistics:
 *   get:
 *     summary: Get chat room statistics
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Chat room ID
 *     responses:
 *       200:
 *         description: Chat room statistics
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
 *                     total_messages:
 *                       type: integer
 *                     text_messages:
 *                       type: integer
 *                     image_messages:
 *                       type: integer
 *                     file_messages:
 *                       type: integer
 *                     location_messages:
 *                       type: integer
 *                     edited_messages:
 *                       type: integer
 *                     first_message_at:
 *                       type: string
 *                       format: date-time
 *                     last_message_at:
 *                       type: string
 *                       format: date-time
 *                     unread_count:
 *                       type: integer
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/rooms/:roomId/statistics', [
  auth,
  param('roomId').isUUID().withMessage('Room ID must be a valid UUID'),
  validate
], chatController.getChatRoomStatistics);

module.exports = router; 