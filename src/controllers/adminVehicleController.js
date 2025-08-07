const { validationResult } = require('express-validator');
const VehicleType = require('../models/VehicleType');
const VehicleBrand = require('../models/VehicleBrand');
const VehicleModel = require('../models/VehicleModel');
const UserVehicle = require('../models/UserVehicle');
const User = require('../models/User');
const logger = require('../utils/logger');

class AdminVehicleController {
  // ==================== VEHICLE TYPES MANAGEMENT ====================

  /**
   * Get all vehicle types with pagination and filtering
   * GET /api/admin/vehicles/types
   */
  static async getVehicleTypes(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        activeOnly = 'true',
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      let vehicleTypes = await VehicleType.findWithPricing(activeOnly === 'true');
      
      // Apply search filter
      if (search) {
        vehicleTypes = vehicleTypes.filter(vt => 
          vt.name.toLowerCase().includes(search.toLowerCase()) ||
          vt.description?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply sorting
      vehicleTypes.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortOrder === 'desc') {
          [aValue, bValue] = [bValue, aValue];
        }
        
        if (typeof aValue === 'string') {
          return aValue.localeCompare(bValue);
        }
        return aValue - bValue;
      });

      // Apply pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const paginatedTypes = vehicleTypes.slice(offset, offset + parseInt(limit));

