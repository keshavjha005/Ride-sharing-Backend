const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('../swaggerDef');

// Load environment variables
dotenv.config();

// Import configurations
const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const metricsMiddleware = require('./middleware/metricsMiddleware');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const languageRoutes = require('./routes/languages');
const currencyRoutes = require('./routes/currencies');
const localizationRoutes = require('./routes/localization');
const uploadRoutes = require('./routes/upload');
const healthRoutes = require('./routes/health');
const vehicleRoutes = require('./routes/vehicles');
const locationRoutes = require('./routes/location');
const rideRoutes = require('./routes/rides');
const searchRoutes = require('./routes/search');
const bookingRoutes = require('./routes/bookings');
const socketRoutes = require('./routes/socket');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');
const rideStatusRoutes = require('./routes/ride-status');
const inboxRoutes = require('./routes/inbox');
const walletRoutes = require('./routes/wallet');
const paymentRoutes = require('./routes/payments');
const pricingRoutes = require('./routes/pricing');
const transactionRoutes = require('./routes/transactions');
const withdrawalRoutes = require('./routes/withdrawals');
const adminRoutes = require('./routes/admin');
const verificationRoutes = require('./routes/verification');

// Create Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Compression middleware
if (config.features.enableCompression) {
  app.use(compression());
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (config.features.enableLogging) {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Metrics tracking middleware
app.use(metricsMiddleware);

// Rate limiting
if (config.features.enableRateLimiting) {
  const isDevelopment = config.server.environment === 'development';
  
  // Different rate limits for different route types
  const createLimiter = (maxRequests, windowMs = 900000) => rateLimit({
    windowMs: windowMs,
    max: maxRequests,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Admin auth routes - more lenient in development
  const adminAuthLimiter = createLimiter(
    isDevelopment ? 100 : 50, // 100 requests per 15 minutes in dev, 50 in prod
    900000 // 15 minutes
  );
  
  // General API routes
  const generalLimiter = createLimiter(
    isDevelopment ? 1000 : config.rateLimit.maxRequests,
    config.rateLimit.windowMs
  );
  
  // Apply specific rate limiting for admin auth routes
  app.use('/api/admin/auth/', adminAuthLimiter);
  
  // Apply general rate limiting to all other API routes
  app.use('/api/', generalLimiter);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0',
  });
});

// Swagger documentation
// Swagger documentation
if (config.features.enableSwagger) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Mate Backend API Documentation',
  }));
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/localization', localizationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/socket', socketRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', notificationRoutes);
app.use('/api/rides', rideStatusRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api', transactionRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verification', verificationRoutes);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Mate Backend API',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV,
    documentation: '/api/docs',
    health: '/health',
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log but don't exit immediately to allow graceful handling
  console.error('Unhandled Rejection:', reason);
});

module.exports = app; 