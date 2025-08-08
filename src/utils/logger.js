const winston = require('winston');
const path = require('path');
require('dotenv').config();

// Get environment variables directly to avoid circular dependency
const environment = process.env.NODE_ENV || 'development';
const logLevel = process.env.LOG_LEVEL || 'info';
const logFile = process.env.LOG_FILE || path.join(__dirname, '../../logs/app.log');
const appVersion = process.env.APP_VERSION || '1.0.0';

// Helper function to handle circular references in objects
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
};

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      // Handle circular references in meta objects
      const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return '[Circular]';
            }
            seen.add(value);
          }
          return value;
        };
      };
      log += `\n${JSON.stringify(meta, getCircularReplacer(), 2)}`;
    }
    
    return log;
  })
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      // Handle circular references in meta objects
      const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return '[Circular]';
            }
            seen.add(value);
          }
          return value;
        };
      };
      log += `\n${JSON.stringify(meta, getCircularReplacer(), 2)}`;
    }
    
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: {
    service: 'mate-backend',
    environment: environment,
    version: appVersion,
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
      level: environment === 'production' ? 'info' : 'debug',
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logFile, '../exceptions.log'),
      format: logFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logFile, '../rejections.log'),
      format: logFormat,
    }),
  ],
});

// Add file transport for production
if (environment === 'production') {
  logger.add(
    new winston.transports.File({
      filename: logFile,
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  
  // Error file transport
  logger.add(
    new winston.transports.File({
      filename: path.join(logFile, '../error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Helper methods
logger.startup = (message, meta = {}) => {
  logger.info(`🚀 ${message}`, { ...meta, type: 'startup' });
};

logger.request = (req, res, responseTime) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    type: 'request',
  });
};

logger.database = (operation, table, duration, meta = {}) => {
  logger.info(`Database ${operation}`, {
    operation,
    table,
    duration: `${duration}ms`,
    ...meta,
    type: 'database',
  });
};

logger.auth = (action, userId, meta = {}) => {
  logger.info(`Authentication ${action}`, {
    action,
    userId,
    ...meta,
    type: 'authentication',
  });
};

logger.security = (event, meta = {}) => {
  logger.warn(`Security Event: ${event}`, {
    event,
    ...meta,
    type: 'security',
  });
};

logger.business = (action, meta = {}) => {
  logger.info(`Business Logic: ${action}`, {
    action,
    ...meta,
    type: 'business',
  });
};

// Export the logger
module.exports = logger; 