      res.json({
        success: true,
        data: {
          vehicleTypes: paginatedTypes,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: vehicleTypes.length,
            totalPages: Math.ceil(vehicleTypes.length / parseInt(limit))
          }
        },
        message: 'Vehicle types retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching vehicle types:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle types',
        error: error.message
      });
    }
  }

  /**
   * Get vehicle type by ID with detailed information
   * GET /api/admin/vehicles/types/:id
   */
  static async getVehicleTypeById(req, res) {
    try {
      const { id } = req.params;
      
      const vehicleType = await VehicleType.findByIdWithPricing(id);
      
      if (!vehicleType) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle type not found'
        });
      }

      res.json({
        success: true,
        data: vehicleType,
        message: 'Vehicle type retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching vehicle type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle type',
        error: error.message
      });
    }
  }

  /**
   * Create new vehicle type
   * POST /api/admin/vehicles/types
   */
  static async createVehicleType(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, description, per_km_charges, minimum_fare, maximum_fare, is_active = true } = req.body;

      // Check if vehicle type with same name already exists
      const existingType = await VehicleType.findByName(name);
      if (existingType) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle type with this name already exists'
        });
      }

      const vehicleType = await VehicleType.create({
        name,
        description,
        per_km_charges: parseFloat(per_km_charges) || 0.00,
        minimum_fare: parseFloat(minimum_fare) || 0.00,
        maximum_fare: maximum_fare ? parseFloat(maximum_fare) : null,
        is_active
      });

      res.status(201).json({
        success: true,
        data: vehicleType,
        message: 'Vehicle type created successfully'
      });
    } catch (error) {
      logger.error('Error creating vehicle type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create vehicle type',
        error: error.message
      });
    }
  }

  /**
   * Update vehicle type
   * PUT /api/admin/vehicles/types/:id
   */
  static async updateVehicleType(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const vehicleType = await VehicleType.findById(id);
      if (!vehicleType) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle type not found'
        });
      }

      // Check for name conflict if name is being updated
      if (updateData.name && updateData.name !== vehicleType.name) {
        const existingType = await VehicleType.findByName(updateData.name);
        if (existingType) {
          return res.status(400).json({
            success: false,
            message: 'Vehicle type with this name already exists'
          });
        }
      }

      // Update fields
      Object.assign(vehicleType, updateData);
      await vehicleType.save();

      res.json({
        success: true,
        data: vehicleType,
        message: 'Vehicle type updated successfully'
      });
    } catch (error) {
      logger.error('Error updating vehicle type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vehicle type',
        error: error.message
      });
    }
  }

  /**
   * Delete vehicle type (soft delete)
   * DELETE /api/admin/vehicles/types/:id
   */
  static async deleteVehicleType(req, res) {
    try {
      const { id } = req.params;

      const vehicleType = await VehicleType.findById(id);
      if (!vehicleType) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle type not found'
        });
      }

      await vehicleType.delete();

      res.json({
        success: true,
        message: 'Vehicle type deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting vehicle type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete vehicle type',
        error: error.message
      });
    }
  }

  // ==================== VEHICLE BRANDS MANAGEMENT ====================

  /**
   * Get all vehicle brands with pagination and filtering
   * GET /api/admin/vehicles/brands
   */
  static async getVehicleBrands(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        activeOnly = 'true',
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      let brands = await VehicleBrand.findAll(activeOnly === 'true');
      
      // Apply search filter
      if (search) {
        brands = brands.filter(brand => 
          brand.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply sorting
      brands.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortOrder === 'desc') {
          [aValue, bValue] = [bValue, aValue];
        }
        
        if (typeof aValue === 'string') {
          return aValue.localeCompare(bValue);
        }
        return aValue - bValue;
      });

      // Apply pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const paginatedBrands = brands.slice(offset, offset + parseInt(limit));

      res.json({
        success: true,
        data: {
          brands: paginatedBrands,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: brands.length,
            totalPages: Math.ceil(brands.length / parseInt(limit))
          }
        },
        message: 'Vehicle brands retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching vehicle brands:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle brands',
        error: error.message
      });
    }
  }

  /**
   * Get vehicle brand by ID
   * GET /api/admin/vehicles/brands/:id
   */
  static async getVehicleBrandById(req, res) {
    try {
      const { id } = req.params;
      
      const brand = await VehicleBrand.findById(id);
      
      if (!brand) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle brand not found'
        });
      }

      // Get models for this brand
      const models = await VehicleModel.findByBrandId(id, false);

      res.json({
        success: true,
        data: {
          brand,
          models
        },
        message: 'Vehicle brand retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching vehicle brand:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle brand',
        error: error.message
      });
    }
  }

  /**
   * Create new vehicle brand
   * POST /api/admin/vehicles/brands
   */
  static async createVehicleBrand(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, logo, is_active = true } = req.body;

      // Check if brand with same name already exists
      const existingBrand = await VehicleBrand.findByName(name);
      if (existingBrand) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle brand with this name already exists'
        });
      }

      const brand = await VehicleBrand.create({
        name,
        logo,
        is_active
      });

      res.status(201).json({
        success: true,
        data: brand,
        message: 'Vehicle brand created successfully'
      });
    } catch (error) {
      logger.error('Error creating vehicle brand:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create vehicle brand',
        error: error.message
      });
    }
  }

  /**
   * Update vehicle brand
   * PUT /api/admin/vehicles/brands/:id
   */
  static async updateVehicleBrand(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const brand = await VehicleBrand.findById(id);
      if (!brand) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle brand not found'
        });
      }

      // Check for name conflict if name is being updated
      if (updateData.name && updateData.name !== brand.name) {
        const existingBrand = await VehicleBrand.findByName(updateData.name);
        if (existingBrand) {
          return res.status(400).json({
            success: false,
            message: 'Vehicle brand with this name already exists'
          });
        }
      }

      // Update fields
      Object.assign(brand, updateData);
      await brand.save();

      res.json({
        success: true,
        data: brand,
        message: 'Vehicle brand updated successfully'
      });
    } catch (error) {
      logger.error('Error updating vehicle brand:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vehicle brand',
        error: error.message
      });
    }
  }

  /**
   * Delete vehicle brand (soft delete)
   * DELETE /api/admin/vehicles/brands/:id
   */
  static async deleteVehicleBrand(req, res) {
    try {
      const { id } = req.params;

      const brand = await VehicleBrand.findById(id);
      if (!brand) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle brand not found'
        });
      }

      await brand.delete();

      res.json({
        success: true,
        message: 'Vehicle brand deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting vehicle brand:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete vehicle brand',
        error: error.message
      });
    }
  }

  // ==================== VEHICLE MODELS MANAGEMENT ====================

  /**
   * Get all vehicle models with pagination and filtering
   * GET /api/admin/vehicles/models
   */
  static async getVehicleModels(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        brandId = '',
        activeOnly = 'true',
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      let models = [];
      
      if (brandId) {
        models = await VehicleModel.findByBrandId(brandId, activeOnly === 'true');
      } else {
        models = await VehicleModel.getAllWithBrands();
        if (activeOnly === 'true') {
          models = models.filter(model => model.is_active);
        }
      }
      
      // Apply search filter
      if (search) {
        models = models.filter(model => 
          model.name.toLowerCase().includes(search.toLowerCase()) ||
          model.brand_name?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply sorting
      models.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortOrder === 'desc') {
          [aValue, bValue] = [bValue, aValue];
        }
        
        if (typeof aValue === 'string') {
          return aValue.localeCompare(bValue);
        }
        return aValue - bValue;
      });

      // Apply pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const paginatedModels = models.slice(offset, offset + parseInt(limit));

      res.json({
        success: true,
        data: {
          models: paginatedModels,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: models.length,
            totalPages: Math.ceil(models.length / parseInt(limit))
          }
        },
        message: 'Vehicle models retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching vehicle models:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle models',
        error: error.message
      });
    }
  }

  /**
   * Get vehicle model by ID
   * GET /api/admin/vehicles/models/:id
   */
  static async getVehicleModelById(req, res) {
    try {
      const { id } = req.params;
      
      const model = await VehicleModel.findById(id);
      
      if (!model) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle model not found'
        });
      }

      // Get brand information
      const brand = await VehicleBrand.findById(model.brand_id);

      res.json({
        success: true,
        data: {
          model,
          brand
        },
        message: 'Vehicle model retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching vehicle model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle model',
        error: error.message
      });
    }
  }

  /**
   * Create new vehicle model
   * POST /api/admin/vehicles/models
   */
  static async createVehicleModel(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { brand_id, name, is_active = true } = req.body;

      // Validate brand exists
      const brand = await VehicleBrand.findById(brand_id);
      if (!brand) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle brand'
        });
      }

      // Check if model with same name already exists for this brand
      const existingModel = await VehicleModel.findByNameAndBrand(name, brand_id);
      if (existingModel) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle model with this name already exists for this brand'
        });
      }

      const model = await VehicleModel.create({
        brand_id,
        name,
        is_active
      });

      res.status(201).json({
        success: true,
        data: model,
        message: 'Vehicle model created successfully'
      });
    } catch (error) {
      logger.error('Error creating vehicle model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create vehicle model',
        error: error.message
      });
    }
  }

  /**
   * Update vehicle model
   * PUT /api/admin/vehicles/models/:id
   */
  static async updateVehicleModel(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const model = await VehicleModel.findById(id);
      if (!model) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle model not found'
        });
      }

      // Check for name conflict if name is being updated
      if (updateData.name && updateData.name !== model.name) {
        const existingModel = await VehicleModel.findByNameAndBrand(updateData.name, model.brand_id);
        if (existingModel) {
          return res.status(400).json({
            success: false,
            message: 'Vehicle model with this name already exists for this brand'
          });
        }
      }

      // Update fields
      Object.assign(model, updateData);
      await model.save();

      res.json({
        success: true,
        data: model,
        message: 'Vehicle model updated successfully'
      });
    } catch (error) {
      logger.error('Error updating vehicle model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vehicle model',
        error: error.message
      });
    }
  }

  /**
   * Delete vehicle model (soft delete)
   * DELETE /api/admin/vehicles/models/:id
   */
  static async deleteVehicleModel(req, res) {
    try {
      const { id } = req.params;

      const model = await VehicleModel.findById(id);
      if (!model) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle model not found'
        });
      }

      await model.delete();

      res.json({
        success: true,
        message: 'Vehicle model deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting vehicle model:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete vehicle model',
        error: error.message
      });
    }
  }

  // ==================== USER VEHICLES MANAGEMENT ====================

  /**
   * Get all user vehicles with pagination and filtering
   * GET /api/admin/vehicles/user-vehicles
   */
  static async getUserVehicles(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        userId = '',
        vehicleTypeId = '',
        brandId = '',
        verified = '',
        activeOnly = 'true',
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = req.query;

      let vehicles = [];

      if (userId) {
        vehicles = await UserVehicle.getByUserIdWithDetails(userId, activeOnly === 'true');
      } else {
        // Get all user vehicles with details
        const query = `
          SELECT uvi.*, 
                 vt.name as vehicle_type_name,
                 vb.name as vehicle_brand_name,
                 vm.name as vehicle_model_name,
                 u.first_name,
                 u.last_name,
                 u.email
          FROM user_vehicle_information uvi
          LEFT JOIN vehicle_types vt ON uvi.vehicle_type_id = vt.id
          LEFT JOIN vehicle_brands vb ON uvi.vehicle_brand_id = vb.id
          LEFT JOIN vehicle_models vm ON uvi.vehicle_model_id = vm.id
          LEFT JOIN users u ON uvi.user_id = u.id
          WHERE 1=1
          ${activeOnly === 'true' ? 'AND uvi.is_active = true' : ''}
          ${vehicleTypeId ? 'AND uvi.vehicle_type_id = ?' : ''}
          ${brandId ? 'AND uvi.vehicle_brand_id = ?' : ''}
          ${verified === 'true' ? 'AND uvi.is_verified = true' : ''}
          ${verified === 'false' ? 'AND uvi.is_verified = false' : ''}
          ORDER BY uvi.${sortBy} ${sortOrder.toUpperCase()}
        `;

        const params = [];
        if (vehicleTypeId) params.push(vehicleTypeId);
        if (brandId) params.push(brandId);

        const rows = await require('../config/database').executeQuery(query, params);
        vehicles = rows.map(row => ({
          ...new UserVehicle(row),
          vehicle_type_name: row.vehicle_type_name,
          vehicle_brand_name: row.vehicle_brand_name,
          vehicle_model_name: row.vehicle_model_name,
          user_name: `${row.first_name} ${row.last_name}`,
          user_email: row.email
        }));
      }
      
      // Apply search filter
      if (search) {
        vehicles = vehicles.filter(vehicle => 
          vehicle.vehicle_number?.toLowerCase().includes(search.toLowerCase()) ||
          vehicle.vehicle_type_name?.toLowerCase().includes(search.toLowerCase()) ||
          vehicle.vehicle_brand_name?.toLowerCase().includes(search.toLowerCase()) ||
          vehicle.vehicle_model_name?.toLowerCase().includes(search.toLowerCase()) ||
          vehicle.user_name?.toLowerCase().includes(search.toLowerCase()) ||
          vehicle.user_email?.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const paginatedVehicles = vehicles.slice(offset, offset + parseInt(limit));

      res.json({
        success: true,
        data: {
          vehicles: paginatedVehicles,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: vehicles.length,
            totalPages: Math.ceil(vehicles.length / parseInt(limit))
          }
        },
        message: 'User vehicles retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching user vehicles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user vehicles',
        error: error.message
      });
    }
  }

  /**
   * Get user vehicle by ID with full details
   * GET /api/admin/vehicles/user-vehicles/:id
   */
  static async getUserVehicleById(req, res) {
    try {
      const { id } = req.params;
      
      const vehicle = await UserVehicle.getWithDetails(id);
      
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'User vehicle not found'
        });
      }

      // Get user information
      const user = await User.findById(vehicle.user_id);

      res.json({
        success: true,
        data: {
          vehicle,
          user
        },
        message: 'User vehicle retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching user vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user vehicle',
        error: error.message
      });
    }
  }

  /**
   * Update user vehicle (admin override)
   * PUT /api/admin/vehicles/user-vehicles/:id
   */
  static async updateUserVehicle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const vehicle = await UserVehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'User vehicle not found'
        });
      }

      // Update fields
      Object.assign(vehicle, updateData);
      await vehicle.save();

      // Get updated vehicle with details
      const updatedVehicle = await UserVehicle.getWithDetails(id);

      res.json({
        success: true,
        data: updatedVehicle,
        message: 'User vehicle updated successfully'
      });
    } catch (error) {
      logger.error('Error updating user vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user vehicle',
        error: error.message
      });
    }
  }

  /**
   * Verify user vehicle
   * POST /api/admin/vehicles/user-vehicles/:id/verify
   */
  static async verifyUserVehicle(req, res) {
    try {
      const { id } = req.params;

      const vehicle = await UserVehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'User vehicle not found'
        });
      }

      await vehicle.verify();

      res.json({
        success: true,
        message: 'User vehicle verified successfully'
      });
    } catch (error) {
      logger.error('Error verifying user vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify user vehicle',
        error: error.message
      });
    }
  }

  /**
   * Delete user vehicle (admin override)
   * DELETE /api/admin/vehicles/user-vehicles/:id
   */
  static async deleteUserVehicle(req, res) {
    try {
      const { id } = req.params;

      const vehicle = await UserVehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'User vehicle not found'
        });
      }

      await vehicle.delete();

      res.json({
        success: true,
        message: 'User vehicle deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting user vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user vehicle',
        error: error.message
      });
    }
  }

  // ==================== VEHICLE ANALYTICS ====================

  /**
   * Get vehicle analytics and statistics
   * GET /api/admin/vehicles/analytics
   */
  static async getVehicleAnalytics(req, res) {
    try {
      const { period = '30d', type = 'overview' } = req.query;

      let analytics = {};

      switch (type) {
        case 'overview':
          analytics = await getVehicleOverviewAnalytics(period);
          break;
        case 'types':
          analytics = await getVehicleTypeAnalytics(period);
          break;
        case 'brands':
          analytics = await getVehicleBrandAnalytics(period);
          break;
        case 'user-vehicles':
          analytics = await getUserVehicleAnalytics(period);
          break;
        default:
          analytics = await getVehicleOverviewAnalytics(period);
      }

      res.json({
        success: true,
        data: analytics,
        message: 'Vehicle analytics retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching vehicle analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle analytics',
        error: error.message
      });
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk update vehicle types
   * POST /api/admin/vehicles/bulk-update-types
   */
  static async bulkUpdateVehicleTypes(req, res) {
    try {
      const { vehicleTypes, operation = 'update' } = req.body;

      const results = [];

      for (const vt of vehicleTypes) {
        try {
          if (operation === 'delete') {
            const vehicleType = await VehicleType.findById(vt.id);
            if (vehicleType) {
              await vehicleType.delete();
              results.push({ id: vt.id, success: true, operation: 'deleted' });
            } else {
              results.push({ id: vt.id, success: false, error: 'Vehicle type not found' });
            }
          } else {
            const vehicleType = await VehicleType.findById(vt.id);
            if (vehicleType) {
              Object.assign(vehicleType, vt);
              await vehicleType.save();
              results.push({ id: vt.id, success: true, operation: 'updated' });
            } else {
              results.push({ id: vt.id, success: false, error: 'Vehicle type not found' });
            }
          }
        } catch (error) {
          results.push({ id: vt.id, success: false, error: error.message });
        }
      }

      res.json({
        success: true,
        data: results,
        message: 'Bulk vehicle type update completed'
      });
    } catch (error) {
      logger.error('Error in bulk vehicle type update:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk vehicle type update',
        error: error.message
      });
    }
  }

  /**
   * Bulk verify user vehicles
   * POST /api/admin/vehicles/bulk-verify
   */
  static async bulkVerifyUserVehicles(req, res) {
    try {
      const { vehicleIds } = req.body;

      const results = [];

      for (const id of vehicleIds) {
        try {
          const vehicle = await UserVehicle.findById(id);
          if (vehicle) {
            await vehicle.verify();
            results.push({ id, success: true, operation: 'verified' });
          } else {
            results.push({ id, success: false, error: 'Vehicle not found' });
          }
        } catch (error) {
          results.push({ id, success: false, error: error.message });
        }
      }

      res.json({
        success: true,
        data: results,
        message: 'Bulk vehicle verification completed'
      });
    } catch (error) {
      logger.error('Error in bulk vehicle verification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk vehicle verification',
        error: error.message
      });
    }
  }
}

