// Factory สำหรับสร้าง transport ส่งอีเมลหลายผู้ให้บริการ (SendGrid, Ethereal, SMTP, Console)
// ใช้ในโหมด development: ตั้ง EMAIL_PROVIDER=ethereal จะได้ preview URL ไม่ส่งออกจริง
// Author: migration layer เพื่อเลิกผูกกับ SendGrid โดยตรง

const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const logger = require('./logger');

let initialized = false;
let provider = (process.env.EMAIL_PROVIDER || 'sendgrid').toLowerCase();
let transport; // สำหรับ nodemailer หรือ wrapper object

// สร้าง transport ตาม provider
async function init() {
  if (initialized) return;
  try {
    switch (provider) {
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
      case 'smtp': {
        transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: (process.env.SMTP_USER && process.env.SMTP_PASS) ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            } : undefined
        });
        logger.info('Initialised generic SMTP transport');
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
      case 'sendgrid':
      default: {
        provider = 'sendgrid';
        if (!process.env.SENDGRID_API_KEY) {
          logger.warn('ไม่พบ SENDGRID_API_KEY -> fallback console transport');
          transport = {
            sendMail: async (msg) => {
              logger.info('[EMAIL-CONSOLE]', { to: msg.to, subject: msg.subject });
              return { messageId: 'console-fallback', envelope: { to: [].concat(msg.to) } };
            }
          };
        } else {
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          transport = {
            // ให้ภายนอกเรียกใช้เหมือน nodemailer
            sendMail: async (msg) => {
              const res = await sgMail.send(msg);
              const messageId = res?.[0]?.headers?.['x-message-id'];
              return { raw: res, messageId, envelope: { to: [].concat(msg.to) } };
            }
          };
          logger.info('Initialised SendGrid mail transport');
        }
        break;
      }
    }

    // verify สำหรับ SMTP/ethereal (ไม่ใช้กับ sendgrid/console)
    if (provider === 'smtp' || provider === 'ethereal') {
      try {
        await transport.verify();
        logger.info(`ตรวจสอบ SMTP (${provider}) สำเร็จ`);
      } catch (e) {
        logger.warn('SMTP verify ล้มเหลว (จะพยายามส่งต่อเมื่อมีการใช้งาน)', { error: e.message });
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
