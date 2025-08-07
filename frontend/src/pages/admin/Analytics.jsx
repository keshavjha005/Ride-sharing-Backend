import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import api from '../../utils/api';
import { 
  BarChart3, 
  Users, 
  Car, 
  DollarSign, 
  Activity,
  Calendar,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = () => {
  const { admin } = useAuth();
  const [analyticsData, setAnalyticsData] = useState({
    users: null,
    rides: null,
    financial: null,
    system: null
  });
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedType, setSelectedType] = useState('users');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const periods = [
    { value: '1d', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  const analyticsTypes = [
    { 
      value: 'users', 
      label: 'User Analytics', 
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      value: 'rides', 
      label: 'Ride Analytics', 
      icon: Car,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      value: 'financial', 
      label: 'Financial Analytics', 
      icon: DollarSign,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    { 
      value: 'system', 
      label: 'System Analytics', 
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  const fetchAnalytics = async (type = selectedType, period = selectedPeriod) => {
    try {
      setRefreshing(true);
      const response = await api.get(`/api/admin/analytics?type=${type}&period=${period}`);
      
      setAnalyticsData(prev => ({
        ...prev,
        [type]: response.data.data
      }));
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    fetchAnalytics(selectedType, period);
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    if (!analyticsData[type]) {
      fetchAnalytics(type, selectedPeriod);
    }
  };

  const handleRefresh = () => {
    fetchAnalytics();
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/api/admin/export?type=${selectedType}&format=csv`);
      
      // Create and download CSV file
      const csvContent = convertToCSV(response.data.data.records);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType}_analytics_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Analytics data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const renderAnalyticsCard = (type) => {
    const data = analyticsData[type];
    if (!data) return null;

    const typeConfig = analyticsTypes.find(t => t.value === type);
    const IconComponent = typeConfig.icon;

    // Calculate summary metrics
    const summary = calculateSummary(data.data, type);

    return (
      <div className="bg-background-secondary rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
              <IconComponent className={`w-5 h-5 ${typeConfig.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{typeConfig.label}</h3>
              <p className="text-sm text-text-muted">
                {data.period.startDate} to {data.period.endDate}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchAnalytics(type, selectedPeriod)}
              disabled={refreshing}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-lg transition-colors"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-lg transition-colors"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(summary).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="text-2xl font-bold text-text-primary">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
              <div className="text-sm text-text-muted capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>

        {/* Chart Placeholder */}
        <div className="bg-background-tertiary rounded-lg p-8 text-center">
          <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-muted">Chart visualization would be implemented here</p>
          <p className="text-sm text-text-muted mt-2">
            Data points: {data.data.length}
          </p>
        </div>
      </div>
    );
  };

  const calculateSummary = (data, type) => {
    if (!data || data.length === 0) return {};

    switch (type) {
      case 'users':
        return {
          totalUsers: data.reduce((sum, item) => sum + (item.new_users || 0), 0),
          verifiedUsers: data.reduce((sum, item) => sum + (item.verified_users || 0), 0),
          avgDaily: Math.round(data.reduce((sum, item) => sum + (item.new_users || 0), 0) / data.length),
          growthRate: calculateGrowthRate(data, 'new_users')
        };
      case 'rides':
        return {
          totalRides: data.reduce((sum, item) => sum + (item.total_rides || 0), 0),
          completedRides: data.reduce((sum, item) => sum + (item.completed_rides || 0), 0),
          avgFare: Math.round(data.reduce((sum, item) => sum + (item.avg_fare || 0), 0) / data.length),
          completionRate: Math.round((data.reduce((sum, item) => sum + (item.completed_rides || 0), 0) / 
                                    data.reduce((sum, item) => sum + (item.total_rides || 0), 0)) * 100)
        };
      case 'financial':
        return {
          totalRevenue: data.reduce((sum, item) => sum + (item.total_revenue || 0), 0),
          totalTransactions: data.reduce((sum, item) => sum + (item.transaction_count || 0), 0),
          avgTransaction: Math.round(data.reduce((sum, item) => sum + (item.avg_transaction || 0), 0) / data.length),
          growthRate: calculateGrowthRate(data, 'total_revenue')
        };
      case 'system':
        return {
          totalLogs: data.reduce((sum, item) => sum + (item.total_logs || 0), 0),
          errorCount: data.reduce((sum, item) => sum + (item.error_count || 0), 0),
          avgResponseTime: Math.round(data.reduce((sum, item) => sum + (item.avg_response_time || 0), 0) / data.length),
          errorRate: Math.round((data.reduce((sum, item) => sum + (item.error_count || 0), 0) / 
                               data.reduce((sum, item) => sum + (item.total_logs || 0), 0)) * 100)
        };
      default:
        return {};
    }
  };

  const calculateGrowthRate = (data, field) => {
    if (data.length < 2) return 0;
    
    const firstHalf = data.slice(0, Math.ceil(data.length / 2));
    const secondHalf = data.slice(Math.ceil(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, item) => sum + (item[field] || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, item) => sum + (item[field] || 0), 0) / secondHalf.length;
    
    if (firstAvg === 0) return secondAvg > 0 ? 100 : 0;
    
    return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
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
            Analytics Dashboard
          </h1>
          <p className="text-text-secondary">
            Comprehensive analytics and insights for your platform.
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
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-text-secondary">Time Period:</span>
          <div className="flex space-x-2">
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => handlePeriodChange(period.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period.value
                    ? 'bg-primary text-white'
                    : 'bg-background-secondary text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Type Selector */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analyticsTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => handleTypeChange(type.value)}
                className={`p-4 rounded-lg border transition-colors ${
                  selectedType === type.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-background-secondary hover:bg-background-tertiary'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${type.bgColor}`}>
                    <IconComponent className={`w-5 h-5 ${type.color}`} />
                  </div>
                  <span className={`font-medium ${
                    selectedType === type.value ? 'text-primary' : 'text-text-primary'
                  }`}>
                    {type.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Analytics Content */}
      <div className="space-y-6">
        {renderAnalyticsCard(selectedType)}
      </div>
    </div>
  );
};

export default Analytics; 