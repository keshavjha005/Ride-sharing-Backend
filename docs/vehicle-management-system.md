# Vehicle Management System

## Overview

The Vehicle Management System provides comprehensive admin capabilities to manage vehicle types, brands, models, and user vehicles within the Mate ride-sharing platform. This system follows the design tokens and provides a consistent user experience.

## Features

### 🚗 Vehicle Types Management
- Create, edit, delete, and view vehicle types
- Set pricing information (per km charges, minimum/maximum fares)
- Enable/disable vehicle types
- Bulk operations support
- Search and filtering capabilities

### 🏢 Vehicle Brands Management
- Manage vehicle brands with logos
- Create, edit, delete, and view brands
- Logo URL validation and preview
- Status management (active/inactive)

### 🚙 Vehicle Models Management
- Manage vehicle models for each brand
- Hierarchical relationship with brands
- Full CRUD operations
- Search and filtering

### 👥 User Vehicles Management
- View all user vehicle registrations
- Verify user vehicles
- Update vehicle information (admin override)
- Bulk verification operations
- Advanced filtering and search

### 📊 Analytics & Reporting
- Vehicle usage statistics
- Popular brands and models
- Verification trends
- Performance metrics

## Backend API

### Base URL
```
/api/admin/vehicles
```

### Authentication
All endpoints require admin authentication using JWT tokens.

### Vehicle Types API

#### Get Vehicle Types
```http
GET /api/admin/vehicles/types
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search term for name/description
- `activeOnly` (boolean): Filter by active status (default: true)
- `sortBy` (string): Sort field (name, per_km_charges, minimum_fare, created_at)
- `sortOrder` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicleTypes": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  },
  "message": "Vehicle types retrieved successfully"
}
```

#### Get Vehicle Type by ID
```http
GET /api/admin/vehicles/types/:id
```

#### Create Vehicle Type
```http
POST /api/admin/vehicles/types
```

**Request Body:**
```json
{
  "name": "Sedan",
  "description": "Standard sedan vehicle",
  "per_km_charges": 2.50,
  "minimum_fare": 5.00,
  "maximum_fare": 100.00,
  "is_active": true
}
```

#### Update Vehicle Type
```http
PUT /api/admin/vehicles/types/:id
```

#### Delete Vehicle Type
```http
DELETE /api/admin/vehicles/types/:id
```

### Vehicle Brands API

#### Get Vehicle Brands
```http
GET /api/admin/vehicles/brands
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `search` (string): Search term for brand name
- `activeOnly` (boolean): Filter by active status
- `sortBy` (string): Sort field (name, created_at)
- `sortOrder` (string): Sort order (asc, desc)

#### Create Vehicle Brand
```http
POST /api/admin/vehicles/brands
```

**Request Body:**
```json
{
  "name": "Toyota",
  "logo": "https://example.com/toyota-logo.png",
  "is_active": true
}
```

#### Update Vehicle Brand
```http
PUT /api/admin/vehicles/brands/:id
```

#### Delete Vehicle Brand
```http
DELETE /api/admin/vehicles/brands/:id
```

### Vehicle Models API

#### Get Vehicle Models
```http
GET /api/admin/vehicles/models
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `search` (string): Search term for model/brand name
- `brandId` (string): Filter by brand ID
- `activeOnly` (boolean): Filter by active status
- `sortBy` (string): Sort field (name, brand_name, created_at)
- `sortOrder` (string): Sort order (asc, desc)

#### Create Vehicle Model
```http
POST /api/admin/vehicles/models
```

**Request Body:**
```json
{
  "brand_id": "uuid",
  "name": "Camry",
  "is_active": true
}
```

#### Update Vehicle Model
```http
PUT /api/admin/vehicles/models/:id
```

#### Delete Vehicle Model
```http
DELETE /api/admin/vehicles/models/:id
```

### User Vehicles API

