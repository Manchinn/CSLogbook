const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const controller = require('../controllers/projectDocumentController');
const topicExamResultController = require('../controllers/topicExamResultController');
const projectExamResultController = require('../controllers/projectExamResultController');
const meetingController = require('../controllers/meetingController');
const projectDefenseRequestController = require('../controllers/projectDefenseRequestController');

// ต้อง auth ทั้งหมด
router.use(authenticateToken);

// สร้างโครงงาน (นักศึกษา)
router.post('/', controller.createProject);

// รายการของฉัน
router.get('/mine', controller.getMyProjects);

// ผลสอบโครงงานพิเศษ - routes ที่ไม่มี :id (ต้องอยู่ก่อน)
router.get('/exam-results/project1/pending', projectExamResultController.getProject1PendingResults);
router.get('/exam-results/statistics', projectExamResultController.getExamStatistics);

// KP02 queues & actions (ต้องอยู่ก่อน path ที่มี :id เพื่อไม่ให้ชน routing)
router.get('/kp02/advisor-queue', projectDefenseRequestController.getAdvisorQueue);
router.get('/kp02/staff-queue', projectDefenseRequestController.getStaffVerificationQueue);
router.get('/kp02/staff-queue/export', projectDefenseRequestController.exportStaffVerificationList);

// คำขอสอบโครงงานพิเศษ 1 (KP02 Project1)
router.get('/:id/kp02', projectDefenseRequestController.getProject1Request);
router.post('/:id/kp02', projectDefenseRequestController.submitProject1Request);
router.post('/:id/kp02/advisor-approve', projectDefenseRequestController.submitAdvisorDecision);
router.post('/:id/kp02/verify', projectDefenseRequestController.verifyProject1Request);
router.post('/:id/kp02/schedule', projectDefenseRequestController.scheduleProject1Defense);

// รายละเอียดโครงงาน (+ summary optional)
router.get('/:id', async (req, res, next) => {
	// แทรก include=summary -> ส่งต่อให้ controller เดิม (แก้ภายใน service เรียก getProjectById)
	// reuse controller ตรง ๆ เพื่อไม่แก้ไฟล์ controller มาก
	if (req.query.include === 'summary') {
		// monkey patch service call โดยชั่วคราวใช้วิธี override method บน req (เลี่ยง refactor controller เดิมตอนนี้)
		return controller.getProject(req, res, next); // controller จะเรียก getProjectById เดิม; เราจะ extend ภายหลังหากต้อง
	}
	return controller.getProject(req, res, next);
});

// Milestones
const milestoneController = require('../controllers/projectMilestoneController');
router.get('/:id/milestones', milestoneController.list);
router.post('/:id/milestones', milestoneController.create);

// Meetings & Logs
router.get('/:id/meetings', meetingController.list);
router.post('/:id/meetings', meetingController.create);
router.post('/:id/meetings/:meetingId/logs', meetingController.createLog);
router.patch('/:id/meetings/:meetingId/logs/:logId/approval', meetingController.updateApproval);

// Artifacts (list) & Proposal upload
const artifactController = require('../controllers/projectArtifactController');
const { uploadProposal } = require('../config/projectArtifactUpload');
router.get('/:id/artifacts', artifactController.list);
router.post('/:id/proposal', uploadProposal.single('file'), artifactController.uploadProposal);

// Tracks (multi-track) - แยก endpoint ชัดเจน
const projectTracksController = require('../controllers/projectTracksController');
router.get('/:id/tracks', projectTracksController.list);
router.post('/:id/tracks', projectTracksController.replace); // replace ทั้งชุด

// อัปเดต metadata (leader)
router.patch('/:id', controller.updateProject);

// เพิ่มสมาชิกคนที่สอง
router.post('/:id/members', controller.addMember);

// Promote -> in_progress
router.post('/:id/activate', controller.activateProject);

// Archive (admin)
router.post('/:id/archive', controller.archiveProject);

// บันทึกผลสอบหัวข้อ (staff/admin) - เดิม
router.post('/:id/topic-exam-result', topicExamResultController.recordResult);
router.patch('/:id/topic-exam-result/ack', topicExamResultController.acknowledgeFailed);

// บันทึกผลสอบโครงงานพิเศษ 1 และ Thesis (staff/admin)
router.post('/:id/exam-result', projectExamResultController.recordExamResult);
router.get('/:id/exam-result', projectExamResultController.getExamResult);
router.patch('/:id/exam-result/acknowledge', projectExamResultController.acknowledgeExamResult);

module.exports = router;
