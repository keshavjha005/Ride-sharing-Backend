const express = require('express');
const router = express.Router();
const SocketController = require('../controllers/socketController');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     WebSocketStatus:
 *       type: object
 *       properties:
 *         isRunning:
 *           type: boolean
 *           description: Whether the WebSocket server is running
 *         connectedUsers:
 *           type: integer
 *           description: Number of connected users
 *         uptime:
 *           type: number
 *           description: Server uptime in seconds
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Current timestamp
 *     
 *     ConnectedUser:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: User ID
 *         socketId:
 *           type: string
 *           description: Socket ID
 *         connectedAt:
 *           type: string
 *           format: date-time
 *           description: Connection timestamp
 *         rooms:
 *           type: array
 *           items:
 *             type: string
 *           description: List of room IDs the user is in
 *     
 *     MessageRequest:
 *       type: object
 *       required:
 *         - event
 *         - data
 *       properties:
 *         event:
 *           type: string
 *           description: Event name to emit
 *         data:
 *           type: object
 *           description: Data to send with the event
 *         userId:
 *           type: string
 *           description: Target user ID (for sendToUser)
 *         roomId:
 *           type: string
 *           description: Target room ID (for sendToRoom)
 *         excludeUserId:
 *           type: string
 *           description: User ID to exclude from broadcast
 *     
 *     RoomParticipant:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: User ID
 *         socketId:
 *           type: string
 *           description: Socket ID
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             first_name:
 *               type: string
 *             last_name:
 *               type: string
 *             email:
 *               type: string
 */

/**
 * @swagger
 * /api/socket/status:
 *   get:
 *     summary: Get WebSocket server status
 *     tags: [WebSocket]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WebSocket server status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WebSocketStatus'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/status', authenticate, SocketController.getStatus);

/**
 * @swagger
 * /api/socket/connected-users:
 *   get:
 *     summary: Get list of connected users (Admin only)
 *     tags: [WebSocket]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of connected users
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ConnectedUser'
 *                     count:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access required)
 *       500:
 *         description: Internal server error
 */
router.get('/connected-users', authenticate, SocketController.getConnectedUsers);

/**
 * @swagger
 * /api/socket/send-to-user:
 *   post:
 *     summary: Send message to specific user (Admin only)
 *     tags: [WebSocket]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - event
 *               - data
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Target user ID
 *               event:
 *                 type: string
 *                 description: Event name to emit
 *               data:
 *                 type: object
 *                 description: Data to send with the event
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access required)
 *       404:
 *         description: User not connected
 *       500:
 *         description: Internal server error
 */
router.post('/send-to-user', authenticate, SocketController.sendToUser);

/**
 * @swagger
 * /api/socket/send-to-room:
 *   post:
 *     summary: Send message to room
 *     tags: [WebSocket]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - event
 *               - data
 *             properties:
 *               roomId:
 *                 type: string
 *                 description: Target room ID
 *               event:
 *                 type: string
 *                 description: Event name to emit
 *               data:
 *                 type: object
 *                 description: Data to send with the event
 *     responses:
 *       200:
 *         description: Message sent to room successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/send-to-room', authenticate, SocketController.sendToRoom);

/**
 * @swagger
 * /api/socket/broadcast:
 *   post:
 *     summary: Broadcast message to all users
 *     tags: [WebSocket]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - data
 *             properties:
 *               event:
 *                 type: string
 *                 description: Event name to emit
 *               data:
 *                 type: object
 *                 description: Data to send with the event
 *               excludeUserId:
 *                 type: string
 *                 description: User ID to exclude from broadcast
 *     responses:
 *       200:
 *         description: Message broadcasted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/broadcast', authenticate, SocketController.broadcast);

/**
 * @swagger
 * /api/socket/disconnect-user/{userId}:
 *   delete:
 *     summary: Disconnect specific user (Admin only)
 *     tags: [WebSocket]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to disconnect
 *     responses:
 *       200:
 *         description: User disconnected successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin access required)
 *       404:
 *         description: User not connected
 *       500:
 *         description: Internal server error
 */
router.delete('/disconnect-user/:userId', authenticate, SocketController.disconnectUser);

/**
 * @swagger
 * /api/socket/user-rooms/{userId}:
 *   get:
 *     summary: Get user's rooms
 *     tags: [WebSocket]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: false
 *         schema:
 *           type: string
 *         description: User ID (optional, defaults to authenticated user)
 *     responses:
 *       200:
 *         description: User's rooms
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
 *                     userId:
 *                       type: string
 *                     rooms:
 *                       type: array
 *                       items:
 *                         type: string
 *                     count:
 *                       type: integer
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/user-rooms/:userId?', authenticate, SocketController.getUserRooms);

/**
 * @swagger
 * /api/socket/room-participants/{roomId}:
 *   get:
 *     summary: Get room participants
 *     tags: [WebSocket]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room participants
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
 *                     roomId:
 *                       type: string
 *                     participants:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/RoomParticipant'
 *                     count:
 *                       type: integer
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/room-participants/:roomId', authenticate, SocketController.getRoomParticipants);

module.exports = router; 