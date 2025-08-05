const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const rideController = require('../controllers/rideController');
const auth = require('../middleware/auth');

// Test validation middleware
const validateRideCreation = [
  body('vehicleInformationId')
    .isUUID()
    .withMessage('Valid vehicle information ID is required'),
  
  body('totalSeats')
    .isInt({ min: 1, max: 10 })
    .withMessage('Total seats must be between 1 and 10'),
];

// Test route with validation
router.post('/test-validation', auth, validateRideCreation, (req, res) => {
  res.json({ message: 'Validation test working' });
});

module.exports = router; 