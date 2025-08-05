const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('./logger');

// Generate access token
const generateAccessToken = (payload) => {
  try {
    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    
    logger.auth('access_token_generated', payload.userId || payload.id);
    return token;
  } catch (error) {
    logger.error('Failed to generate access token', {
      error: error.message,
      userId: payload.userId || payload.id,
    });
    throw error;
  }
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  try {
    const token = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    
    logger.auth('refresh_token_generated', payload.userId || payload.id);
    return token;
  } catch (error) {
    logger.error('Failed to generate refresh token', {
      error: error.message,
      userId: payload.userId || payload.id,
    });
    throw error;
  }
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    
    logger.auth('access_token_verified', decoded.userId || decoded.id);
    return decoded;
  } catch (error) {
    logger.error('Failed to verify access token', {
      error: error.message,
      token: token.substring(0, 20) + '...',
    });
    throw error;
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    
    logger.auth('refresh_token_verified', decoded.userId || decoded.id);
    return decoded;
  } catch (error) {
    logger.error('Failed to verify refresh token', {
      error: error.message,
      token: token.substring(0, 20) + '...',
    });
    throw error;
  }
};

// Decode token without verification (for getting payload)
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Failed to decode token', {
      error: error.message,
      token: token.substring(0, 20) + '...',
    });
    throw error;
  }
};

// Get token expiration time
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    logger.error('Failed to get token expiration', {
      error: error.message,
      token: token.substring(0, 20) + '...',
    });
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      return Date.now() >= decoded.exp * 1000;
    }
    return true;
  } catch (error) {
    logger.error('Failed to check token expiration', {
      error: error.message,
      token: token.substring(0, 20) + '...',
    });
    return true;
  }
};

// Generate token pair (access + refresh)
const generateTokenPair = (payload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expiresIn,
    refreshExpiresIn: config.jwt.refreshExpiresIn,
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  generateTokenPair,
}; 