const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');

const seedVehicleModels = async () => {
  try {
    // Get Toyota brand ID
    const toyotaBrand = await db.executeQuery(
      'SELECT id FROM vehicle_brands WHERE name = ?',
      ['Toyota']
    );

    if (toyotaBrand.length > 0) {
      const toyotaId = toyotaBrand[0].id;
      
      // Add Toyota models
      const toyotaModels = [
        { id: uuidv4(), brand_id: toyotaId, name: 'Camry' },
        { id: uuidv4(), brand_id: toyotaId, name: 'Corolla' },
        { id: uuidv4(), brand_id: toyotaId, name: 'RAV4' },
        { id: uuidv4(), brand_id: toyotaId, name: 'Highlander' },
        { id: uuidv4(), brand_id: toyotaId, name: 'Tacoma' }
      ];

      for (const model of toyotaModels) {
        await db.executeQuery(
          'INSERT IGNORE INTO vehicle_models (id, brand_id, name) VALUES (?, ?, ?)',
          [model.id, model.brand_id, model.name]
        );
      }
    }

    // Get Honda brand ID
    const hondaBrand = await db.executeQuery(
      'SELECT id FROM vehicle_brands WHERE name = ?',
      ['Honda']
    );

    if (hondaBrand.length > 0) {
      const hondaId = hondaBrand[0].id;
      
      // Add Honda models
      const hondaModels = [
        { id: uuidv4(), brand_id: hondaId, name: 'Civic' },
        { id: uuidv4(), brand_id: hondaId, name: 'Accord' },
        { id: uuidv4(), brand_id: hondaId, name: 'CR-V' },
        { id: uuidv4(), brand_id: hondaId, name: 'Pilot' }
      ];

      for (const model of hondaModels) {
        await db.executeQuery(
          'INSERT IGNORE INTO vehicle_models (id, brand_id, name) VALUES (?, ?, ?)',
          [model.id, model.brand_id, model.name]
        );
      }
    }

    // Get Ford brand ID
    const fordBrand = await db.executeQuery(
      'SELECT id FROM vehicle_brands WHERE name = ?',
      ['Ford']
    );

    if (fordBrand.length > 0) {
      const fordId = fordBrand[0].id;
      
      // Add Ford models
      const fordModels = [
        { id: uuidv4(), brand_id: fordId, name: 'Focus' },
        { id: uuidv4(), brand_id: fordId, name: 'Fusion' },
        { id: uuidv4(), brand_id: fordId, name: 'Escape' },
        { id: uuidv4(), brand_id: fordId, name: 'Explorer' },
        { id: uuidv4(), brand_id: fordId, name: 'F-150' }
      ];

      for (const model of fordModels) {
        await db.executeQuery(
          'INSERT IGNORE INTO vehicle_models (id, brand_id, name) VALUES (?, ?, ?)',
          [model.id, model.brand_id, model.name]
        );
      }
    }

    console.log('✅ Vehicle models seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding vehicle models:', error);
    throw error;
  }
};

// Run the seed if this file is executed directly
if (require.main === module) {
  seedVehicleModels()
    .then(() => {
      console.log('Vehicle models seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Vehicle models seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedVehicleModels; 