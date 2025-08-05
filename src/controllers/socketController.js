const socketService = require('../services/socketService');
const logger = require('../utils/logger');

class SocketController {
  // Get WebSocket server status
  static async getStatus(req, res) {
    try {
      const status = {
        isRunning: socketService.io !== null,
        connectedUsers: socketService.getConnectedUsersCount(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };

      logger.info('WebSocket status retrieved', {
        userId: req.user?.id,
        connectedUsers: status.connectedUsers
      });

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Failed to get WebSocket status', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get WebSocket status'
      });
    }
  }

  // Get connected users (admin only)
  static async getConnectedUsers(req, res) {
    try {
      const connectedUsers = socketService.getConnectedUsers();

      logger.info('Connected users retrieved', {
        userId: req.user?.id,
        count: connectedUsers.length
      });

      res.json({
        success: true,
        data: {
          users: connectedUsers,
          count: connectedUsers.length
        }
      });
    } catch (error) {
      logger.error('Failed to get connected users', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get connected users'
      });
    }
  }

  // Send message to specific user (admin only)
  static async sendToUser(req, res) {
    try {
      const { userId, event, data } = req.body;

      if (!userId || !event || !data) {
        return res.status(400).json({
          success: false,
          error: 'User ID, event, and data are required'
        });
      }

      const sent = socketService.sendToUser(userId, event, data);

      if (sent) {
        logger.info('Message sent to user', {
          adminId: req.user?.id,
          targetUserId: userId,
          event: event
        });

        res.json({
          success: true,
          message: 'Message sent successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'User not connected'
        });
      }
    } catch (error) {
      logger.error('Failed to send message to user', {
        error: error.message,
        adminId: req.user?.id,
        targetUserId: req.body.userId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }

  // Send message to room
  static async sendToRoom(req, res) {
    try {
      const { roomId, event, data } = req.body;

      if (!roomId || !event || !data) {
        return res.status(400).json({
          success: false,
          error: 'Room ID, event, and data are required'
        });
      }

      socketService.sendToRoom(roomId, event, data);

      logger.info('Message sent to room', {
        userId: req.user?.id,
        roomId: roomId,
        event: event
      });

      res.json({
        success: true,
        message: 'Message sent to room successfully'
      });
    } catch (error) {
      logger.error('Failed to send message to room', {
        error: error.message,
        userId: req.user?.id,
        roomId: req.body.roomId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to send message to room'
      });
    }
  }

  // Broadcast message to all users
  static async broadcast(req, res) {
    try {
      const { event, data, excludeUserId } = req.body;

      if (!event || !data) {
        return res.status(400).json({
          success: false,
          error: 'Event and data are required'
        });
      }

      socketService.broadcast(event, data, excludeUserId);

      logger.info('Message broadcasted', {
        userId: req.user?.id,
        event: event,
        excludeUserId: excludeUserId
      });

      res.json({
        success: true,
        message: 'Message broadcasted successfully'
      });
    } catch (error) {
      logger.error('Failed to broadcast message', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to broadcast message'
      });
    }
  }

  // Disconnect user (admin only)
  static async disconnectUser(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const userData = socketService.connectedUsers.get(userId);
      if (!userData) {
        return res.status(404).json({
          success: false,
          error: 'User not connected'
        });
      }

      // Disconnect the user
      socketService.io.to(userData.socketId).disconnect(true);

      logger.info('User disconnected by admin', {
        adminId: req.user?.id,
        targetUserId: userId
      });

      res.json({
        success: true,
        message: 'User disconnected successfully'
      });
    } catch (error) {
      logger.error('Failed to disconnect user', {
        error: error.message,
        adminId: req.user?.id,
        targetUserId: req.params.userId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to disconnect user'
      });
    }
  }

  // Get user's rooms
  static async getUserRooms(req, res) {
    try {
      const { userId } = req.params;
      const targetUserId = userId || req.user?.id;

      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const userRooms = socketService.userRooms.get(targetUserId);
      const rooms = userRooms ? Array.from(userRooms) : [];

      logger.info('User rooms retrieved', {
        userId: req.user?.id,
        targetUserId: targetUserId,
        roomCount: rooms.length
      });

      res.json({
        success: true,
        data: {
          userId: targetUserId,
          rooms: rooms,
          count: rooms.length
        }
      });
    } catch (error) {
      logger.error('Failed to get user rooms', {
        error: error.message,
        userId: req.user?.id,
        targetUserId: req.params.userId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get user rooms'
      });
    }
  }

  // Get room participants
  static async getRoomParticipants(req, res) {
    try {
      const { roomId } = req.params;

      if (!roomId) {
        return res.status(400).json({
          success: false,
          error: 'Room ID is required'
        });
      }

      // Get all sockets in the room
      const room = socketService.io.sockets.adapter.rooms.get(roomId);
      const participants = [];

      if (room) {
        for (const socketId of room) {
          const socket = socketService.io.sockets.sockets.get(socketId);
          if (socket && socket.user) {
            participants.push({
              userId: socket.userId,
              socketId: socketId,
              user: {
                id: socket.user.id,
                first_name: socket.user.first_name,
                last_name: socket.user.last_name,
                email: socket.user.email
              }
            });
          }
        }
      }

      logger.info('Room participants retrieved', {
        userId: req.user?.id,
        roomId: roomId,
        participantCount: participants.length
      });

      res.json({
        success: true,
        data: {
          roomId: roomId,
          participants: participants,
          count: participants.length
        }
      });
    } catch (error) {
      logger.error('Failed to get room participants', {
        error: error.message,
        userId: req.user?.id,
        roomId: req.params.roomId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get room participants'
      });
    }
  }
}

module.exports = SocketController; 