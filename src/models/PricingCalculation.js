const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class PricingCalculation {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.trip_id = data.trip_id;
    this.vehicle_type_id = data.vehicle_type_id;
    this.base_distance = data.base_distance;
    this.base_fare = data.base_fare;
    this.applied_multipliers = data.applied_multipliers ? JSON.stringify(data.applied_multipliers) : null;
    this.final_fare = data.final_fare;
    this.calculation_details = data.calculation_details ? JSON.stringify(data.calculation_details) : null;
    this.created_at = data.created_at || new Date();
  }

  static async create(data) {
    try {
      const calculation = new PricingCalculation(data);
      await db.executeQuery(
        'INSERT INTO pricing_calculations (id, trip_id, vehicle_type_id, base_distance, base_fare, applied_multipliers, final_fare, calculation_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          calculation.id,
          calculation.trip_id,
          calculation.vehicle_type_id,
          calculation.base_distance,
          calculation.base_fare,
          calculation.applied_multipliers,
          calculation.final_fare,
          calculation.calculation_details
        ]
      );
      return calculation;
    } catch (error) {
      throw new Error(`Error creating pricing calculation: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM pricing_calculations WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new PricingCalculation(rows[0]);
    } catch (error) {
      throw new Error(`Error fetching pricing calculation: ${error.message}`);
    }
  }

  static async findByTripId(tripId) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM pricing_calculations WHERE trip_id = ? ORDER BY created_at DESC',
        [tripId]
      );
      
      return rows.map(row => new PricingCalculation(row));
    } catch (error) {
      throw new Error(`Error fetching pricing calculations by trip: ${error.message}`);
    }
  }

  static async findByVehicleTypeId(vehicleTypeId, options = {}) {
    try {
      const { page = 1, limit = 20, startDate, endDate } = options;
      const offset = (page - 1) * limit;
      
      let conditions = ['vehicle_type_id = ?'];
      let params = [vehicleTypeId];
      
      if (startDate) {
        conditions.push('created_at >= ?');
        params.push(startDate);
      }
      
      if (endDate) {
        conditions.push('created_at <= ?');
        params.push(endDate);
      }
      
      const query = `
        SELECT * FROM pricing_calculations 
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      const rows = await db.executeQuery(query, params);
      
      return rows.map(row => new PricingCalculation(row));
    } catch (error) {
      throw new Error(`Error fetching pricing calculations by vehicle type: ${error.message}`);
    }
  }

  static async getStatistics(vehicleTypeId, period = '30') {
    try {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const query = `
        SELECT 
          COUNT(*) as total_calculations,
          AVG(base_fare) as avg_base_fare,
          AVG(final_fare) as avg_final_fare,
          MIN(base_fare) as min_base_fare,
          MAX(base_fare) as max_base_fare,
          MIN(final_fare) as min_final_fare,
          MAX(final_fare) as max_final_fare,
          AVG(base_distance) as avg_distance,
          SUM(final_fare) as total_revenue
        FROM pricing_calculations 
        WHERE vehicle_type_id = ? AND created_at >= ?
      `;
      
      const rows = await db.executeQuery(query, [vehicleTypeId, startDate]);
      
      if (rows.length === 0) {
        return {
          total_calculations: 0,
          avg_base_fare: 0,
          avg_final_fare: 0,
          min_base_fare: 0,
          max_base_fare: 0,
          min_final_fare: 0,
          max_final_fare: 0,
          avg_distance: 0,
          total_revenue: 0
        };
      }
      
      return rows[0];
    } catch (error) {
      throw new Error(`Error getting pricing statistics: ${error.message}`);
    }
  }

  static async getMultiplierUsage(vehicleTypeId, period = '30') {
    try {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const query = `
        SELECT 
          JSON_EXTRACT(applied_multipliers, '$[*].multiplier_type') as multiplier_types,
          COUNT(*) as usage_count
        FROM pricing_calculations 
        WHERE vehicle_type_id = ? AND created_at >= ? AND applied_multipliers IS NOT NULL
        GROUP BY multiplier_types
        ORDER BY usage_count DESC
      `;
      
      const rows = await db.executeQuery(query, [vehicleTypeId, startDate]);
      return rows;
    } catch (error) {
      throw new Error(`Error getting multiplier usage: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      trip_id: this.trip_id,
      vehicle_type_id: this.vehicle_type_id,
      base_distance: this.base_distance,
      base_fare: this.base_fare,
      applied_multipliers: this.applied_multipliers ? JSON.parse(this.applied_multipliers) : null,
      final_fare: this.final_fare,
      calculation_details: this.calculation_details ? JSON.parse(this.calculation_details) : null,
      created_at: this.created_at
    };
  }
}

module.exports = PricingCalculation; 