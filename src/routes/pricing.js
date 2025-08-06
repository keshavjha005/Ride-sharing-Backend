const express = require('express');
const { body, param, query } = require('express-validator');
const pricingController = require('../controllers/pricingController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FareCalculationRequest:
 *       type: object
 *       required:
 *         - distance
 *         - vehicleTypeId
 *         - departureTime
 *         - pickupLocation
 *         - dropoffLocation
 *       properties:
 *         distance:
 *           type: number
 *           minimum: 0.1
 *           description: Distance in kilometers
 *           example: 25.5
 *         vehicleTypeId:
 *           type: string
 *           format: uuid
 *           description: Vehicle type ID
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         departureTime:
 *           type: string
 *           format: date-time
 *           description: Departure time
 *           example: "2024-01-15T10:00:00Z"
 *         pickupLocation:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               example: 40.7128
 *             longitude:
 *               type: number
 *               example: -74.0060
 *         dropoffLocation:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *               example: 40.7589
 *             longitude:
 *               type: number
 *               example: -73.9851
 *         weather:
 *           type: object
 *           description: Weather conditions (optional)
 *         tripId:
 *           type: string
 *           format: uuid
 *           description: Trip ID for tracking (optional)
 *     VehicleTypePricing:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "Sedan"
 *         description:
 *           type: string
 *           example: "Standard sedan vehicle"
 *         per_km_charges:
 *           type: number
 *           example: 2.50
 *         minimum_fare:
 *           type: number
 *           example: 5.00
 *         maximum_fare:
 *           type: number
 *           example: 100.00
 *         is_active:
 *           type: boolean
 *           example: true
 *         multiplier_count:
 *           type: number
 *           example: 2
 *     PricingMultiplier:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         vehicle_type_id:
 *           type: string
 *           format: uuid
 *         multiplier_type:
 *           type: string
 *           enum: [peak_hour, weekend, holiday, weather, demand]
 *           example: "peak_hour"
 *         multiplier_value:
 *           type: number
 *           minimum: 1.0
 *           example: 1.25
 *         is_active:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /api/pricing/calculate:
 *   post:
 *     tags: [Pricing]
 *     summary: Calculate fare for a trip
 *     description: Calculate fare based on distance, vehicle type, and applicable multipliers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FareCalculationRequest'
 *     responses:
 *       200:
 *         description: Fare calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     base_fare:
 *                       type: number
 *                       example: 63.75
 *                     final_fare:
 *                       type: number
 *                       example: 79.69
 *                     distance_km:
 *                       type: number
 *                       example: 25.5
 *                     vehicle_type:
 *                       $ref: '#/components/schemas/VehicleTypePricing'
 *                     applied_multipliers:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/calculate', [
  auth,
  body('distance').isFloat({ min: 0.1 }).withMessage('Distance must be a positive number'),
  body('vehicleTypeId').isUUID().withMessage('Vehicle type ID must be a valid UUID'),
  body('departureTime').isISO8601().withMessage('Departure time must be a valid ISO 8601 date'),
  body('pickupLocation').isObject().withMessage('Pickup location must be an object'),
  body('pickupLocation.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid pickup latitude'),
  body('pickupLocation.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid pickup longitude'),
  body('dropoffLocation').isObject().withMessage('Dropoff location must be an object'),
  body('dropoffLocation.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid dropoff latitude'),
  body('dropoffLocation.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid dropoff longitude'),
  body('tripId').optional().isUUID().withMessage('Trip ID must be a valid UUID')
], pricingController.calculateFare);

/**
 * @swagger
 * /api/pricing/vehicle-types:
 *   get:
 *     tags: [Pricing]
 *     summary: Get vehicle types with pricing information
 *     description: Retrieve all vehicle types with their pricing details
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Return only active vehicle types
 *     responses:
 *       200:
 *         description: Vehicle types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VehicleTypePricing'
 *       500:
 *         description: Internal server error
 */
router.get('/vehicle-types', [
  auth,
  query('activeOnly').optional().isBoolean().withMessage('activeOnly must be a boolean')
], pricingController.getVehicleTypesWithPricing);

/**
 * @swagger
 * /api/pricing/vehicle-types/{id}:
 *   get:
 *     tags: [Pricing]
 *     summary: Get vehicle type with detailed pricing information
 *     description: Retrieve a specific vehicle type with its pricing details and multipliers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle type ID
 *     responses:
 *       200:
 *         description: Vehicle type retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/VehicleTypePricing'
 *                     - type: object
 *                       properties:
 *                         multipliers:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/PricingMultiplier'
 *       404:
 *         description: Vehicle type not found
 *       500:
 *         description: Internal server error
 */
router.get('/vehicle-types/:id', [
  auth,
  param('id').isUUID().withMessage('Vehicle type ID must be a valid UUID')
], pricingController.getVehicleTypeWithPricing);

/**
 * @swagger
 * /api/pricing/vehicle-types/{id}:
 *   put:
 *     tags: [Pricing]
 *     summary: Update vehicle type pricing
 *     description: Update pricing information for a specific vehicle type
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               per_km_charges:
 *                 type: number
 *                 minimum: 0
 *                 example: 2.75
 *               minimum_fare:
 *                 type: number
 *                 minimum: 0
 *                 example: 5.50
 *               maximum_fare:
 *                 type: number
 *                 minimum: 0
 *                 example: 110.00
 *     responses:
 *       200:
 *         description: Vehicle type pricing updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VehicleTypePricing'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Vehicle type not found
 *       500:
 *         description: Internal server error
 */
