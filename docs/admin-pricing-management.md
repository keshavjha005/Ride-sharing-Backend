# Admin Pricing Management System

## Overview

The Admin Pricing Management System provides comprehensive control over all pricing aspects of the Mate ride-sharing platform. This system allows admin and super admin users to manage vehicle type pricing, dynamic multipliers, pricing events, and view detailed analytics.

## Features

### 🎯 Core Features
- **Vehicle Type Pricing Management**: Set and update per-kilometer rates, minimum/maximum fares
- **Dynamic Multipliers**: Create and manage pricing multipliers for peak hours, weekends, holidays, etc.
- **Pricing Events**: Manage seasonal events, holidays, and special pricing periods
- **Real-time Analytics**: Comprehensive pricing analytics and revenue tracking
- **Bulk Operations**: Super admin can perform bulk updates across multiple pricing settings
- **Data Export**: Export pricing data in JSON format for analysis

### 🔐 Access Control
- **Admin Access**: Full access to view and modify pricing settings
- **Super Admin Access**: Additional bulk operations and advanced features
- **Role-based Permissions**: Granular permission control for different pricing operations

## API Endpoints

### Dashboard & Analytics

#### GET /api/admin/pricing/dashboard
Get comprehensive pricing dashboard data including overview metrics, vehicle types, recent calculations, and active events.

**Query Parameters:**
- `period` (string): Analytics period (7d, 30d, 90d) - Default: 7d

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRevenue": 12500.50,
      "averageFare": 25.75,
      "totalCalculations": 485,
      "activeMultipliers": 8,
      "activeEvents": 3
    },
    "vehicleTypes": [...],
    "recentCalculations": [...],
    "activeEvents": [...],
    "multiplierStats": {
      "total": 8,
      "byType": {
        "peak_hour": 3,
        "weekend": 2,
        "holiday": 1,
        "weather": 1,
        "demand": 1
      }
    }
  }
}
```

#### GET /api/admin/pricing/analytics
Get detailed pricing analytics with various filtering options.

**Query Parameters:**
- `period` (string): Analytics period (7d, 30d, 90d) - Default: 30d
- `vehicleTypeId` (string): Filter by specific vehicle type
- `eventId` (string): Filter by specific event
- `type` (string): Analytics type (overview, events, multipliers, revenue) - Default: overview

### Vehicle Type Management

#### GET /api/admin/pricing/vehicle-types
Get all vehicle types with their pricing information.

**Query Parameters:**
- `activeOnly` (boolean): Return only active vehicle types - Default: true
- `search` (string): Search by vehicle type name or description

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Sedan",
      "description": "Standard sedan vehicle",
      "per_km_charges": 2.50,
      "minimum_fare": 5.00,
      "maximum_fare": 100.00,
      "is_active": true,
      "multiplier_count": 2
    }
  ]
}
```

#### PUT /api/admin/pricing/vehicle-types/:id
Update pricing for a specific vehicle type.

**Request Body:**
```json
{
  "per_km_charges": 2.75,
  "minimum_fare": 5.50,
  "maximum_fare": 110.00,
  "is_active": true
}
```

### Multiplier Management

#### GET /api/admin/pricing/multipliers
Get pricing multipliers with filtering and pagination.

**Query Parameters:**
- `vehicleTypeId` (string): Filter by vehicle type
- `multiplierType` (string): Filter by multiplier type
- `activeOnly` (boolean): Return only active multipliers - Default: true
- `page` (number): Page number - Default: 1
- `limit` (number): Items per page - Default: 20

**Response:**
```json
{
  "success": true,
  "data": {
    "multipliers": [
      {
        "id": "uuid",
        "vehicle_type_id": "uuid",
        "multiplier_type": "peak_hour",
        "multiplier_value": 1.25,
        "is_active": true,
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "totalPages": 1
    }
  }
}
```

#### POST /api/admin/pricing/multipliers
Create a new pricing multiplier.

