const express = require('express');
const { body, param, query } = require('express-validator');
const AdminVehicleController = require('../controllers/adminVehicleController');
const { adminAuth, adminPermissionAuth } = require('../middleware/adminAuth');

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// ==================== VEHICLE TYPES ROUTES ====================

// Validation middleware for vehicle types
const validateVehicleType = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Vehicle type name is required and must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('per_km_charges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Per km charges must be a positive number'),
  body('minimum_fare')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum fare must be a positive number'),
  body('maximum_fare')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum fare must be a positive number'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

const validateVehicleTypeId = [
  param('id')
    .isUUID()
    .withMessage('Vehicle type ID must be a valid UUID')
];

/**
 * @swagger
 * /api/admin/vehicles/types:
 *   get:
 *     tags: [Admin Vehicles]
 *     summary: Get all vehicle types with pagination and filtering
 *     description: Retrieve vehicle types with search, sorting, and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or description
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, per_km_charges, minimum_fare, created_at]
 *           default: name
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Vehicle types retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/types', AdminVehicleController.getVehicleTypes);

/**
 * @swagger
 * /api/admin/vehicles/types/{id}:
 *   get:
 *     tags: [Admin Vehicles]
 *     summary: Get vehicle type by ID
 *     description: Retrieve detailed information about a specific vehicle type
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
 *       404:
 *         description: Vehicle type not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/types/:id', validateVehicleTypeId, AdminVehicleController.getVehicleTypeById);

/**
 * @swagger
 * /api/admin/vehicles/types:
 *   post:
 *     tags: [Admin Vehicles]
 *     summary: Create new vehicle type
 *     description: Create a new vehicle type with pricing information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Vehicle type name
 *               description:
 *                 type: string
 *                 description: Vehicle type description
 *               per_km_charges:
 *                 type: number
 *                 description: Price per kilometer
 *               minimum_fare:
 *                 type: number
 *                 description: Minimum fare amount
 *               maximum_fare:
 *                 type: number
 *                 description: Maximum fare amount
 *               is_active:
 *                 type: boolean
 *                 description: Whether the vehicle type is active
 *     responses:
 *       201:
 *         description: Vehicle type created successfully
 *       400:
 *         description: Validation error or duplicate name
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/types', validateVehicleType, AdminVehicleController.createVehicleType);

/**
 * @swagger
 * /api/admin/vehicles/types/{id}:
 *   put:
 *     tags: [Admin Vehicles]
 *     summary: Update vehicle type
 *     description: Update an existing vehicle type
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               per_km_charges:
 *                 type: number
 *               minimum_fare:
 *                 type: number
 *               maximum_fare:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Vehicle type updated successfully
 *       400:
 *         description: Validation error or duplicate name
 *       404:
 *         description: Vehicle type not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/types/:id', validateVehicleTypeId.concat(validateVehicleType), AdminVehicleController.updateVehicleType);

/**
 * @swagger
 * /api/admin/vehicles/types/{id}:
 *   delete:
 *     tags: [Admin Vehicles]
 *     summary: Delete vehicle type
 *     description: Soft delete a vehicle type
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
 *         description: Vehicle type deleted successfully
 *       404:
 *         description: Vehicle type not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/types/:id', validateVehicleTypeId, AdminVehicleController.deleteVehicleType);

// ==================== VEHICLE BRANDS ROUTES ====================

// Validation middleware for vehicle brands
const validateVehicleBrand = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Vehicle brand name is required and must be between 1 and 100 characters'),
  body('logo')
    .optional()
    .isURL()
    .withMessage('Logo must be a valid URL'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

const validateVehicleBrandId = [
  param('id')
    .isUUID()
    .withMessage('Vehicle brand ID must be a valid UUID')
];

/**
 * @swagger
 * /api/admin/vehicles/brands:
 *   get:
 *     tags: [Admin Vehicles]
 *     summary: Get all vehicle brands with pagination and filtering
 *     description: Retrieve vehicle brands with search, sorting, and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for brand name
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, created_at]
 *           default: name
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Vehicle brands retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/brands', AdminVehicleController.getVehicleBrands);

/**
 * @swagger
 * /api/admin/vehicles/brands/{id}:
 *   get:
 *     tags: [Admin Vehicles]
 *     summary: Get vehicle brand by ID
 *     description: Retrieve detailed information about a specific vehicle brand
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle brand ID
 *     responses:
 *       200:
 *         description: Vehicle brand retrieved successfully
 *       404:
 *         description: Vehicle brand not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/brands/:id', validateVehicleBrandId, AdminVehicleController.getVehicleBrandById);

/**
 * @swagger
 * /api/admin/vehicles/brands:
 *   post:
 *     tags: [Admin Vehicles]
 *     summary: Create new vehicle brand
 *     description: Create a new vehicle brand
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Vehicle brand name
 *               logo:
 *                 type: string
 *                 format: uri
 *                 description: Brand logo URL
 *               is_active:
 *                 type: boolean
 *                 description: Whether the brand is active
 *     responses:
 *       201:
 *         description: Vehicle brand created successfully
 *       400:
 *         description: Validation error or duplicate name
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/brands', validateVehicleBrand, AdminVehicleController.createVehicleBrand);

/**
 * @swagger
 * /api/admin/vehicles/brands/{id}:
 *   put:
 *     tags: [Admin Vehicles]
 *     summary: Update vehicle brand
 *     description: Update an existing vehicle brand
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle brand ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: uri
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Vehicle brand updated successfully
 *       400:
 *         description: Validation error or duplicate name
 *       404:
 *         description: Vehicle brand not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/brands/:id', validateVehicleBrandId.concat(validateVehicleBrand), AdminVehicleController.updateVehicleBrand);

/**
 * @swagger
 * /api/admin/vehicles/brands/{id}:
 *   delete:
 *     tags: [Admin Vehicles]
 *     summary: Delete vehicle brand
 *     description: Soft delete a vehicle brand
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle brand ID
 *     responses:
 *       200:
 *         description: Vehicle brand deleted successfully
 *       404:
 *         description: Vehicle brand not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/brands/:id', validateVehicleBrandId, AdminVehicleController.deleteVehicleBrand);

// ==================== VEHICLE MODELS ROUTES ====================

// Validation middleware for vehicle models
const validateVehicleModel = [
  body('brand_id')
    .isUUID()
    .withMessage('Brand ID must be a valid UUID'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Vehicle model name is required and must be between 1 and 100 characters'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

const validateVehicleModelId = [
  param('id')
    .isUUID()
    .withMessage('Vehicle model ID must be a valid UUID')
];

/**
 * @swagger
 * /api/admin/vehicles/models:
 *   get:
 *     tags: [Admin Vehicles]
 *     summary: Get all vehicle models with pagination and filtering
 *     description: Retrieve vehicle models with search, sorting, and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for model name or brand name
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by brand ID
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, brand_name, created_at]
 *           default: name
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Vehicle models retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/models', AdminVehicleController.getVehicleModels);

/**
 * @swagger
 * /api/admin/vehicles/models/{id}:
 *   get:
 *     tags: [Admin Vehicles]
 *     summary: Get vehicle model by ID
 *     description: Retrieve detailed information about a specific vehicle model
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle model ID
 *     responses:
 *       200:
 *         description: Vehicle model retrieved successfully
 *       404:
 *         description: Vehicle model not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/models/:id', validateVehicleModelId, AdminVehicleController.getVehicleModelById);

/**
 * @swagger
 * /api/admin/vehicles/models:
 *   post:
 *     tags: [Admin Vehicles]
 *     summary: Create new vehicle model
 *     description: Create a new vehicle model for a specific brand
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - brand_id
 *               - name
 *             properties:
 *               brand_id:
 *                 type: string
 *                 format: uuid
 *                 description: Brand ID
 *               name:
 *                 type: string
 *                 description: Vehicle model name
 *               is_active:
 *                 type: boolean
 *                 description: Whether the model is active
 *     responses:
 *       201:
 *         description: Vehicle model created successfully
 *       400:
 *         description: Validation error, invalid brand, or duplicate name
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/models', validateVehicleModel, AdminVehicleController.createVehicleModel);

/**
 * @swagger
 * /api/admin/vehicles/models/{id}:
 *   put:
 *     tags: [Admin Vehicles]
 *     summary: Update vehicle model
 *     description: Update an existing vehicle model
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle model ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand_id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Vehicle model updated successfully
 *       400:
 *         description: Validation error, invalid brand, or duplicate name
 *       404:
 *         description: Vehicle model not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/models/:id', validateVehicleModelId.concat(validateVehicleModel), AdminVehicleController.updateVehicleModel);

/**
 * @swagger
 * /api/admin/vehicles/models/{id}:
 *   delete:
 *     tags: [Admin Vehicles]
 *     summary: Delete vehicle model
 *     description: Soft delete a vehicle model
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle model ID
 *     responses:
 *       200:
 *         description: Vehicle model deleted successfully
 *       404:
 *         description: Vehicle model not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/models/:id', validateVehicleModelId, AdminVehicleController.deleteVehicleModel);

// ==================== USER VEHICLES ROUTES ====================

// Validation middleware for user vehicles
const validateUserVehicle = [
  body('vehicle_type_id')
    .optional()
    .isUUID()
    .withMessage('Vehicle type ID must be a valid UUID'),
  body('vehicle_brand_id')
    .optional()
    .isUUID()
    .withMessage('Vehicle brand ID must be a valid UUID'),
  body('vehicle_model_id')
    .optional()
    .isUUID()
    .withMessage('Vehicle model ID must be a valid UUID'),
  body('vehicle_number')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Vehicle number must be between 1 and 50 characters'),
  body('vehicle_color')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Vehicle color must be less than 50 characters'),
  body('vehicle_year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Vehicle year must be a valid year'),
  body('vehicle_image')
    .optional()
    .isURL()
    .withMessage('Vehicle image must be a valid URL'),
  body('is_verified')
    .optional()
    .isBoolean()
    .withMessage('is_verified must be a boolean'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

const validateUserVehicleId = [
  param('id')
    .isUUID()
    .withMessage('User vehicle ID must be a valid UUID')
];

/**
 * @swagger
 * /api/admin/vehicles/user-vehicles:
 *   get:
 *     tags: [Admin Vehicles]
 *     summary: Get all user vehicles with pagination and filtering
 *     description: Retrieve user vehicles with search, sorting, and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for vehicle number, type, brand, model, or user
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: vehicleTypeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by vehicle type ID
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by brand ID
 *       - in: query
 *         name: verified
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by verification status
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, vehicle_number, user_name]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: User vehicles retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/user-vehicles', AdminVehicleController.getUserVehicles);

/**
 * @swagger
 * /api/admin/vehicles/user-vehicles/{id}:
 *   get:
 *     tags: [Admin Vehicles]
 *     summary: Get user vehicle by ID
 *     description: Retrieve detailed information about a specific user vehicle
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User vehicle ID
 *     responses:
 *       200:
 *         description: User vehicle retrieved successfully
 *       404:
 *         description: User vehicle not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/user-vehicles/:id', validateUserVehicleId, AdminVehicleController.getUserVehicleById);

/**
 * @swagger
 * /api/admin/vehicles/user-vehicles/{id}:
 *   put:
 *     tags: [Admin Vehicles]
 *     summary: Update user vehicle
 *     description: Update an existing user vehicle (admin override)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User vehicle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicle_type_id:
 *                 type: string
 *                 format: uuid
 *               vehicle_brand_id:
 *                 type: string
 *                 format: uuid
 *               vehicle_model_id:
 *                 type: string
 *                 format: uuid
 *               vehicle_number:
 *                 type: string
 *               vehicle_color:
 *                 type: string
 *               vehicle_year:
 *                 type: integer
 *               vehicle_image:
 *                 type: string
 *                 format: uri
 *               is_verified:
 *                 type: boolean
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User vehicle updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User vehicle not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/user-vehicles/:id', validateUserVehicleId.concat(validateUserVehicle), AdminVehicleController.updateUserVehicle);

/**
 * @swagger
 * /api/admin/vehicles/user-vehicles/{id}/verify:
 *   post:
 *     tags: [Admin Vehicles]
 *     summary: Verify user vehicle
 *     description: Mark a user vehicle as verified
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User vehicle ID
 *     responses:
 *       200:
 *         description: User vehicle verified successfully
 *       404:
 *         description: User vehicle not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/user-vehicles/:id/verify', validateUserVehicleId, AdminVehicleController.verifyUserVehicle);

/**
 * @swagger
 * /api/admin/vehicles/user-vehicles/{id}:
 *   delete:
 *     tags: [Admin Vehicles]
 *     summary: Delete user vehicle
 *     description: Soft delete a user vehicle (admin override)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User vehicle ID
 *     responses:
 *       200:
 *         description: User vehicle deleted successfully
 *       404:
 *         description: User vehicle not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/user-vehicles/:id', validateUserVehicleId, AdminVehicleController.deleteUserVehicle);

// ==================== VEHICLE ANALYTICS ROUTES ====================

/**
 * @swagger
 * /api/admin/vehicles/analytics:
 *   get:
 *     tags: [Admin Vehicles]
 *     summary: Get vehicle analytics
 *     description: Retrieve vehicle analytics and statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Analytics period
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [overview, types, brands, user-vehicles]
 *           default: overview
 *         description: Analytics type
 *     responses:
 *       200:
 *         description: Vehicle analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/analytics', AdminVehicleController.getVehicleAnalytics);

// ==================== BULK OPERATIONS ROUTES ====================

/**
 * @swagger
 * /api/admin/vehicles/bulk-update-types:
 *   post:
 *     tags: [Admin Vehicles]
 *     summary: Bulk update vehicle types
 *     description: Perform bulk operations on vehicle types
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleTypes
 *             properties:
 *               vehicleTypes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     per_km_charges:
 *                       type: number
 *                     minimum_fare:
 *                       type: number
 *                     maximum_fare:
 *                       type: number
 *                     is_active:
 *                       type: boolean
 *               operation:
 *                 type: string
 *                 enum: [update, delete]
 *                 default: update
 *                 description: Operation to perform
 *     responses:
 *       200:
 *         description: Bulk update completed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/bulk-update-types', [
  body('vehicleTypes')
    .isArray({ min: 1 })
    .withMessage('Vehicle types must be a non-empty array'),
  body('operation')
    .optional()
    .isIn(['update', 'delete'])
    .withMessage('Operation must be either update or delete')
], AdminVehicleController.bulkUpdateVehicleTypes);

/**
 * @swagger
 * /api/admin/vehicles/bulk-verify:
 *   post:
 *     tags: [Admin Vehicles]
 *     summary: Bulk verify user vehicles
 *     description: Verify multiple user vehicles at once
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleIds
 *             properties:
 *               vehicleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of user vehicle IDs to verify
 *     responses:
 *       200:
 *         description: Bulk verification completed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/bulk-verify', [
  body('vehicleIds')
    .isArray({ min: 1 })
    .withMessage('Vehicle IDs must be a non-empty array'),
  body('vehicleIds.*')
    .isUUID()
    .withMessage('Each vehicle ID must be a valid UUID')
], AdminVehicleController.bulkVerifyUserVehicles);

module.exports = router; 