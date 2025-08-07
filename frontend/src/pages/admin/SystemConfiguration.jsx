import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { 
  Settings, 
  Flag, 
  Activity, 
  Plus, 
  Search, 
  Filter, 
  Edit,
  Trash2,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Server,
  Globe,
  Smartphone,
  Monitor,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const SystemConfiguration = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState([]);
  const [featureFlags, setFeatureFlags] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthLogs, setHealthLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    type: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'settings':
          const settingsResponse = await axios.get('/api/admin/system-settings');
          setSettings(settingsResponse.data.data);
          const categoriesResponse = await axios.get('/api/admin/system-settings/categories');
          setCategories(categoriesResponse.data.data);
          break;
        case 'features':
          const featuresResponse = await axios.get('/api/admin/feature-flags');
          setFeatureFlags(featuresResponse.data.data);
          break;
        case 'health':
          const healthResponse = await axios.get('/api/admin/system-health');
          setSystemHealth(healthResponse.data.data);
          const logsResponse = await axios.get('/api/admin/system-health/logs');
          setHealthLogs(logsResponse.data.data);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      healthy: { color: 'bg-green-500', text: 'Healthy', icon: CheckCircle },
      warning: { color: 'bg-yellow-500', text: 'Warning', icon: AlertTriangle },
      error: { color: 'bg-red-500', text: 'Error', icon: X },
      critical: { color: 'bg-red-600', text: 'Critical', icon: AlertTriangle }
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

  const getSettingTypeBadge = (type) => {
    const typeConfig = {
      string: { color: 'bg-blue-500', text: 'String' },
      number: { color: 'bg-green-500', text: 'Number' },
      boolean: { color: 'bg-purple-500', text: 'Boolean' },
      json: { color: 'bg-orange-500', text: 'JSON' }
    };
    
    const config = typeConfig[type] || { color: 'bg-gray-500', text: type };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      app: { color: 'bg-blue-500', text: 'App' },
      payment: { color: 'bg-green-500', text: 'Payment' },
      notification: { color: 'bg-purple-500', text: 'Notification' },
      localization: { color: 'bg-orange-500', text: 'Localization' },
      ride: { color: 'bg-indigo-500', text: 'Ride' }
    };
    
    const config = categoryConfig[category] || { color: 'bg-gray-500', text: category };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleHealthCheck = async () => {
    try {
      await axios.post('/api/admin/system-health/check');
      loadData();
    } catch (error) {
      console.error('Error performing health check:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Configuration</h1>
          <p className="text-gray-400 mt-2">Manage system settings, feature flags, and monitor system health</p>
        </div>
        <Button onClick={handleRefresh} className="bg-primary hover:bg-primary-dark">
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-background-secondary border border-border">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings size={16} />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Flag size={16} />
            Feature Flags
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity size={16} />
            System Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <SystemSettingsTab 
            settings={settings} 
            categories={categories}
            loading={loading} 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onRefresh={handleRefresh} 
          />
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <FeatureFlagsTab 
            featureFlags={featureFlags} 
            loading={loading} 
            onRefresh={handleRefresh} 
          />
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <SystemHealthTab 
            systemHealth={systemHealth} 
            healthLogs={healthLogs}
            loading={loading} 
            onRefresh={handleRefresh}
            onHealthCheck={handleHealthCheck}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// System Settings Tab Component
const SystemSettingsTab = ({ settings, categories, loading, filters, onFilterChange, onRefresh }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);

  const filteredSettings = settings.filter(setting => {
    if (filters.category && setting.category !== filters.category) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        setting.setting_key.toLowerCase().includes(searchTerm) ||
        setting.title_en?.toLowerCase().includes(searchTerm) ||
        setting.title_ar?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings size={20} />
            System Settings
          </CardTitle>
          <CardDescription className="text-gray-400">
            Manage application configuration settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="text-gray-300">Search Settings</Label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by key or title..."
                  value={filters.search}
                  onChange={(e) => onFilterChange('search', e.target.value)}
                  className="pl-10 bg-background-tertiary border-border text-white"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="category" className="text-gray-300">Category</Label>
              <Select value={filters.category} onValueChange={(value) => onFilterChange('category', value)}>
                <SelectTrigger className="bg-background-tertiary border-border text-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-background-secondary border-border">
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.category} value={cat.category}>
                      {cat.category} ({cat.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary-dark">
                <Plus size={16} className="mr-2" />
                Add Setting
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading settings...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSettings.map((setting) => (
                <Card key={setting.id} className="bg-background-tertiary border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">{setting.setting_key}</h3>
                          {getSettingTypeBadge(setting.setting_type)}
                          {getCategoryBadge(setting.category)}
                          {setting.is_public && (
                            <Badge className="bg-blue-500 text-white">Public</Badge>
                          )}
                          {!setting.is_editable && (
                            <Badge className="bg-gray-500 text-white">Read-only</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 mb-2">
                          <p className="font-medium">{setting.title_en}</p>
                          {setting.title_ar && (
                            <p className="text-right" dir="rtl">{setting.title_ar}</p>
                          )}
                        </div>
                        {setting.description_en && (
                          <p className="text-sm text-gray-500 mb-2">{setting.description_en}</p>
                        )}
                        <div className="text-sm">
                          <span className="text-gray-400">Value: </span>
                          <span className="text-white font-mono bg-background-secondary px-2 py-1 rounded">
                            {setting.setting_value || 'null'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingSetting(setting)}
                          className="border-border text-gray-300 hover:text-white"
                        >
                          <Edit size={14} />
                        </Button>
                        {setting.is_editable && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Feature Flags Tab Component
const FeatureFlagsTab = ({ featureFlags, loading, onRefresh }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState(null);

  return (
    <div className="space-y-6">
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Flag size={20} />
            Feature Flags
          </CardTitle>
          <CardDescription className="text-gray-400">
            Manage feature flags and rollout configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-6">
            <Button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary-dark">
              <Plus size={16} className="mr-2" />
              Add Feature Flag
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading feature flags...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {featureFlags.map((flag) => (
                <Card key={flag.id} className="bg-background-tertiary border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">{flag.feature_key}</h3>
                          {flag.is_enabled ? (
                            <Badge className="bg-green-500 text-white">Enabled</Badge>
                          ) : (
                            <Badge className="bg-gray-500 text-white">Disabled</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 mb-2">
                          <p className="font-medium">{flag.feature_name_en}</p>
                          {flag.feature_name_ar && (
                            <p className="text-right" dir="rtl">{flag.feature_name_ar}</p>
                          )}
                        </div>
                        {flag.description_en && (
                          <p className="text-sm text-gray-500 mb-2">{flag.description_en}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Globe size={14} className="text-gray-400" />
                            <span className={flag.enabled_for_web ? 'text-green-400' : 'text-gray-500'}>
                              Web {flag.enabled_for_web ? '✓' : '✗'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Smartphone size={14} className="text-gray-400" />
                            <span className={flag.enabled_for_ios ? 'text-green-400' : 'text-gray-500'}>
                              iOS {flag.enabled_for_ios ? '✓' : '✗'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Monitor size={14} className="text-gray-400" />
                            <span className={flag.enabled_for_android ? 'text-green-400' : 'text-gray-500'}>
                              Android {flag.enabled_for_android ? '✓' : '✗'}
                            </span>
                          </div>
                          {flag.rollout_percentage > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">Rollout:</span>
                              <span className="text-white">{flag.rollout_percentage}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingFlag(flag)}
                          className="border-border text-gray-300 hover:text-white"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// System Health Tab Component
const SystemHealthTab = ({ systemHealth, healthLogs, loading, onRefresh, onHealthCheck }) => {
  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity size={20} />
            System Status
          </CardTitle>
          <CardDescription className="text-gray-400">
            Real-time system health monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading system health...</p>
            </div>
          ) : systemHealth ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {getStatusBadge(systemHealth.system_status)}
                    </div>
                    <p className="text-sm text-gray-400">Overall Status</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {systemHealth.recent_logs.length}
                    </div>
                    <p className="text-sm text-gray-400">Recent Checks</p>
                  </div>
                </div>
                <Button onClick={onHealthCheck} className="bg-primary hover:bg-primary-dark">
                  <Activity size={16} className="mr-2" />
                  Run Health Check
                </Button>
              </div>

              {/* Service Summary */}
              {systemHealth.service_summary && systemHealth.service_summary.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Service Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {systemHealth.service_summary.map((service, index) => (
                      <Card key={index} className="bg-background-tertiary border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white">{service.service_name}</h4>
                            {getStatusBadge(service.status)}
                          </div>
                          <div className="text-sm text-gray-400">
                            <p>Count: {service.count}</p>
                            <p>Last Check: {formatDate(service.last_check)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No system health data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Logs */}
      <Card className="bg-background-secondary border-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock size={20} />
            Health Logs
          </CardTitle>
          <CardDescription className="text-gray-400">
            Recent system health check logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading health logs...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {healthLogs.map((log) => (
                <Card key={log.id} className="bg-background-tertiary border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-white">{log.service_name}</h4>
                          {getStatusBadge(log.status)}
                        </div>
                        <p className="text-sm text-gray-400 mb-1">{log.message_en}</p>
                        {log.message_ar && (
                          <p className="text-sm text-gray-500 text-right" dir="rtl">{log.message_ar}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatDate(log.created_at)}</span>
                          {log.response_time_ms && (
                            <span>Response: {log.response_time_ms}ms</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemConfiguration; 