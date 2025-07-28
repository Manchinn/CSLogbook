const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const studentController = require('../controllers/studentController');
const teacherController = require('../controllers/teacherController');
// เพิ่ม import documentController
const documentController = require('../controllers/documents/documentController');
const curriculumController = require('../controllers/curriculumController');
const academacController = require('../controllers/academicController');
const notificationSettingsController = require('../controllers/notificationSettingsController');
// เพิ่ม import controller ใหม่สำหรับ workflow step definitions
const workflowStepDefinitionController = require('../controllers/workflowStepDefinitionController');
const importantDeadlineController = require('../controllers/importantDeadlineController');
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
router.get('/documents/:id/view', adminAuth, documentController.viewDocument); // เพิ่ม route สำหรับดู PDF
router.get('/documents/:id/download', adminAuth, documentController.downloadDocument); // เพิ่ม route สำหรับดาวน์โหลด PDF

// ✅ เพิ่ม Certificate Management Routes ใหม่
// === เพิ่ม Certificate Management Routes ===
router.get('/certificate-requests', adminAuth, documentController.getCertificateRequests);
router.post('/certificate-requests/:requestId/approve', adminAuth, documentController.approveCertificateRequest);
router.post('/certificate-requests/:requestId/reject', adminAuth, documentController.rejectCertificateRequest);
router.get('/certificate-requests/:requestId/download', adminAuth, documentController.downloadCertificateForAdmin);
router.post('/notify-student', adminAuth, documentController.notifyStudent);

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

// === เพิ่ม Admin Curriculum Routes ===
router.get('/curriculums', adminAuth, curriculumController.getCurriculums);
router.get('/curriculums/:id', adminAuth, curriculumController.getCurriculumById);
router.post('/curriculums', adminAuth, curriculumController.createCurriculum);
router.put('/curriculums/:id', adminAuth, curriculumController.updateCurriculum);
router.delete('/curriculums/:id', adminAuth, curriculumController.deleteCurriculum);

// === เพิ่ม Admin Academic Routes ===
router.get('/academic', adminAuth, academacController.getAcademicSettings);
router.post('/academic', adminAuth, academacController.createAcademicSettings);
router.put('/academic', adminAuth, academacController.updateAcademicSettings);  
router.delete('/academic/:id', adminAuth, academacController.deleteAcademicSettings);

// === เพิ่ม Admin Workflow Step Definition Routes ===
// ดึงรายการขั้นตอน workflow ทั้งหมด (สำหรับจัดการ)
router.get('/workflow-steps', adminAuth, workflowStepDefinitionController.getAllSteps);
// ดึงข้อมูลขั้นตอนเฉพาะรายการ
router.get('/workflow-steps/:stepId', adminAuth, workflowStepDefinitionController.getStepById);
// ดูสถิติการใช้งานขั้นตอน
router.get('/workflow-steps/:stepId/stats', adminAuth, workflowStepDefinitionController.getStepUsageStats);
// สร้างขั้นตอนใหม่
router.post('/workflow-steps', adminAuth, workflowStepDefinitionController.createStep);
// จัดเรียงลำดับขั้นตอนใหม่
router.post('/workflow-steps/reorder', adminAuth, workflowStepDefinitionController.reorderSteps);
// อัปเดตขั้นตอน
router.put('/workflow-steps/:stepId', adminAuth, workflowStepDefinitionController.updateStep);
// ลบขั้นตอน
router.delete('/workflow-steps/:stepId', adminAuth, workflowStepDefinitionController.deleteStep);

// === เพิ่ม Admin Notification Settings Routes ===
router.get('/notification-settings', adminAuth, notificationSettingsController.getAllNotificationSettings);
router.put('/notification-settings/toggle', adminAuth, notificationSettingsController.toggleNotification);
router.put('/notification-settings/enable-all', adminAuth, notificationSettingsController.enableAllNotifications);
router.put('/notification-settings/disable-all', adminAuth, notificationSettingsController.disableAllNotifications);

// === เพิ่ม Admin Important Deadline Routes ===
router.get('/important-deadlines', adminAuth, importantDeadlineController.getAll);
router.post('/important-deadlines', adminAuth, importantDeadlineController.create);
router.put('/important-deadlines/:id', adminAuth, importantDeadlineController.update);
router.delete('/important-deadlines/:id', adminAuth, importantDeadlineController.remove);

// === เพิ่ม Admin Eligibility Update Routes ===
router.post('/eligibility/update-all', adminAuth, adminController.updateAllStudentsEligibility);
router.post('/eligibility/update/:studentCode', adminAuth, adminController.updateStudentEligibility);

module.exports = router;