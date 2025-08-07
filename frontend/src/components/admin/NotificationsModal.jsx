import React, { useState, useEffect } from 'react';
import { X, Bell, AlertCircle, CheckCircle, Info, Clock } from 'lucide-react';
import api from '../../utils/api';

const NotificationsModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // For now, we'll use mock data since we don't have a notifications API yet
      const mockNotifications = [
        {
          id: 1,
          type: 'info',
          title: 'System Update',
          message: 'New dashboard features have been deployed',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          read: false
        },
        {
          id: 2,
          type: 'success',
          title: 'User Registration',
          message: 'New user registered: john.doe@example.com',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          read: false
        },
        {
          id: 3,
          type: 'warning',
          title: 'Ride Dispute',
          message: 'New ride dispute requires attention',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          read: true
        },
        {
          id: 4,
          type: 'error',
          title: 'Payment Failed',
          message: 'Payment processing failed for ride #12345',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
          read: true
        }
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error" />;
      default:
        return <Info className="w-5 h-5 text-info" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-l-success bg-success/5';
      case 'warning':
        return 'border-l-warning bg-warning/5';
      case 'error':
        return 'border-l-error bg-error/5';
      default:
        return 'border-l-info bg-info/5';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    return notification.type === activeTab;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-secondary rounded-lg shadow-modal w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-text-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-error text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {['all', 'unread', 'info', 'success', 'warning', 'error'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border-l-4 ${getNotificationColor(notification.type)} ${
                    !notification.read ? 'bg-background-tertiary' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-text-primary">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-text-secondary mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Clock className="w-3 h-3 text-text-muted" />
                        <span className="text-xs text-text-muted">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => {
              // Mark all as read functionality
              setNotifications(notifications.map(n => ({ ...n, read: true })));
            }}
            className="w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-lg transition-colors"
          >
            Mark all as read
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal; 