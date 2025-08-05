const InboxConversation = require('../models/InboxConversation');
const ConversationParticipant = require('../models/ConversationParticipant');
const ChatMessage = require('../models/ChatMessage');
const logger = require('../utils/logger');

/**
 * Get user's conversations
 * GET /api/inbox/conversations
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      conversationType,
      isArchived = false,
      isMuted = false,
      limit = 20,
      offset = 0,
      sortBy = 'last_message_at',
      sortOrder = 'DESC'
    } = req.query;

    // Validate sortBy field
    const allowedSortFields = ['last_message_at', 'created_at', 'unread_count'];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort field. Allowed fields: last_message_at, created_at, unread_count'
      });
    }

    // Validate sortOrder
    if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sort order. Use ASC or DESC'
      });
    }

    const options = {
      conversationType,
      isArchived: isArchived === 'true',
      isMuted: isMuted === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      sortOrder: sortOrder.toUpperCase()
    };

    const conversations = await InboxConversation.findByUserId(userId, options);

    res.json({
      success: true,
      data: conversations.map(conv => conv.toJSON()),
      pagination: {
        limit: options.limit,
        offset: options.offset,
        total: conversations.length
      }
    });
  } catch (error) {
    logger.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations',
      error: error.message
    });
  }
};

/**
 * Get conversation by ID
 * GET /api/inbox/conversations/:conversationId
 */
const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await InboxConversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is participant
    const isParticipant = await ConversationParticipant.isParticipant(conversationId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this conversation'
      });
    }

    res.json({
      success: true,
      data: conversation.toJSON()
    });
  } catch (error) {
    logger.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation',
      error: error.message
    });
  }
};

/**
 * Create new conversation
 * POST /api/inbox/conversations
 */
const createConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      conversationType,
      titleAr,
      titleEn,
      participants = []
    } = req.body;

    // Validate required fields
    if (!conversationType || !titleAr || !titleEn) {
      return res.status(400).json({
        success: false,
        message: 'conversationType, titleAr, and titleEn are required'
      });
    }

    // Validate conversation type
    const allowedTypes = ['ride', 'support', 'system', 'marketing'];
    if (!allowedTypes.includes(conversationType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation type. Allowed types: ride, support, system, marketing'
      });
    }

    // Create conversation
    const conversationData = {
      userId,
      conversationType,
      titleAr,
      titleEn
    };

    const conversation = await InboxConversation.create(conversationData);

    // Add participants if provided
    if (participants.length > 0) {
      const participantData = participants.map(p => ({
        userId: p.userId,
        role: p.role || 'participant'
      }));

      // Add current user as participant
      participantData.unshift({
        userId,
        role: 'participant'
      });

      await ConversationParticipant.bulkAdd(conversation.id, participantData);
    } else {
      // Add current user as participant
      await ConversationParticipant.add(conversation.id, userId, 'participant');
    }

    // Get updated conversation with participant count
    const updatedConversation = await InboxConversation.findById(conversation.id);

    res.status(201).json({
      success: true,
      data: updatedConversation.toJSON(),
      message: 'Conversation created successfully'
    });
  } catch (error) {
    logger.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
      error: error.message
    });
  }
};

/**
 * Archive conversation
 * PUT /api/inbox/conversations/:conversationId/archive
 */
const archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await InboxConversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user owns the conversation
    if (conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only archive your own conversations'
      });
    }

    const archivedConversation = await InboxConversation.archive(conversationId);

    res.json({
      success: true,
      data: archivedConversation.toJSON(),
      message: 'Conversation archived successfully'
    });
  } catch (error) {
    logger.error('Error archiving conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive conversation',
      error: error.message
    });
  }
};

/**
 * Unarchive conversation
 * PUT /api/inbox/conversations/:conversationId/unarchive
 */
const unarchiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await InboxConversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user owns the conversation
    if (conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only unarchive your own conversations'
      });
    }

    const unarchivedConversation = await InboxConversation.unarchive(conversationId);

    res.json({
      success: true,
      data: unarchivedConversation.toJSON(),
      message: 'Conversation unarchived successfully'
    });
  } catch (error) {
    logger.error('Error unarchiving conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unarchive conversation',
      error: error.message
    });
  }
};

/**
 * Mute conversation
 * PUT /api/inbox/conversations/:conversationId/mute
 */
const muteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await InboxConversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user owns the conversation
    if (conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only mute your own conversations'
      });
    }

    const mutedConversation = await InboxConversation.mute(conversationId);

    res.json({
      success: true,
      data: mutedConversation.toJSON(),
      message: 'Conversation muted successfully'
    });
  } catch (error) {
    logger.error('Error muting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mute conversation',
      error: error.message
    });
  }
};

