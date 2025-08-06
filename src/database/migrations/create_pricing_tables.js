const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (connection) => {
    try {
      // Add pricing columns to existing vehicle_types table
      await connection.execute(`
        ALTER TABLE vehicle_types 
        ADD COLUMN per_km_charges DECIMAL(10,2) DEFAULT 0.00 AFTER description,
        ADD COLUMN minimum_fare DECIMAL(10,2) DEFAULT 0.00 AFTER per_km_charges,
        ADD COLUMN maximum_fare DECIMAL(10,2) NULL AFTER minimum_fare,
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at
      `);

      // Create pricing multipliers table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS pricing_multipliers (
          id VARCHAR(36) PRIMARY KEY,
          vehicle_type_id VARCHAR(36) NOT NULL,
          multiplier_type ENUM('peak_hour', 'weekend', 'holiday', 'weather', 'demand') NOT NULL,
          multiplier_value DECIMAL(5,2) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id) ON DELETE CASCADE
        )
      `);

      // Create pricing calculation history table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS pricing_calculations (
          id VARCHAR(36) PRIMARY KEY,
          trip_id VARCHAR(36) NOT NULL,
          vehicle_type_id VARCHAR(36) NOT NULL,
          base_distance DECIMAL(10,2) NOT NULL,
          base_fare DECIMAL(10,2) NOT NULL,
          applied_multipliers JSON,
          final_fare DECIMAL(10,2) NOT NULL,
          calculation_details JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id) ON DELETE CASCADE
        )
      `);

      // Update existing vehicle types with default pricing
      const vehicleTypes = [
        { name: 'Sedan', per_km_charges: 2.50, minimum_fare: 5.00, maximum_fare: 100.00 },
        { name: 'SUV', per_km_charges: 3.00, minimum_fare: 6.00, maximum_fare: 120.00 },
        { name: 'Hatchback', per_km_charges: 2.00, minimum_fare: 4.00, maximum_fare: 80.00 },
        { name: 'Van', per_km_charges: 3.50, minimum_fare: 7.00, maximum_fare: 150.00 },
        { name: 'Pickup', per_km_charges: 3.25, minimum_fare: 6.50, maximum_fare: 130.00 }
      ];

      for (const type of vehicleTypes) {
        await connection.execute(
          'UPDATE vehicle_types SET per_km_charges = ?, minimum_fare = ?, maximum_fare = ? WHERE name = ?',
          [type.per_km_charges, type.minimum_fare, type.maximum_fare, type.name]
        );
      }

      // Insert default pricing multipliers
      const multipliers = [
        { vehicle_type_name: 'Sedan', multiplier_type: 'peak_hour', multiplier_value: 1.25 },
        { vehicle_type_name: 'Sedan', multiplier_type: 'weekend', multiplier_value: 1.15 },
        { vehicle_type_name: 'SUV', multiplier_type: 'peak_hour', multiplier_value: 1.30 },
        { vehicle_type_name: 'SUV', multiplier_type: 'weekend', multiplier_value: 1.20 },
        { vehicle_type_name: 'Hatchback', multiplier_type: 'peak_hour', multiplier_value: 1.20 },
        { vehicle_type_name: 'Hatchback', multiplier_type: 'weekend', multiplier_value: 1.10 },
        { vehicle_type_name: 'Van', multiplier_type: 'peak_hour', multiplier_value: 1.35 },
        { vehicle_type_name: 'Van', multiplier_type: 'weekend', multiplier_value: 1.25 },
        { vehicle_type_name: 'Pickup', multiplier_type: 'peak_hour', multiplier_value: 1.30 },
        { vehicle_type_name: 'Pickup', multiplier_type: 'weekend', multiplier_value: 1.20 }
      ];

      for (const multiplier of multipliers) {
        // Get vehicle type ID
        const [vehicleTypeRows] = await connection.execute(
          'SELECT id FROM vehicle_types WHERE name = ?',
          [multiplier.vehicle_type_name]
        );

        if (vehicleTypeRows.length > 0) {
          const vehicleTypeId = vehicleTypeRows[0].id;
          await connection.execute(
            'INSERT INTO pricing_multipliers (id, vehicle_type_id, multiplier_type, multiplier_value) VALUES (?, ?, ?, ?)',
            [uuidv4(), vehicleTypeId, multiplier.multiplier_type, multiplier.multiplier_value]
          );
        }
      }

      console.log('Pricing tables created and populated successfully');
    } catch (error) {
      console.error('Error creating pricing tables:', error);
      throw error;
    }
  },

  down: async (connection) => {
    try {
      // Drop pricing calculation history table
      await connection.execute('DROP TABLE IF EXISTS pricing_calculations');
      
      // Drop pricing multipliers table
      await connection.execute('DROP TABLE IF EXISTS pricing_multipliers');
      
      // Remove pricing columns from vehicle_types table
      await connection.execute(`
        ALTER TABLE vehicle_types 
        DROP COLUMN per_km_charges,
        DROP COLUMN minimum_fare,
        DROP COLUMN maximum_fare,
        DROP COLUMN updated_at
      `);

      console.log('Pricing tables dropped successfully');
    } catch (error) {
      console.error('Error dropping pricing tables:', error);
      throw error;
    }
  }
}; 