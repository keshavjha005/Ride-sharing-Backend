import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Download, 
  Filter, 
  HardDrive, 
  Cpu, 
  Monitor, 
  RefreshCw, 
  Search, 
  Server, 
  Settings, 
  Shield, 
  TrendingUp, 
  X,
  Zap,
  Globe,
  Users,
  BarChart3,
  FileText,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../utils/AuthContext';
import { useNavigate } from 'react-router-dom';

// Utility functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatPercentage = (value) => {
  return `${(value * 100).toFixed(1)}%`;
};

const SystemMonitoring = () => {
  const { admin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filters, setFilters] = useState({
    logLevel: '',
    service: '',
    search: '',
    dateRange: '24h'
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [admin, isAuthenticated, navigate]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load system health
      const healthResponse = await api.get('/api/admin/system-monitoring/health');
      setSystemHealth(healthResponse.data.data);

      // Load system metrics
      const metricsResponse = await api.get('/api/admin/system-monitoring/metrics');
      setSystemMetrics(metricsResponse.data.data);

      // Load logs based on active tab
      if (activeTab === 'logs') {
        const logsResponse = await api.get('/api/admin/system-monitoring/logs', {
          params: filters
        });
        setLogs(logsResponse.data.data);
      } else if (activeTab === 'audit') {
        const auditResponse = await api.get('/api/admin/system-monitoring/audit-logs', {
          params: filters
        });
        setAuditLogs(auditResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getHealthStatusBadge = (status) => {
    const statusConfig = {
      healthy: { color: 'bg-green-500', text: 'Healthy', icon: CheckCircle },
      warning: { color: 'bg-yellow-500', text: 'Warning', icon: AlertTriangle },
      error: { color: 'bg-red-500', text: 'Error', icon: X },
      critical: { color: 'bg-red-600', text: 'Critical', icon: AlertTriangle },
      offline: { color: 'bg-gray-500', text: 'Offline', icon: X }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-500', text: status, icon: Clock };
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon size={12} />
        {config.text}
      </Badge>
    );
  };

  const getLogLevelBadge = (level) => {
    const levelConfig = {
      error: { color: 'bg-red-500', text: 'ERROR' },
      warn: { color: 'bg-yellow-500', text: 'WARN' },
      info: { color: 'bg-blue-500', text: 'INFO' },
      debug: { color: 'bg-gray-500', text: 'DEBUG' }
    };
    
    const config = levelConfig[level] || { color: 'bg-gray-500', text: level };
    
    return (
      <Badge className={`${config.color} text-white text-xs`}>
        {config.text}
      </Badge>
    );
  };

  if (!admin) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">System Monitoring</h1>
          <p className="text-text-secondary mt-2">
            Monitor system health, performance, and logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setAutoRefresh(!autoRefresh)} 
            variant={autoRefresh ? "default" : "outline"}
            className="bg-primary hover:bg-primary-dark text-text-primary"
          >
            {autoRefresh ? <Pause size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          <Button 
            onClick={loadData} 
            className="bg-primary hover:bg-primary-dark text-text-primary"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-background-secondary border-border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-text-primary">
            <Activity size={16} className="mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="metrics" className="data-[state=active]:bg-primary data-[state=active]:text-text-primary">
            <BarChart3 size={16} className="mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-text-primary">
            <FileText size={16} className="mr-2" />
            System Logs
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-primary data-[state=active]:text-text-primary">
            <Shield size={16} className="mr-2" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SystemOverview 
            systemHealth={systemHealth} 
            systemMetrics={systemMetrics}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <SystemMetrics 
            systemMetrics={systemMetrics}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <SystemLogs 
            logs={logs}
            loading={loading}
            filters={filters}
            onFilterChange={handleFilterChange}
            getLogLevelBadge={getLogLevelBadge}
            formatDate={formatDate}
          />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditLogs 
            auditLogs={auditLogs}
            loading={loading}
            filters={filters}
            onFilterChange={handleFilterChange}
            formatDate={formatDate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// System Overview Component
const SystemOverview = ({ systemHealth, systemMetrics, loading }) => {
  const getHealthStatusBadge = (status) => {
    const statusConfig = {
      healthy: { color: 'bg-green-500', text: 'Healthy', icon: CheckCircle },
      warning: { color: 'bg-yellow-500', text: 'Warning', icon: AlertTriangle },
      error: { color: 'bg-red-500', text: 'Error', icon: X },
      critical: { color: 'bg-red-600', text: 'Critical', icon: AlertTriangle },
      offline: { color: 'bg-gray-500', text: 'Offline', icon: X }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-500', text: status, icon: Clock };
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon size={12} />
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-text-secondary mt-2">Loading system overview...</p>
      </div>
    );
  }

  if (!systemHealth) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">No system health data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Overall System Status */}
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-text-primary">
            <Server size={20} />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Overall Health</span>
            {getHealthStatusBadge(systemHealth.overall_status)}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-text-secondary">Uptime</span>
              <span className="text-text-primary">{systemHealth.uptime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Last Check</span>
              <span className="text-text-primary">{formatDate(systemHealth.last_check)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-text-primary">
            <Database size={20} />
            Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Status</span>
            {getHealthStatusBadge(systemHealth.database?.status)}
          </div>
          {systemHealth.database && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Connections</span>
                <span className="text-text-primary">{systemHealth.database.connections}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Response Time</span>
                <span className="text-text-primary">{systemHealth.database.response_time}ms</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Status */}
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-text-primary">
            <Globe size={20} />
            API Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Status</span>
            {getHealthStatusBadge(systemHealth.api?.status)}
          </div>
          {systemHealth.api && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Response Time</span>
                <span className="text-text-primary">{systemHealth.api.response_time}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Requests/min</span>
                <span className="text-text-primary">{systemHealth.api.requests_per_minute}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {systemMetrics && (
        <>
          <Card className="bg-background-secondary border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <Zap size={20} />
                CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Current</span>
                <span className="text-text-primary">{formatPercentage(systemMetrics.cpu?.current)}</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${systemMetrics.cpu?.current * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background-secondary border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <Cpu size={20} />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Used</span>
                <span className="text-text-primary">{formatBytes(systemMetrics.memory?.used)}</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${systemMetrics.memory?.usage_percentage}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-text-secondary">
                {formatBytes(systemMetrics.memory?.total)} total
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background-secondary border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-primary">
                <HardDrive size={20} />
                Disk Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Used</span>
                <span className="text-text-primary">{formatBytes(systemMetrics.disk?.used)}</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${systemMetrics.disk?.usage_percentage}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-text-secondary">
                {formatBytes(systemMetrics.disk?.total)} total
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// System Metrics Component
const SystemMetrics = ({ systemMetrics, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-text-secondary mt-2">Loading metrics...</p>
      </div>
    );
  }

  if (!systemMetrics) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">No metrics data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* User Activity */}
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-text-primary">
            <Users size={20} />
            User Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-text-secondary">Active Users</span>
            <span className="text-text-primary font-semibold">{systemMetrics.users?.active}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Total Users</span>
            <span className="text-text-primary">{systemMetrics.users?.total}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">New Today</span>
            <span className="text-text-primary">{systemMetrics.users?.new_today}</span>
          </div>
        </CardContent>
      </Card>

      {/* API Performance */}
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-text-primary">
            <TrendingUp size={20} />
            API Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-text-secondary">Requests/min</span>
            <span className="text-text-primary font-semibold">{systemMetrics.api?.requests_per_minute}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Avg Response</span>
            <span className="text-text-primary">{systemMetrics.api?.avg_response_time}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Error Rate</span>
            <span className="text-text-primary">{formatPercentage(systemMetrics.api?.error_rate)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Database Performance */}
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-text-primary">
            <Database size={20} />
            Database
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-text-secondary">Queries/min</span>
            <span className="text-text-primary font-semibold">{systemMetrics.database?.queries_per_minute}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Avg Query Time</span>
            <span className="text-text-primary">{systemMetrics.database?.avg_query_time}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Connections</span>
            <span className="text-text-primary">{systemMetrics.database?.active_connections}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// System Logs Component
const SystemLogs = ({ logs, loading, filters, onFilterChange, getLogLevelBadge, formatDate }) => {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="text-text-primary">Log Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="logLevel" className="text-text-secondary">Log Level</Label>
              <Select value={filters.logLevel} onValueChange={(value) => onFilterChange('logLevel', value)}>
                <SelectTrigger className="bg-input-bg border-input-border text-input-text">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent className="bg-background-secondary border-border">
                  <SelectItem value="">All Levels</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="service" className="text-text-secondary">Service</Label>
              <Select value={filters.service} onValueChange={(value) => onFilterChange('service', value)}>
                <SelectTrigger className="bg-input-bg border-input-border text-input-text">
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent className="bg-background-secondary border-border">
                  <SelectItem value="">All Services</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateRange" className="text-text-secondary">Time Range</Label>
              <Select value={filters.dateRange} onValueChange={(value) => onFilterChange('dateRange', value)}>
                <SelectTrigger className="bg-input-bg border-input-border text-input-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background-secondary border-border">
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search" className="text-text-secondary">Search</Label>
              <Input
                id="search"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="bg-input-bg border-input-border text-input-text placeholder:text-input-placeholder"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="text-text-primary">System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-text-secondary mt-2">Loading logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">No logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-text-secondary">Timestamp</th>
                    <th className="text-left p-2 text-text-secondary">Level</th>
                    <th className="text-left p-2 text-text-secondary">Service</th>
                    <th className="text-left p-2 text-text-secondary">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={index} className="border-b border-border hover:bg-background-primary">
                      <td className="p-2 text-text-secondary text-sm">{formatDate(log.timestamp)}</td>
                      <td className="p-2">{getLogLevelBadge(log.level)}</td>
                      <td className="p-2 text-text-primary">{log.service}</td>
                      <td className="p-2 text-text-primary">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Audit Logs Component
const AuditLogs = ({ auditLogs, loading, filters, onFilterChange, formatDate }) => {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="text-text-primary">Audit Log Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="action" className="text-text-secondary">Action</Label>
              <Select value={filters.action} onValueChange={(value) => onFilterChange('action', value)}>
                <SelectTrigger className="bg-input-bg border-input-border text-input-text">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent className="bg-background-secondary border-border">
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateRange" className="text-text-secondary">Time Range</Label>
              <Select value={filters.dateRange} onValueChange={(value) => onFilterChange('dateRange', value)}>
                <SelectTrigger className="bg-input-bg border-input-border text-input-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background-secondary border-border">
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search" className="text-text-secondary">Search</Label>
              <Input
                id="search"
                placeholder="Search audit logs..."
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="bg-input-bg border-input-border text-input-text placeholder:text-input-placeholder"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="text-text-primary">Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-text-secondary mt-2">Loading audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-text-secondary">Timestamp</th>
                    <th className="text-left p-2 text-text-secondary">User</th>
                    <th className="text-left p-2 text-text-secondary">Action</th>
                    <th className="text-left p-2 text-text-secondary">Entity</th>
                    <th className="text-left p-2 text-text-secondary">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, index) => (
                    <tr key={index} className="border-b border-border hover:bg-background-primary">
                      <td className="p-2 text-text-secondary text-sm">{formatDate(log.timestamp)}</td>
                      <td className="p-2 text-text-primary">{log.user_name}</td>
                      <td className="p-2">
                        <Badge className="bg-blue-500 text-white">{log.action}</Badge>
                      </td>
                      <td className="p-2 text-text-primary">{log.entity_type}</td>
                      <td className="p-2 text-text-primary">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMonitoring;
