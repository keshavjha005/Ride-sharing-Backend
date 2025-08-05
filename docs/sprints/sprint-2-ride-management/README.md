# Sprint 2: Core Ride Management

**Duration**: 3 weeks  
**Focus**: Ride creation, management, search, booking, and vehicle management

## Overview

This sprint implements the core ride-sharing functionality including ride creation, search, booking, vehicle management, and location services integration.

## Sprint Goals

- [ ] Implement ride creation and management APIs
- [ ] Create advanced search and filtering system
- [ ] Build booking and reservation system
- [x] Develop vehicle management system
- [ ] Integrate location and mapping services
- [ ] Implement ride status management

## Detailed Tasks

### Task 2.1: Vehicle Management System (3 days) ✅ COMPLETED

#### Subtasks:
- [x] Create vehicle brand and model management
- [x] Implement vehicle information storage
- [x] Create vehicle type categorization
- [x] Add vehicle verification system
- [x] Implement vehicle search and filtering

#### Database Tables:
```sql
-- Vehicle brands table
CREATE TABLE vehicle_brands (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle models table
CREATE TABLE vehicle_models (
    id VARCHAR(36) PRIMARY KEY,
    brand_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES vehicle_brands(id) ON DELETE CASCADE
);

-- Vehicle types table
CREATE TABLE vehicle_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User vehicle information table
CREATE TABLE user_vehicle_information (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    vehicle_type_id VARCHAR(36) NOT NULL,
    vehicle_brand_id VARCHAR(36) NOT NULL,
    vehicle_model_id VARCHAR(36) NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    vehicle_color VARCHAR(50),
    vehicle_year INT,
    vehicle_image VARCHAR(500),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id),
    FOREIGN KEY (vehicle_brand_id) REFERENCES vehicle_brands(id),
    FOREIGN KEY (vehicle_model_id) REFERENCES vehicle_models(id)
);
```

#### API Endpoints:
```
GET /api/vehicles/brands - Get all vehicle brands
GET /api/vehicles/models/:brandId - Get models by brand
GET /api/vehicles/types - Get vehicle types
POST /api/vehicles/user-vehicle - Add user vehicle
GET /api/vehicles/user-vehicles - Get user vehicles
PUT /api/vehicles/user-vehicle/:id - Update user vehicle
DELETE /api/vehicles/user-vehicle/:id - Delete user vehicle
```

#### Deliverables:
- Vehicle management system
- Vehicle CRUD operations
- Vehicle search functionality

### Task 2.2: Location and Mapping Integration (2 days) ✅ COMPLETED

#### Subtasks:
- [x] Integrate Google Maps API
- [x] Implement geocoding services
- [x] Create location search and autocomplete
- [x] Add distance calculation functionality
- [x] Implement route optimization
- [x] Create location validation

#### API Endpoints:
```
GET /api/location/search - Search locations
GET /api/location/geocode - Geocode address
GET /api/location/distance - Calculate distance
GET /api/location/route - Get route information
```

#### Deliverables:
- Location services integration ✅
- Geocoding functionality ✅
- Route calculation system ✅

### Task 2.3: Ride Creation and Management (4 days)

#### Subtasks:
- [ ] Create ride creation API
- [ ] Implement ride editing functionality
- [ ] Add ride status management
- [ ] Create ride validation system
- [ ] Implement ride scheduling
- [ ] Add ride cancellation logic

