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
];

const validateRideUpdate = [
  param('id')
    .isUUID()
    .withMessage('Valid ride ID is required'),
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
router.post('/', authenticate, validateRideCreation, rideController.createRide);
router.get('/my-rides', authenticate, validatePagination, rideController.getMyRides);
router.get('/:id', validateRideId, rideController.getRideById);
router.put('/:id', authenticate, validateRideUpdate, rideController.updateRide);
router.delete('/:id', authenticate, validateRideId, rideController.deleteRide);
router.post('/:id/publish', authenticate, validateRideId, rideController.publishRide);
router.post('/:id/unpublish', authenticate, validateRideId, rideController.unpublishRide);
router.get('/:id/available-seats', validateRideId, rideController.getAvailableSeats);

module.exports = router; 