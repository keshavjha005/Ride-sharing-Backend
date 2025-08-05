const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const rideStatusController = require('../controllers/rideStatusController');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const validateRideIdParam = [
  param('rideId')
    .isUUID()
    .withMessage('Valid ride ID is required')
];

const validateStatusUpdate = [
  body('status')
    .isIn(['pending', 'confirmed', 'started', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Status must be one of: pending, confirmed, started, in_progress, completed, cancelled'),
  
  body('statusMessageAr')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Arabic status message must be less than 255 characters'),
  
  body('statusMessageEn')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('English status message must be less than 255 characters'),
  
  body('locationData')
    .optional()
    .isObject()
    .withMessage('Location data must be an object'),
  
  body('estimatedArrival')
    .optional()
    .isISO8601()
    .withMessage('Estimated arrival must be a valid date'),
  
  body('actualArrival')
    .optional()
    .isISO8601()
    .withMessage('Actual arrival must be a valid date')
];

const validateLocationTracking = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required (-90 to 90)'),
  
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required (-180 to 180)'),
  
  body('accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Accuracy must be a positive number'),
  
  body('speed')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Speed must be a positive number'),
  
  body('heading')
    .optional()
    .isFloat({ min: 0, max: 360 })
    .withMessage('Heading must be between 0 and 360 degrees'),
  
  body('altitude')
    .optional()
    .isFloat()
    .withMessage('Altitude must be a valid number')
];

const validateBatchLocationTracking = [
  body('locations')
    .isArray({ min: 1, max: 100 })
    .withMessage('Locations must be an array with 1-100 entries'),
  
  body('locations.*.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required (-90 to 90)'),
  
  body('locations.*.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required (-180 to 180)'),
  
  body('locations.*.accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Accuracy must be a positive number'),
  
  body('locations.*.speed')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Speed must be a positive number'),
  
  body('locations.*.heading')
    .optional()
    .isFloat({ min: 0, max: 360 })
    .withMessage('Heading must be between 0 and 360 degrees'),
  
  body('locations.*.altitude')
    .optional()
    .isFloat()
    .withMessage('Altitude must be a valid number')
];

const validateEstimatedArrival = [
  body('estimatedArrival')
    .isISO8601()
    .withMessage('Estimated arrival must be a valid date')
];

const validateActualArrival = [
  body('actualArrival')
    .isISO8601()
    .withMessage('Actual arrival must be a valid date')
];

const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  query('timeRange')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Time range must be between 1 and 1440 minutes')
];

// Routes

