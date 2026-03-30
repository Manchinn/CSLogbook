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
const agentStatusController = require('../controllers/agentStatusController');
const projectManagementController = require('../controllers/projectManagementController');
const projectReportController = require('../controllers/projectReportController');
const internshipAdminController = require('../controllers/internshipAdminController');
const { authenticateToken } = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const {
  academicScheduleRules,
  updateAcademicSettingsRules,
  idParamRules,
} = require('../validators/academicValidators');


// Middleware for admin routes - รองรับทั้ง admin และ teacher support
const adminAuth = [authenticateToken, authorize('admin', 'access')];

// 🆕 Project workflow state dashboard
const projectWorkflowStateController = require('../controllers/projectWorkflowStateController');
router.get('/dashboard/project-statistics', adminAuth, projectWorkflowStateController.getAdminDashboardStatistics);

// 🆕 Project Report Routes (รายงานธุรการ)
router.get('/reports/project/administrative', adminAuth, projectReportController.getAdministrativeReport);
router.get('/reports/project/project1', adminAuth, projectReportController.getProject1Statistics);
router.get('/reports/project/project2', adminAuth, projectReportController.getProject2Statistics);
router.get('/reports/project/students-by-status', adminAuth, projectReportController.getStudentsByStatus);
router.get('/reports/project/exam-trends', adminAuth, projectReportController.getExamTrends);

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
router.get('/documents/export', adminAuth, documentController.exportDocuments);
router.get('/documents', adminAuth, documentController.getDocuments);
router.get('/documents/:id', adminAuth, documentController.getDocumentById);
router.post('/documents/:id/approve', adminAuth, documentController.approveDocument);
router.post('/documents/:id/reject', adminAuth, documentController.rejectDocument);
router.patch('/documents/:id/status', adminAuth, documentController.updateDocumentStatus);
router.get('/documents/:id/view', adminAuth, documentController.viewDocument); // เพิ่ม route สำหรับดู PDF
router.get('/documents/:id/download', adminAuth, documentController.downloadDocument); // เพิ่ม route สำหรับดาวน์โหลด PDF

// ✅ เพิ่ม Certificate Management Routes ใหม่
// === เพิ่ม Certificate Management Routes ===
router.get('/certificate-requests/export', adminAuth, documentController.exportCertificateRequests);
router.get('/certificate-requests', adminAuth, documentController.getCertificateRequests);
router.get('/certificate-requests/:requestId/detail', adminAuth, documentController.getCertificateRequestDetail);
router.post('/certificate-requests/:requestId/approve', adminAuth, documentController.approveCertificateRequest);
router.post('/certificate-requests/:requestId/reject', adminAuth, documentController.rejectCertificateRequest);
router.get('/certificate-requests/:requestId/download', adminAuth, documentController.downloadCertificateForAdmin);
router.post('/notify-student', adminAuth, documentController.notifyStudent);

// ✅ Internship Summary (Admin)
router.get('/internships/:internshipId/summary', adminAuth, documentController.getInternshipSummary);
// 🆕 Full logbook summary & PDF (admin)
router.get('/internships/:internshipId/logbook-summary', adminAuth, documentController.getInternshipLogbookSummary);
router.get('/internships/:internshipId/logbook-summary/pdf', adminAuth, documentController.previewInternshipLogbookSummaryPDF);
router.get('/internships/:internshipId/logbook-summary/pdf/download', adminAuth, documentController.downloadInternshipLogbookSummaryPDF);

