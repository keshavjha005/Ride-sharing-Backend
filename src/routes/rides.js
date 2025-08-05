const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const rideController = require('../controllers/rideController');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const validateRideCreation = [
  body('vehicleInformationId')
    .isUUID()
    .withMessage('Valid vehicle information ID is required'),
  
  body('totalSeats')
    .isInt({ min: 1, max: 10 })
    .withMessage('Total seats must be between 1 and 10'),
  
  body('pricePerSeat')
    .isFloat({ min: 0.01 })
    .withMessage('Price per seat must be greater than 0'),
  
  body('departureDateTime')
    .isISO8601()
    .withMessage('Valid departure date and time is required'),
  
  body('pickupLocation')
    .isObject()
    .withMessage('Pickup location is required'),
  
  body('pickupLocation.address')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Pickup address is required and must be less than 500 characters'),
  
  body('pickupLocation.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid pickup latitude is required (-90 to 90)'),
  
  body('pickupLocation.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid pickup longitude is required (-180 to 180)'),
  
  body('dropLocation')
    .isObject()
    .withMessage('Drop location is required'),
  
  body('dropLocation.address')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Drop address is required and must be less than 500 characters'),
  
  body('dropLocation.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid drop latitude is required (-90 to 90)'),
  
  body('dropLocation.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid drop longitude is required (-180 to 180)'),
  
  body('stopOvers')
    .optional()
    .isArray()
    .withMessage('Stopovers must be an array'),
  
  body('stopOvers.*.address')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Stopover address must be less than 500 characters'),
  
  body('stopOvers.*.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid stopover latitude is required (-90 to 90)'),
  
  body('stopOvers.*.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid stopover longitude is required (-180 to 180)'),
  
  body('stopOvers.*.sequenceOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sequence order must be a non-negative integer'),
  
  body('travelPreferences')
    .optional()
    .isObject()
    .withMessage('Travel preferences must be an object'),
  
  body('travelPreferences.chattiness')
    .optional()
    .isIn(['love_to_chat', 'chatty_when_comfortable', 'quiet_type'])
    .withMessage('Invalid chattiness preference'),
  
  body('travelPreferences.smoking')
    .optional()
    .isIn(['fine_with_smoking', 'breaks_outside_ok', 'no_smoking'])
    .withMessage('Invalid smoking preference'),
  
  body('travelPreferences.music')
    .optional()
    .isIn(['playlist_important', 'depends_on_mood', 'silence_golden'])
    .withMessage('Invalid music preference'),
  
  body('luggageAllowed')
    .optional()
    .isBoolean()
    .withMessage('Luggage allowed must be a boolean'),
  
  body('womenOnly')
    .optional()
    .isBoolean()
    .withMessage('Women only must be a boolean'),
  
  body('driverVerified')
    .optional()
    .isBoolean()
    .withMessage('Driver verified must be a boolean'),
  
  body('twoPassengerMaxBack')
    .optional()
    .isBoolean()
    .withMessage('Two passenger max back must be a boolean')
];

const validateRideUpdate = [
  param('id')
    .isUUID()
    .withMessage('Valid ride ID is required'),
  
  body('totalSeats')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Total seats must be between 1 and 10'),
  
  body('pricePerSeat')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price per seat must be greater than 0'),
  
  body('departureDateTime')
    .optional()
    .isISO8601()
    .withMessage('Valid departure date and time is required'),
  
  body('pickupLocation')
    .optional()
    .isObject()
    .withMessage('Pickup location must be an object'),
  
  body('dropLocation')
    .optional()
    .isObject()
    .withMessage('Drop location must be an object'),
  
  body('stopOvers')
    .optional()
    .isArray()
    .withMessage('Stopovers must be an array'),
  
  body('travelPreferences')
    .optional()
    .isObject()
    .withMessage('Travel preferences must be an object')
];

