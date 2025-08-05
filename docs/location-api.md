# Location and Mapping API Documentation

This document describes the Location and Mapping API endpoints for the Mate ride-sharing platform. These endpoints provide location search, geocoding, distance calculation, route planning, and location validation functionality using Google Maps APIs.

## Base URL

```
https://api.mate.com/api/location
```

## Authentication

Most location endpoints are public and do not require authentication. However, some endpoints may require authentication for rate limiting or user-specific features.

## Endpoints

### 1. Search Locations

Search for locations using Google Places API with autocomplete functionality.

**Endpoint:** `GET /api/location/search`

**Query Parameters:**
- `query` (required): Search query string (minimum 2 characters)
- `types` (optional): Type of place to search for
  - `geocode` (default): Addresses and geographic locations
  - `address`: Addresses only
  - `establishment`: Business establishments
  - `regions`: Administrative regions
  - `cities`: Cities only
- `location` (optional): Bias search to a specific location (format: "latitude,longitude")
- `radius` (optional): Search radius in meters (1000-50000, default: 50000)
- `language` (optional): Language code for results (default: "en")

**Example Request:**
```bash
GET /api/location/search?query=New York&types=cities&radius=25000
```

**Example Response:**
```json
{
  "success": true,
  "message": "Locations found successfully",
  "data": {
    "places": [
      {
        "id": "ChIJOwg_06VPwokRYv534QaPC8g",
        "description": "New York, NY, USA",
        "structuredFormatting": {
          "mainText": "New York",
          "secondaryText": "NY, USA"
        },
        "types": ["locality", "political", "geocode"],
        "matchedSubstrings": [
          {
            "length": 8,
            "offset": 0
          }
        ]
      }
    ],
    "total": 1,
    "query": "New York"
  }
}
```

### 2. Geocode Address

Convert an address to geographic coordinates or vice versa.

**Endpoint:** `GET /api/location/geocode`

**Query Parameters:**
- `address` (optional): Address to geocode
- `placeId` (optional): Google Place ID for more accurate results

**Note:** Either `address` or `placeId` must be provided.

**Example Request:**
```bash
GET /api/location/geocode?address=1600 Pennsylvania Avenue NW, Washington, DC
```

**Example Response:**
```json
{
  "success": true,
  "message": "Address geocoded successfully",
  "data": {
    "address": "1600 Pennsylvania Avenue NW, Washington, DC 20500, USA",
    "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "coordinates": {
      "latitude": 38.8976633,
      "longitude": -77.0365739
    },
    "components": [
      {
        "longName": "1600",
        "shortName": "1600",
        "types": ["street_number"]
      },
      {
        "longName": "Pennsylvania Avenue Northwest",
        "shortName": "Pennsylvania Avenue NW",
        "types": ["route"]
      }
    ]
  }
}
```

### 3. Calculate Distance

Calculate the distance and travel time between two locations.

**Endpoint:** `GET /api/location/distance`

**Query Parameters:**
- `origin` (required): Starting location (address or coordinates)
- `destination` (required): Ending location (address or coordinates)
- `mode` (optional): Travel mode
  - `driving` (default): Car travel
  - `walking`: Walking
  - `bicycling`: Bicycle travel
  - `transit`: Public transit
- `units` (optional): Distance units
  - `metric` (default): Kilometers and meters
  - `imperial`: Miles and feet

**Example Request:**
```bash
GET /api/location/distance?origin=New York, NY&destination=Los Angeles, CA&mode=driving&units=metric
```

**Example Response:**
```json
{
  "success": true,
  "message": "Distance calculated successfully",
  "data": {
    "origin": "New York, NY, USA",
    "destination": "Los Angeles, CA, USA",
    "distance": {
      "text": "4,501 km",
      "value": 4501000
    },
    "duration": {
      "text": "1 day 9 hours",
      "value": 119400
    },
    "mode": "driving",
    "units": "metric"
  }
}
```

### 4. Get Route

Get detailed route information between two locations with turn-by-turn directions.

**Endpoint:** `GET /api/location/route`

**Query Parameters:**
- `origin` (required): Starting location
- `destination` (required): Ending location
- `waypoints` (optional): Intermediate stops (can be array or pipe-separated string)
- `mode` (optional): Travel mode (same as distance endpoint)
- `avoid` (optional): Features to avoid (array)
  - `tolls`: Avoid toll roads
  - `highways`: Avoid highways
  - `ferries`: Avoid ferries
- `units` (optional): Distance units (same as distance endpoint)
- `alternatives` (optional): Return alternative routes (boolean, default: false)

**Example Request:**
```bash
GET /api/location/route?origin=New York, NY&destination=Boston, MA&mode=driving&alternatives=true
```