#### Database Tables:
```sql
-- Rides table
CREATE TABLE rides (
    id VARCHAR(36) PRIMARY KEY,
    created_by VARCHAR(36) NOT NULL,
    vehicle_information_id VARCHAR(36) NOT NULL,
    total_seats INT NOT NULL,
    booked_seats INT DEFAULT 0,
    price_per_seat DECIMAL(10,2) NOT NULL,
    distance DECIMAL(10,2),
    estimated_time INT, -- in minutes
    luggage_allowed BOOLEAN DEFAULT true,
    women_only BOOLEAN DEFAULT false,
    driver_verified BOOLEAN DEFAULT false,
    two_passenger_max_back BOOLEAN DEFAULT false,
    status ENUM('draft', 'published', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
    is_published BOOLEAN DEFAULT false,
    departure_datetime TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_information_id) REFERENCES user_vehicle_information(id)
);

-- Ride locations table
CREATE TABLE ride_locations (
    id VARCHAR(36) PRIMARY KEY,
    ride_id VARCHAR(36) NOT NULL,
    location_type ENUM('pickup', 'drop', 'stopover') NOT NULL,
    address VARCHAR(500) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    sequence_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
);

-- Ride travel preferences table
CREATE TABLE ride_travel_preferences (
    id VARCHAR(36) PRIMARY KEY,
    ride_id VARCHAR(36) NOT NULL,
    chattiness ENUM('love_to_chat', 'chatty_when_comfortable', 'quiet_type'),
    smoking ENUM('fine_with_smoking', 'breaks_outside_ok', 'no_smoking'),
    music ENUM('playlist_important', 'depends_on_mood', 'silence_golden'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
);
```

#### API Endpoints:
```
POST /api/rides - Create new ride
GET /api/rides/:id - Get ride details
PUT /api/rides/:id - Update ride
DELETE /api/rides/:id - Cancel ride
POST /api/rides/:id/publish - Publish ride
POST /api/rides/:id/unpublish - Unpublish ride
GET /api/rides/my-rides - Get user's rides
```

#### Request/Response Examples:
```json
// POST /api/rides
{
  "vehicleInformationId": "uuid",
  "totalSeats": 4,
  "pricePerSeat": 25.00,
  "luggageAllowed": true,
  "womenOnly": false,
  "driverVerified": true,
  "twoPassengerMaxBack": false,
  "departureDateTime": "2024-01-15T10:00:00Z",
  "pickupLocation": {
    "address": "123 Main St, City",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "dropLocation": {
    "address": "456 Oak Ave, City",
    "latitude": 40.7589,
    "longitude": -73.9851
  },
  "stopOvers": [
    {
      "address": "789 Pine St, City",
      "latitude": 40.7505,
      "longitude": -73.9934,
      "sequenceOrder": 1
    }
  ],
  "travelPreferences": {
    "chattiness": "chatty_when_comfortable",
    "smoking": "no_smoking",
    "music": "playlist_important"
  }
}
```

#### Deliverables:
- Ride creation system
- Ride management APIs
- Location management

### Task 2.4: Search and Filtering System (3 days)

#### Subtasks:
- [ ] Implement ride search functionality
- [ ] Create advanced filtering options
- [ ] Add sorting capabilities
- [ ] Implement pagination
- [ ] Create search history
- [ ] Add search suggestions

#### API Endpoints:
```
GET /api/rides/search - Search rides
GET /api/rides/filter - Filter rides
GET /api/search/history - Get search history
POST /api/search/history - Save search
DELETE /api/search/history/:id - Delete search history
```

#### Search Parameters:
```json
{
  "pickupLocation": "string",
  "dropLocation": "string",
  "departureDate": "YYYY-MM-DD",
  "passengers": 2,
  "maxPrice": 50.00,
  "womenOnly": false,
  "driverVerified": true,
  "sortBy": "price|departure_time|distance",
  "sortOrder": "asc|desc",
  "page": 1,
  "limit": 20
}
```

#### Deliverables:
- Advanced search system
- Filtering functionality
- Search history management

### Task 2.5: Booking System (4 days)

#### Subtasks:
- [ ] Create booking creation API
- [ ] Implement seat reservation system
- [ ] Add booking status management
- [ ] Create booking validation
- [ ] Implement booking cancellation
- [ ] Add booking confirmation system

#### Database Tables:
```sql
-- Bookings table
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pickup_location_id) REFERENCES ride_locations(id),
    FOREIGN KEY (drop_location_id) REFERENCES ride_locations(id),
    FOREIGN KEY (stopover_id) REFERENCES ride_locations(id)
);

-- Booking taxes table
CREATE TABLE booking_taxes (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) NOT NULL,
    tax_name VARCHAR(100) NOT NULL,
    tax_percentage DECIMAL(5,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
```

