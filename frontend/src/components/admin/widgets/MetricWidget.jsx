import React from 'react';
import { 
  Users, 
  Car, 
  DollarSign, 
  TrendingUp, 
  UserPlus, 
  CheckCircle,
  Activity,
  Zap
} from 'lucide-react';

const MetricWidget = ({ widget, data, language = 'en' }) => {
  const getIcon = (iconName) => {
    const iconMap = {
      'users': Users,
      'car': Car,
      'dollar-sign': DollarSign,
      'trending-up': TrendingUp,
      'user-plus': UserPlus,
      'check-circle': CheckCircle,
      'activity': Activity,
      'zap': Zap
    };
    return iconMap[iconName] || Activity;
  };

  const formatValue = (value, format) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }
    if (format === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    if (format === 'decimal') {
      return parseFloat(value).toFixed(1);
    }
    if (format === 'percentage') {
      return `${parseFloat(value).toFixed(1)}%`;
    }
    return value;
  };

  const getValue = () => {
    console.log('🔍 MetricWidget data:', data);
    console.log('🔍 Widget key:', widget.widget_key);
    console.log('🔍 Stats data:', data?.stats);
    
    if (!data || !data.stats) {
      console.log('❌ No data or stats found');
      return 0;
    }
    
    switch (widget.widget_key) {
      case 'total_users':
        const totalUsers = data.stats.totalUsers || 0;
        console.log('👥 Total users:', totalUsers);
        return totalUsers;
      case 'verified_users':
        const verifiedUsers = data.stats.verifiedUsers || 0;
        console.log('✅ Verified users:', verifiedUsers);
        return verifiedUsers;
      case 'unverified_users':
        const unverifiedUsers = data.stats.unverifiedUsers || 0;
        console.log('❌ Unverified users:', unverifiedUsers);
        return unverifiedUsers;
      case 'active_rides':
        const activeRides = data.stats.activeRides || 0;
        console.log('🚗 Active rides:', activeRides);
        return activeRides;
      case 'total_rides':
        const totalRidesCount = data.stats.totalRides || 0;
        console.log('🚗 Total rides:', totalRidesCount);
        return totalRidesCount;
      case 'completed_rides':
        const completedRidesCount = data.stats.completedRides || 0;
        console.log('✅ Completed rides:', completedRidesCount);
        return completedRidesCount;
      case 'cancelled_rides':
        const cancelledRides = data.stats.cancelledRides || 0;
        console.log('❌ Cancelled rides:', cancelledRides);
        return cancelledRides;
      case 'revenue_today':
        const todayRevenue = data.stats.todayRevenue || 0;
        console.log('💰 Today revenue:', todayRevenue);
        return todayRevenue;
      case 'total_revenue':
        const totalRevenue = data.stats.totalRevenue || 0;
        console.log('💰 Total revenue:', totalRevenue);
        return totalRevenue;
      case 'new_users_today':
        const newUsersToday = data.stats.newUsersToday || 0;
        console.log('👤 New users today:', newUsersToday);
        return newUsersToday;
      case 'completed_rides_today':
        const completedRidesToday = data.stats.completedRidesToday || 0;
        console.log('✅ Completed rides today:', completedRidesToday);
        return completedRidesToday;
      case 'avg_user_rating':
        const avgUserRating = data.stats.avgUserRating || 0;
        console.log('⭐ Avg user rating:', avgUserRating);
        return avgUserRating;
      case 'avg_fare':
        const avgFare = data.stats.avgFare || 0;
        console.log('💰 Avg fare:', avgFare);
        return avgFare;
      case 'avg_rides_per_user':
        const avgRidesPerUser = data.stats.avgRidesPerUser || 0;
        console.log('🚗 Avg rides per user:', avgRidesPerUser);
        return avgRidesPerUser;
      case 'avg_spent_per_user':
        const avgSpentPerUser = data.stats.avgSpentPerUser || 0;
        console.log('💰 Avg spent per user:', avgSpentPerUser);
        return avgSpentPerUser;
      case 'ride_completion_rate':
        const totalRidesForRate = data.stats.totalRides || 0;
        const completedRidesForRate = data.stats.completedRides || 0;
        const completionRate = totalRidesForRate > 0 ? (completedRidesForRate / totalRidesForRate) * 100 : 0;
        console.log('📊 Ride completion rate:', completionRate);
        return completionRate;
      default:
        console.log('❓ Unknown widget key:', widget.widget_key);
        return 0;
    }
  };

  const config = widget.config || {};
  const IconComponent = getIcon(config.icon);
  const value = getValue();

  return (
    <div className="bg-background-secondary rounded-lg p-4 sm:p-6 border border-border hover:border-hover transition-colors h-full">
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          <p className="text-text-secondary text-sm font-medium mb-1 truncate">
            {widget.title}
          </p>
          <p className="text-text-primary text-xl sm:text-2xl font-bold truncate">
            {formatValue(value, config.format)}
          </p>
          {widget.description && (
            <p className="text-text-muted text-xs mt-1 overflow-hidden text-ellipsis">
              {widget.description}
            </p>
          )}
        </div>
        <div 
          className="flex-shrink-0 p-2 sm:p-3 rounded-lg ml-3"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <IconComponent 
            size={20} 
            className="sm:w-6 sm:h-6"
            style={{ color: config.color }}
          />
        </div>
      </div>
    </div>
  );
};

export default MetricWidget; 