**Request Body:**
```json
{
  "vehicle_type_id": "uuid",
  "multiplier_type": "peak_hour",
  "multiplier_value": 1.25,
  "is_active": true
}
```

**Multiplier Types:**
- `peak_hour`: Peak hour pricing (7-9 AM, 5-7 PM)
- `weekend`: Weekend pricing (Saturday, Sunday)
- `holiday`: Holiday pricing
- `weather`: Weather-based pricing
- `demand`: Demand-based pricing

#### PUT /api/admin/pricing/multipliers/:id
Update an existing pricing multiplier.

#### DELETE /api/admin/pricing/multipliers/:id
Delete a pricing multiplier.

### Event Management

#### GET /api/admin/pricing/events
Get pricing events with filtering and pagination.

**Query Parameters:**
- `activeOnly` (boolean): Return only active events - Default: true
- `eventType` (string): Filter by event type
- `page` (number): Page number - Default: 1
- `limit` (number): Items per page - Default: 20
- `search` (string): Search by event name

**Event Types:**
- `seasonal`: Seasonal pricing adjustments
- `holiday`: Holiday pricing
- `special_event`: Special events (concerts, sports, etc.)
- `demand_surge`: High demand periods

#### POST /api/admin/pricing/events
Create a new pricing event.

**Request Body:**
```json
{
  "event_name": "New Year Surge",
  "event_type": "special_event",
  "start_date": "2024-12-31T18:00:00Z",
  "end_date": "2025-01-01T06:00:00Z",
  "pricing_multiplier": 2.5,
  "affected_vehicle_types": ["all"],
  "affected_areas": ["downtown", "midtown"],
  "description": "Premium pricing for New Year celebrations",
  "is_active": true
}
```

#### PUT /api/admin/pricing/events/:id
Update an existing pricing event.

#### DELETE /api/admin/pricing/events/:id
Delete a pricing event.

### Bulk Operations (Super Admin Only)

#### POST /api/admin/pricing/bulk-update
Perform bulk updates on pricing settings.

**Request Body:**
```json
{
  "vehicleTypes": [
    {
      "id": "uuid",
      "per_km_charges": 2.75,
      "minimum_fare": 5.50
    }
  ],
  "multipliers": [
    {
      "id": "uuid",
      "multiplier_value": 1.30
    }
  ],
  "events": [
    {
      "id": "uuid",
      "pricing_multiplier": 2.0
    }
  ],
  "operation": "update"
}
```

**Operations:**
- `update`: Update existing items
- `delete`: Delete items

### Data Export

#### GET /api/admin/pricing/export
Export pricing data in various formats.

**Query Parameters:**
- `type` (string): Data type to export (all, vehicle-types, multipliers, events, calculations) - Default: all
- `format` (string): Export format (json, csv) - Default: json
- `dateFrom` (string): Start date for calculations export
- `dateTo` (string): End date for calculations export

## Frontend Interface

### Dashboard Tab
- **Overview Cards**: Total revenue, average fare, total calculations, active multipliers, active events
- **Vehicle Types Overview**: Grid view of all vehicle types with pricing
- **Recent Calculations**: Latest fare calculations with details
- **Active Events**: Currently active pricing events

### Vehicle Types Tab
- **Search & Filter**: Search vehicle types, toggle active/inactive
- **Pricing Management**: Edit per-kilometer rates, minimum/maximum fares
- **Status Management**: Enable/disable vehicle types

### Multipliers Tab
- **Multiplier Creation**: Add new multipliers with type and value
- **Filtering**: Filter by vehicle type and multiplier type
- **Management**: Edit and delete existing multipliers

### Events Tab
- **Event Creation**: Create new pricing events with date ranges
- **Event Types**: Seasonal, holiday, special events, demand surge
- **Management**: Edit and delete existing events

### Analytics Tab
- **Period Selection**: 7 days, 30 days, 90 days
- **Revenue Analytics**: Total revenue, average fare, calculations
- **Multiplier Usage**: Usage statistics by multiplier type

## Usage Examples

### Setting Up Peak Hour Pricing