#### API Endpoints:
```
POST /api/bookings - Create booking
GET /api/bookings/:id - Get booking details
PUT /api/bookings/:id/cancel - Cancel booking
GET /api/bookings/my-bookings - Get user bookings
POST /api/bookings/:id/confirm - Confirm booking
```

#### Deliverables:
- Booking system
- Seat reservation logic
- Booking status management

### Task 2.6: Ride Status and Notifications (2 days)

#### Subtasks:
- [ ] Implement ride status updates
- [ ] Create notification triggers
- [ ] Add ride completion logic
- [ ] Implement ride rating prompts
- [ ] Create ride statistics

#### API Endpoints:
```
PUT /api/rides/:id/status - Update ride status
GET /api/rides/:id/statistics - Get ride statistics
POST /api/rides/:id/complete - Complete ride
```

#### Deliverables:
- Status management system
- Notification triggers
- Ride completion workflow

## Database Schema

### Additional Tables for Sprint 2

```sql
-- Search history table
CREATE TABLE user_search_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    pickup_location VARCHAR(500),
    drop_location VARCHAR(500),
    search_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ride statistics table
CREATE TABLE ride_statistics (
    id VARCHAR(36) PRIMARY KEY,
    ride_id VARCHAR(36) NOT NULL,
    total_bookings INT DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0.00,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_ratings INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
);
```

## API Documentation

### Vehicle Management Endpoints

#### Get Vehicle Brands
```http
GET /api/vehicles/brands
```

#### Add User Vehicle
```http
POST /api/vehicles/user-vehicle
Authorization: Bearer <token>
Content-Type: application/json

{
  "vehicleTypeId": "uuid",
  "vehicleBrandId": "uuid",
  "vehicleModelId": "uuid",
  "vehicleNumber": "ABC123",
  "vehicleColor": "Red",
  "vehicleYear": 2020
}
```

### Ride Management Endpoints

#### Create Ride
```http
POST /api/rides
Authorization: Bearer <token>
Content-Type: application/json

{
  "vehicleInformationId": "uuid",
  "totalSeats": 4,
  "pricePerSeat": 25.00,
  "departureDateTime": "2024-01-15T10:00:00Z",
  "pickupLocation": {
    "address": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "dropLocation": {
    "address": "456 Oak Ave",
    "latitude": 40.7589,
    "longitude": -73.9851
  }
}
```

#### Search Rides
```http
GET /api/rides/search?pickupLocation=City&dropLocation=City&departureDate=2024-01-15&passengers=2&maxPrice=50
```

### Booking Endpoints

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "rideId": "uuid",
  "bookedSeats": 2,
  "pickupLocationId": "uuid",
  "dropLocationId": "uuid"
}
```

## Testing Requirements

### Unit Tests
- [ ] Vehicle service tests
- [ ] Ride service tests
- [ ] Booking service tests
- [ ] Location service tests

### Integration Tests
- [ ] Ride creation flow tests
- [ ] Booking flow tests
- [ ] Search functionality tests

### API Tests
- [ ] All ride endpoints validation
- [ ] Booking flow validation
- [ ] Search and filter tests

## Performance Requirements

- [ ] Search response time < 500ms
- [ ] Ride creation < 1 second
- [ ] Booking creation < 2 seconds
- [ ] Efficient database queries with proper indexing

## Definition of Done

- [ ] All ride management features implemented
- [ ] Search and filtering system working
- [ ] Booking system functional
- [ ] Vehicle management complete
- [ ] Location services integrated
- [ ] All tests passing
- [ ] API documentation updated
- [ ] Performance benchmarks met

## Next Sprint Dependencies

- Ride creation and management must be complete
- Booking system must be functional
- Vehicle management system must be ready
- Location services must be integrated

## Risk Mitigation

- **Risk**: Google Maps API costs
  - **Mitigation**: Implement caching and optimize API usage

- **Risk**: Complex booking logic
  - **Mitigation**: Thorough testing and validation

- **Risk**: Search performance issues
  - **Mitigation**: Implement proper indexing and caching 