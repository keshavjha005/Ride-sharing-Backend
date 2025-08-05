const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { healthCheck: dbHealthCheck } = require('../config/database');
const logger = require('../utils/logger');

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Basic health check
 *     description: Check if the API is running and healthy
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "OK"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-12-20T10:00:00Z"
 *                     uptime:
 *                       type: number
 *                       example: 3600.5
 *                     environment:
 *                       type: string
 *                       example: "development"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     memory:
 *                       type: object
 *                       properties:
 *                         rss:
 *                           type: number
 *                         heapTotal:
 *                           type: number
 *                         heapUsed:
 *                           type: number
 *                         external:
 *                           type: number
 *                     pid:
 *                       type: number
 *                       example: 12345
 */
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

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     tags: [Health]
 *     summary: Detailed health check
 *     description: Comprehensive health check including database connectivity
 *     responses:
 *       200:
 *         description: All services are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "OK"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                     environment:
 *                       type: string
 *                     version:
 *                       type: string
 *                     memory:
 *                       type: object
 *                     pid:
 *                       type: number
 *                     responseTime:
 *                       type: number
 *                       example: 45
 *                     services:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: "healthy"
 *                             timestamp:
 *                               type: string
 *                               format: date-time
 *       503:
 *         description: Service is degraded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "DEGRADED"
 *                     services:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: "unhealthy"
 *                             error:
 *                               type: string
 */
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

/**
 * @swagger
 * /health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness check
 *     description: Kubernetes readiness probe endpoint
 *     responses:
 *       200:
 *         description: Service is ready to receive traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ready"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Service is not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "not ready"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
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

/**
 * @swagger
 * /health/live:
 *   get:
 *     tags: [Health]
 *     summary: Liveness check
 *     description: Kubernetes liveness probe endpoint
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "alive"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 3600.5
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

module.exports = router; 