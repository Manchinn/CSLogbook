const { ProjectWorkflowState, ProjectDocument, ProjectMember, Student, User, ImportantDeadline } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const dayjs = require('dayjs');
const { 
  getWorkflowTypeFromPhase, 
  getDeadlineMappingForPhase 
} = require('../constants/workflowDeadlineMapping');

class ProjectWorkflowStateService {
  /**
   * ดึงสถิติภาพรวมของโครงงานทั้งหมด
   */
  async getStatistics({ academicYear, semester } = {}) {
    try {
      const whereClause = {};
      const projectWhere = {};

      if (academicYear) projectWhere.academicYear = academicYear;
      if (semester) projectWhere.semester = semester;

      const include = [];
      if (Object.keys(projectWhere).length > 0) {
        include.push({
          model: ProjectDocument,
          as: 'project',
          attributes: [],
          where: projectWhere,
          required: true
        });
      }

      // นับตาม phase
      const byPhase = await ProjectWorkflowState.findAll({
        attributes: [
          'currentPhase',
          [ProjectWorkflowState.sequelize.fn('COUNT', ProjectWorkflowState.sequelize.col('id')), 'count']
        ],
        where: whereClause,
        include: include.length > 0 ? include : undefined,
        group: ['currentPhase'],
        raw: true
      });

      // Summary
      const total = await ProjectWorkflowState.count({
        where: whereClause,
        include: include.length > 0 ? include : undefined,
        distinct: true
      });

      const blocked = await ProjectWorkflowState.count({
        where: { ...whereClause, isBlocked: true },
        include: include.length > 0 ? include : undefined,
        distinct: true
      });

      const overdue = await ProjectWorkflowState.count({
        where: { ...whereClause, isOverdue: true },
        include: include.length > 0 ? include : undefined,
        distinct: true
      });

      // แปลง byPhase เป็น object
      const phaseMap = {};
      byPhase.forEach(row => {
        phaseMap[row.currentPhase] = parseInt(row.count);
      });

      const summary = {
        total,
        draft: phaseMap.DRAFT || 0,
        advisorAssigned: phaseMap.ADVISOR_ASSIGNED || 0,
        topicExamPending: (phaseMap.TOPIC_EXAM_PENDING || 0) + (phaseMap.TOPIC_EXAM_SCHEDULED || 0),
        inProgress: phaseMap.IN_PROGRESS || 0,
        thesisExamPending: (phaseMap.THESIS_EXAM_PENDING || 0) + (phaseMap.THESIS_EXAM_SCHEDULED || 0),
        completed: phaseMap.COMPLETED || 0,
        blocked,
        overdue
      };

      return {
        summary,
        byPhase: phaseMap
      };
    } catch (error) {
      logger.error('Error in getStatistics:', error);
      throw error;
    }
  }

  /**
   * ดึงสถานะของโครงงานเฉพาะ
   */
  async getProjectState(projectId, options = {}) {
    try {
      const { includeProject = true } = options;

      const include = [];
      if (includeProject) {
        include.push({
          model: ProjectDocument,
          as: 'project',
          attributes: ['projectId', 'projectNameTh', 'projectNameEn', 'status']
        });
      }

      const state = await ProjectWorkflowState.findOne({
        where: { projectId },
        include: include.length > 0 ? include : undefined
      });

      if (!state) {
        return null;
      }

      // เพิ่ม helper methods ให้ response
      return {
        ...state.toJSON(),
        canSubmitTopicDefense: state.canSubmitTopicDefense(),
        canSubmitThesisDefense: state.canSubmitThesisDefense(),
        isDocumentSubmissionPhase: state.isDocumentSubmissionPhase(),
        isComplete: state.isComplete()
      };
    } catch (error) {
      logger.error('Error in getProjectState:', error);
      throw error;
    }
  }

