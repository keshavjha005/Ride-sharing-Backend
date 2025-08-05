const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const User = require('../models/User');
const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Map to track connected users
    this.userRooms = new Map(); // Map to track user's rooms
  }

  // Initialize Socket.io server
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: config.cors.origin,
        credentials: config.cors.credentials,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB
      connectTimeout: 45000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('WebSocket server initialized', {
      cors: config.cors.origin,
      transports: ['websocket', 'polling']
    });

    return this.io;
  }

  // Setup Socket.io middleware for authentication
  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace('Bearer ', '');
        
        // Verify JWT token
        const decoded = jwt.verify(cleanToken, config.jwt.secret, {
          issuer: config.jwt.issuer,
          audience: config.jwt.audience,
        });

        // Get user from database
        const user = await User.findById(decoded.userId || decoded.id);
        if (!user) {
          return next(new Error('User not found'));
        }

        if (!user.is_active) {
          return next(new Error('User account is deactivated'));
        }

        // Attach user to socket
        socket.user = user;
        socket.userId = user.id;
        
        logger.auth('socket_authenticated', {
          userId: user.id,
          email: user.email,
          socketId: socket.id
        });

        next();
      } catch (error) {
        logger.error('Socket authentication failed', {
          error: error.message,
          socketId: socket.id
        });
        next(new Error('Authentication failed'));
      }
    });

    // Connection logging middleware
    this.io.use((socket, next) => {
      logger.info('Socket connection attempt', {
        socketId: socket.id,
        userId: socket.userId,
        userAgent: socket.handshake.headers['user-agent'],
        ip: socket.handshake.address
      });
      next();
    });
  }

  // Setup event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  // Handle new connection
  handleConnection(socket) {
    const { user, userId } = socket;
    
    // Store connected user
    this.connectedUsers.set(userId, {
      socketId: socket.id,
      user: user,
      connectedAt: new Date(),
      rooms: new Set()
    });

    // Emit connection event
    socket.emit('socket:connect', {
      message: 'Connected to WebSocket server',
      userId: userId,
      timestamp: new Date().toISOString()
    });

    logger.info('Socket connected', {
      socketId: socket.id,
      userId: userId,
      email: user.email,
      totalConnections: this.connectedUsers.size
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle authentication event
    socket.on('socket:authenticate', (data) => {
      this.handleAuthentication(socket, data);
    });

    // Handle chat events
    socket.on('chat:join_room', (data) => {
      this.handleJoinRoom(socket, data);
    });

    socket.on('chat:leave_room', (data) => {
      this.handleLeaveRoom(socket, data);
    });

    socket.on('chat:send_message', (data) => {
      this.handleSendMessage(socket, data);
    });

    socket.on('chat:typing_start', (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('chat:typing_stop', (data) => {
      this.handleTypingStop(socket, data);
    });

    // Handle notification events
    socket.on('notification:send', (data) => {
      this.handleSendNotification(socket, data);
    });

    socket.on('notification:read', (data) => {
      this.handleReadNotification(socket, data);
    });

    // Handle ride events
    socket.on('ride:status_update', (data) => {
      this.handleRideStatusUpdate(socket, data);
    });

    socket.on('ride:location_update', (data) => {
      this.handleRideLocationUpdate(socket, data);
    });

    // Handle error events
    socket.on('error', (error) => {
      this.handleError(socket, error);
    });
  }

  // Handle disconnection
  handleDisconnection(socket, reason) {
    const { userId } = socket;
    
    if (userId) {
      // Remove from connected users
      this.connectedUsers.delete(userId);
      
      // Leave all rooms
      const userRooms = this.userRooms.get(userId) || new Set();
      userRooms.forEach(roomId => {
        socket.leave(roomId);
      });
      this.userRooms.delete(userId);

      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId: userId,
        reason: reason,
        totalConnections: this.connectedUsers.size
      });
    }
  }

  // Handle authentication event
  handleAuthentication(socket, data) {
    // User is already authenticated via middleware
    socket.emit('socket:authenticated', {
      message: 'Authentication successful',
      userId: socket.userId,
      user: {
        id: socket.user.id,
        email: socket.user.email,
        first_name: socket.user.first_name,
        last_name: socket.user.last_name
      },
      timestamp: new Date().toISOString()
    });
  }

  // Handle joining a room
  async handleJoinRoom(socket, data) {
    try {
      const { roomId, roomType = 'chat' } = data;
      const userId = socket.userId;

      if (!roomId) {
        return socket.emit('error', { message: 'Room ID is required' });
      }

      // Check if user is participant of the chat room
      const isParticipant = await ChatRoom.isParticipant(roomId, userId);
      if (!isParticipant) {
        return socket.emit('error', {
          message: 'You are not a participant of this chat room'
        });
      }

      // Join the room
      socket.join(roomId);
      
      // Track user's rooms
      if (!this.userRooms.has(userId)) {
        this.userRooms.set(userId, new Set());
      }
      this.userRooms.get(userId).add(roomId);

      // Update connected users tracking
      const userData = this.connectedUsers.get(userId);
      if (userData) {
        userData.rooms.add(roomId);
      }

      // Emit join confirmation
      socket.emit('chat:room_joined', {
        roomId: roomId,
        roomType: roomType,
        timestamp: new Date().toISOString()
      });

      // Notify other users in the room
      socket.to(roomId).emit('chat:user_joined', {
        roomId: roomId,
        userId: userId,
        user: {
          id: socket.user.id,
          first_name: socket.user.first_name,
          last_name: socket.user.last_name,
          email: socket.user.email,
          profile_image_url: socket.user.profile_image_url
        },
        timestamp: new Date().toISOString()
      });

      logger.info('User joined chat room', {
        userId: userId,
        roomId: roomId,
        roomType: roomType,
        socketId: socket.id
      });

    } catch (error) {
      logger.error('Failed to join chat room', {
        error: error.message,
        userId: socket.userId,
        roomId: data.roomId
      });
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  // Handle leaving a room
  handleLeaveRoom(socket, data) {
    const { roomId } = data;
    const { userId } = socket;

    if (!roomId) {
      socket.emit('error', { message: 'Room ID is required' });
      return;
    }

    try {
      // Leave the room
      socket.leave(roomId);
      
      // Remove from user's rooms tracking
      const userRooms = this.userRooms.get(userId);
      if (userRooms) {
        userRooms.delete(roomId);
      }

      // Update connected users tracking
      const userData = this.connectedUsers.get(userId);
      if (userData) {
        userData.rooms.delete(roomId);
      }

      // Emit leave confirmation
      socket.emit('chat:room_left', {
        roomId: roomId,
        timestamp: new Date().toISOString()
      });

      // Notify other users in the room
      socket.to(roomId).emit('chat:user_left', {
        roomId: roomId,
        userId: userId,
        user: {
          id: socket.user.id,
          first_name: socket.user.first_name,
          last_name: socket.user.last_name
        },
        timestamp: new Date().toISOString()
      });

      logger.info('User left room', {
        userId: userId,
        roomId: roomId,
        socketId: socket.id
      });

    } catch (error) {
      logger.error('Failed to leave room', {
        error: error.message,
        userId: userId,
        roomId: roomId
      });
      socket.emit('error', { message: 'Failed to leave room' });
    }
  }

  // Handle sending a message
  async handleSendMessage(socket, data) {
    try {
      const { roomId, messageText, messageAr, messageEn, messageType = 'text', mediaUrl, mediaType, fileSize, locationData } = data;
      const userId = socket.userId;

      if (!roomId) {
        return socket.emit('error', {
          message: 'Room ID is required'
        });
      }

      // Check if user is participant of the chat room
      const isParticipant = await ChatRoom.isParticipant(roomId, userId);
      if (!isParticipant) {
        return socket.emit('error', {
          message: 'You are not a participant of this chat room'
        });
      }

      // Validate message content based on type
      if (messageType === 'text' && !messageText && !messageAr && !messageEn) {
        return socket.emit('error', {
          message: 'Text message content is required'
        });
      }

      if (messageType === 'image' && !mediaUrl) {
        return socket.emit('error', {
          message: 'Media URL is required for image messages'
        });
      }

      if (messageType === 'file' && (!mediaUrl || !mediaType)) {
        return socket.emit('error', {
          message: 'Media URL and type are required for file messages'
        });
      }

      if (messageType === 'location' && !locationData) {
        return socket.emit('error', {
          message: 'Location data is required for location messages'
        });
      }

      // Create message in database
      const messageData = {
        roomId,
        senderId: userId,
        messageType,
        messageText,
        messageAr,
        messageEn,
        mediaUrl,
        mediaType,
        fileSize,
        locationData
      };

      const message = await ChatMessage.create(messageData);

      // Get room participants
      const participants = await ChatRoom.getParticipants(roomId);

      // Broadcast message to all participants
      participants.forEach(participant => {
        if (participant.user_id !== userId) {
          this.sendToUser(participant.user_id, 'chat:message_received', {
            ...message,
            sender: {
              id: socket.user.id,
              first_name: socket.user.first_name,
              last_name: socket.user.last_name,
              email: socket.user.email,
              profile_image_url: socket.user.profile_image_url
            }
          });
        }
      });

      // Send confirmation to sender
      socket.emit('chat:message_sent', {
        ...message,
        sender: {
          id: socket.user.id,
          first_name: socket.user.first_name,
          last_name: socket.user.last_name,
          email: socket.user.email,
          profile_image_url: socket.user.profile_image_url
        }
      });

      logger.info('Chat message sent', {
        roomId,
        senderId: userId,
        messageType,
        messageId: message.id
      });

    } catch (error) {
      logger.error('Error handling send message', error);
      socket.emit('error', {
        message: 'Failed to send message'
      });
    }
  }

  // Handle typing start
  handleTypingStart(socket, data) {
    const { roomId } = data;
    const { userId } = socket;

    if (!roomId) {
      socket.emit('error', { message: 'Room ID is required' });
      return;
    }

    socket.to(roomId).emit('chat:typing_start', {
      roomId: roomId,
      userId: userId,
      user: {
        id: socket.user.id,
        first_name: socket.user.first_name,
        last_name: socket.user.last_name
      },
      timestamp: new Date().toISOString()
    });
  }

  // Handle typing stop
  handleTypingStop(socket, data) {
    const { roomId } = data;
    const { userId } = socket;

    if (!roomId) {
      socket.emit('error', { message: 'Room ID is required' });
      return;
    }

    socket.to(roomId).emit('chat:typing_stop', {
      roomId: roomId,
      userId: userId,
      timestamp: new Date().toISOString()
    });
  }

  // Handle sending notification
  handleSendNotification(socket, data) {
    const { userId: targetUserId, notification } = data;
    const { userId: senderId } = socket;

    if (!targetUserId || !notification) {
      socket.emit('error', { message: 'Target user ID and notification are required' });
      return;
    }

    try {
      // Check if target user is connected
      const targetUserData = this.connectedUsers.get(targetUserId);
      
      if (targetUserData) {
        // Send notification to connected user
        this.io.to(targetUserData.socketId).emit('notification:received', {
          ...notification,
          senderId: senderId,
          timestamp: new Date().toISOString()
        });
      }

      logger.info('Notification sent', {
        senderId: senderId,
        targetUserId: targetUserId,
        notificationType: notification.type
      });

    } catch (error) {
      logger.error('Failed to send notification', {
        error: error.message,
        senderId: senderId,
        targetUserId: targetUserId
      });
      socket.emit('error', { message: 'Failed to send notification' });
    }
  }

  // Handle reading notification
  handleReadNotification(socket, data) {
    const { notificationId } = data;
    const { userId } = socket;

    if (!notificationId) {
      socket.emit('error', { message: 'Notification ID is required' });
      return;
    }

    try {
      // Emit notification read event
      socket.emit('notification:read', {
        notificationId: notificationId,
        userId: userId,
        timestamp: new Date().toISOString()
      });

      logger.info('Notification marked as read', {
        userId: userId,
        notificationId: notificationId
      });

    } catch (error) {
      logger.error('Failed to mark notification as read', {
        error: error.message,
        userId: userId,
        notificationId: notificationId
      });
      socket.emit('error', { message: 'Failed to mark notification as read' });
    }
  }

  // Handle ride status update
  handleRideStatusUpdate(socket, data) {
    const { rideId, status, statusMessage } = data;
    const { userId } = socket;

    if (!rideId || !status) {
      socket.emit('error', { message: 'Ride ID and status are required' });
      return;
    }

    try {
      const statusData = {
        rideId: rideId,
        status: status,
        statusMessage: statusMessage,
        updatedBy: userId,
        timestamp: new Date().toISOString()
      };

      // Broadcast to ride room
      this.io.to(`ride:${rideId}`).emit('ride:status_update', statusData);

      logger.info('Ride status updated', {
        userId: userId,
        rideId: rideId,
        status: status
      });

    } catch (error) {
      logger.error('Failed to update ride status', {
        error: error.message,
        userId: userId,
        rideId: rideId
      });
      socket.emit('error', { message: 'Failed to update ride status' });
    }
  }

  // Handle ride location update
  handleRideLocationUpdate(socket, data) {
    const { rideId, location } = data;
    const { userId } = socket;

    if (!rideId || !location) {
      socket.emit('error', { message: 'Ride ID and location are required' });
      return;
    }

    try {
      const locationData = {
        rideId: rideId,
        location: location,
        updatedBy: userId,
        timestamp: new Date().toISOString()
      };

      // Broadcast to ride room
      this.io.to(`ride:${rideId}`).emit('ride:location_update', locationData);

      logger.info('Ride location updated', {
        userId: userId,
        rideId: rideId,
        latitude: location.latitude,
        longitude: location.longitude
      });

    } catch (error) {
      logger.error('Failed to update ride location', {
        error: error.message,
        userId: userId,
        rideId: rideId
      });
      socket.emit('error', { message: 'Failed to update ride location' });
    }
  }

  // Handle error
  handleError(socket, error) {
    logger.error('Socket error', {
      error: error.message,
      socketId: socket.id,
      userId: socket.userId
    });

    socket.emit('error', {
      message: 'An error occurred',
      error: error.message
    });
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get connected users
  getConnectedUsers() {
    return Array.from(this.connectedUsers.entries()).map(([userId, data]) => ({
      userId: userId,
      socketId: data.socketId,
      connectedAt: data.connectedAt,
      rooms: Array.from(data.rooms)
    }));
  }

  // Send message to specific user
  sendToUser(userId, event, data) {
    const userData = this.connectedUsers.get(userId);
    if (userData) {
      this.io.to(userData.socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Send message to room
  sendToRoom(roomId, event, data) {
    this.io.to(roomId).emit(event, data);
  }

  // Broadcast to all connected users
  broadcast(event, data, excludeUserId = null) {
    if (excludeUserId) {
      const userData = this.connectedUsers.get(excludeUserId);
      if (userData) {
        this.io.except(userData.socketId).emit(event, data);
      } else {
        this.io.emit(event, data);
      }
    } else {
      this.io.emit(event, data);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

module.exports = socketService; 