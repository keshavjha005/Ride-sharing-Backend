import React from 'react';
import { 
  UserPlus, 
  Car, 
  DollarSign, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Activity
} from 'lucide-react';

const ListWidget = ({ widget, data, language = 'en' }) => {
  const config = widget.config || {};
  
  const getListData = () => {
    if (!data) return [];
    
    switch (widget.widget_key) {
      case 'recent_activity':
        return data.recentActivity || [];
      case 'system_alerts':
        return data.systemAlerts || [];
      case 'pending_actions':
        return data.pendingActions || [];
      default:
        return [];
    }
  };

  const getActivityIcon = (type) => {
    const iconMap = {
      'user_registration': UserPlus,
      'ride_created': Car,
      'payment_processed': DollarSign,
      'ride_completed': CheckCircle,
      'user_analytics_update': Activity,
      'system_alert': AlertCircle,
      'pending_action': Clock
    };
    return iconMap[type] || Activity;
  };

  const getActivityColor = (type) => {
    const colorMap = {
      'user_registration': '#4CAF50',
      'ride_created': '#FD7A00',
      'payment_processed': '#00BCD4',
      'ride_completed': '#4CAF50',
      'user_analytics_update': '#9C27B0',
      'system_alert': '#F44336',
      'pending_action': '#FFC107'
    };
    return colorMap[type] || '#B0B3BD';
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const renderActivityItem = (item, index) => {
    const IconComponent = getActivityIcon(item.type);
    const iconColor = getActivityColor(item.type);

    return (
      <div 
        key={index}
        className="flex items-start space-x-3 p-3 hover:bg-background-tertiary rounded-lg transition-colors"
      >
        <div 
          className="flex-shrink-0 p-2 rounded-lg"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <IconComponent 
            size={16} 
            style={{ color: iconColor }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary font-medium">
            {item.message || 'Activity'}
          </p>
          {item.details && (
            <p className="text-xs text-text-secondary mt-1">
              {item.details}
            </p>
          )}
          <p className="text-xs text-text-muted mt-1">
            {formatTimeAgo(item.created_at)}
          </p>
        </div>
      </div>
    );
  };

  const renderSystemAlert = (item, index) => {
    return (
      <div 
        key={index}
        className="flex items-start space-x-3 p-3 hover:bg-background-tertiary rounded-lg transition-colors border-l-4 border-error"
      >
        <div className="flex-shrink-0 p-2 rounded-lg bg-error/20">
          <AlertCircle size={16} className="text-error" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary font-medium">
            {item.title || 'System Alert'}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {item.description || 'No description available'}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {formatTimeAgo(item.created_at)}
          </p>
        </div>
      </div>
    );
  };

  const renderPendingAction = (item, index) => {
    return (
      <div 
        key={index}
        className="flex items-start space-x-3 p-3 hover:bg-background-tertiary rounded-lg transition-colors border-l-4 border-warning"
      >
        <div className="flex-shrink-0 p-2 rounded-lg bg-warning/20">
          <Clock size={16} className="text-warning" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary font-medium">
            {item.title || 'Pending Action'}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {item.description || 'No description available'}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Due: {formatTimeAgo(item.due_date)}
          </p>
        </div>
      </div>
    );
  };

  const renderListItem = (item, index) => {
    switch (widget.widget_key) {
      case 'recent_activity':
        return renderActivityItem(item, index);
      case 'system_alerts':
        return renderSystemAlert(item, index);
      case 'pending_actions':
        return renderPendingAction(item, index);
      default:
        return renderActivityItem(item, index);
    }
  };

  const listData = getListData();

  return (
    <div className="bg-background-secondary rounded-lg p-4 sm:p-6 border border-border h-full">
      <div className="mb-4">
        <h3 className="text-text-primary text-lg font-semibold mb-1 truncate">
          {widget.title}
        </h3>
        {widget.description && (
          <p className="text-text-muted text-sm overflow-hidden text-ellipsis">
            {widget.description}
          </p>
        )}
      </div>
      
      <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto flex-1">
        {listData.length > 0 ? (
          listData.map((item, index) => renderListItem(item, index))
        ) : (
          <div className="text-center py-8 text-text-muted">
            <Activity size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListWidget; 