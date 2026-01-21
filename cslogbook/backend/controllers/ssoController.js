/**
 * SSO Controller - จัดการ endpoints สำหรับ KMUTNB SSO
 */

const ssoService = require('../services/ssoService');
const authService = require('../services/authService');
const logger = require('../utils/logger');
const moment = require('moment-timezone');

// เก็บ state ชั่วคราว (ในระบบจริงควรใช้ Redis หรือ Database)
const stateStore = new Map();

// ลบ state ที่หมดอายุทุก 5 นาที
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > 10 * 60 * 1000) { // 10 นาที
      stateStore.delete(state);
    }
  }
}, 5 * 60 * 1000);

/**
 * GET /api/auth/sso/authorize
 * Redirect ผู้ใช้ไป KMUTNB SSO login page
 */
exports.authorize = async (req, res) => {
  try {
    const { redirectPath } = req.query;
    
    // สร้าง state สำหรับ CSRF protection
    const state = ssoService.generateState();
    
    // เก็บ state และ redirectPath
    stateStore.set(state, {
      redirectPath: redirectPath || '/dashboard',
      createdAt: Date.now()
    });

    // สร้าง authorization URL
    const authUrl = ssoService.getAuthorizationUrl(state, redirectPath);

    logger.info('SSO Controller: Redirecting to SSO', {
      state: state.substring(0, 10) + '...',
      redirectPath
    });

    // Redirect ไป KMUTNB SSO
    res.redirect(authUrl);

  } catch (error) {
    logger.error('SSO Controller: Authorize error', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=sso_error`);
  }
};

/**
 * GET /api/auth/sso/callback
 * รับ callback จาก KMUTNB SSO หลัง login สำเร็จ
 */
exports.callback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // ตรวจสอบ error จาก SSO
    if (error) {
      logger.error('SSO Controller: SSO returned error', { error, error_description });
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${error}`);
    }

    // ตรวจสอบ state
    const stateData = stateStore.get(state);
    if (!stateData) {
      logger.error('SSO Controller: Invalid or expired state');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
    }

    // ลบ state ที่ใช้แล้ว
    stateStore.delete(state);

    // ตรวจสอบ code
    if (!code) {
      logger.error('SSO Controller: No authorization code received');
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    logger.info('SSO Controller: Processing callback', {
      hasCode: !!code,
      state: state.substring(0, 10) + '...'
    });

    // แลก code เป็น token
    const tokenResult = await ssoService.exchangeCodeForToken(code);
    if (!tokenResult.success) {
      logger.error('SSO Controller: Token exchange failed', tokenResult.error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_error`);
    }

    const tokenData = tokenResult.data;

    // ดึงข้อมูลผู้ใช้จาก SSO
    const userInfoResult = await ssoService.getUserInfo(tokenData.access_token);
    if (!userInfoResult.success) {
      logger.error('SSO Controller: Failed to get user info', userInfoResult.error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=userinfo_error`);
    }

    // แปลงข้อมูล SSO เป็นรูปแบบที่ใช้ในระบบ
    const ssoUserData = ssoService.mapSsoUserData(userInfoResult.data, tokenData);

    // ค้นหาหรือสร้างผู้ใช้ในระบบ
    let user = await authService.findUserByUsernameAndProvider(ssoUserData.username, 'kmutnb');
    
    if (user) {
      // อัปเดตข้อมูลผู้ใช้จาก SSO
      user = await authService.updateUserFromSso(user, ssoUserData);
      logger.info('SSO Controller: Updated existing user', { userId: user.userId });
    } else {
      // ตรวจสอบว่ามี user ที่ username เดียวกันแต่ไม่ใช่ SSO หรือไม่
      const existingUser = await authService.findUserByUsername(ssoUserData.username);
      if (existingUser) {
        // Link บัญชีเดิมกับ SSO
        existingUser.ssoProvider = 'kmutnb';
        existingUser.ssoId = ssoUserData.username;
        await existingUser.save();
        user = existingUser;
        logger.info('SSO Controller: Linked existing user to SSO', { userId: user.userId });
      } else {
        // สร้างผู้ใช้ใหม่
        user = await authService.createUserFromSso(ssoUserData);
        logger.info('SSO Controller: Created new SSO user', { userId: user.userId });
      }
    }

    // ดึงข้อมูลตามบทบาท
    const roleData = await authService.getRoleSpecificData(user);

    // สร้าง JWT token ของระบบเรา
    const token = authService.generateToken(user, roleData);

    // อัปเดตเวลาเข้าสู่ระบบ
    await authService.updateLastLogin(user.userId);

    logger.info('SSO Controller: Login successful', {
      userId: user.userId,
      role: user.role,
      timestamp: moment().tz('Asia/Bangkok').format()
    });

    // สร้าง redirect URL พร้อม token
    const redirectPath = stateData.redirectPath || '/dashboard';
    
    // Redirect ไป frontend พร้อม token
    const frontendCallbackUrl = new URL('/auth/sso/callback', process.env.FRONTEND_URL);
    frontendCallbackUrl.searchParams.set('token', token);
    frontendCallbackUrl.searchParams.set('redirectPath', redirectPath);

    res.redirect(frontendCallbackUrl.toString());

  } catch (error) {
    logger.error('SSO Controller: Callback error', {
      error: error.message,
      stack: error.stack
    });
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

/**
 * GET /api/auth/sso/url
 * ส่ง authorization URL กลับมา (สำหรับ frontend ที่ต้องการ handle redirect เอง)
 */
exports.getAuthUrl = async (req, res) => {
  try {
    const { redirectPath } = req.query;
    
    const state = ssoService.generateState();
    
    stateStore.set(state, {
      redirectPath: redirectPath || '/dashboard',
      createdAt: Date.now()
    });

    const authUrl = ssoService.getAuthorizationUrl(state, redirectPath);

    res.json({
      success: true,
      authUrl
    });

  } catch (error) {
    logger.error('SSO Controller: Get auth URL error', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถสร้าง SSO URL ได้'
    });
  }
};

/**
 * GET /api/auth/sso/status
 * ตรวจสอบสถานะการเปิดใช้งาน SSO
 */
exports.getStatus = (req, res) => {
  const isEnabled = !!(
    process.env.KMUTNB_SSO_CLIENT_ID && 
    process.env.KMUTNB_SSO_CLIENT_SECRET &&
    process.env.KMUTNB_SSO_CALLBACK_URL
  );

  res.json({
    success: true,
    ssoEnabled: isEnabled,
    provider: 'KMUTNB SSO'
  });
};
