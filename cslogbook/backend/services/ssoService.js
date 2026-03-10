/**
 * SSO Service - บริการสำหรับจัดการ KMUTNB SSO OAuth 2.0 Flow
 */

const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

// KMUTNB SSO Endpoints
const SSO_CONFIG = {
  authorizationEndpoint: 'https://sso.kmutnb.ac.th/auth/authorize',
  tokenEndpoint: 'https://sso.kmutnb.ac.th/auth/token',
  userInfoEndpoint: 'https://sso.kmutnb.ac.th/resources/userinfo',
  issuer: 'https://sso.kmutnb.ac.th'
};

class SSOService {
  constructor() {
    this.clientId = process.env.KMUTNB_SSO_CLIENT_ID;
    this.clientSecret = process.env.KMUTNB_SSO_CLIENT_SECRET;
    this.callbackUrl = process.env.KMUTNB_SSO_CALLBACK_URL;
    this.scopes = process.env.KMUTNB_SSO_SCOPES || 'openid profile email student_info personnel_info';
  }

  /**
   * สร้าง state string สำหรับป้องกัน CSRF
   * @returns {string} state string
   */
  generateState() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * สร้าง Authorization URL สำหรับ redirect ไป KMUTNB SSO
   * @param {string} state - state string สำหรับ CSRF protection
   * @param {string} redirectPath - path ที่ต้องการ redirect หลัง login สำเร็จ
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(state, redirectPath = '/dashboard') {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      scope: this.scopes,
      state: state,
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `${SSO_CONFIG.authorizationEndpoint}?${params.toString()}`;
    
    logger.info('SSOService: Generated authorization URL', { 
      clientId: this.clientId,
      scopes: this.scopes,
      callbackUrl: this.callbackUrl
    });

    return authUrl;
  }

  /**
   * แลก Authorization Code เป็น Access Token
   * @param {string} code - Authorization code จาก SSO callback
   * @returns {Object} Token response
   */
  async exchangeCodeForToken(code) {
    try {
      logger.info('SSOService: Exchanging code for token');

      // สร้าง Basic Auth header
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(SSO_CONFIG.tokenEndpoint, 
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.callbackUrl,
          access_type: 'offline'
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
            'Accept': 'application/json'
          }
        }
      );

      // บางผู้ให้บริการอาจตอบ 200 แต่ body เป็น OAuth error
      if (response.data?.error) {
        logger.error('SSOService: Token endpoint returned OAuth error', {
          error: response.data.error,
          errorDescription: response.data.error_description
        });

        return {
          success: false,
          error: response.data.error_description || 'ไม่สามารถแลก token ได้',
          errorCode: response.data.error
        };
      }

      if (!response.data?.access_token) {
        logger.error('SSOService: Token endpoint did not return access_token', {
          tokenKeys: Object.keys(response.data || {})
        });

        return {
          success: false,
          error: 'Token response ไม่มี access_token',
          errorCode: 'missing_access_token'
        };
      }

      logger.info('SSOService: Token exchange successful');
      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      logger.error('SSOService: Token exchange failed', {
        error: error.response?.data || error.message,
        status: error.response?.status
      });

      return {
        success: false,
        error: error.response?.data?.error_description || 'ไม่สามารถแลก token ได้',
        errorCode: error.response?.data?.error
      };
    }
  }

  /**
   * ดึงข้อมูลผู้ใช้จาก SSO
   * @param {string} accessToken - Access token
   * @returns {Object} User info
   */
  async getUserInfo(accessToken) {
    try {
      if (!accessToken || typeof accessToken !== 'string') {
        logger.error('SSOService: Missing or invalid access token before userinfo request', {
          hasToken: !!accessToken,
          tokenType: typeof accessToken
        });
        return {
          success: false,
          error: 'access_token ไม่ถูกต้องหรือไม่มีค่า'
        };
      }

      logger.info('SSOService: Fetching user info from SSO');

      const response = await axios.get(SSO_CONFIG.userInfoEndpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      logger.info('SSOService: User info fetched successfully', {
        username: response.data?.profile?.username
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      logger.error('SSOService: Failed to fetch user info', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        wwwAuthenticate: error.response?.headers?.['www-authenticate']
      });

      return {
        success: false,
        error: error.response?.data?.error_description || 'ไม่สามารถดึงข้อมูลผู้ใช้ได้'
      };
    }
  }

  /**
   * แปลงข้อมูลจาก SSO เป็นรูปแบบที่ใช้ในระบบ
   * @param {Object} ssoData - ข้อมูลจาก SSO userinfo endpoint
   * @param {Object} tokenData - ข้อมูลจาก token response
   * @returns {Object} ข้อมูลผู้ใช้ที่แปลงแล้ว
   */
  mapSsoUserData(ssoData, tokenData) {
    const profile = ssoData.profile || {};
    const studentInfo = ssoData.student_info || null;
    const personnelInfo = ssoData.personnel_info || null;
    const userInfo = tokenData.user_info || {};

    // กำหนด role จาก account_type
    let role = 'student';
    const accountType = profile.account_type || userInfo.account_type;
    
    if (accountType === 'personnel' || accountType === 'templecturer') {
      role = 'teacher';
    } else if (accountType === 'student' || accountType === 'exchange_student') {
      role = 'student';
    }

    // แยกชื่อ-นามสกุล
    const displayName = profile.display_name || userInfo.display_name || '';
    const nameParts = displayName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // ดึงรหัสนักศึกษา
    let studentCode = null;
    if (studentInfo && studentInfo.student_id) {
      studentCode = studentInfo.student_id;
    }

    const mappedData = {
      username: profile.username || userInfo.username,
      email: ssoData.email || profile.email || userInfo.email || ((profile.username || userInfo.username) ? `${profile.username || userInfo.username}@${role === 'student' ? 'email.kmutnb.ac.th' : 'sci.kmutnb.ac.th'}` : null),
      firstName: firstName,
      lastName: lastName,
      displayName: displayName,
      displayNameEn: userInfo.name_en || '',
      role: role,
      accountType: accountType,
      provider: 'kmutnb',
      
      // ข้อมูลนักศึกษา
      studentCode: studentCode,
      studentInfo: studentInfo,
      
      // ข้อมูลบุคลากร
      personnelInfo: personnelInfo
    };

    logger.info('SSOService: Mapped user data', {
      username: mappedData.username,
      role: mappedData.role,
      accountType: accountType,
      hasStudentInfo: !!studentInfo,
      hasPersonnelInfo: !!personnelInfo
    });

    return mappedData;
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New token response
   */
  async refreshAccessToken(refreshToken) {
    try {
      logger.info('SSOService: Refreshing access token');

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(SSO_CONFIG.tokenEndpoint,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`,
            'Accept': 'application/json'
          }
        }
      );

      logger.info('SSOService: Token refresh successful');
      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      logger.error('SSOService: Token refresh failed', {
        error: error.response?.data || error.message
      });

      return {
        success: false,
        error: 'ไม่สามารถ refresh token ได้'
      };
    }
  }
}

module.exports = new SSOService();
