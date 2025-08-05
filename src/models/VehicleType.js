const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class VehicleType {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.description = data.description;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at || new Date();
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
          'UPDATE vehicle_types SET name = ?, description = ?, is_active = ? WHERE id = ?',
          [this.name, this.description, this.is_active, this.id]
        );
      } else {
        // Create new type
        await db.executeQuery(
          'INSERT INTO vehicle_types (id, name, description, is_active) VALUES (?, ?, ?, ?)',
          [this.id, this.name, this.description, this.is_active]
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
}

module.exports = VehicleType; 