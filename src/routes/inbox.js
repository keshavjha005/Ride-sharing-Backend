const express = require('express');
const router = express.Router();
const inboxController = require('../controllers/inboxController');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     InboxConversation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique conversation ID
 *         userId:
 *           type: string
 *           description: User ID who owns the conversation
 *         conversationType:
 *           type: string
 *           enum: [ride, support, system, marketing]
 *           description: Type of conversation
 *         titleAr:
 *           type: string
 *           description: Conversation title in Arabic
 *         titleEn:
 *           type: string
 *           description: Conversation title in English
 *         lastMessageAr:
 *           type: string
 *           description: Last message in Arabic
 *         lastMessageEn:
 *           type: string
 *           description: Last message in English
 *         lastMessageAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last message
 *         unreadCount:
 *           type: integer
 *           description: Number of unread messages
 *         isArchived:
 *           type: boolean
 *           description: Whether conversation is archived
 *         isMuted:
 *           type: boolean
 *           description: Whether conversation is muted
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         participantCount:
 *           type: integer
 *           description: Number of participants
 *     ConversationParticipant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique participant ID
 *         conversationId:
 *           type: string
 *           description: Conversation ID
 *         userId:
 *           type: string
 *           description: User ID
 *         role:
 *           type: string
 *           enum: [participant, admin, support]
 *           description: Participant role
 *         joinedAt:
 *           type: string
 *           format: date-time
 *         leftAt:
 *           type: string
 *           format: date-time
 *         isActive:
 *           type: boolean
 *           description: Whether participant is active
 *         name:
 *           type: string
 *           description: User name
 *         email:
 *           type: string
 *           description: User email
 *         phone:
 *           type: string
 *           description: User phone
 *         avatarUrl:
 *           type: string
 *           description: User avatar URL
 */

/**
 * @swagger
 * /api/inbox/conversations:
 *   get:
 *     summary: Get user's conversations
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: conversationType
 *         schema:
 *           type: string
 *           enum: [ride, support, system, marketing]
 *         description: Filter by conversation type
 *       - in: query
 *         name: isArchived
 *         schema:
 *           type: boolean
 *         description: Filter by archived status
 *       - in: query
 *         name: isMuted
 *         schema:
 *           type: boolean
 *         description: Filter by muted status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of conversations to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of conversations to skip
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [last_message_at, created_at, unread_count]
 *           default: last_message_at
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of conversations
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
 *                     $ref: '#/components/schemas/InboxConversation'
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
router.get('/conversations', authenticate, inboxController.getConversations);

/**
 * @swagger
 * /api/inbox/conversations/{conversationId}:
 *   get:
 *     summary: Get conversation by ID
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InboxConversation'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
router.get('/conversations/:conversationId', authenticate, inboxController.getConversation);

/**
 * @swagger
 * /api/inbox/conversations:
 *   post:
 *     summary: Create new conversation
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationType
 *               - titleAr
 *               - titleEn
 *             properties:
 *               conversationType:
 *                 type: string
 *                 enum: [ride, support, system, marketing]
 *               titleAr:
 *                 type: string
 *               titleEn:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [participant, admin, support]
 *                       default: participant
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InboxConversation'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/conversations', authenticate, inboxController.createConversation);

/**
 * @swagger
 * /api/inbox/conversations/{conversationId}/archive:
 *   put:
 *     summary: Archive conversation
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InboxConversation'
 *                 message:
 *                   type: string
 *       403:
 *         description: Access denied
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
router.put('/conversations/:conversationId/archive', authenticate, inboxController.archiveConversation);

/**
 * @swagger
 * /api/inbox/conversations/{conversationId}/unarchive:
 *   put:
 *     summary: Unarchive conversation
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation unarchived successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InboxConversation'
 *                 message:
 *                   type: string
 *       403:
 *         description: Access denied
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
router.put('/conversations/:conversationId/unarchive', authenticate, inboxController.unarchiveConversation);

/**
 * @swagger
 * /api/inbox/conversations/{conversationId}/mute:
 *   put:
 *     summary: Mute conversation
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation muted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InboxConversation'
 *                 message:
 *                   type: string
 *       403:
 *         description: Access denied
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
router.put('/conversations/:conversationId/mute', authenticate, inboxController.muteConversation);

/**
 * @swagger
 * /api/inbox/conversations/{conversationId}/unmute:
 *   put:
 *     summary: Unmute conversation
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation unmuted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InboxConversation'
 *                 message:
 *                   type: string
 *       403:
 *         description: Access denied
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
router.put('/conversations/:conversationId/unmute', authenticate, inboxController.unmuteConversation);

/**
 * @swagger
 * /api/inbox/conversations/{conversationId}:
 *   delete:
 *     summary: Delete conversation
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
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
 *         description: Conversation not found
 *       500:
 *         description: Internal server error
 */
router.delete('/conversations/:conversationId', authenticate, inboxController.deleteConversation);

/**
 * @swagger
 * /api/inbox/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get conversation messages
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
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
 *     responses:
 *       200:
 *         description: List of messages
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
router.get('/conversations/:conversationId/messages', authenticate, inboxController.getMessages);

/**
 * @swagger
 * /api/inbox/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send message to conversation
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageText
 *               - messageAr
 *               - messageEn
 *             properties:
 *               messageText:
 *                 type: string
 *               messageAr:
 *                 type: string
 *               messageEn:
 *                 type: string
 *               messageType:
 *                 type: string
 *                 enum: [text, image, file, location, system]
 *                 default: text
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
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.post('/conversations/:conversationId/messages', authenticate, inboxController.sendMessage);

/**
 * @swagger
 * /api/inbox/messages/{messageId}/read:
 *   put:
 *     summary: Mark message as read
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message marked as read successfully
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
router.put('/messages/:messageId/read', authenticate, inboxController.markMessageAsRead);

/**
 * @swagger
 * /api/inbox/search:
 *   get:
 *     summary: Search conversations
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *                     $ref: '#/components/schemas/InboxConversation'
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
 *         description: Invalid query
 *       500:
 *         description: Internal server error
 */
router.get('/search', authenticate, inboxController.searchConversations);

/**
 * @swagger
 * /api/inbox/unread-count:
 *   get:
 *     summary: Get unread count
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
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
 *                     unreadCount:
 *                       type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/unread-count', authenticate, inboxController.getUnreadCount);

/**
 * @swagger
 * /api/inbox/conversations/{conversationId}/participants:
 *   get:
 *     summary: Get conversation participants
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Show only active participants
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of participants to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of participants to skip
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
 *                     $ref: '#/components/schemas/ConversationParticipant'
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
router.get('/conversations/:conversationId/participants', authenticate, inboxController.getParticipants);

/**
 * @swagger
 * /api/inbox/statistics:
 *   get:
 *     summary: Get inbox statistics
 *     tags: [Inbox]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inbox statistics
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
 *                     type: object
 *                     properties:
 *                       conversationType:
 *                         type: string
 *                       totalConversations:
 *                         type: integer
 *                       totalUnread:
 *                         type: integer
 *                       archivedCount:
 *                         type: integer
 *                       mutedCount:
 *                         type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/statistics', authenticate, inboxController.getStatistics);

module.exports = router; 