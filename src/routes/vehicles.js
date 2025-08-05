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

// Public routes (no authentication required)
router.get('/brands', VehicleController.getBrands);
router.get('/types', VehicleController.getTypes);
router.get('/models/:brandId', validateBrandId, VehicleController.getModelsByBrand);

// Protected routes (authentication required)
router.use(authenticate);

// User vehicle management
router.post('/user-vehicle', validateVehicleData, VehicleController.addUserVehicle);
router.get('/user-vehicles', VehicleController.getUserVehicles);
router.get('/user-vehicle/:id', validateId, VehicleController.getUserVehicle);
router.put('/user-vehicle/:id', validateId.concat(validateUpdateVehicleData), VehicleController.updateUserVehicle);
router.delete('/user-vehicle/:id', validateId, VehicleController.deleteUserVehicle);

// Admin routes (for vehicle verification)
router.post('/user-vehicle/:id/verify', validateId, VehicleController.verifyUserVehicle);

module.exports = router; 