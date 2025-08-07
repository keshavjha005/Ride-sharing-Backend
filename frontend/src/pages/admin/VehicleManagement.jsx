import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { 
  Car, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Settings,
  Users,
  Truck,
  Building2,
  Type
} from 'lucide-react';
import toast from 'react-hot-toast';

// Import management components
import VehicleTypesManagement from './vehicle/VehicleTypesManagement';
import VehicleBrandsManagement from './vehicle/VehicleBrandsManagement';
import VehicleModelsManagement from './vehicle/VehicleModelsManagement';
import UserVehiclesManagement from './vehicle/UserVehiclesManagement';
import VehicleAnalytics from './vehicle/VehicleAnalytics';

const VehicleManagement = () => {
  const { admin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('types');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && admin) {
      fetchAnalytics();
    }
  }, [authLoading, admin]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/vehicles/analytics?type=overview');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching vehicle analytics:', error);
      toast.error('Failed to load vehicle analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  const handleSettingsClick = () => {
    navigate('/admin/settings');
  };

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!admin) {
    navigate('/admin/login');
    return null;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Vehicle Management
          </h1>
          <p className="text-text-secondary">
            Manage vehicle types, brands, models, and user vehicles
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleSettingsClick}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Settings size={16} />
            <span>Settings</span>
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Type className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary">Vehicle Types</p>
                  <p className="text-2xl font-bold text-text-primary">{analytics.overview?.totalTypes || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary">Brands</p>
                  <p className="text-2xl font-bold text-text-primary">{analytics.overview?.totalBrands || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary">Models</p>
                  <p className="text-2xl font-bold text-text-primary">{analytics.overview?.totalModels || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary">User Vehicles</p>
                  <p className="text-2xl font-bold text-text-primary">{analytics.overview?.totalUserVehicles || 0}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="success" className="text-xs">
                      {analytics.overview?.verifiedVehicles || 0} Verified
                    </Badge>
                    <Badge variant="warning" className="text-xs">
                      {analytics.overview?.unverifiedVehicles || 0} Pending
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-background-secondary border border-border">
          <TabsTrigger 
            value="types" 
            className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Type size={16} />
            <span>Types</span>
          </TabsTrigger>
          <TabsTrigger 
            value="brands" 
            className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Building2 size={16} />
            <span>Brands</span>
          </TabsTrigger>
          <TabsTrigger 
            value="models" 
            className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Truck size={16} />
            <span>Models</span>
          </TabsTrigger>
          <TabsTrigger 
            value="user-vehicles" 
            className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Users size={16} />
            <span>User Vehicles</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Car size={16} />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-6">
          <VehicleTypesManagement />
        </TabsContent>

        <TabsContent value="brands" className="space-y-6">
          <VehicleBrandsManagement />
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <VehicleModelsManagement />
        </TabsContent>

        <TabsContent value="user-vehicles" className="space-y-6">
          <UserVehiclesManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <VehicleAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VehicleManagement; 