**Example Response:**
```json
{
  "success": true,
  "message": "Route information retrieved successfully",
  "data": {
    "routes": [
      {
        "routeId": "abc123...",
        "summary": "I-95 N",
        "distance": {
          "text": "306 km",
          "value": 306000
        },
        "duration": {
          "text": "3 hours 15 mins",
          "value": 11700
        },
        "startLocation": {
          "address": "New York, NY, USA",
          "coordinates": {
            "latitude": 40.7128,
            "longitude": -74.0060
          }
        },
        "endLocation": {
          "address": "Boston, MA, USA",
          "coordinates": {
            "latitude": 42.3601,
            "longitude": -71.0589
          }
        },
        "steps": [
          {
            "instruction": "Head <b>north</b> on <b>Broadway</b>",
            "distance": {
              "text": "0.2 km",
              "value": 200
            },
            "duration": {
              "text": "1 min",
              "value": 60
            },
            "travelMode": "DRIVING",
            "maneuver": "turn-slight-right"
          }
        ],
        "polyline": "abc123...",
        "warnings": [],
        "fare": null
      }
    ],
    "total": 1,
    "origin": "New York, NY, USA",
    "destination": "Boston, MA, USA",
    "mode": "driving",
    "units": "metric"
  }
}
```

### 5. Validate Location

Validate location coordinates or addresses.

**Endpoint:** `POST /api/location/validate`

**Request Body:**
```json
{
  "latitude": 40.7128,    // Optional: Latitude coordinate
  "longitude": -74.0060,  // Optional: Longitude coordinate
  "address": "New York, NY" // Optional: Address to validate
}
```

**Note:** Either coordinates (`latitude` and `longitude`) or `address` must be provided.

**Example Request:**
```bash
POST /api/location/validate
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Location coordinates are valid",
  "data": {
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "isValid": true
  }
}
```

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "field": "query",
      "message": "Search query must be at least 2 characters long"
    }
  ]
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "No results found for the provided address"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Google Maps API error: REQUEST_DENIED"
}
```

## Rate Limiting

Location API endpoints are subject to rate limiting:
- 100 requests per 15 minutes per IP address
- Additional limits may apply based on Google Maps API quotas

## Caching

Location API responses are cached for 5 minutes to improve performance and reduce API costs. Cache keys are based on request parameters.

## Usage Examples

### Frontend Integration

**Location Search with Autocomplete:**
```javascript
// Search for locations as user types
const searchLocations = async (query) => {
  const response = await fetch(`/api/location/search?query=${encodeURIComponent(query)}`);
  const data = await response.json();
  return data.data.places;
};

// Use in autocomplete component
const handleInputChange = async (value) => {
  if (value.length >= 2) {
    const places = await searchLocations(value);
    setSuggestions(places);
  }
};
```

**Geocoding for Ride Creation:**
```javascript
// Geocode pickup and dropoff addresses
const createRide = async (pickupAddress, dropoffAddress) => {
  // Geocode pickup location
  const pickupResponse = await fetch(`/api/location/geocode?address=${encodeURIComponent(pickupAddress)}`);
  const pickupData = await pickupResponse.json();
  
  // Geocode dropoff location
  const dropoffResponse = await fetch(`/api/location/geocode?address=${encodeURIComponent(dropoffAddress)}`);
  const dropoffData = await dropoffResponse.json();
  
  // Calculate distance and duration
  const distanceResponse = await fetch(`/api/location/distance?origin=${pickupData.data.coordinates.latitude},${pickupData.data.coordinates.longitude}&destination=${dropoffData.data.coordinates.latitude},${dropoffData.data.coordinates.longitude}`);
  const distanceData = await distanceResponse.json();
  
  return {
    pickup: pickupData.data,
    dropoff: dropoffData.data,
    distance: distanceData.data
  };
};
```

**Route Planning:**
```javascript
// Get detailed route for navigation
const getRoute = async (origin, destination) => {
  const response = await fetch(`/api/location/route?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=driving`);
  const data = await response.json();
  return data.data.routes[0];
};
```

## Best Practices

1. **Use Place IDs for Accuracy:** When possible, use Place IDs from search results for more accurate geocoding.

2. **Implement Caching:** Cache frequently requested locations on the client side to reduce API calls.

3. **Handle Errors Gracefully:** Always handle API errors and provide fallback options for users.

4. **Validate Input:** Validate user input before sending to the API to reduce unnecessary requests.

5. **Monitor Usage:** Monitor API usage to stay within Google Maps API quotas and optimize costs.

## Dependencies

- Google Maps JavaScript API
- Google Places API
- Google Geocoding API
- Google Distance Matrix API
- Google Directions API

## Configuration

The following environment variables are required:
- `GOOGLE_MAPS_API_KEY`: Your Google Maps API key with the necessary services enabled 