const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User, PasswordResetToken } = require('../models');
const logger = require('../utils/logger');
const { sendPasswordChangeOtpEmail, sendPasswordChangedNotice } = require('../utils/passwordMailer');

// ค่าคอนฟิก (fallback หากยังไม่ใส่ใน .env)
const OTP_LENGTH = parseInt(process.env.PASSWORD_OTP_LENGTH || '6');
const OTP_TTL_MINUTES = parseInt(process.env.PASSWORD_OTP_TTL_MINUTES || '10');
const OTP_MAX_ATTEMPTS = parseInt(process.env.PASSWORD_OTP_MAX_ATTEMPTS || '5');
const OTP_REQUEST_COOLDOWN_SECONDS = parseInt(process.env.PASSWORD_OTP_REQUEST_COOLDOWN_SECONDS || '60');
const PASSWORD_MIN_LENGTH = parseInt(process.env.PASSWORD_MIN_LENGTH || '8');
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');

// Regex policy (ปรับใหม่: a-z, A-Z, ตัวเลข และความยาว ≥8 ไม่บังคับอักขระพิเศษ)
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

class PasswordService {
  // เปลี่ยนรหัสผ่านเมื่อผู้ใช้ยืนยันรหัสผ่านเดิม
  async changePasswordInSession(userId, currentPassword, newPassword) {
    const user = await User.findOne({ where: { userId } });
    if (!user) return { success: false, statusCode: 404, message: 'ไม่พบผู้ใช้' };

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      logger.warn('wrong_current_password', { userId });
      return { success: false, statusCode: 400, message: 'ข้อมูลไม่ถูกต้อง' };
    }

    if (currentPassword === newPassword) {
      return { success: false, statusCode: 400, message: 'รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านที่เคยใช้' };
    }

    if (!PASSWORD_POLICY_REGEX.test(newPassword)) {
      return { success: false, statusCode: 400, message: 'รหัสผ่านใหม่ไม่เป็นไปตามนโยบายความปลอดภัย' };
    }

    const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.password = hashed;
    await user.save();

    logger.info('password_change_success', { userId });
    // ส่งอีเมลแจ้งเตือน (optional best effort)
    try { await sendPasswordChangedNotice(user.email, user.firstName); } catch (e) { logger.warn('send_notice_failed', { userId, error: e.message }); }

