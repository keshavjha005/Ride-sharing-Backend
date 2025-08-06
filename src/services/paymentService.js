const stripe = require('stripe');
const config = require('../config');
const logger = require('../utils/logger');
const PaymentMethod = require('../models/PaymentMethod');
const PaymentTransaction = require('../models/PaymentTransaction');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const WalletRechargeRequest = require('../models/WalletRechargeRequest');

// Initialize Stripe
const stripeClient = stripe(config.stripe.secretKey);

class PaymentService {
  /**
   * Create a payment intent with Stripe
   */
  static async createStripePaymentIntent(data) {
    try {
      const { amount, currency = 'USD', paymentMethodId, metadata = {} } = data;
      
      // Validate amount (Stripe expects amount in cents)
      const amountInCents = Math.round(amount * 100);
      
      if (amountInCents < 50) { // Minimum $0.50
        throw new Error('Amount must be at least $0.50');
      }
      
      const paymentIntentData = {
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata: {
          ...metadata,
          source: 'mate_app'
        }
      };
      
      // If payment method is provided, attach it
      if (paymentMethodId) {
        paymentIntentData.payment_method = paymentMethodId;
        paymentIntentData.confirm = true;
        paymentIntentData.return_url = `${config.app.url}/payment/success`;
      }
      
      const paymentIntent = await stripeClient.paymentIntents.create(paymentIntentData);
      
      logger.info(`Stripe payment intent created: ${paymentIntent.id} for amount: ${amount}`);
      
      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amount: amount,
        currency: currency,
        requiresAction: paymentIntent.status === 'requires_action',
        nextAction: paymentIntent.next_action
      };
      
    } catch (error) {
      logger.error('Error creating Stripe payment intent:', error);
      throw new Error(`Payment intent creation failed: ${error.message}`);
    }
  }
  
  /**
   * Confirm a Stripe payment intent
   */
  static async confirmStripePayment(paymentIntentId, paymentMethodId = null) {
    try {
      const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          status: paymentIntent.status,
          transactionId: paymentIntent.latest_charge
        };
      }
      
      if (paymentIntent.status === 'requires_confirmation') {
        const confirmData = {};
        if (paymentMethodId) {
          confirmData.payment_method = paymentMethodId;
        }
        
        const confirmedIntent = await stripeClient.paymentIntents.confirm(paymentIntentId, confirmData);
        
        return {
          success: confirmedIntent.status === 'succeeded',
          status: confirmedIntent.status,
          transactionId: confirmedIntent.latest_charge,
          requiresAction: confirmedIntent.status === 'requires_action',
          nextAction: confirmedIntent.next_action
        };
      }
      
      throw new Error(`Payment intent status not supported: ${paymentIntent.status}`);
      
    } catch (error) {
      logger.error('Error confirming Stripe payment:', error);
      throw new Error(`Payment confirmation failed: ${error.message}`);
    }
  }
  
  /**
   * Create a payment method with Stripe
   */
  static async createStripePaymentMethod(data) {
    try {
      const { type, card, billing_details } = data;
      
      const paymentMethodData = {
        type: type,
        billing_details: billing_details || {}
      };
      
      if (type === 'card' && card) {
        paymentMethodData.card = card;
      }
      
      const paymentMethod = await stripeClient.paymentMethods.create(paymentMethodData);
      
      logger.info(`Stripe payment method created: ${paymentMethod.id}`);
      
      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year
        } : null,
        billing_details: paymentMethod.billing_details
      };
      
    } catch (error) {
      logger.error('Error creating Stripe payment method:', error);
      throw new Error(`Payment method creation failed: ${error.message}`);
    }
  }
  
  /**
   * Attach payment method to customer
   */
  static async attachPaymentMethodToCustomer(paymentMethodId, customerId) {
    try {
      const paymentMethod = await stripeClient.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
      
      logger.info(`Payment method ${paymentMethodId} attached to customer ${customerId}`);
      
      return paymentMethod;
      
    } catch (error) {
      logger.error('Error attaching payment method to customer:', error);
      throw new Error(`Payment method attachment failed: ${error.message}`);
    }
  }
  
  /**
   * Process wallet recharge with payment
   */
  static async processWalletRecharge(rechargeRequestId, paymentMethodId) {
    const connection = await require('mysql2/promise').createConnection(config.database);
    
    try {
      await connection.beginTransaction();
      
      // Get recharge request
      const rechargeRequest = await WalletRechargeRequest.getById(rechargeRequestId);
      if (!rechargeRequest) {
        throw new Error('Recharge request not found');
      }
      
      if (rechargeRequest.status !== 'pending') {
        throw new Error('Recharge request is not in pending status');
      }
      
      // Create payment transaction
      const paymentTransaction = await PaymentTransaction.create({
        user_id: rechargeRequest.user_id,
        amount: rechargeRequest.amount,
        currency: 'USD',
        payment_method_id: paymentMethodId,
        gateway: 'stripe',
        status: 'processing',
        metadata: {
          recharge_request_id: rechargeRequestId,
          type: 'wallet_recharge'
        }
      });
      
      // Create Stripe payment intent
      const paymentIntent = await this.createStripePaymentIntent({
        amount: rechargeRequest.amount,
        currency: 'USD',
        paymentMethodId: paymentMethodId,
        metadata: {
          recharge_request_id: rechargeRequestId,
          payment_transaction_id: paymentTransaction.id,
          type: 'wallet_recharge'
        }
      });
      
      // Update payment transaction with payment intent ID
      await PaymentTransaction.update(paymentTransaction.id, {
        gateway_payment_intent_id: paymentIntent.paymentIntentId
      });
      
      // Update recharge request status
      await WalletRechargeRequest.updateStatus(rechargeRequestId, 'processing');
      
      await connection.commit();
      
      return {
        paymentTransactionId: paymentTransaction.id,
        paymentIntentId: paymentIntent.paymentIntentId,
        clientSecret: paymentIntent.clientSecret,
        requiresAction: paymentIntent.requiresAction,
        nextAction: paymentIntent.nextAction
      };
      
    } catch (error) {
      await connection.rollback();
      logger.error('Error processing wallet recharge:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }
  
  /**
   * Handle successful payment and credit wallet
   */
  static async handleSuccessfulPayment(paymentTransactionId, gatewayTransactionId) {
    const connection = await require('mysql2/promise').createConnection(config.database);
    
    try {
      await connection.beginTransaction();
      
      // Get payment transaction
      const paymentTransaction = await PaymentTransaction.getById(paymentTransactionId);
      if (!paymentTransaction) {
        throw new Error('Payment transaction not found');
      }
      
      // Mark payment as succeeded
      await PaymentTransaction.markAsSucceeded(paymentTransactionId, gatewayTransactionId);
      
      // If this is a wallet recharge, credit the wallet
      if (paymentTransaction.metadata?.type === 'wallet_recharge') {
        const rechargeRequestId = paymentTransaction.metadata.recharge_request_id;
        
        // Update recharge request status
        await WalletRechargeRequest.updateStatus(rechargeRequestId, 'completed', null, gatewayTransactionId);
        
        // Get or create wallet
        let wallet = await Wallet.getByUserId(paymentTransaction.user_id);
        if (!wallet) {
          wallet = await Wallet.create(paymentTransaction.user_id, 'USD');
        }
        
        // Credit wallet
        await WalletTransaction.processCredit(
          wallet.id,
          paymentTransaction.amount,
          'wallet_recharge',
          rechargeRequestId,
          'recharge',
          `Wallet recharge via ${paymentTransaction.gateway}`
        );
        
        logger.info(`Wallet credited: ${paymentTransaction.amount} for user: ${paymentTransaction.user_id}`);
      }
      
      await connection.commit();
      
      return {
        success: true,
        paymentTransactionId,
        gatewayTransactionId,
        amount: paymentTransaction.amount
      };
      
    } catch (error) {
      await connection.rollback();
      logger.error('Error handling successful payment:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }
  
  /**
   * Handle failed payment
   */
  static async handleFailedPayment(paymentTransactionId, failureReason) {
    const connection = await require('mysql2/promise').createConnection(config.database);
    
    try {
      await connection.beginTransaction();
      
      // Get payment transaction
      const paymentTransaction = await PaymentTransaction.getById(paymentTransactionId);
      if (!paymentTransaction) {
        throw new Error('Payment transaction not found');
      }
      
      // Mark payment as failed
      await PaymentTransaction.markAsFailed(paymentTransactionId, failureReason);
      
      // If this is a wallet recharge, update recharge request status
      if (paymentTransaction.metadata?.type === 'wallet_recharge') {
        const rechargeRequestId = paymentTransaction.metadata.recharge_request_id;
        await WalletRechargeRequest.updateStatus(rechargeRequestId, 'failed', failureReason);
      }
      
      await connection.commit();
      
      return {
        success: false,
        paymentTransactionId,
        failureReason
      };
      
    } catch (error) {
      await connection.rollback();
      logger.error('Error handling failed payment:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }
  
  /**
   * Verify Stripe webhook signature
   */
  static verifyStripeWebhookSignature(payload, signature) {
    try {
      const event = stripeClient.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }
  
  /**
   * Process Stripe webhook events
   */
  static async processStripeWebhook(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
          
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
          
        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(event.data.object);
          break;
          
        case 'payment_method.detached':
          await this.handlePaymentMethodDetached(event.data.object);
          break;
          
        default:
          logger.info(`Unhandled Stripe webhook event: ${event.type}`);
      }
      
      return { success: true, eventType: event.type };
      
    } catch (error) {
      logger.error('Error processing Stripe webhook:', error);
      throw error;
    }
  }
  
  /**
   * Handle successful payment intent
   */
  static async handlePaymentIntentSucceeded(paymentIntent) {
    const paymentTransaction = await PaymentTransaction.getByGatewayPaymentIntentId(paymentIntent.id);
    
    if (paymentTransaction) {
      await this.handleSuccessfulPayment(
        paymentTransaction.id,
        paymentIntent.latest_charge
      );
    } else {
      logger.warn(`No payment transaction found for payment intent: ${paymentIntent.id}`);
    }
  }
  
  /**
   * Handle failed payment intent
   */
  static async handlePaymentIntentFailed(paymentIntent) {
    const paymentTransaction = await PaymentTransaction.getByGatewayPaymentIntentId(paymentIntent.id);
    
    if (paymentTransaction) {
      const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
      await this.handleFailedPayment(paymentTransaction.id, failureReason);
    } else {
      logger.warn(`No payment transaction found for payment intent: ${paymentIntent.id}`);
    }
  }
  
  /**
   * Handle payment method attached
   */
  static async handlePaymentMethodAttached(paymentMethod) {
    logger.info(`Payment method attached: ${paymentMethod.id}`);
    // Could implement additional logic here if needed
  }
  
  /**
   * Handle payment method detached
   */
  static async handlePaymentMethodDetached(paymentMethod) {
    logger.info(`Payment method detached: ${paymentMethod.id}`);
    // Could implement additional logic here if needed
  }
  
  /**
   * Get payment method details from Stripe
   */
  static async getStripePaymentMethod(paymentMethodId) {
    try {
      const paymentMethod = await stripeClient.paymentMethods.retrieve(paymentMethodId);
      
      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        card: paymentMethod.card ? {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year
        } : null,
        billing_details: paymentMethod.billing_details
      };
      
    } catch (error) {
      logger.error('Error retrieving Stripe payment method:', error);
      throw new Error(`Payment method retrieval failed: ${error.message}`);
    }
  }
  
  /**
   * Delete payment method from Stripe
   */
  static async deleteStripePaymentMethod(paymentMethodId) {
    try {
      const paymentMethod = await stripeClient.paymentMethods.detach(paymentMethodId);
      
      logger.info(`Stripe payment method deleted: ${paymentMethodId}`);
      
      return paymentMethod;
      
    } catch (error) {
      logger.error('Error deleting Stripe payment method:', error);
      throw new Error(`Payment method deletion failed: ${error.message}`);
    }
  }
}

module.exports = PaymentService; 