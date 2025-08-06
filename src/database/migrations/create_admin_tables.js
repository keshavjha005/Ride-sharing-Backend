const mysql = require('mysql2/promise');
const config = require('../../config');

async function createAdminTables() {
    let connection;
    try {
        console.log('Creating admin tables...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: config.database.host,
            user: config.database.user,
            password: config.database.password,
            database: config.database.database,
            port: config.database.port
        });

        // Create admin_users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id VARCHAR(36) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                role ENUM('super_admin', 'admin', 'moderator', 'support') DEFAULT 'admin',
                permissions JSON,
                language_code VARCHAR(10) DEFAULT 'en',
                timezone VARCHAR(50) DEFAULT 'UTC',
                is_active BOOLEAN DEFAULT true,
                last_login_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (language_code) REFERENCES languages(code) ON DELETE SET NULL
            )
        `);

        // Create admin_sessions table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admin_sessions (
                id VARCHAR(36) PRIMARY KEY,
                admin_user_id VARCHAR(36) NOT NULL,
                session_token VARCHAR(255) UNIQUE NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
            )
        `);

        // Create admin_activity_logs table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admin_activity_logs (
                id VARCHAR(36) PRIMARY KEY,
                admin_user_id VARCHAR(36) NOT NULL,
                action VARCHAR(100) NOT NULL,
                resource_type VARCHAR(50),
                resource_id VARCHAR(36),
                details JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
            )
        `);

        // Create admin_dashboard_widgets table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admin_dashboard_widgets (
                id VARCHAR(36) PRIMARY KEY,
                widget_key VARCHAR(100) UNIQUE NOT NULL,
                title_ar VARCHAR(255),
                title_en VARCHAR(255),
                description_ar TEXT,
                description_en TEXT,
                widget_type ENUM('chart', 'metric', 'table', 'list') NOT NULL,
                config JSON,
                position INT DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create admin_dashboard_layouts table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admin_dashboard_layouts (
                id VARCHAR(36) PRIMARY KEY,
                admin_user_id VARCHAR(36) NOT NULL,
                layout_name VARCHAR(100) NOT NULL,
                layout_config JSON,
                is_default BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
            )
        `);

        // Create admin_localized_content table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admin_localized_content (
                id VARCHAR(36) PRIMARY KEY,
                content_key VARCHAR(100) UNIQUE NOT NULL,
                content_ar TEXT,
                content_en TEXT,
                content_type ENUM('ui_text', 'notification', 'email', 'sms', 'help') NOT NULL,
                category VARCHAR(50),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create admin_language_settings table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admin_language_settings (
                id VARCHAR(36) PRIMARY KEY,
                language_code VARCHAR(10) NOT NULL,
                is_enabled BOOLEAN DEFAULT true,
                is_default BOOLEAN DEFAULT false,
                display_order INT DEFAULT 0,
                admin_interface_enabled BOOLEAN DEFAULT true,
                mobile_app_enabled BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (language_code) REFERENCES languages(code) ON DELETE CASCADE
            )
        `);

        // Create system_settings table (enhanced)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id VARCHAR(36) PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT,
                setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL,
                category VARCHAR(50),
                title_ar VARCHAR(255),
                title_en VARCHAR(255),
                description_ar TEXT,
                description_en TEXT,
                is_public BOOLEAN DEFAULT false,
                is_editable BOOLEAN DEFAULT true,
                validation_rules JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create feature_flags table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS feature_flags (
                id VARCHAR(36) PRIMARY KEY,
                feature_key VARCHAR(100) UNIQUE NOT NULL,
                feature_name_ar VARCHAR(255),
                feature_name_en VARCHAR(255),
                description_ar TEXT,
                description_en TEXT,
                is_enabled BOOLEAN DEFAULT false,
                enabled_for_ios BOOLEAN DEFAULT false,
                enabled_for_android BOOLEAN DEFAULT false,
                enabled_for_web BOOLEAN DEFAULT false,
                rollout_percentage INT DEFAULT 0,
                target_audience JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create system_health_logs table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS system_health_logs (
                id VARCHAR(36) PRIMARY KEY,
                service_name VARCHAR(100) NOT NULL,
                status ENUM('healthy', 'warning', 'error', 'critical') NOT NULL,
                message_ar VARCHAR(255),
                message_en VARCHAR(255),
                details JSON,
                response_time_ms INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create scheduled_reports table
        await connection.execute(`
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
            )
        `);

        console.log('Admin tables created successfully!');

        // Insert default admin user
        const bcrypt = require('bcrypt');
        const { v4: uuidv4 } = require('uuid');
        
        const adminId = uuidv4();
        const passwordHash = await bcrypt.hash('admin123', 12);
        
        await connection.execute(`
            INSERT IGNORE INTO admin_users (
                id, email, password_hash, first_name, last_name, role, 
                permissions, language_code, timezone, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            adminId,
            'admin@mate.com',
            passwordHash,
            'Admin',
            'User',
            'super_admin',
            JSON.stringify({
                users: ['read', 'write', 'delete'],
                rides: ['read', 'write', 'delete'],
                analytics: ['read'],
                settings: ['read', 'write'],
                reports: ['read', 'write'],
                localization: ['read', 'write']
            }),
            'en',
            'UTC',
            true
        ]);

        // Insert sample admin localized content
        await connection.execute(`
            INSERT IGNORE INTO admin_localized_content (content_key, content_ar, content_en, content_type, category) VALUES
            ('dashboard_title', 'لوحة التحكم', 'Dashboard', 'ui_text', 'dashboard'),
            ('users_management', 'إدارة المستخدمين', 'User Management', 'ui_text', 'user_management'),
            ('total_revenue', 'إجمالي الإيرادات', 'Total Revenue', 'ui_text', 'analytics'),
            ('active_rides', 'الرحلات النشطة', 'Active Rides', 'ui_text', 'analytics'),
            ('user_verified', 'تم التحقق من المستخدم', 'User Verified', 'notification', 'user_management'),
            ('ride_cancelled', 'تم إلغاء الرحلة', 'Ride Cancelled', 'notification', 'ride_management'),
            ('payment_processed', 'تم معالجة الدفع', 'Payment Processed', 'notification', 'payment'),
            ('welcome_message', 'مرحباً بك في لوحة التحكم', 'Welcome to the Admin Panel', 'ui_text', 'dashboard')
        `);

        // Insert sample system settings
        await connection.execute(`
            INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_type, category, title_ar, title_en, description_ar, description_en) VALUES
            ('app_name', 'Mate', 'string', 'app', 'اسم التطبيق', 'App Name', 'اسم التطبيق المعروض للمستخدمين', 'Application name displayed to users'),
            ('default_language', 'en', 'string', 'localization', 'اللغة الافتراضية', 'Default Language', 'اللغة الافتراضية للتطبيق', 'Default application language'),
            ('default_currency', 'USD', 'string', 'payment', 'العملة الافتراضية', 'Default Currency', 'العملة الافتراضية للمعاملات', 'Default currency for transactions'),
            ('max_ride_distance', '100', 'number', 'ride', 'أقصى مسافة للرحلة', 'Maximum Ride Distance', 'أقصى مسافة مسموحة للرحلة بالكيلومترات', 'Maximum allowed ride distance in kilometers'),
            ('enable_push_notifications', 'true', 'boolean', 'notification', 'تفعيل الإشعارات', 'Enable Push Notifications', 'تفعيل إشعارات الدفع للمستخدمين', 'Enable push notifications for users'),
            ('maintenance_mode', 'false', 'boolean', 'app', 'وضع الصيانة', 'Maintenance Mode', 'تفعيل وضع الصيانة للتطبيق', 'Enable maintenance mode for the application')
        `);

        console.log('Default admin user and sample data created successfully!');

    } catch (error) {
        console.error('Error creating admin tables:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

module.exports = createAdminTables; 