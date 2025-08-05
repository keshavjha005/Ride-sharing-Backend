const express = require('express');
const router = express.Router();

// Basic routes without any imports
router.get('/test', (req, res) => {
  res.json({ message: 'Basic ride routes working' });
});

module.exports = router; 