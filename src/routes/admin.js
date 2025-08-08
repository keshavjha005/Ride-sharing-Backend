const express = require('express');
const router = express.Router();
const AdminAuthController = require('../controllers/adminAuthController');
const DashboardController = require('../controllers/dashboardController');
const UserManagementController = require('../controllers/userManagementController');
const UserReportsController = require('../controllers/userReportsController');
const RideManagementController = require('../controllers/rideManagementController');
const RideDisputesController = require('../controllers/rideDisputesController');
const AdminLocalizationController = require('../controllers/adminLocalizationController');
const SystemSettingsController = require('../controllers/systemSettingsController');
const SystemMonitoringController = require('../controllers/systemMonitoringController');
const systemMonitoringController = new SystemMonitoringController();
const ReportingController = require('../controllers/reportingController');
const AdminManagementController = require('../controllers/adminManagementController');
const AdminPricingController = require('../controllers/adminPricingController');
const AdminVehicleController = require('../controllers/adminVehicleController');
const NotificationController = require('../controllers/notificationController');
const { adminAuth, adminRoleAuth, adminPermissionAuth } = require('../middleware/adminAuth');

// Define required permissions for different operations
const PERMISSIONS = {
  ADMIN_MANAGEMENT: 'admin_management',
  USER_MANAGEMENT: 'user_management',
  RIDE_MANAGEMENT: 'ride_management',
  SYSTEM_SETTINGS: 'system_settings',
  PRICING_MANAGEMENT: 'pricing_management',
  REPORTING: 'reporting'
};

// Admin authentication routes (no auth required)
router.post('/auth/login', AdminAuthController.login);
router.post('/auth/refresh', AdminAuthController.refreshToken);
router.post('/auth/logout', AdminAuthController.logout);

// Admin profile routes (admin auth required)
router.get('/auth/profile', adminAuth, AdminAuthController.getProfile);
router.put('/auth/profile', adminAuth, AdminAuthController.updateProfile);
router.put('/auth/change-password', adminAuth, AdminAuthController.changePassword);

// Admin dashboard routes (admin auth required)
router.get('/dashboard/overview', adminAuth, DashboardController.getOverview);
router.get('/dashboard/analytics', adminAuth, DashboardController.getAnalytics);
router.put('/dashboard/layout', adminAuth, DashboardController.updateLayout);

// Admin Management routes (super admin only)
router.get('/admin-management', 
  adminAuth, 
  adminRoleAuth('super_admin'),
  adminPermissionAuth(PERMISSIONS.ADMIN_MANAGEMENT), 
  AdminManagementController.getAdmins
);
router.get('/admin-management/roles-permissions', 
  adminAuth, 
  adminRoleAuth('super_admin'),
  adminPermissionAuth(PERMISSIONS.ADMIN_MANAGEMENT), 
  AdminManagementController.getRolesAndPermissions
);
router.get('/admin-management/stats', 
  adminAuth, 
  adminRoleAuth('super_admin'),
  adminPermissionAuth(PERMISSIONS.ADMIN_MANAGEMENT), 
  AdminManagementController.getAdminStats
);
router.get('/admin-management/:id', 
  adminAuth, 
  adminRoleAuth('super_admin'),
  adminPermissionAuth(PERMISSIONS.ADMIN_MANAGEMENT), 
  AdminManagementController.getAdminById
);
router.post('/admin-management', 
  adminAuth, 
  adminRoleAuth('super_admin'),
  adminPermissionAuth(PERMISSIONS.ADMIN_MANAGEMENT), 
  AdminManagementController.createAdmin
);
router.put('/admin-management/:id', 
  adminAuth, 
  adminRoleAuth('super_admin'),
  adminPermissionAuth(PERMISSIONS.ADMIN_MANAGEMENT), 
  AdminManagementController.updateAdmin
);
router.delete('/admin-management/:id', 
  adminAuth, 
  adminRoleAuth('super_admin'),
  adminPermissionAuth(PERMISSIONS.ADMIN_MANAGEMENT), 
  AdminManagementController.deleteAdmin
);
router.put('/admin-management/:id/toggle-status', 
  adminAuth, 
  adminRoleAuth('super_admin'),
  adminPermissionAuth(PERMISSIONS.ADMIN_MANAGEMENT), 
  AdminManagementController.toggleAdminStatus
);

// User Management routes (admin auth required)
router.get('/users', adminAuth, UserManagementController.getUsers);
router.get('/users/:id', adminAuth, UserManagementController.getUserById);
router.put('/users/:id', adminAuth, UserManagementController.updateUser);
router.delete('/users/:id', adminAuth, UserManagementController.deleteUser);
router.post('/users/:id/verify', adminAuth, UserManagementController.verifyUser);
router.post('/users/:id/block', adminAuth, UserManagementController.toggleUserStatus);
router.get('/users/:id/analytics', adminAuth, UserManagementController.getUserAnalytics);
router.get('/users/summary', adminAuth, UserManagementController.getSummary);
router.get('/users/export', adminAuth, UserManagementController.exportUsers);

// User Reports routes (admin auth required)
router.get('/user-reports', adminAuth, UserReportsController.getReports);
router.get('/user-reports/:id', adminAuth, UserReportsController.getReportById);
router.put('/user-reports/:id/status', adminAuth, UserReportsController.updateReportStatus);
router.post('/user-reports/:id/response', adminAuth, UserReportsController.updateAdminNotes);

