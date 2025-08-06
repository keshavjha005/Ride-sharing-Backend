const express = require('express');
const router = express.Router();
const AdminAuthController = require('../controllers/adminAuthController');
const DashboardController = require('../controllers/dashboardController');
const { adminAuth, adminRoleAuth } = require('../middleware/adminAuth');

// Admin authentication routes (no auth required)
router.post('/auth/login', AdminAuthController.login);
router.post('/auth/logout', adminAuth, AdminAuthController.logout);
router.post('/auth/refresh', AdminAuthController.refreshToken);

// Admin profile routes (auth required)
router.get('/auth/profile', adminAuth, AdminAuthController.getProfile);
router.put('/auth/profile', adminAuth, AdminAuthController.updateProfile);

// Dashboard routes (auth required)
router.get('/dashboard/overview', adminAuth, DashboardController.getOverview);
router.get('/dashboard/analytics', adminAuth, DashboardController.getAnalytics);
router.get('/dashboard/widgets', adminAuth, DashboardController.getWidgets);
router.put('/dashboard/layout', adminAuth, DashboardController.updateLayout);
router.get('/dashboard/live-stats', adminAuth, DashboardController.getLiveStats);
router.get('/dashboard/recent-activity', adminAuth, (req, res) => {
    DashboardController.getRecentActivity(15).then(activity => {
        res.json({
            success: true,
            data: activity
        });
    }).catch(error => {
        res.status(500).json({
            success: false,
            message: 'Error fetching recent activity'
        });
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