router.put('/vehicle-types/:id', [
  auth,
  param('id').isUUID().withMessage('Vehicle type ID must be a valid UUID'),
  body('per_km_charges').optional().isFloat({ min: 0 }).withMessage('Per km charges must be a positive number'),
  body('minimum_fare').optional().isFloat({ min: 0 }).withMessage('Minimum fare must be a positive number'),
  body('maximum_fare').optional().isFloat({ min: 0 }).withMessage('Maximum fare must be a positive number')
], pricingController.updateVehicleTypePricing);

/**
 * @swagger
 * /api/pricing/multipliers:
 *   get:
 *     tags: [Pricing]
 *     summary: Get pricing multipliers
 *     description: Retrieve pricing multipliers with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleTypeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by vehicle type ID
 *       - in: query
 *         name: multiplierType
 *         schema:
 *           type: string
 *           enum: [peak_hour, weekend, holiday, weather, demand]
 *         description: Filter by multiplier type
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Return only active multipliers
 *     responses:
 *       200:
 *         description: Pricing multipliers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PricingMultiplier'
 *       500:
 *         description: Internal server error
 */
router.get('/multipliers', [
  auth,
  query('vehicleTypeId').optional().isUUID().withMessage('Vehicle type ID must be a valid UUID'),
  query('multiplierType').optional().isIn(['peak_hour', 'weekend', 'holiday', 'weather', 'demand']).withMessage('Invalid multiplier type'),
  query('activeOnly').optional().isBoolean().withMessage('activeOnly must be a boolean')
], pricingController.getPricingMultipliers);

/**
 * @swagger
 * /api/pricing/multipliers:
 *   post:
 *     tags: [Pricing]
 *     summary: Create pricing multiplier
 *     description: Create a new pricing multiplier for a vehicle type
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicle_type_id
 *               - multiplier_type
 *               - multiplier_value
 *             properties:
 *               vehicle_type_id:
 *                 type: string
 *                 format: uuid
 *                 description: Vehicle type ID
 *               multiplier_type:
 *                 type: string
 *                 enum: [peak_hour, weekend, holiday, weather, demand]
 *                 description: Type of multiplier
 *               multiplier_value:
 *                 type: number
 *                 minimum: 1.0
 *                 description: Multiplier value (e.g., 1.25 for 25% increase)
 *     responses:
 *       201:
 *         description: Pricing multiplier created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PricingMultiplier'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/multipliers', [
  auth,
  body('vehicle_type_id').isUUID().withMessage('Vehicle type ID must be a valid UUID'),
  body('multiplier_type').isIn(['peak_hour', 'weekend', 'holiday', 'weather', 'demand']).withMessage('Invalid multiplier type'),
  body('multiplier_value').isFloat({ min: 1.0 }).withMessage('Multiplier value must be at least 1.0')
], pricingController.createPricingMultiplier);

/**
 * @swagger
 * /api/pricing/multipliers/{id}:
 *   put:
 *     tags: [Pricing]
 *     summary: Update pricing multiplier
 *     description: Update an existing pricing multiplier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Multiplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               multiplier_type:
 *                 type: string
 *                 enum: [peak_hour, weekend, holiday, weather, demand]
 *               multiplier_value:
 *                 type: number
 *                 minimum: 1.0
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Pricing multiplier updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Multiplier not found
 *       500:
 *         description: Internal server error
 */
router.put('/multipliers/:id', [
  auth,
  param('id').isUUID().withMessage('Multiplier ID must be a valid UUID'),
  body('multiplier_type').optional().isIn(['peak_hour', 'weekend', 'holiday', 'weather', 'demand']).withMessage('Invalid multiplier type'),
  body('multiplier_value').optional().isFloat({ min: 1.0 }).withMessage('Multiplier value must be at least 1.0'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
], pricingController.updatePricingMultiplier);

/**
 * @swagger
 * /api/pricing/multipliers/{id}:
 *   delete:
 *     tags: [Pricing]
 *     summary: Delete pricing multiplier
 *     description: Soft delete a pricing multiplier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Multiplier ID
 *     responses:
 *       200:
 *         description: Pricing multiplier deleted successfully
 *       404:
 *         description: Multiplier not found
 *       500:
 *         description: Internal server error
 */
router.delete('/multipliers/:id', [
  auth,
  param('id').isUUID().withMessage('Multiplier ID must be a valid UUID')
], pricingController.deletePricingMultiplier);

/**
 * @swagger
 * /api/pricing/statistics/{vehicleTypeId}:
 *   get:
 *     tags: [Pricing]
 *     summary: Get pricing statistics
 *     description: Get pricing statistics for a specific vehicle type
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleTypeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle type ID
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: "30"
 *         description: Period in days for statistics
 *     responses:
 *       200:
 *         description: Pricing statistics retrieved successfully
 *       404:
 *         description: Vehicle type not found
 *       500:
 *         description: Internal server error
 */
router.get('/statistics/:vehicleTypeId', [
  auth,
  param('vehicleTypeId').isUUID().withMessage('Vehicle type ID must be a valid UUID'),
  query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Period must be between 1 and 365 days')
], pricingController.getPricingStatistics);

/**
 * @swagger
 * /api/pricing/history:
 *   get:
 *     tags: [Pricing]
 *     summary: Get pricing calculation history
 *     description: Get history of pricing calculations with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleTypeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by vehicle type ID
 *       - in: query
 *         name: tripId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by trip ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Pricing history retrieved successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.get('/history', [
  auth,
  query('vehicleTypeId').optional().isUUID().withMessage('Vehicle type ID must be a valid UUID'),
  query('tripId').optional().isUUID().withMessage('Trip ID must be a valid UUID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date')
], pricingController.getPricingHistory);

module.exports = router; 