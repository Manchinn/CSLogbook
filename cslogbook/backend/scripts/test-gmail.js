/**
 * Gmail REST API Debug & Test Script
 * สคริปต์สำหรับ debug การส่งอีเมลผ่าน Gmail REST API ใน production
 *
 * วิธีใช้งานใน Docker:
 *   docker exec -it cslogbook-backend node scripts/test-gmail.js
 *
 * วิธีใช้งาน local:
 *   cd cslogbook/backend
 *   node scripts/test-gmail.js
 *
 * Environment variables ที่ต้องการ:
 *   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_USER_EMAIL
 *
 * ตัวเลือกเพิ่มเติม:
 *   EMAIL_TEST_RECIPIENT=other@gmail.com  — ส่งไปอีเมลอื่น (default: GMAIL_USER_EMAIL)
 *   EMAIL_TEST_SKIP_SEND=true             — ข้ามการส่งจริง ทดสอบแค่ OAuth + verify
 */

const path = require('path');

// โหลด env — production ใช้ .env.production, fallback เป็น .env.development
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const { google } = require('googleapis');

// ========================================
// Structured logging helpers
// ========================================
const PREFIX_DEBUG = '[EMAIL DEBUG]';
const PREFIX_ERROR = '[EMAIL ERROR]';
const PREFIX_OK = '[EMAIL OK]';

