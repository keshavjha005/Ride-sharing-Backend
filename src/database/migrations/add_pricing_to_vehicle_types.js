module.exports = {
  up: async (connection) => {
    try {
      // Add pricing columns to vehicle_types table
      await connection.execute(`
        ALTER TABLE vehicle_types 
        ADD COLUMN IF NOT EXISTS per_km_charges DECIMAL(10,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS minimum_fare DECIMAL(10,2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS maximum_fare DECIMAL(10,2) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `);

      // Update existing vehicle types with default pricing
      await connection.execute(`
        UPDATE vehicle_types 
        SET per_km_charges = 2.50, minimum_fare = 5.00 
        WHERE per_km_charges = 0.00 OR per_km_charges IS NULL
      `);

      console.log('✅ Pricing columns added to vehicle_types table successfully');
    } catch (error) {
      console.error('❌ Error adding pricing columns to vehicle_types:', error);
      throw error;
    }
  },

  down: async (connection) => {
    try {
      // Remove pricing columns from vehicle_types table
      await connection.execute(`
        ALTER TABLE vehicle_types 
        DROP COLUMN IF EXISTS per_km_charges,
        DROP COLUMN IF EXISTS minimum_fare,
        DROP COLUMN IF EXISTS maximum_fare,
        DROP COLUMN IF EXISTS updated_at
      `);

      console.log('✅ Pricing columns removed from vehicle_types table successfully');
    } catch (error) {
      console.error('❌ Error removing pricing columns from vehicle_types:', error);
      throw error;
    }
  }
}; 