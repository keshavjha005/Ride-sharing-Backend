# Database Schema Comparison Analysis

## Overview

This document compares the provided SQL diagram (`Mate.sql`) with the database schemas defined in the sprint planning documentation to identify missing tables, different structures, and areas that need updates.

## 🔍 **Key Differences Found**

### **1. Table Naming Conventions**

| Your SQL Diagram | Sprint Planning | Status |
|------------------|-----------------|---------|
| `trips` | `rides` | ❌ **Different naming** |
| `travel_prefernces` | `travel_preferences` | ❌ **Typo in your schema** |
| `user_booked_trips` | `bookings` | ❌ **Different structure** |
| `user_canceled_trips` | `booking_cancellations` | ❌ **Different approach** |

### **2. Missing Tables in Your SQL Diagram**

#### **Critical Missing Tables:**
```sql
-- Admin System (Sprint 5)
admin_users
admin_roles
admin_sessions
admin_activity_logs

-- Chat System (Sprint 3)
chat_rooms
chat_room_participants
chat_messages
message_status
inbox_conversations

-- Payment System (Sprint 4)
payment_methods
payment_transactions
booking_payments
commission_transactions
commission_settings

-- Real-time Features (Sprint 3)
fcm_tokens
notification_logs
notification_templates
user_notification_preferences

-- Advanced Features (Sprint 5)
user_analytics
user_reports
ride_analytics
ride_disputes
admin_dashboard_widgets
scheduled_reports
system_settings
feature_flags
system_health_logs
```

#### **Missing Tables for Enhanced Features:**
```sql
-- Financial System
wallets
wallet_recharge_requests
withdrawal_requests
payout_transactions

-- Analytics & Reporting
commission_reports
financial_alerts
currency_exchange_rates
tax_rates

-- System Management
admin_commission_settings
```

### **3. Structural Differences**

#### **A. Users Table**
**Your Schema:**
```sql
CREATE TABLE "users" (
  "id" varchar PRIMARY KEY,
  "bio" text,
  "countryCode" varchar,
  "dateOfBirth" date,
  "email" varchar UNIQUE,
  "fcmToken" varchar,
  "firstName" varchar,
  "lastName" varchar,
  "gender" varchar,
  "isActive" bool,
  "isVerified" bool,
  "loginType" varchar,
  "phoneNumber" varchar,
  "profilePicture" varchar,
  "reviewCount" int,
  "reviewSum" int,
  "walletAmount" double,
  "travelPrefernces" varchar, -- ❌ Should be travelPreferences
  "language" varchar,
  "currency" varchar,
  "isDeleted" bool,
  "createdAt" datetime
);
```

