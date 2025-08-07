const request = require('supertest');
const app = require('../src/app');
const AdminUser = require('../src/models/AdminUser');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

describe('Admin Management API', () => {
  let superAdminToken;
  let regularAdminToken;
  let testAdminId;

  beforeAll(async () => {
    // Create a super admin for testing
    const superAdminData = {
      email: 'superadmin@test.com',
      password_hash: await bcrypt.hash('password123', 12),
      first_name: 'Super',
      last_name: 'Admin',
      role: 'super_admin',
      permissions: JSON.stringify({
        users: ['read', 'write', 'delete'],
        rides: ['read', 'write', 'delete'],
        analytics: ['read'],
        settings: ['read', 'write'],
        reports: ['read', 'write'],
        localization: ['read', 'write'],
        admin_management: ['read', 'write', 'delete']
      }),
      language_code: 'en',
      timezone: 'UTC',
      is_active: true
    };

    const superAdmin = await AdminUser.create(superAdminData);
    
    // Login as super admin
    const loginResponse = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'superadmin@test.com',
        password: 'password123'
      });

    superAdminToken = loginResponse.body.data.token;

    // Create a regular admin for testing
    const regularAdminData = {
      email: 'admin@test.com',
      password_hash: await bcrypt.hash('password123', 12),
      first_name: 'Regular',
      last_name: 'Admin',
      role: 'admin',
      permissions: JSON.stringify({
        users: ['read', 'write'],
        rides: ['read', 'write'],
        analytics: ['read'],
        settings: ['read'],
        reports: ['read']
      }),
      language_code: 'en',
      timezone: 'UTC',
      is_active: true
    };

    const regularAdmin = await AdminUser.create(regularAdminData);
    
    // Login as regular admin
    const regularLoginResponse = await request(app)
      .post('/api/admin/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });

    regularAdminToken = regularLoginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up test data
    await AdminUser.deleteByEmail('superadmin@test.com');
    await AdminUser.deleteByEmail('admin@test.com');
    if (testAdminId) {
      await AdminUser.delete(testAdminId);
    }
  });

  describe('GET /api/admin/admin-management', () => {
    it('should return admin list for super admin', async () => {
      const response = await request(app)
        .get('/api/admin/admin-management')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.admins).toBeDefined();
      expect(Array.isArray(response.body.data.admins)).toBe(true);
    });

    it('should deny access for regular admin', async () => {
      const response = await request(app)
        .get('/api/admin/admin-management')
        .set('Authorization', `Bearer ${regularAdminToken}`);

      expect(response.status).toBe(403);
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/admin/admin-management');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/admin-management/stats', () => {
    it('should return admin statistics for super admin', async () => {
      const response = await request(app)
        .get('/api/admin/admin-management/stats')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.active).toBeDefined();
      expect(response.body.data.inactive).toBeDefined();
      expect(response.body.data.byRole).toBeDefined();
    });
  });

  describe('GET /api/admin/admin-management/roles-permissions', () => {
    it('should return roles and permissions for super admin', async () => {
      const response = await request(app)
        .get('/api/admin/admin-management/roles-permissions')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.roles).toBeDefined();
      expect(response.body.data.permissions).toBeDefined();
      expect(Array.isArray(response.body.data.roles)).toBe(true);
      expect(Array.isArray(response.body.data.permissions)).toBe(true);
    });
  });

  describe('POST /api/admin/admin-management', () => {
    it('should create new admin for super admin', async () => {
      const newAdminData = {
        email: 'newadmin@test.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'Admin',
        role: 'moderator',
        language_code: 'en',
        timezone: 'UTC'
      };

      const response = await request(app)
        .post('/api/admin/admin-management')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(newAdminData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newadmin@test.com');
      expect(response.body.data.role).toBe('moderator');

      testAdminId = response.body.data.id;
    });

    it('should validate required fields', async () => {
      const invalidData = {
        first_name: 'Test',
        last_name: 'Admin'
        // Missing email and password
      };

      const response = await request(app)
        .post('/api/admin/admin-management')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should prevent duplicate email', async () => {
      const duplicateData = {
        email: 'superadmin@test.com', // Already exists
        password: 'password123',
        first_name: 'Duplicate',
        last_name: 'Admin',
        role: 'admin'
      };

      const response = await request(app)
        .post('/api/admin/admin-management')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(duplicateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/admin-management/:id', () => {
    it('should update admin for super admin', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'Admin',
        role: 'support'
      };

      const response = await request(app)
        .put(`/api/admin/admin-management/${testAdminId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.first_name).toBe('Updated');
      expect(response.body.data.role).toBe('support');
    });

    it('should return 404 for non-existent admin', async () => {
      const response = await request(app)
        .put('/api/admin/admin-management/non-existent-id')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ first_name: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/admin/admin-management/:id/toggle-status', () => {
    it('should toggle admin status for super admin', async () => {
      const response = await request(app)
        .post(`/api/admin/admin-management/${testAdminId}/toggle-status`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_active).toBeDefined();
    });

    it('should prevent deactivating super admin', async () => {
      // Get super admin ID
      const superAdmin = await AdminUser.findByEmail('superadmin@test.com');
      
      const response = await request(app)
        .post(`/api/admin/admin-management/${superAdmin.id}/toggle-status`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/admin/admin-management/:id', () => {
    it('should delete admin for super admin', async () => {
      const response = await request(app)
        .delete(`/api/admin/admin-management/${testAdminId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should prevent deleting super admin', async () => {
      const superAdmin = await AdminUser.findByEmail('superadmin@test.com');
      
      const response = await request(app)
        .delete(`/api/admin/admin-management/${superAdmin.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Admin Profile Management', () => {
    it('should get admin profile', async () => {
      const response = await request(app)
        .get('/api/admin/auth/profile')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('superadmin@test.com');
    });

    it('should update admin profile', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'SuperAdmin',
        language_code: 'ar',
        timezone: 'Asia/Dubai'
      };

      const response = await request(app)
        .put('/api/admin/auth/profile')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.first_name).toBe('Updated');
      expect(response.body.data.language_code).toBe('ar');
    });

    it('should change admin password', async () => {
      const passwordData = {
        current_password: 'password123',
        new_password: 'newpassword123'
      };

      const response = await request(app)
        .post('/api/admin/auth/change-password')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate current password', async () => {
      const passwordData = {
        current_password: 'wrongpassword',
        new_password: 'newpassword123'
      };

      const response = await request(app)
        .post('/api/admin/auth/change-password')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
}); 