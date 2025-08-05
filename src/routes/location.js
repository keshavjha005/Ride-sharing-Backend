const express = require('express');
const { body, query, param } = require('express-validator');
const locationController = require('../controllers/locationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/location/search:
 *   get:
 *     summary: Search for locations using Google Places API
 *     description: Search for locations with autocomplete functionality using Google Places API
 *     tags: [Location]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query string (minimum 2 characters)
 *         example: "New York"
 *       - in: query
 *         name: types
 *         schema:
 *           type: string
 *           enum: [geocode, address, establishment, regions, cities]
 *         description: Type of place to search for
 *         example: "cities"
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *           pattern: '^-?[0-9]+(\\.[0-9]+)?,-?[0-9]+(\\.[0-9]+)?$'
 *         description: Bias search to a specific location (format: "latitude,longitude")
 *         example: "40.7128,-74.0060"
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           minimum: 1000
 *           maximum: 50000
 *         description: Search radius in meters
 *         example: 25000
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 5
 *         description: Language code for results
 *         example: "en"
 *     responses:
 *       200:
 *         description: Locations found successfully
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
 *                   example: "Locations found successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     places:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Location'
 *                     total:
 *                       type: integer
 *                       example: 1
 *                     query:
 *                       type: string
 *                       example: "New York"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/search', [
  query('query')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters long'),
  query('types')
    .optional()
    .isIn(['geocode', 'address', 'establishment', 'regions', 'cities'])
    .withMessage('Invalid types parameter'),
  query('location')
    .optional()
    .matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
    .withMessage('Location must be in format: latitude,longitude'),
  query('radius')
    .optional()
    .isInt({ min: 1000, max: 50000 })
    .withMessage('Radius must be between 1000 and 50000 meters'),
  query('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language code must be 2-5 characters'),
], locationController.searchLocations);

