async function up({ execute }) {
  // Create system_logs table
  await execute(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id VARCHAR(36) PRIMARY KEY,
      level ENUM('error', 'warn', 'info', 'debug') NOT NULL,
      service VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_level (level),
      INDEX idx_service (service),
      INDEX idx_created_at (created_at)
    )
  `);

  // Create admin_activity_logs table for audit logging
  await execute(`
    CREATE TABLE IF NOT EXISTS admin_activity_logs (
      id VARCHAR(36) PRIMARY KEY,
      admin_id VARCHAR(36) NOT NULL,
      action VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50),
      entity_id VARCHAR(36),
      changes JSON,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_admin_id (admin_id),
      INDEX idx_action (action),
      INDEX idx_entity_type (entity_type),
      INDEX idx_created_at (created_at),
      FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
    )
  `);

  // Create system_health_checks table for storing health check history
  await execute(`
    CREATE TABLE IF NOT EXISTS system_health_checks (
      id VARCHAR(36) PRIMARY KEY,
      check_type VARCHAR(50) NOT NULL,
      status ENUM('healthy', 'warning', 'error', 'critical') NOT NULL,
      response_time INT,
      details JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_check_type (check_type),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    )
  `);

  // Create system_metrics table for storing historical metrics
  await execute(`
    CREATE TABLE IF NOT EXISTS system_metrics (
      id VARCHAR(36) PRIMARY KEY,
      metric_type VARCHAR(50) NOT NULL,
      metric_name VARCHAR(100) NOT NULL,
      metric_value DECIMAL(10,4) NOT NULL,
      unit VARCHAR(20),
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_metric_type (metric_type),
      INDEX idx_metric_name (metric_name),
      INDEX idx_created_at (created_at)
    )
  `);
}

async function down({ execute }) {
  await execute('DROP TABLE IF EXISTS system_metrics');
  await execute('DROP TABLE IF EXISTS system_health_checks');
  await execute('DROP TABLE IF EXISTS admin_activity_logs');
  await execute('DROP TABLE IF EXISTS system_logs');
}

module.exports = { up, down };
