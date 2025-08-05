const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (connection) => {
    try {
      // Create notification_templates table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS notification_templates (
          id VARCHAR(36) PRIMARY KEY,
          template_key VARCHAR(100) UNIQUE NOT NULL,
          title_ar VARCHAR(255),
          title_en VARCHAR(255),
          body_ar TEXT,
          body_en TEXT,
          notification_type ENUM('chat', 'booking', 'ride', 'payment', 'system', 'marketing') NOT NULL,
          category VARCHAR(50),
          priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Create user_notifications table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_notifications (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          template_id VARCHAR(36),
          title_ar VARCHAR(255),
          title_en VARCHAR(255),
          body_ar TEXT,
          body_en TEXT,
          notification_type ENUM('chat', 'booking', 'ride', 'payment', 'system', 'marketing') NOT NULL,
          data JSON,
          priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
          is_read BOOLEAN DEFAULT false,
          is_sent BOOLEAN DEFAULT false,
          sent_at TIMESTAMP,
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE SET NULL
        )
      `);

      // Create user_notification_preferences table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_notification_preferences (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL UNIQUE,
          email_enabled BOOLEAN DEFAULT true,
          sms_enabled BOOLEAN DEFAULT true,
          push_enabled BOOLEAN DEFAULT true,
          in_app_enabled BOOLEAN DEFAULT true,
          notification_types JSON,
          quiet_hours_start TIME DEFAULT '22:00:00',
          quiet_hours_end TIME DEFAULT '08:00:00',
          timezone VARCHAR(50) DEFAULT 'UTC',
          language_code VARCHAR(10) DEFAULT 'en',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (language_code) REFERENCES languages(code)
        )
      `);

      // Create fcm_tokens table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS fcm_tokens (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          token VARCHAR(500) NOT NULL,
          device_type ENUM('android', 'ios', 'web') NOT NULL,
          device_id VARCHAR(255),
          app_version VARCHAR(20),
          is_active BOOLEAN DEFAULT true,
          last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_token (user_id, token)
        )
      `);

      // Create notification_logs table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS notification_logs (
          id VARCHAR(36) PRIMARY KEY,
          notification_id VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          delivery_method ENUM('email', 'sms', 'push', 'in_app') NOT NULL,
          status ENUM('pending', 'sent', 'delivered', 'failed') NOT NULL,
          error_message TEXT,
          sent_at TIMESTAMP,
          delivered_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (notification_id) REFERENCES user_notifications(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Insert sample notification templates
      await connection.execute(`
        INSERT INTO notification_templates (id, template_key, title_ar, title_en, body_ar, body_en, notification_type, category, priority) VALUES
        (?, 'ride_booked', 'تم حجز رحلة جديدة', 'New Ride Booked', 'تم حجز رحلة من {pickup} إلى {destination}', 'Your ride from {pickup} to {destination} has been booked', 'ride', 'booking', 'normal'),
        (?, 'ride_started', 'بدأت الرحلة', 'Ride Started', 'بدأت رحلتك من {pickup}', 'Your ride from {pickup} has started', 'ride', 'status', 'normal'),
        (?, 'ride_completed', 'انتهت الرحلة', 'Ride Completed', 'انتهت رحلتك بنجاح', 'Your ride has been completed successfully', 'ride', 'status', 'normal'),
        (?, 'payment_success', 'تم الدفع بنجاح', 'Payment Successful', 'تم إضافة {amount} إلى محفظتك', '{amount} has been added to your wallet', 'payment', 'success', 'normal'),
        (?, 'chat_message', 'رسالة جديدة', 'New Message', 'رسالة جديدة من {sender}', 'New message from {sender}', 'chat', 'message', 'low'),
        (?, 'booking_cancelled', 'تم إلغاء الحجز', 'Booking Cancelled', 'تم إلغاء حجز رحلتك', 'Your ride booking has been cancelled', 'booking', 'cancellation', 'high'),
        (?, 'driver_assigned', 'تم تعيين سائق', 'Driver Assigned', 'تم تعيين السائق {driver_name} لرحلتك', 'Driver {driver_name} has been assigned to your ride', 'ride', 'assignment', 'normal'),
        (?, 'ride_reminder', 'تذكير بالرحلة', 'Ride Reminder', 'تذكير: رحلتك تبدأ خلال {time} دقائق', 'Reminder: Your ride starts in {time} minutes', 'ride', 'reminder', 'normal')
      `, [
        uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4()
      ]);

      console.log('✅ Notification tables created successfully');
    } catch (error) {
      console.error('❌ Error creating notification tables:', error);
      throw error;
    }
  },
};

  down: async (connection) => {
    try {
      // Drop tables in reverse order due to foreign key constraints
      await connection.execute('DROP TABLE IF EXISTS notification_logs');
      await connection.execute('DROP TABLE IF EXISTS fcm_tokens');
      await connection.execute('DROP TABLE IF EXISTS user_notification_preferences');
      await connection.execute('DROP TABLE IF EXISTS user_notifications');
      await connection.execute('DROP TABLE IF EXISTS notification_templates');

      console.log('✅ Notification tables dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping notification tables:', error);
      throw error;
    }
  } 