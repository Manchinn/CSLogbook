const express = require('express');
const router = express.Router();
const loginLimiter = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');
const { validateLogin, login, refreshToken, logout } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Validate environment variables
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required for authentication routes');
}

// Public routes
router.post('/login', loginLimiter, validateLogin, login);

// Protected routes
router.post('/refresh-token', authenticateToken, refreshToken);
router.post('/logout', authenticateToken, logout);

// Token verification route
router.get('/verify-token', authenticateToken, (req, res) => {
    res.json({ 
        valid: true,
        user: {
            userId: req.user.userId,
            role: req.user.role,
            studentID: req.user.studentID
        }
    });
});

// KMUTNB SSO Routes
router.get('/sso/kmutnb', authController.redirectToKmutnbSso);
router.get('/sso/kmutnb/callback', authController.handleKmutnbSsoCallback);

module.exports = router;
