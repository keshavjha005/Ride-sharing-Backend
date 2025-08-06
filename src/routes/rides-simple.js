const express = require('express');
const router = express.Router();

const rideController = require('../controllers/rideController');
const { authenticate: auth } = require('../middleware/auth');

// Simple routes without validation
router.post('/', auth, (req, res) => {
  res.json({ message: 'Ride creation endpoint' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get ride endpoint' });
});

router.get('/my-rides', auth, (req, res) => {
  res.json({ message: 'Get my rides endpoint' });
});

module.exports = router; 