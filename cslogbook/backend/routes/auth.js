const express = require('express');
const router = express.Router();
const loginLimiter = require('../middleware/rateLimiter');
const { validateLogin, login } = require('../controllers/authController');
require('./swagger/auth');

router.post('/login', loginLimiter, validateLogin, login);

module.exports = router;
