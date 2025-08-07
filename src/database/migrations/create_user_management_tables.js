const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (db) => {
    try {
      console.log('Creating user management tables...');

      // 1. User Analytics Table
      await db.executeQuery(`
        CREATE TABLE IF NOT EXISTS user_analytics (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          total_rides INT DEFAULT 0,
          total_spent DECIMAL(12,2) DEFAULT 0.00,
          average_rating DECIMAL(3,2),
          last_activity TIMESTAMP,
          registration_date TIMESTAMP,
          verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
          risk_score DECIMAL(3,2) DEFAULT 0.00,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // 2. User Reports Table
      await db.executeQuery(`
        CREATE TABLE IF NOT EXISTS user_reports (
          id VARCHAR(36) PRIMARY KEY,
          reported_user_id VARCHAR(36) NOT NULL,
          reporter_user_id VARCHAR(36) NOT NULL,
          report_type ENUM('inappropriate_behavior', 'safety_concern', 'fraud', 'other') NOT NULL,
          report_reason_ar TEXT,
          report_reason_en TEXT,
          evidence_files JSON,
          status ENUM('pending', 'investigating', 'resolved', 'dismissed') DEFAULT 'pending',
          admin_notes TEXT,
          resolved_by VARCHAR(36),
          resolved_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (resolved_by) REFERENCES admin_users(id) ON DELETE SET NULL
        )
      `);

      // 3. Insert sample user analytics data
      const sampleUserAnalytics = [
        {
          id: uuidv4(),
          user_id: '93e8a646-db65-4f01-8564-fb16a0d80a9b', // testuser2@example.com
          total_rides: 5,
          total_spent: 125.50,
          average_rating: 4.8,
          last_activity: new Date(),
          registration_date: new Date('2025-08-06T13:17:22.000Z'),
          verification_status: 'verified',
          risk_score: 0.1
        },
        {
          id: uuidv4(),
          user_id: 'a135bdc0-34d6-404e-87a9-83a0dcf1d6a8', // testuser@example.com
          total_rides: 12,
          total_spent: 289.75,
          average_rating: 4.6,
          last_activity: new Date(),
          registration_date: new Date('2025-08-06T13:17:22.000Z'),
          verification_status: 'verified',
          risk_score: 0.2
        },
        {
          id: uuidv4(),
          user_id: '9df778f6-6742-4e83-b444-db6e2bf25832', // admin-financial-test
          total_rides: 0,
          total_spent: 0.00,
          average_rating: null,
          last_activity: new Date(),
          registration_date: new Date('2025-08-06T13:17:21.000Z'),
          verification_status: 'pending',
          risk_score: 0.0
        },
        {
          id: uuidv4(),
          user_id: 'b71ca072-9f54-4c59-aaa8-9f1f67bbd5fc', // user-financial-test
          total_rides: 3,
          total_spent: 67.25,
          average_rating: 4.2,
          last_activity: new Date(),
          registration_date: new Date('2025-08-06T13:17:21.000Z'),
          verification_status: 'verified',
          risk_score: 0.3
        }
      ];

      for (const analytics of sampleUserAnalytics) {
        await db.executeQuery(`
          INSERT INTO user_analytics (
            id, user_id, total_rides, total_spent, average_rating, 
            last_activity, registration_date, verification_status, risk_score
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          analytics.id,
          analytics.user_id,
          analytics.total_rides,
          analytics.total_spent,
          analytics.average_rating,
          analytics.last_activity,
          analytics.registration_date,
          analytics.verification_status,
          analytics.risk_score
        ]);
      }

      // 4. Insert sample user reports
      const sampleUserReports = [
        {
          id: uuidv4(),
          reported_user_id: 'b71ca072-9f54-4c59-aaa8-9f1f67bbd5fc',
          reporter_user_id: '93e8a646-db65-4f01-8564-fb16a0d80a9b',
          report_type: 'inappropriate_behavior',
          report_reason_ar: 'سلوك غير لائق أثناء الرحلة',
          report_reason_en: 'Inappropriate behavior during ride',
          evidence_files: JSON.stringify(['evidence1.jpg', 'evidence2.jpg']),
          status: 'pending',
          admin_notes: 'Requires investigation',
          resolved_by: null,
          resolved_at: null
        },
        {
          id: uuidv4(),
          reported_user_id: 'a135bdc0-34d6-404e-87a9-83a0dcf1d6a8',
          reporter_user_id: 'b71ca072-9f54-4c59-aaa8-9f1f67bbd5fc',
          report_type: 'safety_concern',
          report_reason_ar: 'مخاوف أمنية أثناء الرحلة',
          report_reason_en: 'Safety concerns during ride',
          evidence_files: JSON.stringify(['safety_evidence.mp4']),
          status: 'investigating',
          admin_notes: 'Under investigation by admin team',
          resolved_by: '2ebc1098-3387-4525-acb2-8fa0b3302c01', // admin user
          resolved_at: null
        }
      ];

      for (const report of sampleUserReports) {
        await db.executeQuery(`
          INSERT INTO user_reports (
            id, reported_user_id, reporter_user_id, report_type,
            report_reason_ar, report_reason_en, evidence_files,
            status, admin_notes, resolved_by, resolved_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          report.id,
          report.reported_user_id,
          report.reporter_user_id,
          report.report_type,
          report.report_reason_ar,
          report.report_reason_en,
          report.evidence_files,
          report.status,
          report.admin_notes,
          report.resolved_by,
          report.resolved_at
        ]);
      }

      console.log('✅ User management tables created successfully');
    } catch (error) {
      console.error('❌ Error creating user management tables:', error);
      throw error;
    }
  },

  down: async (db) => {
    try {
      console.log('Dropping user management tables...');
      
      await db.executeQuery('DROP TABLE IF EXISTS user_reports');
      await db.executeQuery('DROP TABLE IF EXISTS user_analytics');
      
      console.log('✅ User management tables dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping user management tables:', error);
      throw error;
    }
  }
}; 