  /**
   * ดึงโครงงานที่ต้องให้ความสนใจ (blocked, overdue, pending exam)
   */
  async getAttentionRequired({ academicYear, semester, limit = 50 } = {}) {
    try {
      const whereClause = {
        [Op.or]: [
          { isBlocked: true },
          { isOverdue: true },
          { currentPhase: ['TOPIC_EXAM_PENDING', 'TOPIC_EXAM_SCHEDULED', 'THESIS_EXAM_PENDING', 'THESIS_EXAM_SCHEDULED'] }
        ]
      };

      const projectWhere = {};
      if (academicYear) projectWhere.academicYear = academicYear;
      if (semester) projectWhere.semester = semester;

      const states = await ProjectWorkflowState.findAll({
        where: whereClause,
        include: [
          {
            model: ProjectDocument,
            as: 'project',
            where: Object.keys(projectWhere).length > 0 ? projectWhere : undefined,
            required: true,
            include: [
              {
                model: ProjectMember,
                as: 'members',
                include: [
                  {
                    model: Student,
                    as: 'student',
                    include: [
                      {
                        model: User,
                        as: 'user',
                        attributes: ['userId', 'firstName', 'lastName', 'email']
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        order: [['lastActivityAt', 'DESC']],
        limit
      });

      return states.map(state => state.toJSON());
    } catch (error) {
      logger.error('Error in getAttentionRequired:', error);
      throw error;
    }
  }

  /**
   * ดึงสถิติสำหรับ admin dashboard
   */
  async getAdminDashboardStatistics({ academicYear, semester } = {}) {
    try {
      const stats = await this.getStatistics({ academicYear, semester });
      const attention = await this.getAttentionRequired({ academicYear, semester, limit: 10 });

      // สถิติผลสอบ
      const projectWhere = {};
      if (academicYear) projectWhere.academicYear = academicYear;
      if (semester) projectWhere.semester = semester;

      const include = Object.keys(projectWhere).length > 0
        ? [{
            model: ProjectDocument,
            as: 'project',
            where: projectWhere,
            attributes: [],
            required: true
          }]
        : undefined;

      const examResults = {
        project1: {
          pending: await ProjectWorkflowState.count({
            where: { topicExamResult: null, currentPhase: ['TOPIC_EXAM_PENDING', 'TOPIC_EXAM_SCHEDULED'] },
            include,
            distinct: true
          }),
          pass: await ProjectWorkflowState.count({
            where: { topicExamResult: 'PASS' },
            include,
            distinct: true
          }),
          fail: await ProjectWorkflowState.count({
            where: { topicExamResult: 'FAIL' },
            include,
            distinct: true
          })
        },
        thesis: {
          pending: await ProjectWorkflowState.count({
            where: { thesisExamResult: null, currentPhase: ['THESIS_EXAM_PENDING', 'THESIS_EXAM_SCHEDULED'] },
            include,
            distinct: true
          }),
          pass: await ProjectWorkflowState.count({
            where: { thesisExamResult: 'PASS' },
            include,
            distinct: true
          }),
          fail: await ProjectWorkflowState.count({
            where: { thesisExamResult: 'FAIL' },
            include,
            distinct: true
          })
        }
      };

      return {
        overview: {
          totalProjects: stats.summary.total,
          activeProjects: stats.summary.total - stats.summary.completed,
          completedProjects: stats.summary.completed
        },
        byPhase: stats.byPhase,
        examResults,
        blockedProjects: attention.filter(s => s.isBlocked),
        overdueProjects: attention.filter(s => s.isOverdue && !s.isBlocked)
      };
    } catch (error) {
      logger.error('Error in getAdminDashboardStatistics:', error);
      throw error;
    }
  }

  /**
   * ดึงโครงงานตาม filter
   */
  async getProjectsByFilter({ 
    currentPhase, 
    isBlocked, 
    isOverdue, 
    academicYear, 
    semester,
    limit = 100,
    offset = 0 
  } = {}) {
    try {
      const whereClause = {};
      if (currentPhase) whereClause.currentPhase = currentPhase;
      if (isBlocked !== undefined) whereClause.isBlocked = isBlocked;
      if (isOverdue !== undefined) whereClause.isOverdue = isOverdue;

      const projectWhere = {};
      if (academicYear) projectWhere.academicYear = academicYear;
      if (semester) projectWhere.semester = semester;

      const { count, rows } = await ProjectWorkflowState.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: ProjectDocument,
            as: 'project',
            where: Object.keys(projectWhere).length > 0 ? projectWhere : undefined,
            required: true,
            include: [
              {
                model: ProjectMember,
                as: 'members',
                include: [
                  {
                    model: Student,
                    as: 'student',
                    include: [
                      {
                        model: User,
                        as: 'user',
                        attributes: ['userId', 'firstName', 'lastName']
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        order: [['lastActivityAt', 'DESC']],
        limit,
        offset,
        distinct: true
      });

      return {
        total: count,
        items: rows.map(row => row.toJSON()),
        limit,
        offset
      };
    } catch (error) {
      logger.error('Error in getProjectsByFilter:', error);
      throw error;
    }
  }

  /**
   * ดึง active deadlines สำหรับโครงงานตาม phase ปัจจุบัน
   * @param {number} projectId - Project ID
   * @param {Object} options - Options { transaction }
   * @returns {Promise<Array>} Array of ImportantDeadline objects
   */
  async getApplicableDeadlines(projectId, options = {}) {
    try {
      const { transaction } = options;
      
      const state = await ProjectWorkflowState.findOne({
        where: { projectId },
        transaction
      });

      if (!state) {
        logger.warn(`ProjectWorkflowState not found for projectId: ${projectId}`);
        return [];
      }

      const project = await ProjectDocument.findByPk(projectId, {
        attributes: ['academicYear', 'semester'],
        transaction
      });

      if (!project) {
        logger.warn(`ProjectDocument not found for projectId: ${projectId}`);
        return [];
      }

      // Map phase → relatedTo (project1 หรือ project2)
      const relatedTo = getWorkflowTypeFromPhase(state.currentPhase);

      if (!relatedTo) {
        logger.debug(`No deadline mapping for phase: ${state.currentPhase}`);
        return [];
      }

      // ดึง deadlines ที่เกี่ยวข้อง
      const deadlines = await ImportantDeadline.findAll({
        where: {
          relatedTo,
          academicYear: project.academicYear,
          semester: project.semester,
          isPublished: true
        },
        order: [['deadlineAt', 'ASC']],
        transaction
      });

      logger.debug(`Found ${deadlines.length} applicable deadlines for project ${projectId} (phase: ${state.currentPhase})`);

      return deadlines;
    } catch (error) {
      logger.error('Error in getApplicableDeadlines:', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบว่าโครงงานเลย deadline หรือไม่
   * @param {number} projectId - Project ID
   * @param {Object} options - Options { transaction }
   * @returns {Promise<Object>} { isOverdue, overdueDeadlines, nextDeadline }
   */
  async checkOverdue(projectId, options = {}) {
    try {
      const { transaction } = options;
      
      const state = await ProjectWorkflowState.findOne({
        where: { projectId },
        include: [{
          model: ProjectDocument,
          as: 'project',
          attributes: ['academicYear', 'semester']
        }],
        transaction
      });

      if (!state || !state.project) {
        logger.warn(`ProjectWorkflowState or ProjectDocument not found for projectId: ${projectId}`);
        return { isOverdue: false, overdueDeadlines: [], nextDeadline: null };
      }

      // ดึง deadline ที่เกี่ยวข้องกับ phase ปัจจุบัน
      const deadlines = await this.getApplicableDeadlines(projectId, { transaction });
      
      if (deadlines.length === 0) {
        // ไม่มี deadline กำหนด - reset isOverdue ถ้าจำเป็น
        if (state.isOverdue) {
          await state.update({ isOverdue: false }, { transaction });
        }
        return { isOverdue: false, overdueDeadlines: [], nextDeadline: null };
      }

      // หา submission deadlines ที่เลยแล้ว
      const now = dayjs();
      const overdueDeadlines = deadlines.filter(d => {
        if (d.deadlineType !== 'SUBMISSION') return false;
        
        let deadline = dayjs(d.deadlineAt);
        
        // พิจารณา grace period
        if (d.gracePeriodMinutes) {
          deadline = deadline.add(d.gracePeriodMinutes, 'minute');
        }
        
        return now.isAfter(deadline);
      });

      const isOverdue = overdueDeadlines.length > 0;
      
      // อัปเดต state ถ้าจำเป็น
      if (state.isOverdue !== isOverdue) {
        await state.update({ isOverdue }, { transaction });
        logger.info(`Updated isOverdue flag for project ${projectId}: ${isOverdue}`);
      }

      // หา deadline ถัดไป
      const futureDeadlines = deadlines.filter(d => dayjs(d.deadlineAt).isAfter(now));
      const nextDeadline = futureDeadlines.length > 0 ? futureDeadlines[0] : null;

      return {
        isOverdue,
        overdueDeadlines: overdueDeadlines.map(d => d.toJSON()),
        nextDeadline: nextDeadline ? nextDeadline.toJSON() : null
      };
    } catch (error) {
      logger.error('Error in checkOverdue:', error);
      throw error;
    }
  }

  /**
   * ดึงสถานะของโครงงานพร้อมข้อมูล deadline
   * @param {number} projectId - Project ID
   * @param {Object} options - Options { includeProject, transaction }
   * @returns {Promise<Object|null>} Project state with deadline information
   */
  async getProjectStateWithDeadlines(projectId, options = {}) {
    try {
      const state = await this.getProjectState(projectId, options);
      
      if (!state) return null;

      const deadlines = await this.getApplicableDeadlines(projectId, options);
      const overdueCheck = await this.checkOverdue(projectId, options);

      return {
        ...state,
        deadlines: {
          upcoming: deadlines.map(d => d.toJSON ? d.toJSON() : d),
          overdue: overdueCheck.overdueDeadlines,
          next: overdueCheck.nextDeadline
        },
        overdueStatus: {
          isOverdue: overdueCheck.isOverdue,
          overdueCount: overdueCheck.overdueDeadlines.length
        }
      };
    } catch (error) {
      logger.error('Error in getProjectStateWithDeadlines:', error);
      throw error;
    }
  }
}

module.exports = new ProjectWorkflowStateService();
