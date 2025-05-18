const { User, Student, Admin, Teacher } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendLoginNotification } = require('../utils/mailer');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const moment = require('moment-timezone');
const axios = require('axios');
const crypto = require('crypto');

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

        // Find user with better error handling
        const user = await User.findOne({
            where: { username, activeStatus: true }
        }).catch(err => {
            console.error('Database query error:', err);
            throw new Error('Database connection error');
        });

        if (!user) {
            logger.warn(`Failed login attempt for username: ${username}`);
            return res.status(401).json({
                success: false,
                message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            logger.warn(`Invalid password for user: ${username}`);
            return res.status(401).json({
                success: false,
                message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }

        // Get role-specific data
        let roleData = {};
        switch (user.role) {
            case 'student':
                const studentData = await Student.findOne({
                    where: { userId: user.userId },
                    attributes: ['studentCode','totalCredits', 'majorCredits', 'isEligibleInternship', 'isEligibleProject']
                });
                roleData = {
                    studentCode: studentData.studentCode,
                    totalCredits: studentData?.totalCredits || 0,
                    majorCredits: studentData?.majorCredits || 0,
                    isEligibleForInternship: studentData?.isEligibleInternship || false,
                    isEligibleForProject: studentData?.isEligibleProject || false
                };
                break;

            case 'admin':
                const adminData = await Admin.findOne({
                    where: { userId: user.userId },
                    attributes: [
                        'adminId',
                        'adminCode',
                        'responsibilities',
                        'contactExtension'
                    ]
                });
                roleData = {
                    adminId: adminData?.adminId,
                    adminCode: adminData?.adminCode,
                    responsibilities: adminData?.responsibilities || 'System Administrator',
                    contactExtension: adminData?.contactExtension,
                    isSystemAdmin: true
                };
                break;

            case 'teacher':
                const teacherData = await Teacher.findOne({
                    where: { userId: user.userId },
                    attributes: [
                        'teacherId',
                        'teacherCode',
                    ]});
                roleData = {
                    teacherId: teacherData?.teacherId,
                    teacherCode: teacherData?.teacherCode,
                    isSystemAdmin: false
                };
                break;
        }

        // Generate token with role-specific claims
        const token = jwt.sign(
            { 
                userId: user.userId, 
                role: user.role,
                studentID: user.studentID,
                isSystemAdmin: user.role === 'admin',
                department: roleData.department
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Update last login
        await User.update(
            { lastLogin: moment().tz('Asia/Bangkok').format() },
            { where: { userId: user.userId } }
        );

        // Send login notification if enabled
        if (process.env.EMAIL_LOGIN_ENABLED === 'true') {
            await sendLoginNotification(user.email, {
                firstName: user.firstName,
                time: moment().tz('Asia/Bangkok').format('LLLL')
            }).catch(error => {
                logger.error('Failed to send login notification:', error);
            });
        }

        // Log successful login
        logger.info('User logged in successfully', {
            userId: user.userId,
            role: user.role,
            timestamp: moment().tz('Asia/Bangkok').format()
        });

        // Send response
        res.json({
            success: true,
            token,
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            ...roleData
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
        const user = await User.findOne({
            where: { userId: req.user.userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const token = jwt.sign({
            userId: user.userId,
            role: user.role
        }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.json({
            success: true,
            token
        });
    } catch (error) {
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
    const state = crypto.randomBytes(16).toString('hex');
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

function mapSsoAccountTypeToRole(ssoAccountType, ssoProfile) {
    // KMUTNB account_type: personnel, student, templecturer, retirement, exchange_student, alumni, guest
    // This mapping is crucial and might need adjustment based on how KMUTNB distinguishes admins/teachers within "personnel"
    switch (ssoAccountType) {
        case 'student':
        case 'exchange_student':
            return 'student';
        case 'personnel': // This could be teacher or admin. Further checks might be needed.
            // Example: if (ssoProfile.some_admin_indicator_field === 'admin_value') return 'admin';
            return 'teacher'; // Defaulting personnel to teacher for now
        case 'templecturer':
            return 'teacher';
        // case 'alumni':
        // case 'retirement':
        // case 'guest':
        //     return 'guest'; // If you have a guest role
        default:
            console.warn(`Unknown SSO account type: ${ssoAccountType}. Defaulting to student.`);
            return 'student'; // Fallback role
    }
}

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

        // According to KMUTNB docs, user_info is part of the token response.
        // If not, or if more details are needed, fetch from KMUTNB_SSO_USERINFO_URL
        // For example:
        // const userInfoDetailed = await axios.get(KMUTNB_SSO_USERINFO_URL, {
        //     headers: { 'Authorization': `Bearer ${access_token}` }
        // });
        // const ssoProfile = userInfoDetailed.data.profile;
        // const ssoStudentData = userInfoDetailed.data.student_info;
        // const ssoPersonnelData = userInfoDetailed.data.personnel_info;
        // For now, we assume ssoUserFromTokenResponse contains what we need as per docs (username, display_name, account_type, email)

        const ssoUniqueId = ssoUserFromTokenResponse.username;
        const ssoEmail = ssoUserFromTokenResponse.email; // Check if this path is correct from actual SSO response
        const ssoDisplayName = ssoUserFromTokenResponse.display_name;
        const ssoAccountType = ssoUserFromTokenResponse.account_type;


        let user = await User.findOne({ where: { ssoProvider: 'kmutnb', ssoId: ssoUniqueId } });
        let localRole = mapSsoAccountTypeToRole(ssoAccountType, ssoUserFromTokenResponse);


        if (!user) {
            const names = ssoDisplayName.split(' ');
            const firstName = names[0];
            const lastName = names.slice(1).join(' ');

            const newUserDetails = {
                username: ssoUniqueId, // Using SSO username as local username
                email: ssoEmail,
                firstName: firstName,
                lastName: lastName,
                role: localRole,
                ssoProvider: 'kmutnb',
                ssoId: ssoUniqueId,
                activeStatus: true, // Default to active
                // Password is not set for SSO users, ensure your model allows null password or set a random one
                // password: null, // if User model allows password to be null
            };
            user = await User.create(newUserDetails);

            // Create corresponding student/teacher/admin entry
            if (localRole === 'student') {
                // Potentially fetch student_code from ssoStudentData if available and needed
                await Student.create({ userId: user.userId /*, studentCode: ssoStudentData.รหัสประจําตัวนักศึกษา */ });
            } else if (localRole === 'teacher') {
                await Teacher.create({ userId: user.userId /*, teacherCode: ... */ });
            } else if (localRole === 'admin') {
                await Admin.create({ userId: user.userId /*, adminCode: ... */ });
            }

        } else {
            // User exists, update info if necessary
            const names = ssoDisplayName.split(' ');
            user.email = ssoEmail || user.email;
            user.firstName = names[0] || user.firstName;
            user.lastName = names.slice(1).join(' ') || user.lastName;
            user.role = localRole; // Update role if it can change
            user.lastLogin = new Date();
            await user.save();
        }

        const payload = {
            userId: user.userId,
            username: user.username,
            role: user.role,
        };
        // Add studentId, teacherId, adminId to payload if needed by your frontend/authMiddleware
        if (user.role === 'student') {
            const student = await Student.findOne({ where: { userId: user.userId } });
            if (student) payload.studentId = student.studentId;
        } else if (user.role === 'teacher') {
            const teacher = await Teacher.findOne({ where: { userId: user.userId } });
            if (teacher) payload.teacherId = teacher.teacherId;
        } else if (user.role === 'admin') {
            const admin = await Admin.findOne({ where: { userId: user.userId } });
            if (admin) payload.adminId = admin.adminId;
        }


        const localToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        res.cookie('authToken', localToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: parseInt(process.env.JWT_EXPIRES_IN_SECONDS || '3600') * 1000,
        });
        res.redirect(`${FRONTEND_URL}/dashboard`); // Or a specific SSO success page

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