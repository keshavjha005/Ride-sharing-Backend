const mysql = require('mysql2/promise');
const config = require('../src/config');
const { generateAccessToken } = require('../src/utils/jwt');

/**
 * Create a test user with authentication token
 */
async function createTestUser() {
  const connection = await mysql.createConnection(config.database);
  
  try {
    const userId = 'test-withdrawal-user-' + Date.now();
    const email = `withdrawal-test-${Date.now()}@example.com`;
    await connection.query(`
      INSERT INTO users (id, email, phone, password_hash, first_name, last_name, is_verified, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, email, '+1234567890', 'hashed_password', 'Test', 'User', true, true]);
    
    const user = { id: userId, email };
    const token = generateAccessToken(user);
    
    return { ...user, token };
  } finally {
    await connection.end();
  }
}

/**
 * Create a test wallet with specified balance
 */
async function createTestWallet(userId, balance = 1000.00) {
  const connection = await mysql.createConnection(config.database);
  
  try {
    const walletId = 'test-wallet-' + Date.now();
    await connection.query(`
      INSERT INTO wallets (id, user_id, balance, currency_code, is_active)
      VALUES (?, ?, ?, ?, ?)
    `, [walletId, userId, balance, 'USD', true]);
    
    return { id: walletId, user_id: userId, balance, currency_code: 'USD' };
  } finally {
    await connection.end();
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData(userId) {
  const connection = await mysql.createConnection(config.database);
  
  try {
    // Clean up in reverse order of dependencies
    await connection.query('DELETE FROM payout_transactions WHERE withdrawal_request_id IN (SELECT id FROM withdrawal_requests WHERE user_id = ?)', [userId]);
    await connection.query('DELETE FROM withdrawal_requests WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM withdrawal_methods WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = ?)', [userId]);
    await connection.query('DELETE FROM wallets WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);
  } finally {
    await connection.end();
  }
}

module.exports = {
  createTestUser,
  createTestWallet,
  cleanupTestData
}; 