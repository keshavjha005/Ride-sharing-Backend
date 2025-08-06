const request = require('supertest');
const app = require('../src/app');
const mysql = require('mysql2/promise');
const config = require('../src/config');
const { v4: uuidv4 } = require('uuid');

let connection;
let testUser;
let testUserToken;
let testPaymentMethod;
let testPaymentTransaction;

// Mock Stripe for testing
jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_1234567890',
        client_secret: 'pi_test_secret_1234567890',
        status: 'requires_confirmation',
        next_action: null
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test_1234567890',
        status: 'succeeded',
        latest_charge: 'ch_test_1234567890'
      }),
      confirm: jest.fn().mockResolvedValue({
        id: 'pi_test_1234567890',
        status: 'succeeded',
        latest_charge: 'ch_test_1234567890'
      })
    },
    paymentMethods: {
      create: jest.fn().mockResolvedValue({
        id: 'pm_test_1234567890',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025
        },
        billing_details: {
          name: 'Test User',
          email: 'test@example.com'
        }
      }),
      attach: jest.fn().mockResolvedValue({
        id: 'pm_test_1234567890'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pm_test_1234567890',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025
        }
      }),
      detach: jest.fn().mockResolvedValue({
        id: 'pm_test_1234567890'
      })
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_1234567890',
            status: 'succeeded',
            latest_charge: 'ch_test_1234567890'
          }
        }
      })
    }
  }));
});

