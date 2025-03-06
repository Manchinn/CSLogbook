const express = require('express');
const router = express.Router();
const loginLimiter = require('../middleware/rateLimiter');
const { validateLogin, login } = require('../controllers/authController');
const jwt = require('../config/jwt');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required for authentication routes');
}

router.post('/login', loginLimiter, validateLogin, login);

module.exports = router;
