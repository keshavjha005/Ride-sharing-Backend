const metricsService = require('../services/metricsService');
const systemLogger = require('../services/systemLoggingService');
const logger = require('../utils/logger');

// Middleware to track API performance metrics
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    const isError = res.statusCode >= 400;
    
    // Track the request
    metricsService.trackRequest(responseTime, isError);
    
    // Log API request using system logger
    systemLogger.logAPI(
      req.method,
      req.originalUrl,
      res.statusCode,
      responseTime,
      req.user?.id || null,
      isError ? `HTTP ${res.statusCode}` : null
    );
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = metricsMiddleware;