beforeAll(async () => {
  // Create database connection
  connection = await mysql.createConnection(config.database);
  
  // Clean up any existing test data
  await connection.query('DELETE FROM payment_transactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)', ['test_%']);
  await connection.query('DELETE FROM payment_methods WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)', ['test_%']);
  await connection.query('DELETE FROM wallet_recharge_requests WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)', ['test_%']);
  await connection.query('DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?))', ['test_%']);
  await connection.query('DELETE FROM wallets WHERE user_id IN (SELECT id FROM users WHERE email LIKE ?)', ['test_%']);
  await connection.query('DELETE FROM users WHERE email LIKE ?', ['test_%']);
  
  // Create test user with unique email
  const userId = uuidv4();
  const testEmail = `test_${Date.now()}@example.com`;
  const hashedPassword = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.i8Hy'; // 'password123'
  
  await connection.query(`
    INSERT INTO users (id, email, password_hash, first_name, last_name, phone, language_code, currency_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [userId, testEmail, hashedPassword, 'Test', 'User', '+1234567890', 'en', 'USD']);
  
  testUser = { id: userId, email: testEmail };
  
  // Generate test user token
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: testEmail,
      password: 'password123'
    });
  
  testUserToken = loginResponse.body.data.tokens.accessToken;
});

afterAll(async () => {
  // Clean up test data
  if (connection) {
    await connection.query('DELETE FROM payment_transactions WHERE user_id = ?', [testUser.id]);
    await connection.query('DELETE FROM payment_methods WHERE user_id = ?', [testUser.id]);
    await connection.query('DELETE FROM wallet_recharge_requests WHERE user_id = ?', [testUser.id]);
    await connection.query('DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = ?)', [testUser.id]);
    await connection.query('DELETE FROM wallets WHERE user_id = ?', [testUser.id]);
    await connection.query('DELETE FROM users WHERE id = ?', [testUser.id]);
    await connection.end();
  }
});

describe('Payment Methods', () => {
  describe('POST /api/payments/methods', () => {
    it('should create a new payment method', async () => {
      const paymentMethodData = {
        payment_type: 'card',
        gateway: 'stripe',
        gateway_payment_method_id: 'pm_test_1234567890',
        card_last4: '4242',
        card_brand: 'visa',
        card_exp_month: 12,
        card_exp_year: 2025,
        is_default: true
      };
      
      const response = await request(app)
        .post('/api/payments/methods')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(paymentMethodData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.payment_type).toBe('card');
      expect(response.body.data.gateway).toBe('stripe');
      expect(response.body.data.is_default).toBe(true);
      
      testPaymentMethod = response.body.data;
    });
    
    it('should reject invalid payment method data', async () => {
      const invalidData = {
        payment_type: 'invalid_type',
        gateway: 'stripe',
        gateway_payment_method_id: 'pm_test_1234567890'
      };
      
      const response = await request(app)
        .post('/api/payments/methods')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('GET /api/payments/methods', () => {
    it('should get user payment methods', async () => {
      const response = await request(app)
        .get('/api/payments/methods')
        .set('Authorization', `Bearer ${testUserToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
    
    it('should filter payment methods by type', async () => {
      const response = await request(app)
        .get('/api/payments/methods?payment_type=card')
        .set('Authorization', `Bearer ${testUserToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach(method => {
        expect(method.payment_type).toBe('card');
      });
    });
  });
  
  describe('PUT /api/payments/methods/:id', () => {
    it('should update payment method', async () => {
      const updates = {
        is_default: false
      };
      
      const response = await request(app)
        .put(`/api/payments/methods/${testPaymentMethod.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_default).toBe(false);
    });
    
    it('should reject update for non-existent payment method', async () => {
      const response = await request(app)
        .put(`/api/payments/methods/${uuidv4()}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ is_default: true });
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('PUT /api/payments/methods/:id/set-default', () => {
    it('should set payment method as default', async () => {
      const response = await request(app)
        .put(`/api/payments/methods/${testPaymentMethod.id}/set-default`)
        .set('Authorization', `Bearer ${testUserToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.is_default).toBe(true);
    });
  });
  
  describe('DELETE /api/payments/methods/:id', () => {
    it('should delete payment method', async () => {
      const response = await request(app)
        .delete(`/api/payments/methods/${testPaymentMethod.id}`)
        .set('Authorization', `Bearer ${testUserToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('Payment Intents', () => {
  describe('POST /api/payments/create-intent', () => {
    it('should create payment intent', async () => {
      const paymentData = {
        amount: 100.00,
        currency: 'USD',
        paymentMethodId: 'pm_test_1234567890'
      };
      
      const response = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(paymentData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentIntentId');
      expect(response.body.data).toHaveProperty('clientSecret');
      expect(response.body.data.amount).toBe(100.00);
    });
    
    it('should reject invalid amount', async () => {
      const response = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ amount: 0.25 }); // Below minimum
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /api/payments/confirm', () => {
    it('should confirm payment', async () => {
      const confirmData = {
        paymentIntentId: 'pi_test_1234567890',
        paymentMethodId: 'pm_test_1234567890'
      };
      
      const response = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(confirmData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('status');
    });
    
    it('should reject missing payment intent ID', async () => {
      const response = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ paymentMethodId: 'pm_test_1234567890' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('Payment Transactions', () => {
  describe('GET /api/payments/transactions', () => {
    it('should get payment transactions', async () => {
      const response = await request(app)
        .get('/api/payments/transactions')
        .set('Authorization', `Bearer ${testUserToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should filter transactions by status', async () => {
      const response = await request(app)
        .get('/api/payments/transactions?status=succeeded')
        .set('Authorization', `Bearer ${testUserToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/payments/transactions?limit=10&offset=0')
        .set('Authorization', `Bearer ${testUserToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  describe('GET /api/payments/transactions/:id', () => {
    it('should get payment transaction details', async () => {
      // First create a transaction
      const transactionData = {
        user_id: testUser.id,
        amount: 50.00,
        currency: 'USD',
        gateway: 'stripe',
        status: 'pending'
      };
      
      const [result] = await connection.query(
        'INSERT INTO payment_transactions (id, user_id, amount, currency, gateway, status) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), transactionData.user_id, transactionData.amount, transactionData.currency, transactionData.gateway, transactionData.status]
      );
      
      const transactionId = result.insertId;
      
      const response = await request(app)
        .get(`/api/payments/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${testUserToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('amount');
      expect(response.body.data.amount).toBe(50.00);
    });
    
    it('should reject access to other user transaction', async () => {
      const otherUserId = uuidv4();
      const transactionData = {
        user_id: otherUserId,
        amount: 50.00,
        currency: 'USD',
        gateway: 'stripe',
        status: 'pending'
      };
      
      const [result] = await connection.query(
        'INSERT INTO payment_transactions (id, user_id, amount, currency, gateway, status) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), transactionData.user_id, transactionData.amount, transactionData.currency, transactionData.gateway, transactionData.status]
      );
      
      const transactionId = result.insertId;
      
      const response = await request(app)
        .get(`/api/payments/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${testUserToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('Payment Statistics', () => {
  describe('GET /api/payments/statistics', () => {
    it('should get payment statistics', async () => {
      const response = await request(app)
        .get('/api/payments/statistics')
        .set('Authorization', `Bearer ${testUserToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_transactions');
      expect(response.body.data).toHaveProperty('successful_transactions');
      expect(response.body.data).toHaveProperty('total_amount');
    });
    
    it('should get statistics for custom period', async () => {
      const response = await request(app)
        .get('/api/payments/statistics?period=7')
        .set('Authorization', `Bearer ${testUserToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('Stripe Webhook', () => {
  describe('POST /api/payments/webhook/stripe', () => {
    it('should process Stripe webhook', async () => {
      const webhookData = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_1234567890',
            status: 'succeeded',
            latest_charge: 'ch_test_1234567890'
          }
        }
      };
      
      const response = await request(app)
        .post('/api/payments/webhook/stripe')
        .set('stripe-signature', 'test_signature')
        .send(webhookData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    it('should reject webhook without signature', async () => {
      const response = await request(app)
        .post('/api/payments/webhook/stripe')
        .send({ type: 'payment_intent.succeeded' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('Wallet Integration', () => {
  describe('POST /api/wallet/recharge with payment', () => {
    it('should process wallet recharge with Stripe payment', async () => {
      // First create a payment method
      const paymentMethodData = {
        payment_type: 'card',
        gateway: 'stripe',
        gateway_payment_method_id: 'pm_test_1234567890',
        card_last4: '4242',
        card_brand: 'visa',
        card_exp_month: 12,
        card_exp_year: 2025
      };
      
      const paymentMethodResponse = await request(app)
        .post('/api/payments/methods')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(paymentMethodData);
      
      const paymentMethodId = paymentMethodResponse.body.data.id;
      
      // Now recharge wallet with payment
      const rechargeData = {
        amount: 100.00,
        paymentMethod: 'stripe',
        currency: 'USD',
        paymentMethodId: paymentMethodId
      };
      
      const response = await request(app)
        .post('/api/wallet/recharge')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(rechargeData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('rechargeId');
      expect(response.body.data).toHaveProperty('paymentTransactionId');
      expect(response.body.data).toHaveProperty('paymentIntentId');
      expect(response.body.data).toHaveProperty('clientSecret');
    });
  });
});

describe('Authentication', () => {
  it('should require authentication for payment endpoints', async () => {
    const response = await request(app)
      .get('/api/payments/methods');
    
    expect(response.status).toBe(401);
  });
  
  it('should reject invalid tokens', async () => {
    const response = await request(app)
      .get('/api/payments/methods')
      .set('Authorization', 'Bearer invalid_token');
    
    expect(response.status).toBe(401);
  });
}); 