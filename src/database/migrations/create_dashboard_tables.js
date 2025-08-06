const mysql = require('mysql2/promise');
const config = require('../../config');
const { v4: uuidv4 } = require('uuid');

async function createDashboardTables() {
    let connection;
    try {
        console.log('Creating admin dashboard tables...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: config.database.host,
            user: config.database.user,
            password: config.database.password,
            database: config.database.database,
            port: config.database.port
        });

        // Drop existing tables if they exist (for clean recreation)
        await connection.execute('DROP TABLE IF EXISTS admin_dashboard_layouts');
        await connection.execute('DROP TABLE IF EXISTS admin_dashboard_widgets');

        // Create admin_dashboard_widgets table
        await connection.execute(`
            CREATE TABLE admin_dashboard_widgets (
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
            CREATE TABLE admin_dashboard_layouts (
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

        // Insert sample dashboard widgets with localization
        const widgets = [
            {
                id: uuidv4(),
                widget_key: 'total_users',
                title_ar: 'إجمالي المستخدمين',
                title_en: 'Total Users',
                description_ar: 'إجمالي عدد المستخدمين المسجلين',
                description_en: 'Total number of registered users',
                widget_type: 'metric',
                config: JSON.stringify({
                    color: '#4CAF50',
                    icon: 'users',
                    format: 'number'
                }),
                position: 1
            },
            {
                id: uuidv4(),
                widget_key: 'active_rides',
                title_ar: 'الرحلات النشطة',
                title_en: 'Active Rides',
                description_ar: 'عدد الرحلات النشطة حالياً',
                description_en: 'Number of currently active rides',
                widget_type: 'metric',
                config: JSON.stringify({
                    color: '#FD7A00',
                    icon: 'car',
                    format: 'number'
                }),
                position: 2
            },
            {
                id: uuidv4(),
                widget_key: 'revenue_today',
                title_ar: 'الإيرادات اليوم',
                title_en: 'Today\'s Revenue',
                description_ar: 'إجمالي الإيرادات لهذا اليوم',
                description_en: 'Total revenue for today',
                widget_type: 'metric',
                config: JSON.stringify({
                    color: '#00BCD4',
                    icon: 'dollar-sign',
                    format: 'currency'
                }),
                position: 3
            },
            {
                id: uuidv4(),
                widget_key: 'total_revenue',
                title_ar: 'إجمالي الإيرادات',
                title_en: 'Total Revenue',
                description_ar: 'إجمالي الإيرادات منذ البداية',
                description_en: 'Total revenue since inception',
                widget_type: 'metric',
                config: JSON.stringify({
                    color: '#9C27B0',
                    icon: 'trending-up',
                    format: 'currency'
                }),
                position: 4
            },
            {
                id: uuidv4(),
                widget_key: 'recent_bookings',
                title_ar: 'الحجوزات الحديثة',
                title_en: 'Recent Bookings',
                description_ar: 'آخر الحجوزات المضافة',
                description_en: 'Latest bookings added',
                widget_type: 'table',
                config: JSON.stringify({
                    columns: ['id', 'user', 'destination', 'status', 'created_at'],
                    limit: 10
                }),
                position: 5
            },
            {
                id: uuidv4(),
                widget_key: 'revenue_chart',
                title_ar: 'رسم بياني للإيرادات',
                title_en: 'Revenue Chart',
                description_ar: 'رسم بياني للإيرادات خلال الأسبوع الماضي',
                description_en: 'Revenue chart for the past week',
                widget_type: 'chart',
                config: JSON.stringify({
                    type: 'line',
                    dataKey: 'revenue',
                    xAxis: 'date',
                    yAxis: 'amount'
                }),
                position: 6
            },
            {
                id: uuidv4(),
                widget_key: 'user_growth',
                title_ar: 'نمو المستخدمين',
                title_en: 'User Growth',
                description_ar: 'نمو عدد المستخدمين خلال الشهر الماضي',
                description_en: 'User growth over the past month',
                widget_type: 'chart',
                config: JSON.stringify({
                    type: 'bar',
                    dataKey: 'users',
                    xAxis: 'date',
                    yAxis: 'count'
                }),
                position: 7
            },
            {
                id: uuidv4(),
                widget_key: 'recent_activity',
                title_ar: 'النشاط الأخير',
                title_en: 'Recent Activity',
                description_ar: 'آخر الأنشطة في النظام',
                description_en: 'Latest activities in the system',
                widget_type: 'list',
                config: JSON.stringify({
                    limit: 15,
                    showAvatar: true,
                    showTime: true
                }),
                position: 8
            }
        ];

        // Insert widgets
        for (const widget of widgets) {
            await connection.execute(`
                INSERT INTO admin_dashboard_widgets (
                    id, widget_key, title_ar, title_en, description_ar, description_en,
                    widget_type, config, position, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                widget.id,
                widget.widget_key,
                widget.title_ar,
                widget.title_en,
                widget.description_ar,
                widget.description_en,
                widget.widget_type,
                widget.config,
                widget.position,
                true
            ]);
        }

        // Get the first admin user to create default layout
        const [adminUsers] = await connection.execute('SELECT id FROM admin_users LIMIT 1');
        
        if (adminUsers.length > 0) {
            const adminUserId = adminUsers[0].id;
            
            // Create default dashboard layout
            const defaultLayout = {
                id: uuidv4(),
                admin_user_id: adminUserId,
                layout_name: 'Default Layout',
                layout_config: JSON.stringify({
                    widgets: [
                        { widget_key: 'total_users', position: { x: 0, y: 0, w: 3, h: 2 } },
                        { widget_key: 'active_rides', position: { x: 3, y: 0, w: 3, h: 2 } },
                        { widget_key: 'revenue_today', position: { x: 6, y: 0, w: 3, h: 2 } },
                        { widget_key: 'total_revenue', position: { x: 9, y: 0, w: 3, h: 2 } },
                        { widget_key: 'revenue_chart', position: { x: 0, y: 2, w: 6, h: 4 } },
                        { widget_key: 'user_growth', position: { x: 6, y: 2, w: 6, h: 4 } },
                        { widget_key: 'recent_bookings', position: { x: 0, y: 6, w: 8, h: 4 } },
                        { widget_key: 'recent_activity', position: { x: 8, y: 6, w: 4, h: 4 } }
                    ],
                    grid: {
                        cols: 12,
                        rowHeight: 100,
                        margin: [16, 16]
                    }
                }),
                is_default: true
            };

            await connection.execute(`
                INSERT INTO admin_dashboard_layouts (
                    id, admin_user_id, layout_name, layout_config, is_default
                ) VALUES (?, ?, ?, ?, ?)
            `, [
                defaultLayout.id,
                defaultLayout.admin_user_id,
                defaultLayout.layout_name,
                defaultLayout.layout_config,
                defaultLayout.is_default
            ]);
        }

        console.log('✅ Admin dashboard tables created successfully');
        console.log(`✅ Inserted ${widgets.length} dashboard widgets`);
        console.log('✅ Created default dashboard layout');

    } catch (error) {
        console.error('❌ Error creating dashboard tables:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the migration if this file is executed directly
if (require.main === module) {
    createDashboardTables()
        .then(() => {
            console.log('🎉 Dashboard tables migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Dashboard tables migration failed:', error);
            process.exit(1);
        });
}

module.exports = createDashboardTables; 