const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (db) => {
    try {
      console.log('Creating ride management tables...');

      // 1. Ride Analytics Table
      await db.executeQuery(`
                     CREATE TABLE IF NOT EXISTS ride_analytics (
               id VARCHAR(36) PRIMARY KEY,
               ride_id VARCHAR(36) NOT NULL,
               distance_km DECIMAL(8,2),
               duration_minutes INT,
               fare_amount DECIMAL(10,2),
               commission_amount DECIMAL(10,2),
               status ENUM('pending', 'confirmed', 'started', 'completed', 'cancelled') NOT NULL,
               cancellation_reason VARCHAR(255),
               rating DECIMAL(3,2),
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
             )
      `);

      // 2. Ride Disputes Table
      await db.executeQuery(`
                     CREATE TABLE IF NOT EXISTS ride_disputes (
               id VARCHAR(36) PRIMARY KEY,
               ride_id VARCHAR(36) NOT NULL,
               dispute_type ENUM('payment', 'service', 'safety', 'other') NOT NULL,
               dispute_reason_ar TEXT,
               dispute_reason_en TEXT,
               evidence_files JSON,
               status ENUM('open', 'investigating', 'resolved', 'closed') DEFAULT 'open',
               resolution_ar TEXT,
               resolution_en TEXT,
               resolved_by VARCHAR(36),
               resolved_at TIMESTAMP,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               FOREIGN KEY (resolved_by) REFERENCES admin_users(id) ON DELETE SET NULL
             )
      `);

      // 3. Insert sample ride analytics data (if rides table exists)
      try {
        const [existingRides] = await db.executeQuery('SELECT id FROM rides LIMIT 5');
        
        if (existingRides.length > 0) {
          const sampleRideAnalytics = [
            {
              id: uuidv4(),
              ride_id: existingRides[0].id,
              distance_km: 12.5,
              duration_minutes: 25,
              fare_amount: 45.00,
              commission_amount: 4.50,
              status: 'completed',
              cancellation_reason: null,
              rating: 4.8
            },
            {
              id: uuidv4(),
              ride_id: existingRides[1]?.id || existingRides[0].id,
              distance_km: 8.2,
              duration_minutes: 18,
              fare_amount: 32.50,
              commission_amount: 3.25,
              status: 'completed',
              cancellation_reason: null,
              rating: 4.5
            },
            {
              id: uuidv4(),
              ride_id: existingRides[2]?.id || existingRides[0].id,
              distance_km: 15.8,
              duration_minutes: 30,
              fare_amount: 58.75,
              commission_amount: 5.88,
              status: 'cancelled',
              cancellation_reason: 'Driver unavailable',
              rating: null
            }
          ];

          for (const analytics of sampleRideAnalytics) {
            await db.executeQuery(`
              INSERT INTO ride_analytics (
                id, ride_id, distance_km, duration_minutes, fare_amount, 
                commission_amount, status, cancellation_reason, rating
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              analytics.id,
              analytics.ride_id,
              analytics.distance_km,
              analytics.duration_minutes,
              analytics.fare_amount,
              analytics.commission_amount,
              analytics.status,
              analytics.cancellation_reason,
              analytics.rating
            ]);
          }
        }
      } catch (error) {
        console.log('Rides table not available, skipping sample ride analytics data');
      }

      // 4. Insert sample ride disputes data (if rides table exists)
      try {
        const [existingRides] = await db.executeQuery('SELECT id FROM rides LIMIT 3');
        
        if (existingRides.length > 0) {
          const sampleRideDisputes = [
            {
              id: uuidv4(),
              ride_id: existingRides[0].id,
              dispute_type: 'payment',
              dispute_reason_ar: 'مشكلة في الدفع - تم خصم مبلغ إضافي',
              dispute_reason_en: 'Payment issue - extra amount charged',
              evidence_files: JSON.stringify(['payment_screenshot.jpg', 'receipt.pdf']),
              status: 'open',
              resolution_ar: null,
              resolution_en: null,
              resolved_by: null,
              resolved_at: null
            },
            {
              id: uuidv4(),
              ride_id: existingRides[1]?.id || existingRides[0].id,
              dispute_type: 'service',
              dispute_reason_ar: 'سوء في الخدمة - السائق متأخر كثيراً',
              dispute_reason_en: 'Poor service - driver was very late',
              evidence_files: JSON.stringify(['delay_evidence.mp4']),
              status: 'investigating',
              resolution_ar: 'تم التحقيق في الشكوى',
              resolution_en: 'Complaint under investigation',
              resolved_by: '2ebc1098-3387-4525-acb2-8fa0b3302c01', // admin user
              resolved_at: null
            },
            {
              id: uuidv4(),
              ride_id: existingRides[2]?.id || existingRides[0].id,
              dispute_type: 'safety',
              dispute_reason_ar: 'مخاوف أمنية - السائق يقود بسرعة عالية',
              dispute_reason_en: 'Safety concerns - driver was speeding',
              evidence_files: JSON.stringify(['speed_recording.mp4', 'gps_data.json']),
              status: 'resolved',
              resolution_ar: 'تم حل المشكلة - تم تحذير السائق',
              resolution_en: 'Issue resolved - driver warned',
              resolved_by: '2ebc1098-3387-4525-acb2-8fa0b3302c01', // admin user
              resolved_at: new Date()
            }
          ];

          for (const dispute of sampleRideDisputes) {
            await db.executeQuery(`
              INSERT INTO ride_disputes (
                id, ride_id, dispute_type, dispute_reason_ar, dispute_reason_en,
                evidence_files, status, resolution_ar, resolution_en, resolved_by, resolved_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              dispute.id,
              dispute.ride_id,
              dispute.dispute_type,
              dispute.dispute_reason_ar,
              dispute.dispute_reason_en,
              dispute.evidence_files,
              dispute.status,
              dispute.resolution_ar,
              dispute.resolution_en,
              dispute.resolved_by,
              dispute.resolved_at
            ]);
          }
        }
      } catch (error) {
        console.log('Rides table not available, skipping sample ride disputes data');
      }

      console.log('✅ Ride management tables created successfully');
    } catch (error) {
      console.error('❌ Error creating ride management tables:', error);
      throw error;
    }
  },

  down: async (db) => {
    try {
      console.log('Dropping ride management tables...');
      
      await db.executeQuery('DROP TABLE IF EXISTS ride_disputes');
      await db.executeQuery('DROP TABLE IF EXISTS ride_analytics');
      
      console.log('✅ Ride management tables dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping ride management tables:', error);
      throw error;
    }
  }
}; 