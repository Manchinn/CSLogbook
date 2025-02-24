const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
require('./swagger/auth');

router.post('/login', authController.login);

module.exports = router;
