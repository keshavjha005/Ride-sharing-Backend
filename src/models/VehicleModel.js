const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class VehicleModel {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.brand_id = data.brand_id;
    this.name = data.name;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at || new Date();
  }

  static async findByBrandId(brandId, activeOnly = true) {
    try {
      const query = activeOnly 
        ? 'SELECT * FROM vehicle_models WHERE brand_id = ? AND is_active = true ORDER BY name'
        : 'SELECT * FROM vehicle_models WHERE brand_id = ? ORDER BY name';
      
      const rows = await db.executeQuery(query, [brandId]);
      return rows.map(row => new VehicleModel(row));
    } catch (error) {
      throw new Error(`Error fetching vehicle models: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM vehicle_models WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new VehicleModel(rows[0]);
    } catch (error) {
      throw new Error(`Error fetching vehicle model: ${error.message}`);
    }
  }

  static async findByNameAndBrand(name, brandId) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM vehicle_models WHERE name = ? AND brand_id = ? AND is_active = true',
        [name, brandId]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new VehicleModel(rows[0]);
    } catch (error) {
      throw new Error(`Error fetching vehicle model by name and brand: ${error.message}`);
    }
  }

  async save() {
    try {
      if (this.id) {
        // Update existing model
        await db.executeQuery(
          'UPDATE vehicle_models SET name = ?, is_active = ? WHERE id = ?',
          [this.name, this.is_active, this.id]
        );
      } else {
        // Create new model
        await db.executeQuery(
          'INSERT INTO vehicle_models (id, brand_id, name, is_active) VALUES (?, ?, ?, ?)',
          [this.id, this.brand_id, this.name, this.is_active]
        );
      }
      
      return this;
    } catch (error) {
      throw new Error(`Error saving vehicle model: ${error.message}`);
    }
  }

  async delete() {
    try {
      await db.executeQuery(
        'UPDATE vehicle_models SET is_active = false WHERE id = ?',
        [this.id]
      );
      this.is_active = false;
      return this;
    } catch (error) {
      throw new Error(`Error deleting vehicle model: ${error.message}`);
    }
  }

  static async create(data) {
    const model = new VehicleModel(data);
    return await model.save();
  }

  static async getAllWithBrands() {
    try {
      const rows = await db.executeQuery(`
        SELECT vm.*, vb.name as brand_name 
        FROM vehicle_models vm 
        JOIN vehicle_brands vb ON vm.brand_id = vb.id 
        WHERE vm.is_active = true AND vb.is_active = true 
        ORDER BY vb.name, vm.name
      `);
      
      return rows.map(row => ({
        ...new VehicleModel(row),
        brand_name: row.brand_name
      }));
    } catch (error) {
      throw new Error(`Error fetching vehicle models with brands: ${error.message}`);
    }
  }
}

module.exports = VehicleModel; 