# Ride Management API Documentation

This document describes the Ride Management API endpoints for the Mate ride-sharing platform. These endpoints provide comprehensive ride creation, management, and status control functionality.

## Base URL

```
https://api.mate.com/api/rides
```

## Authentication

Most ride management endpoints require authentication using JWT Bearer tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Ride

Create a new ride with pickup/dropoff locations, vehicle information, and travel preferences.

**Endpoint:** `POST /api/rides`

**Authentication:** Required

**Request Body:**
```json
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
    "address": "123 Main St, New York, NY",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "dropLocation": {
    "address": "456 Oak Ave, New York, NY",
    "latitude": 40.7589,
    "longitude": -73.9851
  },
  "stopOvers": [
    {
      "address": "789 Pine St, New York, NY",
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

**Response:**
```json
{
  "success": true,
  "message": "Ride created successfully",
  "data": {
    "id": "ride-uuid-123",
    "created_by": "user-uuid-456",
    "vehicle_information_id": "vehicle-uuid-789",
    "total_seats": 4,
    "booked_seats": 0,
    "price_per_seat": 25.00,
    "distance": 5.2,
    "estimated_time": 15,
    "luggage_allowed": true,
    "women_only": false,
    "driver_verified": true,
    "two_passenger_max_back": false,
    "status": "draft",
    "is_published": false,
    "departure_datetime": "2024-01-15T10:00:00.000Z",
    "created_at": "2024-01-10T15:30:00.000Z",
    "updated_at": "2024-01-10T15:30:00.000Z",
    "creator_name": "John Doe",
    "creator_email": "john@example.com",
    "vehicle_number": "ABC123",
    "vehicle_color": "Red",
    "vehicle_year": 2020,
    "vehicle_brand": "Toyota",
    "vehicle_model": "Camry",
    "vehicle_type": "Sedan",
    "locations": [
      {
        "id": "location-uuid-1",
        "ride_id": "ride-uuid-123",
        "location_type": "pickup",
        "address": "123 Main St, New York, NY",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "sequence_order": 0,
        "created_at": "2024-01-10T15:30:00.000Z"
      },
      {
        "id": "location-uuid-2",
        "ride_id": "ride-uuid-123",
        "location_type": "stopover",
        "address": "789 Pine St, New York, NY",
        "latitude": 40.7505,
        "longitude": -73.9934,
        "sequence_order": 1,
        "created_at": "2024-01-10T15:30:00.000Z"
      },
      {
        "id": "location-uuid-3",
        "ride_id": "ride-uuid-123",
        "location_type": "drop",
        "address": "456 Oak Ave, New York, NY",
        "latitude": 40.7589,
        "longitude": -73.9851,
        "sequence_order": 2,
        "created_at": "2024-01-10T15:30:00.000Z"
      }
    ],
    "travelPreferences": {
      "id": "preferences-uuid-1",
      "ride_id": "ride-uuid-123",
      "chattiness": "chatty_when_comfortable",
      "smoking": "no_smoking",
      "music": "playlist_important",
      "created_at": "2024-01-10T15:30:00.000Z"
    }
  }
}
```

### 2. Get Ride Details

Retrieve detailed information about a specific ride.

**Endpoint:** `GET /api/rides/:id`

**Authentication:** Not required

**Parameters:**
- `id` (path): Ride UUID

**Response:**
```json
{
  "success": true,
  "message": "Ride details retrieved successfully",
  "data": {
    "id": "ride-uuid-123",
    "created_by": "user-uuid-456",
    "vehicle_information_id": "vehicle-uuid-789",
    "total_seats": 4,
    "booked_seats": 2,
    "price_per_seat": 25.00,
    "distance": 5.2,
    "estimated_time": 15,
    "luggage_allowed": true,
    "women_only": false,
    "driver_verified": true,
    "two_passenger_max_back": false,
    "status": "published",
    "is_published": true,
    "departure_datetime": "2024-01-15T10:00:00.000Z",
    "created_at": "2024-01-10T15:30:00.000Z",
    "updated_at": "2024-01-10T16:00:00.000Z",
    "creator_name": "John Doe",
    "creator_email": "john@example.com",
    "vehicle_number": "ABC123",
    "vehicle_color": "Red",
    "vehicle_year": 2020,
    "vehicle_brand": "Toyota",
    "vehicle_model": "Camry",
    "vehicle_type": "Sedan",
    "locations": [...],
    "travelPreferences": {...}
  }
}
```

### 3. Update Ride

Update an existing ride's information.

**Endpoint:** `PUT /api/rides/:id`

**Authentication:** Required (ride owner only)

**Parameters:**
- `id` (path): Ride UUID

**Request Body:**
```json
{
  "totalSeats": 6,
  "pricePerSeat": 30.00,
  "departureDateTime": "2024-01-16T10:00:00Z",
  "pickupLocation": {
    "address": "Updated Pickup Address",
    "latitude": 40.7200,
    "longitude": -74.0100
  },
  "dropLocation": {
    "address": "Updated Drop Address",
    "latitude": 40.7600,
    "longitude": -73.9800
  },
  "travelPreferences": {
    "chattiness": "quiet_type",
    "smoking": "breaks_outside_ok",
    "music": "silence_golden"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ride updated successfully",
  "data": {
    "id": "ride-uuid-123",
    "total_seats": 6,
    "price_per_seat": 30.00,
    "departure_datetime": "2024-01-16T10:00:00.000Z",
    "updated_at": "2024-01-10T17:00:00.000Z",
    ...
  }
}
```

### 4. Publish Ride

Make a draft ride available for booking.

**Endpoint:** `POST /api/rides/:id/publish`

**Authentication:** Required (ride owner only)

**Parameters:**
- `id` (path): Ride UUID

**Response:**
```json
{
  "success": true,
  "message": "Ride published successfully"
}
```

### 5. Unpublish Ride

Make a published ride unavailable for booking (returns to draft status).

**Endpoint:** `POST /api/rides/:id/unpublish`

**Authentication:** Required (ride owner only)

**Parameters:**
- `id` (path): Ride UUID

**Response:**
```json
{
  "success": true,
  "message": "Ride unpublished successfully"
}
```

### 6. Get User's Rides

Retrieve all rides created by the authenticated user.

**Endpoint:** `GET /api/rides/my-rides`

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by ride status
  - `draft`: Draft rides
  - `published`: Published rides
  - `in_progress`: Rides in progress
  - `completed`: Completed rides
  - `cancelled`: Cancelled rides
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "User rides retrieved successfully",
  "data": {
    "rides": [
      {
        "id": "ride-uuid-123",
        "created_by": "user-uuid-456",
        "vehicle_information_id": "vehicle-uuid-789",
        "total_seats": 4,
        "booked_seats": 2,
        "price_per_seat": 25.00,
        "distance": 5.2,
        "estimated_time": 15,
        "luggage_allowed": true,
        "women_only": false,
        "driver_verified": true,
        "two_passenger_max_back": false,
        "status": "published",
        "is_published": true,
        "departure_datetime": "2024-01-15T10:00:00.000Z",
        "created_at": "2024-01-10T15:30:00.000Z",
        "updated_at": "2024-01-10T16:00:00.000Z",
        "vehicle_number": "ABC123",
        "vehicle_color": "Red",
        "vehicle_brand": "Toyota",
        "vehicle_model": "Camry",
        "vehicle_type": "Sedan"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1
    }
  }
}
```

### 7. Get Available Seats

Get the number of available seats for a specific ride.

**Endpoint:** `GET /api/rides/:id/available-seats`

**Authentication:** Not required

**Parameters:**
- `id` (path): Ride UUID

**Response:**
```json
{
  "success": true,
  "message": "Available seats retrieved successfully",
  "data": {
    "rideId": "ride-uuid-123",
    "availableSeats": 2
  }
}
```

### 8. Cancel Ride

Cancel a ride (soft delete - sets status to cancelled).

**Endpoint:** `DELETE /api/rides/:id`

**Authentication:** Required (ride owner only)

**Parameters:**
- `id` (path): Ride UUID

**Response:**
```json
{
  "success": true,
  "message": "Ride cancelled successfully"
}
```

## Data Models

### Ride Status Values

- `draft`: Ride is being created/edited
- `published`: Ride is available for booking
- `in_progress`: Ride has started
- `completed`: Ride has finished
- `cancelled`: Ride has been cancelled

### Travel Preferences

#### Chattiness Options
- `love_to_chat`: Love to Chat
- `chatty_when_comfortable`: Chatty when Comfortable
- `quiet_type`: Quiet Type

#### Smoking Options
- `fine_with_smoking`: Fine with Smoking
- `breaks_outside_ok`: Breaks Outside OK
- `no_smoking`: No Smoking

#### Music Options
- `playlist_important`: Playlist Important
- `depends_on_mood`: Depends on Mood
- `silence_golden`: Silence Golden

### Location Types

- `pickup`: Pickup location
- `drop`: Dropoff location
- `stopover`: Intermediate stop

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "field": "vehicleInformationId",
      "message": "Valid vehicle information ID is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token is missing or invalid"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Not authorized"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Ride not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

## Usage Examples

### Frontend Integration

**Creating a Ride:**
```javascript
const createRide = async (rideData) => {
  const response = await fetch('/api/rides', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(rideData)
  });
  
  const result = await response.json();
  return result;
};

// Example usage
const newRide = await createRide({
  vehicleInformationId: 'vehicle-uuid',
  totalSeats: 4,
  pricePerSeat: 25.00,
  departureDateTime: '2024-01-15T10:00:00Z',
  pickupLocation: {
    address: '123 Main St, New York, NY',
    latitude: 40.7128,
    longitude: -74.0060
  },
  dropLocation: {
    address: '456 Oak Ave, New York, NY',
    latitude: 40.7589,
    longitude: -73.9851
  }
});
```

**Publishing a Ride:**
```javascript
const publishRide = async (rideId) => {
  const response = await fetch(`/api/rides/${rideId}/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

**Getting User's Rides:**
```javascript
const getUserRides = async (status = null, page = 1) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('page', page);
  
  const response = await fetch(`/api/rides/my-rides?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

## Best Practices

1. **Validation**: Always validate input data before sending to the API
2. **Error Handling**: Implement proper error handling for all API calls
3. **Authentication**: Ensure JWT tokens are valid and not expired
4. **Rate Limiting**: Respect API rate limits
5. **Caching**: Cache ride data when appropriate to reduce API calls
6. **Status Management**: Use appropriate ride statuses for different stages
7. **Location Validation**: Validate coordinates before sending to API

## Dependencies

- JWT Authentication
- Vehicle Management System
- Location Services
- Database (MySQL)

## Configuration

The following environment variables are required:
- `JWT_SECRET`: Secret key for JWT token generation
- `DATABASE_URL`: MySQL database connection string
- `GOOGLE_MAPS_API_KEY`: Google Maps API key for location services 