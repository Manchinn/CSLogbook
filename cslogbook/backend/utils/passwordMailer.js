const { sendEmailBase } = (() => {
  // เรา reuse emailTransport ผ่าน mailer เดิม: import mailer แล้วห่อ
  const emailTransport = require('./emailTransport');
  return {
    sendEmailBase: (msg) => emailTransport.send({ from: process.env.EMAIL_SENDER, ...msg })
  };
})();

const logger = require('./logger');

async function sendPasswordChangeOtpEmail(to, username, otp, ttlMinutes) {
  const html = `<div style="font-family:Arial,sans-serif">
    <h2>รหัสยืนยันเปลี่ยนรหัสผ่าน (OTP)</h2>
    <p>สวัสดีคุณ ${username || ''}</p>
    <p>รหัส OTP ของคุณคือ:</p>
    <div style="font-size:32px;font-weight:bold;letter-spacing:6px;background:#f5f5f5;padding:12px;text-align:center;border-radius:8px;">${otp}</div>
    <p>รหัสจะหมดอายุใน ${ttlMinutes} นาที หากคุณไม่ได้ร้องขอให้เพิกเฉยอีเมลนี้</p>
    <p style="color:#888;font-size:12px;margin-top:24px;">CS Logbook System</p>
  </div>`;
  try {
    await sendEmailBase({ to, subject: 'CS Logbook - OTP เปลี่ยนรหัสผ่าน', html });
  } catch (e) {
    logger.error('send_password_change_otp_failed', { to, error: e.message });
    throw e;
  }
}

async function sendPasswordChangedNotice(to, username) {
  const html = `<div style="font-family:Arial,sans-serif">
    <h2>แจ้งเตือนการเปลี่ยนรหัสผ่าน</h2>
    <p>บัญชีของคุณ (${username || ''}) มีการเปลี่ยนรหัสผ่านสำเร็จ หากไม่ใช่คุณ กรุณาติดต่อผู้ดูแลระบบทันที</p>
    <p style="color:#888;font-size:12px;margin-top:24px;">CS Logbook Security Notice</p>
  </div>`;
  try {
    await sendEmailBase({ to, subject: 'CS Logbook - แจ้งเตือนการเปลี่ยนรหัสผ่าน', html });
  } catch (e) {
    logger.warn('send_password_changed_notice_failed', { to, error: e.message });
  }
}

module.exports = { sendPasswordChangeOtpEmail, sendPasswordChangedNotice };
