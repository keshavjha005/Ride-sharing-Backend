# Sprint 4: Financial System

**Duration**: 3 weeks  
**Focus**: Wallet management, payment processing, transactions, and financial operations

## Overview

This sprint implements the complete financial system including wallet management, payment gateway integration, transaction processing, withdrawal system, and admin commission handling with per-kilometer and dynamic event pricing.

## Sprint Goals

- [ ] Implement wallet management system
- [ ] Integrate payment gateways (Stripe, PayPal, etc.)
- [ ] Create transaction processing system
- [ ] Build withdrawal and payout system
- [ ] Implement admin commission handling
- [ ] Create financial reporting and analytics
- [ ] Implement per-kilometer pricing system
- [ ] Add dynamic event-based pricing

## Detailed Tasks

### Task 4.1: Wallet Management System (3 days)

#### Subtasks:
- [ ] Create wallet balance management
- [ ] Implement wallet transaction history
- [ ] Add wallet security features
- [ ] Create wallet limits and restrictions
- [ ] Implement wallet verification system
- [ ] Add wallet statistics and analytics

#### Database Tables:
```sql
-- Wallets table
CREATE TABLE wallets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    balance DECIMAL(12,2) DEFAULT 0.00,
    currency_code VARCHAR(10) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    daily_limit DECIMAL(12,2) DEFAULT 1000.00,
    monthly_limit DECIMAL(12,2) DEFAULT 10000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wallet transactions table
CREATE TABLE wallet_transactions (
    id VARCHAR(36) PRIMARY KEY,
    wallet_id VARCHAR(36) NOT NULL,
    transaction_type ENUM('credit', 'debit') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    balance_before DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    transaction_category ENUM('ride_payment', 'ride_earning', 'wallet_recharge', 'withdrawal', 'refund', 'commission', 'bonus') NOT NULL,
    reference_id VARCHAR(36), -- booking_id, withdrawal_id, etc.
    reference_type VARCHAR(50), -- 'booking', 'withdrawal', 'recharge'
    description TEXT,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- Wallet recharge requests table
CREATE TABLE wallet_recharge_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('card', 'bank_transfer', 'paypal', 'stripe') NOT NULL,
    payment_gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(255),
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### API Endpoints:
```
GET /api/wallet/balance - Get wallet balance
GET /api/wallet/transactions - Get transaction history
POST /api/wallet/recharge - Recharge wallet
GET /api/wallet/statistics - Get wallet statistics
PUT /api/wallet/limits - Update wallet limits
```

#### Request/Response Examples:
```json
// POST /api/wallet/recharge
{
  "amount": 100.00,
  "paymentMethod": "card",
  "currency": "USD"
}

