import React, { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Label } from '../../../../components/ui/Label';
import { Textarea } from '../../../../components/ui/Textarea';
import { Switch } from '../../../../components/ui/Switch';
import { Badge } from '../../../../components/ui/Badge';
import { X, Save, Eye, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

const VehicleTypeModal = ({ isOpen, onClose, onSuccess, editingType, viewingType }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    per_km_charges: '',
    minimum_fare: '',
    maximum_fare: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isViewMode = !!viewingType;
  const isEditMode = !!editingType;
  const isCreateMode = !isViewMode && !isEditMode;

  useEffect(() => {
    if (editingType) {
      setFormData({
        name: editingType.name || '',
        description: editingType.description || '',
        per_km_charges: editingType.per_km_charges?.toString() || '',
        minimum_fare: editingType.minimum_fare?.toString() || '',
        maximum_fare: editingType.maximum_fare?.toString() || '',
        is_active: editingType.is_active ?? true
      });
    } else if (viewingType) {
      setFormData({
        name: viewingType.name || '',
        description: viewingType.description || '',
        per_km_charges: viewingType.per_km_charges?.toString() || '',
        minimum_fare: viewingType.minimum_fare?.toString() || '',
        maximum_fare: viewingType.maximum_fare?.toString() || '',
        is_active: viewingType.is_active ?? true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        per_km_charges: '',
        minimum_fare: '',
        maximum_fare: '',
        is_active: true
      });
    }
    setErrors({});
  }, [editingType, viewingType]);

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

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (formData.per_km_charges && isNaN(parseFloat(formData.per_km_charges))) {
      newErrors.per_km_charges = 'Per km charges must be a valid number';
    } else if (formData.per_km_charges && parseFloat(formData.per_km_charges) < 0) {
      newErrors.per_km_charges = 'Per km charges must be positive';
    }

    if (formData.minimum_fare && isNaN(parseFloat(formData.minimum_fare))) {
      newErrors.minimum_fare = 'Minimum fare must be a valid number';
    } else if (formData.minimum_fare && parseFloat(formData.minimum_fare) < 0) {
      newErrors.minimum_fare = 'Minimum fare must be positive';
    }

    if (formData.maximum_fare && isNaN(parseFloat(formData.maximum_fare))) {
      newErrors.maximum_fare = 'Maximum fare must be a valid number';
    } else if (formData.maximum_fare && parseFloat(formData.maximum_fare) < 0) {
      newErrors.maximum_fare = 'Maximum fare must be positive';
    }

    if (formData.minimum_fare && formData.maximum_fare) {
      const min = parseFloat(formData.minimum_fare);
      const max = parseFloat(formData.maximum_fare);
      if (min > max) {
        newErrors.maximum_fare = 'Maximum fare must be greater than minimum fare';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        per_km_charges: formData.per_km_charges ? parseFloat(formData.per_km_charges) : 0,
        minimum_fare: formData.minimum_fare ? parseFloat(formData.minimum_fare) : 0,
        maximum_fare: formData.maximum_fare ? parseFloat(formData.maximum_fare) : null
      };

      if (isEditMode) {
        await api.put(`/api/admin/vehicles/types/${editingType.id}`, submitData);
        toast.success('Vehicle type updated successfully');
      } else {
        await api.post('/api/admin/vehicles/types', submitData);
        toast.success('Vehicle type created successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving vehicle type:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save vehicle type';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-bold text-text-primary">
              {isViewMode && <Eye className="inline mr-2" size={20} />}
              {isEditMode && <Edit className="inline mr-2" size={20} />}
              {isCreateMode && 'Create Vehicle Type'}
              {isEditMode && 'Edit Vehicle Type'}
              {isViewMode && 'View Vehicle Type'}
            </CardTitle>
            <CardDescription>
              {isCreateMode && 'Add a new vehicle type with pricing information'}
              {isEditMode && 'Update vehicle type information and pricing'}
              {isViewMode && 'View vehicle type details'}
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
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-text-primary">
                Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter vehicle type name"
                disabled={isViewMode}
                className={errors.name ? 'border-error' : ''}
              />
              {errors.name && (
                <p className="text-sm text-error">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-text-primary">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter vehicle type description"
                disabled={isViewMode}
                rows={3}
                className={errors.description ? 'border-error' : ''}
              />
              {errors.description && (
                <p className="text-sm text-error">{errors.description}</p>
              )}
            </div>

            {/* Pricing Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">Pricing Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Per KM Charges */}
                <div className="space-y-2">
                  <Label htmlFor="per_km_charges" className="text-text-primary">
                    Per KM Charges
                  </Label>
                  <Input
                    id="per_km_charges"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.per_km_charges}
                    onChange={(e) => handleInputChange('per_km_charges', e.target.value)}
                    placeholder="0.00"
                    disabled={isViewMode}
                    className={errors.per_km_charges ? 'border-error' : ''}
                  />
                  {errors.per_km_charges && (
                    <p className="text-sm text-error">{errors.per_km_charges}</p>
                  )}
                </div>

                {/* Minimum Fare */}
                <div className="space-y-2">
                  <Label htmlFor="minimum_fare" className="text-text-primary">
                    Minimum Fare
                  </Label>
                  <Input
                    id="minimum_fare"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minimum_fare}
                    onChange={(e) => handleInputChange('minimum_fare', e.target.value)}
                    placeholder="0.00"
                    disabled={isViewMode}
                    className={errors.minimum_fare ? 'border-error' : ''}
                  />
                  {errors.minimum_fare && (
                    <p className="text-sm text-error">{errors.minimum_fare}</p>
                  )}
                </div>

                {/* Maximum Fare */}
                <div className="space-y-2">
                  <Label htmlFor="maximum_fare" className="text-text-primary">
                    Maximum Fare
                  </Label>
                  <Input
                    id="maximum_fare"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maximum_fare}
                    onChange={(e) => handleInputChange('maximum_fare', e.target.value)}
                    placeholder="No limit"
                    disabled={isViewMode}
                    className={errors.maximum_fare ? 'border-error' : ''}
                  />
                  {errors.maximum_fare && (
                    <p className="text-sm text-error">{errors.maximum_fare}</p>
                  )}
                </div>
              </div>
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
                    <p className="text-sm font-mono text-text-primary">{viewingType.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-text-secondary">Created</Label>
                    <p className="text-sm text-text-primary">
                      {new Date(viewingType.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="bg-background-secondary p-4 rounded-lg">
                  <h4 className="font-semibold text-text-primary mb-2">Pricing Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Per KM:</span>
                      <span className="font-medium text-text-primary">
                        {formatCurrency(viewingType.per_km_charges)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Minimum Fare:</span>
                      <span className="font-medium text-text-primary">
                        {formatCurrency(viewingType.minimum_fare)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Maximum Fare:</span>
                      <span className="font-medium text-text-primary">
                        {viewingType.maximum_fare ? formatCurrency(viewingType.maximum_fare) : 'No limit'}
                      </span>
                    </div>
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

export default VehicleTypeModal; 