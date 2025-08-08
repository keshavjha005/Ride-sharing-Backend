const { v4: uuidv4 } = require('uuid');

async function up({ execute }) {
  const coreSettings = [
    // Application Settings
    {
      id: uuidv4(),
      setting_key: 'app.maintenance_mode',
      setting_value: 'false',
      setting_type: 'boolean',
      category: 'application',
      title_en: 'Maintenance Mode',
      title_ar: 'وضع الصيانة',
      description_en: 'Enable maintenance mode to show maintenance page to users',
      description_ar: 'تمكين وضع الصيانة لإظهار صفحة الصيانة للمستخدمين',
      is_public: true,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'boolean',
        requires_super_admin: true
      })
    },
    {
      id: uuidv4(),
      setting_key: 'app.debug_mode',
      setting_value: 'false',
      setting_type: 'boolean',
      category: 'application',
      title_en: 'Debug Mode',
      title_ar: 'وضع التصحيح',
      description_en: 'Enable detailed error messages and logging',
      description_ar: 'تمكين رسائل الخطأ المفصلة والتسجيل',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'boolean',
        requires_super_admin: true
      })
    },
    {
      id: uuidv4(),
      setting_key: 'app.default_timezone',
      setting_value: 'UTC',
      setting_type: 'string',
      category: 'application',
      title_en: 'Default Timezone',
      title_ar: 'المنطقة الزمنية الافتراضية',
      description_en: 'System default timezone for date/time operations',
      description_ar: 'المنطقة الزمنية الافتراضية للنظام لعمليات التاريخ/الوقت',
      is_public: true,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'string',
        pattern: '^[A-Za-z_/]+$'
      })
    },

    // Performance Settings
    {
      id: uuidv4(),
      setting_key: 'performance.api_rate_limit',
      setting_value: '100',
      setting_type: 'number',
      category: 'performance',
      title_en: 'API Rate Limit',
      title_ar: 'حد معدل API',
      description_en: 'Maximum API requests per minute per user',
      description_ar: 'الحد الأقصى لطلبات API في الدقيقة لكل مستخدم',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'number',
        min: 10,
        max: 1000
      })
    },
    {
      id: uuidv4(),
      setting_key: 'performance.cache_ttl',
      setting_value: '3600',
      setting_type: 'number',
      category: 'performance',
      title_en: 'Cache TTL',
      title_ar: 'مدة صلاحية ذاكرة التخزين المؤقت',
      description_en: 'Default cache time-to-live in seconds',
      description_ar: 'الوقت الافتراضي لصلاحية ذاكرة التخزين المؤقت بالثواني',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'number',
        min: 60,
        max: 86400
      })
    },

    // Security Settings
    {
      id: uuidv4(),
      setting_key: 'security.session_timeout',
      setting_value: '3600',
      setting_type: 'number',
      category: 'security',
      title_en: 'Session Timeout',
      title_ar: 'مهلة الجلسة',
      description_en: 'Session timeout in seconds',
      description_ar: 'مهلة الجلسة بالثواني',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'number',
        min: 300,
        max: 86400
      })
    },
    {
      id: uuidv4(),
      setting_key: 'security.password_expiry_days',
      setting_value: '90',
      setting_type: 'number',
      category: 'security',
      title_en: 'Password Expiry Days',
      title_ar: 'أيام انتهاء صلاحية كلمة المرور',
      description_en: 'Number of days before password expires',
      description_ar: 'عدد الأيام قبل انتهاء صلاحية كلمة المرور',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'number',
        min: 30,
        max: 365
      })
    },

    // Maintenance Settings
    {
      id: uuidv4(),
      setting_key: 'maintenance.backup_retention_days',
      setting_value: '30',
      setting_type: 'number',
      category: 'maintenance',
      title_en: 'Backup Retention Days',
      title_ar: 'أيام الاحتفاظ بالنسخ الاحتياطية',
      description_en: 'Number of days to retain system backups',
      description_ar: 'عدد الأيام للاحتفاظ بالنسخ الاحتياطية للنظام',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'number',
        min: 7,
        max: 365,
        requires_super_admin: true
      })
    },
    {
      id: uuidv4(),
      setting_key: 'maintenance.log_retention_days',
      setting_value: '90',
      setting_type: 'number',
      category: 'maintenance',
      title_en: 'Log Retention Days',
      title_ar: 'أيام الاحتفاظ بالسجلات',
      description_en: 'Number of days to retain system logs',
      description_ar: 'عدد الأيام للاحتفاظ بسجلات النظام',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'number',
        min: 30,
        max: 365,
        requires_super_admin: true
      })
    },

    // Integration Settings
    {
      id: uuidv4(),
      setting_key: 'integration.webhook_timeout',
      setting_value: '30',
      setting_type: 'number',
      category: 'integration',
      title_en: 'Webhook Timeout',
      title_ar: 'مهلة Webhook',
      description_en: 'Webhook request timeout in seconds',
      description_ar: 'مهلة طلب Webhook بالثواني',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'number',
        min: 5,
        max: 60
      })
    },
    {
      id: uuidv4(),
      setting_key: 'integration.retry_attempts',
      setting_value: '3',
      setting_type: 'number',
      category: 'integration',
      title_en: 'Integration Retry Attempts',
      title_ar: 'محاولات إعادة المحاولة للتكامل',
      description_en: 'Number of retry attempts for failed integration requests',
      description_ar: 'عدد محاولات إعادة المحاولة لطلبات التكامل الفاشلة',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'number',
        min: 1,
        max: 10
      })
    },

    // Additional Performance Settings
    {
      id: uuidv4(),
      setting_key: 'performance.max_file_size',
      setting_value: '10485760',
      setting_type: 'number',
      category: 'performance',
      title_en: 'Maximum File Upload Size',
      title_ar: 'الحد الأقصى لحجم تحميل الملف',
      description_en: 'Maximum file upload size in bytes (10MB default)',
      description_ar: 'الحد الأقصى لحجم تحميل الملف بالبايت (10 ميجابايت افتراضي)',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'number',
        min: 1048576,
        max: 104857600,
        requires_confirmation: true
      })
    },
    {
      id: uuidv4(),
      setting_key: 'performance.session_cleanup_interval',
      setting_value: '3600',
      setting_type: 'number',
      category: 'performance',
      title_en: 'Session Cleanup Interval',
      title_ar: 'فاصل تنظيف الجلسة',
      description_en: 'Interval in seconds for cleaning up expired sessions',
      description_ar: 'الفاصل الزمني بالثواني لتنظيف الجلسات المنتهية الصلاحية',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'number',
        min: 300,
        max: 86400
      })
    },

    // Additional Security Settings
    {
      id: uuidv4(),
      setting_key: 'security.max_login_attempts',
      setting_value: '5',
      setting_type: 'number',
      category: 'security',
      title_en: 'Maximum Login Attempts',
      title_ar: 'الحد الأقصى لمحاولات تسجيل الدخول',
      description_en: 'Maximum failed login attempts before account lockout',
      description_ar: 'الحد الأقصى لمحاولات تسجيل الدخول الفاشلة قبل قفل الحساب',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'number',
        min: 3,
        max: 10
      })
    },
    {
      id: uuidv4(),
      setting_key: 'security.account_lockout_duration',
      setting_value: '1800',
      setting_type: 'number',
      category: 'security',
      title_en: 'Account Lockout Duration',
      title_ar: 'مدة قفل الحساب',
      description_en: 'Account lockout duration in seconds after max login attempts',
      description_ar: 'مدة قفل الحساب بالثواني بعد الحد الأقصى لمحاولات تسجيل الدخول',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'number',
        min: 300,
        max: 86400
      })
    },

    // Additional Maintenance Settings
    {
      id: uuidv4(),
      setting_key: 'maintenance.auto_backup_enabled',
      setting_value: 'true',
      setting_type: 'boolean',
      category: 'maintenance',
      title_en: 'Auto Backup Enabled',
      title_ar: 'تمكين النسخ الاحتياطي التلقائي',
      description_en: 'Enable automatic database backups',
      description_ar: 'تمكين النسخ الاحتياطي التلقائي لقاعدة البيانات',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'boolean',
        requires_super_admin: true
      })
    },
    {
      id: uuidv4(),
      setting_key: 'maintenance.backup_schedule',
      setting_value: '0 2 * * *',
      setting_type: 'string',
      category: 'maintenance',
      title_en: 'Backup Schedule (Cron)',
      title_ar: 'جدول النسخ الاحتياطي (Cron)',
      description_en: 'Cron expression for backup schedule (default: daily at 2 AM)',
      description_ar: 'تعبير Cron لجدول النسخ الاحتياطي (افتراضي: يوميًا في الساعة 2 صباحًا)',
      is_public: false,
      is_editable: true,
      validation_rules: JSON.stringify({
        type: 'string',
        pattern: '^[0-9*,\\-/]+ [0-9*,\\-/]+ [0-9*,\\-/]+ [0-9*,\\-/]+ [0-9*,\\-/]+$',
        requires_super_admin: true,
        requires_confirmation: true
      })
    }
  ];

  for (const setting of coreSettings) {
    await execute(
      `INSERT INTO system_settings (
        id, setting_key, setting_value, setting_type, category,
        title_en, title_ar, description_en, description_ar,
        is_public, is_editable, validation_rules
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        setting_type = VALUES(setting_type),
        category = VALUES(category),
        title_en = VALUES(title_en),
        title_ar = VALUES(title_ar),
        description_en = VALUES(description_en),
        description_ar = VALUES(description_ar),
        is_public = VALUES(is_public),
        is_editable = VALUES(is_editable),
        validation_rules = VALUES(validation_rules)`,
      [
        setting.id,
        setting.setting_key,
        setting.setting_value,
        setting.setting_type,
        setting.category,
        setting.title_en,
        setting.title_ar,
        setting.description_en,
        setting.description_ar,
        setting.is_public,
        setting.is_editable,
        setting.validation_rules
      ]
    );
  }
}

async function down({ execute }) {
  const settingKeys = [
    'app.maintenance_mode',
    'app.debug_mode',
    'app.default_timezone',
    'performance.api_rate_limit',
    'performance.cache_ttl',
    'performance.max_file_size',
    'performance.session_cleanup_interval',
    'security.session_timeout',
    'security.password_expiry_days',
    'security.max_login_attempts',
    'security.account_lockout_duration',
    'maintenance.backup_retention_days',
    'maintenance.log_retention_days',
    'maintenance.auto_backup_enabled',
    'maintenance.backup_schedule',
    'integration.webhook_timeout',
    'integration.retry_attempts'
  ];

  for (const key of settingKeys) {
    await execute('DELETE FROM system_settings WHERE setting_key = ?', [key]);
  }
}

module.exports = { up, down };