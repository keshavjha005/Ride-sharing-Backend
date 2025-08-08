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
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import VehicleBrandModal from './modals/VehicleBrandModal';
import BrandLogo from '../../../components/ui/BrandLogo';

const VehicleBrandsManagement = () => {
  const { admin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [viewingBrand, setViewingBrand] = useState(null);

  const limit = 20;

  useEffect(() => {
    if (!authLoading && admin) {
      fetchBrands();
    }
  }, [authLoading, admin, currentPage, searchTerm, activeOnly, sortBy, sortOrder]);

  const fetchBrands = async () => {
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

      const response = await api.get(`/api/admin/vehicles/brands?${params}`);
      setBrands(response.data.data.brands);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching vehicle brands:', error);
      toast.error('Failed to load vehicle brands');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBrands();
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
    setEditingBrand(null);
    setViewingBrand(null);
    setShowModal(true);
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setViewingBrand(null);
    setShowModal(true);
  };

  const handleView = (brand) => {
    setViewingBrand(brand);
    setEditingBrand(null);
    setShowModal(true);
  };

  const handleDelete = async (brand) => {
    if (!confirm(`Are you sure you want to delete "${brand.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/admin/vehicles/brands/${brand.id}`);
      toast.success('Vehicle brand deleted successfully');
      fetchBrands();
    } catch (error) {
      console.error('Error deleting vehicle brand:', error);
      toast.error('Failed to delete vehicle brand');
    }
  };

  const handleSelectAll = () => {
    if (selectedBrands.length === brands.length) {
      setSelectedBrands([]);
    } else {
      setSelectedBrands(brands.map(brand => brand.id));
    }
  };

  const handleSelectBrand = (brandId) => {
    setSelectedBrands(prev => 
      prev.includes(brandId) 
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingBrand(null);
    setViewingBrand(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchBrands();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Vehicle Brands</h2>
          <p className="text-text-secondary">Manage vehicle brands and their logos</p>
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
            <span>Add Brand</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={16} />
              <Input
                placeholder="Search brands..."
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
                <SelectItem value="false">All Brands</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
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

      {/* Vehicle Brands Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Brands</CardTitle>
          <CardDescription>
            {brands.length} vehicle brand(s) found
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
                      checked={selectedBrands.length === brands.length && brands.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="text-left p-4 font-medium text-text-primary">Logo</th>
                  <th className="text-left p-4 font-medium text-text-primary">Name</th>
                  <th className="text-left p-4 font-medium text-text-primary">Status</th>
                  <th className="text-left p-4 font-medium text-text-primary">Created</th>
                  <th className="text-left p-4 font-medium text-text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id} className="border-b border-border hover:bg-background-secondary">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand.id)}
                        onChange={() => handleSelectBrand(brand.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="p-4">
                      <BrandLogo 
                        logoUrl={brand.logo_url} 
                        brandName={brand.name}
                        size="md"
                        showFallbackText={true}
                      />
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-text-primary">{brand.name}</p>
                        <p className="text-sm text-text-muted">ID: {brand.id.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={brand.is_active ? 'success' : 'error'}>
                        {brand.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-text-secondary">
                        {new Date(brand.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleView(brand)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          onClick={() => handleEdit(brand)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          onClick={() => handleDelete(brand)}
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
        <VehicleBrandModal
          isOpen={showModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          editingBrand={editingBrand}
          viewingBrand={viewingBrand}
        />
      )}
    </div>
  );
};

export default VehicleBrandsManagement; 