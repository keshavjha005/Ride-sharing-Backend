const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class PricingMultiplier {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.vehicle_type_id = data.vehicle_type_id;
    this.multiplier_type = data.multiplier_type;
    this.multiplier_value = data.multiplier_value;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at || new Date();
  }

  static async findByVehicleTypeId(vehicleTypeId, activeOnly = true) {
    try {
      const query = activeOnly 
        ? 'SELECT * FROM pricing_multipliers WHERE vehicle_type_id = ? AND is_active = true ORDER BY multiplier_type'
        : 'SELECT * FROM pricing_multipliers WHERE vehicle_type_id = ? ORDER BY multiplier_type';
      
      const rows = await db.executeQuery(query, [vehicleTypeId]);
      return rows.map(row => new PricingMultiplier(row));
    } catch (error) {
      throw new Error(`Error fetching pricing multipliers: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM pricing_multipliers WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new PricingMultiplier(rows[0]);
    } catch (error) {
      throw new Error(`Error fetching pricing multiplier: ${error.message}`);
    }
  }

  static async findByType(vehicleTypeId, multiplierType, activeOnly = true) {
    try {
      const query = activeOnly 
        ? 'SELECT * FROM pricing_multipliers WHERE vehicle_type_id = ? AND multiplier_type = ? AND is_active = true'
        : 'SELECT * FROM pricing_multipliers WHERE vehicle_type_id = ? AND multiplier_type = ?';
      
      const rows = await db.executeQuery(query, [vehicleTypeId, multiplierType]);
      return rows.map(row => new PricingMultiplier(row));
    } catch (error) {
      throw new Error(`Error fetching pricing multipliers by type: ${error.message}`);
    }
  }

  static async findAll(activeOnly = true) {
    try {
      const query = activeOnly 
        ? 'SELECT * FROM pricing_multipliers WHERE is_active = true ORDER BY vehicle_type_id, multiplier_type'
        : 'SELECT * FROM pricing_multipliers ORDER BY vehicle_type_id, multiplier_type';
      
      const rows = await db.executeQuery(query);
      return rows.map(row => new PricingMultiplier(row));
    } catch (error) {
      throw new Error(`Error fetching all pricing multipliers: ${error.message}`);
    }
  }

  async save() {
    try {
      if (this.id) {
        // Update existing multiplier
        await db.executeQuery(
          'UPDATE pricing_multipliers SET vehicle_type_id = ?, multiplier_type = ?, multiplier_value = ?, is_active = ? WHERE id = ?',
          [this.vehicle_type_id, this.multiplier_type, this.multiplier_value, this.is_active, this.id]
        );
      } else {
        // Create new multiplier
        await db.executeQuery(
          'INSERT INTO pricing_multipliers (id, vehicle_type_id, multiplier_type, multiplier_value, is_active) VALUES (?, ?, ?, ?, ?)',
          [this.id, this.vehicle_type_id, this.multiplier_type, this.multiplier_value, this.is_active]
        );
      }
      
      return this;
    } catch (error) {
      throw new Error(`Error saving pricing multiplier: ${error.message}`);
    }
  }

  async delete() {
    try {
      await db.executeQuery(
        'UPDATE pricing_multipliers SET is_active = false WHERE id = ?',
        [this.id]
      );
      this.is_active = false;
      return this;
    } catch (error) {
      throw new Error(`Error deleting pricing multiplier: ${error.message}`);
    }
  }

  static async create(data) {
    const multiplier = new PricingMultiplier(data);
    return await multiplier.save();
  }

  static async getApplicableMultipliers(vehicleTypeId, tripDetails) {
    try {
      const multipliers = await this.findByVehicleTypeId(vehicleTypeId, true);
      const applicableMultipliers = [];

      for (const multiplier of multipliers) {
        let isApplicable = false;

        switch (multiplier.multiplier_type) {
          case 'peak_hour':
            isApplicable = this.isPeakHour(tripDetails.departureTime);
            break;
          case 'weekend':
            isApplicable = this.isWeekend(tripDetails.departureTime);
            break;
          case 'holiday':
            isApplicable = await this.isHoliday(tripDetails.departureTime);
            break;
          case 'weather':
            isApplicable = await this.isWeatherCondition(tripDetails.weather);
            break;
          case 'demand':
            isApplicable = await this.isHighDemand(tripDetails.location, tripDetails.departureTime);
            break;
        }

        if (isApplicable) {
          applicableMultipliers.push(multiplier);
        }
      }

      return applicableMultipliers;
    } catch (error) {
      throw new Error(`Error getting applicable multipliers: ${error.message}`);
    }
  }

  static isPeakHour(departureTime) {
    const hour = new Date(departureTime).getHours();
    // Peak hours: 7-9 AM and 5-7 PM
    return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  }

  static isWeekend(departureTime) {
    const day = new Date(departureTime).getDay();
    // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;
  }

  static async isHoliday(departureTime) {
    // This would integrate with a holiday API or database
    // For now, return false as placeholder
    return false;
  }

  static async isWeatherCondition(weather) {
    // This would integrate with a weather API
    // For now, return false as placeholder
    return false;
  }

  static async isHighDemand(location, departureTime) {
    // This would check historical booking data for demand patterns
    // For now, return false as placeholder
    return false;
  }
}

module.exports = PricingMultiplier; 