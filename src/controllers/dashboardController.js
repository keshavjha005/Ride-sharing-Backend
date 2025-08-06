const DashboardWidget = require('../models/DashboardWidget');
const DashboardLayout = require('../models/DashboardLayout');
const db = require('../config/database');

class DashboardController {
    /**
     * Get dashboard overview with analytics
     */
    static async getOverview(req, res) {
        try {
            const language = req.admin?.language_code || 'en';
            
            // Get real-time statistics
            const stats = await DashboardController.getRealTimeStats();
            
            // Get recent activity
            const recentActivity = await DashboardController.getRecentActivity();
            
            // Get dashboard layout with widgets
            const layout = await DashboardLayout.getLayoutWithWidgets(req.admin.id, language);
            
            res.json({
                success: true,
                data: {
                    stats,
                    recentActivity,
                    layout,
                    lastUpdated: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Dashboard overview error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching dashboard overview'
            });
        }
    }

    /**
     * Get real-time statistics
     */
    static async getRealTimeStats() {
        try {
            // Get total users
            const [totalUsersResult] = await db.executeQuery('SELECT COUNT(*) as count FROM users WHERE is_deleted IS NULL');
            const totalUsers = totalUsersResult.count;

            // Get active rides
            const [activeRidesResult] = await db.executeQuery(`
                SELECT COUNT(*) as count FROM rides 
                WHERE status IN ('confirmed', 'started', 'in_progress')
            `);
            const activeRides = activeRidesResult.count;

            // Get today's revenue
            const [todayRevenueResult] = await db.executeQuery(`
                SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions 
                WHERE DATE(created_at) = CURDATE() AND status = 'completed'
            `);
            const todayRevenue = parseFloat(todayRevenueResult.total);

            // Get total revenue
            const [totalRevenueResult] = await db.executeQuery(`
                SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions 
                WHERE status = 'completed'
            `);
            const totalRevenue = parseFloat(totalRevenueResult.total);

            // Get new users today
            const [newUsersResult] = await db.executeQuery(`
                SELECT COUNT(*) as count FROM users 
                WHERE DATE(created_at) = CURDATE() AND is_deleted IS NULL
            `);
            const newUsersToday = newUsersResult.count;

            // Get completed rides today
            const [completedRidesResult] = await db.executeQuery(`
                SELECT COUNT(*) as count FROM rides 
                WHERE DATE(updated_at) = CURDATE() AND status = 'completed'
            `);
            const completedRidesToday = completedRidesResult.count;

            return {
                totalUsers,
                activeRides,
                todayRevenue,
                totalRevenue,
                newUsersToday,
                completedRidesToday
            };

        } catch (error) {
            console.error('Error getting real-time stats:', error);
            return {
                totalUsers: 0,
                activeRides: 0,
                todayRevenue: 0,
                totalRevenue: 0,
                newUsersToday: 0,
                completedRidesToday: 0
            };
        }
    }

    /**
     * Get recent activity
     */
    static async getRecentActivity(limit = 15) {
        try {
            // Get recent user registrations
            const recentUsers = await db.executeQuery(`
                SELECT id, email, first_name, last_name, created_at, 'user_registration' as type
                FROM users 
                WHERE is_deleted IS NULL 
                ORDER BY created_at DESC 
                LIMIT ${parseInt(limit)}
            `);

            // Get recent rides
            const recentRides = await db.executeQuery(`
                SELECT id, status, created_at, 'ride_created' as type
                FROM rides 
                ORDER BY created_at DESC 
                LIMIT ${parseInt(limit)}
            `);

            // Get recent payments
            const recentPayments = await db.executeQuery(`
                SELECT id, amount, status, created_at, 'payment_processed' as type
                FROM payment_transactions 
                ORDER BY created_at DESC 
                LIMIT ${parseInt(limit)}
            `);

            // Combine and sort all activities
            const allActivities = [
                ...recentUsers.map(user => ({
                    ...user,
                    message: `New user registered: ${user.email}`,
                    icon: 'user-plus'
                })),
                ...recentRides.map(ride => ({
                    ...ride,
                    message: `Ride ${ride.status}: #${ride.id}`,
                    icon: 'car'
                })),
                ...recentPayments.map(payment => ({
                    ...payment,
                    message: `Payment ${payment.status}: $${payment.amount}`,
                    icon: 'dollar-sign'
                }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
             .slice(0, limit);

            return allActivities;

        } catch (error) {
            console.error('Error getting recent activity:', error);
            return [];
        }
    }

    /**
     * Get dashboard analytics
     */
    static async getAnalytics(req, res) {
        try {
            const { period = '7d' } = req.query;
            
            // Get user growth data
            const userGrowth = await DashboardController.getUserGrowthData(period);
            
            // Get revenue data
            const revenueData = await DashboardController.getRevenueData(period);
            
            // Get ride statistics
            const rideStats = await DashboardController.getRideStatistics(period);
            
            res.json({
                success: true,
                data: {
                    userGrowth,
                    revenueData,
                    rideStats,
                    period
                }
            });

        } catch (error) {
            console.error('Dashboard analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching dashboard analytics'
            });
        }
    }

    /**
     * Get user growth data
     */
    static async getUserGrowthData(period = '7d') {
        try {
            let dateFilter;
            switch (period) {
                case '7d':
                    dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                    break;
                case '30d':
                    dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                    break;
                case '90d':
                    dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
                    break;
                default:
                    dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            }

            const rows = await db.executeQuery(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as new_users,
                    SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) as total_users
                FROM users 
                WHERE ${dateFilter} AND is_deleted IS NULL
                GROUP BY DATE(created_at)
                ORDER BY date
            `);

            return rows;

        } catch (error) {
            console.error('Error getting user growth data:', error);
            return [];
        }
    }

    /**
     * Get revenue data
     */
    static async getRevenueData(period = '7d') {
        try {
            let dateFilter;
            switch (period) {
                case '7d':
                    dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                    break;
                case '30d':
                    dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                    break;
                case '90d':
                    dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
                    break;
                default:
                    dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            }

            const rows = await db.executeQuery(`
                SELECT 
                    DATE(created_at) as date,
                    SUM(amount) as daily_revenue,
                    SUM(SUM(amount)) OVER (ORDER BY DATE(created_at)) as cumulative_revenue
                FROM payment_transactions 
                WHERE ${dateFilter} AND status = 'completed'
                GROUP BY DATE(created_at)
                ORDER BY date
            `);

            return rows;

        } catch (error) {
            console.error('Error getting revenue data:', error);
            return [];
        }
    }

    /**
     * Get ride statistics
     */
    static async getRideStatistics(period = '7d') {
        try {
            let dateFilter;
            switch (period) {
                case '7d':
                    dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                    break;
                case '30d':
                    dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                    break;
                case '90d':
                    dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
                    break;
                default:
                    dateFilter = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            }

            const rows = await db.executeQuery(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM rides 
                WHERE ${dateFilter}
                GROUP BY status
                ORDER BY count DESC
            `);

            return rows;

        } catch (error) {
            console.error('Error getting ride statistics:', error);
            return [];
        }
    }

    /**
     * Get dashboard widgets
     */
    static async getWidgets(req, res) {
        try {
            const language = req.admin?.language_code || 'en';
            const widgets = await DashboardWidget.findAllActive(language);
            
            res.json({
                success: true,
                data: widgets
            });

        } catch (error) {
            console.error('Get widgets error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching widgets'
            });
        }
    }

    /**
     * Update dashboard layout
     */
    static async updateLayout(req, res) {
        try {
            const { layout_config } = req.body;
            const adminUserId = req.admin.id;

            // Get current default layout
            let layout = await DashboardLayout.getDefaultLayout(adminUserId);
            
            if (layout) {
                // Update existing layout
                layout = await DashboardLayout.update(layout.id, { layout_config });
            } else {
                // Create new default layout
                layout = await DashboardLayout.create({
                    admin_user_id: adminUserId,
                    layout_name: 'Default Layout',
                    layout_config,
                    is_default: true
                });
            }

            res.json({
                success: true,
                message: 'Dashboard layout updated successfully',
                data: layout
            });

        } catch (error) {
            console.error('Update layout error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating dashboard layout'
            });
        }
    }

    /**
     * Get live stats
     */
    static async getLiveStats(req, res) {
        try {
            const stats = await this.getRealTimeStats();
            
            res.json({
                success: true,
                data: {
                    ...stats,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Get live stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching live stats'
            });
        }
    }
}

module.exports = DashboardController; 