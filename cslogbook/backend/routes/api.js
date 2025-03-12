const express = require('express');
const router = express.Router();
const documentsRoutes = require('./documents');
const authRoutes = require('./auth/authRoutes');
const userRoutes = require('./users/userRoutes');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public routes
router.use('/auth', authRoutes);

// Protected routes - ต้องมีการ authenticate ก่อน
router.use('/documents', authenticateToken, documentsRoutes);
router.use('/users', authenticateToken, userRoutes);

module.exports = router;