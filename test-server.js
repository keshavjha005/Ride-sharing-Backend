require('dotenv').config();
const express = require('express');
const app = express();

// Simple health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
const server = app.listen(3000, () => {
  console.log('🚀 Test server running on http://localhost:3000');
  console.log('📊 Health check: http://localhost:3000/health');
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 