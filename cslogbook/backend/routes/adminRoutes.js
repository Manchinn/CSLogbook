const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const studentController = require('../controllers/studentController');
const teacherController = require('../controllers/teacherController');
// เพิ่ม import documentController
const documentController = require('../controllers/documents/documentController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

// Middleware for admin routes
const adminAuth = [authenticateToken, checkRole(['admin'])];

// Main dashboard stats
router.get('/stats', adminAuth, async (req, res, next) => {
  console.log('Admin stats request received');
  try {
    await adminController.getStats(req, res);
  } catch (error) {
    console.error('Route error:', error);
    next(error);
  }
});

// Individual stats routes
router.get('/stats/students', adminAuth, adminController.getStudentStats);
router.get('/stats/documents', adminAuth, adminController.getDocumentStats);
router.get('/stats/system', adminAuth, adminController.getSystemStats);

// เพิ่ม route สำหรับกิจกรรมล่าสุด
router.get('/activities', adminAuth, adminController.getRecentActivities);

// === เพิ่ม Admin Document Routes ===
router.get('/documents', adminAuth, documentController.getDocuments);
router.get('/documents/:id', adminAuth, documentController.getDocumentById);
router.post('/documents/:id/approve', adminAuth, documentController.approveDocument);
router.post('/documents/:id/reject', adminAuth, documentController.rejectDocument);
router.patch('/documents/:id/status', adminAuth, documentController.updateDocumentStatus);

// === เพิ่ม Admin Student Routes ===
router.get('/students', adminAuth, studentController.getAllStudents);
router.get('/students/stats', adminAuth, studentController.getAllStudentStats);
router.get('/students/:id', adminAuth, studentController.getStudentById); // Parameter route after
router.post('/students', adminAuth, studentController.addStudent);
router.put('/students/:id', adminAuth, studentController.updateStudent);
router.delete('/students/:id', adminAuth, studentController.deleteStudent);

// === เพิ่ม Admin Teacher Routes ===
router.get('/teachers', adminAuth, teacherController.getAllTeachers);
router.post('/teachers', adminAuth, teacherController.addTeacher);
router.get('/teachers/:id', adminAuth, teacherController.getTeacherById);
router.put('/teachers/:id', adminAuth, teacherController.updateTeacher);
router.delete('/teachers/:id', adminAuth, teacherController.deleteTeacher);

module.exports = router;