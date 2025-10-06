const passwordService = require('../services/passwordService');
const logger = require('../utils/logger');

// In-session password change
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }
    const result = await passwordService.changePasswordInSession(req.user.userId, currentPassword, newPassword);
    return res.status(result.statusCode || (result.success ? 200 : 400)).json(result);
  } catch (e) {
    logger.error('changePassword_error', { error: e.message, stack: e.stack });
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในระบบ' });
  }
};

// Request OTP
exports.requestOtp = async (req, res) => {
  try {
    const result = await passwordService.requestOtp(req.user.userId);
    return res.status(result.statusCode || (result.success ? 200 : 400)).json(result);
  } catch (e) {
    logger.error('requestOtp_error', { error: e.message, stack: e.stack });
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในระบบ' });
  }
};

// Confirm OTP
exports.confirmOtp = async (req, res) => {
  try {
    const { otp, newPassword } = req.body || {};
    if (!otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }
    const result = await passwordService.confirmOtp(req.user.userId, otp, newPassword);
    return res.status(result.statusCode || (result.success ? 200 : 400)).json(result);
  } catch (e) {
    logger.error('confirmOtp_error', { error: e.message, stack: e.stack });
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในระบบ' });
  }
};

// Two-step: init change (currentPassword + newPassword -> send OTP)
exports.initTwoStepChange = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }
    const result = await passwordService.initTwoStepChange(req.user.userId, currentPassword, newPassword);
    return res.status(result.statusCode || (result.success ? 200 : 400)).json(result);
  } catch (e) {
    logger.error('initTwoStepChange_error', { error: e.message, stack: e.stack });
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในระบบ' });
  }
};

// Two-step: confirm OTP (no newPassword needed; already stored hashed)
exports.confirmTwoStepChange = async (req, res) => {
  try {
    const { otp } = req.body || {};
    if (!otp) {
      return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }
    const result = await passwordService.confirmTwoStepChange(req.user.userId, otp);
    return res.status(result.statusCode || (result.success ? 200 : 400)).json(result);
  } catch (e) {
    logger.error('confirmTwoStepChange_error', { error: e.message, stack: e.stack });
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในระบบ' });
  }
};
