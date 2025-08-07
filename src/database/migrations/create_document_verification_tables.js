const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../../config/database');

module.exports = {
  up: async () => {
    try {
      console.log('Creating document verification tables...');

      // 1. Required Documents Configuration Table (for admin to configure)
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS required_documents (
          id VARCHAR(36) PRIMARY KEY,
          document_type ENUM('national_id', 'passport', 'driving_license', 'vehicle_registration', 'insurance', 'other') NOT NULL,
          document_name_ar VARCHAR(255) NOT NULL,
          document_name_en VARCHAR(255) NOT NULL,
          description_ar TEXT,
          description_en TEXT,
          is_required BOOLEAN DEFAULT true,
          is_active BOOLEAN DEFAULT true,
          file_types JSON,
          max_file_size INT DEFAULT 5242880,
          max_files_per_document INT DEFAULT 3,
          created_by VARCHAR(36),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL
        )
      `);

      // 2. User Document Uploads Table
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS user_documents (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          document_type_id VARCHAR(36) NOT NULL,
          file_url VARCHAR(500) NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_size INT NOT NULL,
          file_type VARCHAR(100) NOT NULL,
          upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          admin_notes TEXT,
          reviewed_by VARCHAR(36),
          reviewed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (document_type_id) REFERENCES required_documents(id) ON DELETE CASCADE,
          FOREIGN KEY (reviewed_by) REFERENCES admin_users(id) ON DELETE SET NULL
        )
      `);

      // 3. User Verification Status Table (to track overall verification)
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS user_verification_status (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL UNIQUE,
          overall_status ENUM('not_verified', 'pending', 'verified', 'rejected') DEFAULT 'not_verified',
          documents_submitted INT DEFAULT 0,
          documents_approved INT DEFAULT 0,
          documents_rejected INT DEFAULT 0,
          last_submission_date TIMESTAMP,
          verification_date TIMESTAMP,
          verified_by VARCHAR(36),
          rejection_reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (verified_by) REFERENCES admin_users(id) ON DELETE SET NULL
        )
      `);

      // Insert default required documents
      const defaultDocuments = [
        {
          id: uuidv4(),
          document_type: 'national_id',
          document_name_ar: 'الهوية الوطنية',
          document_name_en: 'National ID',
          description_ar: 'صورة واضحة من الهوية الوطنية',
          description_en: 'Clear photo of national ID card',
          is_required: true,
          file_types: JSON.stringify(['image/jpeg', 'image/png', 'application/pdf']),
          max_file_size: 5242880,
          max_files_per_document: 2
        },
        {
          id: uuidv4(),
          document_type: 'driving_license',
          document_name_ar: 'رخصة القيادة',
          document_name_en: 'Driving License',
          description_ar: 'صورة واضحة من رخصة القيادة',
          description_en: 'Clear photo of driving license',
          is_required: true,
          file_types: JSON.stringify(['image/jpeg', 'image/png', 'application/pdf']),
          max_file_size: 5242880,
          max_files_per_document: 2
        },
        {
          id: uuidv4(),
          document_type: 'vehicle_registration',
          document_name_ar: 'تسجيل المركبة',
          document_name_en: 'Vehicle Registration',
          description_ar: 'صورة من وثيقة تسجيل المركبة',
          description_en: 'Photo of vehicle registration document',
          is_required: true,
          file_types: JSON.stringify(['image/jpeg', 'image/png', 'application/pdf']),
          max_file_size: 5242880,
          max_files_per_document: 2
        },
        {
          id: uuidv4(),
          document_type: 'insurance',
          document_name_ar: 'وثيقة التأمين',
          document_name_en: 'Insurance Document',
          description_ar: 'صورة من وثيقة التأمين على المركبة',
          description_en: 'Photo of vehicle insurance document',
          is_required: true,
          file_types: JSON.stringify(['image/jpeg', 'image/png', 'application/pdf']),
          max_file_size: 5242880,
          max_files_per_document: 2
        }
      ];

      for (const doc of defaultDocuments) {
        await executeQuery(`
          INSERT INTO required_documents (
            id, document_type, document_name_ar, document_name_en, description_ar, description_en,
            is_required, file_types, max_file_size, max_files_per_document
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          doc.id,
          doc.document_type,
          doc.document_name_ar,
          doc.document_name_en,
          doc.description_ar,
          doc.description_en,
          doc.is_required,
          doc.file_types,
          doc.max_file_size,
          doc.max_files_per_document
        ]);
      }

      console.log('✅ Document verification tables created successfully');
    } catch (error) {
      console.error('❌ Error creating document verification tables:', error);
      throw error;
    }
  },

  down: async () => {
    try {
      console.log('Dropping document verification tables...');
      
      await executeQuery('DROP TABLE IF EXISTS user_documents');
      await executeQuery('DROP TABLE IF EXISTS user_verification_status');
      await executeQuery('DROP TABLE IF EXISTS required_documents');
      
      console.log('✅ Document verification tables dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping document verification tables:', error);
      throw error;
    }
  }
}; 