// Helper functions for analytics
async function getVehicleOverviewAnalytics(period) {
  const db = require('../config/database');
  
  // Get total counts
  const [typeCount, brandCount, modelCount, userVehicleCount] = await Promise.all([
    db.executeQuery('SELECT COUNT(*) as count FROM vehicle_types WHERE is_active = true'),
    db.executeQuery('SELECT COUNT(*) as count FROM vehicle_brands WHERE is_active = true'),
    db.executeQuery('SELECT COUNT(*) as count FROM vehicle_models WHERE is_active = true'),
    db.executeQuery('SELECT COUNT(*) as count FROM user_vehicle_information WHERE is_active = true')
  ]);

  // Get verification stats
  const [verifiedCount, unverifiedCount] = await Promise.all([
    db.executeQuery('SELECT COUNT(*) as count FROM user_vehicle_information WHERE is_verified = true AND is_active = true'),
    db.executeQuery('SELECT COUNT(*) as count FROM user_vehicle_information WHERE is_verified = false AND is_active = true')
  ]);

  return {
    overview: {
      totalTypes: typeCount[0].count,
      totalBrands: brandCount[0].count,
      totalModels: modelCount[0].count,
      totalUserVehicles: userVehicleCount[0].count,
      verifiedVehicles: verifiedCount[0].count,
      unverifiedVehicles: unverifiedCount[0].count
    }
  };
}

