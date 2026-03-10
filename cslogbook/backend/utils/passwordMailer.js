const emailTransport = require('./emailTransport');
const { loadTemplate, wrapWithBase } = require('./mailer');
const logger = require('./logger');

function sendEmailBase(msg) {
  return emailTransport.send({ from: process.env.EMAIL_SENDER, ...msg });
}

async function sendPasswordChangeOtpEmail(to, username, otp, ttlMinutes) {
  const contentHtml = loadTemplate('passwordResetOtp', {
    username: username || '',
    otp: otp,
    ttlMinutes: ttlMinutes
  });
  const html = wrapWithBase(contentHtml, {
    headerTitle: 'ยืนยันเปลี่ยนรหัสผ่าน',
    emailTitle: 'OTP เปลี่ยนรหัสผ่าน'
  });
  try {
    await sendEmailBase({ to, subject: 'CS Logbook - OTP เปลี่ยนรหัสผ่าน', html });
  } catch (e) {
    logger.error('send_password_change_otp_failed', { to, error: e.message });
    throw e;
  }
}

async function sendPasswordChangedNotice(to, username) {
  const contentHtml = loadTemplate('passwordChanged', {
    username: username || ''
  });
  const html = wrapWithBase(contentHtml, {
    headerTitle: 'แจ้งเตือนการเปลี่ยนรหัสผ่าน',
    emailTitle: 'แจ้งเตือนการเปลี่ยนรหัสผ่าน'
  });
  try {
    await sendEmailBase({ to, subject: 'CS Logbook - แจ้งเตือนการเปลี่ยนรหัสผ่าน', html });
  } catch (e) {
    logger.warn('send_password_changed_notice_failed', { to, error: e.message });
  }
}

module.exports = { sendPasswordChangeOtpEmail, sendPasswordChangedNotice };