// Ride Management routes (admin auth required)
router.get('/rides', adminAuth, RideManagementController.getRides);
router.get('/rides/export', adminAuth, RideManagementController.exportRides);
router.get('/rides/:id', adminAuth, RideManagementController.getRideById);
router.put('/rides/:id/status', adminAuth, RideManagementController.updateRideStatus);
router.get('/rides/:id/analytics', adminAuth, RideManagementController.getRideAnalytics);
router.delete('/rides/:id', adminAuth, RideManagementController.deleteRide);

// Ride Disputes routes (admin auth required)
// router.get('/ride-disputes', adminAuth, RideDisputesController.getDisputes);
// router.get('/ride-disputes/:id', adminAuth, RideDisputesController.getDisputeById);
// router.put('/ride-disputes/:id/status', adminAuth, RideDisputesController.updateDisputeStatus);
// router.post('/ride-disputes/:id/resolution', adminAuth, RideDisputesController.addDisputeResolution);

// Localization Management routes (admin auth required)
router.get('/localized-content', adminAuth, AdminLocalizationController.getAdminLocalizedContent);
router.post('/localized-content', adminAuth, AdminLocalizationController.createAdminLocalizedContent);
router.put('/localized-content/:id', adminAuth, AdminLocalizationController.updateAdminLocalizedContent);
router.delete('/localized-content/:id', adminAuth, AdminLocalizationController.deleteAdminLocalizedContent);
// router.get('/language-settings', adminAuth, AdminLocalizationController.getLanguageSettings);
// router.put('/language-settings', adminAuth, AdminLocalizationController.updateLanguageSettings);
// router.get('/translations', adminAuth, AdminLocalizationController.getTranslationManagement);
// router.post('/translations', adminAuth, AdminLocalizationController.createTranslationRequest);
// router.put('/translations/:id', adminAuth, AdminLocalizationController.updateTranslation);

// System Configuration routes (admin auth required)
router.get('/system-settings', 
  adminAuth, 
  adminPermissionAuth(PERMISSIONS.SYSTEM_SETTINGS), 
  SystemSettingsController.getSettings
);
router.get('/system-settings/:key', 
  adminAuth, 
  adminPermissionAuth(PERMISSIONS.SYSTEM_SETTINGS), 
  SystemSettingsController.getSetting
);
router.put('/system-settings/:key', 
  adminAuth, 
  adminPermissionAuth(PERMISSIONS.SYSTEM_SETTINGS), 
  SystemSettingsController.updateSetting
);

// System Monitoring routes (admin auth required)
router.get('/system-monitoring/health', 
  adminAuth, 
  systemMonitoringController.getSystemHealth.bind(systemMonitoringController)
);
router.get('/system-monitoring/metrics', 
  adminAuth, 
  systemMonitoringController.getSystemMetrics.bind(systemMonitoringController)
);
router.get('/system-monitoring/logs', 
  adminAuth, 
  systemMonitoringController.getSystemLogs.bind(systemMonitoringController)
);
router.get('/system-monitoring/audit-logs', 
  adminAuth, 
  systemMonitoringController.getAuditLogs.bind(systemMonitoringController)
);

// Reporting routes (admin auth required)
router.get('/scheduled-reports', adminAuth, adminPermissionAuth(PERMISSIONS.REPORTING), ReportingController.getScheduledReports);
router.post('/scheduled-reports', adminAuth, adminPermissionAuth(PERMISSIONS.REPORTING), ReportingController.createScheduledReport);
router.put('/scheduled-reports/:id', adminAuth, adminPermissionAuth(PERMISSIONS.REPORTING), ReportingController.updateScheduledReport);
router.delete('/scheduled-reports/:id', adminAuth, adminPermissionAuth(PERMISSIONS.REPORTING), ReportingController.deleteScheduledReport);
router.post('/reports/generate', adminAuth, adminPermissionAuth(PERMISSIONS.REPORTING), ReportingController.generateReport);

// Admin Notification routes (admin auth required)
router.get('/notifications', adminAuth, NotificationController.getAdminNotifications);
router.put('/notifications/mark-all-read', adminAuth, NotificationController.markAllNotificationsAsRead);
router.put('/notifications/:id/read', adminAuth, NotificationController.markNotificationAsRead);

// Admin Pricing Management routes (admin auth required)
router.get('/pricing/dashboard', adminAuth, AdminPricingController.getPricingDashboard);
router.get('/pricing/vehicle-types', adminAuth, AdminPricingController.getVehicleTypesManagement);
router.put('/pricing/vehicle-types/:id', adminAuth, AdminPricingController.updateVehicleTypePricing);
router.get('/pricing/multipliers', adminAuth, AdminPricingController.getMultipliersManagement);
router.post('/pricing/multipliers', adminAuth, AdminPricingController.createMultiplier);
router.put('/pricing/multipliers/:id', adminAuth, AdminPricingController.updateMultiplier);
router.delete('/pricing/multipliers/:id', adminAuth, AdminPricingController.deleteMultiplier);
router.get('/pricing/events', adminAuth, AdminPricingController.getEventsManagement);
router.post('/pricing/events', adminAuth, AdminPricingController.createEvent);
router.put('/pricing/events/:id', adminAuth, AdminPricingController.updateEvent);
router.delete('/pricing/events/:id', adminAuth, AdminPricingController.deleteEvent);
router.get('/pricing/analytics', adminAuth, AdminPricingController.getPricingAnalytics);
router.post('/pricing/bulk-update', adminAuth, adminPermissionAuth('pricing_management'), AdminPricingController.bulkUpdatePricing);
router.get('/pricing/export', adminAuth, AdminPricingController.exportPricingData);

// Admin Vehicle Management routes (admin auth required)
router.use('/vehicles', require('./adminVehicles'));

module.exports = router; 