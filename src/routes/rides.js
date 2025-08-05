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

const validateRideId = [
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
router.get('/:id', validateRideId, rideController.getRideById);

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
router.delete('/:id', authenticate, validateRideId, rideController.deleteRide);

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
router.post('/:id/publish', authenticate, validateRideId, rideController.publishRide);

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
router.post('/:id/unpublish', authenticate, validateRideId, rideController.unpublishRide);

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
router.get('/:id/available-seats', validateRideId, rideController.getAvailableSeats);

module.exports = router; 