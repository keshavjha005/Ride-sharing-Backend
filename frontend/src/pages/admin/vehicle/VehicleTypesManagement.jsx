import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import VehicleTypeModal from './modals/VehicleTypeModal';

const VehicleTypesManagement = () => {
  const { admin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [viewingType, setViewingType] = useState(null);

  const limit = 20;

  useEffect(() => {
    if (!authLoading && admin) {
      fetchVehicleTypes();
    }
  }, [authLoading, admin, currentPage, searchTerm, activeOnly, sortBy, sortOrder]);

  const fetchVehicleTypes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit,
        search: searchTerm,
        activeOnly: activeOnly.toString(),
        sortBy,
        sortOrder
      });

      const response = await api.get(`/api/admin/vehicles/types?${params}`);
      setVehicleTypes(response.data.data.vehicleTypes);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      toast.error('Failed to load vehicle types');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVehicleTypes();
    setRefreshing(false);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    switch (key) {
      case 'activeOnly':
        setActiveOnly(value === 'true');
        break;
      case 'sortBy':
        setSortBy(value);
        break;
      case 'sortOrder':
        setSortOrder(value);
        break;
    }
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setEditingType(null);
    setViewingType(null);
    setShowModal(true);
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setViewingType(null);
    setShowModal(true);
  };

  const handleView = (type) => {
    setViewingType(type);
    setEditingType(null);
    setShowModal(true);
  };

  const handleDelete = async (type) => {
    if (!confirm(`Are you sure you want to delete "${type.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/admin/vehicles/types/${type.id}`);
      toast.success('Vehicle type deleted successfully');
      fetchVehicleTypes();
    } catch (error) {
      console.error('Error deleting vehicle type:', error);
      toast.error('Failed to delete vehicle type');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTypes.length === 0) {
      toast.error('Please select vehicle types to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedTypes.length} vehicle types?`)) {
      return;
    }

    try {
      await api.post('/api/admin/vehicles/bulk-update-types', {
        vehicleTypes: selectedTypes.map(id => ({ id })),
        operation: 'delete'
      });
      toast.success('Vehicle types deleted successfully');
      setSelectedTypes([]);
      fetchVehicleTypes();
    } catch (error) {
      console.error('Error bulk deleting vehicle types:', error);
      toast.error('Failed to delete vehicle types');
    }
  };

  const handleSelectAll = () => {
    if (selectedTypes.length === vehicleTypes.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(vehicleTypes.map(type => type.id));
    }
  };

  const handleSelectType = (typeId) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingType(null);
    setViewingType(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchVehicleTypes();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Vehicle Types</h2>
          <p className="text-text-secondary">Manage vehicle types and their pricing</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={handleCreate}
            className="flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Type</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={16} />
              <Input
                placeholder="Search types..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={activeOnly.toString()} onValueChange={(value) => handleFilterChange('activeOnly', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active Only</SelectItem>
                <SelectItem value="false">All Types</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="per_km_charges">Per KM Charges</SelectItem>
                <SelectItem value="minimum_fare">Minimum Fare</SelectItem>
                <SelectItem value="created_at">Created Date</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTypes.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">
                {selectedTypes.length} type(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleBulkDelete}
                  variant="destructive"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Trash2 size={14} />
                  <span>Delete Selected</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Types</CardTitle>
          <CardDescription>
            {vehicleTypes.length} vehicle type(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4">
                    <input
                      type="checkbox"
                      checked={selectedTypes.length === vehicleTypes.length && vehicleTypes.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="text-left p-4 font-medium text-text-primary">Name</th>
                  <th className="text-left p-4 font-medium text-text-primary">Description</th>
                  <th className="text-left p-4 font-medium text-text-primary">Per KM</th>
                  <th className="text-left p-4 font-medium text-text-primary">Min Fare</th>
                  <th className="text-left p-4 font-medium text-text-primary">Max Fare</th>
                  <th className="text-left p-4 font-medium text-text-primary">Status</th>
                  <th className="text-left p-4 font-medium text-text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicleTypes.map((type) => (
                  <tr key={type.id} className="border-b border-border hover:bg-background-secondary">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type.id)}
                        onChange={() => handleSelectType(type.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-text-primary">{type.name}</p>
                        <p className="text-sm text-text-muted">ID: {type.id.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-text-secondary max-w-xs truncate">
                        {type.description || 'No description'}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-text-primary">
                        {formatCurrency(type.per_km_charges)}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-text-primary">
                        {formatCurrency(type.minimum_fare)}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-text-primary">
                        {type.maximum_fare ? formatCurrency(type.maximum_fare) : 'No limit'}
                      </p>
                    </td>
                    <td className="p-4">
                      <Badge variant={type.is_active ? 'success' : 'error'}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleView(type)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          onClick={() => handleEdit(type)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          onClick={() => handleDelete(type)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-error hover:text-error"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-text-secondary">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <VehicleTypeModal
          isOpen={showModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          editingType={editingType}
          viewingType={viewingType}
        />
      )}
    </>
  );
};

export default VehicleTypesManagement; 