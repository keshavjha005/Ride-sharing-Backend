const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { healthCheck: dbHealthCheck } = require('../config/database');
const logger = require('../utils/logger');

// Basic health check
router.get('/', asyncHandler(async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    memory: process.memoryUsage(),
    pid: process.pid,
  };

  res.status(200).json({
    success: true,
    data: health,
  });
}));

// Detailed health check with database
router.get('/detailed', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Check database health (optional)
  let dbHealth;
  try {
    dbHealth = await dbHealthCheck();
  } catch (error) {
    dbHealth = { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
  
  const health = {
    status: dbHealth.status === 'healthy' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
    memory: process.memoryUsage(),
    pid: process.pid,
    responseTime: Date.now() - startTime,
    services: {
      database: dbHealth,
    },
  };

  const statusCode = health.status === 'OK' ? 200 : 503;

  res.status(statusCode).json({
    success: health.status === 'OK',
    data: health,
  });
}));

// Readiness check (for Kubernetes)
router.get('/ready', asyncHandler(async (req, res) => {
  let dbHealth;
  try {
    dbHealth = await dbHealthCheck();
  } catch (error) {
    dbHealth = { status: 'unhealthy', error: error.message };
  }
  
  if (dbHealth.status === 'healthy') {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
}));

// Liveness check (for Kubernetes)
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router; 