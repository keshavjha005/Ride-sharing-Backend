# Feature Toggle & Pricing System Comparison

## Overview

This document compares the **Feature Toggle** and **Pricing System** implementations between your SQL schema and the sprint planning documentation, updated to reflect your preferences for per-kilometer and dynamic event pricing without tax system.

## 🔍 **Feature Toggle System**

### **Your SQL Schema: ✅ HAS IT**
```sql
CREATE TABLE "feature_toggle" (
  "id" varchar PRIMARY KEY,
  "feature" varchar,
  "iOS" bool,
  "Android" bool
);
```

**Features:**
- ✅ Simple feature toggle per platform
- ✅ Platform-specific control (iOS/Android)
- ✅ Basic enable/disable functionality

**Limitations:**
- ❌ No web platform support
- ❌ No user-specific toggles
- ❌ No feature descriptions
- ❌ No version control
- ❌ No gradual rollout capabilities

### **Sprint Planning: ❌ MISSING**
```sql
-- Missing from sprint planning!
-- No feature_toggle table defined
```

**Status:** ❌ **NOT INCLUDED** in sprint planning

### **Recommended Enhanced Feature Toggle System:**
```sql
CREATE TABLE feature_flags (
    id VARCHAR(36) PRIMARY KEY,
    flag_name VARCHAR(100) UNIQUE NOT NULL,
    flag_value BOOLEAN DEFAULT false,
    description TEXT,
    target_users JSON, -- specific users or user groups
    target_platforms JSON, -- ['ios', 'android', 'web']
    rollout_percentage INT DEFAULT 100, -- percentage of users to enable for
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE feature_flag_logs (
    id VARCHAR(36) PRIMARY KEY,
    flag_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    platform VARCHAR(20),
    action ENUM('enabled', 'disabled', 'viewed') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flag_id) REFERENCES feature_flags(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

## 💰 **Pricing System**

### **Your SQL Schema: ✅ EXCELLENT APPROACH**

#### **1. Vehicle Type Pricing (Per-Kilometer):**
```sql
CREATE TABLE "vehicle_type" (
  "id" varchar PRIMARY KEY,
  "isEnabled" bool,
  "name" varchar,
  "perKmCharges" double  -- ✅ Per-kilometer pricing
);
```

#### **2. Dynamic Pricing Settings (Event-Based):**
```sql
CREATE TABLE "pricing_settings" (
  "id" varchar PRIMARY KEY,
  "eventType" varchar,
  "startDate" datetime,
  "endDateTime" datetime,
  "amount" double,
  "amountType" varchar
);
```

#### **3. Admin Commission:**
```sql
CREATE TABLE "admin_commission" (
  "id" varchar PRIMARY KEY,
  "amount" double,
  "type" varchar,
  "isEnabled" bool
);
```

**Features:**
- ✅ Per-kilometer pricing for vehicle types
- ✅ Dynamic pricing based on events/dates
- ✅ Admin commission system
- ✅ Time-based pricing rules
- ✅ No tax system (as preferred)

**Limitations:**
- ❌ No percentage-based commission
- ❌ No minimum/maximum amount limits
- ❌ No currency-specific pricing
- ❌ No complex pricing rules
- ❌ No pricing history tracking

### **Sprint Planning Pricing System (UPDATED):**

#### **1. Enhanced Per-Kilometer Pricing:**
```sql
CREATE TABLE vehicle_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    per_km_charges DECIMAL(10,2) NOT NULL, -- Per-kilometer base rate
    minimum_fare DECIMAL(10,2) DEFAULT 0.00, -- Minimum fare regardless of distance
    maximum_fare DECIMAL(10,2), -- Maximum fare cap
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Pricing multipliers for different conditions
CREATE TABLE pricing_multipliers (
    id VARCHAR(36) PRIMARY KEY,
    vehicle_type_id VARCHAR(36) NOT NULL,
    multiplier_type ENUM('peak_hour', 'weekend', 'holiday', 'weather', 'demand') NOT NULL,
    multiplier_value DECIMAL(5,2) NOT NULL, -- e.g., 1.5 for 50% increase
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id) ON DELETE CASCADE
);
```

#### **2. Dynamic Event Pricing:**
```sql
CREATE TABLE pricing_events (
    id VARCHAR(36) PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    event_type ENUM('seasonal', 'holiday', 'special_event', 'demand_surge') NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    pricing_multiplier DECIMAL(5,2) NOT NULL, -- e.g., 2.0 for 100% increase
    affected_vehicle_types JSON, -- Which vehicle types are affected
    affected_areas JSON, -- Geographic areas affected
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### **3. Enhanced Commission System:**
```sql
CREATE TABLE commission_settings (
    id VARCHAR(36) PRIMARY KEY,
    commission_type ENUM('booking', 'withdrawal', 'per_km') NOT NULL,
    commission_percentage DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(12,2), -- For fixed amount
    minimum_amount DECIMAL(12,2) DEFAULT 0.00,
    maximum_amount DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Features:**
- ✅ Enhanced per-kilometer pricing with min/max limits
- ✅ Dynamic event-based pricing system
- ✅ Percentage-based commission with limits
- ✅ Commission transaction tracking
- ✅ Pricing history and analytics
- ✅ No tax system (as requested)

## 🔄 **Comparison Summary**

### **Feature Toggle System:**

| Aspect | Your Schema | Sprint Planning | Recommendation |
|--------|-------------|-----------------|----------------|
| **Basic Toggle** | ✅ Yes | ❌ No | ✅ Keep your approach |
| **Platform Support** | ✅ iOS/Android | ❌ No | ✅ Add web support |
| **User Targeting** | ❌ No | ❌ No | ✅ Add user-specific toggles |
| **Gradual Rollout** | ❌ No | ❌ No | ✅ Add percentage rollout |
| **Logging** | ❌ No | ❌ No | ✅ Add usage tracking |

### **Pricing System:**

| Aspect | Your Schema | Sprint Planning (Updated) | Recommendation |
|--------|-------------|---------------------------|----------------|
| **Per-KM Pricing** | ✅ Yes | ✅ Enhanced | ✅ Keep your approach + enhancements |
| **Dynamic Pricing** | ✅ Yes | ✅ Enhanced | ✅ Keep your approach + enhancements |
| **Commission System** | ✅ Basic | ✅ Advanced | ✅ Combine both |
| **Tax System** | ❌ No | ❌ Removed | ✅ As requested - no tax system |
| **Pricing History** | ❌ No | ✅ Yes | ✅ Add tracking |

## 🎯 **Recommended Combined Approach**

### **1. Enhanced Feature Toggle System:**
```sql
-- Keep your basic structure but enhance it
CREATE TABLE feature_toggle (
    id VARCHAR(36) PRIMARY KEY,
    feature VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    iOS BOOLEAN DEFAULT false,
    Android BOOLEAN DEFAULT false,
    Web BOOLEAN DEFAULT false, -- Add web support
    rollout_percentage INT DEFAULT 100, -- Add gradual rollout
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add feature usage tracking
CREATE TABLE feature_usage_logs (
    id VARCHAR(36) PRIMARY KEY,
    feature_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    platform VARCHAR(20),
    action VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feature_id) REFERENCES feature_toggle(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### **2. Comprehensive Pricing System (No Tax):**
```sql
-- Keep your existing tables
-- vehicle_type (with perKmCharges)
-- pricing_settings (for dynamic pricing)
-- admin_commission (basic commission)

-- Enhanced vehicle types with better pricing
CREATE TABLE vehicle_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    per_km_charges DECIMAL(10,2) NOT NULL, -- Your perKmCharges
    minimum_fare DECIMAL(10,2) DEFAULT 0.00,
    maximum_fare DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Enhanced dynamic pricing events
CREATE TABLE pricing_events (
    id VARCHAR(36) PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    event_type ENUM('seasonal', 'holiday', 'special_event', 'demand_surge') NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    pricing_multiplier DECIMAL(5,2) NOT NULL,
    affected_vehicle_types JSON,
    affected_areas JSON,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Enhanced commission system
CREATE TABLE commission_settings (
    id VARCHAR(36) PRIMARY KEY,
    commission_type ENUM('booking', 'withdrawal', 'per_km') NOT NULL,
    commission_percentage DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(12,2), -- For fixed amount
    minimum_amount DECIMAL(12,2) DEFAULT 0.00,
    maximum_amount DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pricing history (no tax)
CREATE TABLE pricing_history (
    id VARCHAR(36) PRIMARY KEY,
    pricing_type ENUM('vehicle', 'event', 'commission') NOT NULL,
    reference_id VARCHAR(36), -- vehicle_type_id, pricing_event_id, etc.
    old_value DECIMAL(12,2),
    new_value DECIMAL(12,2),
    changed_by VARCHAR(36), -- admin_user_id
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (changed_by) REFERENCES admin_users(id) ON DELETE SET NULL
);
```

## 📋 **Action Items**

### **Feature Toggle System:**
1. ✅ **Keep your current structure** - it's good for basic needs
2. ✅ **Add web platform support** - extend iOS/Android to include Web
3. ✅ **Add gradual rollout** - percentage-based feature activation
4. ✅ **Add usage tracking** - monitor feature adoption
5. ✅ **Add descriptions** - document what each feature does

### **Pricing System:**
1. ✅ **Keep your per-KM pricing** - it's unique and valuable
2. ✅ **Keep your dynamic pricing** - event-based pricing is powerful
3. ✅ **Enhance commission system** - add percentage-based commissions
4. ✅ **No tax system** - as requested
5. ✅ **Add pricing history** - track changes and audit trail

## 🚀 **Implementation Priority**

### **High Priority:**
1. ✅ Add web platform to feature toggle
2. ✅ Enhance commission system with percentages
3. ✅ Add pricing history tracking

### **Medium Priority:**
1. ✅ Add gradual rollout to feature toggle
2. ✅ Add pricing analytics
3. ✅ Add usage analytics

### **Low Priority:**
1. ✅ Add user-specific feature toggles
2. ✅ Add complex pricing rules
3. ✅ Add A/B testing capabilities

## 💡 **Conclusion**

**Your schema has excellent features that the sprint planning missed:**

1. ✅ **Feature Toggle System** - You have it, sprint planning doesn't
2. ✅ **Per-KM Pricing** - More sophisticated than percentage-only
3. ✅ **Dynamic Event Pricing** - Great for seasonal/event-based pricing
4. ✅ **Basic Commission System** - Good foundation
5. ✅ **No Tax System** - As you prefer

**Sprint planning enhancements you should add:**

1. ✅ **Enhanced Commission System** - Percentage-based with limits
2. ✅ **Commission Tracking** - Detailed transaction history
3. ✅ **Pricing History** - Track changes and audit trail

**Recommendation:** Combine the best of both approaches for a comprehensive pricing and feature management system without tax complexity. 