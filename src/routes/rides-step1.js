const express = require('express');
const router = express.Router();

// Step 1: Add auth middleware with correct import
const { authenticate } = require('../middleware/auth');

// Basic routes with auth
router.get('/test', authenticate, (req, res) => {
  res.json({ message: 'Step 1: Auth middleware working' });
});

module.exports = router; 