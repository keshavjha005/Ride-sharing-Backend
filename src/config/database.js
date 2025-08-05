const mysql = require('mysql2/promise');
const config = require('./index');
const logger = require('../utils/logger');

// Create connection pool
const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  port: config.database.port,
  connectionLimit: config.database.connectionLimit,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.startup('Database connection established successfully');
    connection.release();
    return true;
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message,
      code: error.code,
      errno: error.errno,
    });
    throw error;
  }
};

// Execute query with logging
const executeQuery = async (query, params = []) => {
  const startTime = Date.now();
  
  try {
    const [rows] = await pool.execute(query, params);
    const duration = Date.now() - startTime;
    
    logger.database('SELECT', 'query', duration, {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      params: params.length > 0 ? params : undefined,
      rowCount: Array.isArray(rows) ? rows.length : 1,
    });
    
    return rows;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Database query failed', {
      error: error.message,
      code: error.code,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      params: params.length > 0 ? params : undefined,
      duration: `${duration}ms`,
    });
    
    throw error;
  }
};

// Execute transaction
const executeTransaction = async (queries) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params = [] } of queries) {
      const [rows] = await connection.execute(query, params);
      results.push(rows);
    }
    
    await connection.commit();
    logger.database('TRANSACTION', 'multiple', 0, {
      queryCount: queries.length,
    });
    
    return results;
  } catch (error) {
    await connection.rollback();
    logger.error('Database transaction failed', {
      error: error.message,
      code: error.code,
    });
    throw error;
  } finally {
    connection.release();
  }
};

// Get connection from pool
const getConnection = async () => {
  return await pool.getConnection();
};

// Close all connections
const closePool = async () => {
  await pool.end();
  logger.info('Database connection pool closed');
};

// Health check
const healthCheck = async () => {
  try {
    await executeQuery('SELECT 1 as health_check');
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
};

// Export database utilities
module.exports = {
  pool,
  testConnection,
  executeQuery,
  executeTransaction,
  getConnection,
  closePool,
  healthCheck,
}; 