require('dotenv').config();
const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { testConnection } = require('./src/config/database');
const socketService = require('./src/services/socketService');

// Start server
const startServer = async () => {
  try {
    // Test database connection (optional in development)
    if (config.server.environment === 'production') {
      await testConnection();
    } else {
      // Skip database connection test in development for now
      logger.startup('Skipping database connection test in development');
    }
    
    // Start HTTP server
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.startup(`Server running on http://${config.server.host}:${config.server.port}`, {
        environment: config.server.environment,
        version: config.server.version,
        port: config.server.port,
        host: config.server.host,
      });
      
      console.log(`🚀 Mate Backend Server Started!`);
      console.log(`📍 Environment: ${config.server.environment}`);
      console.log(`🌐 URL: http://${config.server.host}:${config.server.port}`);
      console.log(`📊 Health Check: http://${config.server.host}:${config.server.port}/health`);
      console.log(`📚 API Documentation: http://${config.server.host}:${config.server.port}/api/docs`);
      console.log(`🔌 WebSocket: ws://${config.server.host}:${config.server.port}`);
    });

    // Initialize WebSocket server
    socketService.initialize(server);

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise: promise,
    reason: reason,
  });
  process.exit(1);
});

// Start the server
startServer(); 