// Validation for ride status update
const validateRideStatusUpdate = [
  param('id')
    .isUUID()
    .withMessage('Valid ride ID is required'),
  
  body('status')
    .isIn(['draft', 'published', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Status must be one of: draft, published, in_progress, completed, cancelled')
];

// Validation for ride ID parameter
const validateRideIdParam = [
  param('id')
    .isUUID()
    .withMessage('Valid ride ID is required')
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['draft', 'published', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status filter')
];

// Search and filtering validation
const validateSearchParams = [
  query('pickupLocation')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Pickup location must be a string between 1 and 500 characters'),
  
  query('dropLocation')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Drop location must be a string between 1 and 500 characters'),
  
  query('departureDate')
    .optional()
    .isISO8601()
    .withMessage('Departure date must be a valid ISO 8601 date'),
  
  query('passengers')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Passengers must be between 1 and 10'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Max price must be greater than 0'),
  
  query('womenOnly')
    .optional()
    .isBoolean()
    .withMessage('Women only must be a boolean'),
  
  query('driverVerified')
    .optional()
    .isBoolean()
    .withMessage('Driver verified must be a boolean'),
  
  query('sortBy')
    .optional()
    .isIn(['price', 'departure_time', 'distance', 'created_at'])
    .withMessage('Sort by must be one of: price, departure_time, distance, created_at'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const validateFilterParams = [
  query('status')
    .optional()
    .isString()
    .withMessage('Status must be a string'),
  
  query('priceMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price min must be a non-negative number'),
  
  query('priceMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price max must be a non-negative number'),
  
  query('distanceMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Distance min must be a non-negative number'),
  
  query('distanceMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Distance max must be a non-negative number'),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO 8601 date'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO 8601 date'),
  
  query('vehicleType')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Vehicle type must be a string between 1 and 100 characters'),
  
  query('vehicleBrand')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Vehicle brand must be a string between 1 and 100 characters')
];

const validateSearchHistoryParams = [
  body('pickupLocation')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Pickup location must be a string between 1 and 500 characters'),
  
  body('dropLocation')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Drop location must be a string between 1 and 500 characters')
];

const validateSearchSuggestionsParams = [
  query('query')
    .isString()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Search query must be between 2 and 200 characters'),
  
  query('type')
    .optional()
    .isIn(['location', 'popular'])
    .withMessage('Type must be location or popular')
];

// Routes

/**
 * @swagger
 * /api/rides:
 *   post:
 *     summary: Create a new ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleInformationId
 *               - totalSeats
 *               - pricePerSeat
 *               - departureDateTime
 *               - pickupLocation
 *               - dropLocation
 *             properties:
 *               vehicleInformationId:
 *                 type: string
 *                 format: uuid
 *               totalSeats:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               pricePerSeat:
 *                 type: number
 *                 minimum: 0.01
 *               departureDateTime:
 *                 type: string
 *                 format: date-time
 *               pickupLocation:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               dropLocation:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *     responses:
 *       201:
 *         description: Ride created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticate, validateRideCreation, rideController.createRide);

/**
 * @swagger
 * /api/rides/my-rides:
 *   get:
 *     summary: Get user's rides
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, in_progress, completed, cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: User rides retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/my-rides', authenticate, validatePagination, rideController.getMyRides);

/**
 * @swagger
 * /api/rides/{id}:
 *   get:
 *     summary: Get ride details by ID
 *     tags: [Rides]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ride details retrieved successfully
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', validateRideIdParam, rideController.getRideById);

/**
 * @swagger
 * /api/rides/{id}:
 *   put:
 *     summary: Update ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Ride updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticate, validateRideUpdate, rideController.updateRide);

/**
 * @swagger
 * /api/rides/{id}:
 *   delete:
 *     summary: Cancel ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ride cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticate, validateRideIdParam, rideController.deleteRide);

/**
 * @swagger
 * /api/rides/{id}/publish:
 *   post:
 *     summary: Publish ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ride published successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/publish', authenticate, validateRideIdParam, rideController.publishRide);

/**
 * @swagger
 * /api/rides/{id}/unpublish:
 *   post:
 *     summary: Unpublish ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ride unpublished successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/unpublish', authenticate, validateRideIdParam, rideController.unpublishRide);

/**
 * @swagger
 * /api/rides/{id}/available-seats:
 *   get:
 *     summary: Get available seats for a ride
 *     tags: [Rides]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Available seats retrieved successfully
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/available-seats', validateRideIdParam, rideController.getAvailableSeats);

/**
 * @swagger
 * /api/rides/{id}/status:
 *   put:
 *     tags: [Rides]
 *     summary: Update ride status
 *     description: Update the status of a ride (draft, published, in_progress, completed, cancelled)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ride ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, published, in_progress, completed, cancelled]
 *                 description: New ride status
 *     responses:
 *       200:
 *         description: Ride status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ride status updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ride:
 *                       $ref: '#/components/schemas/Ride'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to update this ride
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/status', authenticate, validateRideStatusUpdate, rideController.updateRideStatus);

/**
 * @swagger
 * /api/rides/{id}/complete:
 *   post:
 *     tags: [Rides]
 *     summary: Complete ride
 *     description: Mark a ride as completed and update statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ride ID
 *     responses:
 *       200:
 *         description: Ride completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ride completed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ride:
 *                       $ref: '#/components/schemas/Ride'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to complete this ride
 *       404:
 *         description: Ride not found
 *       409:
 *         description: Conflict - Ride is already completed or cancelled
 *       500:
 *         description: Internal server error
 */
router.post('/:id/complete', authenticate, validateRideIdParam, rideController.completeRide);

/**
 * @swagger
 * /api/rides/{id}/statistics:
 *   get:
 *     tags: [Rides]
 *     summary: Get ride statistics
 *     description: Get detailed statistics for a specific ride
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ride ID
 *     responses:
 *       200:
 *         description: Ride statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ride statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalBookings:
 *                           type: integer
 *                           description: Total number of bookings
 *                           example: 3
 *                         totalRevenue:
 *                           type: number
 *                           format: float
 *                           description: Total revenue from bookings
 *                           example: 75.00
 *                         averageRating:
 *                           type: number
 *                           format: float
 *                           description: Average rating for the ride
 *                           example: 4.5
 *                         totalRatings:
 *                           type: integer
 *                           description: Total number of ratings
 *                           example: 2
 *                         totalSeats:
 *                           type: integer
 *                           description: Total seats in the ride
 *                           example: 4
 *                         bookedSeats:
 *                           type: integer
 *                           description: Number of booked seats
 *                           example: 3
 *                         availableSeats:
 *                           type: integer
 *                           description: Number of available seats
 *                           example: 1
 *                         occupancyRate:
 *                           type: number
 *                           format: float
 *                           description: Seat occupancy percentage
 *                           example: 75.0
 *                         status:
 *                           type: string
 *                           description: Current ride status
 *                           example: "completed"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: Ride creation date
 *                         departureDateTime:
 *                           type: string
 *                           format: date-time
 *                           description: Ride departure date and time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this ride's statistics
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/statistics', authenticate, validateRideIdParam, rideController.getRideStatistics);

/**
 * @swagger
 * /api/rides/my-statistics:
 *   get:
 *     tags: [Rides]
 *     summary: Get user ride statistics
 *     description: Get comprehensive statistics for all rides created by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User ride statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User ride statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalRides:
 *                           type: integer
 *                           description: Total number of rides created
 *                           example: 10
 *                         completedRides:
 *                           type: integer
 *                           description: Number of completed rides
 *                           example: 8
 *                         cancelledRides:
 *                           type: integer
 *                           description: Number of cancelled rides
 *                           example: 1
 *                         activeRides:
 *                           type: integer
 *                           description: Number of active rides
 *                           example: 1
 *                         totalSeatsOffered:
 *                           type: integer
 *                           description: Total seats offered across all rides
 *                           example: 40
 *                         totalSeatsBooked:
 *                           type: integer
 *                           description: Total seats booked across all rides
 *                           example: 32
 *                         averagePricePerSeat:
 *                           type: number
 *                           format: float
 *                           description: Average price per seat
 *                           example: 25.50
 *                         totalRevenue:
 *                           type: number
 *                           format: float
 *                           description: Total revenue from all rides
 *                           example: 816.00
 *                         completionRate:
 *                           type: integer
 *                           description: Percentage of completed rides
 *                           example: 80
 *                         occupancyRate:
 *                           type: integer
 *                           description: Average seat occupancy percentage
 *                           example: 80
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/my-statistics', authenticate, rideController.getUserRideStatistics);

/**
 * @swagger
 * /api/rides/search:
 *   get:
 *     summary: Search rides with advanced filtering
 *     description: Search for available rides with various filters including location, price, passengers, and preferences
 *     tags: [Rides]
 *     parameters:
 *       - in: query
 *         name: pickupLocation
 *         schema:
 *           type: string
 *         description: Pickup location address
 *         example: "New York, NY"
 *       - in: query
 *         name: dropLocation
 *         schema:
 *           type: string
 *         description: Drop location address
 *         example: "Boston, MA"
 *       - in: query
 *         name: departureDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Departure date (YYYY-MM-DD)
 *         example: "2024-01-15"
 *       - in: query
 *         name: passengers
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *         description: Number of passengers
 *         example: 2
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0.01
 *         description: Maximum price per seat
 *         example: 50.00
 *       - in: query
 *         name: womenOnly
 *         schema:
 *           type: boolean
 *         description: Filter for women-only rides
 *         example: false
 *       - in: query
 *         name: driverVerified
 *         schema:
 *           type: boolean
 *         description: Filter for verified drivers only
 *         example: true
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, departure_time, distance, created_at]
 *         description: Sort field
 *         example: "departure_time"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *         example: "asc"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Rides found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Rides found successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rides:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Ride'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     filters:
 *                       type: object
 *                       properties:
 *                         pickupLocation:
 *                           type: string
 *                         dropLocation:
 *                           type: string
 *                         departureDate:
 *                           type: string
 *                         passengers:
 *                           type: integer
 *                         maxPrice:
 *                           type: number
 *                         womenOnly:
 *                           type: boolean
 *                         driverVerified:
 *                           type: boolean
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.get('/search', validateSearchParams, rideController.searchRides);

/**
 * @swagger
 * /api/rides/filter:
 *   get:
 *     summary: Filter rides with specific criteria
 *     description: Filter rides based on various criteria including price range, distance, dates, and vehicle information
 *     tags: [Rides]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Comma-separated list of ride statuses
 *         example: "published,in_progress"
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price per seat
 *         example: 10.00
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price per seat
 *         example: 100.00
 *       - in: query
 *         name: distanceMin
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum distance in kilometers
 *         example: 10
 *       - in: query
 *         name: distanceMax
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum distance in kilometers
 *         example: 500
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for departure
 *         example: "2024-01-01T00:00:00Z"
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for departure
 *         example: "2024-12-31T23:59:59Z"
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *         description: Vehicle type filter
 *         example: "Sedan"
 *       - in: query
 *         name: vehicleBrand
 *         schema:
 *           type: string
 *         description: Vehicle brand filter
 *         example: "Toyota"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [price, departure_time, distance, created_at]
 *         description: Sort field
 *         example: "created_at"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *         example: "desc"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Rides filtered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Rides filtered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rides:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Ride'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     filters:
 *                       type: object
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.get('/filter', validateFilterParams, rideController.filterRides);

module.exports = router; 