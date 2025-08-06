const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const rideController = require('../controllers/rideController');
const { authenticate: auth } = require('../middleware/auth');

// Basic validation middleware
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
];

const validateRideId = [
  param('id')
    .isUUID()
    .withMessage('Valid ride ID is required')
];

// Basic routes without Swagger documentation
router.post('/', auth, validateRideCreation, rideController.createRide);
router.get('/my-rides', auth, rideController.getMyRides);
router.get('/:id', validateRideId, rideController.getRideById);

module.exports = router; 