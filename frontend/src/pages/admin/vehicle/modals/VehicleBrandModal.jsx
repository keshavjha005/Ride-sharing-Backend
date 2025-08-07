import React, { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Label } from '../../../../components/ui/Label';
import { Switch } from '../../../../components/ui/Switch';
import { Badge } from '../../../../components/ui/Badge';
import { X, Save, Eye, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

const VehicleBrandModal = ({ isOpen, onClose, onSuccess, editingBrand, viewingBrand }) => {
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isViewMode = !!viewingBrand;
  const isEditMode = !!editingBrand;
  const isCreateMode = !isViewMode && !isEditMode;

  useEffect(() => {
    if (editingBrand) {
      setFormData({
        name: editingBrand.name || '',
        logo: editingBrand.logo || '',
        is_active: editingBrand.is_active ?? true
      });
    } else if (viewingBrand) {
      setFormData({
        name: viewingBrand.name || '',
        logo: viewingBrand.logo || '',
        is_active: viewingBrand.is_active ?? true
      });
    } else {
      setFormData({
        name: '',
        logo: '',
        is_active: true
      });
    }
    setErrors({});
  }, [editingBrand, viewingBrand]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    if (formData.logo && !isValidUrl(formData.logo)) {
      newErrors.logo = 'Logo must be a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        logo: formData.logo || null
      };

      if (isEditMode) {
        await api.put(`/api/admin/vehicles/brands/${editingBrand.id}`, submitData);
        toast.success('Vehicle brand updated successfully');
      } else {
        await api.post('/api/admin/vehicles/brands', submitData);
        toast.success('Vehicle brand created successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving vehicle brand:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save vehicle brand';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-bold text-text-primary">
              {isViewMode && <Eye className="inline mr-2" size={20} />}
              {isEditMode && <Edit className="inline mr-2" size={20} />}
              {isCreateMode && 'Create Vehicle Brand'}
              {isEditMode && 'Edit Vehicle Brand'}
              {isViewMode && 'View Vehicle Brand'}
            </CardTitle>
            <CardDescription>
              {isCreateMode && 'Add a new vehicle brand'}
              {isEditMode && 'Update vehicle brand information'}
              {isViewMode && 'View vehicle brand details'}
            </CardDescription>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X size={16} />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Preview */}
            {formData.logo && (
              <div className="space-y-2">
                <Label className="text-text-primary">Logo Preview</Label>
                <div className="flex justify-center">
                  <img 
                    src={formData.logo} 
                    alt="Brand logo"
                    className="w-32 h-32 object-contain rounded-lg border border-border"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-32 h-32 bg-background-secondary rounded-lg border border-border flex items-center justify-center hidden">
                    <span className="text-text-muted text-sm">Invalid URL</span>
                  </div>
                </div>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-text-primary">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter brand name"
                disabled={isViewMode}
                className={errors.name ? 'border-error' : ''}
              />
              {errors.name && (
                <p className="text-sm text-error">{errors.name}</p>
              )}
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logo" className="text-text-primary">
                Logo URL
              </Label>
              <Input
                id="logo"
                type="url"
                value={formData.logo}
                onChange={(e) => handleInputChange('logo', e.target.value)}
                placeholder="https://example.com/logo.png"
                disabled={isViewMode}
                className={errors.logo ? 'border-error' : ''}
              />
              {errors.logo && (
                <p className="text-sm text-error">{errors.logo}</p>
              )}
              <p className="text-xs text-text-muted">
                Enter a valid URL for the brand logo
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-text-primary">Status</Label>
                <p className="text-sm text-text-secondary">
                  {formData.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                disabled={isViewMode}
              />
            </div>

            {/* View Mode - Show additional details */}
            {isViewMode && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-lg font-semibold text-text-primary">Additional Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-text-secondary">ID</Label>
                    <p className="text-sm font-mono text-text-primary">{viewingBrand.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-text-secondary">Created</Label>
                    <p className="text-sm text-text-primary">
                      {new Date(viewingBrand.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              
              {!isViewMode && (
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>{isEditMode ? 'Update' : 'Create'}</span>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleBrandModal; 