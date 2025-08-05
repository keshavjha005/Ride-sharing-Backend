const request = require('supertest');
const app = require('../src/app');
const { executeQuery } = require('../src/config/database');
const { generateToken } = require('../src/utils/jwt');
const InboxConversation = require('../src/models/InboxConversation');
const ConversationParticipant = require('../src/models/ConversationParticipant');
const ChatMessage = require('../src/models/ChatMessage');

describe('Inbox Management System', () => {
  let testUser, testUser2, testUser3;
  let authToken, authToken2, authToken3;
  let testConversation;

  beforeAll(async () => {
    // Create test users
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '+1234567890',
      password: 'password123'
    };

    const userData2 = {
      firstName: 'Test',
      lastName: 'User 2',
      email: 'test2@example.com',
      phone: '+1234567891',
      password: 'password123'
    };

    const userData3 = {
      firstName: 'Test',
      lastName: 'User 3',
      email: 'test3@example.com',
      phone: '+1234567892',
      password: 'password123'
    };

    // Insert test users
    const insertUserQuery = `
      INSERT INTO users (id, first_name, last_name, email, phone, password_hash, is_active)
      VALUES (?, ?, ?, ?, ?, ?, true)
    `;

    testUser = {
      id: 'test-user-1',
      ...userData,
      passwordHash: '$2b$10$test.hash'
    };

    testUser2 = {
      id: 'test-user-2',
      ...userData2,
      passwordHash: '$2b$10$test.hash'
    };

    testUser3 = {
      id: 'test-user-3',
      ...userData3,
      passwordHash: '$2b$10$test.hash'
    };

    await executeQuery(insertUserQuery, [
      testUser.id, testUser.firstName, testUser.lastName, testUser.email, testUser.phone, testUser.passwordHash
    ]);

    await executeQuery(insertUserQuery, [
      testUser2.id, testUser2.firstName, testUser2.lastName, testUser2.email, testUser2.phone, testUser2.passwordHash
    ]);

    await executeQuery(insertUserQuery, [
      testUser3.id, testUser3.firstName, testUser3.lastName, testUser3.email, testUser3.phone, testUser3.passwordHash
    ]);

    // Generate auth tokens
    authToken = generateToken(testUser);
    authToken2 = generateToken(testUser2);
    authToken3 = generateToken(testUser3);
  });

  afterAll(async () => {
    // Clean up test data
    await executeQuery('DELETE FROM conversation_participants WHERE conversation_id LIKE "test%"');
    await executeQuery('DELETE FROM inbox_conversations WHERE id LIKE "test%"');
    await executeQuery('DELETE FROM chat_messages WHERE room_id LIKE "test%"');
    await executeQuery('DELETE FROM users WHERE id LIKE "test%"');
  });

  describe('POST /api/inbox/conversations', () => {
    it('should create a new conversation', async () => {
      const conversationData = {
        conversationType: 'support',
        titleAr: 'محادثة دعم',
        titleEn: 'Support Conversation',
        participants: [
          { userId: testUser2.id, role: 'participant' }
        ]
      };

      const response = await request(app)
        .post('/api/inbox/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conversationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.conversationType).toBe('support');
      expect(response.body.data.titleAr).toBe('محادثة دعم');
      expect(response.body.data.titleEn).toBe('Support Conversation');
      expect(response.body.data.userId).toBe(testUser.id);
      expect(response.body.data.participantCount).toBe(2);

      testConversation = response.body.data;
    });

    it('should create conversation without participants', async () => {
      const conversationData = {
        conversationType: 'system',
        titleAr: 'محادثة نظام',
        titleEn: 'System Conversation'
      };

      const response = await request(app)
        .post('/api/inbox/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conversationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.conversationType).toBe('system');
      expect(response.body.data.participantCount).toBe(1);
    });

    it('should return 400 for missing required fields', async () => {
      const conversationData = {
        conversationType: 'support'
        // Missing titleAr and titleEn
      };

      const response = await request(app)
        .post('/api/inbox/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conversationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should return 400 for invalid conversation type', async () => {
      const conversationData = {
        conversationType: 'invalid',
        titleAr: 'عنوان',
        titleEn: 'Title'
      };

      const response = await request(app)
        .post('/api/inbox/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conversationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid conversation type');
    });
  });

  describe('GET /api/inbox/conversations', () => {
    it('should get user conversations', async () => {
      const response = await request(app)
        .get('/api/inbox/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter conversations by type', async () => {
      const response = await request(app)
        .get('/api/inbox/conversations?conversationType=support')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach(conv => {
        expect(conv.conversationType).toBe('support');
      });
    });

    it('should filter archived conversations', async () => {
      const response = await request(app)
        .get('/api/inbox/conversations?isArchived=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/inbox/conversations?limit=1&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('should validate sort parameters', async () => {
      const response = await request(app)
        .get('/api/inbox/conversations?sortBy=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid sort field');
    });
  });

  describe('GET /api/inbox/conversations/:conversationId', () => {
    it('should get conversation by ID', async () => {
      const response = await request(app)
        .get(`/api/inbox/conversations/${testConversation.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testConversation.id);
      expect(response.body.data.conversationType).toBe('support');
    });

    it('should return 404 for non-existent conversation', async () => {
      const response = await request(app)
        .get('/api/inbox/conversations/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Conversation not found');
    });

    it('should return 403 for non-participant', async () => {
      const response = await request(app)
        .get(`/api/inbox/conversations/${testConversation.id}`)
        .set('Authorization', `Bearer ${authToken3}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('PUT /api/inbox/conversations/:conversationId/archive', () => {
    it('should archive conversation', async () => {
      const response = await request(app)
        .put(`/api/inbox/conversations/${testConversation.id}/archive`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isArchived).toBe(true);
      expect(response.body.message).toBe('Conversation archived successfully');
    });

    it('should return 403 for non-owner', async () => {
      const response = await request(app)
        .put(`/api/inbox/conversations/${testConversation.id}/archive`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('PUT /api/inbox/conversations/:conversationId/unarchive', () => {
    it('should unarchive conversation', async () => {
      const response = await request(app)
        .put(`/api/inbox/conversations/${testConversation.id}/unarchive`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isArchived).toBe(false);
      expect(response.body.message).toBe('Conversation unarchived successfully');
    });
  });

  describe('PUT /api/inbox/conversations/:conversationId/mute', () => {
    it('should mute conversation', async () => {
      const response = await request(app)
        .put(`/api/inbox/conversations/${testConversation.id}/mute`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isMuted).toBe(true);
      expect(response.body.message).toBe('Conversation muted successfully');
    });
  });

  describe('PUT /api/inbox/conversations/:conversationId/unmute', () => {
    it('should unmute conversation', async () => {
      const response = await request(app)
        .put(`/api/inbox/conversations/${testConversation.id}/unmute`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isMuted).toBe(false);
      expect(response.body.message).toBe('Conversation unmuted successfully');
    });
  });

  describe('POST /api/inbox/conversations/:conversationId/messages', () => {
    it('should send message to conversation', async () => {
      const messageData = {
        messageText: 'Hello, this is a test message',
        messageAr: 'مرحبا، هذه رسالة اختبار',
        messageEn: 'Hello, this is a test message',
        messageType: 'text'
      };

      const response = await request(app)
        .post(`/api/inbox/conversations/${testConversation.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messageText).toBe(messageData.messageText);
      expect(response.body.data.messageAr).toBe(messageData.messageAr);
      expect(response.body.data.messageEn).toBe(messageData.messageEn);
      expect(response.body.message).toBe('Message sent successfully');
    });

    it('should return 400 for missing message fields', async () => {
      const messageData = {
        messageText: 'Hello'
        // Missing messageAr and messageEn
      };

      const response = await request(app)
        .post(`/api/inbox/conversations/${testConversation.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should return 403 for non-participant', async () => {
      const messageData = {
        messageText: 'Hello',
        messageAr: 'مرحبا',
        messageEn: 'Hello'
      };

      const response = await request(app)
        .post(`/api/inbox/conversations/${testConversation.id}/messages`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send(messageData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/inbox/conversations/:conversationId/messages', () => {
    it('should get conversation messages', async () => {
      const response = await request(app)
        .get(`/api/inbox/conversations/${testConversation.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support pagination for messages', async () => {
      const response = await request(app)
        .get(`/api/inbox/conversations/${testConversation.id}/messages?limit=1&offset=0`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.offset).toBe(0);
    });
  });

  describe('PUT /api/inbox/messages/:messageId/read', () => {
    it('should mark message as read', async () => {
      // First get a message to mark as read
      const messagesResponse = await request(app)
        .get(`/api/inbox/conversations/${testConversation.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (messagesResponse.body.data.length > 0) {
        const messageId = messagesResponse.body.data[0].id;

        const response = await request(app)
          .put(`/api/inbox/messages/${messageId}/read`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Message marked as read successfully');
      }
    });

    it('should return 404 for non-existent message', async () => {
      const response = await request(app)
        .put('/api/inbox/messages/non-existent-id/read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Message not found');
    });
  });

  describe('GET /api/inbox/search', () => {
    it('should search conversations', async () => {
      const response = await request(app)
        .get('/api/inbox/search?query=support')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should return 400 for empty query', async () => {
      const response = await request(app)
        .get('/api/inbox/search?query=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Search query is required');
    });
  });

  describe('GET /api/inbox/unread-count', () => {
    it('should get unread count', async () => {
      const response = await request(app)
        .get('/api/inbox/unread-count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('unreadCount');
      expect(typeof response.body.data.unreadCount).toBe('number');
    });
  });

  describe('GET /api/inbox/conversations/:conversationId/participants', () => {
    it('should get conversation participants', async () => {
      const response = await request(app)
        .get(`/api/inbox/conversations/${testConversation.id}/participants`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter active participants only', async () => {
      const response = await request(app)
        .get(`/api/inbox/conversations/${testConversation.id}/participants?activeOnly=true`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach(participant => {
        expect(participant.isActive).toBe(true);
      });
    });
  });

  describe('GET /api/inbox/statistics', () => {
    it('should get inbox statistics', async () => {
      const response = await request(app)
        .get('/api/inbox/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/inbox/conversations/:conversationId', () => {
    it('should delete conversation', async () => {
      // Create a conversation to delete
      const conversationData = {
        conversationType: 'marketing',
        titleAr: 'محادثة تسويق',
        titleEn: 'Marketing Conversation'
      };

      const createResponse = await request(app)
        .post('/api/inbox/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conversationData)
        .expect(201);

      const conversationId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/inbox/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Conversation deleted successfully');
    });

    it('should return 403 for non-owner', async () => {
      const response = await request(app)
        .delete(`/api/inbox/conversations/${testConversation.id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('Model Tests', () => {
    it('should create conversation via model', async () => {
      const conversationData = {
        userId: testUser.id,
        conversationType: 'ride',
        titleAr: 'محادثة رحلة',
        titleEn: 'Ride Conversation'
      };

      const conversation = await InboxConversation.create(conversationData);
      expect(conversation).toBeDefined();
      expect(conversation.conversationType).toBe('ride');
      expect(conversation.userId).toBe(testUser.id);

      // Clean up
      await InboxConversation.delete(conversation.id);
    });

    it('should add participant via model', async () => {
      const conversationData = {
        userId: testUser.id,
        conversationType: 'support',
        titleAr: 'محادثة دعم',
        titleEn: 'Support Conversation'
      };

      const conversation = await InboxConversation.create(conversationData);
      const participant = await ConversationParticipant.add(conversation.id, testUser2.id, 'participant');

      expect(participant).toBeDefined();
      expect(participant.conversationId).toBe(conversation.id);
      expect(participant.userId).toBe(testUser2.id);
      expect(participant.role).toBe('participant');

      // Clean up
      await InboxConversation.delete(conversation.id);
    });

    it('should search conversations via model', async () => {
      const conversations = await InboxConversation.search(testUser.id, 'support');
      expect(Array.isArray(conversations)).toBe(true);
    });

    it('should get unread count via model', async () => {
      const unreadCount = await InboxConversation.getUnreadCount(testUser.id);
      expect(typeof unreadCount).toBe('number');
    });
  });
}); 