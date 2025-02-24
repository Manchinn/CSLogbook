const express = require('express');
const router = express.Router();
const projectProposalController = require('../controllers/projectproposalController');

router.post('/', projectProposalController.submitProposal);
router.get('/', projectProposalController.getProposals);
router.post('/:id/approve', projectProposalController.approveProposal);
router.post('/:id/reject', projectProposalController.rejectProposal);

module.exports = router;
