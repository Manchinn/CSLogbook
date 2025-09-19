const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const controller = require('../controllers/projectDocumentController');

// ต้อง auth ทั้งหมด
router.use(authenticateToken);

// สร้างโครงงาน (นักศึกษา)
router.post('/', controller.createProject);

// รายการของฉัน
router.get('/mine', controller.getMyProjects);

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

module.exports = router;
