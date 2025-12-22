const express = require('express');
const router = express.Router();
const projectTransitionService = require('../services/projectTransitionService');
const logger = require('../utils/logger');

/**
 * GET /api/projects/:id/transition-status
 * Check transition eligibility for a project
 * Accessible to: All authenticated users
 */
router.get('/:id/transition-status', async (req, res) => {
    try {
        const projectId = parseInt(req.params.id);

        if (isNaN(projectId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid project ID'
            });
        }

        const status = await projectTransitionService.getTransitionStatus(projectId);

        if (!status.found) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        return res.json({
            success: true,
            data: status
        });
    } catch (error) {
        logger.error('Error getting transition status:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to get transition status'
        });
    }
});

/**
 * POST /api/projects/:id/transition-to-project2
 * Manually transition a project to Project 2
 * Accessible to: Admin only
 */
router.post('/:id/transition-to-project2', async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Only admin can manually transition projects'
            });
        }

        const projectId = parseInt(req.params.id);

        if (isNaN(projectId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid project ID'
            });
        }

        const result = await projectTransitionService.transitionToProject2(projectId, {
            transitionType: 'manual',
            transitionedBy: req.user.userId
        });

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.message
            });
        }

        return res.json({
            success: true,
            message: result.message,
            data: result.project
        });
    } catch (error) {
        logger.error('Error transitioning to Project 2:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to transition project'
        });
    }
});

/**
 * POST /api/admin/projects/auto-transition
 * Batch auto-transition all eligible projects
 * Accessible to: Admin only
 */
router.post('/auto-transition', async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Only admin can trigger auto-transition'
            });
        }

        const result = await projectTransitionService.autoTransitionEligibleProjects();

        return res.json({
            success: true,
            message: `Auto-transition completed: ${result.transitioned} successful, ${result.failed} failed`,
            data: {
                transitioned: result.transitioned,
                failed: result.failed,
                results: result.results
            }
        });
    } catch (error) {
        logger.error('Error in auto-transition:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to auto-transition projects'
        });
    }
});

module.exports = router;