/**
 * @swagger
 * /api/rides/{rideId}/status:
 *   get:
 *     summary: Get ride status updates
 *     description: Retrieve status updates for a specific ride
 *     tags: [Ride Status]
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ride ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 50
 *         description: Number of status updates to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of status updates to skip
 *     responses:
 *       200:
 *         description: Ride status updates retrieved successfully
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
 *                   example: "Ride status updates retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rideId:
 *                       type: string
 *                       format: uuid
 *                     statusUpdates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           status:
 *                             type: string
 *                             enum: [pending, confirmed, started, in_progress, completed, cancelled]
 *                           statusMessageAr:
 *                             type: string
 *                           statusMessageEn:
 *                             type: string
 *                           locationData:
 *                             type: object
 *                           estimatedArrival:
 *                             type: string
 *                             format: date-time
 *                           actualArrival:
 *                             type: string
 *                             format: date-time
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         total:
 *                           type: integer
 *       400:
 *         description: Validation error
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.get('/:rideId/status', validateRideIdParam, validatePagination, rideStatusController.getRideStatusUpdates);

/**
 * @swagger
 * /api/rides/{rideId}/status:
 *   post:
 *     summary: Create ride status update
 *     description: Create a new status update for a ride
 *     tags: [Ride Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
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
 *                 enum: [pending, confirmed, started, in_progress, completed, cancelled]
 *                 description: New ride status
 *               statusMessageAr:
 *                 type: string
 *                 maxLength: 255
 *                 description: Arabic status message
 *               statusMessageEn:
 *                 type: string
 *                 maxLength: 255
 *                 description: English status message
 *               locationData:
 *                 type: object
 *                 description: Current location data
 *               estimatedArrival:
 *                 type: string
 *                 format: date-time
 *                 description: Estimated arrival time
 *               actualArrival:
 *                 type: string
 *                 format: date-time
 *                 description: Actual arrival time
 *     responses:
 *       201:
 *         description: Ride status update created successfully
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
 *                   example: "Ride status update created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     rideId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User does not have permission
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.post('/:rideId/status', authenticate, validateRideIdParam, validateStatusUpdate, rideStatusController.createRideStatusUpdate);

/**
 * @swagger
 * /api/rides/{rideId}/location:
 *   get:
 *     summary: Get ride location tracking
 *     description: Retrieve location tracking data for a specific ride
 *     tags: [Ride Location]
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ride ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 100
 *         description: Number of location entries to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of location entries to skip
 *     responses:
 *       200:
 *         description: Ride location tracking retrieved successfully
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
 *                   example: "Ride location tracking retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rideId:
 *                       type: string
 *                       format: uuid
 *                     locations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           latitude:
 *                             type: number
 *                           longitude:
 *                             type: number
 *                           accuracy:
 *                             type: number
 *                           speed:
 *                             type: number
 *                           heading:
 *                             type: number
 *                           altitude:
 *                             type: number
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         total:
 *                           type: integer
 *       400:
 *         description: Validation error
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.get('/:rideId/location', validateRideIdParam, validatePagination, rideStatusController.getRideLocationTracking);

/**
 * @swagger
 * /api/rides/{rideId}/location:
 *   post:
 *     summary: Create ride location tracking entry
 *     description: Create a new location tracking entry for a ride
 *     tags: [Ride Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
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
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: Latitude coordinate
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Longitude coordinate
 *               accuracy:
 *                 type: number
 *                 minimum: 0
 *                 description: Location accuracy in meters
 *               speed:
 *                 type: number
 *                 minimum: 0
 *                 description: Speed in km/h
 *               heading:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 360
 *                 description: Heading in degrees
 *               altitude:
 *                 type: number
 *                 description: Altitude in meters
 *     responses:
 *       201:
 *         description: Ride location tracking entry created successfully
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
 *                   example: "Ride location tracking entry created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     rideId:
 *                       type: string
 *                       format: uuid
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User does not have permission
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.post('/:rideId/location', authenticate, validateRideIdParam, validateLocationTracking, rideStatusController.createRideLocationTracking);

/**
 * @swagger
 * /api/rides/{rideId}/location/batch:
 *   post:
 *     summary: Create batch location tracking entries
 *     description: Create multiple location tracking entries for a ride
 *     tags: [Ride Location]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
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
 *               - locations
 *             properties:
 *               locations:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required:
 *                     - latitude
 *                     - longitude
 *                   properties:
 *                     latitude:
 *                       type: number
 *                       minimum: -90
 *                       maximum: 90
 *                     longitude:
 *                       type: number
 *                       minimum: -180
 *                       maximum: 180
 *                     accuracy:
 *                       type: number
 *                       minimum: 0
 *                     speed:
 *                       type: number
 *                       minimum: 0
 *                     heading:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 360
 *                     altitude:
 *                       type: number
 *     responses:
 *       201:
 *         description: Batch location tracking entries created successfully
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
 *                   example: "Batch location tracking entries created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rideId:
 *                       type: string
 *                       format: uuid
 *                     createdCount:
 *                       type: integer
 *                     locations:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User does not have permission
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.post('/:rideId/location/batch', authenticate, validateRideIdParam, validateBatchLocationTracking, rideStatusController.createBatchLocationTracking);

/**
 * @swagger
 * /api/rides/{rideId}/tracking:
 *   get:
 *     summary: Get live tracking data
 *     description: Get comprehensive tracking data including latest status, location, and statistics
 *     tags: [Ride Tracking]
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ride ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1440
 *         description: Time range in minutes for location data
 *     responses:
 *       200:
 *         description: Live tracking data retrieved successfully
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
 *                   example: "Live tracking data retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rideId:
 *                       type: string
 *                       format: uuid
 *                     ride:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         status:
 *                           type: string
 *                         departureDateTime:
 *                           type: string
 *                           format: date-time
 *                         distance:
 *                           type: number
 *                         estimatedTime:
 *                           type: number
 *                     latestStatus:
 *                       type: object
 *                     latestLocation:
 *                       type: object
 *                     locations:
 *                       type: array
 *                       items:
 *                         type: object
 *                     statistics:
 *                       type: object
 *       400:
 *         description: Validation error
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.get('/:rideId/tracking', validateRideIdParam, validatePagination, rideStatusController.getRideTracking);

/**
 * @swagger
 * /api/rides/{rideId}/estimated-arrival:
 *   put:
 *     summary: Update estimated arrival time
 *     description: Update the estimated arrival time for a ride
 *     tags: [Ride Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
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
 *               - estimatedArrival
 *             properties:
 *               estimatedArrival:
 *                 type: string
 *                 format: date-time
 *                 description: Estimated arrival time
 *     responses:
 *       200:
 *         description: Estimated arrival updated successfully
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
 *                   example: "Estimated arrival updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rideId:
 *                       type: string
 *                       format: uuid
 *                     estimatedArrival:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User does not have permission
 *       404:
 *         description: Ride not found or no status update found
 *       500:
 *         description: Internal server error
 */
