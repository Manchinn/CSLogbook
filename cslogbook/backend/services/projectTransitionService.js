const { ProjectDocument, ProjectMember, Timeline, WorkflowDefinition } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

/**
 * Project Transition Service
 * Handles transition from Project 1 to Project 2 (Thesis)
 */

/**
 * Check if a project is eligible for transition to Project 2
 * @param {number} projectId - Project ID to check
 * @returns {Promise<{eligible: boolean, reason?: string, project?: Object}>}
 */
async function checkTransitionEligibility(projectId) {
    try {
        const project = await ProjectDocument.findByPk(projectId, {
            include: [
                {
                    model: ProjectMember,
                    as: 'members',
                    attributes: ['student_id', 'role']
                }
            ]
        });

        if (!project) {
            return { eligible: false, reason: 'โครงงานไม่พบในระบบ' };
        }

        // ตรวจสอบว่าเป็น Project 1 หรือไม่
        if (project.projectType === 'project2') {
            return { eligible: false, reason: 'โครงงานนี้เป็น Project 2 อยู่แล้ว' };
        }

        // ตรวจสอบว่า transition ไปแล้วหรือยัง
        if (project.transitioned_to_project2) {
            return { eligible: false, reason: 'โครงงานนี้ได้ทำการ transition ไปแล้ว' };
        }

        // ตรวจสอบสถานะการสอบ
        if (project.examResult !== 'passed') {
            return { eligible: false, reason: 'ต้องผ่านการสอบ Project 1 ก่อน' };
        }

        // ตรวจสอบสถานะโครงงาน
        if (project.status === 'cancelled' || project.status === 'archived') {
            return { eligible: false, reason: `โครงงานถูก ${project.status} แล้ว` };
        }

        return { eligible: true, project };
    } catch (error) {
        logger.error('Error checking transition eligibility:', error);
        throw error;
    }
}

/**
 * Transition a project from Project 1 to Project 2
 * @param {number} projectId - Project ID to transition
 * @param {Object} options - Transition options
 * @param {number} options.transitionedBy - User ID who triggered the transition
 * @param {string} options.transitionType - 'auto' or 'manual'
 * @returns {Promise<{success: boolean, message: string, project?: Object}>}
 */
async function transitionToProject2(projectId, options = {}) {
    const { transitionedBy, transitionType = 'manual' } = options;
    const transaction = await sequelize.transaction();

    try {
        // ตรวจสอบความเหมาะสม
        const eligibility = await checkTransitionEligibility(projectId);
        if (!eligibility.eligible) {
            await transaction.rollback();
            return { success: false, message: eligibility.reason };
        }

        const project = eligibility.project;
        const originalProjectId = project.project_id;

        // อัปเดตโครงงาน
        await project.update({
            projectType: 'project2',
            transitioned_to_project2: true,
            transitioned_at: new Date(),
            currentPhase: 'THESIS_IN_PROGRESS',
            status: 'in_progress'
        }, { transaction });

        // สร้าง Timeline entry สำหรับ transition
        await Timeline.create({
            student_id: project.members?.[0]?.student_id, // หัวหน้าทีม
            category: 'project',
            activity_type: 'project_transition',
            description: `โครงงานเปลี่ยนจาก Project 1 เป็น Project 2 (ปริญญานิพนธ์) ${transitionType === 'auto' ? 'อัตโนมัติ' : 'โดยแอดมิน'}`,
            metadata: {
                project_id: originalProjectId,
                transition_type: transitionType,
                transitioned_by: transitionedBy,
                old_project_type: 'project1',
                new_project_type: 'project2'
            }
        }, { transaction });

        // Initialize Project 2 workflow in timeline (if needed)
        // This would be handled by timelineService.initializeStudentTimeline

        await transaction.commit();

        logger.info(`Project ${projectId} transitioned to Project 2 (${transitionType})`, {
            projectId,
            transitionedBy,
            transitionType
        });

        return {
            success: true,
            message: 'เปลี่ยนเป็น Project 2 (ปริญญานิพนธ์) สำเร็จ',
            project: await ProjectDocument.findByPk(projectId)
        };
    } catch (error) {
        await transaction.rollback();
        logger.error('Error transitioning to Project 2:', error);
        throw error;
    }
}

/**
 * Get transition status for a project
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>}
 */
async function getTransitionStatus(projectId) {
    try {
        const project = await ProjectDocument.findByPk(projectId);

        if (!project) {
            return { found: false };
        }

        const eligibility = await checkTransitionEligibility(projectId);

        return {
            found: true,
            project_id: project.project_id,
            current_project_type: project.projectType,
            transitioned_to_project2: project.transitioned_to_project2,
            transitioned_at: project.transitioned_at,
            originated_from_project_id: project.originated_from_project_id,
            exam_result: project.examResult,
            eligible_for_transition: eligibility.eligible,
            ineligibility_reason: eligibility.reason
        };
    } catch (error) {
        logger.error('Error getting transition status:', error);
        throw error;
    }
}

/**
 * Auto-transition all eligible Project 1 to Project 2
 * Called periodically or after exam results are updated
 * @returns {Promise<{transitioned: number, failed: number, results: Array}>}
 */
async function autoTransitionEligibleProjects() {
    try {
        // Find all Project 1 that passed exam but not transitioned
        const eligibleProjects = await ProjectDocument.findAll({
            where: {
                examResult: 'passed',
                transitioned_to_project2: false,
                projectType: { [Op.ne]: 'project2' },
                status: { [Op.notIn]: ['cancelled', 'archived'] }
            }
        });

        const results = [];
        let transitioned = 0;
        let failed = 0;

        for (const project of eligibleProjects) {
            try {
                const result = await transitionToProject2(project.project_id, {
                    transitionType: 'auto',
                    transitionedBy: null // System triggered
                });

                if (result.success) {
                    transitioned++;
                } else {
                    failed++;
                }

                results.push({
                    project_id: project.project_id,
                    success: result.success,
                    message: result.message
                });
            } catch (error) {
                failed++;
                results.push({
                    project_id: project.project_id,
                    success: false,
                    message: error.message
                });
            }
        }

        logger.info(`Auto-transition completed: ${transitioned} successful, ${failed} failed`);

        return { transitioned, failed, results };
    } catch (error) {
        logger.error('Error in auto-transition:', error);
        throw error;
    }
}

module.exports = {
    checkTransitionEligibility,
    transitionToProject2,
    getTransitionStatus,
    autoTransitionEligibleProjects
};
