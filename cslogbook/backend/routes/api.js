const express = require('express');
const router = express.Router();
const documentsRoutes = require('./documents');
const authRoutes = require('./auth/authRoutes');
const userRoutes = require('./users/userRoutes');
const curriculumRoutes = require('./curriculumRoutes');
const academicRoutes = require("./routes/academicRoutes");
const internshipRoutes = require('./internshipRoutes'); // เพิ่มการนำเข้า internshipRoutes
const { authenticateToken } = require('../middleware/authMiddleware');
const curriculumController = require('../controllers/curriculumController'); // เพิ่มการนำเข้า curriculumController

// Public routes
router.use('/auth', authRoutes);

// Protected routes - ต้องมีการ authenticate ก่อน
router.use('/documents', authenticateToken, documentsRoutes);
router.use('/users', authenticateToken, userRoutes);

// เชื่อมต่อ routes สำหรับหลักสูตร (ยังคงต้อง authenticate)
router.use('/curriculums', authenticateToken, curriculumRoutes);
router.use('/academic', authenticateToken, academicRoutes);

// เพิ่ม routes สำหรับการฝึกงาน
router.use('/internship', authenticateToken, internshipRoutes);

module.exports = router;