// Response
{
  "success": true,
  "data": {
    "rechargeId": "uuid",
    "amount": 100.00,
    "paymentUrl": "https://payment.gateway.com/pay/xyz",
    "expiresAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Deliverables:
- Wallet management system
- Transaction tracking
- Balance management
- Security features

### Task 4.2: Payment Gateway Integration (4 days)

#### Subtasks:
- [ ] Integrate Stripe payment gateway
- [ ] Implement PayPal integration
- [ ] Add multiple payment methods support
- [ ] Create payment webhook handlers
- [ ] Implement payment security measures
- [ ] Add payment method management

#### Database Tables:
```sql
-- Payment methods table
CREATE TABLE payment_methods (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    payment_type ENUM('card', 'paypal', 'bank_account') NOT NULL,
    gateway VARCHAR(50) NOT NULL, -- 'stripe', 'paypal'
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

-- Payment transactions table
CREATE TABLE payment_transactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method_id VARCHAR(36),
    gateway VARCHAR(50) NOT NULL,
    gateway_transaction_id VARCHAR(255),
    gateway_payment_intent_id VARCHAR(255),
    status ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled') DEFAULT 'pending',
    failure_reason TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
);
```

#### API Endpoints:
```
POST /api/payments/create-intent - Create payment intent
POST /api/payments/confirm - Confirm payment
GET /api/payments/methods - Get payment methods
POST /api/payments/methods - Add payment method
DELETE /api/payments/methods/:id - Remove payment method
POST /api/payments/webhook/stripe - Stripe webhook
POST /api/payments/webhook/paypal - PayPal webhook
```

#### Payment Flow:
```javascript
// 1. Create payment intent
POST /api/payments/create-intent
{
  "amount": 100.00,
  "currency": "USD",
  "paymentMethodId": "pm_1234567890"
}

// 2. Confirm payment
POST /api/payments/confirm
{
  "paymentIntentId": "pi_1234567890",
  "paymentMethodId": "pm_1234567890"
}
```

#### Deliverables:
- Stripe integration
- PayPal integration
- Payment method management
- Webhook handlers

### Task 4.3: Per-Kilometer Pricing System (2 days)

#### Subtasks:
- [ ] Implement per-kilometer pricing for vehicle types
- [ ] Create dynamic pricing calculation engine
- [ ] Add distance-based pricing rules
- [ ] Implement pricing validation
- [ ] Create pricing history tracking
- [ ] Add pricing analytics

#### Database Tables:
```sql
-- Vehicle types with per-kilometer pricing (enhanced)
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

-- Pricing calculation history
CREATE TABLE pricing_calculations (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL,
    vehicle_type_id VARCHAR(36) NOT NULL,
    base_distance DECIMAL(10,2) NOT NULL,
    base_fare DECIMAL(10,2) NOT NULL,
    applied_multipliers JSON, -- Store which multipliers were applied
    final_fare DECIMAL(10,2) NOT NULL,
    calculation_details JSON, -- Detailed breakdown
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id) ON DELETE CASCADE
);
```

#### API Endpoints:
```
GET /api/pricing/vehicle-types - Get vehicle types with pricing
PUT /api/pricing/vehicle-types/:id - Update vehicle type pricing
GET /api/pricing/calculate - Calculate fare for a trip
POST /api/pricing/multipliers - Add pricing multiplier
GET /api/pricing/history - Get pricing calculation history
```

#### Pricing Calculation Example:
```javascript
// Calculate fare based on distance and vehicle type
const calculateFare = (distance, vehicleType, multipliers = []) => {
  const baseFare = distance * vehicleType.per_km_charges;
  let finalFare = baseFare;
  
  // Apply multipliers
  multipliers.forEach(multiplier => {
    finalFare *= multiplier.value;
  });
  
  // Apply minimum/maximum constraints
  if (finalFare < vehicleType.minimum_fare) {
    finalFare = vehicleType.minimum_fare;
  }
  
  if (vehicleType.maximum_fare && finalFare > vehicleType.maximum_fare) {
    finalFare = vehicleType.maximum_fare;
  }
  
  return finalFare;
};
```

#### Deliverables:
- Per-kilometer pricing system
- Dynamic pricing calculation
- Pricing history tracking
- Pricing analytics

### Task 4.4: Dynamic Event Pricing System (2 days)

#### Subtasks:
- [ ] Implement event-based pricing rules
- [ ] Create time-based pricing schedules
- [ ] Add seasonal pricing adjustments
- [ ] Implement demand-based pricing
- [ ] Create pricing event management
- [ ] Add pricing event analytics

#### Database Tables:
```sql
-- Dynamic pricing settings for events
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

-- Pricing event applications
CREATE TABLE pricing_event_applications (
    id VARCHAR(36) PRIMARY KEY,
    trip_id VARCHAR(36) NOT NULL,
    pricing_event_id VARCHAR(36) NOT NULL,
    original_fare DECIMAL(10,2) NOT NULL,
    adjusted_fare DECIMAL(10,2) NOT NULL,
    multiplier_applied DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (pricing_event_id) REFERENCES pricing_events(id) ON DELETE CASCADE
);
```

#### API Endpoints:
```
GET /api/pricing/events - Get active pricing events
POST /api/pricing/events - Create new pricing event
PUT /api/pricing/events/:id - Update pricing event
DELETE /api/pricing/events/:id - Delete pricing event
GET /api/pricing/events/active - Get currently active events
GET /api/pricing/events/analytics - Get event pricing analytics
```

#### Event Pricing Example:
```javascript
// Apply event-based pricing
const applyEventPricing = (baseFare, tripDetails) => {
  const activeEvents = getActiveEvents(tripDetails.date, tripDetails.location);
  let adjustedFare = baseFare;
  
  activeEvents.forEach(event => {
    if (isEventApplicable(event, tripDetails)) {
      adjustedFare *= event.pricing_multiplier;
    }
  });
  
  return adjustedFare;
};
```

#### Deliverables:
- Event-based pricing system
- Time-based pricing rules
- Pricing event management
- Event pricing analytics

### Task 4.5: Transaction Processing System (3 days)

#### Subtasks:
- [ ] Create transaction processing engine
- [ ] Implement booking payment processing
- [ ] Add commission calculation
- [ ] Create refund processing
- [ ] Implement transaction reconciliation
- [ ] Add transaction reporting

#### Database Tables:
```sql
-- Booking payments table
CREATE TABLE booking_payments (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('wallet', 'card', 'paypal') NOT NULL,
    payment_transaction_id VARCHAR(36),
    status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    admin_commission_amount DECIMAL(12,2) DEFAULT 0.00,
    driver_earning_amount DECIMAL(12,2) DEFAULT 0.00,
    pricing_details JSON, -- Store pricing calculation details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions(id) ON DELETE SET NULL
);

-- Commission transactions table
CREATE TABLE commission_transactions (
    id VARCHAR(36) PRIMARY KEY,
    booking_payment_id VARCHAR(36) NOT NULL,
    commission_amount DECIMAL(12,2) NOT NULL,
    commission_percentage DECIMAL(5,2) NOT NULL,
    transaction_type ENUM('booking_commission', 'withdrawal_fee') NOT NULL,
    status ENUM('pending', 'collected', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_payment_id) REFERENCES booking_payments(id) ON DELETE CASCADE
);
```

#### API Endpoints:
```
POST /api/bookings/:id/pay - Process booking payment
POST /api/bookings/:id/refund - Process refund
GET /api/transactions - Get transaction history
GET /api/transactions/:id - Get transaction details
POST /api/transactions/reconcile - Reconcile transactions
```

#### Deliverables:
- Transaction processing engine
- Payment processing
- Commission handling
- Refund system

### Task 4.6: Withdrawal and Payout System (3 days)

#### Subtasks:
- [ ] Create withdrawal request system
- [ ] Implement payout processing
- [ ] Add withdrawal limits and validation
- [ ] Create payout method management
- [ ] Implement withdrawal approval workflow
- [ ] Add withdrawal reporting

#### Database Tables:
```sql
-- Withdrawal requests table
CREATE TABLE withdrawal_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    withdrawal_method ENUM('bank_transfer', 'paypal', 'stripe') NOT NULL,
    account_details JSON, -- encrypted account information
    status ENUM('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled') DEFAULT 'pending',
    admin_notes TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payout transactions table
CREATE TABLE payout_transactions (
    id VARCHAR(36) PRIMARY KEY,
    withdrawal_request_id VARCHAR(36) NOT NULL,
    gateway VARCHAR(50) NOT NULL, -- 'stripe', 'paypal'
    gateway_payout_id VARCHAR(255),
    amount DECIMAL(12,2) NOT NULL,
    fee_amount DECIMAL(12,2) DEFAULT 0.00,
    net_amount DECIMAL(12,2) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (withdrawal_request_id) REFERENCES withdrawal_requests(id) ON DELETE CASCADE
);
```

#### API Endpoints:
```
POST /api/withdrawals/request - Create withdrawal request
GET /api/withdrawals/requests - Get withdrawal requests
PUT /api/withdrawals/requests/:id/approve - Approve withdrawal
PUT /api/withdrawals/requests/:id/reject - Reject withdrawal
GET /api/withdrawals/methods - Get withdrawal methods
POST /api/withdrawals/methods - Add withdrawal method
```

#### Deliverables:
- Withdrawal system
- Payout processing
- Approval workflow
- Method management

### Task 4.7: Admin Commission System (2 days)

#### Subtasks:
- [ ] Implement commission calculation
- [ ] Create commission tracking
- [ ] Add commission reporting
- [ ] Implement commission settings
- [ ] Create commission analytics

#### Database Tables:
```sql
-- Commission settings table
CREATE TABLE commission_settings (
    id VARCHAR(36) PRIMARY KEY,
    commission_type ENUM('booking', 'withdrawal', 'per_km') NOT NULL,
    commission_percentage DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(12,2), -- For fixed amount commissions
    minimum_amount DECIMAL(12,2) DEFAULT 0.00,
    maximum_amount DECIMAL(12,2),
    is_active BOOLEAN DEFAULT true,
    effective_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Commission reports table
CREATE TABLE commission_reports (
    id VARCHAR(36) PRIMARY KEY,
    report_date DATE NOT NULL,
    total_bookings INT DEFAULT 0,
    total_booking_amount DECIMAL(12,2) DEFAULT 0.00,
    total_commission_amount DECIMAL(12,2) DEFAULT 0.00,
    total_withdrawals INT DEFAULT 0,
    total_withdrawal_fees DECIMAL(12,2) DEFAULT 0.00,
    net_commission DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### API Endpoints:
```
GET /api/admin/commission/settings - Get commission settings
PUT /api/admin/commission/settings - Update commission settings
GET /api/admin/commission/reports - Get commission reports
GET /api/admin/commission/analytics - Get commission analytics
```

#### Deliverables:
- Commission calculation
- Commission tracking
- Reporting system
- Analytics dashboard

### Task 4.8: Financial Reporting and Analytics (2 days)

#### Subtasks:
- [ ] Create financial dashboard
- [ ] Implement revenue reporting
- [ ] Add transaction analytics
- [ ] Create user financial reports
- [ ] Implement export functionality
- [ ] Add financial alerts

#### API Endpoints:
```
GET /api/admin/financial/dashboard - Get financial dashboard
GET /api/admin/financial/revenue - Get revenue reports
GET /api/admin/financial/transactions - Get transaction reports
GET /api/admin/financial/users/:id - Get user financial report
POST /api/admin/financial/export - Export financial data
GET /api/admin/financial/alerts - Get financial alerts
```

#### Deliverables:
- Financial dashboard
- Revenue reporting
- Transaction analytics
- Export functionality

## Database Schema

### Additional Tables for Sprint 4

```sql
-- Currency exchange rates table
CREATE TABLE currency_exchange_rates (
    id VARCHAR(36) PRIMARY KEY,
    from_currency VARCHAR(10) NOT NULL,
    to_currency VARCHAR(10) NOT NULL,
    exchange_rate DECIMAL(10,6) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial alerts table
CREATE TABLE financial_alerts (
    id VARCHAR(36) PRIMARY KEY,
    alert_type ENUM('low_balance', 'high_transaction', 'suspicious_activity') NOT NULL,
    user_id VARCHAR(36),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Pricing history table
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

## API Documentation

### Pricing Endpoints

#### Calculate Fare
```http
POST /api/pricing/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "distance": 25.5,
  "vehicleTypeId": "uuid",
  "pickupLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "dropoffLocation": {
    "latitude": 40.7589,
    "longitude": -73.9851
  },
  "departureTime": "2024-01-15T10:00:00Z"
}
```

#### Create Pricing Event
```http
POST /api/pricing/events
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "eventName": "New Year Surge",
  "eventType": "special_event",
  "startDate": "2024-12-31T18:00:00Z",
  "endDate": "2025-01-01T06:00:00Z",
  "pricingMultiplier": 2.5,
  "affectedVehicleTypes": ["uuid1", "uuid2"],
  "description": "New Year pricing surge"
}
```

### Wallet Endpoints

#### Get Wallet Balance
```http
GET /api/wallet/balance
Authorization: Bearer <token>
```

#### Recharge Wallet
```http
POST /api/wallet/recharge
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100.00,
  "paymentMethod": "card",
  "currency": "USD"
}
```

### Payment Endpoints

#### Create Payment Intent
```http
POST /api/payments/create-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100.00,
  "currency": "USD",
  "paymentMethodId": "pm_1234567890"
}
```

### Withdrawal Endpoints

#### Create Withdrawal Request
```http
POST /api/withdrawals/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50.00,
  "withdrawalMethod": "bank_transfer",
  "accountDetails": {
    "accountNumber": "1234567890",
    "routingNumber": "021000021"
  }
}
```

## Payment Gateway Configuration

### Stripe Configuration
```javascript
// Environment variables
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

// Payment intent creation
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount * 100, // Convert to cents
  currency: currency,
  payment_method: paymentMethodId,
  confirm: true,
  return_url: 'https://mate.com/payment/success'
});
```

### PayPal Configuration
```javascript
// Environment variables
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox // or live

// Create order
const order = await paypal.createOrder({
  intent: 'CAPTURE',
  purchase_units: [{
    amount: {
      currency_code: 'USD',
      value: amount.toString()
    }
  }]
});
```

## Testing Requirements

### Unit Tests
- [ ] Wallet service tests
- [ ] Payment service tests
- [ ] Transaction service tests
- [ ] Commission calculation tests
- [ ] Pricing calculation tests

### Integration Tests
- [ ] Payment gateway integration tests
- [ ] Wallet transaction flow tests
- [ ] Withdrawal process tests
- [ ] Pricing calculation flow tests

### Security Tests
- [ ] Payment data encryption tests
- [ ] Webhook signature verification tests
- [ ] Transaction validation tests

## Security Considerations

- [ ] PCI DSS compliance for payment data
- [ ] Encryption of sensitive financial data
- [ ] Secure webhook handling
- [ ] Transaction validation and fraud detection
- [ ] Audit logging for all financial operations

## Performance Requirements

- [ ] Payment processing < 5 seconds
- [ ] Wallet balance updates < 1 second
- [ ] Transaction history loading < 2 seconds
- [ ] Pricing calculation < 500ms
- [ ] Support for high transaction volumes

## Definition of Done

- [ ] Wallet system fully functional
- [ ] Payment gateways integrated and tested
- [ ] Transaction processing working
- [ ] Withdrawal system operational
- [ ] Commission system implemented
- [ ] Per-kilometer pricing working
- [ ] Dynamic event pricing functional
- [ ] Financial reporting complete
- [ ] All security measures in place
- [ ] Performance benchmarks met

## Next Sprint Dependencies

- Payment system must be stable and secure
- Transaction processing must be reliable
- Financial data must be accurate
- Pricing system must be functional
- Security measures must be implemented

## Risk Mitigation

- **Risk**: Payment gateway failures
  - **Mitigation**: Implement multiple payment gateways and fallback mechanisms

- **Risk**: Financial data security
  - **Mitigation**: Implement encryption, audit logging, and security monitoring

- **Risk**: Transaction reconciliation issues
  - **Mitigation**: Implement automated reconciliation and manual review processes

- **Risk**: Pricing calculation errors
  - **Mitigation**: Implement comprehensive testing and validation for pricing logic 