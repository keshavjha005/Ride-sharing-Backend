# WebSocket API Documentation

## Overview

The Mate Backend WebSocket API provides real-time communication capabilities for chat, notifications, and ride status updates. The WebSocket server is built using Socket.io and supports authentication, room management, and event-driven communication.

## Connection

### WebSocket URL
```
ws://localhost:3000
```

### Connection with Authentication
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  },
  transports: ['websocket', 'polling']
});
```

### Connection Options
- `transports`: Array of transport methods (websocket, polling)
- `auth.token`: JWT authentication token
- `pingTimeout`: 60000ms (60 seconds)
- `pingInterval`: 25000ms (25 seconds)
- `maxHttpBufferSize`: 1MB

## Authentication

All WebSocket connections require JWT authentication. The token should be provided in the connection handshake:

```javascript
// Valid JWT token required
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const socket = io('http://localhost:3000', {
  auth: { token }
});
```

### Authentication Errors
- `Authentication token required`: No token provided
- `Authentication failed`: Invalid or expired token
- `User not found`: User doesn't exist in database
- `User account is deactivated`: User account is inactive

## Events

### Connection Events

#### `socket:connect`
Emitted when a client successfully connects to the WebSocket server.

**Emitted by:** Server  
**Payload:**
```javascript
{
  message: 'Connected to WebSocket server',
  userId: 'user-uuid',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

#### `socket:disconnect`
Emitted when a client disconnects from the server.

**Emitted by:** Server  
**Payload:**
```javascript
{
  reason: 'io client disconnect'
}
```

#### `socket:authenticate`
Emitted by client to request authentication confirmation.

**Emitted by:** Client  
**Payload:** `{}`

**Response:** `socket:authenticated`
```javascript
{
  message: 'Authentication successful',
  userId: 'user-uuid',
  user: {
    id: 'user-uuid',
    email: 'user@example.com',
    first_name: 'John',
    last_name: 'Doe'
  },
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

### Chat Events

#### `chat:join_room`
Join a chat room.

**Emitted by:** Client  
**Payload:**
```javascript
{
  roomId: 'room-uuid',
  roomType: 'chat' // optional, default: 'chat'
}
```

**Response:** `chat:room_joined`
```javascript
{
  roomId: 'room-uuid',
  roomType: 'chat',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

**Broadcast:** `chat:user_joined` (to other users in room)
```javascript
{
  roomId: 'room-uuid',
  userId: 'user-uuid',
  user: {
    id: 'user-uuid',
    first_name: 'John',
    last_name: 'Doe'
  },
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

#### `chat:leave_room`
Leave a chat room.

**Emitted by:** Client  
**Payload:**
```javascript
{
  roomId: 'room-uuid'
}
```

**Response:** `chat:room_left`
```javascript
{
  roomId: 'room-uuid',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

**Broadcast:** `chat:user_left` (to other users in room)
```javascript
{
  roomId: 'room-uuid',
  userId: 'user-uuid',
  user: {
    id: 'user-uuid',
    first_name: 'John',
    last_name: 'Doe'
  },
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

#### `chat:send_message`
Send a message to a room.

**Emitted by:** Client  
**Payload:**
```javascript
{
  roomId: 'room-uuid',
  message: 'Hello, world!',
  messageType: 'text' // optional, default: 'text'
}
```

**Broadcast:** `chat:message` (to all users in room)
```javascript
{
  id: 'message-uuid',
  roomId: 'room-uuid',
  senderId: 'user-uuid',
  sender: {
    id: 'user-uuid',
    first_name: 'John',
    last_name: 'Doe'
  },
  message: 'Hello, world!',
  messageType: 'text',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

#### `chat:typing_start`
Indicate that user is typing.

**Emitted by:** Client  
**Payload:**
```javascript
{
  roomId: 'room-uuid'
}
```

**Broadcast:** `chat:typing_start` (to other users in room)
```javascript
{
  roomId: 'room-uuid',
  userId: 'user-uuid',
  user: {
    id: 'user-uuid',
    first_name: 'John',
    last_name: 'Doe'
  },
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

#### `chat:typing_stop`
Indicate that user stopped typing.

**Emitted by:** Client  
**Payload:**
```javascript
{
  roomId: 'room-uuid'
}
```

**Broadcast:** `chat:typing_stop` (to other users in room)
```javascript
{
  roomId: 'room-uuid',
  userId: 'user-uuid',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

### Notification Events

#### `notification:send`
Send a notification to a specific user.

**Emitted by:** Client  
**Payload:**
```javascript
{
  userId: 'target-user-uuid',
  notification: {
    type: 'chat',
    title: 'New Message',
    body: 'You have a new message',
    data: { /* additional data */ }
  }
}
```

**Broadcast:** `notification:received` (to target user)
```javascript
{
  type: 'chat',
  title: 'New Message',
  body: 'You have a new message',
  data: { /* additional data */ },
  senderId: 'sender-uuid',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

#### `notification:read`
Mark a notification as read.

**Emitted by:** Client  
**Payload:**
```javascript
{
  notificationId: 'notification-uuid'
}
```

**Response:** `notification:read`
```javascript
{
  notificationId: 'notification-uuid',
  userId: 'user-uuid',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

### Ride Events

#### `ride:status_update`
Update ride status.

**Emitted by:** Client  
**Payload:**
```javascript
{
  rideId: 'ride-uuid',
  status: 'started',
  statusMessage: 'Ride has started'
}
```

**Broadcast:** `ride:status_update` (to ride room)
```javascript
{
  rideId: 'ride-uuid',
  status: 'started',
  statusMessage: 'Ride has started',
  updatedBy: 'user-uuid',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

#### `ride:location_update`
Update ride location.

**Emitted by:** Client  
**Payload:**
```javascript
{
  rideId: 'ride-uuid',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 10,
    speed: 25,
    heading: 90,
    altitude: 100
  }
}
```

**Broadcast:** `ride:location_update` (to ride room)
```javascript
{
  rideId: 'ride-uuid',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    accuracy: 10,
    speed: 25,
    heading: 90,
    altitude: 100
  },
  updatedBy: 'user-uuid',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

### Error Events

#### `error`
Emitted when an error occurs.

**Emitted by:** Server  
**Payload:**
```javascript
{
  message: 'An error occurred',
  error: 'Error description'
}
```

## Room Management

### Room Types
- `chat`: General chat rooms
- `ride`: Ride-specific rooms (format: `ride:{rideId}`)
- `support`: Support chat rooms
- `group`: Group chat rooms

### Room Naming Conventions
- Chat rooms: `chat:{roomId}`
- Ride rooms: `ride:{rideId}`
- Support rooms: `support:{ticketId}`
- Group rooms: `group:{groupId}`

## API Endpoints

### WebSocket Management

#### GET `/api/socket/status`
Get WebSocket server status.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```javascript
{
  success: true,
  data: {
    isRunning: true,
    connectedUsers: 5,
    uptime: 3600,
    timestamp: '2024-01-01T00:00:00.000Z'
  }
}
```

#### GET `/api/socket/connected-users`
Get list of connected users (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```javascript
{
  success: true,
  data: {
    users: [
      {
        userId: 'user-uuid',
        socketId: 'socket-uuid',
        connectedAt: '2024-01-01T00:00:00.000Z',
        rooms: ['room1', 'room2']
      }
    ],
    count: 1
  }
}
```

#### POST `/api/socket/send-to-user`
Send message to specific user (Admin only).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```javascript
{
  userId: 'target-user-uuid',
  event: 'custom:event',
  data: { message: 'Hello' }
}
```

#### POST `/api/socket/send-to-room`
Send message to room.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```javascript
{
  roomId: 'room-uuid',
  event: 'custom:event',
  data: { message: 'Hello room' }
}
```

#### POST `/api/socket/broadcast`
Broadcast message to all users.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```javascript
{
  event: 'system:announcement',
  data: { message: 'System maintenance' },
  excludeUserId: 'user-uuid' // optional
}
```

#### DELETE `/api/socket/disconnect-user/{userId}`
Disconnect specific user (Admin only).

**Headers:**
```
Authorization: Bearer <token>
```

#### GET `/api/socket/user-rooms/{userId}`
Get user's rooms.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```javascript
{
  success: true,
  data: {
    userId: 'user-uuid',
    rooms: ['room1', 'room2'],
    count: 2
  }
}
```

#### GET `/api/socket/room-participants/{roomId}`
Get room participants.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```javascript
{
  success: true,
  data: {
    roomId: 'room-uuid',
    participants: [
      {
        userId: 'user-uuid',
        socketId: 'socket-uuid',
        user: {
          id: 'user-uuid',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com'
        }
      }
    ],
    count: 1
  }
}
```

## Client Implementation Examples

### JavaScript/Node.js
```javascript
import { io } from 'socket.io-client';

class WebSocketClient {
  constructor(url, token) {
    this.socket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
    });

    this.socket.on('chat:message', (data) => {
      console.log('New message:', data);
    });

    this.socket.on('notification:received', (data) => {
      console.log('New notification:', data);
    });

    this.socket.on('ride:status_update', (data) => {
      console.log('Ride status updated:', data);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  joinRoom(roomId, roomType = 'chat') {
    this.socket.emit('chat:join_room', { roomId, roomType });
  }

  leaveRoom(roomId) {
    this.socket.emit('chat:leave_room', { roomId });
  }

  sendMessage(roomId, message, messageType = 'text') {
    this.socket.emit('chat:send_message', { roomId, message, messageType });
  }

  startTyping(roomId) {
    this.socket.emit('chat:typing_start', { roomId });
  }

  stopTyping(roomId) {
    this.socket.emit('chat:typing_stop', { roomId });
  }

  sendNotification(userId, notification) {
    this.socket.emit('notification:send', { userId, notification });
  }

  markNotificationRead(notificationId) {
    this.socket.emit('notification:read', { notificationId });
  }

  updateRideStatus(rideId, status, statusMessage) {
    this.socket.emit('ride:status_update', { rideId, status, statusMessage });
  }

  updateRideLocation(rideId, location) {
    this.socket.emit('ride:location_update', { rideId, location });
  }

  disconnect() {
    this.socket.disconnect();
  }
}

// Usage
const client = new WebSocketClient('http://localhost:3000', 'your-jwt-token');
client.joinRoom('chat-room-123');
client.sendMessage('chat-room-123', 'Hello, everyone!');
```

### Flutter/Dart
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class WebSocketService {
  late IO.Socket socket;
  
  void connect(String url, String token) {
    socket = IO.io(url, <String, dynamic>{
      'transports': ['websocket', 'polling'],
      'auth': {'token': token}
    });
    
    setupEventListeners();
  }
  
  void setupEventListeners() {
    socket.onConnect((_) {
      print('Connected to WebSocket server');
    });
    
    socket.onDisconnect((_) {
      print('Disconnected from WebSocket server');
    });
    
    socket.on('chat:message', (data) {
      print('New message: $data');
    });
    
    socket.on('notification:received', (data) {
      print('New notification: $data');
    });
    
    socket.on('ride:status_update', (data) {
      print('Ride status updated: $data');
    });
    
    socket.onError((error) {
      print('WebSocket error: $error');
    });
  }
  
  void joinRoom(String roomId, {String roomType = 'chat'}) {
    socket.emit('chat:join_room', {
      'roomId': roomId,
      'roomType': roomType
    });
  }
  
  void sendMessage(String roomId, String message, {String messageType = 'text'}) {
    socket.emit('chat:send_message', {
      'roomId': roomId,
      'message': message,
      'messageType': messageType
    });
  }
  
  void disconnect() {
    socket.disconnect();
  }
}
```

## Error Handling

### Common Errors
1. **Authentication Errors**
   - Handle token expiration
   - Implement token refresh
   - Reconnect with new token

2. **Connection Errors**
   - Implement exponential backoff
   - Handle network disconnections
   - Reconnect automatically

3. **Room Errors**
   - Validate room existence
   - Handle room permissions
   - Manage room state

### Best Practices
1. Always handle connection errors
2. Implement reconnection logic
3. Validate data before sending
4. Use appropriate event names
5. Clean up event listeners
6. Monitor connection status
7. Implement rate limiting for events

## Security Considerations

1. **Authentication**: All connections require valid JWT tokens
2. **Authorization**: Users can only access authorized rooms
3. **Input Validation**: Validate all incoming data
4. **Rate Limiting**: Implement rate limiting for events
5. **Data Sanitization**: Sanitize user input
6. **Connection Limits**: Monitor and limit concurrent connections

## Performance Considerations

1. **Connection Pooling**: Reuse connections when possible
2. **Event Batching**: Batch multiple events when appropriate
3. **Memory Management**: Clean up disconnected users
4. **Monitoring**: Monitor connection counts and performance
5. **Scaling**: Use Redis adapter for horizontal scaling 