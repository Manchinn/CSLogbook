/**
 * Gmail API Transport สำหรับการส่งอีเมลผ่าน Gmail API
 * ใช้ OAuth2 authentication และ nodemailer
 */

const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const logger = require('./logger');

class GmailTransport {
  constructor() {
    this.transporter = null;
    this.oauth2Client = null;
    this.initialized = false;
  }

  /**
   * สร้าง OAuth2 client และ transporter
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // ตรวจสอบ environment variables ที่จำเป็น
      const requiredEnvs = [
        'GMAIL_CLIENT_ID',
        'GMAIL_CLIENT_SECRET', 
        'GMAIL_REFRESH_TOKEN',
        'GMAIL_USER_EMAIL'
      ];

      for (const env of requiredEnvs) {
        if (!process.env[env]) {
          throw new Error(`Missing required environment variable: ${env}`);
        }
      }

      // สร้าง OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground' // redirect URL
      );

      // ตั้งค่า refresh token
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
      });

      // สร้าง transporter
      this.transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GMAIL_USER_EMAIL,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          accessToken: await this.getAccessToken()
        }
      });

      // ทดสอบการเชื่อมต่อ
      await this.transporter.verify();
      
      this.initialized = true;
      logger.info('Gmail transport initialized successfully', {
        user: process.env.GMAIL_USER_EMAIL
      });

    } catch (error) {
      logger.error('Failed to initialize Gmail transport:', error);
      throw error;
    }
  }

  /**
   * ดึง access token จาก refresh token
   */
  async getAccessToken() {
    try {
      const { token } = await this.oauth2Client.getAccessToken();
      return token;
    } catch (error) {
      logger.error('Failed to get Gmail access token:', error);
      throw error;
    }
  }

  /**
   * ส่งอีเมล
   */
  async sendMail(mailOptions) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // รีเฟรช access token ก่อนส่งอีเมล
      const accessToken = await this.getAccessToken();
      this.transporter.set('oauth2_provision_cb', (user, renew, callback) => {
        callback(null, accessToken);
      });

      const result = await this.transporter.sendMail({
        ...mailOptions,
        from: mailOptions.from || process.env.GMAIL_USER_EMAIL
      });

      logger.info('Email sent successfully via Gmail API', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        messageId: result.messageId
      });

      return {
        messageId: result.messageId,
        envelope: result.envelope,
        accepted: result.accepted,
        rejected: result.rejected
      };

    } catch (error) {
      logger.error('Failed to send email via Gmail API:', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบสถานะการเชื่อมต่อ
   */
  async verify() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      return await this.transporter.verify();
    } catch (error) {
      logger.error('Gmail transport verification failed:', error);
      throw error;
    }
  }

  /**
   * ปิดการเชื่อมต่อ
   */
  close() {
    if (this.transporter) {
      this.transporter.close();
      this.initialized = false;
      logger.info('Gmail transport closed');
    }
  }
}

// สร้าง singleton instance
const gmailTransport = new GmailTransport();

module.exports = gmailTransport;