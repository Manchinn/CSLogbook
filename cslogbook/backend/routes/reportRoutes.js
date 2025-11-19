// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');
const workflowReportController = require('../controllers/workflowReportController');
const deadlineReportController = require('../controllers/deadlineReportController');

// รายงาน (Authentication บังคับ)
router.get('/overview', authenticateToken, reportController.getOverview);
router.get('/internships/logbook-compliance', authenticateToken, reportController.getInternshipLogbookCompliance);
router.get('/internships/student-summary', authenticateToken, reportController.getInternshipStudentSummary);
router.get('/internships/evaluations/summary', authenticateToken, reportController.getInternshipEvaluationSummary);
router.get('/internships/enrolled-students', authenticateToken, reportController.getEnrolledInternshipStudents);
router.get('/internships/academic-years', authenticateToken, reportController.getInternshipAcademicYears);
router.get('/projects/status-summary', authenticateToken, reportController.getProjectStatusSummary);
router.get('/projects/advisor-load', authenticateToken, reportController.getAdvisorLoad);
router.get('/projects/academic-years', authenticateToken, reportController.getProjectAcademicYears);

// === Advisor Workload Enhanced Routes ===
router.get('/advisors/workload', authenticateToken, reportController.getAdvisorLoad); // Alias for detailed view
router.get('/advisors/:teacherId/detail', authenticateToken, reportController.getAdvisorDetail);

// === Workflow Progress Reports ===
router.get('/workflow/progress', authenticateToken, workflowReportController.getWorkflowProgress);
router.get('/workflow/bottlenecks', authenticateToken, workflowReportController.getBottlenecks);
router.get('/workflow/student-timeline/:studentId', authenticateToken, workflowReportController.getStudentTimeline);
router.get('/workflow/blocked-students', authenticateToken, workflowReportController.getBlockedStudents);

// === Deadline Compliance Reports ===
router.get('/deadlines/compliance', authenticateToken, deadlineReportController.getDeadlineCompliance);
router.get('/deadlines/upcoming', authenticateToken, deadlineReportController.getUpcomingDeadlines);
router.get('/deadlines/overdue', authenticateToken, deadlineReportController.getOverdueDeadlines);
router.get('/deadlines/late-submissions', authenticateToken, deadlineReportController.getLateSubmissions);
router.get('/deadlines/academic-years', authenticateToken, deadlineReportController.getDeadlineAcademicYears);
router.get('/students/:studentId/deadline-history', authenticateToken, deadlineReportController.getStudentDeadlineHistory);

module.exports = router;
