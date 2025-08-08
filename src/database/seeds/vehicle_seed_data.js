const { executeQuery } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Vehicle Seed Data
 * This script populates the vehicle_types, vehicle_brands, and vehicle_models tables
 */

const vehicleTypes = [
  {
    id: uuidv4(),
    name: 'Car',
    description: 'Standard passenger car for 1-4 people',
    per_km_charges: 2.50,
    minimum_fare: 5.00,
    maximum_fare: 100.00,
    is_active: true
  },
  {
    id: uuidv4(),
    name: 'SUV',
    description: 'Sports Utility Vehicle for 1-7 people',
    per_km_charges: 3.00,
    minimum_fare: 8.00,
    maximum_fare: 150.00,
    is_active: true
  },
  {
    id: uuidv4(),
    name: 'Van',
    description: 'Large van for groups or cargo',
    per_km_charges: 3.50,
    minimum_fare: 10.00,
    maximum_fare: 200.00,
    is_active: true
  },
  {
    id: uuidv4(),
    name: 'Motorcycle',
    description: 'Motorcycle for 1-2 people',
    per_km_charges: 1.50,
    minimum_fare: 3.00,
    maximum_fare: 50.00,
    is_active: true
  },
  {
    id: uuidv4(),
    name: 'Truck',
    description: 'Pickup truck for cargo and passengers',
    per_km_charges: 4.00,
    minimum_fare: 12.00,
    maximum_fare: 250.00,
    is_active: true
  }
];

const vehicleBrands = [
  // Car brands with real logos
  { id: uuidv4(), name: 'Toyota', logo_url: '/images/vehicle-brands/toyota.png', is_active: true },
  { id: uuidv4(), name: 'Honda', logo_url: '/images/vehicle-brands/honda.png', is_active: true },
  { id: uuidv4(), name: 'Nissan', logo_url: '/images/vehicle-brands/nissan.png', is_active: true },
  { id: uuidv4(), name: 'Hyundai', logo_url: '/images/vehicle-brands/hyundai.png', is_active: true },
  { id: uuidv4(), name: 'Kia', logo_url: '/images/vehicle-brands/kia.png', is_active: true },
  { id: uuidv4(), name: 'Mazda', logo_url: '/images/vehicle-brands/mazda.png', is_active: true },
  { id: uuidv4(), name: 'Subaru', logo_url: '/images/vehicle-brands/subaru.png', is_active: true },
  { id: uuidv4(), name: 'Mitsubishi', logo_url: '/images/vehicle-brands/mitsubishi.png', is_active: true },
  { id: uuidv4(), name: 'BMW', logo_url: '/images/vehicle-brands/bmw.png', is_active: true },
  { id: uuidv4(), name: 'Mercedes-Benz', logo_url: '/images/vehicle-brands/mercedes.png', is_active: true },
  { id: uuidv4(), name: 'Audi', logo_url: '/images/vehicle-brands/audi.png', is_active: true },
  { id: uuidv4(), name: 'Ford', logo_url: '/images/vehicle-brands/ford.png', is_active: true },
  { id: uuidv4(), name: 'Volkswagen', logo_url: '/images/vehicle-brands/volkswagen.png', is_active: true },
  { id: uuidv4(), name: 'Lexus', logo_url: '/images/vehicle-brands/lexus.png', is_active: true },
  
  // Other brands without logos
  { id: uuidv4(), name: 'Suzuki', is_active: true },
  { id: uuidv4(), name: 'Isuzu', is_active: true },
  
  // Motorcycle brands
  { id: uuidv4(), name: 'Yamaha', is_active: true },
  { id: uuidv4(), name: 'Kawasaki', is_active: true },
  { id: uuidv4(), name: 'Harley-Davidson', is_active: true }
];

