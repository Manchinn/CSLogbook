/**
 * Gmail API Transport สำหรับการส่งอีเมลผ่าน Gmail REST API
 * ใช้ OAuth2 authentication + gmail.users.messages.send (HTTPS port 443)
 * ไม่ใช้ SMTP — หลีกเลี่ยงปัญหา VPS block port 465/587
 */

const { google } = require('googleapis');
const logger = require('./logger');

class GmailTransport {
  constructor() {
    this.gmail = null;
    this.oauth2Client = null;
    this.initialized = false;
  }

  /**
   * สร้าง OAuth2 client และ Gmail API instance
   */
  async initialize() {
    if (this.initialized) return;

    try {
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
        'https://developers.google.com/oauthplayground'
      );

      this.oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
      });

      // สร้าง Gmail API instance
      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // ทดสอบการเชื่อมต่อด้วย getProfile
      await this.verify();

      this.initialized = true;
      logger.info('Gmail transport initialized successfully (REST API)', {
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
   * สร้าง RFC 2822 message string จาก mailOptions
   */
  _buildRawMessage(mailOptions) {
    const from = mailOptions.from || process.env.GMAIL_USER_EMAIL;
    const to = [].concat(mailOptions.to).join(', ');
    const subject = mailOptions.subject || '';
    const html = mailOptions.html || '';
    const text = mailOptions.text || '';

    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const headers = [
      `From: ${from}`,
      `To: ${to}`,
    ];

    if (mailOptions.cc) {
      headers.push(`Cc: ${[].concat(mailOptions.cc).join(', ')}`);
    }
    if (mailOptions.bcc) {
      headers.push(`Bcc: ${[].concat(mailOptions.bcc).join(', ')}`);
    }

    headers.push(
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
    );

    const parts = [];

    // text/plain part
    if (text) {
      parts.push(
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(text).toString('base64'),
        '',
      );
    }

    // text/html part
    if (html) {
      parts.push(
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(html).toString('base64'),
        '',
      );
    }

    parts.push(`--${boundary}--`);

    return headers.join('\r\n') + '\r\n' + parts.join('\r\n');
  }

  /**
   * ส่งอีเมลผ่าน Gmail REST API
   */
  async sendMail(mailOptions) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const rawMessage = this._buildRawMessage(mailOptions);

      // base64url encode
      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      const toList = [].concat(mailOptions.to);
      const messageId = res.data.id;

      logger.info('Email sent successfully via Gmail REST API', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        messageId
      });

      return {
        messageId,
        envelope: { from: mailOptions.from || process.env.GMAIL_USER_EMAIL, to: toList },
        accepted: toList,
        rejected: []
      };

    } catch (error) {
      logger.error('Failed to send email via Gmail REST API:', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบสถานะการเชื่อมต่อด้วย Gmail API getProfile
   */
  async verify() {
    try {
      if (!this.gmail) {
        throw new Error('Gmail API instance not created yet');
      }
      const profile = await this.gmail.users.getProfile({ userId: 'me' });
      logger.info('Gmail API connection verified', {
        emailAddress: profile.data.emailAddress
      });
      return true;
    } catch (error) {
      logger.error('Gmail API verification failed:', error);
      throw error;
    }
  }

  /**
   * ปิดการเชื่อมต่อ
   */
  close() {
    this.gmail = null;
    this.oauth2Client = null;
    this.initialized = false;
    logger.info('Gmail transport closed');
  }
}

// สร้าง singleton instance
const gmailTransport = new GmailTransport();

module.exports = gmailTransport;
