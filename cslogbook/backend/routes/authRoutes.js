const express = require('express');
const router = express.Router();
const loginLimiter = require('../middleware/rateLimiter');
const { validateLogin, login, refreshToken } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const jwt = require('../config/jwt');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required for authentication routes');
}

router.post('/login', loginLimiter, validateLogin, login);

router.post('/refresh-token', authenticateToken, refreshToken);

router.post('/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