1. **Navigate to Multipliers Tab**
2. **Click "Add Multiplier"**
3. **Configure:**
   - Vehicle Type: Sedan
   - Multiplier Type: Peak Hour
   - Multiplier Value: 1.25 (25% increase)
   - Active: Yes

### Creating a Holiday Event

1. **Navigate to Events Tab**
2. **Click "Add Event"**
3. **Configure:**
   - Event Name: Christmas Surge
   - Event Type: Holiday
   - Start Date: 2024-12-24 18:00
   - End Date: 2024-12-25 06:00
   - Multiplier: 2.0 (100% increase)
   - Affected Areas: All
   - Description: Christmas holiday pricing

### Bulk Price Update

1. **Navigate to Analytics Tab**
2. **Select period for analysis**
3. **Review current pricing performance**
4. **Use bulk update (Super Admin only) to adjust multiple vehicle types**

## Security Features

### Authentication
- All endpoints require valid JWT authentication
- Token validation on every request
- Automatic token refresh handling

### Authorization
- Role-based access control
- Super admin permissions for bulk operations
- Granular permission checking

### Data Validation
- Input validation for all endpoints
- SQL injection prevention
- XSS protection
- UUID validation for all IDs

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation errors",
  "errors": [
    {
      "field": "per_km_charges",
      "message": "Per km charges must be a positive number"
    }
  ]
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Vehicle type not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to update vehicle type pricing",
  "error": "Database connection error"
}
```

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried columns
- Efficient query design with JOINs
- Pagination for large datasets

### Caching Strategy
- Redis caching for frequently accessed data
- Cache invalidation on pricing updates
- Performance monitoring and alerts

### Scalability
- Stateless API design
- Horizontal scaling support
- Load balancing ready

## Monitoring & Analytics

### Key Metrics
- **Revenue Impact**: Track revenue changes from pricing adjustments
- **User Behavior**: Monitor booking patterns with different pricing
- **System Performance**: API response times and error rates
- **Multiplier Usage**: Which multipliers are most effective

### Alerts
- **Pricing Anomalies**: Unusual fare calculations
- **Revenue Drops**: Significant revenue decreases
- **System Errors**: API failures and database issues

## Best Practices

### Pricing Strategy
1. **Start Conservative**: Begin with smaller multiplier values
2. **Monitor Impact**: Track revenue and user behavior changes
3. **A/B Testing**: Test different pricing strategies
4. **Seasonal Planning**: Plan events well in advance
5. **Competitive Analysis**: Monitor competitor pricing

### System Management
1. **Regular Backups**: Export pricing data regularly
2. **Version Control**: Track pricing changes over time
3. **Documentation**: Document pricing decisions and rationale
4. **Testing**: Test pricing changes in staging environment
5. **Rollback Plan**: Have contingency plans for pricing issues

## Troubleshooting

### Common Issues

**Pricing Not Updating:**
- Check if vehicle type is active
- Verify multiplier is active and applicable
- Check event date ranges
- Review calculation logs

**Revenue Anomalies:**
- Check for conflicting multipliers
- Verify event date ranges
- Review recent pricing changes
- Check for system errors

**Performance Issues:**
- Monitor database query performance
- Check cache hit rates
- Review API response times
- Monitor server resources

### Support Contacts
- **Technical Issues**: Backend team
- **Pricing Strategy**: Business team
- **User Complaints**: Customer support
- **System Outages**: DevOps team

## Future Enhancements

### Planned Features
- **Machine Learning**: Predictive pricing based on historical data
- **Real-time Adjustments**: Dynamic pricing based on demand
- **Advanced Analytics**: More detailed revenue and user analytics
- **Mobile App Integration**: Real-time pricing updates
- **API Integrations**: Weather and event APIs for automatic pricing

### Roadmap
- **Q1 2024**: Machine learning integration
- **Q2 2024**: Advanced analytics dashboard
- **Q3 2024**: Real-time pricing adjustments
- **Q4 2024**: Mobile app pricing management

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintainer**: Backend Team 