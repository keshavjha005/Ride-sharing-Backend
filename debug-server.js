console.log('Starting debug server...');

try {
  console.log('Loading dotenv...');
  require('dotenv').config();
  console.log('✅ dotenv loaded');
  
  console.log('Loading config...');
  const config = require('./src/config');
  console.log('✅ config loaded:', config.server);
  
  console.log('Loading logger...');
  const logger = require('./src/utils/logger');
  console.log('✅ logger loaded');
  
  console.log('Loading database...');
  const { testConnection } = require('./src/config/database');
  console.log('✅ database module loaded');
  
  console.log('Loading app...');
  const app = require('./src/app');
  console.log('✅ app loaded');
  
  console.log('Starting server...');
  const server = app.listen(config.server.port, config.server.host, () => {
    console.log(`🚀 Server running on http://${config.server.host}:${config.server.port}`);
    console.log(`📊 Health Check: http://${config.server.host}:${config.server.port}/health`);
  });
  
} catch (error) {
  console.error('❌ Error starting server:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
} 