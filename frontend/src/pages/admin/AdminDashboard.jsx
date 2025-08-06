import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import axios from 'axios';
import WidgetRenderer from '../../components/admin/widgets/WidgetRenderer';
import { RefreshCw, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { admin } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [overviewResponse, analyticsResponse] = await Promise.all([
        axios.get('/api/admin/dashboard/overview'),
        axios.get('/api/admin/dashboard/analytics?period=7d')
      ]);

      const dashboardData = {
        stats: overviewResponse.data.data.stats,
        recentActivity: overviewResponse.data.data.recentActivity,
        analytics: analyticsResponse.data.data,
        lastUpdated: overviewResponse.data.data.lastUpdated
      };
      
      console.log('Dashboard data:', dashboardData);
      setDashboardData(dashboardData);
      setLayout(overviewResponse.data.data.layout);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Welcome back, {admin?.first_name || 'Admin'}!
          </h1>
          <p className="text-text-secondary">
            Here's what's happening with your platform today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-background-secondary text-text-primary rounded-lg border border-border hover:bg-background-tertiary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-background-secondary text-text-primary rounded-lg border border-border hover:bg-background-tertiary transition-colors">
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      {layout && layout.layout_config && layout.layout_config.widgets ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {layout.layout_config.widgets.map((widgetConfig, index) => {
            const widget = widgetConfig.widget;
            if (!widget) return null;

            // Determine responsive column span based on widget width
            const getResponsiveColSpan = (width) => {
              if (width <= 3) return 'col-span-1';
              if (width <= 6) return 'col-span-1 md:col-span-2';
              if (width <= 9) return 'col-span-1 md:col-span-2 lg:col-span-3';
              return 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4';
            };

            const colSpan = getResponsiveColSpan(widgetConfig.position.w);
            
            return (
              <div key={index} className={colSpan}>
                <WidgetRenderer
                  widget={widget}
                  data={dashboardData}
                  language={admin?.language_code || 'en'}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-muted">No dashboard layout configured</p>
        </div>
      )}

      {/* Last Updated */}
      {dashboardData?.lastUpdated && (
        <div className="mt-8 text-center">
          <p className="text-xs text-text-muted">
            Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 