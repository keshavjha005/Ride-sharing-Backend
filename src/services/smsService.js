const twilio = require('twilio');
const config = require('../config');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class SMSService {
  constructor() {
    this.client = null;
    this.initializeClient();
  }

  /**
   * Initialize Twilio client
   */
  initializeClient() {
    try {
      if (config.sms.twilioAccountSid && config.sms.twilioAuthToken) {
        this.client = twilio(config.sms.twilioAccountSid, config.sms.twilioAuthToken);
        logger.info('SMS service initialized with Twilio');
      } else {
        logger.warn('Twilio credentials not configured, SMS service disabled');
        this.client = null;
      }
    } catch (error) {
      logger.error('Failed to initialize SMS service:', error);
      throw error;
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(to, message, options = {}) {
    try {
      if (!this.client) {
        throw new Error('SMS service not configured');
      }

      const smsId = uuidv4();
      const startTime = Date.now();

      // Format phone number
      const formattedNumber = this.formatPhoneNumber(to);
      
      const messageOptions = {
        body: message,
        from: options.from || config.sms.twilioPhoneNumber,
        to: formattedNumber,
        statusCallback: options.statusCallback,
        maxPrice: options.maxPrice,
        provideFeedback: options.provideFeedback || true
      };

      logger.info('Sending SMS', {
        smsId,
        to: formattedNumber,
        messageLength: message.length,
        templateKey: options.templateKey,
        userId: options.userId
      });

      const result = await this.client.messages.create(messageOptions);
      const deliveryTime = Date.now() - startTime;

      logger.info('SMS sent successfully', {
        smsId,
        messageSid: result.sid,
        deliveryTime,
        to: formattedNumber,
        status: result.status
      });

      return {
        success: true,
        smsId,
        messageSid: result.sid,
        deliveryTime,
        to: formattedNumber,
        status: result.status,
        price: result.price
      };

    } catch (error) {
      logger.error('Failed to send SMS', {
        to,
        message: message.substring(0, 50) + '...',
        error: error.message,
        code: error.code
      });

      return {
        success: false,
        error: error.message,
        code: error.code,
        to
      };
    }
  }

  /**
   * Send SMS from template
   */
  async sendTemplateSMS(to, templateKey, variables = {}, options = {}) {
    try {
      // Get SMS template from database
      const SMSTemplate = require('../models/SMSTemplate');
      const template = await SMSTemplate.findByKey(templateKey);
      
      if (!template) {
        throw new Error(`SMS template not found: ${templateKey}`);
      }

      // Render template with variables
      const rendered = template.render(variables, options.language || 'en');
      
      // Send SMS
      return await this.sendSMS(to, rendered.message, {
        ...options,
        templateKey
      });

    } catch (error) {
      logger.error('Failed to send template SMS', {
        to,
        templateKey,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSMS(phoneNumbers, templateKey, variables = {}, options = {}) {
    const results = [];
    const errors = [];

    for (const phoneData of phoneNumbers) {
      try {
        const { to, customVariables = {} } = phoneData;
        const mergedVariables = { ...variables, ...customVariables };
        
        const result = await this.sendTemplateSMS(
          to, 
          templateKey, 
          mergedVariables, 
          options
        );

        results.push({
          to,
          success: result.success,
          smsId: result.smsId,
          messageSid: result.messageSid,
          status: result.status
        });

      } catch (error) {
        errors.push({
          to: phoneData.to,
          error: error.message
        });
      }
    }

    return {
      results,
      errors,
      summary: {
        total: phoneNumbers.length,
        sent: results.filter(r => r.success).length,
        failed: errors.length
      }
    };
  }

  /**
   * Verify phone number
   */
  async verifyPhoneNumber(phoneNumber) {
    try {
      if (!this.client) {
        throw new Error('SMS service not configured');
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // Use Twilio's Lookup API to verify the number
      const lookupResult = await this.client.lookups.v2.phoneNumbers(formattedNumber).fetch({
        fields: ['valid', 'line_type', 'carrier']
      });

      return {
        valid: lookupResult.valid,
        lineType: lookupResult.lineType,
        carrier: lookupResult.carrier,
        phoneNumber: formattedNumber
      };

    } catch (error) {
      logger.error('Phone number verification failed', { 
        phoneNumber, 
        error: error.message 
      });
      return { 
        valid: false, 
        error: error.message,
        phoneNumber 
      };
    }
  }

  /**
   * Get SMS delivery status
   */
  async getDeliveryStatus(messageSid) {
    try {
      if (!this.client) {
        throw new Error('SMS service not configured');
      }

      const message = await this.client.messages(messageSid).fetch();
      
      return {
        messageSid: message.sid,
        status: message.status,
        direction: message.direction,
        from: message.from,
        to: message.to,
        body: message.body,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        dateSent: message.dateSent,
        price: message.price,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };

    } catch (error) {
      logger.error('Failed to get SMS delivery status', { 
        messageSid, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get SMS statistics
   */
  async getSMSStatistics(timeRange = '24h') {
    try {
      if (!this.client) {
        throw new Error('SMS service not configured');
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '1h':
          startDate.setHours(endDate.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        default:
          startDate.setDate(endDate.getDate() - 1);
      }

      // Get messages from Twilio
      const messages = await this.client.messages.list({
        dateSentAfter: startDate,
        dateSentBefore: endDate,
        limit: 1000
      });

      const stats = {
        total: messages.length,
        delivered: messages.filter(m => m.status === 'delivered').length,
        failed: messages.filter(m => m.status === 'failed').length,
        pending: messages.filter(m => m.status === 'pending' || m.status === 'queued').length,
        averageDeliveryTime: 0,
        successRate: 0,
        timeRange
      };

      // Calculate success rate
      if (stats.total > 0) {
        stats.successRate = (stats.delivered / stats.total) * 100;
      }

      return stats;

    } catch (error) {
      logger.error('Failed to get SMS statistics', error);
      throw error;
    }
  }

  /**
   * Format phone number for international format
   */
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If number starts with 0, replace with country code
    if (cleaned.startsWith('0')) {
      cleaned = '966' + cleaned.substring(1); // Assuming Saudi Arabia (+966)
    }
    
    // If number doesn't start with +, add it
    if (!phoneNumber.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Test SMS service
   */
  async testConnection() {
    try {
      if (!this.client) {
        return { success: false, error: 'SMS service not configured' };
      }

      // Try to get account info to test connection
      const account = await this.client.api.accounts(config.sms.twilioAccountSid).fetch();
      
      return { 
        success: true, 
        message: 'SMS service is working',
        accountStatus: account.status
      };
    } catch (error) {
      logger.error('SMS service test failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check SMS balance/credits
   */
  async checkBalance() {
    try {
      if (!this.client) {
        throw new Error('SMS service not configured');
      }

      const account = await this.client.api.accounts(config.sms.twilioAccountSid).fetch();
      
      return {
        accountSid: account.sid,
        status: account.status,
        balance: account.balance,
        currency: account.currency
      };

    } catch (error) {
      logger.error('Failed to check SMS balance', error);
      throw error;
    }
  }
}

module.exports = new SMSService(); 