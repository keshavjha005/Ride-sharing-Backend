const express = require('express');
const router = express.Router();
const AdminAuthController = require('../controllers/adminAuthController');
const DashboardController = require('../controllers/dashboardController');
const UserManagementController = require('../controllers/userManagementController');
const UserReportsController = require('../controllers/userReportsController');
const RideManagementController = require('../controllers/rideManagementController');
const RideDisputesController = require('../controllers/rideDisputesController');
const AdminLocalizationController = require('../controllers/adminLocalizationController');
const SystemConfigController = require('../controllers/systemConfigController');
const ReportingController = require('../controllers/reportingController');
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

// User Management routes (auth required)
router.get('/users', adminAuth, UserManagementController.getUsers);
router.get('/users/summary', adminAuth, UserManagementController.getSummary);
router.get('/users/export', adminAuth, UserManagementController.exportUsers);
router.get('/users/:id', adminAuth, UserManagementController.getUserById);
router.put('/users/:id', adminAuth, UserManagementController.updateUser);
router.delete('/users/:id', adminAuth, UserManagementController.deleteUser);
router.post('/users/:id/verify', adminAuth, UserManagementController.verifyUser);
router.post('/users/:id/block', adminAuth, UserManagementController.toggleUserStatus);
router.get('/users/:id/analytics', adminAuth, UserManagementController.getUserAnalytics);

// User Reports routes (auth required)
router.get('/user-reports', adminAuth, UserReportsController.getReports);
router.get('/user-reports/summary', adminAuth, UserReportsController.getReportsSummary);
router.get('/user-reports/recent', adminAuth, UserReportsController.getRecentReports);
router.get('/user-reports/export', adminAuth, UserReportsController.exportReports);
router.get('/user-reports/:id', adminAuth, UserReportsController.getReportById);
router.post('/user-reports', adminAuth, UserReportsController.createReport);
router.put('/user-reports/:id/status', adminAuth, UserReportsController.updateReportStatus);
router.post('/user-reports/bulk-update', adminAuth, UserReportsController.bulkUpdateReports);
router.get('/users/:userId/reports', adminAuth, UserReportsController.getReportsByUserId);

// Ride Management routes (auth required)
router.get('/rides', adminAuth, RideManagementController.getRides);
router.get('/rides/summary', adminAuth, RideManagementController.getSummary);
router.get('/rides/:id', adminAuth, RideManagementController.getRideById);
router.put('/rides/:id/status', adminAuth, RideManagementController.updateRideStatus);
router.delete('/rides/:id', adminAuth, RideManagementController.deleteRide);
router.get('/rides/active', adminAuth, RideManagementController.getActiveRides);
router.get('/rides/completed', adminAuth, RideManagementController.getCompletedRides);
router.get('/rides/cancelled', adminAuth, RideManagementController.getCancelledRides);
router.get('/rides/analytics', adminAuth, RideManagementController.getRideAnalytics);
router.get('/rides/export', adminAuth, RideManagementController.exportRides);

// Ride Disputes routes (auth required)
router.get('/ride-disputes', adminAuth, RideDisputesController.getDisputes);
router.get('/ride-disputes/summary', adminAuth, RideDisputesController.getDisputesSummary);
router.get('/ride-disputes/recent', adminAuth, RideDisputesController.getRecentDisputes);
router.get('/ride-disputes/export', adminAuth, RideDisputesController.exportDisputes);
router.get('/ride-disputes/:id', adminAuth, RideDisputesController.getDisputeById);
router.post('/ride-disputes', adminAuth, RideDisputesController.createDispute);
router.put('/ride-disputes/:id/resolve', adminAuth, RideDisputesController.resolveDispute);
router.get('/ride-disputes/status/:status', adminAuth, RideDisputesController.getDisputesByStatus);
router.get('/ride-disputes/type/:type', adminAuth, RideDisputesController.getDisputesByType);
router.get('/rides/:rideId/disputes', adminAuth, RideDisputesController.getDisputesByRideId);

// Localization Management routes (auth required)
router.get('/localized-content', adminAuth, AdminLocalizationController.getAdminLocalizedContent);
router.post('/localized-content', adminAuth, AdminLocalizationController.createAdminLocalizedContent);
router.put('/localized-content/:id', adminAuth, AdminLocalizationController.updateAdminLocalizedContent);
router.delete('/localized-content/:id', adminAuth, AdminLocalizationController.deleteAdminLocalizedContent);

// Language Settings routes
router.get('/language-settings', adminAuth, AdminLocalizationController.getLanguageSettings);
router.put('/language-settings/:language_code', adminAuth, AdminLocalizationController.updateLanguageSettings);

// Translation Management routes
router.get('/translations', adminAuth, AdminLocalizationController.getTranslationManagement);
router.post('/translations', adminAuth, AdminLocalizationController.createTranslationRequest);
router.put('/translations/:id', adminAuth, AdminLocalizationController.updateTranslation);
router.get('/translations/pending', adminAuth, AdminLocalizationController.getPendingTranslations);
router.put('/translations/:id/approve', adminAuth, AdminLocalizationController.approveTranslation);

// Content export/import routes
router.get('/localized-content/export', adminAuth, AdminLocalizationController.exportLocalizedContent);

// Admin language preferences
router.get('/profile/language', adminAuth, AdminLocalizationController.getAdminLanguagePreference);
router.put('/profile/language', adminAuth, AdminLocalizationController.updateAdminLanguagePreference);

// System Configuration routes (auth required)
router.get('/system-settings', adminAuth, SystemConfigController.getSystemSettings);
router.post('/system-settings', adminAuth, SystemConfigController.createSystemSetting);
router.put('/system-settings/:key', adminAuth, SystemConfigController.updateSystemSetting);
router.delete('/system-settings/:key', adminAuth, SystemConfigController.deleteSystemSetting);

// System Settings Categories
router.get('/system-settings/categories', adminAuth, SystemConfigController.getSystemSettingsCategories);
router.get('/system-settings/category/:category', adminAuth, SystemConfigController.getSystemSettingsByCategory);

// Feature Flags routes
router.get('/feature-flags', adminAuth, SystemConfigController.getFeatureFlags);
router.post('/feature-flags', adminAuth, SystemConfigController.createFeatureFlag);
router.put('/feature-flags/:id', adminAuth, SystemConfigController.updateFeatureFlag);
router.delete('/feature-flags/:id', adminAuth, SystemConfigController.deleteFeatureFlag);

// System Health routes
router.get('/system-health', adminAuth, SystemConfigController.getSystemHealth);
router.get('/system-health/logs', adminAuth, SystemConfigController.getSystemHealthLogs);
router.post('/system-health/check', adminAuth, SystemConfigController.checkSystemHealth);

// Reporting & Analytics routes (auth required)
router.post('/reports/generate', adminAuth, ReportingController.generateReport);
router.get('/scheduled-reports', adminAuth, ReportingController.getScheduledReports);
router.post('/scheduled-reports', adminAuth, ReportingController.createScheduledReport);
router.put('/scheduled-reports/:id', adminAuth, ReportingController.updateScheduledReport);
router.delete('/scheduled-reports/:id', adminAuth, ReportingController.deleteScheduledReport);

// Analytics routes
router.get('/analytics', adminAuth, ReportingController.getAnalytics);

// Export routes
router.get('/export', adminAuth, ReportingController.exportData);

// Health check route
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Admin API is running',
        timestamp: new Date().toISOString()
    });
});

module.exports = router; 