#### Get User Vehicles
```http
GET /api/admin/vehicles/user-vehicles
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `search` (string): Search term for vehicle/user info
- `userId` (string): Filter by user ID
- `vehicleTypeId` (string): Filter by vehicle type ID
- `brandId` (string): Filter by brand ID
- `verified` (boolean): Filter by verification status
- `activeOnly` (boolean): Filter by active status
- `sortBy` (string): Sort field (created_at, vehicle_number, user_name)
- `sortOrder` (string): Sort order (asc, desc)

#### Get User Vehicle by ID
```http
GET /api/admin/vehicles/user-vehicles/:id
```

#### Update User Vehicle
```http
PUT /api/admin/vehicles/user-vehicles/:id
```

#### Verify User Vehicle
```http
POST /api/admin/vehicles/user-vehicles/:id/verify
```

#### Delete User Vehicle
```http
DELETE /api/admin/vehicles/user-vehicles/:id
```

### Analytics API

#### Get Vehicle Analytics
```http
GET /api/admin/vehicles/analytics
```

**Query Parameters:**
- `period` (string): Analytics period (7d, 30d, 90d)
- `type` (string): Analytics type (overview, types, brands, user-vehicles)

### Bulk Operations API

#### Bulk Update Vehicle Types
```http
POST /api/admin/vehicles/bulk-update-types
```

**Request Body:**
```json
{
  "vehicleTypes": [
    {
      "id": "uuid",
      "name": "Updated Name",
      "per_km_charges": 3.00
    }
  ],
  "operation": "update"
}
```

#### Bulk Verify User Vehicles
```http
POST /api/admin/vehicles/bulk-verify
```

**Request Body:**
```json
{
  "vehicleIds": ["uuid1", "uuid2", "uuid3"]
}
```

## Frontend Components

### Main Vehicle Management Page
**File:** `frontend/src/pages/admin/VehicleManagement.jsx`

The main vehicle management page provides:
- Analytics overview cards
- Tabbed interface for different vehicle management sections
- Real-time data updates

### Vehicle Types Management
**File:** `frontend/src/pages/admin/vehicle/VehicleTypesManagement.jsx`

Features:
- Data table with pagination
- Search and filtering
- Bulk operations
- CRUD operations via modal
- Real-time updates

### Vehicle Brands Management
**File:** `frontend/src/pages/admin/vehicle/VehicleBrandsManagement.jsx`

Features:
- Brand listing with logos
- Logo preview functionality
- Search and filtering
- CRUD operations

### Modal Components

#### Vehicle Type Modal
**File:** `frontend/src/pages/admin/vehicle/modals/VehicleTypeModal.jsx`

Features:
- Create/Edit/View modes
- Form validation
- Pricing information management
- Status toggle

#### Vehicle Brand Modal
**File:** `frontend/src/pages/admin/vehicle/modals/VehicleBrandModal.jsx`

Features:
- Create/Edit/View modes
- Logo URL validation
- Logo preview
- Status management

## Database Schema

### Vehicle Types Table
```sql
CREATE TABLE vehicle_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    per_km_charges DECIMAL(10,2) DEFAULT 0.00,
    minimum_fare DECIMAL(10,2) DEFAULT 0.00,
    maximum_fare DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Vehicle Brands Table