/**
 * @swagger
 * /api/location/geocode:
 *   get:
 *     summary: Geocode an address to get coordinates
 *     description: Convert an address to geographic coordinates or vice versa using Google Geocoding API
 *     tags: [Location]
 *     parameters:
 *       - in: query
 *         name: address
 *         schema:
 *           type: string
 *           minLength: 3
 *         description: Address to geocode
 *         example: "1600 Pennsylvania Avenue NW, Washington, DC"
 *       - in: query
 *         name: placeId
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Google Place ID for more accurate results
 *         example: "ChIJN1t_tDeuEmsRUsoyG83frY4"
 *     responses:
 *       200:
 *         description: Address geocoded successfully
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
 *                   example: "Address geocoded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                       example: "1600 Pennsylvania Avenue NW, Washington, DC 20500, USA"
 *                     placeId:
 *                       type: string
 *                       example: "ChIJN1t_tDeuEmsRUsoyG83frY4"
 *                     coordinates:
 *                       $ref: '#/components/schemas/Coordinates'
 *                     components:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           longName:
 *                             type: string
 *                           shortName:
 *                             type: string
 *                           types:
 *                             type: array
 *                             items:
 *                               type: string
 *       400:
 *         description: Validation error or missing parameters
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       404:
 *         description: No results found for the provided address
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/geocode', [
  query('address')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Address must be at least 3 characters long'),
  query('placeId')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Place ID cannot be empty'),
], locationController.geocodeAddress);

/**
 * @swagger
 * /api/location/distance:
 *   get:
 *     summary: Calculate distance between two points
 *     description: Calculate the distance and travel time between two locations using Google Distance Matrix API
 *     tags: [Location]
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *         description: Starting location (address or coordinates)
 *         example: "New York, NY"
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *         description: Ending location (address or coordinates)
 *         example: "Los Angeles, CA"
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [driving, walking, bicycling, transit]
 *         description: Travel mode
 *         example: "driving"
 *       - in: query
 *         name: units
 *         schema:
 *           type: string
 *           enum: [metric, imperial]
 *         description: Distance units
 *         example: "metric"
 *     responses:
 *       200:
 *         description: Distance calculated successfully
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
 *                   example: "Distance calculated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     origin:
 *                       type: string
 *                       example: "New York, NY, USA"
 *                     destination:
 *                       type: string
 *                       example: "Los Angeles, CA, USA"
 *                     distance:
 *                       $ref: '#/components/schemas/Distance'
 *                     duration:
 *                       $ref: '#/components/schemas/Duration'
 *                     mode:
 *                       type: string
 *                       example: "driving"
 *                     units:
 *                       type: string
 *                       example: "metric"
 *       400:
 *         description: Validation error or missing parameters
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/distance', [
  query('origin')
    .trim()
    .notEmpty()
    .withMessage('Origin is required'),
  query('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination is required'),
  query('mode')
    .optional()
    .isIn(['driving', 'walking', 'bicycling', 'transit'])
    .withMessage('Invalid travel mode'),
  query('units')
    .optional()
    .isIn(['metric', 'imperial'])
    .withMessage('Units must be either metric or imperial'),
], locationController.calculateDistance);

/**
 * @swagger
 * /api/location/route:
 *   get:
 *     summary: Get route information between two points
 *     description: Get detailed route information between two locations with turn-by-turn directions using Google Directions API
 *     tags: [Location]
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *         description: Starting location
 *         example: "New York, NY"
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *         description: Ending location
 *         example: "Boston, MA"
 *       - in: query
 *         name: waypoints
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Intermediate stops
 *         example: ["Philadelphia, PA"]
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [driving, walking, bicycling, transit]
 *         description: Travel mode
 *         example: "driving"
 *       - in: query
 *         name: avoid
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [tolls, highways, ferries]
 *         description: Features to avoid
 *         example: ["tolls"]
 *       - in: query
 *         name: units
 *         schema:
 *           type: string
 *           enum: [metric, imperial]
 *         description: Distance units
 *         example: "metric"
 *       - in: query
 *         name: alternatives
 *         schema:
 *           type: boolean
 *         description: Return alternative routes
 *         example: false
 *     responses:
 *       200:
 *         description: Route information retrieved successfully
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
 *                   example: "Route information retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     routes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Route'
 *                     total:
 *                       type: integer
 *                       example: 1
 *                     origin:
 *                       type: string
 *                       example: "New York, NY, USA"
 *                     destination:
 *                       type: string
 *                       example: "Boston, MA, USA"
 *                     mode:
 *                       type: string
 *                       example: "driving"
 *                     units:
 *                       type: string
 *                       example: "metric"
 *       400:
 *         description: Validation error or missing parameters
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/route', [
  query('origin')
    .trim()
    .notEmpty()
    .withMessage('Origin is required'),
  query('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination is required'),
  query('waypoints')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(waypoint => typeof waypoint === 'string' && waypoint.trim().length > 0);
      }
      return typeof value === 'string' && value.trim().length > 0;
    })
    .withMessage('Waypoints must be valid location strings'),
  query('mode')
    .optional()
    .isIn(['driving', 'walking', 'bicycling', 'transit'])
    .withMessage('Invalid travel mode'),
  query('avoid')
    .optional()
    .isArray()
    .withMessage('Avoid must be an array'),
  query('units')
    .optional()
    .isIn(['metric', 'imperial'])
    .withMessage('Units must be either metric or imperial'),
  query('alternatives')
    .optional()
    .isBoolean()
    .withMessage('Alternatives must be a boolean'),
], locationController.getRoute);

/**
 * @swagger
 * /api/location/validate:
 *   post:
 *     summary: Validate location coordinates or address
 *     description: Validate location coordinates or addresses using Google Geocoding API
 *     tags: [Location]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *                 format: float
 *                 minimum: -90
 *                 maximum: 90
 *                 description: Latitude coordinate
 *                 example: 40.7128
 *               longitude:
 *                 type: number
 *                 format: float
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Longitude coordinate
 *                 example: -74.0060
 *               address:
 *                 type: string
 *                 minLength: 3
 *                 description: Address to validate
 *                 example: "New York, NY"
 *             anyOf:
 *               - required: [latitude, longitude]
 *               - required: [address]
 *     responses:
 *       200:
 *         description: Location validation successful
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
 *                   example: "Location coordinates are valid"
 *                 data:
 *                   type: object
 *                   properties:
 *                     coordinates:
 *                       $ref: '#/components/schemas/Coordinates'
 *                     address:
 *                       type: string
 *                       example: "New York, NY, USA"
 *                     isValid:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Validation error or invalid coordinates/address
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.post('/validate', [
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90 degrees'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180 degrees'),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Address must be at least 3 characters long'),
  body()
    .custom((value) => {
      const hasCoordinates = value.latitude !== undefined && value.longitude !== undefined;
      const hasAddress = value.address && value.address.trim().length > 0;
      
      if (!hasCoordinates && !hasAddress) {
        throw new Error('Either coordinates (latitude, longitude) or address is required');
      }
      
      return true;
    }),
], locationController.validateLocation);

module.exports = router; 