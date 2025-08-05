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

### 7. Search Rides

Search for available rides with advanced filtering options.

**Endpoint:** `GET /api/rides/search`

**Authentication:** Optional (required for search history)

**Query Parameters:**
- `pickupLocation` (optional): Pickup location address
- `dropLocation` (optional): Drop location address
- `departureDate` (optional): Departure date (YYYY-MM-DD)
- `passengers` (optional): Number of passengers (1-10, default: 1)
- `maxPrice` (optional): Maximum price per seat
- `womenOnly` (optional): Filter for women-only rides (boolean)
- `driverVerified` (optional): Filter for verified drivers only (boolean)
- `sortBy` (optional): Sort field (price, departure_time, distance, created_at, default: departure_time)
- `sortOrder` (optional): Sort order (asc, desc, default: asc)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (1-100, default: 20)

**Example Request:**
```http
GET /api/rides/search?pickupLocation=New%20York&dropLocation=Boston&passengers=2&maxPrice=50&sortBy=price&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "message": "Rides found successfully",
  "data": {
    "rides": [
      {
        "id": "ride-uuid-123",
        "created_by": "user-uuid-456",
        "total_seats": 4,
        "booked_seats": 1,
        "price_per_seat": 25.00,
        "distance": 350.5,
        "estimated_time": 240,
        "departure_datetime": "2024-01-15T10:00:00.000Z",
        "status": "published",
        "creator_name": "John Doe",
        "vehicle_brand": "Toyota",
        "vehicle_model": "Camry",
        "available_seats": 3,
        "locations": [
          {
            "id": "location-uuid-1",
            "location_type": "pickup",
            "address": "New York, NY",
            "latitude": 40.7128,
            "longitude": -74.0060
          },
          {
            "id": "location-uuid-2",
            "location_type": "drop",
            "address": "Boston, MA",
            "latitude": 42.3601,
            "longitude": -71.0589
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    },
    "filters": {
      "pickupLocation": "New York",
      "dropLocation": "Boston",
      "passengers": 2,
      "maxPrice": 50,
      "womenOnly": false,
      "driverVerified": true
    }
  }
}
```

### 8. Filter Rides

Filter rides with specific criteria including price range, distance, dates, and vehicle information.

**Endpoint:** `GET /api/rides/filter`

**Authentication:** Not required

**Query Parameters:**
- `status` (optional): Comma-separated list of ride statuses
- `priceMin` (optional): Minimum price per seat
- `priceMax` (optional): Maximum price per seat
- `distanceMin` (optional): Minimum distance in kilometers
- `distanceMax` (optional): Maximum distance in kilometers
- `dateFrom` (optional): Start date for departure (ISO8601)
- `dateTo` (optional): End date for departure (ISO8601)
- `vehicleType` (optional): Vehicle type filter
- `vehicleBrand` (optional): Vehicle brand filter
- `sortBy` (optional): Sort field (price, departure_time, distance, created_at, default: created_at)
- `sortOrder` (optional): Sort order (asc, desc, default: desc)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (1-100, default: 20)

**Example Request:**
```http
GET /api/rides/filter?priceMin=20&priceMax=100&vehicleType=Sedan&sortBy=price&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "message": "Rides filtered successfully",
  "data": {
    "rides": [
      {
        "id": "ride-uuid-123",
        "created_by": "user-uuid-456",
        "total_seats": 4,
        "booked_seats": 0,
        "price_per_seat": 25.00,
        "distance": 100.5,
        "estimated_time": 120,
        "departure_datetime": "2024-01-15T10:00:00.000Z",
        "status": "published",
        "creator_name": "John Doe",
        "vehicle_brand": "Toyota",
        "vehicle_model": "Camry",
        "vehicle_type": "Sedan",
        "available_seats": 4
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    },
    "filters": {
      "priceMin": 20,
      "priceMax": 100,
      "vehicleType": "Sedan",
      "sortBy": "price",
      "sortOrder": "asc"
    }
  }
}
```

## Search Management API

### 1. Get Search History

Retrieve the authenticated user's search history with pagination.

**Endpoint:** `GET /api/search/history`

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (1-100, default: 20)

