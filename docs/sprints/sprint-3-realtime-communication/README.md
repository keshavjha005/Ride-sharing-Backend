# Sprint 3: Real-time Communication & Notifications

## Overview
Implement real-time communication features including WebSocket server, chat system, push notifications, and live ride status updates with comprehensive multi-language support.

## 🎯 **Objectives**
- Set up WebSocket server with Socket.io
- Implement real-time chat system
- Create push notification system with localization
- Add live ride status updates
- Implement inbox management
- Add comprehensive notification preferences

## 📋 **Tasks**

### **Task 3.1: WebSocket Server Setup**
**Duration:** 2 days

**Description:** Set up WebSocket server using Socket.io for real-time communication.

**Subtasks:**
- [ ] Install and configure Socket.io
- [ ] Set up WebSocket server with Express
- [ ] Implement connection management
- [ ] Add authentication for WebSocket connections
- [ ] Set up room management for chat
- [ ] Implement connection logging and monitoring
- [ ] Add error handling for WebSocket events

**WebSocket Events:**
```javascript
// Connection events
'socket:connect'
'socket:disconnect'
'socket:authenticate'

// Chat events
'chat:join_room'
'chat:leave_room'
'chat:send_message'
'chat:typing_start'
'chat:typing_stop'

// Notification events
'notification:send'
'notification:read'

// Ride status events
'ride:status_update'
'ride:location_update'
```

**Deliverables:**
- WebSocket server running
- Connection authentication system
- Room management system
- Event handling infrastructure

---

### **Task 3.2: Real-time Chat System**
**Duration:** 3 days

**Description:** Implement comprehensive real-time chat system with message history and media support.

**Database Tables:**

#### **1. Chat Rooms Table:**
```sql
CREATE TABLE chat_rooms (
    id VARCHAR(36) PRIMARY KEY,
    room_type ENUM('ride', 'support', 'group') NOT NULL,
    ride_id VARCHAR(36), -- For ride-specific chats
    title_ar VARCHAR(255), -- Localized room title
    title_en VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
);
```

#### **2. Chat Room Participants Table:**
```sql
CREATE TABLE chat_room_participants (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('participant', 'admin', 'moderator') DEFAULT 'participant',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (room_id, user_id)
);
```

#### **3. Chat Messages Table:**
```sql
CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    message_type ENUM('text', 'image', 'file', 'location', 'system') DEFAULT 'text',
    message_text TEXT,
    message_ar TEXT, -- Localized message content
    message_en TEXT,
    media_url VARCHAR(500),
    media_type VARCHAR(50),
    file_size INT,
    location_data JSON, -- For location messages
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### **4. Message Status Table:**
```sql
CREATE TABLE message_status (
    id VARCHAR(36) PRIMARY KEY,
    message_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_message_status (message_id, user_id)
);
```

**API Endpoints:**
```javascript
// Chat room management
GET /api/chat/rooms
POST /api/chat/rooms
GET /api/chat/rooms/:roomId
PUT /api/chat/rooms/:roomId

// Chat messages
GET /api/chat/rooms/:roomId/messages
POST /api/chat/rooms/:roomId/messages
PUT /api/chat/messages/:messageId
DELETE /api/chat/messages/:messageId

