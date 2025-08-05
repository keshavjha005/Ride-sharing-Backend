const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (connection) => {
    try {
      // Create vehicle brands table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS vehicle_brands (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          logo VARCHAR(500),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create vehicle models table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS vehicle_models (
          id VARCHAR(36) PRIMARY KEY,
          brand_id VARCHAR(36) NOT NULL,
          name VARCHAR(100) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (brand_id) REFERENCES vehicle_brands(id) ON DELETE CASCADE
        )
      `);

      // Create vehicle types table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS vehicle_types (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create user vehicle information table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_vehicle_information (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          vehicle_type_id VARCHAR(36) NOT NULL,
          vehicle_brand_id VARCHAR(36) NOT NULL,
          vehicle_model_id VARCHAR(36) NOT NULL,
          vehicle_number VARCHAR(50) NOT NULL,
          vehicle_color VARCHAR(50),
          vehicle_year INT,
          vehicle_image VARCHAR(500),
          is_verified BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id),
          FOREIGN KEY (vehicle_brand_id) REFERENCES vehicle_brands(id),
          FOREIGN KEY (vehicle_model_id) REFERENCES vehicle_models(id)
        )
      `);

      // Insert default vehicle types
      const vehicleTypes = [
        { id: uuidv4(), name: 'Sedan', description: 'Standard sedan car' },
        { id: uuidv4(), name: 'SUV', description: 'Sport Utility Vehicle' },
        { id: uuidv4(), name: 'Hatchback', description: 'Compact hatchback' },
        { id: uuidv4(), name: 'Van', description: 'Passenger van' },
        { id: uuidv4(), name: 'Pickup', description: 'Pickup truck' }
      ];

      for (const type of vehicleTypes) {
        await connection.execute(
          'INSERT IGNORE INTO vehicle_types (id, name, description) VALUES (?, ?, ?)',
          [type.id, type.name, type.description]
        );
      }

      // Insert popular vehicle brands
      const vehicleBrands = [
        { id: uuidv4(), name: 'Toyota' },
        { id: uuidv4(), name: 'Honda' },
        { id: uuidv4(), name: 'Ford' },
        { id: uuidv4(), name: 'Chevrolet' },
        { id: uuidv4(), name: 'Nissan' },
        { id: uuidv4(), name: 'BMW' },
        { id: uuidv4(), name: 'Mercedes-Benz' },
        { id: uuidv4(), name: 'Audi' },
        { id: uuidv4(), name: 'Volkswagen' },
        { id: uuidv4(), name: 'Hyundai' },
        { id: uuidv4(), name: 'Kia' },
        { id: uuidv4(), name: 'Mazda' },
        { id: uuidv4(), name: 'Subaru' },
        { id: uuidv4(), name: 'Lexus' },
        { id: uuidv4(), name: 'Acura' }
      ];

      for (const brand of vehicleBrands) {
        await connection.execute(
          'INSERT IGNORE INTO vehicle_brands (id, name) VALUES (?, ?)',
          [brand.id, brand.name]
        );
      }

      console.log('✅ Vehicle tables created successfully');
    } catch (error) {
      console.error('❌ Error creating vehicle tables:', error);
      throw error;
    }
  },

  down: async (connection) => {
    try {
      await connection.execute('DROP TABLE IF EXISTS user_vehicle_information');
      await connection.execute('DROP TABLE IF EXISTS vehicle_models');
      await connection.execute('DROP TABLE IF EXISTS vehicle_brands');
      await connection.execute('DROP TABLE IF EXISTS vehicle_types');
      console.log('✅ Vehicle tables dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping vehicle tables:', error);
      throw error;
    }
  }
}; 