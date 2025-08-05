# Sprint 1: Foundation & Core Infrastructure

## Overview
Set up the foundational backend infrastructure, database schema, authentication system, and core user management features.

## 🎯 **Objectives**
- Set up Node.js backend with Express.js
- Configure MySQL database with core tables
- Implement JWT authentication system
- Create user management APIs
- Set up file upload system
- Implement comprehensive multi-language support

## 📋 **Tasks**

### **Task 1.1: Backend Setup & Configuration**
**Duration:** 2 days

**Description:** Set up the Node.js backend infrastructure with Express.js, middleware, and basic configuration.

**Subtasks:**
- [ ] Initialize Node.js project with Express.js
- [ ] Configure environment variables and configuration
- [ ] Set up middleware (CORS, body parser, helmet, etc.)
- [ ] Configure logging with Winston
- [ ] Set up error handling middleware
- [ ] Configure database connection pool
- [ ] Set up basic health check endpoint

**API Endpoints:**
```javascript
GET /api/health
GET /api/status
```

**Deliverables:**
- Basic Express.js server running
- Environment configuration
- Database connection established
- Logging system operational

---

### **Task 1.2: Database Schema Setup**
**Duration:** 3 days

**Description:** Create the core database tables for users, authentication, and system settings.

**Database Tables:**