const vehicleModels = [
  // Toyota models
  { id: uuidv4(), brand_id: null, name: 'Corolla', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Camry', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'RAV4', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Highlander', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Prius', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Sienna', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Tacoma', is_active: true },
  
  // Honda models
  { id: uuidv4(), brand_id: null, name: 'Civic', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Accord', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'CR-V', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Pilot', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Odyssey', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Ridgeline', is_active: true },
  
  // Nissan models
  { id: uuidv4(), brand_id: null, name: 'Sentra', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Altima', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Rogue', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Murano', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Pathfinder', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Frontier', is_active: true },
  
  // Hyundai models
  { id: uuidv4(), brand_id: null, name: 'Elantra', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Sonata', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Tucson', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Santa Fe', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Palisade', is_active: true },
  
  // BMW models
  { id: uuidv4(), brand_id: null, name: '3 Series', is_active: true },
  { id: uuidv4(), brand_id: null, name: '5 Series', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'X3', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'X5', is_active: true },
  
  // Mercedes-Benz models
  { id: uuidv4(), brand_id: null, name: 'C-Class', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'E-Class', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'GLC', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'GLE', is_active: true },
  
  // Audi models
  { id: uuidv4(), brand_id: null, name: 'A3', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'A4', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Q5', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Q7', is_active: true },
  
  // Ford models
  { id: uuidv4(), brand_id: null, name: 'Focus', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Fusion', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Escape', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Explorer', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'F-150', is_active: true },
  
  // Volkswagen models
  { id: uuidv4(), brand_id: null, name: 'Jetta', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Passat', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Tiguan', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Atlas', is_active: true },
  
  // Lexus models
  { id: uuidv4(), brand_id: null, name: 'ES', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'RX', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'NX', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'GX', is_active: true },
  
  // Motorcycle models
  { id: uuidv4(), brand_id: null, name: 'R1', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'MT-07', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Ninja 300', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Ninja 650', is_active: true },
  { id: uuidv4(), brand_id: null, name: 'Street 750', is_active: true }
];

async function seedVehicleData() {
  try {
    console.log('🚗 Starting vehicle data seeding...');

    // Insert vehicle types
    console.log('📝 Inserting vehicle types...');
    for (const type of vehicleTypes) {
      await executeQuery(
        `INSERT INTO vehicle_types (id, name, description, per_km_charges, minimum_fare, maximum_fare, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [type.id, type.name, type.description, type.per_km_charges, type.minimum_fare, type.maximum_fare, type.is_active]
      );
    }
    console.log(`✅ Inserted ${vehicleTypes.length} vehicle types`);

    // Insert vehicle brands
    console.log('📝 Inserting vehicle brands...');
    for (const brand of vehicleBrands) {
      await executeQuery(
        `INSERT INTO vehicle_brands (id, name, logo_url, is_active, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [brand.id, brand.name, brand.logo_url || null, brand.is_active]
      );
    }
    console.log(`✅ Inserted ${vehicleBrands.length} vehicle brands`);

    // Update vehicle models with brand IDs
    console.log('📝 Mapping models to brands...');
    const brandMap = {
      'Toyota': ['Corolla', 'Camry', 'RAV4', 'Highlander', 'Prius', 'Sienna', 'Tacoma'],
      'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Ridgeline'],
      'Nissan': ['Sentra', 'Altima', 'Rogue', 'Murano', 'Pathfinder', 'Frontier'],
      'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade'],
      'BMW': ['3 Series', '5 Series', 'X3', 'X5'],
      'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE'],
      'Audi': ['A3', 'A4', 'Q5', 'Q7'],
      'Ford': ['Focus', 'Fusion', 'Escape', 'Explorer', 'F-150'],
      'Volkswagen': ['Jetta', 'Passat', 'Tiguan', 'Atlas'],
      'Lexus': ['ES', 'RX', 'NX', 'GX'],
      'Yamaha': ['R1', 'MT-07'],
      'Kawasaki': ['Ninja 300', 'Ninja 650'],
      'Harley-Davidson': ['Street 750']
    };

    // Update models with correct brand IDs
    for (const [brandName, modelNames] of Object.entries(brandMap)) {
      const brand = vehicleBrands.find(b => b.name === brandName);
      if (brand) {
        for (const modelName of modelNames) {
          const model = vehicleModels.find(m => m.name === modelName);
          if (model) {
            model.brand_id = brand.id;
          }
        }
      }
    }

    // Insert vehicle models
    console.log('📝 Inserting vehicle models...');
    for (const model of vehicleModels) {
      await executeQuery(
        `INSERT INTO vehicle_models (id, brand_id, name, is_active, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [model.id, model.brand_id, model.name, model.is_active]
      );
    }
    console.log(`✅ Inserted ${vehicleModels.length} vehicle models`);

    console.log('🎉 Vehicle data seeding completed successfully!');
    
    // Verify the data
    const typesCount = await executeQuery('SELECT COUNT(*) as count FROM vehicle_types');
    const brandsCount = await executeQuery('SELECT COUNT(*) as count FROM vehicle_brands');
    const modelsCount = await executeQuery('SELECT COUNT(*) as count FROM vehicle_models');
    
    console.log('\n📊 Verification:');
    console.log(`   Vehicle Types: ${typesCount[0].count}`);
    console.log(`   Vehicle Brands: ${brandsCount[0].count}`);
    console.log(`   Vehicle Models: ${modelsCount[0].count}`);

  } catch (error) {
    console.error('❌ Error seeding vehicle data:', error);
    throw error;
  }
}

// Export for use in other scripts
module.exports = { seedVehicleData, vehicleTypes, vehicleBrands, vehicleModels };

// Run directly if called as main script
if (require.main === module) {
  seedVehicleData()
    .then(() => {
      console.log('✅ Vehicle seeding completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Vehicle seeding failed:', error);
      process.exit(1);
    });
}
