const { validationResult } = require('express-validator');
const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const Ride = require('../models/Ride');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Get user's chat rooms
 * GET /api/chat/rooms
 */
const getUserChatRooms = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    const rooms = await ChatRoom.findByUserId(userId, parseInt(limit), parseInt(offset));

    // Get unread counts for each room
    const roomsWithUnreadCounts = await Promise.all(
      rooms.map(async (room) => {
        const unreadCount = await ChatMessage.getUnreadCount(room.id, userId);
        return {
          ...room,
          unread_count: unreadCount
        };
      })
    );

    res.json({
      success: true,
      data: roomsWithUnreadCounts,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: roomsWithUnreadCounts.length
      }
    });
  } catch (error) {
    logger.error('Error getting user chat rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat rooms'
    });
  }
};

/**
 * Create a new chat room
 * POST /api/chat/rooms
 */
const createChatRoom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { roomType, rideId, titleAr, titleEn, participants } = req.body;
    const userId = req.user.id;

    // Validate ride exists if room type is 'ride'
    if (roomType === 'ride' && rideId) {
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return res.status(400).json({
          success: false,
          message: 'Ride not found'
        });
      }
    }

    // Check if room already exists for ride
    if (roomType === 'ride' && rideId) {
      const existingRoom = await ChatRoom.findByRideId(rideId);
      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: 'Chat room already exists for this ride'
        });
      }
    }

    // Create chat room
    const roomData = {
      roomType,
      rideId: roomType === 'ride' ? rideId : null,
      titleAr,
      titleEn
    };

    const room = await ChatRoom.create(roomData);

    // Add creator as admin
    await ChatRoom.addParticipant(room.id, userId, 'admin');

    // Add other participants
    if (participants && Array.isArray(participants)) {
      for (const participantId of participants) {
        // Validate user exists
        const user = await User.findById(participantId);
        if (user) {
          await ChatRoom.addParticipant(room.id, participantId, 'participant');
        }
      }
    }

    // Get room with participants
    const roomWithParticipants = await ChatRoom.findById(room.id);
    const participantsList = await ChatRoom.getParticipants(room.id);

    res.status(201).json({
      success: true,
      data: {
        ...roomWithParticipants,
        participants: participantsList
      }
    });
  } catch (error) {
    logger.error('Error creating chat room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat room'
    });
  }
};

/**
 * Get chat room by ID
 * GET /api/chat/rooms/:roomId
 */
const getChatRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Check if user is participant
    const isParticipant = await ChatRoom.isParticipant(roomId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant of this chat room.'
      });
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    const participants = await ChatRoom.getParticipants(roomId);
    const unreadCount = await ChatMessage.getUnreadCount(roomId, userId);

    res.json({
      success: true,
      data: {
        ...room,
        participants,
        unread_count: unreadCount
      }
    });
  } catch (error) {
    logger.error('Error getting chat room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat room'
    });
  }
};

/**
 * Update chat room
 * PUT /api/chat/rooms/:roomId
 */
const updateChatRoom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { roomId } = req.params;
    const { titleAr, titleEn } = req.body;
    const userId = req.user.id;

    // Check if user is admin or moderator
    const userRole = await ChatRoom.getUserRole(roomId, userId);
    if (!userRole || (userRole !== 'admin' && userRole !== 'moderator')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins and moderators can update chat rooms.'
      });
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    const updateData = {};
    if (titleAr !== undefined) updateData.titleAr = titleAr;
    if (titleEn !== undefined) updateData.titleEn = titleEn;

    const updatedRoom = await ChatRoom.update(roomId, updateData);

    res.json({
      success: true,
      data: updatedRoom
    });
  } catch (error) {
    logger.error('Error updating chat room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update chat room'
    });
  }
};

/**
 * Get chat messages for a room
 * GET /api/chat/rooms/:roomId/messages
 */
const getChatMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0, before } = req.query;
    const userId = req.user.id;

    // Check if user is participant
    const isParticipant = await ChatRoom.isParticipant(roomId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant of this chat room.'
      });
    }

    const messages = await ChatMessage.findByRoomId(
      roomId, 
      parseInt(limit), 
      parseInt(offset), 
      before ? new Date(before) : null
    );

    // Mark messages as read
    if (messages.length > 0) {
      await ChatMessage.markAsRead(roomId, userId);
    }

    res.json({
      success: true,
      data: messages,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: messages.length
      }
    });
  } catch (error) {
    logger.error('Error getting chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat messages'
    });
  }
};

/**
 * Send a message to a chat room
 * POST /api/chat/rooms/:roomId/messages
 */
const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { roomId } = req.params;
    const { 
      messageType = 'text', 
      messageText, 
      messageAr, 
      messageEn, 
      mediaUrl, 
      mediaType, 
      fileSize, 
      locationData 
    } = req.body;
    const userId = req.user.id;

    // Check if user is participant
    const isParticipant = await ChatRoom.isParticipant(roomId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant of this chat room.'
      });
    }

    // Validate message content based on type
    if (messageType === 'text' && !messageText && !messageAr && !messageEn) {
      return res.status(400).json({
        success: false,
        message: 'Text message content is required'
      });
    }

    if (messageType === 'image' && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Media URL is required for image messages'
      });
    }

    if (messageType === 'file' && (!mediaUrl || !mediaType)) {
      return res.status(400).json({
        success: false,
        message: 'Media URL and type are required for file messages'
      });
    }

    if (messageType === 'location' && !locationData) {
      return res.status(400).json({
        success: false,
        message: 'Location data is required for location messages'
      });
    }

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

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

