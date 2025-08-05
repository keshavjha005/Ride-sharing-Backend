const request = require('supertest');
const app = require('../src/app');
const { executeQuery } = require('../src/config/database');
const ChatRoom = require('../src/models/ChatRoom');
const ChatMessage = require('../src/models/ChatMessage');
const User = require('../src/models/User');
const Ride = require('../src/models/Ride');

describe('Chat System API', () => {
  let authToken;
  let testUser;
  let testUser2;
  let testRide;
  let testChatRoom;
  let testMessage;

  beforeAll(async () => {
    // Create test users
    testUser = await User.create({
      email: 'testuser@example.com',
      password_hash: 'hashedpassword',
      first_name: 'Test',
      last_name: 'User',
      language_code: 'en',
      currency_code: 'USD'
    });

    testUser2 = await User.create({
      email: 'testuser2@example.com',
      password_hash: 'hashedpassword',
      first_name: 'Test',
      last_name: 'User2',
      language_code: 'en',
      currency_code: 'USD'
    });

    // Create test ride
    testRide = await Ride.create({
      createdBy: testUser.id,
      vehicleInformationId: 'test-vehicle-id',
      totalSeats: 4,
      pricePerSeat: 25.00,
      departureDateTime: new Date(Date.now() + 86400000), // Tomorrow
      distance: 100,
      estimatedTime: 60
    });

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await executeQuery('DELETE FROM message_status WHERE message_id IN (SELECT id FROM chat_messages WHERE room_id = ?)', [testChatRoom?.id]);
    await executeQuery('DELETE FROM chat_messages WHERE room_id = ?', [testChatRoom?.id]);
    await executeQuery('DELETE FROM chat_room_participants WHERE room_id = ?', [testChatRoom?.id]);
    await executeQuery('DELETE FROM chat_rooms WHERE id = ?', [testChatRoom?.id]);
    await executeQuery('DELETE FROM rides WHERE id = ?', [testRide?.id]);
    await executeQuery('DELETE FROM users WHERE id IN (?, ?)', [testUser?.id, testUser2?.id]);
  });

  describe('Chat Room Management', () => {
    test('should create a new chat room', async () => {
      const response = await request(app)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roomType: 'ride',
          rideId: testRide.id,
          titleEn: 'Test Ride Chat',
          titleAr: 'محادثة الرحلة التجريبية',
          participants: [testUser2.id]
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.room_type).toBe('ride');
      expect(response.body.data.ride_id).toBe(testRide.id);
      expect(response.body.data.title_en).toBe('Test Ride Chat');
      expect(response.body.data.title_ar).toBe('محادثة الرحلة التجريبية');
      expect(response.body.data.participants).toHaveLength(2);

      testChatRoom = response.body.data;
    });

    test('should get user chat rooms', async () => {
      const response = await request(app)
        .get('/api/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('room_type');
      expect(response.body.data[0]).toHaveProperty('unread_count');
    });

    test('should get chat room by ID', async () => {
      const response = await request(app)
        .get(`/api/chat/rooms/${testChatRoom.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testChatRoom.id);
      expect(response.body.data.participants).toBeInstanceOf(Array);
      expect(response.body.data.unread_count).toBeDefined();
    });

    test('should update chat room', async () => {
      const response = await request(app)
        .put(`/api/chat/rooms/${testChatRoom.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleEn: 'Updated Test Ride Chat',
          titleAr: 'محادثة الرحلة التجريبية المحدثة'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title_en).toBe('Updated Test Ride Chat');
      expect(response.body.data.title_ar).toBe('محادثة الرحلة التجريبية المحدثة');
    });

    test('should get chat room participants', async () => {
      const response = await request(app)
        .get(`/api/chat/rooms/${testChatRoom.id}/participants`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('user_id');
      expect(response.body.data[0]).toHaveProperty('role');
      expect(response.body.data[0]).toHaveProperty('first_name');
      expect(response.body.data[0]).toHaveProperty('last_name');
    });
  });

  describe('Chat Messages', () => {
    test('should send a text message', async () => {
      const response = await request(app)
        .post(`/api/chat/rooms/${testChatRoom.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messageType: 'text',
          messageText: 'Hello, this is a test message!',
          messageEn: 'Hello, this is a test message!',
          messageAr: 'مرحبا، هذه رسالة تجريبية!'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message_type).toBe('text');
      expect(response.body.data.message_text).toBe('Hello, this is a test message!');
      expect(response.body.data.sender_id).toBe(testUser.id);

      testMessage = response.body.data;
    });

    test('should send an image message', async () => {
      const response = await request(app)
        .post(`/api/chat/rooms/${testChatRoom.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messageType: 'image',
          mediaUrl: 'https://example.com/image.jpg',
          mediaType: 'image/jpeg',
          fileSize: 1024000
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message_type).toBe('image');
      expect(response.body.data.media_url).toBe('https://example.com/image.jpg');
      expect(response.body.data.media_type).toBe('image/jpeg');
    });

    test('should send a location message', async () => {
      const response = await request(app)
        .post(`/api/chat/rooms/${testChatRoom.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messageType: 'location',
          locationData: {
            latitude: 24.7136,
            longitude: 46.6753,
            address: 'Riyadh, Saudi Arabia'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message_type).toBe('location');
      expect(response.body.data.location_data).toBeDefined();
    });

    test('should get chat messages', async () => {
      const response = await request(app)
        .get(`/api/chat/rooms/${testChatRoom.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('message_type');
      expect(response.body.data[0]).toHaveProperty('sender_id');
    });

    test('should update a message', async () => {
      const response = await request(app)
        .put(`/api/chat/messages/${testMessage.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messageText: 'Updated test message!',
          messageEn: 'Updated test message!',
          messageAr: 'رسالة تجريبية محدثة!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message_text).toBe('Updated test message!');
      expect(response.body.data.is_edited).toBe(true);
    });

    test('should search messages', async () => {
      const response = await request(app)
        .get(`/api/chat/rooms/${testChatRoom.id}/search?query=test`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should mark messages as read', async () => {
      const response = await request(app)
        .post(`/api/chat/rooms/${testChatRoom.id}/mark-read`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          before: new Date().toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should get chat room statistics', async () => {
      const response = await request(app)
        .get(`/api/chat/rooms/${testChatRoom.id}/statistics`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_messages');
      expect(response.body.data).toHaveProperty('text_messages');
      expect(response.body.data).toHaveProperty('image_messages');
      expect(response.body.data).toHaveProperty('location_messages');
      expect(response.body.data).toHaveProperty('unread_count');
    });
  });

  describe('Chat Participants', () => {
    test('should add participant to chat room', async () => {
      const newUser = await User.create({
        email: 'newuser@example.com',
        password_hash: 'hashedpassword',
        first_name: 'New',
        last_name: 'User',
        language_code: 'en',
        currency_code: 'USD'
      });

      const response = await request(app)
        .post(`/api/chat/rooms/${testChatRoom.id}/participants`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: newUser.id,
          role: 'participant'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // Clean up
      await executeQuery('DELETE FROM users WHERE id = ?', [newUser.id]);
    });

    test('should remove participant from chat room', async () => {
      const response = await request(app)
        .delete(`/api/chat/rooms/${testChatRoom.id}/participants/${testUser2.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should return 400 for invalid room type', async () => {
      const response = await request(app)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roomType: 'invalid',
          titleEn: 'Test Room'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 403 for non-participant access', async () => {
      const nonParticipantUser = await User.create({
        email: 'nonparticipant@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Non',
        last_name: 'Participant',
        language_code: 'en',
        currency_code: 'USD'
      });

      const nonParticipantToken = 'test-token'; // You would need to get a real token

      const response = await request(app)
        .get(`/api/chat/rooms/${testChatRoom.id}/messages`)
        .set('Authorization', `Bearer ${nonParticipantToken}`);

      expect(response.status).toBe(401); // Unauthorized due to invalid token

      // Clean up
      await executeQuery('DELETE FROM users WHERE id = ?', [nonParticipantUser.id]);
    });

    test('should return 404 for non-existent room', async () => {
      const response = await request(app)
        .get('/api/chat/rooms/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return 400 for invalid message type', async () => {
      const response = await request(app)
        .post(`/api/chat/rooms/${testChatRoom.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messageType: 'invalid',
          messageText: 'Test message'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Validation', () => {
    test('should validate required fields for creating room', async () => {
      const response = await request(app)
        .post('/api/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should validate UUID format for room ID', async () => {
      const response = await request(app)
        .get('/api/chat/rooms/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should validate message content for text messages', async () => {
      const response = await request(app)
        .post(`/api/chat/rooms/${testChatRoom.id}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messageType: 'text'
          // Missing message content
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
}); 