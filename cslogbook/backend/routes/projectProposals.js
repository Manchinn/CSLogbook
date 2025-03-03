const express = require('express');
const router = express.Router();
const { submitProjectProposal, getProposals, approveProposal, rejectProposal } = require('../controllers/projectproposalController');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, checkRole(['student']), submitProjectProposal);
router.get('/', authenticateToken, checkRole(['student']), getProposals);
router.post('/:id/approve', authenticateToken, checkRole(['student']), approveProposal);
router.post('/:id/reject', authenticateToken, checkRole(['student']), rejectProposal);

module.exports = router;
