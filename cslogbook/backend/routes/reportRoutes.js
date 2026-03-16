// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const reportController = require('../controllers/reportController');
const workflowReportController = require('../controllers/workflowReportController');
const deadlineReportController = require('../controllers/deadlineReportController');

// รายงาน — เฉพาะ admin และ teacher เท่านั้น
router.use(authenticateToken);
router.use(authorize.fromAllowed(['admin', 'teacher']));

router.get('/overview', reportController.getOverview);
router.get('/internships/logbook-compliance', reportController.getInternshipLogbookCompliance);
router.get('/internships/student-summary', reportController.getInternshipStudentSummary);
router.get('/internships/evaluations/summary', reportController.getInternshipEvaluationSummary);
router.get('/internships/enrolled-students', reportController.getEnrolledInternshipStudents);
router.get('/internships/academic-years', reportController.getInternshipAcademicYears);
router.get('/projects/status-summary', reportController.getProjectStatusSummary);
router.get('/projects/advisor-load', reportController.getAdvisorLoad);
router.get('/projects/academic-years', reportController.getProjectAcademicYears);

// === Document Pipeline Report ===
router.get('/documents/pipeline', reportController.getDocumentPipeline);

// === Internship Supervisor Report ===
router.get('/internships/supervisor-report', reportController.getInternshipSupervisorReport);

// === Advisor Workload Enhanced Routes ===
router.get('/advisors/workload', reportController.getAdvisorLoad); // Alias for detailed view
router.get('/advisors/:teacherId/detail', reportController.getAdvisorDetail);

// === Workflow Progress Reports ===
router.get('/workflow/progress', workflowReportController.getWorkflowProgress);
router.get('/workflow/bottlenecks', workflowReportController.getBottlenecks);
router.get('/workflow/student-timeline/:studentId', workflowReportController.getStudentTimeline);
router.get('/workflow/blocked-students', workflowReportController.getBlockedStudents);

// === Deadline Compliance Reports ===
router.get('/deadlines/compliance', deadlineReportController.getDeadlineCompliance);
router.get('/deadlines/upcoming', deadlineReportController.getUpcomingDeadlines);
router.get('/deadlines/overdue', deadlineReportController.getOverdueDeadlines);
router.get('/deadlines/late-submissions', deadlineReportController.getLateSubmissions);
router.get('/deadlines/academic-years', deadlineReportController.getDeadlineAcademicYears);
router.get('/students/:studentId/deadline-history', deadlineReportController.getStudentDeadlineHistory);

module.exports = router;
