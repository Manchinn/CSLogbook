const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkProjectEligibility } = require('../middleware/projectEligibilityMiddleware');
const { checkDeadlineBeforeSubmission } = require('../middleware/deadlineEnforcementMiddleware');
const controller = require('../controllers/projectDocumentController');
const topicExamResultController = require('../controllers/topicExamResultController');
const projectExamResultController = require('../controllers/projectExamResultController');
const meetingController = require('../controllers/meetingController');
const projectDefenseRequestController = require('../controllers/projectDefenseRequestController');
const projectSystemTestController = require('../controllers/projectSystemTestController');
const { uploadSystemTestRequest, uploadSystemTestEvidence } = require('../config/projectSystemTestUpload');

// ต้อง auth ทั้งหมด
router.use(authenticateToken);

// สร้างโครงงาน (นักศึกษา) - ต้องตรวจสอบสิทธิ์โครงงานพิเศษ
router.post('/', checkProjectEligibility, controller.createProject);

// รายการของฉัน - ต้องตรวจสอบสิทธิ์โครงงานพิเศษ
router.get('/mine', checkProjectEligibility, controller.getMyProjects);

// ผลสอบโครงงานพิเศษ - routes ที่ไม่มี :id (ต้องอยู่ก่อน)
router.get('/exam-results/project1/pending', projectExamResultController.getProject1PendingResults);
router.get('/exam-results/thesis/pending', projectExamResultController.getThesisPendingResults);
router.get('/exam-results/statistics', projectExamResultController.getExamStatistics);

// System test request (ก่อนยื่นสอบโครงงานพิเศษ)
router.get('/system-test/advisor-queue', projectSystemTestController.advisorQueue);
router.get('/system-test/staff-queue', projectSystemTestController.staffQueue);

router.get('/:id/system-test/request', projectSystemTestController.getLatestRequest);
router.post('/:id/system-test/request', checkDeadlineBeforeSubmission('SUBMISSION'), uploadSystemTestRequest.single('requestFile'), projectSystemTestController.submitRequest);
router.post('/:id/system-test/request/advisor-decision', projectSystemTestController.submitAdvisorDecision);
router.post('/:id/system-test/request/staff-decision', projectSystemTestController.submitStaffDecision);
router.post('/:id/system-test/request/evidence', uploadSystemTestEvidence.single('evidenceFile'), projectSystemTestController.uploadEvidence);

// KP02 queues & actions (ต้องอยู่ก่อน path ที่มี :id เพื่อไม่ให้ชน routing)
router.get('/kp02/advisor-queue', projectDefenseRequestController.getAdvisorQueue);
router.get('/kp02/staff-queue', projectDefenseRequestController.getStaffVerificationQueue);
router.get('/kp02/staff-queue/export', projectDefenseRequestController.exportStaffVerificationList);

// คำขอสอบโครงงานพิเศษ 1 (KP02 Project1) และ Thesis
router.get('/:id/kp02', projectDefenseRequestController.getProject1Request);
router.post('/:id/kp02', checkDeadlineBeforeSubmission('SUBMISSION'), projectDefenseRequestController.submitProject1Request);
router.post('/:id/kp02/advisor-approve', projectDefenseRequestController.submitAdvisorDecision);
router.post('/:id/kp02/verify', projectDefenseRequestController.verifyProject1Request);
router.post('/:id/kp02/schedule', projectDefenseRequestController.scheduleProject1Defense);

router.patch('/:id/final-document/status', projectExamResultController.updateFinalDocumentStatus);

// Workflow state - เพิ่มเข้ามาก่อน route /:id เพื่อไม่ให้ชน
const projectWorkflowStateController = require('../controllers/projectWorkflowStateController');
router.get('/:id/workflow-state/deadlines', checkProjectEligibility, projectWorkflowStateController.getProjectStateWithDeadlines);
router.get('/:id/workflow-state', checkProjectEligibility, projectWorkflowStateController.getProjectState);

