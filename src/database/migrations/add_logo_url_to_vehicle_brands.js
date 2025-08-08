const { executeQuery } = require('../../config/database');

/**
 * Migration: Add logo_url column to vehicle_brands table
 * This migration adds a logo_url field to store vehicle brand logo image paths
 */

async function up() {
  try {
    console.log('🔄 Adding logo_url column to vehicle_brands table...');
    
    await executeQuery(`
      ALTER TABLE vehicle_brands 
      ADD COLUMN logo_url VARCHAR(255) NULL 
      AFTER name
    `);
    
    console.log('✅ Successfully added logo_url column to vehicle_brands table');
  } catch (error) {
    console.error('❌ Error adding logo_url column:', error);
    throw error;
  }
}

async function down() {
  try {
    console.log('🔄 Removing logo_url column from vehicle_brands table...');
    
    await executeQuery(`
      ALTER TABLE vehicle_brands 
      DROP COLUMN logo_url
    `);
    
    console.log('✅ Successfully removed logo_url column from vehicle_brands table');
  } catch (error) {
    console.error('❌ Error removing logo_url column:', error);
    throw error;
  }
}

module.exports = { up, down };

// Run migration if called directly
if (require.main === module) {
  up()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}
