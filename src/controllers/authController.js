const User = require('../models/User');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { ValidationError, AuthenticationError, ConflictError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Register new user
const register = async (req, res, next) => {
  try {
    const {
      email,
      phone,
      password,
      first_name,
      last_name,
      date_of_birth,
      gender,
      language_code = 'en',
      currency_code = 'USD',
    } = req.body;

    // Validate required fields
    if (!email && !phone) {
      throw new ValidationError('Email or phone number is required');
    }

    if (!password) {
      throw new ValidationError('Password is required');
    }

    if (!first_name || !last_name) {
      throw new ValidationError('First name and last name are required');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new ValidationError('Password does not meet requirements', passwordValidation.errors);
    }

    // Check if email already exists
    if (email) {
      const emailExists = await User.emailExists(email);
      if (emailExists) {
        throw new ConflictError('Email already registered');
      }
    }

    // Check if phone already exists
    if (phone) {
      const phoneExists = await User.phoneExists(phone);
      if (phoneExists) {
        throw new ConflictError('Phone number already registered');
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userData = {
      email,
      phone,
      password_hash: passwordHash,
      first_name,
      last_name,
      date_of_birth,
      gender,
      language_code,
      currency_code,
    };

    const user = await User.create(userData);

    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: 'user',
      language: user.language_code,
      currency: user.currency_code,
    });

    // Remove sensitive data
    const { password_hash, ...userResponse } = user;

    logger.auth('user_registered', user.id, {
      email: user.email,
      phone: user.phone,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    // Validate required fields
    if (!email && !phone) {
      throw new ValidationError('Email or phone number is required');
    }

    if (!password) {
      throw new ValidationError('Password is required');
    }

    // Find user by email or phone
    let user;
    if (email) {
      user = await User.findByEmail(email);
    } else {
      user = await User.findByPhone(phone);
    }

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: 'user',
      language: user.language_code,
      currency: user.currency_code,
    });

    // Remove sensitive data
    const { password_hash, ...userResponse } = user;

    logger.auth('user_logged_in', user.id, {
      email: user.email,
      phone: user.phone,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user || !user.is_active) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: 'user',
      language: user.language_code,
      currency: user.currency_code,
    });

    logger.auth('token_refreshed', user.id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Logout user
const logout = async (req, res, next) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success response
    // The client should remove the tokens from storage

    logger.auth('user_logged_out', req.user.id);

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Remove sensitive data
    const { password_hash, ...userResponse } = user;

    res.json({
      success: true,
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      date_of_birth,
      gender,
      language_code,
      currency_code,
    } = req.body;

    const updateData = {
      first_name,
      last_name,
      date_of_birth,
      gender,
      language_code,
      currency_code,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const user = await User.update(req.user.id, updateData);

    // Remove sensitive data
    const { password_hash, ...userResponse } = user;

    logger.auth('profile_updated', req.user.id);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userResponse,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new ValidationError('New password does not meet requirements', passwordValidation.errors);
    }

    // Get current user
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await User.updatePassword(req.user.id, newPasswordHash);

    logger.auth('password_changed', req.user.id);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
}; 