// === Internship Management Routes (Admin) ===
// ดึงรายการนักศึกษาทั้งหมดพร้อมข้อมูลการฝึกงาน
router.get('/internships/students', adminAuth, internshipAdminController.getAllInternshipStudents);
// อัพเดทข้อมูลการฝึกงาน
router.put('/internships/:internshipId', adminAuth, internshipAdminController.updateInternship);
// ยกเลิกการฝึกงาน
router.post('/internships/:internshipId/cancel', adminAuth, internshipAdminController.cancelInternship);

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
router.get('/curriculums/mappings', adminAuth, curriculumController.getCurriculumMappings);
router.get('/curriculums/:id', adminAuth, curriculumController.getCurriculumById);
router.post('/curriculums', adminAuth, curriculumController.createCurriculum);
router.put('/curriculums/:id', adminAuth, curriculumController.updateCurriculum);
router.delete('/curriculums/:id', adminAuth, curriculumController.deleteCurriculum);

// === เพิ่ม Admin Academic Routes ===
router.get('/academic', adminAuth, academacController.getAcademicSettings);
router.post('/academic', adminAuth, academicScheduleRules, academacController.createAcademicSettings);
router.put('/academic', adminAuth, updateAcademicSettingsRules, academacController.updateAcademicSettings);
router.delete('/academic/:id', adminAuth, idParamRules, academacController.deleteAcademicSettings);
router.get('/academic/schedules', adminAuth, academacController.listAcademicSchedules);
router.get('/academic/schedules/:id', adminAuth, idParamRules, academacController.getAcademicScheduleById);
router.post('/academic/schedules', adminAuth, academicScheduleRules, academacController.createAcademicSchedule);
router.put('/academic/schedules/:id', adminAuth, idParamRules, academicScheduleRules, academacController.updateAcademicSchedule);
router.post('/academic/schedules/:id/activate', adminAuth, idParamRules, academacController.activateAcademicSchedule);

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
router.get('/important-deadlines/export', adminAuth, importantDeadlineController.exportAcademicDeadlines);
router.get('/important-deadlines', adminAuth, importantDeadlineController.getAll);
router.post('/important-deadlines', adminAuth, importantDeadlineController.create);
router.put('/important-deadlines/:id', adminAuth, importantDeadlineController.update);
router.patch('/important-deadlines/:id/policy', adminAuth, importantDeadlineController.updatePolicy); // ปรับเฉพาะ policy
router.get('/important-deadlines/:id/stats', adminAuth, importantDeadlineController.getStats); // ดูสถิติการส่งเอกสาร
router.delete('/important-deadlines/:id', adminAuth, importantDeadlineController.remove);

// === เพิ่ม Admin Eligibility Update Routes ===
router.post('/eligibility/update-all', adminAuth, adminController.updateAllStudentsEligibility);
router.post('/eligibility/update/:studentCode', adminAuth, adminController.updateStudentEligibility);

// === เพิ่ม Admin Agent Status Routes ===
router.get('/agent-status', adminAuth, agentStatusController.getAgentSystemStatus);
router.get('/agent-status/notifications', adminAuth, agentStatusController.getAgentNotificationStats);
router.get('/agent-status/email-stats', adminAuth, agentStatusController.getEmailStats);
router.post('/agent-status/:agentName/restart', adminAuth, agentStatusController.restartAgent);

// === Project Management Routes ===
// ค้นหานักศึกษา
router.get('/projects/student/:studentCode', adminAuth, projectManagementController.findStudentByCode);

// จัดการโครงงานพิเศษ
router.get('/projects', adminAuth, projectManagementController.getAllProjects);
router.post('/projects/manual', adminAuth, projectManagementController.createProjectManually);
router.post('/projects/create-manually', adminAuth, projectManagementController.createProjectManually);

// ข้อมูลสำหรับ dropdown (ต้องมาก่อน dynamic routes)
router.get('/projects/tracks', adminAuth, projectManagementController.getAvailableTracks);
router.get('/advisors', adminAuth, projectManagementController.getAvailableAdvisors);

// Dynamic routes (ต้องมาหลัง static routes)
router.get('/projects/:projectId', adminAuth, projectManagementController.getProjectById);
router.put('/projects/:projectId', adminAuth, projectManagementController.updateProject);
router.post('/projects/:projectId/cancel', adminAuth, projectManagementController.cancelProject);

module.exports = router;
