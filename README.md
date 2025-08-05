# Mate Backend - Ride-Sharing Platform

A comprehensive Node.js backend for the Mate ride-sharing/carpooling platform, featuring multi-language support (English/Arabic), multi-currency system, real-time communication, and advanced admin panel.

## 🚀 Features

### Core Features
- **Multi-language Support**: English & Arabic with RTL support
- **Multi-currency System**: Per-kilometer pricing with dynamic event-based pricing
- **Real-time Communication**: WebSocket-based chat system
- **Feature Toggle System**: Platform-specific feature management
- **Advanced Authentication**: JWT with refresh tokens
- **File Upload System**: Secure cloud storage integration
- **Admin Panel**: Comprehensive management interface

### Technical Stack
- **Backend**: Node.js + Express.js
- **Database**: MySQL 8.0
- **Real-time**: Socket.io
- **Authentication**: JWT + bcrypt
- **File Storage**: Multer + Cloud Storage
- **Payment**: Stripe/PayPal integration
- **Maps**: Google Maps API
- **Email/SMS**: SendGrid/Twilio
- **Caching**: Redis
- **Documentation**: Swagger/OpenAPI

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL 8.0
- Redis (for caching)
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mate-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE mate_app;
   
   # Run migrations
   npm run migrate
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📁 Project Structure

```
mate-backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── app.js          # Express app setup
├── docs/               # Documentation
├── tests/              # Test files
├── uploads/            # File uploads
└── package.json
```

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts and profiles
- `languages` - Supported languages
- `currencies` - Supported currencies
- `localized_content` - Multi-language content
- `user_settings` - User preferences
- `admin_users` - Admin accounts
- `system_settings` - Application settings

### Feature Tables
- `feature_toggle` - Feature flags
- `vehicle_types` - Vehicle categories with pricing
- `pricing_events` - Dynamic pricing rules
- `commission_settings` - Admin commission rules

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Password reset

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Localization
- `GET /api/languages` - Get supported languages
- `GET /api/currencies` - Get supported currencies
- `GET /api/localization/content` - Get localized content
- `PUT /api/users/language` - Update user language
- `PUT /api/users/currency` - Update user currency

### File Upload
- `POST /api/upload/image` - Upload image
- `POST /api/upload/document` - Upload document
- `DELETE /api/upload/:fileId` - Delete file

## 🔧 Configuration

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=mate_app
DB_PORT=3306

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# File Upload
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# Email
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@mate.com

# SMS
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number

# Maps
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Payment
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "User API"

# Run tests in watch mode
npm run test:watch
```

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Sprint Planning](./docs/sprints/)
- [Deployment Guide](./docs/deployment.md)

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   PORT=3000
   # Configure all production environment variables
   ```

2. **Database Migration**
   ```bash
   npm run migrate:prod
   ```

3. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   ```

4. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Email: support@mate.com
- Documentation: [docs.mate.com](https://docs.mate.com)
- Issues: [GitHub Issues](https://github.com/your-org/mate-backend/issues)

## 🗺️ Roadmap

### Sprint 1: Foundation & Authentication ✅
- [x] Backend setup and configuration
- [x] Database schema design
- [x] JWT authentication system
- [x] User management APIs
- [x] Multi-language support
- [x] File upload system

### Sprint 2: Core Ride Management 🔄
- [ ] Ride creation and management APIs
- [ ] Search and filtering functionality
- [ ] Booking system implementation
- [ ] Vehicle management system
- [ ] Location and mapping integration

### Sprint 3: Real-time Communication 📋
- [ ] WebSocket server setup
- [ ] Real-time chat system
- [ ] Push notification system
- [ ] Live ride status updates

### Sprint 4: Financial System 📋
- [ ] Wallet management system
- [ ] Payment gateway integration
- [ ] Transaction processing
- [ ] Commission handling

### Sprint 5: Admin Panel 📋
- [ ] Admin authentication
- [ ] Dashboard and analytics
- [ ] User management interface
- [ ] System monitoring

### Sprint 6: Integration & Deployment 📋
- [ ] Mobile app integration
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Production deployment 