/**
 * Unmute conversation
 * PUT /api/inbox/conversations/:conversationId/unmute
 */
const unmuteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await InboxConversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user owns the conversation
    if (conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only unmute your own conversations'
      });
    }

    const unmutedConversation = await InboxConversation.unmute(conversationId);

    res.json({
      success: true,
      data: unmutedConversation.toJSON(),
      message: 'Conversation unmuted successfully'
    });
  } catch (error) {
    logger.error('Error unmuting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unmute conversation',
      error: error.message
    });
  }
};

/**
 * Delete conversation
 * DELETE /api/inbox/conversations/:conversationId
 */
const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await InboxConversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user owns the conversation
    if (conversation.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own conversations'
      });
    }

    await InboxConversation.delete(conversationId);

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
      error: error.message
    });
  }
};

/**
 * Get conversation messages
 * GET /api/inbox/conversations/:conversationId/messages
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    // Check if user is participant
    const isParticipant = await ConversationParticipant.isParticipant(conversationId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this conversation'
      });
    }

    // Get messages from chat system
    const messages = await ChatMessage.findByRoomId(conversationId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: messages.map(msg => msg.toJSON()),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: messages.length
      }
    });
  } catch (error) {
    logger.error('Error getting conversation messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation messages',
      error: error.message
    });
  }
};

/**
 * Send message to conversation
 * POST /api/inbox/conversations/:conversationId/messages
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { messageText, messageAr, messageEn, messageType = 'text' } = req.body;

    // Validate required fields
    if (!messageText || !messageAr || !messageEn) {
      return res.status(400).json({
        success: false,
        message: 'messageText, messageAr, and messageEn are required'
      });
    }

    // Check if user is participant
    const isParticipant = await ConversationParticipant.isParticipant(conversationId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this conversation'
      });
    }

    // Create message in chat system
    const messageData = {
      roomId: conversationId,
      senderId: userId,
      messageText,
      messageAr,
      messageEn,
      messageType
    };

    const message = await ChatMessage.create(messageData);

    // Update conversation's last message
    await InboxConversation.updateLastMessage(conversationId, {
      messageAr,
      messageEn
    });

    // Increment unread count for other participants
    const participants = await ConversationParticipant.findByConversationId(conversationId);
    for (const participant of participants) {
      if (participant.userId !== userId) {
        await InboxConversation.incrementUnreadCount(conversationId);
      }
    }

    res.status(201).json({
      success: true,
      data: message.toJSON(),
      message: 'Message sent successfully'
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

/**
 * Mark message as read
 * PUT /api/inbox/messages/:messageId/read
 */
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    // Get message to find conversation
    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is participant in conversation
    const isParticipant = await ConversationParticipant.isParticipant(message.roomId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this conversation'
      });
    }

    // Mark message as read in chat system
    await ChatMessage.markAsRead(messageId, userId);

    // Reset unread count for conversation
    await InboxConversation.resetUnreadCount(message.roomId);

    res.json({
      success: true,
      message: 'Message marked as read successfully'
    });
  } catch (error) {
    logger.error('Error marking message as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message
    });
  }
};

/**
 * Search conversations
 * GET /api/inbox/search
 */
const searchConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, limit = 20, offset = 0 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const conversations = await InboxConversation.search(userId, query.trim(), {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: conversations.map(conv => conv.toJSON()),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: conversations.length
      }
    });
  } catch (error) {
    logger.error('Error searching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search conversations',
      error: error.message
    });
  }
};

/**
 * Get unread count
 * GET /api/inbox/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await InboxConversation.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        unreadCount
      }
    });
  } catch (error) {
    logger.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

/**
 * Get conversation participants
 * GET /api/inbox/conversations/:conversationId/participants
 */
const getParticipants = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { activeOnly = true, limit = 50, offset = 0 } = req.query;

    // Check if user is participant
    const isParticipant = await ConversationParticipant.isParticipant(conversationId, userId);
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this conversation'
      });
    }

    const participants = await ConversationParticipant.findByConversationId(conversationId, {
      activeOnly: activeOnly === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: participants.map(p => p.toJSON()),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: participants.length
      }
    });
  } catch (error) {
    logger.error('Error getting conversation participants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation participants',
      error: error.message
    });
  }
};

/**
 * Get conversation statistics
 * GET /api/inbox/statistics
 */
const getStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    const statistics = await InboxConversation.getStatistics(userId);

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting inbox statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inbox statistics',
      error: error.message
    });
  }
};

module.exports = {
  getConversations,
  getConversation,
  createConversation,
  archiveConversation,
  unarchiveConversation,
  muteConversation,
  unmuteConversation,
  deleteConversation,
  getMessages,
  sendMessage,
  markMessageAsRead,
  searchConversations,
  getUnreadCount,
  getParticipants,
  getStatistics
}; 