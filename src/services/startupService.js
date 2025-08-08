const systemLogger = require('./systemLoggingService');
const metricsService = require('./metricsService');
const logger = require('../utils/logger');

class StartupService {
  async initialize() {
    try {
      // Log system startup
      await systemLogger.info('system', 'Application starting up', {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid
      });

      // Initialize services
      await this.initializeServices();

      // Log successful startup
      await systemLogger.info('system', 'Application startup completed successfully');
      
      logger.info('System monitoring and logging services initialized');
    } catch (error) {
      await systemLogger.error('system', 'Application startup failed', { error: error.message });
      logger.error('Failed to initialize system services:', error);
      throw error;
    }
  }

  async initializeServices() {
    // Log service initialization
    await systemLogger.info('system', 'Initializing system services');

    // You can add other service initializations here
    // For example: database connections, external service connections, etc.

    // Log initial system health
    await this.logInitialSystemHealth();
  }

  async logInitialSystemHealth() {
    try {
      // Log system information
      const os = require('os');
      
      await systemLogger.info('system', 'System information logged', {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime()
      });

    } catch (error) {
      await systemLogger.error('system', 'Failed to log initial system health', { error: error.message });
    }
  }

  async shutdown() {
    try {
      await systemLogger.info('system', 'Application shutting down');
      
      // Flush any remaining logs
      const systemLoggingService = require('./systemLoggingService');
      await systemLoggingService.flushLogs();
      
      await systemLogger.info('system', 'Application shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
}

module.exports = new StartupService();
