const { validationResult } = require('express-validator');

// Simple test controller
const testRide = async (req, res) => {
  res.json({ message: 'Ride controller working' });
};

module.exports = {
  testRide
}; 