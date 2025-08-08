require('dotenv').config();
const app = require('./src/app');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { testConnection } = require('./src/config/database');
const socketService = require('./src/services/socketService');
const startupService = require('./src/services/startupService');

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting Mate Backend Server...');
    
    // Always test database connection
    console.log('🔍 Testing database connection...');
    await testConnection();
    console.log('✅ Database connection successful');
    
    // Log loaded configurations
    console.log('📚 Loading configurations...');
    console.log('Environment:', config.server.environment);
    console.log('Database Host:', config.database.host);
    console.log('Database Name:', config.database.database);
    
    console.log('🌐 Starting HTTP server...');
    
    // Start HTTP server
    const server = app.listen(config.server.port, config.server.host);
    
    // Wait for server to start
    await new Promise((resolve, reject) => {
      server.once('error', (err) => {
        console.error('Failed to start server:', err);
        reject(err);
      });
      
      server.once('listening', () => {
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
        
        resolve();
      });
    });

    console.log('🔌 Initializing WebSocket server...');
    
    try {
      // Initialize WebSocket server
      socketService.initialize(server);
      console.log('✅ WebSocket server initialized successfully');
    } catch (error) {
      console.warn('⚠️ WebSocket initialization failed:', error.message);
      logger.warn('WebSocket initialization failed', {
        error: error.message,
        stack: error.stack
      });
      // Continue server startup even if WebSocket fails
    }
    
    // Initialize system monitoring and logging
    console.log('📊 Initializing system monitoring...');
    await startupService.initialize();
    console.log('✅ System monitoring initialized');
    
    console.log('✅ Server initialization completed successfully');

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      
      try {
        // Shutdown system monitoring
        await startupService.shutdown();
      } catch (error) {
        logger.error('Error during system monitoring shutdown:', error);
      }
      
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
    console.error('❌ Failed to start server:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Log more details about the error
    if (error.code) console.error('Error code:', error.code);
    if (error.errno) console.error('Error number:', error.errno);
    if (error.syscall) console.error('System call:', error.syscall);
    if (error.address) console.error('Address:', error.address);
    if (error.port) console.error('Port:', error.port);
    
    logger.error('Failed to start server', {
      error: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port,
      stack: error.stack,
    });
    
    // Give time for logs to be written
    setTimeout(() => process.exit(1), 1000);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('Stack trace:', error.stack);
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  logger.error('Unhandled Rejection at:', {
    promise: promise,
    reason: reason,
  });
  // Log but don't exit immediately to allow graceful handling
  console.error('Stack trace:', reason?.stack);
});

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  logger.error('Failed to start server:', {
    error: error.message,
    stack: error.stack
  });
  // Give logger time to write before exiting
  setTimeout(() => process.exit(1), 1000);
}); 