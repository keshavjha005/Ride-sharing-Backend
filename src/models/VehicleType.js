const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class VehicleType {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.description = data.description;
    this.per_km_charges = data.per_km_charges || 0.00;
    this.minimum_fare = data.minimum_fare || 0.00;
    this.maximum_fare = data.maximum_fare || null;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  static async findAll(activeOnly = true) {
    try {
      const query = activeOnly 
        ? 'SELECT * FROM vehicle_types WHERE is_active = true ORDER BY name'
        : 'SELECT * FROM vehicle_types ORDER BY name';
      
      const rows = await db.executeQuery(query);
      return rows.map(row => new VehicleType(row));
    } catch (error) {
      throw new Error(`Error fetching vehicle types: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM vehicle_types WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new VehicleType(rows[0]);
    } catch (error) {
      throw new Error(`Error fetching vehicle type: ${error.message}`);
    }
  }

  static async findByName(name) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM vehicle_types WHERE name = ? AND is_active = true',
        [name]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new VehicleType(rows[0]);
    } catch (error) {
      throw new Error(`Error fetching vehicle type by name: ${error.message}`);
    }
  }

  async save() {
    try {
      if (this.id) {
        // Update existing type
        await db.executeQuery(
          'UPDATE vehicle_types SET name = ?, description = ?, per_km_charges = ?, minimum_fare = ?, maximum_fare = ?, is_active = ? WHERE id = ?',
          [this.name, this.description, this.per_km_charges, this.minimum_fare, this.maximum_fare, this.is_active, this.id]
        );
      } else {
        // Create new type
        await db.executeQuery(
          'INSERT INTO vehicle_types (id, name, description, per_km_charges, minimum_fare, maximum_fare, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [this.id, this.name, this.description, this.per_km_charges, this.minimum_fare, this.maximum_fare, this.is_active]
        );
      }
      
      return this;
    } catch (error) {
      throw new Error(`Error saving vehicle type: ${error.message}`);
    }
  }

  async delete() {
    try {
      await db.executeQuery(
        'UPDATE vehicle_types SET is_active = false WHERE id = ?',
        [this.id]
      );
      this.is_active = false;
      return this;
    } catch (error) {
      throw new Error(`Error deleting vehicle type: ${error.message}`);
    }
  }

  static async create(data) {
    const type = new VehicleType(data);
    return await type.save();
  }

  static async findWithPricing(activeOnly = true) {
    try {
      const query = activeOnly 
        ? 'SELECT vt.*, COUNT(pm.id) as multiplier_count FROM vehicle_types vt LEFT JOIN pricing_multipliers pm ON vt.id = pm.vehicle_type_id AND pm.is_active = true WHERE vt.is_active = true GROUP BY vt.id ORDER BY vt.name'
        : 'SELECT vt.*, COUNT(pm.id) as multiplier_count FROM vehicle_types vt LEFT JOIN pricing_multipliers pm ON vt.id = pm.vehicle_type_id AND pm.is_active = true GROUP BY vt.id ORDER BY vt.name';
      
      const rows = await db.executeQuery(query);
      return rows.map(row => new VehicleType(row));
    } catch (error) {
      throw new Error(`Error fetching vehicle types with pricing: ${error.message}`);
    }
  }

  static async findByIdWithPricing(id) {
    try {
      const query = `
        SELECT vt.*, 
               JSON_ARRAYAGG(
                 JSON_OBJECT(
                   'id', pm.id,
                   'multiplier_type', pm.multiplier_type,
                   'multiplier_value', pm.multiplier_value,
                   'is_active', pm.is_active
                 )
               ) as multipliers
        FROM vehicle_types vt 
        LEFT JOIN pricing_multipliers pm ON vt.id = pm.vehicle_type_id AND pm.is_active = true
        WHERE vt.id = ?
        GROUP BY vt.id
      `;
      
      const rows = await db.executeQuery(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const vehicleType = new VehicleType(rows[0]);
      vehicleType.multipliers = rows[0].multipliers ? JSON.parse(rows[0].multipliers) : [];
      
      return vehicleType;
    } catch (error) {
      throw new Error(`Error fetching vehicle type with pricing: ${error.message}`);
    }
  }
}

module.exports = VehicleType; 