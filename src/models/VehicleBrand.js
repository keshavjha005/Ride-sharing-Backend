const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class VehicleBrand {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.logo = data.logo;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at || new Date();
  }

  static async findAll(activeOnly = true) {
    try {
      const query = activeOnly 
        ? 'SELECT * FROM vehicle_brands WHERE is_active = true ORDER BY name'
        : 'SELECT * FROM vehicle_brands ORDER BY name';
      
      const rows = await db.executeQuery(query);
      return rows.map(row => new VehicleBrand(row));
    } catch (error) {
      throw new Error(`Error fetching vehicle brands: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM vehicle_brands WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new VehicleBrand(rows[0]);
    } catch (error) {
      throw new Error(`Error fetching vehicle brand: ${error.message}`);
    }
  }

  static async findByName(name) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM vehicle_brands WHERE name = ? AND is_active = true',
        [name]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new VehicleBrand(rows[0]);
    } catch (error) {
      throw new Error(`Error fetching vehicle brand by name: ${error.message}`);
    }
  }

  async save() {
    try {
      if (this.id) {
        // Update existing brand
        await db.executeQuery(
          'UPDATE vehicle_brands SET name = ?, logo = ?, is_active = ? WHERE id = ?',
          [this.name, this.logo, this.is_active, this.id]
        );
      } else {
        // Create new brand
        await db.executeQuery(
          'INSERT INTO vehicle_brands (id, name, logo, is_active) VALUES (?, ?, ?, ?)',
          [this.id, this.name, this.logo, this.is_active]
        );
      }
      
      return this;
    } catch (error) {
      throw new Error(`Error saving vehicle brand: ${error.message}`);
    }
  }

  async delete() {
    try {
      await db.executeQuery(
        'UPDATE vehicle_brands SET is_active = false WHERE id = ?',
        [this.id]
      );
      this.is_active = false;
      return this;
    } catch (error) {
      throw new Error(`Error deleting vehicle brand: ${error.message}`);
    }
  }

  static async create(data) {
    const brand = new VehicleBrand(data);
    return await brand.save();
  }
}

module.exports = VehicleBrand; 