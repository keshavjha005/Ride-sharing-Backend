const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class AdminAuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Get admin user by email
      const admins = await executeQuery(
        'SELECT * FROM admin_users WHERE email = ?',
        [email]
      );

      if (!admins || admins.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const admin = admins[0];
      const passwordMatch = await bcrypt.compare(password, admin.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Create token
      const token = jwt.sign(
        { id: admin.id, role: admin.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Update last login
      await executeQuery(
        'UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
        [admin.id]
      );

      // Remove sensitive data
      delete admin.password_hash;

      res.json({
        success: true,
        data: {
          token,
          admin
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }

  async getProfile(req, res) {
    try {
      const admins = await executeQuery(
        'SELECT id, email, first_name, last_name, role, is_active, language_code, timezone FROM admin_users WHERE id = ?',
        [req.admin.id]
      );

      if (!admins || admins.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      res.json({
        success: true,
        data: admins[0]
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile'
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const oldToken = req.headers.authorization?.split(' ')[1];
      if (!oldToken) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }

      const decoded = jwt.verify(oldToken, process.env.JWT_SECRET || 'your-secret-key');
      const admins = await executeQuery(
        'SELECT id, role FROM admin_users WHERE id = ?',
        [decoded.id]
      );

      if (!admins || admins.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      const admin = admins[0];
      const token = jwt.sign(
        { id: admin.id, role: admin.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: { token }
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  }

  async logout(req, res) {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  async updateProfile(req, res) {
    try {
      const { first_name, last_name, language_code, timezone } = req.body;
      
      // Update admin profile
      await executeQuery(
        'UPDATE admin_users SET first_name = ?, last_name = ?, language_code = ?, timezone = ? WHERE id = ?',
        [first_name, last_name, language_code, timezone, req.admin.id]
      );

      // Get updated profile
      const [admins] = await executeQuery(
        'SELECT id, email, first_name, last_name, role, is_active, language_code, timezone FROM admin_users WHERE id = ?',
        [req.admin.id]
      );

      res.json({
        success: true,
        data: admins[0],
        message: 'Profile updated successfully'
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;

      // Get admin user with password
      const admins = await executeQuery(
        'SELECT * FROM admin_users WHERE id = ?',
        [req.admin.id]
      );

      if (!admins || admins.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      const admin = admins[0];

      // Verify current password
      const passwordMatch = await bcrypt.compare(current_password, admin.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update password
      await executeQuery(
        'UPDATE admin_users SET password_hash = ? WHERE id = ?',
        [hashedPassword, req.admin.id]
      );

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }
}

module.exports = new AdminAuthController();