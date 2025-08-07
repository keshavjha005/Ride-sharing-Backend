const mysql = require('mysql2/promise');
const config = require('../../config/database');

async function createScheduledReportsTable() {
  const connection = await mysql.createConnection(config);
  
  try {
    console.log('Creating scheduled_reports table...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS scheduled_reports (
        id VARCHAR(36) PRIMARY KEY,
        report_name_ar VARCHAR(255),
        report_name_en VARCHAR(255),
        report_type ENUM('user_analytics', 'ride_analytics', 'financial_analytics', 'system_analytics') NOT NULL,
        schedule_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
        schedule_config JSON,
        recipients JSON,
        report_format ENUM('pdf', 'excel', 'csv') DEFAULT 'pdf',
        is_active BOOLEAN DEFAULT true,
        last_generated_at TIMESTAMP NULL,
        next_generation_at TIMESTAMP NULL,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ scheduled_reports table created successfully');
    
    // Insert sample scheduled reports
    const sampleReports = [
      {
        id: 'sr-001',
        report_name_ar: 'تقرير المستخدمين الأسبوعي',
        report_name_en: 'Weekly User Report',
        report_type: 'user_analytics',
        schedule_type: 'weekly',
        schedule_config: JSON.stringify({ dayOfWeek: 1, time: '09:00' }),
        recipients: JSON.stringify(['admin@mate.com']),
        report_format: 'pdf',
        is_active: true,
        created_by: 'admin-001'
      },
      {
        id: 'sr-002',
        report_name_ar: 'تقرير الرحلات اليومي',
        report_name_en: 'Daily Ride Report',
        report_type: 'ride_analytics',
        schedule_type: 'daily',
        schedule_config: JSON.stringify({ time: '18:00' }),
        recipients: JSON.stringify(['operations@mate.com']),
        report_format: 'excel',
        is_active: true,
        created_by: 'admin-001'
      },
      {
        id: 'sr-003',
        report_name_ar: 'التقرير المالي الشهري',
        report_name_en: 'Monthly Financial Report',
        report_type: 'financial_analytics',
        schedule_type: 'monthly',
        schedule_config: JSON.stringify({ dayOfMonth: 1, time: '10:00' }),
        recipients: JSON.stringify(['finance@mate.com', 'admin@mate.com']),
        report_format: 'pdf',
        is_active: true,
        created_by: 'admin-001'
      }
    ];
    
    for (const report of sampleReports) {
      const insertQuery = `
        INSERT INTO scheduled_reports (
          id, report_name_ar, report_name_en, report_type, schedule_type,
          schedule_config, recipients, report_format, is_active, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          report_name_ar = VALUES(report_name_ar),
          report_name_en = VALUES(report_name_en),
          report_type = VALUES(report_type),
          schedule_type = VALUES(schedule_type),
          schedule_config = VALUES(schedule_config),
          recipients = VALUES(recipients),
          report_format = VALUES(report_format),
          is_active = VALUES(is_active)
      `;
      
      await connection.execute(insertQuery, [
        report.id,
        report.report_name_ar,
        report.report_name_en,
        report.report_type,
        report.schedule_type,
        report.schedule_config,
        report.recipients,
        report.report_format,
        report.is_active,
        report.created_by
      ]);
    }
    
    console.log('✅ Sample scheduled reports inserted successfully');
    
  } catch (error) {
    console.error('❌ Error creating scheduled_reports table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = createScheduledReportsTable;

// Run migration if called directly
if (require.main === module) {
  createScheduledReportsTable()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
} 