#### **1. Users Table:**
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_image_url VARCHAR(500),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    language_code VARCHAR(10) DEFAULT 'en', -- User language preference
    currency_code VARCHAR(10) DEFAULT 'USD', -- User currency preference
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    fcm_token TEXT,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (language_code) REFERENCES languages(code),
    FOREIGN KEY (currency_code) REFERENCES currencies(code)
);
```

#### **2. Languages Table (Enhanced):**
```sql
CREATE TABLE languages (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL, -- Native language name
    is_rtl BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **3. Currencies Table (Enhanced):**
```sql
CREATE TABLE currencies (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    symbol_at_right BOOLEAN DEFAULT false,
    decimal_digits INT DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **4. Localized Content Table:**
```sql
CREATE TABLE localized_content (
    id VARCHAR(36) PRIMARY KEY,
    content_key VARCHAR(100) UNIQUE NOT NULL,
    content_ar TEXT,
    content_en TEXT,
    content_type ENUM('notification', 'error', 'ui_text', 'email', 'sms') NOT NULL,
    category VARCHAR(50), -- e.g., 'auth', 'booking', 'payment'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **5. User Settings Table:**
```sql
CREATE TABLE user_settings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    language_code VARCHAR(10) DEFAULT 'en',
    currency_code VARCHAR(10) DEFAULT 'USD',
    notification_preferences JSON, -- Email, SMS, Push preferences
    privacy_settings JSON, -- Profile visibility, data sharing
    theme_preference ENUM('light', 'dark', 'auto') DEFAULT 'auto',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (language_code) REFERENCES languages(code),
    FOREIGN KEY (currency_code) REFERENCES currencies(code)
);
```

#### **6. System Settings Table:**
```sql
CREATE TABLE system_settings (
    id VARCHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL,
    category VARCHAR(50), -- e.g., 'app', 'payment', 'notification'
    is_public BOOLEAN DEFAULT false, -- Whether mobile app can access
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **7. Admin Users Table:**
```sql
CREATE TABLE admin_users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Deliverables:**
- All core database tables created
- Foreign key relationships established
- Indexes for performance optimization

---

### **Task 1.3: JWT Authentication System**
**Duration:** 2 days

**Description:** Implement secure JWT-based authentication with refresh tokens.

**Subtasks:**
- [ ] Set up JWT library and configuration
- [ ] Create authentication middleware
- [ ] Implement login/logout endpoints
- [ ] Create refresh token system
- [ ] Add password hashing with bcrypt
- [ ] Implement token blacklisting
- [ ] Add rate limiting for auth endpoints

**API Endpoints:**
```javascript
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/verify-email
```

**Deliverables:**
- JWT authentication system
- Refresh token mechanism
- Password reset functionality
- Email verification system

---

### **Task 1.4: User Management APIs**
**Duration:** 2 days

**Description:** Create comprehensive user management APIs with profile management.

**Subtasks:**
- [ ] Create user CRUD operations
- [ ] Implement profile update functionality
- [ ] Add user search and filtering
- [ ] Create user statistics endpoints
- [ ] Implement user deactivation/reactivation
- [ ] Add user activity logging

**API Endpoints:**
```javascript
GET /api/users/profile
PUT /api/users/profile
GET /api/users/:id
PUT /api/users/:id
DELETE /api/users/:id
GET /api/users/search
GET /api/users/statistics
```

**Deliverables:**
- Complete user management APIs
- Profile update functionality
- User search and filtering
- Activity logging system

---

### **Task 1.5: Multi-Language Support System**
**Duration:** 3 days

**Description:** Implement comprehensive multi-language support with user preferences and localized content.

**Subtasks:**
- [ ] Create language management APIs
- [ ] Implement user language preference system
- [ ] Create localized content management
- [ ] Add language detection middleware
- [ ] Implement RTL support utilities
- [ ] Create language-specific content endpoints

**API Endpoints:**
```javascript
// Language Management
GET /api/languages
GET /api/languages/:code
PUT /api/users/language

// Localized Content
GET /api/localization/content?language=ar&type=notification
GET /api/localization/content?language=en&category=auth
POST /api/localization/content
PUT /api/localization/content/:id

// User Preferences
GET /api/users/preferences
PUT /api/users/preferences
```

**Localized Content Examples:**
```sql
-- Insert sample localized content
INSERT INTO localized_content (content_key, content_ar, content_en, content_type, category) VALUES
('welcome_message', 'مرحباً بك في تطبيقنا', 'Welcome to our app', 'ui_text', 'auth'),
('booking_success', 'تم الحجز بنجاح', 'Booking successful', 'notification', 'booking'),
('payment_failed', 'فشل في الدفع', 'Payment failed', 'error', 'payment'),
('ride_cancelled', 'تم إلغاء الرحلة', 'Ride cancelled', 'notification', 'ride');
```

**Deliverables:**
- Language management system
- User language preferences
- Localized content management
- RTL support utilities
- Language detection middleware

---

### **Task 1.6: File Upload System**
**Duration:** 2 days

**Description:** Set up secure file upload system for images and documents.

**Subtasks:**
- [ ] Configure Multer for file uploads
- [ ] Set up cloud storage (AWS S3 or similar)
- [ ] Implement image processing and optimization
- [ ] Add file validation and security
- [ ] Create file management APIs
- [ ] Implement file deletion system

**API Endpoints:**
```javascript
POST /api/upload/image
POST /api/upload/document
DELETE /api/upload/:fileId
GET /api/upload/:fileId
```

**Deliverables:**
- File upload system
- Image processing pipeline
- Cloud storage integration
- File management APIs

---

### **Task 1.7: Currency Management System**
**Duration:** 2 days

**Description:** Implement comprehensive currency management with user preferences.

**Subtasks:**
- [ ] Create currency management APIs
- [ ] Implement user currency preferences
- [ ] Add currency formatting utilities
- [ ] Create currency conversion helpers
- [ ] Add currency validation

**API Endpoints:**
```javascript
GET /api/currencies
GET /api/currencies/:code
PUT /api/users/currency
GET /api/currency/format?amount=100&currency=USD
```

**Deliverables:**
- Currency management system
- User currency preferences
- Currency formatting utilities
- Currency validation

---

## 🧪 **Testing Requirements**

### **Unit Tests:**
- [ ] Authentication system tests
- [ ] User management tests
- [ ] Multi-language system tests
- [ ] File upload tests
- [ ] Currency management tests

### **Integration Tests:**
- [ ] Database connection tests
- [ ] API endpoint tests
- [ ] Authentication flow tests
- [ ] Multi-language content tests

### **Performance Tests:**
- [ ] Database query performance
- [ ] File upload performance
- [ ] Authentication response times

## 📊 **Success Metrics**

- [ ] All API endpoints return correct responses
- [ ] Database queries execute within 100ms
- [ ] File uploads complete within 5 seconds
- [ ] Authentication tokens work correctly
- [ ] Multi-language content displays properly
- [ ] User preferences are saved and retrieved correctly

## 🔧 **Technical Requirements**

### **Dependencies:**
```json
{
  "express": "^4.18.2",
  "mysql2": "^3.6.0",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.0",
  "multer": "^1.4.5-lts.1",
  "winston": "^3.10.0",
  "helmet": "^7.0.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^6.10.0"
}
```

### **Environment Variables:**
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=mate_app
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
```

## 📝 **Documentation Requirements**

- [ ] API documentation with Swagger
- [ ] Database schema documentation
- [ ] Authentication flow documentation
- [ ] Multi-language implementation guide
- [ ] File upload system documentation
- [ ] Currency management guide

## 🚀 **Deployment Checklist**

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] PM2 or similar process manager configured
- [ ] Nginx reverse proxy configured
- [ ] Monitoring and logging set up 