// Chat participants
GET /api/chat/rooms/:roomId/participants
POST /api/chat/rooms/:roomId/participants
DELETE /api/chat/rooms/:roomId/participants/:userId
```

**Deliverables:**
- Real-time chat system
- Message history and persistence
- Media file support
- Message status tracking
- Chat room management

---

### **Task 3.3: Localized Push Notification System**
**Duration:** 3 days

**Description:** Implement comprehensive push notification system with multi-language support and user preferences.

**Database Tables:**

#### **1. Notification Templates Table:**
```sql
CREATE TABLE notification_templates (
    id VARCHAR(36) PRIMARY KEY,
    template_key VARCHAR(100) UNIQUE NOT NULL,
    title_ar VARCHAR(255),
    title_en VARCHAR(255),
    body_ar TEXT,
    body_en TEXT,
    notification_type ENUM('chat', 'booking', 'ride', 'payment', 'system', 'marketing') NOT NULL,
    category VARCHAR(50), -- e.g., 'ride_status', 'payment_success', 'chat_message'
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **2. User Notifications Table:**
```sql
CREATE TABLE user_notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    template_id VARCHAR(36),
    title_ar VARCHAR(255),
    title_en VARCHAR(255),
    body_ar TEXT,
    body_en TEXT,
    notification_type ENUM('chat', 'booking', 'ride', 'payment', 'system', 'marketing') NOT NULL,
    data JSON, -- Additional data for the notification
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE SET NULL
);
```

#### **3. User Notification Preferences Table:**
```sql
CREATE TABLE user_notification_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    notification_types JSON, -- Which types of notifications user wants
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    language_code VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (language_code) REFERENCES languages(code)
);
```

#### **4. FCM Tokens Table:**
```sql
CREATE TABLE fcm_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(500) NOT NULL,
    device_type ENUM('android', 'ios', 'web') NOT NULL,
    device_id VARCHAR(255),
    app_version VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_token (user_id, token)
);
```

#### **5. Notification Logs Table:**
```sql
CREATE TABLE notification_logs (
    id VARCHAR(36) PRIMARY KEY,
    notification_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    delivery_method ENUM('email', 'sms', 'push', 'in_app') NOT NULL,
    status ENUM('pending', 'sent', 'delivered', 'failed') NOT NULL,
    error_message TEXT,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES user_notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Sample Notification Templates:**
```sql
-- Insert sample localized notification templates
INSERT INTO notification_templates (template_key, title_ar, title_en, body_ar, body_en, notification_type, category) VALUES
('ride_booked', 'تم حجز رحلة جديدة', 'New Ride Booked', 'تم حجز رحلة من {pickup} إلى {destination}', 'Your ride from {pickup} to {destination} has been booked', 'ride', 'booking'),
('ride_started', 'بدأت الرحلة', 'Ride Started', 'بدأت رحلتك من {pickup}', 'Your ride from {pickup} has started', 'ride', 'status'),
('ride_completed', 'انتهت الرحلة', 'Ride Completed', 'انتهت رحلتك بنجاح', 'Your ride has been completed successfully', 'ride', 'status'),
('payment_success', 'تم الدفع بنجاح', 'Payment Successful', 'تم إضافة {amount} إلى محفظتك', '{amount} has been added to your wallet', 'payment', 'success'),
('chat_message', 'رسالة جديدة', 'New Message', 'رسالة جديدة من {sender}', 'New message from {sender}', 'chat', 'message'),
('booking_cancelled', 'تم إلغاء الحجز', 'Booking Cancelled', 'تم إلغاء حجز رحلتك', 'Your ride booking has been cancelled', 'booking', 'cancellation');
```

**API Endpoints:**
```javascript
// Notification management
GET /api/notifications
GET /api/notifications/:id
POST /api/notifications
PUT /api/notifications/:id/read
DELETE /api/notifications/:id

// Notification templates
GET /api/notification-templates
POST /api/notification-templates
PUT /api/notification-templates/:id
DELETE /api/notification-templates/:id

// User notification preferences
GET /api/users/notification-preferences
PUT /api/users/notification-preferences

// FCM token management
POST /api/fcm/token
DELETE /api/fcm/token/:token

// Send notifications
POST /api/notifications/send
POST /api/notifications/send-bulk
```

**Deliverables:**
- Multi-language notification system
- User notification preferences
- FCM token management
- Notification templates
- Delivery tracking system

---

### **Task 3.4: Live Ride Status Updates**
**Duration:** 2 days

**Description:** Implement real-time ride status updates with location tracking and status notifications.

**Database Tables:**

#### **1. Ride Status Updates Table:**
```sql
CREATE TABLE ride_status_updates (
    id VARCHAR(36) PRIMARY KEY,
    ride_id VARCHAR(36) NOT NULL,
    status ENUM('pending', 'confirmed', 'started', 'in_progress', 'completed', 'cancelled') NOT NULL,
    status_message_ar VARCHAR(255),
    status_message_en VARCHAR(255),
    location_data JSON, -- Current location
    estimated_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
);
```

#### **2. Ride Location Tracking Table:**
```sql
CREATE TABLE ride_location_tracking (
    id VARCHAR(36) PRIMARY KEY,
    ride_id VARCHAR(36) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy DECIMAL(5,2),
    speed DECIMAL(5,2),
    heading DECIMAL(5,2),
    altitude DECIMAL(8,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
);
```

**WebSocket Events:**
```javascript
// Ride status events
'ride:status_update'
'ride:location_update'
'ride:estimated_arrival'
'ride:driver_location'
'ride:passenger_location'
```

**API Endpoints:**
```javascript
// Ride status updates
GET /api/rides/:rideId/status
POST /api/rides/:rideId/status
GET /api/rides/:rideId/location
POST /api/rides/:rideId/location

// Live tracking
GET /api/rides/:rideId/tracking
POST /api/rides/:rideId/tracking
```

**Deliverables:**
- Real-time ride status updates
- Location tracking system
- Status notification system
- Estimated arrival calculations

---

### **Task 3.5: Inbox Management System**
**Duration:** 2 days

**Description:** Implement comprehensive inbox management with conversation organization and search.

**Database Tables:**

#### **1. Inbox Conversations Table:**
```sql
CREATE TABLE inbox_conversations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    conversation_type ENUM('ride', 'support', 'system', 'marketing') NOT NULL,
    title_ar VARCHAR(255),
    title_en VARCHAR(255),
    last_message_ar TEXT,
    last_message_en TEXT,
    last_message_at TIMESTAMP,
    unread_count INT DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    is_muted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### **2. Conversation Participants Table:**
```sql
CREATE TABLE conversation_participants (
    id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role ENUM('participant', 'admin', 'support') DEFAULT 'participant',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (conversation_id) REFERENCES inbox_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_conversation_participant (conversation_id, user_id)
);
```

**API Endpoints:**
```javascript
// Inbox management
GET /api/inbox/conversations
GET /api/inbox/conversations/:conversationId
POST /api/inbox/conversations
PUT /api/inbox/conversations/:conversationId/archive
PUT /api/inbox/conversations/:conversationId/mute
DELETE /api/inbox/conversations/:conversationId

// Conversation messages
GET /api/inbox/conversations/:conversationId/messages
POST /api/inbox/conversations/:conversationId/messages
PUT /api/inbox/messages/:messageId/read

// Inbox search
GET /api/inbox/search?query=keyword
GET /api/inbox/unread-count
```

**Deliverables:**
- Inbox management system
- Conversation organization
- Message search functionality
- Unread count tracking
- Archive and mute features

---

### **Task 3.6: Notification Delivery System**
**Duration:** 2 days

**Description:** Implement multi-channel notification delivery with email, SMS, and push notifications.

**Subtasks:**
- [ ] Set up email service (SendGrid/Nodemailer)
- [ ] Configure SMS service (Twilio)
- [ ] Implement FCM push notifications
- [ ] Create notification queue system
- [ ] Add delivery retry logic
- [ ] Implement notification scheduling
- [ ] Add delivery analytics

**Notification Channels:**
```javascript
// Email notifications
POST /api/notifications/send-email

// SMS notifications
POST /api/notifications/send-sms

// Push notifications
POST /api/notifications/send-push

// In-app notifications
POST /api/notifications/send-in-app

// Bulk notifications
POST /api/notifications/send-bulk
```

**Localized Email Templates:**
```sql
-- Email templates with localization
CREATE TABLE email_templates (
    id VARCHAR(36) PRIMARY KEY,
    template_key VARCHAR(100) UNIQUE NOT NULL,
    subject_ar VARCHAR(255),
    subject_en VARCHAR(255),
    body_ar TEXT,
    body_en TEXT,
    html_ar TEXT,
    html_en TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Deliverables:**
- Multi-channel notification delivery
- Email template system
- SMS integration
- Push notification system
- Delivery tracking and analytics

---

## 🧪 **Testing Requirements**

### **Unit Tests:**
- [ ] WebSocket connection tests
- [ ] Chat message handling tests
- [ ] Notification delivery tests
- [ ] Ride status update tests
- [ ] Localization tests

### **Integration Tests:**
- [ ] Real-time communication tests
- [ ] Notification flow tests
- [ ] Multi-language content tests
- [ ] WebSocket authentication tests

### **Performance Tests:**
- [ ] WebSocket connection limits
- [ ] Message delivery performance
- [ ] Notification queue performance
- [ ] Real-time location updates

## 📊 **Success Metrics**

- [ ] WebSocket connections stable under load
- [ ] Chat messages delivered within 1 second
- [ ] Push notifications delivered within 5 seconds
- [ ] Email notifications delivered within 30 seconds
- [ ] Multi-language content displays correctly
- [ ] User notification preferences respected

## 🔧 **Technical Requirements**

### **Dependencies:**
```json
{
  "socket.io": "^4.7.2",
  "firebase-admin": "^11.10.1",
  "nodemailer": "^6.9.4",
  "twilio": "^4.10.0",
  "bull": "^4.11.3",
  "redis": "^4.6.8"
}
```

### **Environment Variables:**
```env
FCM_SERVICE_ACCOUNT_KEY=path/to/service-account.json
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
REDIS_URL=redis://localhost:6379
```

## 📝 **Documentation Requirements**

- [ ] WebSocket API documentation
- [ ] Notification system guide
- [ ] Multi-language implementation guide
- [ ] Real-time communication setup
- [ ] Notification template management
- [ ] Delivery system configuration

## 🚀 **Deployment Checklist**

- [ ] WebSocket server configured
- [ ] FCM service account configured
- [ ] Email service configured
- [ ] SMS service configured
- [ ] Redis for queue management
- [ ] Notification monitoring set up 