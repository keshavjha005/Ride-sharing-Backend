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
    return value;
  };

  const getValue = () => {
    if (!data || !data.stats) return 0;
    
    switch (widget.widget_key) {
      case 'total_users':
        return data.stats.totalUsers || 0;
      case 'active_rides':
        return data.stats.activeRides || 0;
      case 'revenue_today':
        return data.stats.todayRevenue || 0;
      case 'total_revenue':
        return data.stats.totalRevenue || 0;
      case 'new_users_today':
        return data.stats.newUsersToday || 0;
      case 'completed_rides_today':
        return data.stats.completedRidesToday || 0;
      default:
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