/**
 * Update a message
 * PUT /api/chat/messages/:messageId
 */
const updateMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { messageId } = req.params;
    const { messageText, messageAr, messageEn } = req.body;
    const userId = req.user.id;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.sender_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only edit your own messages.'
      });
    }

    // Check if message is not too old (e.g., 5 minutes)
    const messageAge = Date.now() - new Date(message.created_at).getTime();
    const maxEditTime = 5 * 60 * 1000; // 5 minutes
    if (messageAge > maxEditTime) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be edited after 5 minutes'
      });
    }

    const updateData = {
      messageText,
      messageAr,
      messageEn,
      isEdited: true
    };

    const updatedMessage = await ChatMessage.update(messageId, updateData);

    res.json({
      success: true,
      data: updatedMessage
    });
  } catch (error) {
    logger.error('Error updating message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message'
    });
  }
};

/**
 * Delete a message
 * DELETE /api/chat/messages/:messageId
 */
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender or admin/moderator
    const userRole = await ChatRoom.getUserRole(message.room_id, userId);
    const canDelete = message.sender_id === userId || userRole === 'admin' || userRole === 'moderator';

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own messages or have admin/moderator privileges.'
      });
    }

    await ChatMessage.delete(messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};

/**
 * Get chat room participants
 * GET /api/chat/rooms/:roomId/participants
 */
const getChatRoomParticipants = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Check if user is participant
    const isParticipant = await ChatRoom.isParticipant(roomId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant of this chat room.'
      });
    }

    const participants = await ChatRoom.getParticipants(roomId);

    res.json({
      success: true,
      data: participants
    });
  } catch (error) {
    logger.error('Error getting chat room participants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat room participants'
    });
  }
};

/**
 * Add participant to chat room
 * POST /api/chat/rooms/:roomId/participants
 */
const addChatRoomParticipant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { roomId } = req.params;
    const { userId, role = 'participant' } = req.body;
    const currentUserId = req.user.id;

    // Check if current user is admin or moderator
    const userRole = await ChatRoom.getUserRole(roomId, currentUserId);
    if (!userRole || (userRole !== 'admin' && userRole !== 'moderator')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins and moderators can add participants.'
      });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a participant
    const isParticipant = await ChatRoom.isParticipant(roomId, userId);
    if (isParticipant) {
      return res.status(400).json({
        success: false,
        message: 'User is already a participant of this chat room'
      });
    }

    await ChatRoom.addParticipant(roomId, userId, role);

    res.status(201).json({
      success: true,
      message: 'Participant added successfully'
    });
  } catch (error) {
    logger.error('Error adding chat room participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add participant'
    });
  }
};

/**
 * Remove participant from chat room
 * DELETE /api/chat/rooms/:roomId/participants/:userId
 */
const removeChatRoomParticipant = async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    const currentUserId = req.user.id;

    // Check if current user is admin or moderator, or if they're removing themselves
    const userRole = await ChatRoom.getUserRole(roomId, currentUserId);
    const canRemove = userRole === 'admin' || userRole === 'moderator' || currentUserId === userId;

    if (!canRemove) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins and moderators can remove participants.'
      });
    }

    // Check if user is a participant
    const isParticipant = await ChatRoom.isParticipant(roomId, userId);
    if (!isParticipant) {
      return res.status(400).json({
        success: false,
        message: 'User is not a participant of this chat room'
      });
    }

    await ChatRoom.removeParticipant(roomId, userId);

    res.json({
      success: true,
      message: 'Participant removed successfully'
    });
  } catch (error) {
    logger.error('Error removing chat room participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove participant'
    });
  }
};

/**
 * Search messages in a chat room
 * GET /api/chat/rooms/:roomId/search
 */
const searchMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { query, limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Check if user is participant
    const isParticipant = await ChatRoom.isParticipant(roomId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant of this chat room.'
      });
    }

    const messages = await ChatMessage.search(roomId, query, parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      data: messages,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: messages.length
      }
    });
  } catch (error) {
    logger.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages'
    });
  }
};

/**
 * Mark messages as read
 * POST /api/chat/rooms/:roomId/mark-read
 */
const markMessagesAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { before } = req.body;
    const userId = req.user.id;

    // Check if user is participant
    const isParticipant = await ChatRoom.isParticipant(roomId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant of this chat room.'
      });
    }

    await ChatMessage.markAsRead(roomId, userId, before ? new Date(before) : null);

    res.json({
      success: true,
      message: 'Messages marked as read successfully'
    });
  } catch (error) {
    logger.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

/**
 * Get message statistics for a room
 * GET /api/chat/rooms/:roomId/statistics
 */
const getChatRoomStatistics = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Check if user is participant
    const isParticipant = await ChatRoom.isParticipant(roomId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant of this chat room.'
      });
    }

    const statistics = await ChatMessage.getStatistics(roomId);
    const unreadCount = await ChatMessage.getUnreadCount(roomId, userId);

    res.json({
      success: true,
      data: {
        ...statistics,
        unread_count: unreadCount
      }
    });
  } catch (error) {
    logger.error('Error getting chat room statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat room statistics'
    });
  }
};

module.exports = {
  getUserChatRooms,
  createChatRoom,
  getChatRoom,
  updateChatRoom,
  getChatMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  getChatRoomParticipants,
  addChatRoomParticipant,
  removeChatRoomParticipant,
  searchMessages,
  markMessagesAsRead,
  getChatRoomStatistics
}; 