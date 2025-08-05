const { validationResult } = require('express-validator');
const VehicleBrand = require('../models/VehicleBrand');
const VehicleModel = require('../models/VehicleModel');
const VehicleType = require('../models/VehicleType');
const UserVehicle = require('../models/UserVehicle');
const logger = require('../utils/logger');

class VehicleController {
  // Get all vehicle brands
  static async getBrands(req, res) {
    try {
      const brands = await VehicleBrand.findAll();
      
      res.json({
        success: true,
        data: brands,
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

  // Get vehicle models by brand
  static async getModelsByBrand(req, res) {
    try {
      const { brandId } = req.params;
      
      if (!brandId) {
        return res.status(400).json({
          success: false,
          message: 'Brand ID is required'
        });
      }

      const models = await VehicleModel.findByBrandId(brandId);
      
      res.json({
        success: true,
        data: models,
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

  // Get all vehicle types
  static async getTypes(req, res) {
    try {
      const types = await VehicleType.findAll();
      
      res.json({
        success: true,
        data: types,
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

  // Add user vehicle
  static async addUserVehicle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        vehicleTypeId,
        vehicleBrandId,
        vehicleModelId,
        vehicleNumber,
        vehicleColor,
        vehicleYear,
        vehicleImage
      } = req.body;

      const userId = req.user.id;

      // Check if vehicle number already exists for this user
      const existingVehicle = await UserVehicle.findByVehicleNumber(vehicleNumber, userId);
      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle with this number already exists for this user'
        });
      }

      // Validate that all referenced IDs exist
      const [vehicleType, vehicleBrand, vehicleModel] = await Promise.all([
        VehicleType.findById(vehicleTypeId),
        VehicleBrand.findById(vehicleBrandId),
        VehicleModel.findById(vehicleModelId)
      ]);

      if (!vehicleType) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle type'
        });
      }

      if (!vehicleBrand) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle brand'
        });
      }

      if (!vehicleModel) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle model'
        });
      }

      // Create new user vehicle
      const userVehicle = await UserVehicle.create({
        user_id: userId,
        vehicle_type_id: vehicleTypeId,
        vehicle_brand_id: vehicleBrandId,
        vehicle_model_id: vehicleModelId,
        vehicle_number: vehicleNumber,
        vehicle_color: vehicleColor || null,
        vehicle_year: vehicleYear || null,
        vehicle_image: vehicleImage || null
      });

      // Get vehicle with details
      const vehicleWithDetails = await UserVehicle.getWithDetails(userVehicle.id);

      res.status(201).json({
        success: true,
        data: vehicleWithDetails,
        message: 'Vehicle added successfully'
      });
    } catch (error) {
      logger.error('Error adding user vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add vehicle',
        error: error.message
      });
    }
  }

  // Get user vehicles
  static async getUserVehicles(req, res) {
    try {
      const userId = req.user.id;
      const { includeInactive = false } = req.query;

      const vehicles = await UserVehicle.getByUserIdWithDetails(userId, !includeInactive);
      
      res.json({
        success: true,
        data: vehicles,
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

  // Get specific user vehicle
  static async getUserVehicle(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const vehicle = await UserVehicle.getWithDetails(id);
      
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Check if vehicle belongs to user
      if (vehicle.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: vehicle,
        message: 'Vehicle retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching user vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle',
        error: error.message
      });
    }
  }

  // Update user vehicle
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
      const userId = req.user.id;
      const updateData = req.body;

      // Check if vehicle exists and belongs to user
      const existingVehicle = await UserVehicle.findById(id);
      if (!existingVehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      if (existingVehicle.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // If vehicle number is being updated, check for duplicates
      if (updateData.vehicleNumber && updateData.vehicleNumber !== existingVehicle.vehicle_number) {
        const duplicateVehicle = await UserVehicle.findByVehicleNumber(updateData.vehicleNumber, userId);
        if (duplicateVehicle && duplicateVehicle.id !== id) {
          return res.status(400).json({
            success: false,
            message: 'Vehicle with this number already exists for this user'
          });
        }
      }

      // Validate referenced IDs if they're being updated
      if (updateData.vehicleTypeId) {
        const vehicleType = await VehicleType.findById(updateData.vehicleTypeId);
        if (!vehicleType) {
          return res.status(400).json({
            success: false,
            message: 'Invalid vehicle type'
          });
        }
      }

      if (updateData.vehicleBrandId) {
        const vehicleBrand = await VehicleBrand.findById(updateData.vehicleBrandId);
        if (!vehicleBrand) {
          return res.status(400).json({
            success: false,
            message: 'Invalid vehicle brand'
          });
        }
      }

      if (updateData.vehicleModelId) {
        const vehicleModel = await VehicleModel.findById(updateData.vehicleModelId);
        if (!vehicleModel) {
          return res.status(400).json({
            success: false,
            message: 'Invalid vehicle model'
          });
        }
      }

      // Map camelCase field names to snake_case for database
      const fieldMapping = {
        vehicleTypeId: 'vehicle_type_id',
        vehicleBrandId: 'vehicle_brand_id',
        vehicleModelId: 'vehicle_model_id',
        vehicleNumber: 'vehicle_number',
        vehicleColor: 'vehicle_color',
        vehicleYear: 'vehicle_year',
        vehicleImage: 'vehicle_image'
      };

      // Update only the fields that were provided
      for (const [camelCaseKey, snakeCaseKey] of Object.entries(fieldMapping)) {
        if (updateData[camelCaseKey] !== undefined) {
          existingVehicle[snakeCaseKey] = updateData[camelCaseKey];
        }
      }

      await existingVehicle.save();

      // Get updated vehicle with details
      const updatedVehicle = await UserVehicle.getWithDetails(id);

      res.json({
        success: true,
        data: updatedVehicle,
        message: 'Vehicle updated successfully'
      });
    } catch (error) {
      logger.error('Error updating user vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vehicle',
        error: error.message
      });
    }
  }

  // Delete user vehicle
  static async deleteUserVehicle(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if vehicle exists and belongs to user
      const vehicle = await UserVehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      if (vehicle.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Soft delete vehicle
      await vehicle.delete();

      res.json({
        success: true,
        message: 'Vehicle deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting user vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete vehicle',
        error: error.message
      });
    }
  }

  // Verify user vehicle (admin only)
  static async verifyUserVehicle(req, res) {
    try {
      const { id } = req.params;

      // Check if vehicle exists
      const vehicle = await UserVehicle.findById(id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Verify vehicle
      await vehicle.verify();

      res.json({
        success: true,
        message: 'Vehicle verified successfully'
      });
    } catch (error) {
      logger.error('Error verifying user vehicle:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify vehicle',
        error: error.message
      });
    }
  }
}

module.exports = VehicleController; 