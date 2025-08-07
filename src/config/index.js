const path = require('path');
require('dotenv').config();

// Environment configuration
const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0',
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mate_app',
    port: parseInt(process.env.DB_PORT) || 3306,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.APP_NAME || 'Mate',
    audience: process.env.APP_URL || 'http://localhost:3000',
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  },

  // File upload configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    uploadPath: path.join(__dirname, '../../uploads'),
    tempPath: path.join(__dirname, '../../uploads/temp'),
  },

  // AWS S3 configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET,
    s3Endpoint: process.env.AWS_S3_ENDPOINT,
  },

  // Email configuration (SendGrid)
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.EMAIL_FROM || 'noreply@mate.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Mate App',
  },

  // SMS configuration (Twilio)
  sms: {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },

  // Google Maps configuration
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
  },

  // Payment configuration (Stripe)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  // PayPal configuration
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE || 'sandbox',
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-key',
    sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 hours
  },

  // Admin configuration
  admin: {
    jwtSecret: process.env.ADMIN_JWT_SECRET || 'your-admin-secret-key-change-this-in-production',
    jwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '24h',
    sessionSecret: process.env.ADMIN_SESSION_SECRET || 'your-admin-session-secret',
    defaultRole: 'admin',
    defaultPermissions: {
      users: ['read', 'write'],
      rides: ['read', 'write'],
      analytics: ['read'],
      settings: ['read', 'write'],
      reports: ['read', 'write'],
      admin_management: ['read', 'write']
    }
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || path.join(__dirname, '../../logs/app.log'),
  },

  // Feature flags
  features: {
    enableSwagger: process.env.ENABLE_SWAGGER === 'true',
    enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    enableLogging: process.env.ENABLE_LOGGING !== 'false',
    enableMonitoring: process.env.ENABLE_MONITORING === 'true',
  },

  // Default settings
  defaults: {
    language: process.env.DEFAULT_LANGUAGE || 'en',
    currency: process.env.DEFAULT_CURRENCY || 'USD',
    timezone: process.env.DEFAULT_TIMEZONE || 'UTC',
  },

  // Default admin credentials
  defaultAdmin: {
    email: process.env.ADMIN_EMAIL || 'admin@mate.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },

  // Monitoring configuration
  monitoring: {
    enabled: process.env.ENABLE_MONITORING === 'true',
    port: parseInt(process.env.MONITORING_PORT) || 9090,
  },
};

// Validation function
const validateConfig = () => {
  const required = [
    'database.host',
    'database.user',
    'database.database',
    'jwt.secret',
    'jwt.refreshSecret',
  ];

  const missing = required.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj && obj[k], config);
    return !value;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  return true;
};

// Validate configuration on load
if (config.server.environment === 'production') {
  validateConfig();
}

module.exports = config; 