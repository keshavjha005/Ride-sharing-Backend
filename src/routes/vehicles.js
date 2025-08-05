const express = require('express');
const { body, param, query } = require('express-validator');
const VehicleController = require('../controllers/vehicleController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateVehicleData = [
  body('vehicleTypeId')
    .isUUID()
    .withMessage('Vehicle type ID must be a valid UUID'),
  body('vehicleBrandId')
    .isUUID()
    .withMessage('Vehicle brand ID must be a valid UUID'),
  body('vehicleModelId')
    .isUUID()
    .withMessage('Vehicle model ID must be a valid UUID'),
  body('vehicleNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Vehicle number is required and must be between 1 and 50 characters'),
  body('vehicleColor')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Vehicle color must be less than 50 characters'),
  body('vehicleYear')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Vehicle year must be a valid year'),
  body('vehicleImage')
    .optional()
    .isURL()
    .withMessage('Vehicle image must be a valid URL')
];

const validateUpdateVehicleData = [
  body('vehicleTypeId')
    .optional()
    .isUUID()
    .withMessage('Vehicle type ID must be a valid UUID'),
  body('vehicleBrandId')
    .optional()
    .isUUID()
    .withMessage('Vehicle brand ID must be a valid UUID'),
  body('vehicleModelId')
    .optional()
    .isUUID()
    .withMessage('Vehicle model ID must be a valid UUID'),
  body('vehicleNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Vehicle number must be between 1 and 50 characters'),
  body('vehicleColor')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Vehicle color must be less than 50 characters'),
  body('vehicleYear')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Vehicle year must be a valid year'),
  body('vehicleImage')
    .optional()
    .isURL()
    .withMessage('Vehicle image must be a valid URL')
];

const validateId = [
  param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID')
];

const validateBrandId = [
  param('brandId')
    .isUUID()
    .withMessage('Brand ID must be a valid UUID')
];

/**
 * @swagger
 * /api/vehicles/brands:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get all vehicle brands
 *     description: Retrieve a list of all available vehicle brands
 *     responses:
 *       200:
 *         description: Vehicle brands retrieved successfully
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
 *                   example: "Vehicle brands retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     brands:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                             example: "Toyota"
 *                           logo:
 *                             type: string
 *                             example: "https://example.com/toyota-logo.png"
 *                           isActive:
 *                             type: boolean
 *                             example: true
 *       500:
 *         description: Internal server error
 */
router.get('/brands', VehicleController.getBrands);

/**
 * @swagger
 * /api/vehicles/types:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get all vehicle types
 *     description: Retrieve a list of all available vehicle types
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
 *                 message:
 *                   type: string
 *                   example: "Vehicle types retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     types:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                             example: "Sedan"
 *                           description:
 *                             type: string
 *                             example: "Standard sedan vehicle"
 *                           isActive:
 *                             type: boolean
 *                             example: true
 *       500:
 *         description: Internal server error
 */
router.get('/types', VehicleController.getTypes);

/**
 * @swagger
 * /api/vehicles/models/{brandId}:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get vehicle models by brand
 *     description: Retrieve a list of vehicle models for a specific brand
 *     parameters:
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Brand ID
 *     responses:
 *       200:
 *         description: Vehicle models retrieved successfully
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
 *                   example: "Vehicle models retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     models:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                             example: "Camry"
 *                           brandId:
 *                             type: string
 *                             format: uuid
 *                           isActive:
 *                             type: boolean
 *                             example: true
 *       400:
 *         description: Invalid brand ID
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Internal server error
 */
router.get('/models/:brandId', validateBrandId, VehicleController.getModelsByBrand);

// Protected routes (authentication required)
router.use(authenticate);

