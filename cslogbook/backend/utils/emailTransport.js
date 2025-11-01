/**
 * Email Transport Factory
 * สนับสนุนผู้ให้บริการ: gmail, ethereal, console
 * 
 * Environment Variables:
 * - EMAIL_PROVIDER: gmail|ethereal|console (default: gmail)
 * - GMAIL_*: สำหรับ Gmail API (ดูที่ gmailTransport.js)
 * 
 * ใช้ในโหมด development: ตั้ง EMAIL_PROVIDER=ethereal จะได้ preview URL ไม่ส่งออกจริง
 */

const nodemailer = require('nodemailer');
const gmailTransport = require('./gmailTransport');
const logger = require('./logger');

let initialized = false;
let provider = (process.env.EMAIL_PROVIDER || 'gmail').toLowerCase(); // เปลี่ยน default เป็น gmail
let transport; // สำหรับ nodemailer หรือ wrapper object

// สร้าง transport ตาม provider
async function init() {
  if (initialized) return;
  try {
    switch (provider) {
      case 'gmail': {
        // ใช้ Gmail API transport
        await gmailTransport.initialize();
        transport = {
          sendMail: async (msg) => {
            const result = await gmailTransport.sendMail(msg);
            return {
              messageId: result.messageId,
              envelope: result.envelope,
              accepted: result.accepted,
              rejected: result.rejected
            };
          }
        };
        logger.info('Initialized Gmail API transport');
        break;
      }
      case 'ethereal': {
        const testAccount = await nodemailer.createTestAccount();
        transport = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: { user: testAccount.user, pass: testAccount.pass }
        });
        logger.info('สร้าง Ethereal test account สำเร็จ (อีเมลจะไม่ถูกส่งจริง)', { user: testAccount.user });
        break;
      }
      case 'console': {
        transport = {
          // เลียนแบบ interface ของ nodemailer.sendMail
          sendMail: async (msg) => {
            logger.info('[EMAIL-CONSOLE]', { to: msg.to, subject: msg.subject });
            return { messageId: 'console-dev', envelope: { to: [].concat(msg.to) } };
          }
        };
        logger.warn('ใช้งาน console mail transport (ไม่ส่งจริง)');
        break;
      }
      default: {
        // Fallback to console transport for unknown providers
        logger.warn(`Unknown email provider: ${provider}, using console transport`);
        transport = {
          sendMail: async (msg) => {
            logger.info('[EMAIL-CONSOLE-FALLBACK]', { to: msg.to, subject: msg.subject });
            return { messageId: 'console-fallback', envelope: { to: [].concat(msg.to) } };
          }
        };
        provider = 'console';
        break;
      }
    }

    // verify สำหรับ ethereal (ไม่ใช้กับ console)
    if (provider === 'ethereal') {
      try {
        await transport.verify();
        logger.info(`ตรวจสอบ Ethereal transport สำเร็จ`);
      } catch (e) {
        logger.warn('Ethereal verify ล้มเหลว (จะพยายามส่งต่อเมื่อมีการใช้งาน)', { error: e.message });
      }
    }
    initialized = true;
  } catch (error) {
    logger.error('เกิดข้อผิดพลาดในการ initialise email transport', { provider, error: error.message });
    // fallback เป็น console transport
    transport = {
      sendMail: async (msg) => {
        logger.info('[EMAIL-CONSOLE-FALLBACK]', { to: msg.to, subject: msg.subject });
        return { messageId: 'console-error-fallback' };
      }
    };
    initialized = true;
  }
}

async function ensureReady() { await init(); }

async function send(msg) {
  await ensureReady();
  const info = await transport.sendMail(msg);
  // Ethereal preview URL (dev helper)
  if (provider === 'ethereal') {
    try {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        logger.info('Ethereal preview URL', { preview });
      }
    } catch (_) {}
  }
  return info;
}

module.exports = { init, send, ensureReady, getProvider: () => provider };