async function getVehicleTypeAnalytics(period) {
  const db = require('../config/database');
  
  const query = `
    SELECT vt.name, COUNT(uvi.id) as vehicle_count
    FROM vehicle_types vt
    LEFT JOIN user_vehicle_information uvi ON vt.id = uvi.vehicle_type_id AND uvi.is_active = true
    WHERE vt.is_active = true
    GROUP BY vt.id, vt.name
    ORDER BY vehicle_count DESC
  `;
  
  const results = await db.executeQuery(query);
  
  return {
    types: results
  };
}

async function getVehicleBrandAnalytics(period) {
  const db = require('../config/database');
  
  const query = `
    SELECT vb.name, COUNT(uvi.id) as vehicle_count
    FROM vehicle_brands vb
    LEFT JOIN user_vehicle_information uvi ON vb.id = uvi.vehicle_brand_id AND uvi.is_active = true
    WHERE vb.is_active = true
    GROUP BY vb.id, vb.name
    ORDER BY vehicle_count DESC
  `;
  
  const results = await db.executeQuery(query);
  
  return {
    brands: results
  };
}

async function getUserVehicleAnalytics(period) {
  const db = require('../config/database');
  
  // Get recent registrations
  const recentRegistrations = await db.executeQuery(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM user_vehicle_information
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `, [period === '7d' ? 7 : period === '30d' ? 30 : 90]);

  // Get verification trends
  const verificationTrends = await db.executeQuery(`
    SELECT DATE(created_at) as date, 
           SUM(CASE WHEN is_verified = true THEN 1 ELSE 0 END) as verified,
           SUM(CASE WHEN is_verified = false THEN 1 ELSE 0 END) as unverified
    FROM user_vehicle_information
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `, [period === '7d' ? 7 : period === '30d' ? 30 : 90]);

  return {
    recentRegistrations,
    verificationTrends
  };
}

module.exports = AdminVehicleController; 