**Sprint Planning Schema:**
```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20) UNIQUE,
    country_code VARCHAR(10),
    profile_pic VARCHAR(500),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    bio TEXT,
    wallet_amount DECIMAL(10,2) DEFAULT 0.00,
    fcm_token VARCHAR(500),
    login_type ENUM('phone', 'google', 'apple') DEFAULT 'phone',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Issues:**
- ❌ Missing `updated_at` timestamp
- ❌ Different data types (varchar vs ENUM for gender)
- ❌ Missing NOT NULL constraints
- ❌ Different field naming conventions

#### **B. Trips vs Rides Table**
**Your Schema (trips):**
```sql
CREATE TABLE "trips" (
  "id" varchar PRIMARY KEY,
  "publisherId" varchar,
  "departureDateTime" datetime,
  "distance" double,
  "estimatedTime" int,
  "pickupAddress" varchar,
  "pickupLocation" geo,
  "dropoffAddress" varchar,
  "dropoffLocation" geo,
  "luggageAllowed" int,
  "status" varchar,
  "pricePerSeat" double,
  "isPublished" bool,
  "seatsNumber" int,
  "maxTwoPassengersInBack" bool,
  "womenOnly" bool,
  "vehicleId" varchar,
  "createdAt" datetime
);
```

**Sprint Planning Schema (rides):**
```sql
CREATE TABLE rides (
    id VARCHAR(36) PRIMARY KEY,
    created_by VARCHAR(36) NOT NULL,
    vehicle_information_id VARCHAR(36) NOT NULL,
    total_seats INT NOT NULL,
    booked_seats INT DEFAULT 0,
    price_per_seat DECIMAL(10,2) NOT NULL,
    distance DECIMAL(10,2),
    estimated_time INT,
    luggage_allowed BOOLEAN DEFAULT true,
    women_only BOOLEAN DEFAULT false,
    driver_verified BOOLEAN DEFAULT false,
    two_passenger_max_back BOOLEAN DEFAULT false,
    status ENUM('draft', 'published', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
    is_published BOOLEAN DEFAULT false,
    departure_datetime TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Issues:**
- ❌ Missing `booked_seats` tracking
- ❌ Missing `driver_verified` field
- ❌ Missing `updated_at` timestamp
- ❌ Different status enum values
- ❌ Missing separate `ride_locations` table for pickup/dropoff

#### **C. Booking System**
**Your Schema:**
```sql
-- Separate tables for booked and canceled trips
CREATE TABLE "user_booked_trips" (
  "id" varchar PRIMARY KEY,
  "userId" varchar,
  "tripId" varchar
);

CREATE TABLE "user_canceled_trips" (
  "id" varchar PRIMARY KEY,
  "userId" varchar,
  "tripId" varchar
);
```

**Sprint Planning Schema:**
```sql
-- Single comprehensive bookings table
CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    ride_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    booked_seats INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_type ENUM('wallet', 'card', 'cash') DEFAULT 'wallet',
    pickup_location_id VARCHAR(36),
    drop_location_id VARCHAR(36),
    stopover_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Issues:**
- ❌ Your approach is too simplistic
- ❌ Missing payment information
- ❌ Missing booking status tracking
- ❌ Missing seat count tracking

### **4. Data Type Issues**

#### **A. Geo Data Type**
**Your Schema:**
```sql
"pickupLocation" geo,
"dropoffLocation" geo,
```

**Sprint Planning Schema:**
```sql
latitude DECIMAL(10,8) NOT NULL,
longitude DECIMAL(11,8) NOT NULL,
```

**Issue:** ❌ `geo` data type is not standard MySQL. Should use separate latitude/longitude columns.

#### **B. Typo in Field Names**
```sql
-- Your schema has typos:
"forntSideRequired" -- Should be "frontSideRequired"
"travelPrefernces" -- Should be "travelPreferences"
"pickupLocatoin" -- Should be "pickupLocation"
"dropoffLocaton" -- Should be "dropoffLocation"
"cratedAt" -- Should be "createdAt"
"reciverId" -- Should be "receiverId"
"varcchar" -- Should be "varchar"
"inforamtion" -- Should be "information"
```

### **5. Missing Relationships**

#### **A. Chat System Relationships**
Your schema completely lacks chat functionality tables and relationships.

#### **B. Payment System Relationships**
Missing relationships between:
- Users and payment methods
- Bookings and payments
- Wallet transactions and bookings

#### **C. Admin System Relationships**
Missing admin user management and role-based access control.

## 🔧 **Recommended Updates**

### **1. Immediate Fixes Required**

#### **A. Fix Data Types and Typos**
```sql
-- Fix geo data types
ALTER TABLE trips 
ADD COLUMN pickup_latitude DECIMAL(10,8),
ADD COLUMN pickup_longitude DECIMAL(11,8),
ADD COLUMN dropoff_latitude DECIMAL(10,8),
ADD COLUMN dropoff_longitude DECIMAL(11,8);

-- Fix typo in travel_prefernces table name
RENAME TABLE travel_prefernces TO travel_preferences;

-- Fix field name typos
ALTER TABLE documents CHANGE forntSideRequired frontSideRequired BOOLEAN;
ALTER TABLE wallet_transactions CHANGE cratedAt createdAt DATETIME;
ALTER TABLE reviews CHANGE reciverId receiverId VARCHAR(36);
```

#### **B. Add Missing Timestamps**
```sql
-- Add updated_at to all tables
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE trips ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
-- ... repeat for all tables
```

#### **C. Improve Booking System**
```sql
-- Replace simple booking tables with comprehensive one
DROP TABLE user_booked_trips;
DROP TABLE user_canceled_trips;

CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    booked_seats INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### **2. Add Missing Tables**

#### **A. Admin System (Priority: High)**
```sql
-- Add admin tables for Sprint 5
CREATE TABLE admin_users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE admin_roles (
    id VARCHAR(36) PRIMARY KEY,
    role_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSON,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **B. Chat System (Priority: High)**
```sql
-- Add chat tables for Sprint 3
CREATE TABLE chat_rooms (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL,
    room_name VARCHAR(255) NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    message_type ENUM('text', 'image', 'file', 'location') DEFAULT 'text',
    message TEXT NOT NULL,
    media_url VARCHAR(500),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### **C. Payment System (Priority: High)**
```sql
-- Add payment tables for Sprint 4
CREATE TABLE payment_methods (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    payment_type ENUM('card', 'paypal', 'bank_account') NOT NULL,
    gateway VARCHAR(50) NOT NULL,
    gateway_payment_method_id VARCHAR(255),
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    card_exp_month INT,
    card_exp_year INT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE payment_transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method_id VARCHAR(36),
    gateway VARCHAR(50) NOT NULL,
    gateway_transaction_id VARCHAR(255),
    status ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled') DEFAULT 'pending',
    failure_reason TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
);
```

### **3. Update Sprint Planning**

#### **A. Sprint 1 Updates**
- Update database schema to match your naming conventions
- Add missing fields from your schema
- Fix data type inconsistencies

#### **B. Sprint 2 Updates**
- Rename `rides` to `trips` throughout the documentation
- Update location handling to use your geo approach
- Add missing fields like `perKmCharges` in vehicle_type

#### **C. Sprint 3 Updates**
- Add comprehensive chat system tables
- Include notification templates and preferences
- Add FCM token management

#### **D. Sprint 4 Updates**
- Add comprehensive payment system
- Include wallet management
- Add withdrawal and payout systems

#### **E. Sprint 5 Updates**
- Add complete admin system
- Include analytics and reporting tables
- Add system configuration management

## 📋 **Action Items**

### **Immediate Actions (Week 1)**
1. ✅ Fix all typo errors in your SQL schema
2. ✅ Add missing timestamps (updated_at) to all tables
3. ✅ Fix geo data types to use latitude/longitude
4. ✅ Improve booking system structure

### **Short-term Actions (Week 2-3)**
1. ✅ Add admin system tables
2. ✅ Add chat system tables
3. ✅ Add payment system tables
4. ✅ Add notification system tables

### **Medium-term Actions (Week 4-6)**
1. ✅ Add analytics and reporting tables
2. ✅ Add system configuration tables
3. ✅ Add monitoring and logging tables
4. ✅ Update sprint documentation to match your schema

## 🎯 **Recommendation**

**Option 1: Update Your Schema (Recommended)**
- Fix the issues in your current schema
- Add the missing tables for full functionality
- This ensures consistency with the sprint planning

**Option 2: Update Sprint Planning**
- Modify the sprint documentation to match your schema
- Simplify some features to match your current structure
- This might limit some advanced features

**I recommend Option 1** as it provides a more robust and scalable foundation for your ride-sharing platform.

Would you like me to create the updated SQL schema that combines the best of both approaches? 