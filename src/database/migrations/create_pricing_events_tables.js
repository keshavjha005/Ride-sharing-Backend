const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (connection) => {
    try {
      // Create pricing_events table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS pricing_events (
          id VARCHAR(36) PRIMARY KEY,
          event_name VARCHAR(100) NOT NULL,
          event_type ENUM('seasonal', 'holiday', 'special_event', 'demand_surge') NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          pricing_multiplier DECIMAL(5,2) NOT NULL,
          affected_vehicle_types JSON,
          affected_areas JSON,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Create pricing_event_applications table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS pricing_event_applications (
          id VARCHAR(36) PRIMARY KEY,
          trip_id VARCHAR(36) NOT NULL,
          pricing_event_id VARCHAR(36) NOT NULL,
          original_fare DECIMAL(10,2) NOT NULL,
          adjusted_fare DECIMAL(10,2) NOT NULL,
          multiplier_applied DECIMAL(5,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pricing_event_id) REFERENCES pricing_events(id) ON DELETE CASCADE
        )
      `);

      // Insert some default pricing events for testing
      const defaultEvents = [
        {
          id: uuidv4(),
          event_name: 'New Year Surge',
          event_type: 'special_event',
          start_date: '2024-12-31 18:00:00',
          end_date: '2025-01-01 06:00:00',
          pricing_multiplier: 2.50,
          affected_vehicle_types: JSON.stringify(['all']),
          affected_areas: JSON.stringify(['all']),
          description: 'New Year pricing surge for all vehicle types'
        },
        {
          id: uuidv4(),
          event_name: 'Summer Season',
          event_type: 'seasonal',
          start_date: '2024-06-01 00:00:00',
          end_date: '2024-08-31 23:59:59',
          pricing_multiplier: 1.15,
          affected_vehicle_types: JSON.stringify(['all']),
          affected_areas: JSON.stringify(['all']),
          description: 'Summer season pricing adjustment'
        },
        {
          id: uuidv4(),
          event_name: 'Christmas Holiday',
          event_type: 'holiday',
          start_date: '2024-12-24 00:00:00',
          end_date: '2024-12-26 23:59:59',
          pricing_multiplier: 1.75,
          affected_vehicle_types: JSON.stringify(['all']),
          affected_areas: JSON.stringify(['all']),
          description: 'Christmas holiday pricing surge'
        },
        {
          id: uuidv4(),
          event_name: 'Weekend Demand Surge',
          event_type: 'demand_surge',
          start_date: '2024-01-01 00:00:00',
          end_date: '2024-12-31 23:59:59',
          pricing_multiplier: 1.25,
          affected_vehicle_types: JSON.stringify(['Sedan', 'SUV']),
          affected_areas: JSON.stringify(['downtown', 'airport']),
          description: 'Weekend demand surge for popular vehicle types in high-demand areas'
        }
      ];

      for (const event of defaultEvents) {
        await connection.execute(
          `INSERT INTO pricing_events (
            id, event_name, event_type, start_date, end_date, 
            pricing_multiplier, affected_vehicle_types, affected_areas, description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            event.id,
            event.event_name,
            event.event_type,
            event.start_date,
            event.end_date,
            event.pricing_multiplier,
            event.affected_vehicle_types,
            event.affected_areas,
            event.description
          ]
        );
      }

      console.log('✅ Pricing events tables created successfully');
    } catch (error) {
      console.error('❌ Error creating pricing events tables:', error);
      throw error;
    }
  },

  down: async (connection) => {
    try {
      // Drop tables in reverse order
      await connection.execute('DROP TABLE IF EXISTS pricing_event_applications');
      await connection.execute('DROP TABLE IF EXISTS pricing_events');
      
      console.log('✅ Pricing events tables dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping pricing events tables:', error);
      throw error;
    }
  }
}; 