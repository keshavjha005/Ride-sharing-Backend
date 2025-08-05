const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class UserVehicle {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.user_id = data.user_id;
    this.vehicle_type_id = data.vehicle_type_id;
    this.vehicle_brand_id = data.vehicle_brand_id;
    this.vehicle_model_id = data.vehicle_model_id;
    this.vehicle_number = data.vehicle_number;
    this.vehicle_color = data.vehicle_color || null;
    this.vehicle_year = data.vehicle_year || null;
    this.vehicle_image = data.vehicle_image || null;
    this.is_verified = data.is_verified !== undefined ? data.is_verified : false;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at || new Date();
  }

  static async findByUserId(userId, activeOnly = true) {
    try {
      const query = activeOnly 
        ? 'SELECT * FROM user_vehicle_information WHERE user_id = ? AND is_active = true ORDER BY created_at DESC'
        : 'SELECT * FROM user_vehicle_information WHERE user_id = ? ORDER BY created_at DESC';
      
      const rows = await db.executeQuery(query, [userId]);
      return rows.map(row => new UserVehicle(row));
    } catch (error) {
      throw new Error(`Error fetching user vehicles: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM user_vehicle_information WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new UserVehicle(rows[0]);
    } catch (error) {
      throw new Error(`Error fetching user vehicle: ${error.message}`);
    }
  }

  static async findByVehicleNumber(vehicleNumber, userId) {
    try {
      const rows = await db.executeQuery(
        'SELECT * FROM user_vehicle_information WHERE vehicle_number = ? AND user_id = ? AND is_active = true',
        [vehicleNumber, userId]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new UserVehicle(rows[0]);
    } catch (error) {
      throw new Error(`Error fetching user vehicle by number: ${error.message}`);
    }
  }

  async save() {
    try {
      // Check if record exists in database
      const existingRecord = await db.executeQuery(
        'SELECT id FROM user_vehicle_information WHERE id = ?',
        [this.id]
      );

      if (existingRecord.length > 0) {
        // Update existing vehicle
        await db.executeQuery(
          `UPDATE user_vehicle_information SET 
           vehicle_type_id = ?, vehicle_brand_id = ?, vehicle_model_id = ?, 
           vehicle_number = ?, vehicle_color = ?, vehicle_year = ?, 
           vehicle_image = ?, is_verified = ?, is_active = ? 
           WHERE id = ?`,
          [
            this.vehicle_type_id, this.vehicle_brand_id, this.vehicle_model_id,
            this.vehicle_number, this.vehicle_color, this.vehicle_year,
            this.vehicle_image, this.is_verified, this.is_active, this.id
          ]
        );
      } else {
        // Create new vehicle
        await db.executeQuery(
          `INSERT INTO user_vehicle_information 
           (id, user_id, vehicle_type_id, vehicle_brand_id, vehicle_model_id, 
            vehicle_number, vehicle_color, vehicle_year, vehicle_image, 
            is_verified, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            this.id, this.user_id, this.vehicle_type_id, this.vehicle_brand_id,
            this.vehicle_model_id, this.vehicle_number, this.vehicle_color,
            this.vehicle_year, this.vehicle_image, this.is_verified, this.is_active
          ]
        );
      }
      
      return this;
    } catch (error) {
      throw new Error(`Error saving user vehicle: ${error.message}`);
    }
  }

  async delete() {
    try {
      await db.executeQuery(
        'UPDATE user_vehicle_information SET is_active = false WHERE id = ?',
        [this.id]
      );
      this.is_active = false;
      return this;
    } catch (error) {
      throw new Error(`Error deleting user vehicle: ${error.message}`);
    }
  }

  async verify() {
    try {
      await db.executeQuery(
        'UPDATE user_vehicle_information SET is_verified = true WHERE id = ?',
        [this.id]
      );
      this.is_verified = true;
      return this;
    } catch (error) {
      throw new Error(`Error verifying user vehicle: ${error.message}`);
    }
  }

  static async create(data) {
    const vehicle = new UserVehicle(data);
    return await vehicle.save();
  }

  static async getWithDetails(id) {
    try {
      const rows = await db.executeQuery(`
        SELECT uvi.*, 
               vt.name as vehicle_type_name,
               vb.name as vehicle_brand_name,
               vm.name as vehicle_model_name
        FROM user_vehicle_information uvi
        LEFT JOIN vehicle_types vt ON uvi.vehicle_type_id = vt.id
        LEFT JOIN vehicle_brands vb ON uvi.vehicle_brand_id = vb.id
        LEFT JOIN vehicle_models vm ON uvi.vehicle_model_id = vm.id
        WHERE uvi.id = ?
      `, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const vehicle = new UserVehicle(rows[0]);
      return {
        ...vehicle,
        vehicle_type_name: rows[0].vehicle_type_name,
        vehicle_brand_name: rows[0].vehicle_brand_name,
        vehicle_model_name: rows[0].vehicle_model_name
      };
    } catch (error) {
      throw new Error(`Error fetching user vehicle with details: ${error.message}`);
    }
  }

  static async getByUserIdWithDetails(userId, activeOnly = true) {
    try {
      const query = activeOnly 
        ? `SELECT uvi.*, 
                  vt.name as vehicle_type_name,
                  vb.name as vehicle_brand_name,
                  vm.name as vehicle_model_name
           FROM user_vehicle_information uvi
           LEFT JOIN vehicle_types vt ON uvi.vehicle_type_id = vt.id
           LEFT JOIN vehicle_brands vb ON uvi.vehicle_brand_id = vb.id
           LEFT JOIN vehicle_models vm ON uvi.vehicle_model_id = vm.id
           WHERE uvi.user_id = ? AND uvi.is_active = true
           ORDER BY uvi.created_at DESC`
        : `SELECT uvi.*, 
                  vt.name as vehicle_type_name,
                  vb.name as vehicle_brand_name,
                  vm.name as vehicle_model_name
           FROM user_vehicle_information uvi
           LEFT JOIN vehicle_types vt ON uvi.vehicle_type_id = vt.id
           LEFT JOIN vehicle_brands vb ON uvi.vehicle_brand_id = vb.id
           LEFT JOIN vehicle_models vm ON uvi.vehicle_model_id = vm.id
           WHERE uvi.user_id = ?
           ORDER BY uvi.created_at DESC`;
      
      const rows = await db.executeQuery(query, [userId]);
      
      return rows.map(row => {
        const vehicle = new UserVehicle(row);
        return {
          ...vehicle,
          vehicle_type_name: row.vehicle_type_name,
          vehicle_brand_name: row.vehicle_brand_name,
          vehicle_model_name: row.vehicle_model_name
        };
      });
    } catch (error) {
      throw new Error(`Error fetching user vehicles with details: ${error.message}`);
    }
  }
}

module.exports = UserVehicle; 