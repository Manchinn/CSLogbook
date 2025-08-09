const authService = require('../services/authService');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const moment = require('moment-timezone');
const axios = require('axios');

// Login validation middleware
exports.validateLogin = [
    body('username')
        .trim()
        .notEmpty().withMessage('กรุณากรอกชื่อผู้ใช้')
        .isLength({ min: 3 }).withMessage('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'),
    body('password')
        .notEmpty().withMessage('กรุณากรอกรหัสผ่าน')
        .isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
];

exports.login = async (req, res) => {
    try {
        // Add debug logging
        console.log('Login attempt:', {
            username: req.body.username,
            timestamp: moment().tz('Asia/Bangkok').format()
        });

        // Validate request body
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { username, password } = req.body;

        // Use authService for complete authentication
        const result = await authService.authenticateUser(username, password);

        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: false,
                message: result.message
            });
        }

        // Log successful login
        logger.info('User logged in successfully', {
            userId: result.data.userId,
            role: result.data.role,
            timestamp: moment().tz('Asia/Bangkok').format()
        });

        // Send response
        res.json({
            success: true,
            token: result.data.token,
            userId: result.data.userId,
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            email: result.data.email,
            role: result.data.role,
            teacherType: result.data.teacherType, // เพิ่ม teacherType
            ...result.data
        });

    } catch (error) {
        // Enhanced error logging
        console.error('Login error details:', {
            message: error.message,
            stack: error.stack,
            time: moment().tz('Asia/Bangkok').format()
        });

        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'development' 
                ? `เกิดข้อผิดพลาด: ${error.message}`
                : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
        });
    }
};

// Refresh token handler
exports.refreshToken = async (req, res) => {
    try {
        const result = await authService.refreshUserToken(req.user.userId);

        if (!result.success) {
            return res.status(result.statusCode || 500).json({
                success: false,
                message: result.message
            });
        }

        res.json({
            success: true,
            token: result.data.token
        });
    } catch (error) {
        logger.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Logout handler
exports.logout = async (req, res) => {
    // Add logout logic here if needed
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

// KMUTNB SSO Configuration (should be moved to process.env and config files)
const KMUTNB_SSO_CLIENT_ID = process.env.KMUTNB_SSO_CLIENT_ID;
const KMUTNB_SSO_CLIENT_SECRET = process.env.KMUTNB_SSO_CLIENT_SECRET;
const KMUTNB_SSO_REDIRECT_URI = process.env.KMUTNB_SSO_REDIRECT_URI; // e.g., http://localhost:5000/api/auth/sso/kmutnb/callback
const KMUTNB_SSO_AUTHORIZE_URL = process.env.KMUTNB_SSO_AUTHORIZE_URL || 'https://sso.kmutnb.ac.th/auth/authorize';
const KMUTNB_SSO_TOKEN_URL = process.env.KMUTNB_SSO_TOKEN_URL || 'https://sso.kmutnb.ac.th/auth/token';
const KMUTNB_SSO_USERINFO_URL = process.env.KMUTNB_SSO_USERINFO_URL || 'https://sso.kmutnb.ac.th/resources/userinfo';
const KMUTNB_SSO_SCOPES = process.env.KMUTNB_SSO_SCOPES || 'profile email student_info personnel_info'; // Added personnel_info
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'; // Adjust to your frontend URL

exports.redirectToKmutnbSso = (req, res) => {
    if (!KMUTNB_SSO_CLIENT_ID || !KMUTNB_SSO_REDIRECT_URI) {
        console.error('KMUTNB SSO Client ID or Redirect URI is not configured.');
        return res.status(500).json({ message: 'SSO configuration error.' });
    }
    
    const state = authService.generateSsoState();
    if (req.session) {
        req.session.ssoState = state;
    } else {
        // Fallback or error if session is not available
        console.warn('Session not available for SSO state. This is insecure.');
        // Consider an alternative way to pass/verify state if sessions are not used for all routes.
    }

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: KMUTNB_SSO_CLIENT_ID,
        redirect_uri: KMUTNB_SSO_REDIRECT_URI,
        scope: KMUTNB_SSO_SCOPES,
        state: state,
    });
    res.redirect(`${KMUTNB_SSO_AUTHORIZE_URL}?${params.toString()}`);
};

exports.handleKmutnbSsoCallback = async (req, res) => {
    const { code, state } = req.query;
    const storedState = req.session ? req.session.ssoState : null;

    if (!code) {
        return res.status(400).redirect(`${FRONTEND_URL}/login?error=sso_no_code&message=Authorization code not received.`);
    }
    // For security, state should always be checked if session was available
    if (req.session && (!state || state !== storedState)) {
        console.error("SSO State mismatch. Potential CSRF attack.");
        return res.status(400).redirect(`${FRONTEND_URL}/login?error=sso_state_mismatch&message=Invalid state parameter.`);
    }
    if (req.session) {
        req.session.ssoState = null; // Clear state
    }

    try {
        const tokenRequestBody = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: KMUTNB_SSO_REDIRECT_URI,
        });

        const tokenResponse = await axios.post(KMUTNB_SSO_TOKEN_URL, tokenRequestBody.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${KMUTNB_SSO_CLIENT_ID}:${KMUTNB_SSO_CLIENT_SECRET}`).toString('base64')}`,
            },
        });

        const { access_token, user_info: ssoUserFromTokenResponse } = tokenResponse.data;
        
        const ssoUniqueId = ssoUserFromTokenResponse.username;
        const ssoEmail = ssoUserFromTokenResponse.email;
        const ssoDisplayName = ssoUserFromTokenResponse.display_name;
        const ssoAccountType = ssoUserFromTokenResponse.account_type;        // Map SSO account type to local role using authService
        const localRole = authService.mapSsoAccountTypeToRole(ssoAccountType, ssoUserFromTokenResponse);

        // Find user using authService
        let user = await authService.findUserByUsernameAndProvider(ssoUniqueId, 'kmutnb');

        if (!user) {
            // Create new user using authService
            user = await authService.createUserFromSso({
                username: ssoUniqueId,
                email: ssoEmail,
                displayName: ssoDisplayName,
                role: localRole,
                provider: 'kmutnb'
            });
        } else {
            // Update existing user using authService
            user = await authService.updateUserFromSso(user, {
                email: ssoEmail,
                displayName: ssoDisplayName,
                role: localRole
            });
        }

        // Generate token using authService
        const roleData = await authService.getRoleSpecificData(user);
        const localToken = authService.generateToken(user, roleData);

        res.cookie('authToken', localToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: parseInt(process.env.JWT_EXPIRES_IN_SECONDS || '3600') * 1000,
        });
        res.redirect(`${FRONTEND_URL}/dashboard`);

    } catch (error) {
        console.error('SSO Callback Error:', error.response ? error.response.data : error.message, error.stack);
        let errorMessage = 'SSO processing failed.';
        if (error.response && error.response.data && error.response.data.error_description) {
            errorMessage = error.response.data.error_description;
        } else if (error.response && error.response.data && error.response.data.error) {
            errorMessage = error.response.data.error;
        }
        res.status(500).redirect(`${FRONTEND_URL}/login?error=sso_processing_failed&message=${encodeURIComponent(errorMessage)}`);
    }
};