/**
 * @swagger
 * /api/vehicles/user-vehicle:
 *   post:
 *     tags: [Vehicles]
 *     summary: Add user vehicle
 *     description: Add a new vehicle for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleTypeId
 *               - vehicleBrandId
 *               - vehicleModelId
 *               - vehicleNumber
 *             properties:
 *               vehicleTypeId:
 *                 type: string
 *                 format: uuid
 *                 description: Vehicle type ID
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               vehicleBrandId:
 *                 type: string
 *                 format: uuid
 *                 description: Vehicle brand ID
 *                 example: "123e4567-e89b-12d3-a456-426614174001"
 *               vehicleModelId:
 *                 type: string
 *                 format: uuid
 *                 description: Vehicle model ID
 *                 example: "123e4567-e89b-12d3-a456-426614174002"
 *               vehicleNumber:
 *                 type: string
 *                 description: Vehicle registration number
 *                 example: "ABC123"
 *               vehicleColor:
 *                 type: string
 *                 description: Vehicle color
 *                 example: "Red"
 *               vehicleYear:
 *                 type: integer
 *                 description: Vehicle manufacturing year
 *                 example: 2020
 *               vehicleImage:
 *                 type: string
 *                 format: uri
 *                 description: Vehicle image URL
 *                 example: "https://example.com/vehicle-image.jpg"
 *     responses:
 *       201:
 *         description: Vehicle added successfully
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
 *                   example: "Vehicle added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicle:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         vehicleNumber:
 *                           type: string
 *                         vehicleColor:
 *                           type: string
 *                         vehicleYear:
 *                           type: integer
 *                         isVerified:
 *                           type: boolean
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/user-vehicle', validateVehicleData, VehicleController.addUserVehicle);

/**
 * @swagger
 * /api/vehicles/user-vehicles:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get user vehicles
 *     description: Retrieve all vehicles for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User vehicles retrieved successfully
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
 *                   example: "User vehicles retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           vehicleNumber:
 *                             type: string
 *                           vehicleColor:
 *                             type: string
 *                           vehicleYear:
 *                             type: integer
 *                           isVerified:
 *                             type: boolean
 *                           isActive:
 *                             type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/user-vehicles', VehicleController.getUserVehicles);

/**
 * @swagger
 * /api/vehicles/user-vehicle/{id}:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get user vehicle by ID
 *     description: Retrieve a specific vehicle for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle retrieved successfully
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
 *                   example: "Vehicle retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicle:
 *                       type: object
 *       400:
 *         description: Invalid vehicle ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.get('/user-vehicle/:id', validateId, VehicleController.getUserVehicle);

/**
 * @swagger
 * /api/vehicles/user-vehicle/{id}:
 *   put:
 *     tags: [Vehicles]
 *     summary: Update user vehicle
 *     description: Update a specific vehicle for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleTypeId:
 *                 type: string
 *                 format: uuid
 *               vehicleBrandId:
 *                 type: string
 *                 format: uuid
 *               vehicleModelId:
 *                 type: string
 *                 format: uuid
 *               vehicleNumber:
 *                 type: string
 *               vehicleColor:
 *                 type: string
 *               vehicleYear:
 *                 type: integer
 *               vehicleImage:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
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
 *                   example: "Vehicle updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicle:
 *                       type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.put('/user-vehicle/:id', validateId.concat(validateUpdateVehicleData), VehicleController.updateUserVehicle);

/**
 * @swagger
 * /api/vehicles/user-vehicle/{id}:
 *   delete:
 *     tags: [Vehicles]
 *     summary: Delete user vehicle
 *     description: Delete a specific vehicle for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
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
 *                   example: "Vehicle deleted successfully"
 *       400:
 *         description: Invalid vehicle ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.delete('/user-vehicle/:id', validateId, VehicleController.deleteUserVehicle);

/**
 * @swagger
 * /api/vehicles/user-vehicle/{id}/verify:
 *   post:
 *     tags: [Vehicles]
 *     summary: Verify user vehicle
 *     description: Mark a user vehicle as verified (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle verified successfully
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
 *                   example: "Vehicle verified successfully"
 *       400:
 *         description: Invalid vehicle ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.post('/user-vehicle/:id/verify', validateId, VehicleController.verifyUserVehicle);

module.exports = router; 