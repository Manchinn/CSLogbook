const express = require('express');
const router = express.Router();
const loginLimiter = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');
const { validateLogin, login, refreshToken, logout } = require('../controllers/authController');
const passwordController = require('../controllers/passwordController');
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

// Two-step mandatory endpoints (legacy endpoints ถูกลบแล้ว)
router.post('/password/change/init', authenticateToken, passwordController.initTwoStepChange);
router.post('/password/change/confirm', authenticateToken, passwordController.confirmTwoStepChange);

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



module.exports = router;
