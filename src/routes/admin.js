const express = require('express');
const router = express.Router();
const AdminAuthController = require('../controllers/adminAuthController');
const { adminAuth, adminRoleAuth } = require('../middleware/adminAuth');

// Admin authentication routes (no auth required)
router.post('/auth/login', AdminAuthController.login);
router.post('/auth/logout', adminAuth, AdminAuthController.logout);
router.post('/auth/refresh', AdminAuthController.refreshToken);

// Admin profile routes (auth required)
router.get('/auth/profile', adminAuth, AdminAuthController.getProfile);
router.put('/auth/profile', adminAuth, AdminAuthController.updateProfile);

// Dashboard routes (auth required)
router.get('/dashboard/overview', adminAuth, (req, res) => {
    // Mock dashboard data for now
    res.json({
        success: true,
        data: {
            totalUsers: 1247,
            activeRides: 23,
            totalRevenue: 45678.90,
            growthRate: 12.5,
            recentActivity: [
                {
                    id: 1,
                    type: 'user_registration',
                    message: 'New user registered: john.doe@example.com',
                    time: '2 minutes ago'
                },
                {
                    id: 2,
                    type: 'ride_completed',
                    message: 'Ride completed: Trip #12345',
                    time: '5 minutes ago'
                }
            ]
        }
    });
});

// Health check route
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Admin API is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router; 