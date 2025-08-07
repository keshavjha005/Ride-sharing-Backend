import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import api from '../../utils/api';
import { 
  DollarSign, 
  Car, 
  TrendingUp, 
  Calendar,
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  Zap,
  Target,
  MapPin,
  Users,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Switch } from '../../components/ui/Switch';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';

const PricingManagement = () => {
  const { admin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  
  // Vehicle types data
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  const [showVehicleTypeModal, setShowVehicleTypeModal] = useState(false);
  
  // Multipliers data
  const [multipliers, setMultipliers] = useState([]);
  const [selectedMultiplier, setSelectedMultiplier] = useState(null);
  const [showMultiplierModal, setShowMultiplierModal] = useState(false);
  
  // Events data
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Analytics data
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    activeOnly: true,
    vehicleTypeId: '',
    eventType: ''
  });

  // Form data
  const [vehicleTypeForm, setVehicleTypeForm] = useState({
    per_km_charges: '',
    minimum_fare: '',
    maximum_fare: '',
    is_active: true
  });

  const [multiplierForm, setMultiplierForm] = useState({
    vehicle_type_id: '',
    multiplier_type: '',
    multiplier_value: '',
    is_active: true
  });

  const [eventForm, setEventForm] = useState({
    event_name: '',
    event_type: '',
    start_date: '',
    end_date: '',
    pricing_multiplier: '',
    affected_vehicle_types: ['all'],
    affected_areas: ['all'],
    description: '',
    is_active: true
  });

  useEffect(() => {
    if (admin) {
      loadData();
    }
  }, [admin, activeTab, filters, analyticsPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'dashboard':
          await loadDashboardData();
          break;
        case 'vehicle-types':
          await loadVehicleTypes();
          break;
        case 'multipliers':
          await loadMultipliers();
          break;
        case 'events':
          await loadEvents();
          break;
        case 'analytics':
          await loadAnalytics();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    const response = await api.get(`/api/admin/pricing/dashboard?period=${analyticsPeriod}`);
    setDashboardData(response.data.data);
  };

  const loadVehicleTypes = async () => {
    const params = new URLSearchParams({
      activeOnly: filters.activeOnly.toString(),
      search: filters.search
    });
    const response = await api.get(`/api/admin/pricing/vehicle-types?${params}`);
    setVehicleTypes(response.data.data);
  };

  const loadMultipliers = async () => {
    const params = new URLSearchParams({
      vehicleTypeId: filters.vehicleTypeId,
      activeOnly: filters.activeOnly.toString()
    });
    const response = await api.get(`/api/admin/pricing/multipliers?${params}`);
    setMultipliers(response.data.data.multipliers);
  };

  const loadEvents = async () => {
    const params = new URLSearchParams({
      activeOnly: filters.activeOnly.toString(),
      eventType: filters.eventType,
      search: filters.search
    });
    const response = await api.get(`/api/admin/pricing/events?${params}`);
    setEvents(response.data.data);
  };

  const loadAnalytics = async () => {
    const response = await api.get(`/api/admin/pricing/analytics?period=${analyticsPeriod}`);
    setAnalyticsData(response.data.data);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Vehicle Type Management
  const handleVehicleTypeUpdate = async (id, data) => {
    try {
      await api.put(`/api/admin/pricing/vehicle-types/${id}`, data);
      toast.success('Vehicle type pricing updated successfully');
      loadVehicleTypes();
      setShowVehicleTypeModal(false);
    } catch (error) {
      console.error('Error updating vehicle type:', error);
      toast.error('Failed to update vehicle type pricing');
    }
  };

  // Multiplier Management
  const handleMultiplierCreate = async (data) => {
    try {
      await api.post('/api/admin/pricing/multipliers', data);
      toast.success('Multiplier created successfully');
      loadMultipliers();
      setShowMultiplierModal(false);
      setMultiplierForm({
        vehicle_type_id: '',
        multiplier_type: '',
        multiplier_value: '',
        is_active: true
      });
    } catch (error) {
      console.error('Error creating multiplier:', error);
      toast.error('Failed to create multiplier');
    }
  };

  const handleMultiplierUpdate = async (id, data) => {
    try {
      await api.put(`/api/admin/pricing/multipliers/${id}`, data);
      toast.success('Multiplier updated successfully');
      loadMultipliers();
      setShowMultiplierModal(false);
    } catch (error) {
      console.error('Error updating multiplier:', error);
      toast.error('Failed to update multiplier');
    }
  };

  const handleMultiplierDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this multiplier?')) {
      try {
        await api.delete(`/api/admin/pricing/multipliers/${id}`);
        toast.success('Multiplier deleted successfully');
        loadMultipliers();
      } catch (error) {
        console.error('Error deleting multiplier:', error);
        toast.error('Failed to delete multiplier');
      }
    }
  };

  // Event Management
  const handleEventCreate = async (data) => {
    try {
      await api.post('/api/admin/pricing/events', data);
      toast.success('Pricing event created successfully');
      loadEvents();
      setShowEventModal(false);
      setEventForm({
        event_name: '',
        event_type: '',
        start_date: '',
        end_date: '',
        pricing_multiplier: '',
        affected_vehicle_types: ['all'],
        affected_areas: ['all'],
        description: '',
        is_active: true
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create pricing event');
    }
  };

  const handleEventUpdate = async (id, data) => {
    try {
      await api.put(`/api/admin/pricing/events/${id}`, data);
      toast.success('Pricing event updated successfully');
      loadEvents();
      setShowEventModal(false);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update pricing event');
    }
  };

  const handleEventDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this pricing event?')) {
      try {
        await api.delete(`/api/admin/pricing/events/${id}`);
        toast.success('Pricing event deleted successfully');
        loadEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete pricing event');
      }
    }
  };

  const handleExport = async (type = 'all') => {
    try {
      const response = await api.get(`/api/admin/pricing/export?type=${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pricing-export-${type}-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const getStatusBadge = (status, type = 'default') => {
    const statusConfig = {
      active: { color: 'bg-green-500', text: 'Active' },
      inactive: { color: 'bg-gray-500', text: 'Inactive' },
      pending: { color: 'bg-yellow-500', text: 'Pending' },
      completed: { color: 'bg-blue-500', text: 'Completed' },
      cancelled: { color: 'bg-red-500', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-500', text: status };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getEventTypeBadge = (type) => {
    const typeConfig = {
      seasonal: { color: 'bg-blue-500', text: 'Seasonal' },
      holiday: { color: 'bg-purple-500', text: 'Holiday' },
      special_event: { color: 'bg-orange-500', text: 'Special Event' },
      demand_surge: { color: 'bg-red-500', text: 'Demand Surge' }
    };
    
    const config = typeConfig[type] || { color: 'bg-gray-500', text: type };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Pricing Management</h1>
          <p className="text-text-secondary mt-2">
            Manage vehicle pricing, multipliers, and dynamic events
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => handleExport()}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-background-secondary border border-border">
          <TabsTrigger 
            value="dashboard" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="vehicle-types" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Car className="w-4 h-4 mr-2" />
            Vehicle Types
          </TabsTrigger>
          <TabsTrigger 
            value="multipliers" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Multipliers
          </TabsTrigger>
          <TabsTrigger 
            value="events" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Events
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Activity className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {dashboardData && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card>
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Total Revenue</p>
                        <p className="text-2xl font-bold text-text-primary">
                          ${(dashboardData.overview?.totalRevenue || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-500/10 rounded-lg">
                        <DollarSign className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Average Fare</p>
                        <p className="text-2xl font-bold text-text-primary">
                          ${(dashboardData.overview?.averageFare || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-purple-500/10 rounded-lg">
                        <FileText className="w-6 h-6 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Total Calculations</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {dashboardData.overview?.totalCalculations || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-orange-500/10 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Active Multipliers</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {dashboardData.overview?.activeMultipliers || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-red-500/10 rounded-lg">
                        <Calendar className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Active Events</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {dashboardData.overview?.activeEvents || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Vehicle Types Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Car className="w-5 h-5" />
                    <span>Vehicle Types</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData.vehicleTypes && Array.isArray(dashboardData.vehicleTypes) ? (
                      dashboardData.vehicleTypes.map((vt) => (
                        <div key={vt.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-text-primary">{vt.name}</h3>
                            {getStatusBadge(vt.is_active ? 'active' : 'inactive')}
                          </div>
                          <div className="space-y-1 text-sm text-text-secondary">
                            <p>Per KM: ${vt.per_km_charges}</p>
                            <p>Min: ${vt.minimum_fare}</p>
                            {vt.maximum_fare && <p>Max: ${vt.maximum_fare}</p>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-4 text-text-secondary">
                        No vehicle types available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Recent Calculations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.recentCalculations && Array.isArray(dashboardData.recentCalculations) ? (
                      dashboardData.recentCalculations.map((calc) => (
                        <div key={calc.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div>
                            <p className="font-medium text-text-primary">
                              ${calc.final_fare.toFixed(2)} - {calc.base_distance}km
                            </p>
                            <p className="text-sm text-text-secondary">
                              {new Date(calc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-text-secondary">
                              Base: ${calc.base_fare.toFixed(2)}
                            </p>
                            <p className="text-xs text-text-muted">
                              {calc.applied_multipliers?.length || 0} multipliers
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-text-secondary">
                        No recent calculations available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Vehicle Types Tab */}
        <TabsContent value="vehicle-types" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search vehicle types..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="activeOnly">Active Only</Label>
                  <Switch
                    id="activeOnly"
                    checked={filters.activeOnly}
                    onCheckedChange={(checked) => handleFilterChange('activeOnly', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Types List */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Types Pricing</CardTitle>
              <CardDescription>
                Manage per-kilometer pricing for different vehicle types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vehicleTypes.map((vt) => (
                  <div key={vt.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-text-primary">{vt.name}</h3>
                        {getStatusBadge(vt.is_active ? 'active' : 'inactive')}
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{vt.description}</p>
                      <div className="flex items-center space-x-6 mt-2 text-sm text-text-secondary">
                        <span>Per KM: ${vt.per_km_charges}</span>
                        <span>Min: ${vt.minimum_fare}</span>
                        {vt.maximum_fare && <span>Max: ${vt.maximum_fare}</span>}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedVehicleType(vt);
                        setVehicleTypeForm({
                          per_km_charges: vt.per_km_charges,
                          minimum_fare: vt.minimum_fare,
                          maximum_fare: vt.maximum_fare || '',
                          is_active: vt.is_active
                        });
                        setShowVehicleTypeModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multipliers Tab */}
        <TabsContent value="multipliers" className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Pricing Multipliers</h2>
              <p className="text-text-secondary mt-1">
                Manage dynamic pricing multipliers for different conditions
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedMultiplier(null);
                setMultiplierForm({
                  vehicle_type_id: '',
                  multiplier_type: '',
                  multiplier_value: '',
                  is_active: true
                });
                setShowMultiplierModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Multiplier
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Select
                  value={filters.vehicleTypeId}
                  onValueChange={(value) => handleFilterChange('vehicleTypeId', value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Vehicle Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Vehicle Types</SelectItem>
                    {vehicleTypes.map((vt) => (
                      <SelectItem key={vt.id} value={vt.id}>
                        {vt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="activeOnly">Active Only</Label>
                  <Switch
                    id="activeOnly"
                    checked={filters.activeOnly}
                    onCheckedChange={(checked) => handleFilterChange('activeOnly', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multipliers List */}
          <Card>
            <CardContent>
              <div className="space-y-3">
                {multipliers.map((multiplier) => (
                  <div key={multiplier.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-text-primary">
                          {multiplier.multiplier_type.replace('_', ' ').toUpperCase()}
                        </h3>
                        {getStatusBadge(multiplier.is_active ? 'active' : 'inactive')}
                      </div>
                      <p className="text-sm text-text-secondary mt-1">
                        Multiplier: {multiplier.multiplier_value}x
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        Vehicle Type: {vehicleTypes.find(vt => vt.id === multiplier.vehicle_type_id)?.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMultiplier(multiplier);
                          setMultiplierForm({
                            vehicle_type_id: multiplier.vehicle_type_id,
                            multiplier_type: multiplier.multiplier_type,
                            multiplier_value: multiplier.multiplier_value,
                            is_active: multiplier.is_active
                          });
                          setShowMultiplierModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMultiplierDelete(multiplier.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Pricing Events</h2>
              <p className="text-text-secondary mt-1">
                Manage dynamic pricing events and seasonal adjustments
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedEvent(null);
                setEventForm({
                  event_name: '',
                  event_type: '',
                  start_date: '',
                  end_date: '',
                  pricing_multiplier: '',
                  affected_vehicle_types: ['all'],
                  affected_areas: ['all'],
                  description: '',
                  is_active: true
                });
                setShowEventModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Search events..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="max-w-sm"
                />
                <Select
                  value={filters.eventType}
                  onValueChange={(value) => handleFilterChange('eventType', value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Event Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Event Types</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="special_event">Special Event</SelectItem>
                    <SelectItem value="demand_surge">Demand Surge</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="activeOnly">Active Only</Label>
                  <Switch
                    id="activeOnly"
                    checked={filters.activeOnly}
                    onCheckedChange={(checked) => handleFilterChange('activeOnly', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card>
            <CardContent>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-text-primary">{event.event_name}</h3>
                        {getEventTypeBadge(event.event_type)}
                        {getStatusBadge(event.is_active ? 'active' : 'inactive')}
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{event.description}</p>
                      <div className="flex items-center space-x-6 mt-2 text-sm text-text-secondary">
                        <span>Multiplier: {event.pricing_multiplier}x</span>
                        <span>
                          {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(event);
                          setEventForm({
                            event_name: event.event_name,
                            event_type: event.event_type,
                            start_date: event.start_date.split('T')[0],
                            end_date: event.end_date.split('T')[0],
                            pricing_multiplier: event.pricing_multiplier,
                            affected_vehicle_types: event.affected_vehicle_types,
                            affected_areas: event.affected_areas,
                            description: event.description,
                            is_active: event.is_active
                          });
                          setShowEventModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEventDelete(event.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Period Selector */}
          <Card>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Label>Analytics Period:</Label>
                <Select value={analyticsPeriod} onValueChange={setAnalyticsPeriod}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Content */}
          {analyticsData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Total Revenue:</span>
                      <span className="font-semibold">${analyticsData.total_revenue?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Average Fare:</span>
                      <span className="font-semibold">${analyticsData.average_final_fare?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Total Calculations:</span>
                      <span className="font-semibold">{analyticsData.total_calculations || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Multiplier Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.multiplier_usage && Object.entries(analyticsData.multiplier_usage).map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="text-text-secondary capitalize">{type.replace('_', ' ')}:</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Vehicle Type Modal */}
      {showVehicleTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-secondary p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Vehicle Type Pricing</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="per_km_charges">Per KM Charges ($)</Label>
                <Input
                  id="per_km_charges"
                  type="number"
                  step="0.01"
                  value={vehicleTypeForm.per_km_charges}
                  onChange={(e) => setVehicleTypeForm(prev => ({ ...prev, per_km_charges: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="minimum_fare">Minimum Fare ($)</Label>
                <Input
                  id="minimum_fare"
                  type="number"
                  step="0.01"
                  value={vehicleTypeForm.minimum_fare}
                  onChange={(e) => setVehicleTypeForm(prev => ({ ...prev, minimum_fare: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="maximum_fare">Maximum Fare ($)</Label>
                <Input
                  id="maximum_fare"
                  type="number"
                  step="0.01"
                  value={vehicleTypeForm.maximum_fare}
                  onChange={(e) => setVehicleTypeForm(prev => ({ ...prev, maximum_fare: e.target.value }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={vehicleTypeForm.is_active}
                  onCheckedChange={(checked) => setVehicleTypeForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowVehicleTypeModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleVehicleTypeUpdate(selectedVehicleType.id, vehicleTypeForm)}
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Multiplier Modal */}
      {showMultiplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-secondary p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedMultiplier ? 'Edit Multiplier' : 'Add Multiplier'}
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="vehicle_type_id">Vehicle Type</Label>
                <Select
                  value={multiplierForm.vehicle_type_id}
                  onValueChange={(value) => setMultiplierForm(prev => ({ ...prev, vehicle_type_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((vt) => (
                      <SelectItem key={vt.id} value={vt.id}>
                        {vt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="multiplier_type">Multiplier Type</Label>
                <Select
                  value={multiplierForm.multiplier_type}
                  onValueChange={(value) => setMultiplierForm(prev => ({ ...prev, multiplier_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select multiplier type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="peak_hour">Peak Hour</SelectItem>
                    <SelectItem value="weekend">Weekend</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="weather">Weather</SelectItem>
                    <SelectItem value="demand">Demand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="multiplier_value">Multiplier Value</Label>
                <Input
                  id="multiplier_value"
                  type="number"
                  step="0.01"
                  min="1.0"
                  value={multiplierForm.multiplier_value}
                  onChange={(e) => setMultiplierForm(prev => ({ ...prev, multiplier_value: e.target.value }))}
                  placeholder="e.g., 1.25 for 25% increase"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={multiplierForm.is_active}
                  onCheckedChange={(checked) => setMultiplierForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowMultiplierModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedMultiplier) {
                    handleMultiplierUpdate(selectedMultiplier.id, multiplierForm);
                  } else {
                    handleMultiplierCreate(multiplierForm);
                  }
                }}
              >
                {selectedMultiplier ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-secondary p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {selectedEvent ? 'Edit Pricing Event' : 'Add Pricing Event'}
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="event_name">Event Name</Label>
                <Input
                  id="event_name"
                  value={eventForm.event_name}
                  onChange={(e) => setEventForm(prev => ({ ...prev, event_name: e.target.value }))}
                  placeholder="e.g., New Year Surge"
                />
              </div>
              <div>
                <Label htmlFor="event_type">Event Type</Label>
                <Select
                  value={eventForm.event_type}
                  onValueChange={(value) => setEventForm(prev => ({ ...prev, event_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="special_event">Special Event</SelectItem>
                    <SelectItem value="demand_surge">Demand Surge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={eventForm.start_date}
                    onChange={(e) => setEventForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={eventForm.end_date}
                    onChange={(e) => setEventForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="pricing_multiplier">Pricing Multiplier</Label>
                <Input
                  id="pricing_multiplier"
                  type="number"
                  step="0.01"
                  min="1.0"
                  value={eventForm.pricing_multiplier}
                  onChange={(e) => setEventForm(prev => ({ ...prev, pricing_multiplier: e.target.value }))}
                  placeholder="e.g., 2.5 for 150% increase"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the event and pricing rationale"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={eventForm.is_active}
                  onCheckedChange={(checked) => setEventForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowEventModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedEvent) {
                    handleEventUpdate(selectedEvent.id, eventForm);
                  } else {
                    handleEventCreate(eventForm);
                  }
                }}
              >
                {selectedEvent ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingManagement; 