function logDebug(msg, data) {
  const line = `${PREFIX_DEBUG} ${msg}`;
  if (data !== undefined) {
    console.log(line, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  } else {
    console.log(line);
  }
}

function logOk(msg, data) {
  const line = `${PREFIX_OK} ${msg}`;
  if (data !== undefined) {
    console.log(line, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
  } else {
    console.log(line);
  }
}

function logError(msg, error) {
  console.error(`${PREFIX_ERROR} ${msg}`);
  if (error) {
    console.error(`${PREFIX_ERROR} Message: ${error.message || error}`);
    if (error.code) console.error(`${PREFIX_ERROR} Code: ${error.code}`);
    if (error.response?.data) {
      console.error(`${PREFIX_ERROR} Response:`, JSON.stringify(error.response.data, null, 2));
    }
    if (error.stack) {
      console.error(`${PREFIX_ERROR} Stack trace:\n${error.stack}`);
    }
  }
}

function mask(value) {
  if (!value) return '(not set)';
  if (value.length <= 8) return '****';
  return value.substring(0, 4) + '****' + value.substring(value.length - 4);
}

// ========================================
// Known error diagnostics
// ========================================
const KNOWN_ERRORS = [
  {
    pattern: /invalid_grant/i,
    diagnosis: 'Refresh token หมดอายุหรือถูก revoke — ต้องสร้าง refresh token ใหม่ที่ OAuth Playground',
  },
  {
    pattern: /unauthorized_client/i,
    diagnosis: 'Client ID/Secret ไม่ถูกต้อง หรือ OAuth consent screen ยังไม่ได้ publish',
  },
  {
    pattern: /invalid_client/i,
    diagnosis: 'Client ID หรือ Client Secret ผิด — ตรวจสอบที่ Google Cloud Console',
  },
  {
    pattern: /Invalid login|authentication failed|auth.*fail/i,
    diagnosis: 'Authentication failed — access token อาจผิดหรือ Gmail user ไม่ตรง',
  },
  {
    pattern: /Gmail.*API.*not.*enabled|accessNotConfigured|gmail.*has not been used/i,
    diagnosis: 'Gmail API ยังไม่ได้เปิดใช้งาน — ไปเปิดที่ Google Cloud Console > APIs & Services > Enable Gmail API',
  },
  {
    pattern: /insufficient.*permission|insufficientPermissions/i,
    diagnosis: 'Scope ไม่พอ — ต้องใช้ scope https://mail.google.com/ ตอนสร้าง refresh token',
  },
  {
    pattern: /ETIMEDOUT|ECONNREFUSED|ECONNRESET/i,
    diagnosis: 'ไม่สามารถเชื่อมต่อ Google API — ตรวจ network/firewall (HTTPS port 443)',
  },
  {
    pattern: /getaddrinfo|ENOTFOUND/i,
    diagnosis: 'DNS resolution failed — ตรวจสอบ network connectivity ของ container',
  },
  {
    pattern: /token.*expired/i,
    diagnosis: 'Access token หมดอายุ — refresh token จะ auto-renew แต่ถ้า refresh token หมดอายุต้องสร้างใหม่',
  },
  {
    pattern: /dailyLimitExceeded|rateLimitExceeded/i,
    diagnosis: 'Gmail API quota เต็ม — รอ 24 ชม. หรือตรวจสอบ quota ที่ Google Cloud Console',
  },
];

function diagnoseError(error) {
  const errorStr = `${error.message || ''} ${JSON.stringify(error.response?.data || '')}`;
  for (const known of KNOWN_ERRORS) {
    if (known.pattern.test(errorStr)) {
      console.error(`${PREFIX_ERROR} >>> Diagnosis: ${known.diagnosis}`);
      return;
    }
  }
  console.error(`${PREFIX_ERROR} >>> ไม่สามารถระบุสาเหตุอัตโนมัติได้ — ตรวจสอบ error message ด้านบน`);
}

// ========================================
// Main test flow
// ========================================
async function main() {
  const startTime = Date.now();

  console.log('\n============================================================');
  console.log('  Gmail REST API Email Debug Script');
  console.log('  Transport: gmail.users.messages.send (HTTPS 443)');
  console.log('  Timestamp:', new Date().toISOString());
  console.log('  Node.js:', process.version);
  console.log('  ENV file:', envFile);
  console.log('============================================================\n');

  // --------------------------------------------------
  // Step 1: Validate environment variables
  // --------------------------------------------------
  logDebug('Step 1: Validating environment variables...');

  const REQUIRED_VARS = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GMAIL_USER_EMAIL'];
  let hasMissing = false;

  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      logError(`Missing environment variable: ${varName}`);
      hasMissing = true;
    } else {
      logDebug(`  ${varName}: ${mask(value)}`);
    }
  }

  logDebug(`  EMAIL_PROVIDER: ${process.env.EMAIL_PROVIDER || '(not set, defaults to gmail)'}`);
  logDebug(`  EMAIL_SENDER: ${process.env.EMAIL_SENDER || '(not set)'}`);

  if (hasMissing) {
    logError('Cannot continue — fix missing environment variables above');
    process.exit(1);
  }

  logOk('All required environment variables are set');

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const gmailUser = process.env.GMAIL_USER_EMAIL;
  const recipient = process.env.EMAIL_TEST_RECIPIENT || gmailUser;
  const skipSend = process.env.EMAIL_TEST_SKIP_SEND === 'true';

  // --------------------------------------------------
  // Step 2: Create OAuth2 client
  // --------------------------------------------------
  logDebug('Step 2: Creating Google OAuth2 client...');

  let oauth2Client;
  try {
    oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    logOk('OAuth2 client created');
  } catch (error) {
    logError('Failed to create OAuth2 client', error);
    diagnoseError(error);
    process.exit(1);
  }

  // --------------------------------------------------
  // Step 3: Request access token
  // --------------------------------------------------
  logDebug('Step 3: Requesting access token from Google...');

  let accessToken;
  try {
    const tokenResponse = await oauth2Client.getAccessToken();
    accessToken = tokenResponse.token;

    if (!accessToken) {
      throw new Error('getAccessToken() returned null/undefined token');
    }

    logOk('Access token received');
    logDebug(`  Token prefix: ${accessToken.substring(0, 16)}...`);
    logDebug(`  Token length: ${accessToken.length} chars`);
  } catch (error) {
    logError('Failed to get access token', error);
    diagnoseError(error);
    process.exit(1);
  }

  // --------------------------------------------------
  // Step 4: Create Gmail API client
  // --------------------------------------------------
  logDebug('Step 4: Creating Gmail API client...');

  let gmail;
  try {
    gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    logOk('Gmail API client created (HTTPS, no SMTP)');
  } catch (error) {
    logError('Failed to create Gmail API client', error);
    diagnoseError(error);
    process.exit(1);
  }

  // --------------------------------------------------
  // Step 5: Verify Gmail API connection
  // --------------------------------------------------
  logDebug('Step 5: Verifying Gmail API connection (getProfile)...');

  try {
    const profile = await gmail.users.getProfile({ userId: 'me' });
    logOk('Gmail API verification success');
    logDebug(`  Email: ${profile.data.emailAddress}`);
    logDebug(`  Messages total: ${profile.data.messagesTotal}`);
    logDebug(`  Threads total: ${profile.data.threadsTotal}`);
  } catch (error) {
    logError('Gmail API verification failed', error);
    diagnoseError(error);
    process.exit(1);
  }

  // --------------------------------------------------
  // Step 6: Send test email via REST API
  // --------------------------------------------------
  if (skipSend) {
    logDebug('Step 6: SKIPPED (EMAIL_TEST_SKIP_SEND=true)');
  } else {
    logDebug(`Step 6: Sending test email to ${recipient} via Gmail REST API...`);

    try {
      const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
      const from = process.env.EMAIL_SENDER || gmailUser;
      const subject = `[CSLogbook] Gmail REST API Test — ${now}`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 500px;">
          <h2 style="color: #2d7d46;">Gmail REST API Test Passed</h2>
          <p>Email system is working correctly via Gmail REST API (HTTPS 443).</p>
          <table style="border-collapse: collapse; margin-top: 12px;">
            <tr><td style="padding: 4px 12px 4px 0; color: #666;">Timestamp</td><td>${now}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #666;">From</td><td>${from}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #666;">To</td><td>${recipient}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #666;">Transport</td><td>Gmail REST API (not SMTP)</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; color: #666;">Node.js</td><td>${process.version}</td></tr>
          </table>
          <p style="margin-top: 16px; color: #999; font-size: 12px;">CSLogbook Email Debug Script</p>
        </div>
      `;

      // สร้าง RFC 2822 message
      const boundary = `boundary_${Date.now()}`;
      const rawMessage = [
        `From: ${from}`,
        `To: ${recipient}`,
        `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(`Gmail REST API test successful. Timestamp: ${now}`).toString('base64'),
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        Buffer.from(html).toString('base64'),
        '',
        `--${boundary}--`,
      ].join('\r\n');

      // base64url encode
      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      logDebug('  Raw message built, sending via gmail.users.messages.send...');

      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage }
      });

      logOk('Email sent successfully!');
      logDebug(`  Gmail Message ID: ${res.data.id}`);
      logDebug(`  Thread ID: ${res.data.threadId}`);
      logDebug(`  Labels: ${JSON.stringify(res.data.labelIds)}`);
    } catch (error) {
      logError('Failed to send test email', error);
      diagnoseError(error);
      process.exit(1);
    }
  }

  // --------------------------------------------------
  // Summary
  // --------------------------------------------------
  const elapsed = Date.now() - startTime;
  console.log('\n============================================================');
  console.log(`  All steps completed in ${elapsed}ms`);
  console.log('  Transport: Gmail REST API (HTTPS 443, no SMTP)');
  console.log('  Check inbox (and spam folder) for:', recipient);
  console.log('============================================================\n');

  process.exit(0);
}

// Run
main().catch((error) => {
  logError('Unhandled error in test script', error);
  diagnoseError(error);
  process.exit(1);
});
