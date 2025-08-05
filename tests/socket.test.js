const request = require('supertest');
const { io } = require('socket.io-client');
const app = require('../src/app');
const socketService = require('../src/services/socketService');
const { generateAccessToken } = require('../src/utils/jwt');
const User = require('../src/models/User');

describe('WebSocket Server Tests', () => {
  let server;
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Create test server
    server = app.listen(0); // Use random port
    
    // Initialize WebSocket server
    socketService.initialize(server);
    
    // Create test user
    testUser = await User.create({
      email: 'socket-test@example.com',
      password_hash: 'test-hash',
      first_name: 'Socket',
      last_name: 'Test',
      language_code: 'en',
      currency_code: 'USD'
    });
    
    // Generate auth token
    authToken = generateAccessToken({ userId: testUser.id });
  });

  afterAll(async () => {
    // Clean up
    if (testUser) {
      await User.delete(testUser.id);
    }
    
    if (server) {
      server.close();
    }
  });

  describe('WebSocket Connection', () => {
    test('should connect with valid token', (done) => {
      const socket = io(`http://localhost:${server.address().port}`, {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      });

      socket.on('connect', () => {
        expect(socket.connected).toBe(true);
        socket.disconnect();
        done();
      });

      socket.on('connect_error', (error) => {
        done(error);
      });
    });

    test('should reject connection without token', (done) => {
      const socket = io(`http://localhost:${server.address().port}`, {
        transports: ['websocket']
      });

      socket.on('connect_error', (error) => {
        expect(error.message).toBe('Authentication token required');
        done();
      });

      socket.on('connect', () => {
        done(new Error('Should not have connected'));
      });
    });

    test('should reject connection with invalid token', (done) => {
      const socket = io(`http://localhost:${server.address().port}`, {
        auth: {
          token: 'invalid-token'
        },
        transports: ['websocket']
      });

      socket.on('connect_error', (error) => {
        expect(error.message).toBe('Authentication failed');
        done();
      });

      socket.on('connect', () => {
        done(new Error('Should not have connected'));
      });
    });
  });

  describe('WebSocket Events', () => {
    let socket;

    beforeEach((done) => {
      socket = io(`http://localhost:${server.address().port}`, {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      });

      socket.on('connect', () => {
        done();
      });
    });

    afterEach(() => {
      if (socket) {
        socket.disconnect();
      }
    });

    test('should emit socket:connect event on connection', (done) => {
      socket.on('socket:connect', (data) => {
        expect(data.message).toBe('Connected to WebSocket server');
        expect(data.userId).toBe(testUser.id);
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    test('should handle socket:authenticate event', (done) => {
      socket.emit('socket:authenticate', {});

      socket.on('socket:authenticated', (data) => {
        expect(data.message).toBe('Authentication successful');
        expect(data.userId).toBe(testUser.id);
        expect(data.user.id).toBe(testUser.id);
        expect(data.user.email).toBe(testUser.email);
        done();
      });
    });

    test('should handle chat:join_room event', (done) => {
      const roomId = 'test-room-123';
      
      socket.emit('chat:join_room', { roomId, roomType: 'chat' });

      socket.on('chat:room_joined', (data) => {
        expect(data.roomId).toBe(roomId);
        expect(data.roomType).toBe('chat');
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    test('should handle chat:send_message event', (done) => {
      const roomId = 'test-room-456';
      const message = 'Hello, world!';
      
      // Join room first
      socket.emit('chat:join_room', { roomId });
      
      setTimeout(() => {
        socket.emit('chat:send_message', { roomId, message });
      }, 100);

      socket.on('chat:message', (data) => {
        expect(data.roomId).toBe(roomId);
        expect(data.message).toBe(message);
        expect(data.senderId).toBe(testUser.id);
        expect(data.sender.id).toBe(testUser.id);
        expect(data.messageType).toBe('text');
        done();
      });
    });

    test('should handle chat:typing_start and chat:typing_stop events', (done) => {
      const roomId = 'test-room-789';
      let typingStartReceived = false;
      let typingStopReceived = false;
      
      // Join room first
      socket.emit('chat:join_room', { roomId });
      
      setTimeout(() => {
        socket.emit('chat:typing_start', { roomId });
      }, 100);

      socket.on('chat:typing_start', (data) => {
        expect(data.roomId).toBe(roomId);
        expect(data.userId).toBe(testUser.id);
        typingStartReceived = true;
        
        if (typingStartReceived && typingStopReceived) {
          done();
        }
      });

      setTimeout(() => {
        socket.emit('chat:typing_stop', { roomId });
      }, 200);

      socket.on('chat:typing_stop', (data) => {
        expect(data.roomId).toBe(roomId);
        expect(data.userId).toBe(testUser.id);
        typingStopReceived = true;
        
        if (typingStartReceived && typingStopReceived) {
          done();
        }
      });
    });
  });

  describe('WebSocket API Endpoints', () => {
    test('should get WebSocket status', async () => {
      const response = await request(app)
        .get('/api/socket/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isRunning).toBe(true);
      expect(response.body.data.connectedUsers).toBeGreaterThanOrEqual(0);
      expect(response.body.data.uptime).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });

    test('should get connected users', async () => {
      const response = await request(app)
        .get('/api/socket/connected-users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.count).toBeGreaterThanOrEqual(0);
    });

    test('should send message to room', async () => {
      const response = await request(app)
        .post('/api/socket/send-to-room')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roomId: 'test-room-api',
          event: 'test:message',
          data: { message: 'Test message from API' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Message sent to room successfully');
    });

    test('should broadcast message', async () => {
      const response = await request(app)
        .post('/api/socket/broadcast')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          event: 'test:broadcast',
          data: { message: 'Broadcast test message' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Message broadcasted successfully');
    });
  });

  describe('WebSocket Service Methods', () => {
    test('should get connected users count', () => {
      const count = socketService.getConnectedUsersCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should get connected users', () => {
      const users = socketService.getConnectedUsers();
      expect(Array.isArray(users)).toBe(true);
      
      if (users.length > 0) {
        const user = users[0];
        expect(user.userId).toBeDefined();
        expect(user.socketId).toBeDefined();
        expect(user.connectedAt).toBeDefined();
        expect(Array.isArray(user.rooms)).toBe(true);
      }
    });

    test('should send message to user', () => {
      const result = socketService.sendToUser(testUser.id, 'test:event', { test: 'data' });
      expect(typeof result).toBe('boolean');
    });

    test('should send message to room', () => {
      // This should not throw an error
      expect(() => {
        socketService.sendToRoom('test-room', 'test:event', { test: 'data' });
      }).not.toThrow();
    });

    test('should broadcast message', () => {
      // This should not throw an error
      expect(() => {
        socketService.broadcast('test:event', { test: 'data' });
      }).not.toThrow();
    });
  });
}); 