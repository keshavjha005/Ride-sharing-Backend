const metricsService = require('./metricsService');
const logger = require('../utils/logger');

class SystemLoggingService {
  constructor() {
    this.logBuffer = [];
    this.flushInterval = 5000; // Flush logs every 5 seconds
    this.maxBufferSize = 100;
    
    // Start the flush interval
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  // Log system events
  async log(level, service, message, metadata = {}) {
    const logEntry = {
      level,
      service,
      message,
      metadata,
      timestamp: new Date().toISOString()
    };

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Also log to console/file logger
    logger[level] ? logger[level](`[${service}] ${message}`, metadata) : logger.info(`[${service}] ${message}`, metadata);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      await this.flushLogs();
    }
  }

  // Flush logs to database
  async flushLogs() {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Store all logs in database
      for (const log of logsToFlush) {
        await metricsService.logSystemEvent(log.level, log.service, log.message, log.metadata);
      }
    } catch (error) {
      logger.error('Failed to flush system logs:', error);
      // If flush fails, add logs back to buffer (but limit size to prevent memory issues)
      this.logBuffer = [...logsToFlush.slice(-50), ...this.logBuffer];
    }
  }

  // Convenience methods for different log levels
  error(service, message, metadata = {}) {
    return this.log('error', service, message, metadata);
  }

  warn(service, message, metadata = {}) {
    return this.log('warn', service, message, metadata);
  }

  info(service, message, metadata = {}) {
    return this.log('info', service, message, metadata);
  }

  debug(service, message, metadata = {}) {
    return this.log('debug', service, message, metadata);
  }

  // Log authentication events
  logAuth(event, userId = null, success = true, details = {}) {
    const level = success ? 'info' : 'warn';
    const message = `Authentication ${event}: ${success ? 'success' : 'failed'}`;
    return this.log(level, 'auth', message, { userId, event, success, ...details });
  }

  // Log database events
  logDatabase(event, query = null, duration = null, error = null) {
    const level = error ? 'error' : 'info';
    const message = error ? `Database error: ${error}` : `Database ${event} completed`;
    return this.log(level, 'database', message, { event, query, duration, error });
  }

  // Log API events
  logAPI(method, endpoint, statusCode, duration, userId = null, error = null) {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    const message = `${method} ${endpoint} - ${statusCode} (${duration}ms)`;
    return this.log(level, 'api', message, { method, endpoint, statusCode, duration, userId, error });
  }

  // Log payment events
  logPayment(event, amount = null, userId = null, transactionId = null, success = true, error = null) {
    const level = success ? 'info' : 'error';
    const message = `Payment ${event}: ${success ? 'success' : 'failed'}`;
    return this.log(level, 'payment', message, { event, amount, userId, transactionId, success, error });
  }

  // Log ride events
  logRide(event, rideId = null, driverId = null, passengerId = null, details = {}) {
    const message = `Ride ${event}`;
    return this.log('info', 'ride', message, { event, rideId, driverId, passengerId, ...details });
  }

  // Log system health events
  logHealth(service, status, responseTime = null, details = {}) {
    const level = status === 'healthy' ? 'info' : status === 'warning' ? 'warn' : 'error';
    const message = `Health check for ${service}: ${status}`;
    return this.log(level, 'health', message, { service, status, responseTime, ...details });
  }
}

// Export singleton instance
module.exports = new SystemLoggingService();