**Response:**
```json
{
  "success": true,
  "message": "Search history retrieved successfully",
  "data": {
    "history": [
      {
        "id": "search-uuid-123",
        "pickupLocation": "New York, NY",
        "dropLocation": "Boston, MA",
        "searchDate": "2024-01-10T15:30:00.000Z"
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

### 2. Save Search to History

Save a search query to the user's search history.

**Endpoint:** `POST /api/search/history`

**Authentication:** Required

**Request Body:**
```json
{
  "pickupLocation": "New York, NY",
  "dropLocation": "Boston, MA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Search saved to history successfully",
  "data": {
    "searchId": "search-uuid-123"
  }
}
```

### 3. Delete Search History Item

Delete a specific search history item for the authenticated user.

**Endpoint:** `DELETE /api/search/history/:id`

**Authentication:** Required

**Parameters:**
- `id` (path): Search history item ID (UUID)

**Response:**
```json
{
  "success": true,
  "message": "Search history item deleted successfully"
}
```

### 4. Get Search Suggestions

Get location or popular search suggestions based on the query.

**Endpoint:** `GET /api/search/suggestions`

**Authentication:** Not required

**Query Parameters:**
- `query` (required): Search query string (2-200 characters)
- `type` (optional): Type of suggestions (location, popular, default: location)

**Example Request:**
```http
GET /api/search/suggestions?query=New York&type=location
```

**Response:**
```json
{
  "success": true,
  "message": "Search suggestions retrieved successfully",
  "data": {
    "suggestions": [
      {
        "description": "New York, NY, USA",
        "placeId": "ChIJOwg_06VPwokRYv534QaPC8g"
      },
      {
        "description": "New York City Hall, New York, NY",
        "placeId": "ChIJKxjxuxlZwokRwA3JqJ8qQqE"
      }
    ],
    "query": "New York",
    "type": "location"
  }
}
```

**Popular Search Suggestions:**
```json
{
  "success": true,
  "message": "Search suggestions retrieved successfully",
  "data": {
    "suggestions": [
      {
        "description": "New York → Boston",
        "pickupLocation": "New York",
        "dropLocation": "Boston",
        "searchCount": 15
      },
      {
        "description": "New York → Philadelphia",
        "pickupLocation": "New York",
        "dropLocation": "Philadelphia",
        "searchCount": 8
      }
    ],
    "query": "New York",
    "type": "popular"
  }
}
```

## Usage Examples

### Frontend Integration

**Searching for Rides:**
```javascript
const searchRides = async (searchParams) => {
  const params = new URLSearchParams();
  Object.keys(searchParams).forEach(key => {
    if (searchParams[key] !== undefined && searchParams[key] !== null) {
      params.append(key, searchParams[key]);
    }
  });
  
  const response = await fetch(`/api/rides/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

// Example usage
const searchResults = await searchRides({
  pickupLocation: 'New York',
  dropLocation: 'Boston',
  passengers: 2,
  maxPrice: 50,
  sortBy: 'price',
  sortOrder: 'asc'
});
```

**Filtering Rides:**
```javascript
const filterRides = async (filterParams) => {
  const params = new URLSearchParams();
  Object.keys(filterParams).forEach(key => {
    if (filterParams[key] !== undefined && filterParams[key] !== null) {
      params.append(key, filterParams[key]);
    }
  });
  
  const response = await fetch(`/api/rides/filter?${params}`);
  return await response.json();
};

// Example usage
const filterResults = await filterRides({
  priceMin: 20,
  priceMax: 100,
  vehicleType: 'Sedan',
  sortBy: 'price',
  sortOrder: 'asc'
});
```

**Managing Search History:**
```javascript
const getSearchHistory = async (page = 1) => {
  const response = await fetch(`/api/search/history?page=${page}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};

const saveSearchHistory = async (pickupLocation, dropLocation) => {
  const response = await fetch('/api/search/history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ pickupLocation, dropLocation })
  });
  
  return await response.json();
};

const deleteSearchHistory = async (searchId) => {
  const response = await fetch(`/api/search/history/${searchId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
};
```

**Getting Search Suggestions:**
```javascript
const getSearchSuggestions = async (query, type = 'location') => {
  const response = await fetch(`/api/search/suggestions?query=${encodeURIComponent(query)}&type=${type}`);
  return await response.json();
};

// Example usage
const suggestions = await getSearchSuggestions('New York', 'location');
```

## Best Practices

1. **Validation**: Always validate input data before sending to the API
2. **Error Handling**: Implement proper error handling for all API calls
3. **Authentication**: Ensure JWT tokens are valid and not expired
4. **Rate Limiting**: Respect API rate limits
5. **Caching**: Cache ride data when appropriate to reduce API calls
6. **Status Management**: Use appropriate ride statuses for different stages
7. **Location Validation**: Validate coordinates before sending to API
8. **Search Optimization**: Use appropriate filters to reduce result sets
9. **Pagination**: Implement pagination for large result sets
10. **Search History**: Save relevant searches to improve user experience

## Dependencies

- JWT Authentication
- Vehicle Management System
- Location Services
- Google Places API (for search suggestions)
- Database (MySQL)

## Configuration

The following environment variables are required:
- `JWT_SECRET`: Secret key for JWT token generation
- `DATABASE_URL`: MySQL database connection string
- `GOOGLE_MAPS_API_KEY`: Google Maps API key for location services
- `GOOGLE_PLACES_API_KEY`: Google Places API key for search suggestions 