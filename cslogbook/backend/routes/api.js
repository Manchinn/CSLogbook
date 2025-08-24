const express = require('express');
const router = express.Router();
const documentsRoutes = require('./documents');
const authRoutes = require('./auth/authRoutes');
const userRoutes = require('./users/userRoutes');
const curriculumRoutes = require('./curriculumRoutes');
const academicRoutes = require("./academicRoutes"); // Corrected path
const internshipRoutes = require('./internshipRoutes');
const internshipCompanyStatsRoutes = require('./internshipCompanyStatsRoutes');
const emailApprovalRoutes = require('./emailApprovalRoutes');
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
router.use('/internship', internshipCompanyStatsRoutes); // ใช้ auth ที่ระดับ route ภายในไฟล์เอง

// Add routes for email approval
router.use('/email-approval', emailApprovalRoutes); // Ensure this line is present and active

module.exports = router;