```sql
CREATE TABLE vehicle_brands (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Vehicle Models Table
```sql
CREATE TABLE vehicle_models (
    id VARCHAR(36) PRIMARY KEY,
    brand_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES vehicle_brands(id)
);
```

### User Vehicle Information Table
```sql
CREATE TABLE user_vehicle_information (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    vehicle_type_id VARCHAR(36),
    vehicle_brand_id VARCHAR(36),
    vehicle_model_id VARCHAR(36),
    vehicle_number VARCHAR(50) NOT NULL,
    vehicle_color VARCHAR(50),
    vehicle_year INT,
    vehicle_image VARCHAR(500),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id),
    FOREIGN KEY (vehicle_brand_id) REFERENCES vehicle_brands(id),
    FOREIGN KEY (vehicle_model_id) REFERENCES vehicle_models(id)
);
```

## Usage Instructions

### For Administrators

1. **Access Vehicle Management**
   - Navigate to Admin Panel
   - Click on "Vehicle Management" in the sidebar

2. **Manage Vehicle Types**
   - Go to "Types" tab
   - Use search and filters to find specific types
   - Click "Add Type" to create new vehicle types
   - Use action buttons to view, edit, or delete types
   - Set pricing information for each type

3. **Manage Vehicle Brands**
   - Go to "Brands" tab
   - Add new brands with logos
   - Update brand information as needed
   - Enable/disable brands

4. **Manage Vehicle Models**
   - Go to "Models" tab
   - Create models for specific brands
   - Organize models hierarchically

5. **Manage User Vehicles**
   - Go to "User Vehicles" tab
   - View all user vehicle registrations
   - Verify vehicles that meet requirements
   - Update vehicle information if needed
   - Use bulk operations for efficiency

6. **View Analytics**
   - Go to "Analytics" tab
   - Review vehicle usage statistics
   - Monitor verification trends
   - Track performance metrics

### For Super Administrators

Super administrators have additional capabilities:
- Bulk operations on vehicle types
- System-wide vehicle management
- Advanced analytics access
- Configuration management

## Design Tokens Integration

The vehicle management system follows the established design tokens:

### Colors
- Primary: `#FD7A00` (Orange)
- Background: `#1E1F25` (Dark)
- Text: `#FFFFFF` (White)
- Secondary Text: `#B0B3BD` (Gray)
- Borders: `#3E3F47` (Dark Gray)

### Typography
- Font Family: Inter, sans-serif
- Font Sizes: 12px to 32px
- Font Weights: 400, 500, 600, 700

### Spacing
- Consistent spacing using design token values
- Responsive grid layouts
- Proper component spacing

### Components
- Cards with consistent styling
- Buttons with proper variants
- Form inputs with validation states
- Tables with hover effects
- Modals with proper z-index

## Security Considerations

1. **Authentication**
   - All endpoints require admin authentication
   - JWT token validation
   - Role-based access control

2. **Authorization**
   - Super admin privileges for bulk operations
   - Admin permissions for CRUD operations
   - User data protection

3. **Input Validation**
   - Server-side validation for all inputs
   - SQL injection prevention
   - XSS protection

4. **Data Protection**
   - Soft deletes for data integrity
   - Audit trails for changes
   - Secure API endpoints

## Performance Optimizations

1. **Database**
   - Proper indexing on frequently queried fields
   - Efficient JOIN operations
   - Pagination for large datasets

2. **Frontend**
   - Lazy loading of components
   - Debounced search inputs
   - Optimized re-renders
   - Caching strategies

3. **API**
   - Response caching where appropriate
   - Efficient query optimization
   - Rate limiting

## Error Handling

1. **Backend**
   - Comprehensive error logging
   - User-friendly error messages
   - Proper HTTP status codes
   - Validation error details

2. **Frontend**
   - Toast notifications for user feedback
   - Loading states for better UX
   - Error boundaries for component safety
   - Graceful degradation

## Testing

### Backend Testing
- Unit tests for all controllers
- Integration tests for API endpoints
- Database migration tests
- Validation tests

### Frontend Testing
- Component unit tests
- Integration tests for user flows
- E2E tests for critical paths
- Accessibility tests

## Future Enhancements

1. **Advanced Analytics**
   - Real-time vehicle tracking
   - Predictive analytics
   - Custom report generation

2. **Integration Features**
   - Third-party vehicle data APIs
   - Insurance verification integration
   - Document verification automation

3. **Mobile Support**
   - Mobile-responsive admin interface
   - Native mobile app integration
   - Push notifications

4. **AI/ML Features**
   - Automated vehicle verification
   - Fraud detection
   - Smart pricing recommendations

## Support and Maintenance

### Regular Maintenance
- Database optimization
- Performance monitoring
- Security updates
- Bug fixes and improvements

### Documentation Updates
- API documentation maintenance
- User guide updates
- Developer documentation
- Change logs

### Support Channels
- Technical support for administrators
- Developer support for integrations
- User feedback collection
- Issue tracking and resolution 