router.put('/:rideId/estimated-arrival', authenticate, validateRideIdParam, validateEstimatedArrival, rideStatusController.updateEstimatedArrival);

/**
 * @swagger
 * /api/rides/{rideId}/actual-arrival:
 *   put:
 *     summary: Update actual arrival time
 *     description: Update the actual arrival time for a ride
 *     tags: [Ride Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
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
 *               - actualArrival
 *             properties:
 *               actualArrival:
 *                 type: string
 *                 format: date-time
 *                 description: Actual arrival time
 *     responses:
 *       200:
 *         description: Actual arrival updated successfully
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
 *                   example: "Actual arrival updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rideId:
 *                       type: string
 *                       format: uuid
 *                     actualArrival:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User does not have permission
 *       404:
 *         description: Ride not found or no status update found
 *       500:
 *         description: Internal server error
 */
router.put('/:rideId/actual-arrival', authenticate, validateRideIdParam, validateActualArrival, rideStatusController.updateActualArrival);

/**
 * @swagger
 * /api/rides/{rideId}/tracking-statistics:
 *   get:
 *     summary: Get ride tracking statistics
 *     description: Get comprehensive statistics for ride status updates and location tracking
 *     tags: [Ride Tracking]
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ride ID
 *     responses:
 *       200:
 *         description: Ride tracking statistics retrieved successfully
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
 *                   example: "Ride tracking statistics retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rideId:
 *                       type: string
 *                       format: uuid
 *                     statusStatistics:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           firstUpdate:
 *                             type: string
 *                             format: date-time
 *                           lastUpdate:
 *                             type: string
 *                             format: date-time
 *                     locationStatistics:
 *                       type: object
 *                       properties:
 *                         totalPoints:
 *                           type: integer
 *                         firstLocation:
 *                           type: string
 *                           format: date-time
 *                         lastLocation:
 *                           type: string
 *                           format: date-time
 *                         averageSpeed:
 *                           type: number
 *                         maxSpeed:
 *                           type: number
 *                         minSpeed:
 *                           type: number
 *                         averageAccuracy:
 *                           type: number
 *                         totalDistance:
 *                           type: number
 *       400:
 *         description: Validation error
 *       404:
 *         description: Ride not found
 *       500:
 *         description: Internal server error
 */
router.get('/:rideId/tracking-statistics', validateRideIdParam, rideStatusController.getRideTrackingStatistics);

module.exports = router; 