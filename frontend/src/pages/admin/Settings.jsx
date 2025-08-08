import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { 
  Settings as SettingsIcon,
  Search,
  Server,
  Zap,
  Lock,
  Database,
  Globe,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import SettingsCategory from '../../components/admin/settings/SettingsCategory';
import api from '../../utils/api';
import { useAuth } from '../../utils/AuthContext';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { admin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    search: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingChange, setPendingChange] = useState(null);

  const categoryConfig = {
    application: {
      title: 'Application Settings',
      description: 'Core application configuration and behavior',
      icon: Server
    },
    performance: {
      title: 'Performance Settings',
      description: 'System performance and optimization settings',
      icon: Zap
    },
    security: {
      title: 'Security Settings',
      description: 'Security and access control configuration',
      icon: Lock
    },
    maintenance: {
      title: 'Maintenance Settings',
      description: 'System maintenance and backup configuration',
      icon: Database
    },
    integration: {
      title: 'Integration Settings',
      description: 'External service integration settings',
      icon: Globe
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [admin, isAuthenticated, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Loading settings...');
      const response = await api.get('/api/admin/system-settings');
      console.log('Settings response:', response.data);
      setSettings(response.data.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key, value) => {
    try {
      // Clear previous errors and success messages
      setErrors({});
      setSuccessMessage('');

      // Validate the setting before updating
      const setting = settings.find(s => s.setting_key === key);
      if (setting) {
        const validationError = validateSettingValue(value, setting);
        if (validationError) {
          setErrors(prev => ({ ...prev, [key]: validationError }));
          return;
        }

        // Check if setting requires confirmation
        if (setting.validation_rules?.requires_confirmation) {
          setPendingChange({ key, value, setting });
          setShowConfirmDialog(true);
          return;
        }
      }

      await updateSetting(key, value);
    } catch (error) {
      console.error('Error updating setting:', error);
      setErrors(prev => ({ 
        ...prev, 
        [key]: error.response?.data?.message || 'Failed to update setting' 
      }));
    }
  };

  const updateSetting = async (key, value) => {
    try {
      await api.put(`/api/admin/system-settings/${key}`, {
        setting_value: value
      });
      
      setSuccessMessage('Setting updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      loadData(); // Reload settings after update
    } catch (error) {
      throw error;
    }
  };

  const validateSettingValue = (value, setting) => {
    const rules = setting.validation_rules || {};
    
    switch (setting.setting_type) {
      case 'boolean':
        if (value !== 'true' && value !== 'false') {
          return 'Value must be "true" or "false"';
        }
        break;
      
      case 'number':
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return 'Value must be a number';
        }
        if (rules.min !== undefined && numValue < rules.min) {
          return `Value must be at least ${rules.min}`;
        }
        if (rules.max !== undefined && numValue > rules.max) {
          return `Value must be at most ${rules.max}`;
        }
        break;
      
      case 'string':
        if (rules.pattern) {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(value)) {
            return 'Value does not match required pattern';
          }
        }
        if (rules.min_length && value.length < rules.min_length) {
          return `Value must be at least ${rules.min_length} characters`;
        }
        if (rules.max_length && value.length > rules.max_length) {
          return `Value must be at most ${rules.max_length} characters`;
        }
        break;
      
      case 'json':
        try {
          JSON.parse(value);
        } catch (e) {
          return 'Value must be valid JSON';
        }
        break;
    }
    
    return null;
  };

  const handleConfirmChange = async () => {
    if (pendingChange) {
      try {
        await updateSetting(pendingChange.key, pendingChange.value);
        setShowConfirmDialog(false);
        setPendingChange(null);
      } catch (error) {
        console.error('Error updating setting:', error);
      }
    }
  };

  const handleCancelChange = () => {
    setShowConfirmDialog(false);
    setPendingChange(null);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

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

  const settingsByCategory = filteredSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {});

  if (!admin) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-2">
            Manage core system settings and configurations
          </p>
        </div>
        <Button 
          onClick={loadData} 
          className="bg-primary hover:bg-primary-dark text-text-primary"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center gap-2">
          <CheckCircle size={16} />
          {successMessage}
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertTriangle size={16} />
          <div>
            {Object.entries(errors).map(([key, error]) => (
              <div key={key} className="text-sm">{error}</div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="search" className="text-text-secondary">Search Settings</Label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
            <Input
              id="search"
              placeholder="Search by key or title..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 bg-input-bg border-input-border text-input-text placeholder:text-input-placeholder"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Label htmlFor="category" className="text-text-secondary">Category</Label>
          <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger className="bg-input-bg border-input-border text-input-text">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-background-secondary border-border">
              <SelectItem value="">All Categories</SelectItem>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-text-secondary mt-2">Loading settings...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(categoryConfig).map(([category, config]) => {
            const categorySettings = settingsByCategory[category] || [];
            if (filters.category && filters.category !== category) return null;
            if (categorySettings.length === 0) return null;

            return (
              <SettingsCategory
                key={category}
                title={config.title}
                description={config.description}
                icon={config.icon}
                settings={categorySettings}
                onSettingChange={handleSettingChange}
                errors={errors}
              />
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-secondary border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-yellow-500" />
              <h3 className="text-lg font-semibold text-text-primary">Confirm Setting Change</h3>
            </div>
            <p className="text-text-secondary mb-4">
              Are you sure you want to change <strong>{pendingChange.setting.title_en}</strong> to <strong>{pendingChange.value}</strong>?
            </p>
            <p className="text-sm text-text-muted mb-6">
              This action may affect system behavior and cannot be easily undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button 
                onClick={handleCancelChange}
                variant="outline"
                className="border-border text-text-primary"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmChange}
                className="bg-warning hover:bg-warning-dark text-text-primary"
              >
                Confirm Change
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;