// รายละเอียดโครงงาน (+ summary optional) - ต้องตรวจสอบสิทธิ์โครงงานพิเศษ
router.get('/:id', checkProjectEligibility, async (req, res, next) => {
	// แทรก include=summary -> ส่งต่อให้ controller เดิม (แก้ภายใน service เรียก getProjectById)
	// reuse controller ตรง ๆ เพื่อไม่แก้ไฟล์ controller มาก
	if (req.query.include === 'summary') {
		// monkey patch service call โดยชั่วคราวใช้วิธี override method บน req (เลี่ยง refactor controller เดิมตอนนี้)
		return controller.getProject(req, res, next); // controller จะเรียก getProjectById เดิม; เราจะ extend ภายหลังหากต้อง
	}
	return controller.getProject(req, res, next);
});

// Milestones - ต้องตรวจสอบสิทธิ์โครงงานพิเศษ
const milestoneController = require('../controllers/projectMilestoneController');
router.get('/:id/milestones', checkProjectEligibility, milestoneController.list);
router.post('/:id/milestones', checkProjectEligibility, milestoneController.create);

// Meetings & Logs - ต้องตรวจสอบสิทธิ์โครงงานพิเศษ
router.get('/:id/meetings', checkProjectEligibility, meetingController.list);
router.post('/:id/meetings', checkProjectEligibility, meetingController.create);
router.put('/:id/meetings/:meetingId', checkProjectEligibility, meetingController.update);
router.delete('/:id/meetings/:meetingId', checkProjectEligibility, meetingController.delete);
router.post('/:id/meetings/:meetingId/logs', checkProjectEligibility, meetingController.createLog);
router.put('/:id/meetings/:meetingId/logs/:logId', checkProjectEligibility, meetingController.updateLog);
router.delete('/:id/meetings/:meetingId/logs/:logId', checkProjectEligibility, meetingController.deleteLog);
router.patch('/:id/meetings/:meetingId/logs/:logId/approval', meetingController.updateApproval);

// Artifacts (list) & Proposal upload - ต้องตรวจสอบสิทธิ์โครงงานพิเศษ
const artifactController = require('../controllers/projectArtifactController');
const { uploadProposal } = require('../config/projectArtifactUpload');
router.get('/:id/artifacts', checkProjectEligibility, artifactController.list);
router.post('/:id/proposal', checkProjectEligibility, uploadProposal.single('file'), artifactController.uploadProposal);

// Tracks (multi-track) - แยก endpoint ชัดเจน - ต้องตรวจสอบสิทธิ์โครงงานพิเศษ
const projectTracksController = require('../controllers/projectTracksController');
router.get('/:id/tracks', checkProjectEligibility, projectTracksController.list);
router.post('/:id/tracks', checkProjectEligibility, projectTracksController.replace); // replace ทั้งชุด

// อัปเดต metadata (leader) - ต้องตรวจสอบสิทธิ์โครงงานพิเศษ
router.patch('/:id', checkProjectEligibility, controller.updateProject);

// เพิ่มสมาชิกคนที่สอง - ต้องตรวจสอบสิทธิ์โครงงานพิเศษ
router.post('/:id/members', checkProjectEligibility, controller.addMember);

// Promote -> in_progress - ต้องตรวจสอบสิทธิ์โครงงานพิเศษ
router.post('/:id/activate', checkProjectEligibility, controller.activateProject);

// Archive (admin)
router.post('/:id/archive', controller.archiveProject);

// บันทึกผลสอบหัวข้อ (staff/admin) - เดิม
router.post('/:id/topic-exam-result', topicExamResultController.recordResult);
router.patch('/:id/topic-exam-result/ack', checkProjectEligibility, topicExamResultController.acknowledgeFailed);

// บันทึกผลสอบโครงงานพิเศษ 1 และ Thesis (staff/admin)
router.post('/:id/exam-result', projectExamResultController.recordExamResult);
router.get('/:id/exam-result', checkProjectEligibility, projectExamResultController.getExamResult);
router.patch('/:id/exam-result/acknowledge', checkProjectEligibility, projectExamResultController.acknowledgeExamResult);

module.exports = router;
