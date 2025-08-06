const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');

module.exports = {
  up: async (connection) => {
    try {
      // Create email_templates table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS email_templates (
          id VARCHAR(36) PRIMARY KEY,
          template_key VARCHAR(100) UNIQUE NOT NULL,
          subject_ar VARCHAR(255),
          subject_en VARCHAR(255),
          body_ar TEXT,
          body_en TEXT,
          html_ar TEXT,
          html_en TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email_templates_key (template_key),
          INDEX idx_email_templates_active (is_active)
        )
      `);

      // Create sms_templates table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS sms_templates (
          id VARCHAR(36) PRIMARY KEY,
          template_key VARCHAR(100) UNIQUE NOT NULL,
          message_ar VARCHAR(160),
          message_en VARCHAR(160),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_sms_templates_key (template_key),
          INDEX idx_sms_templates_active (is_active)
        )
      `);

      // Insert sample email templates
      await connection.execute(`
        INSERT IGNORE INTO email_templates (id, template_key, subject_ar, subject_en, body_ar, body_en, html_ar, html_en) VALUES
        (?, 'welcome_email', 'مرحباً بك في تطبيق Mate', 'Welcome to Mate App', 
         'مرحباً {name}،\n\nشكراً لك على التسجيل في تطبيق Mate. نحن متحمسون لمساعدتك في رحلاتك.\n\nمع تحيات،\nفريق Mate',
         'Hello {name},\n\nThank you for registering with Mate app. We are excited to help you with your rides.\n\nBest regards,\nMate Team',
         '<h2>مرحباً {name}</h2><p>شكراً لك على التسجيل في تطبيق Mate. نحن متحمسون لمساعدتك في رحلاتك.</p><p>مع تحيات،<br>فريق Mate</p>',
         '<h2>Hello {name}</h2><p>Thank you for registering with Mate app. We are excited to help you with your rides.</p><p>Best regards,<br>Mate Team</p>'),
        
        (?, 'ride_confirmation', 'تأكيد رحلة جديدة', 'New Ride Confirmation',
         'مرحباً {name}،\n\nتم تأكيد رحلتك من {pickup} إلى {destination}.\n\nتفاصيل الرحلة:\n- التاريخ: {date}\n- الوقت: {time}\n- السعر: {price}\n\nمع تحيات،\nفريق Mate',
         'Hello {name},\n\nYour ride from {pickup} to {destination} has been confirmed.\n\nRide Details:\n- Date: {date}\n- Time: {time}\n- Price: {price}\n\nBest regards,\nMate Team',
         '<h2>مرحباً {name}</h2><p>تم تأكيد رحلتك من {pickup} إلى {destination}.</p><h3>تفاصيل الرحلة:</h3><ul><li>التاريخ: {date}</li><li>الوقت: {time}</li><li>السعر: {price}</li></ul><p>مع تحيات،<br>فريق Mate</p>',
         '<h2>Hello {name}</h2><p>Your ride from {pickup} to {destination} has been confirmed.</p><h3>Ride Details:</h3><ul><li>Date: {date}</li><li>Time: {time}</li><li>Price: {price}</li></ul><p>Best regards,<br>Mate Team</p>'),
        
        (?, 'password_reset', 'إعادة تعيين كلمة المرور', 'Password Reset',
         'مرحباً {name}،\n\nلقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.\n\nرمز التحقق: {code}\n\nإذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني.\n\nمع تحيات،\nفريق Mate',
         'Hello {name},\n\nWe received a request to reset your password.\n\nVerification code: {code}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nMate Team',
         '<h2>مرحباً {name}</h2><p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.</p><h3>رمز التحقق: {code}</h3><p>إذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني.</p><p>مع تحيات،<br>فريق Mate</p>',
         '<h2>Hello {name}</h2><p>We received a request to reset your password.</p><h3>Verification code: {code}</h3><p>If you did not request this, please ignore this email.</p><p>Best regards,<br>Mate Team</p>'),
        
        (?, 'payment_success', 'تم الدفع بنجاح', 'Payment Successful',
         'مرحباً {name}،\n\nتم إضافة {amount} إلى محفظتك بنجاح.\n\nرصيدك الحالي: {balance}\n\nمع تحيات،\nفريق Mate',
         'Hello {name},\n\n{amount} has been successfully added to your wallet.\n\nCurrent balance: {balance}\n\nBest regards,\nMate Team',
         '<h2>مرحباً {name}</h2><p>تم إضافة {amount} إلى محفظتك بنجاح.</p><h3>رصيدك الحالي: {balance}</h3><p>مع تحيات،<br>فريق Mate</p>',
         '<h2>Hello {name}</h2><p>{amount} has been successfully added to your wallet.</p><h3>Current balance: {balance}</h3><p>Best regards,<br>Mate Team</p>'),
        
        (?, 'ride_reminder', 'تذكير بالرحلة', 'Ride Reminder',
         'مرحباً {name}،\n\nتذكير برحلتك غداً من {pickup} إلى {destination}.\n\nالوقت: {time}\n\nيرجى التأكد من أنك جاهز في الوقت المحدد.\n\nمع تحيات،\nفريق Mate',
         'Hello {name},\n\nReminder for your ride tomorrow from {pickup} to {destination}.\n\nTime: {time}\n\nPlease ensure you are ready at the scheduled time.\n\nBest regards,\nMate Team',
         '<h2>مرحباً {name}</h2><p>تذكير برحلتك غداً من {pickup} إلى {destination}.</p><h3>الوقت: {time}</h3><p>يرجى التأكد من أنك جاهز في الوقت المحدد.</p><p>مع تحيات،<br>فريق Mate</p>',
         '<h2>Hello {name}</h2><p>Reminder for your ride tomorrow from {pickup} to {destination}.</p><h3>Time: {time}</h3><p>Please ensure you are ready at the scheduled time.</p><p>Best regards,<br>Mate Team</p>')
      `, [
        uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4()
      ]);

      // Insert sample SMS templates
      await connection.execute(`
        INSERT IGNORE INTO sms_templates (id, template_key, message_ar, message_en) VALUES
        (?, 'welcome_sms', 'مرحباً {name}! شكراً لك على التسجيل في Mate. استمتع برحلاتك!', 'Hello {name}! Thank you for registering with Mate. Enjoy your rides!'),
        
        (?, 'ride_confirmation_sms', 'تم تأكيد رحلتك من {pickup} إلى {destination}. الوقت: {time}. السعر: {price}', 'Your ride from {pickup} to {destination} is confirmed. Time: {time}. Price: {price}'),
        
        (?, 'verification_code_sms', 'رمز التحقق الخاص بك هو: {code}. صالح لمدة 10 دقائق.', 'Your verification code is: {code}. Valid for 10 minutes.'),
        
        (?, 'payment_success_sms', 'تم إضافة {amount} إلى محفظتك. الرصيد الحالي: {balance}', '{amount} has been added to your wallet. Current balance: {balance}'),
        
        (?, 'ride_reminder_sms', 'تذكير: رحلتك غداً من {pickup} إلى {destination} في الساعة {time}', 'Reminder: Your ride tomorrow from {pickup} to {destination} at {time}'),
        
        (?, 'driver_assigned_sms', 'تم تعيين السائق {driver_name} لرحلتك. رقم الهاتف: {driver_phone}', 'Driver {driver_name} has been assigned to your ride. Phone: {driver_phone}'),
        
        (?, 'ride_started_sms', 'بدأت رحلتك! السائق في طريقه إليك.', 'Your ride has started! The driver is on the way to you.'),
        
        (?, 'ride_completed_sms', 'انتهت رحلتك بنجاح! شكراً لك لاستخدام Mate.', 'Your ride has been completed successfully! Thank you for using Mate.')
      `, [
        uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4()
      ]);

      logger.info('Email and SMS template tables created successfully');

    } catch (error) {
      logger.error('Error creating email and SMS template tables:', error);
      throw error;
    }
  },

  down: async (connection) => {
    try {
      // Drop tables in reverse order
      await connection.execute('DROP TABLE IF EXISTS sms_templates');
      await connection.execute('DROP TABLE IF EXISTS email_templates');
      
      logger.info('Email and SMS template tables dropped successfully');

    } catch (error) {
      logger.error('Error dropping email and SMS template tables:', error);
      throw error;
    }
  }
}; 