    return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
  }

  // ขอ OTP ใหม่
  async requestOtp(userId) {
    const user = await User.findOne({ where: { userId } });
    if (!user) return { success: false, statusCode: 404, message: 'ไม่พบผู้ใช้' };

    // ตรวจ cooldown: หา token ล่าสุดที่ยังไม่หมดอายุหรือเพิ่งสร้างไม่นาน
    const now = new Date();
    const cooldownCut = new Date(now.getTime() - OTP_REQUEST_COOLDOWN_SECONDS * 1000);
    const recent = await PasswordResetToken.findOne({
      where: { userId, purpose: 'PASSWORD_CHANGE' },
      order: [['id', 'DESC']]
    });
    if (recent) {
      const createdAtTs = recent.createdAt instanceof Date ? recent.createdAt.getTime() : new Date(recent.createdAt).getTime();
      if (!isNaN(createdAtTs) && createdAtTs > cooldownCut.getTime()) {
        const wait = Math.max(0, OTP_REQUEST_COOLDOWN_SECONDS - Math.floor((now - createdAtTs) / 1000));
        return { success: false, statusCode: 429, message: `โปรดลองใหม่ใน ${wait} วินาที` };
      }
    }

    // สร้าง OTP
    const otp = this._generateOtp();
    const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);

    const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60000);
    await PasswordResetToken.create({
      userId,
      purpose: 'PASSWORD_CHANGE',
      otpHash,
      expiresAt
    });

    // ส่งอีเมล
    try {
      await sendPasswordChangeOtpEmail(user.email, user.firstName, otp, OTP_TTL_MINUTES);
      logger.info('otp_sent', { userId });
    } catch (e) {
      logger.error('otp_send_failed', { userId, error: e.message });
      return { success: false, statusCode: 500, message: 'ไม่สามารถส่ง OTP ได้' };
    }

    return { success: true, message: 'ส่งรหัส OTP ไปยังอีเมลแล้ว', expiresIn: OTP_TTL_MINUTES * 60 };
  }

  // ยืนยัน OTP และเปลี่ยนรหัสผ่าน
  async confirmOtp(userId, otp, newPassword) {
    const user = await User.findOne({ where: { userId } });
    if (!user) return { success: false, statusCode: 404, message: 'ไม่พบผู้ใช้' };

    const token = await PasswordResetToken.findOne({
      where: {
        userId,
        purpose: 'PASSWORD_CHANGE',
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [['id', 'DESC']]
    });

    // ทำ dummy compare เพื่อลดข้อมูล side-channel หากไม่พบ
    const dummyHash = await bcrypt.hash('000000', BCRYPT_ROUNDS);
    let valid = false;
    if (!token) {
      await bcrypt.compare(otp, dummyHash); // consume time
    } else {
      if (token.attemptCount >= OTP_MAX_ATTEMPTS) {
        logger.warn('otp_attempt_limit_reached', { userId });
        return { success: false, statusCode: 400, message: 'OTP ไม่ถูกต้องหรือหมดอายุ' };
      }
      valid = await bcrypt.compare(otp, token.otpHash);
    }

    if (!valid || !token) {
      if (token) {
        token.attemptCount += 1;
        await token.save();
      }
      logger.warn('otp_invalid_attempt', { userId, attempt: token ? token.attemptCount : 'NA' });
      return { success: false, statusCode: 400, message: 'OTP ไม่ถูกต้องหรือหมดอายุ' };
    }

    if (!PASSWORD_POLICY_REGEX.test(newPassword)) {
      return { success: false, statusCode: 400, message: 'รหัสผ่านใหม่ไม่เป็นไปตามนโยบายความปลอดภัย' };
    }

    const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.password = hashed;
    await user.save();

    token.usedAt = new Date();
    await token.save();

    logger.info('otp_confirm_success', { userId });
    try { await sendPasswordChangedNotice(user.email, user.firstName); } catch (e) { /* ignore */ }

    return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
  }

  // ===== Two-Step Flow (current password + OTP) =====
  // ขั้นตอนที่ 1: ผู้ใช้กรอกรหัสผ่านปัจจุบัน + รหัสผ่านใหม่ -> ตรวจสอบและเก็บ hash ชั่วคราว + ส่ง OTP
  async initTwoStepChange(userId, currentPassword, newPassword) {
    const user = await User.findOne({ where: { userId } });
    if (!user) return { success: false, statusCode: 404, message: 'ไม่พบผู้ใช้' };

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      logger.warn('wrong_current_password', { userId });
      return { success: false, statusCode: 400, message: 'ข้อมูลไม่ถูกต้อง' };
    }

    if (currentPassword === newPassword) {
      return { success: false, statusCode: 400, message: 'รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านที่เคยใช้' };
    }
    if (!PASSWORD_POLICY_REGEX.test(newPassword)) {
      return { success: false, statusCode: 400, message: 'รหัสผ่านใหม่ไม่เป็นไปตามนโยบายความปลอดภัย' };
    }

    // ตรวจ cooldown การขอ OTP เหมือน requestOtp
    const now = new Date();
    const cooldownCut = new Date(now.getTime() - OTP_REQUEST_COOLDOWN_SECONDS * 1000);
    const recent = await PasswordResetToken.findOne({
      where: { userId, purpose: 'PASSWORD_CHANGE' },
      order: [['id', 'DESC']]
    });
    if (recent) {
      const createdAtTs = recent.createdAt instanceof Date ? recent.createdAt.getTime() : new Date(recent.createdAt).getTime();
      if (!isNaN(createdAtTs) && createdAtTs > cooldownCut.getTime()) {
        const wait = Math.max(0, OTP_REQUEST_COOLDOWN_SECONDS - Math.floor((now - createdAtTs) / 1000));
        return { success: false, statusCode: 429, message: `โปรดลองใหม่ใน ${wait} วินาที` };
      }
    }

    // Generate OTP + hash รหัสผ่านใหม่เก็บชั่วคราว
    const otp = this._generateOtp();
    const [otpHash, tempNewPasswordHash] = await Promise.all([
      bcrypt.hash(otp, BCRYPT_ROUNDS),
      bcrypt.hash(newPassword, BCRYPT_ROUNDS)
    ]);
    const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60000);

    await PasswordResetToken.create({
      userId,
      purpose: 'PASSWORD_CHANGE',
      otpHash,
      tempNewPasswordHash,
      expiresAt
    });

    try {
      await sendPasswordChangeOtpEmail(user.email, user.firstName, otp, OTP_TTL_MINUTES);
      logger.info('otp_sent_two_step', { userId });
    } catch (e) {
      logger.error('otp_send_failed_two_step', { userId, error: e.message });
      return { success: false, statusCode: 500, message: 'ไม่สามารถส่ง OTP ได้' };
    }

    return { success: true, message: 'ส่งรหัส OTP ไปยังอีเมลแล้ว', expiresIn: OTP_TTL_MINUTES * 60 };
  }

  // ขั้นตอนที่ 2: ผู้ใช้กรอก OTP -> ตรวจ token + นำ hash ชั่วคราวไปตั้งเป็นรหัสผ่านจริง + mark used + บังคับ logout
  async confirmTwoStepChange(userId, otp) {
    const user = await User.findOne({ where: { userId } });
    if (!user) return { success: false, statusCode: 404, message: 'ไม่พบผู้ใช้' };

    const token = await PasswordResetToken.findOne({
      where: {
        userId,
        purpose: 'PASSWORD_CHANGE',
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() },
        tempNewPasswordHash: { [Op.ne]: null }
      },
      order: [['id', 'DESC']]
    });

    const dummyHash = await bcrypt.hash('000000', BCRYPT_ROUNDS);
    let valid = false;
    if (!token) {
      await bcrypt.compare(otp, dummyHash); // timing mitigation
    } else {
      if (token.attemptCount >= OTP_MAX_ATTEMPTS) {
        logger.warn('otp_attempt_limit_reached', { userId });
        return { success: false, statusCode: 400, message: 'OTP ไม่ถูกต้องหรือหมดอายุ' };
      }
      valid = await bcrypt.compare(otp, token.otpHash);
    }

    if (!valid || !token) {
      if (token) {
        token.attemptCount += 1;
        await token.save();
      }
      logger.warn('otp_invalid_attempt_two_step', { userId });
      return { success: false, statusCode: 400, message: 'OTP ไม่ถูกต้องหรือหมดอายุ' };
    }

    // ใช้ tempNewPasswordHash ตั้งเป็นรหัสผ่านใหม่ (hash แล้วตั้งแต่ init)
    if (!token.tempNewPasswordHash) {
      return { success: false, statusCode: 400, message: 'โทเคนไม่ถูกต้อง' };
    }

    user.password = token.tempNewPasswordHash;
    await user.save();

    token.usedAt = new Date();
    await token.save();

    logger.info('two_step_password_change_success', { userId });
    try { await sendPasswordChangedNotice(user.email, user.firstName); } catch (e) { /* ignore */ }

    // ส่ง flag ให้ frontend จัดการ logout
    return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง', forceLogout: true };
  }

  _generateOtp() {
    const max = Math.pow(10, OTP_LENGTH);
    const num = Math.floor(Math.random() * max);
    return num.toString().padStart(OTP_LENGTH, '0');
  }
}

module.exports = new PasswordService();
