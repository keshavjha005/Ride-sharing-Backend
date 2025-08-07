const DashboardWidget = require('../models/DashboardWidget');
const DashboardLayout = require('../models/DashboardLayout');
const { executeQuery } = require('../config/database');

console.log('🔄 DashboardController loaded - using ride_analytics table for ride data');

class DashboardController {
    /**
     * Get dashboard overview with analytics
     */
    static async getOverview(req, res) {
        try {
            console.log('🔄 Dashboard getOverview called');
            const language = req.admin?.language_code || 'en';
            
            // Get real-time statistics
            console.log('🔄 Calling getRealTimeStats...');
            let stats;
            try {
                stats = await DashboardController.getRealTimeStats();
                console.log('📊 getRealTimeStats returned:', stats);
            } catch (error) {
                console.error('❌ Error calling getRealTimeStats:', error);
                stats = {
                    totalUsers: 0,
                    verifiedUsers: 0,
                    unverifiedUsers: 0,
                    newUsersToday: 0,
                    verifiedUsersToday: 0,
                    totalRides: 0,
                    activeRides: 0,
                    confirmedRides: 0,
                    startedRides: 0,
                    inProgressRides: 0,
                    completedRides: 0,
                    cancelledRides: 0,
                    ridesToday: 0,
                    completedRidesToday: 0,
                    cancelledRidesToday: 0,
                    todayRevenue: 0,
                    totalRevenue: 0,
                    todayCompletedRevenue: 0,
                    todayTransactions: 0,
                    totalCompletedTransactions: 0,
                    avgRidesPerUser: 0,
                    avgSpentPerUser: 0,
                    avgUserRating: 0,
                    avgDistance: 0,
                    avgDuration: 0,
                    avgFare: 0,
                    avgCommission: 0,
                    avgRideRating: 0
                };
            }
            
            // Get recent activity
            console.log('🔄 Calling getRecentActivity...');
            const recentActivity = await DashboardController.getRecentActivity();
            console.log('📋 getRecentActivity returned:', recentActivity.length, 'items');
            
            // Get dashboard layout with widgets
            console.log('🔄 Getting dashboard layout...');
            const layout = await DashboardLayout.getLayoutWithWidgets(req.admin.id, language);
            console.log('📋 Layout retrieved:', layout ? 'success' : 'failed');
            
            const response = {
                success: true,
                data: {
                    stats,
                    recentActivity,
                    layout,
                    lastUpdated: new Date().toISOString()
                }
            };
            
            console.log('📤 Sending dashboard response');
            res.json(response);

        } catch (error) {
            console.error('❌ Dashboard overview error:', error);
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
        console.log('🚀 getRealTimeStats method called');
        try {
            console.log('🔄 Getting real-time stats...');
            
            // Get total users with verification status
            console.log('🔍 Querying users table...');
            const totalUsersResult = await executeQuery(`
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_users,
                    COUNT(CASE WHEN is_verified = 0 THEN 1 END) as unverified_users
                FROM users 
                WHERE is_deleted IS NULL
            `);
            console.log('🔍 Users query result:', totalUsersResult);
            const userStats = totalUsersResult && totalUsersResult[0] ? totalUsersResult[0] : { total_users: 0, verified_users: 0, unverified_users: 0 };
            console.log('👥 User stats:', userStats);

            // Get ride statistics from ride_analytics table (like Ride Management uses)
            console.log('🔍 Querying ride_analytics table...');
            const rideAnalyticsResult = await executeQuery(`
                SELECT 
                    COUNT(*) as total_rides,
                    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_rides,
                    COUNT(CASE WHEN status = 'started' THEN 1 END) as started_rides,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_rides,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_rides
                FROM ride_analytics
            `);
            console.log('🔍 Ride analytics query result:', rideAnalyticsResult);
            const rideStats = rideAnalyticsResult && rideAnalyticsResult[0] ? rideAnalyticsResult[0] : { total_rides: 0, confirmed_rides: 0, started_rides: 0, in_progress_rides: 0, completed_rides: 0, cancelled_rides: 0 };
            console.log('🚗 Ride stats:', rideStats);

            // Get revenue statistics from payment_transactions
            const revenueResult = await executeQuery(`
                SELECT 
                    COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN amount END), 0) as today_revenue,
                    COALESCE(SUM(CASE WHEN status = 'completed' THEN amount END), 0) as total_revenue,
                    COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() AND status = 'completed' THEN amount END), 0) as today_completed_revenue,
                    COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_transactions,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_completed_transactions
                FROM payment_transactions
            `);
            const revenueStats = revenueResult && revenueResult[0] ? revenueResult[0] : { today_revenue: 0, total_revenue: 0, today_completed_revenue: 0, today_transactions: 0, total_completed_transactions: 0 };

            // Get user analytics summary
            const userAnalyticsResult = await executeQuery(`
                SELECT 
                    COUNT(*) as total_analytics_users,
                    AVG(total_rides) as avg_rides_per_user,
                    AVG(total_spent) as avg_spent_per_user,
                    AVG(average_rating) as avg_user_rating,
                    COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified_analytics_users,
                    COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending_analytics_users
                FROM user_analytics
            `);
            const userAnalytics = userAnalyticsResult && userAnalyticsResult[0] ? userAnalyticsResult[0] : { total_analytics_users: 0, avg_rides_per_user: 0, avg_spent_per_user: 0, avg_user_rating: 0, verified_analytics_users: 0, pending_analytics_users: 0 };

            // Get ride analytics summary from ride_analytics table
            const rideAnalyticsSummaryResult = await executeQuery(`
                SELECT 
                    COUNT(*) as total_analytics_rides,
                    AVG(distance_km) as avg_distance,
                    AVG(duration_minutes) as avg_duration,
                    AVG(fare_amount) as avg_fare,
                    AVG(commission_amount) as avg_commission,
                    AVG(rating) as avg_ride_rating,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_analytics_rides,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_analytics_rides
                FROM ride_analytics
            `);
            const rideAnalytics = rideAnalyticsSummaryResult && rideAnalyticsSummaryResult[0] ? rideAnalyticsSummaryResult[0] : { total_analytics_rides: 0, avg_distance: 0, avg_duration: 0, avg_fare: 0, avg_commission: 0, avg_ride_rating: 0, completed_analytics_rides: 0, cancelled_analytics_rides: 0 };

            // Get today's statistics
            const todayStatsResult = await executeQuery(`
                SELECT 
                    COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as new_users_today,
                    COUNT(CASE WHEN DATE(created_at) = CURDATE() AND is_verified = 1 THEN 1 END) as verified_users_today
                FROM users 
                WHERE is_deleted IS NULL
            `);
            const todayStats = todayStatsResult && todayStatsResult[0] ? todayStatsResult[0] : { new_users_today: 0, verified_users_today: 0 };

            // Get today's ride statistics from ride_analytics
            const todayRidesResult = await executeQuery(`
                SELECT 
                    COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as rides_today,
                    COUNT(CASE WHEN DATE(created_at) = CURDATE() AND status = 'completed' THEN 1 END) as completed_rides_today,
                    COUNT(CASE WHEN DATE(created_at) = CURDATE() AND status = 'cancelled' THEN 1 END) as cancelled_rides_today
                FROM ride_analytics
            `);
            const todayRides = todayRidesResult && todayRidesResult[0] ? todayRidesResult[0] : { rides_today: 0, completed_rides_today: 0, cancelled_rides_today: 0 };

            return {
                // User Statistics
                totalUsers: userStats.total_users,
                verifiedUsers: userStats.verified_users,
                unverifiedUsers: userStats.unverified_users,
                newUsersToday: todayStats.new_users_today,
                verifiedUsersToday: todayStats.verified_users_today,
                
                // Ride Statistics (from ride_analytics table)
                totalRides: rideStats.total_rides,
                activeRides: rideStats.confirmed_rides + rideStats.started_rides + rideStats.in_progress_rides,
                confirmedRides: rideStats.confirmed_rides,
                startedRides: rideStats.started_rides,
                inProgressRides: rideStats.in_progress_rides,
                completedRides: rideStats.completed_rides,
                cancelledRides: rideStats.cancelled_rides,
                ridesToday: todayRides.rides_today,
                completedRidesToday: todayRides.completed_rides_today,
                cancelledRidesToday: todayRides.cancelled_rides_today,
                
                // Revenue Statistics
                todayRevenue: parseFloat(revenueStats.today_revenue),
                totalRevenue: parseFloat(revenueStats.total_revenue),
                todayCompletedRevenue: parseFloat(revenueStats.today_completed_revenue),
                todayTransactions: revenueStats.today_transactions,
                totalCompletedTransactions: revenueStats.total_completed_transactions,
                
                // Analytics Averages
                avgRidesPerUser: parseFloat(userAnalytics.avg_rides_per_user || 0),
                avgSpentPerUser: parseFloat(userAnalytics.avg_spent_per_user || 0),
                avgUserRating: parseFloat(userAnalytics.avg_user_rating || 0),
                avgDistance: parseFloat(rideAnalytics.avg_distance || 0),
                avgDuration: parseFloat(rideAnalytics.avg_duration || 0),
                avgFare: parseFloat(rideAnalytics.avg_fare || 0),
                avgCommission: parseFloat(rideAnalytics.avg_commission || 0),
                avgRideRating: parseFloat(rideAnalytics.avg_ride_rating || 0)
            };

        } catch (error) {
            console.error('Error getting real-time stats:', error);
            return {
                totalUsers: 0,
                verifiedUsers: 0,
                unverifiedUsers: 0,
                newUsersToday: 0,
                verifiedUsersToday: 0,
                totalRides: 0,
                activeRides: 0,
                confirmedRides: 0,
                startedRides: 0,
                inProgressRides: 0,
                completedRides: 0,
                cancelledRides: 0,
                ridesToday: 0,
                completedRidesToday: 0,
                cancelledRidesToday: 0,
                todayRevenue: 0,
                totalRevenue: 0,
                todayCompletedRevenue: 0,
                todayTransactions: 0,
                totalCompletedTransactions: 0,
                avgRidesPerUser: 0,
                avgSpentPerUser: 0,
                avgUserRating: 0,
                avgDistance: 0,
                avgDuration: 0,
                avgFare: 0,
                avgCommission: 0,
                avgRideRating: 0
            };
        }
    }

    /**
     * Get recent activity
     */
    static async getRecentActivity(limit = 15) {
        try {
            // Get recent user registrations with analytics data
            const recentUsers = await executeQuery(`
                SELECT 
                    u.id, 
                    u.email, 
                    u.first_name, 
                    u.last_name, 
                    u.created_at, 
                    u.is_verified,
                    ua.total_rides,
                    ua.total_spent,
                    ua.average_rating,
                    'user_registration' as type
                FROM users u
                LEFT JOIN user_analytics ua ON u.id = ua.user_id
                WHERE u.is_deleted IS NULL 
                ORDER BY u.created_at DESC 
                LIMIT ${parseInt(limit)}
            `);

            // Get recent rides with analytics data from ride_analytics table
            const recentRides = await executeQuery(`
                SELECT 
                    ra.ride_id as id, 
                    ra.status, 
                    ra.created_at,
                    ra.distance_km,
                    ra.duration_minutes,
                    ra.fare_amount,
                    ra.commission_amount,
                    ra.rating,
                    ra.cancellation_reason,
                    'ride_created' as type
                FROM ride_analytics ra
                ORDER BY ra.created_at DESC 
                LIMIT ${parseInt(limit)}
            `);

            // Get recent payments with more details
            const recentPayments = await executeQuery(`
                SELECT 
                    id, 
                    amount, 
                    status, 
                    created_at,
                    'payment_processed' as type
                FROM payment_transactions 
                ORDER BY created_at DESC 
                LIMIT ${parseInt(limit)}
            `);

            // Get recent user analytics updates
            const recentAnalytics = await executeQuery(`
                SELECT 
                    ua.id,
                    u.email,
                    u.first_name,
                    u.last_name,
                    ua.total_rides,
                    ua.total_spent,
                    ua.average_rating,
                    ua.verification_status,
                    ua.updated_at as created_at,
                    'user_analytics_update' as type
                FROM user_analytics ua
                JOIN users u ON ua.user_id = u.id
                WHERE u.is_deleted IS NULL
                ORDER BY ua.updated_at DESC 
                LIMIT ${parseInt(limit)}
            `);

            // Combine and sort all activities
            const allActivities = [
                ...recentUsers.map(user => ({
                    ...user,
                    message: `New user registered: ${user.email}${user.is_verified ? ' (Verified)' : ' (Pending)'}`,
                    icon: 'user-plus',
                    details: user.total_rides ? `${user.total_rides} rides, $${user.total_spent} spent` : 'New user'
                })),
                ...recentRides.map(ride => ({
                    ...ride,
                    message: `Ride ${ride.status}: #${ride.id}${ride.fare_amount ? ` - $${ride.fare_amount}` : ''}`,
                    icon: 'car',
                    details: ride.distance_km ? `${ride.distance_km}km, ${ride.duration_minutes}min` : 'Ride created'
                })),
                ...recentPayments.map(payment => ({
                    ...payment,
                    message: `Payment ${payment.status}: $${payment.amount}`,
                    icon: 'dollar-sign',
                    details: 'Payment processed'
                })),
                ...recentAnalytics.map(analytics => ({
                    ...analytics,
                    message: `User activity update: ${analytics.email}`,
                    icon: 'activity',
                    details: `${analytics.total_rides} rides, $${analytics.total_spent} spent, ${analytics.average_rating || 'N/A'} rating`
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
                    dateFilter = 'DATE(u.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                    break;
                case '30d':
                    dateFilter = 'DATE(u.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                    break;
                case '90d':
                    dateFilter = 'DATE(u.created_at) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
                    break;
                default:
                    dateFilter = 'DATE(u.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            }

            const rows = await executeQuery(`
                SELECT 
                    DATE(u.created_at) as date,
                    COUNT(*) as new_users,
                    COUNT(CASE WHEN u.is_verified = 1 THEN 1 END) as verified_users,
                    COUNT(CASE WHEN u.is_verified = 0 THEN 1 END) as unverified_users,
                    SUM(COUNT(*)) OVER (ORDER BY DATE(u.created_at)) as total_users,
                    AVG(ua.total_rides) as avg_rides_per_user,
                    AVG(ua.total_spent) as avg_spent_per_user,
                    AVG(ua.average_rating) as avg_user_rating
                FROM users u
                LEFT JOIN user_analytics ua ON u.id = ua.user_id
                WHERE ${dateFilter} AND u.is_deleted IS NULL
                GROUP BY DATE(u.created_at)
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

            const rows = await executeQuery(`
                SELECT 
                    DATE(created_at) as date,
                    SUM(amount) as daily_revenue,
                    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_revenue,
                    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_revenue,
                    SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as failed_revenue,
                    COUNT(*) as total_transactions,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
                    SUM(SUM(amount)) OVER (ORDER BY DATE(created_at)) as cumulative_revenue
                FROM payment_transactions 
                WHERE ${dateFilter}
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
                    dateFilter = 'DATE(ra.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                    break;
                case '30d':
                    dateFilter = 'DATE(ra.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                    break;
                case '90d':
                    dateFilter = 'DATE(ra.created_at) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
                    break;
                default:
                    dateFilter = 'DATE(ra.created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
            }

            const rows = await executeQuery(`
                SELECT 
                    ra.status,
                    COUNT(*) as count,
                    AVG(ra.distance_km) as avg_distance,
                    AVG(ra.duration_minutes) as avg_duration,
                    AVG(ra.fare_amount) as avg_fare,
                    AVG(ra.commission_amount) as avg_commission,
                    AVG(ra.rating) as avg_rating,
                    SUM(ra.fare_amount) as total_fare,
                    SUM(ra.commission_amount) as total_commission
                FROM ride_analytics ra
                WHERE ${dateFilter}
                GROUP BY ra.status
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