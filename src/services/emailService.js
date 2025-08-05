const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      // Use SendGrid if API key is provided, otherwise use SMTP
      if (config.email.sendgridApiKey) {
        this.transporter = nodemailer.createTransporter({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: config.email.sendgridApiKey
          }
        });
        logger.info('Email service initialized with SendGrid');
      } else {
        // Fallback to SMTP (for development/testing)
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: process.env.SMTP_PORT || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        logger.info('Email service initialized with SMTP');
      }
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      throw error;
    }
  }

  /**
   * Send email with template
   */
  async sendEmail(to, subject, content, options = {}) {
    try {
      const emailId = uuidv4();
      const startTime = Date.now();

      const mailOptions = {
        from: options.from || `${config.email.fromName} <${config.email.fromEmail}>`,
        to: to,
        subject: subject,
        text: content.text,
        html: content.html,
        attachments: options.attachments || [],
        headers: {
          'X-Email-ID': emailId,
          'X-Template-Key': options.templateKey || 'custom',
          'X-User-ID': options.userId || 'system'
        }
      };

      logger.info('Sending email', {
        emailId,
        to,
        subject,
        templateKey: options.templateKey,
        userId: options.userId
      });

      const result = await this.transporter.sendMail(mailOptions);
      const deliveryTime = Date.now() - startTime;

      logger.info('Email sent successfully', {
        emailId,
        messageId: result.messageId,
        deliveryTime,
        to
      });

      return {
        success: true,
        emailId,
        messageId: result.messageId,
        deliveryTime,
        to
      };

    } catch (error) {
      logger.error('Failed to send email', {
        to,
        subject,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        to
      };
    }
  }

  /**
   * Send email from template
   */
  async sendTemplateEmail(to, templateKey, variables = {}, options = {}) {
    try {
      // Get email template from database
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findByKey(templateKey);
      
      if (!template) {
        throw new Error(`Email template not found: ${templateKey}`);
      }

      // Render template with variables
      const rendered = template.render(variables, options.language || 'en');
      
      // Send email
      return await this.sendEmail(to, rendered.subject, {
        text: rendered.text,
        html: rendered.html
      }, {
        ...options,
        templateKey
      });

    } catch (error) {
      logger.error('Failed to send template email', {
        to,
        templateKey,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails, templateKey, variables = {}, options = {}) {
    const results = [];
    const errors = [];

    for (const emailData of emails) {
      try {
        const { to, customVariables = {} } = emailData;
        const mergedVariables = { ...variables, ...customVariables };
        
        const result = await this.sendTemplateEmail(
          to, 
          templateKey, 
          mergedVariables, 
          options
        );

        results.push({
          to,
          success: result.success,
          emailId: result.emailId,
          messageId: result.messageId
        });

      } catch (error) {
        errors.push({
          to: emailData.to,
          error: error.message
        });
      }
    }

    return {
      results,
      errors,
      summary: {
        total: emails.length,
        sent: results.filter(r => r.success).length,
        failed: errors.length
      }
    };
  }

  /**
   * Verify email address
   */
  async verifyEmail(email) {
    try {
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { valid: false, reason: 'Invalid email format' };
      }

      // Check domain MX records
      const domain = email.split('@')[1];
      const dns = require('dns').promises;
      
      try {
        const mxRecords = await dns.resolveMx(domain);
        return { valid: true, mxRecords: mxRecords.length > 0 };
      } catch (error) {
        return { valid: false, reason: 'Domain not found or no MX records' };
      }

    } catch (error) {
      logger.error('Email verification failed', { email, error: error.message });
      return { valid: false, reason: 'Verification failed' };
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStatistics(timeRange = '24h') {
    try {
      // This would typically query email logs from database
      // For now, return basic stats
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        averageDeliveryTime: 0,
        successRate: 0,
        timeRange
      };
    } catch (error) {
      logger.error('Failed to get email statistics', error);
      throw error;
    }
  }

  /**
   * Test email service
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service is working' };
    } catch (error) {
      logger.error('Email service test failed', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService(); 