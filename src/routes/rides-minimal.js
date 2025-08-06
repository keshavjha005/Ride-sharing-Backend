const express = require('express');
const router = express.Router();

const rideController = require('../controllers/rideController');
const { authenticate: auth } = require('../middleware/auth');

// Minimal test route
router.get('/test', (req, res) => {
  res.json({ message: 'Minimal ride routes working' });
});

// Test route with controller
router.get('/test-controller', rideController.getRideById);

module.exports = router; 