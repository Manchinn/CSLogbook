const { 
  ProjectWorkflowState, 
  ProjectDocument, 
  ProjectMember, 
  Student, 
  User,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const dayjs = require('dayjs');

/**
 * Service สำหรับรายงานโครงงานพิเศษและปริญญานิพนธ์สำหรับงานธุรการ
 */
class ProjectReportService {
  
  /**
   * 1. ภาพรวมโครงงานพิเศษ (Project 1)
   */
  async getProject1Statistics({ academicYear, semester } = {}) {
    try {
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

      // จำนวนนักศึกษาทั้งหมดที่มีโครงงาน
      const totalProjects = await ProjectWorkflowState.count({
        include,
        distinct: true
      });

      // นักศึกษาที่ยื่นหัวข้อโครงงานแล้ว (TOPIC_SUBMISSION onwards)
      const topicSubmitted = await ProjectWorkflowState.count({
        where: {
          currentPhase: {
            [Op.in]: [
              'TOPIC_SUBMISSION',
              'TOPIC_EXAM_PENDING', 
              'TOPIC_EXAM_SCHEDULED',
              'IN_PROGRESS',
              'THESIS_SUBMISSION',
              'THESIS_EXAM_PENDING',
              'THESIS_EXAM_SCHEDULED',
              'COMPLETED',
              'ARCHIVED'
            ]
          }
        },
        include,
        distinct: true
      });

      // นักศึกษาที่กำลังรอสอบหัวข้อ
      const topicExamPending = await ProjectWorkflowState.count({
        where: {
          currentPhase: {
            [Op.in]: ['TOPIC_EXAM_PENDING', 'TOPIC_EXAM_SCHEDULED']
          }
        },
        include,
        distinct: true
      });

      // นักศึกษาที่ผ่านสอบหัวข้อ
      const topicExamPassed = await ProjectWorkflowState.count({
        where: {
          topicExamResult: 'PASS'
        },
        include,
        distinct: true
      });

      // นักศึกษาที่สอบหัวข้อไม่ผ่าน
      const topicExamFailed = await ProjectWorkflowState.count({
        where: {
          [Op.or]: [
            { topicExamResult: 'FAIL' },
            { currentPhase: 'TOPIC_FAILED' }
          ]
        },
        include,
        distinct: true
      });

      // นักศึกษาที่กำลังดำเนินโครงงาน (ผ่านสอบหัวข้อแล้ว แต่ยังไม่ถึงขั้นสอบปริญญานิพนธ์)
      const inProgress = await ProjectWorkflowState.count({
        where: {
          currentPhase: 'IN_PROGRESS'
        },
        include,
        distinct: true
      });

      // อัตราการผ่านสอบหัวข้อ
      const topicExamTotal = topicExamPassed + topicExamFailed;
      const topicPassRate = topicExamTotal > 0 
        ? ((topicExamPassed / topicExamTotal) * 100).toFixed(2) 
        : 0;

      return {
        totalProjects,
        topicSubmitted,
        topicExamPending,
        topicExamPassed,
        topicExamFailed,
        inProgress,
        topicPassRate: parseFloat(topicPassRate),
        topicExamTotal
      };
    } catch (error) {
      logger.error('Error in getProject1Statistics:', error);
      throw error;
    }
  }

  /**
   * 2. ภาพรวมปริญญานิพนธ์ (Project 2/Thesis)
   */
  async getProject2Statistics({ academicYear, semester } = {}) {
    try {
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

      // จำนวนนักศึกษาที่มีสิทธิ์สอบปริญญานิพนธ์ (ผ่านสอบหัวข้อแล้ว)
      const eligibleForThesis = await ProjectWorkflowState.count({
        where: {
          currentPhase: {
            [Op.in]: [
              'IN_PROGRESS',
              'THESIS_SUBMISSION',
              'THESIS_EXAM_PENDING',
              'THESIS_EXAM_SCHEDULED',
              'COMPLETED',
              'ARCHIVED'
            ]
          }
        },
        include,
        distinct: true
      });

      // นักศึกษาที่ยื่นสอบปริญญานิพนธ์
      const thesisSubmitted = await ProjectWorkflowState.count({
        where: {
          currentPhase: {
            [Op.in]: [
              'THESIS_SUBMISSION',
              'THESIS_EXAM_PENDING',
              'THESIS_EXAM_SCHEDULED'
            ]
          }
        },
        include,
        distinct: true
      });

      // นักศึกษาที่กำลังรอสอบปริญญานิพนธ์
      const thesisExamPending = await ProjectWorkflowState.count({
        where: {
          currentPhase: {
            [Op.in]: ['THESIS_EXAM_PENDING', 'THESIS_EXAM_SCHEDULED']
          }
        },
        include,
        distinct: true
      });

      // นักศึกษาที่ผ่านสอบปริญญานิพนธ์
      const thesisExamPassed = await ProjectWorkflowState.count({
        where: {
          thesisExamResult: 'PASS'
        },
        include,
        distinct: true
      });

      // นักศึกษาที่สอบปริญญานิพนธ์ไม่ผ่าน
      const thesisExamFailed = await ProjectWorkflowState.count({
        where: {
          [Op.or]: [
            { thesisExamResult: 'FAIL' },
            { currentPhase: 'THESIS_FAILED' }
          ]
        },
        include,
        distinct: true
      });

      // นักศึกษาที่จบโครงงานพิเศษและปริญญานิพนธ์
      const completed = await ProjectWorkflowState.count({
        where: {
          currentPhase: {
            [Op.in]: ['COMPLETED', 'ARCHIVED']
          }
        },
        include,
        distinct: true
      });

      // อัตราการผ่านสอบปริญญานิพนธ์
      const thesisExamTotal = thesisExamPassed + thesisExamFailed;
      const thesisPassRate = thesisExamTotal > 0 
        ? ((thesisExamPassed / thesisExamTotal) * 100).toFixed(2) 
        : 0;

      return {
        eligibleForThesis,
        thesisSubmitted,
        thesisExamPending,
        thesisExamPassed,
        thesisExamFailed,
        completed,
        thesisPassRate: parseFloat(thesisPassRate),
        thesisExamTotal
      };
    } catch (error) {
      logger.error('Error in getProject2Statistics:', error);
      throw error;
    }
  }

  /**
   * 3. รายงานเพิ่มเติมสำหรับธุรการ
   */
  async getAdditionalStatistics({ academicYear, semester } = {}) {
    try {
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

      // นักศึกษาที่ล่าช้าเกินกำหนด
      const overdueProjects = await ProjectWorkflowState.count({
        where: { isOverdue: true },
        include,
        distinct: true
      });

      // นักศึกษาที่มีปัญหา/ติดขัด
      const blockedProjects = await ProjectWorkflowState.count({
        where: { isBlocked: true },
        include,
        distinct: true
      });

      // อัตราความสำเร็จโดยรวม (จบแล้ว / ทั้งหมด)
      const totalProjects = await ProjectWorkflowState.count({
        include,
        distinct: true
      });

      const completedProjects = await ProjectWorkflowState.count({
        where: {
          currentPhase: {
            [Op.in]: ['COMPLETED', 'ARCHIVED']
          }
        },
        include,
        distinct: true
      });

      const overallSuccessRate = totalProjects > 0 
        ? ((completedProjects / totalProjects) * 100).toFixed(2) 
        : 0;

      // ระยะเวลาเฉลี่ยในการทำโครงงาน (วันที่สร้าง -> วันที่จบ)
      const avgDuration = await this.calculateAverageDuration({ academicYear, semester });

      // สถิติแยกตามเฟส
      const byPhase = await ProjectWorkflowState.findAll({
        attributes: [
          'currentPhase',
          [sequelize.fn('COUNT', sequelize.col('ProjectWorkflowState.id')), 'count']
        ],
        include,
        group: ['currentPhase'],
        raw: true
      });

      const phaseBreakdown = {};
      byPhase.forEach(row => {
        phaseBreakdown[row.currentPhase] = parseInt(row.count);
      });

      return {
        totalProjects,
        completedProjects,
        overdueProjects,
        blockedProjects,
        overallSuccessRate: parseFloat(overallSuccessRate),
        avgDurationDays: avgDuration,
        phaseBreakdown
      };
    } catch (error) {
      logger.error('Error in getAdditionalStatistics:', error);
      throw error;
    }
  }

  /**
   * คำนวณระยะเวลาเฉลี่ยในการทำโครงงาน
   */
  async calculateAverageDuration({ academicYear, semester } = {}) {
    try {
      const projectWhere = {
        status: 'completed' // เฉพาะโครงงานที่จบแล้ว
      };
      if (academicYear) projectWhere.academicYear = academicYear;
      if (semester) projectWhere.semester = semester;

      const completedProjects = await ProjectWorkflowState.findAll({
        where: {
          currentPhase: {
            [Op.in]: ['COMPLETED', 'ARCHIVED']
          },
          updatedAt: { [Op.not]: null }
        },
        include: [{
          model: ProjectDocument,
          as: 'project',
          where: projectWhere,
          attributes: ['createdAt'],
          required: true
        }],
        attributes: ['createdAt', 'updatedAt']
      });

      if (completedProjects.length === 0) return 0;

      let totalDays = 0;
      completedProjects.forEach(project => {
        const start = dayjs(project.createdAt);
        const end = dayjs(project.updatedAt);
        const days = end.diff(start, 'day');
        if (days > 0) totalDays += days;
      });

      const avgDays = completedProjects.length > 0 
        ? Math.round(totalDays / completedProjects.length) 
        : 0;

      return avgDays;
    } catch (error) {
      logger.error('Error in calculateAverageDuration:', error);
      return 0;
    }
  }

  /**
   * ดึงรายชื่อนักศึกษาแยกตามสถานะ
   */
  async getStudentsByStatus({ status, academicYear, semester, limit = 100, offset = 0 } = {}) {
    try {
      const whereClause = {};
      const projectWhere = {};

      // Map status เป็น currentPhase
      if (status) {
        const statusPhaseMap = {
          'topic_pending': ['TOPIC_EXAM_PENDING', 'TOPIC_EXAM_SCHEDULED'],
          'topic_passed': { topicExamResult: 'PASS' },
          'topic_failed': ['TOPIC_FAILED'],
          'in_progress': ['IN_PROGRESS'],
          'thesis_pending': ['THESIS_EXAM_PENDING', 'THESIS_EXAM_SCHEDULED'],
          'thesis_passed': { thesisExamResult: 'PASS' },
          'thesis_failed': ['THESIS_FAILED'],
          'completed': ['COMPLETED', 'ARCHIVED'],
          'overdue': { isOverdue: true },
          'blocked': { isBlocked: true }
        };

        const mapping = statusPhaseMap[status];
        if (mapping) {
          if (Array.isArray(mapping)) {
            whereClause.currentPhase = { [Op.in]: mapping };
          } else {
            Object.assign(whereClause, mapping);
          }
        }
      }

      if (academicYear) projectWhere.academicYear = academicYear;
      if (semester) projectWhere.semester = semester;

      const { count, rows } = await ProjectWorkflowState.findAndCountAll({
        where: whereClause,
        include: [{
          model: ProjectDocument,
          as: 'project',
          where: Object.keys(projectWhere).length > 0 ? projectWhere : undefined,
          required: true,
          attributes: ['projectId', 'projectNameTh', 'projectNameEn', 'academicYear', 'semester'],
          include: [{
            model: ProjectMember,
            as: 'members',
            include: [{
              model: Student,
              as: 'student',
              include: [{
                model: User,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email']
              }]
            }]
          }]
        }],
        order: [['updatedAt', 'DESC']],
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
      logger.error('Error in getStudentsByStatus:', error);
      throw error;
    }
  }

  /**
   * รวมสถิติทั้งหมดสำหรับแผงควบคุมธุรการ
   */
  async getAdministrativeReport({ academicYear, semester } = {}) {
    try {
      const [project1Stats, project2Stats, additionalStats] = await Promise.all([
        this.getProject1Statistics({ academicYear, semester }),
        this.getProject2Statistics({ academicYear, semester }),
        this.getAdditionalStatistics({ academicYear, semester })
      ]);

      return {
        project1: project1Stats,
        project2: project2Stats,
        additional: additionalStats,
        summary: {
          totalProjects: additionalStats.totalProjects,
          completedProjects: additionalStats.completedProjects,
          activeProjects: additionalStats.totalProjects - additionalStats.completedProjects,
          overallSuccessRate: additionalStats.overallSuccessRate,
          criticalIssues: additionalStats.overdueProjects + additionalStats.blockedProjects
        }
      };
    } catch (error) {
      logger.error('Error in getAdministrativeReport:', error);
      throw error;
    }
  }

  /**
   * สถิติแนวโน้มการสอบผ่าน/ไม่ผ่าน (เปรียบเทียบรายปี)
   */
  async getExamTrends({ startYear, endYear } = {}) {
    try {
      const currentYear = new Date().getFullYear() + 543;
      const start = startYear || currentYear - 3;
      const end = endYear || currentYear;

      const trends = [];

      for (let year = start; year <= end; year++) {
        const [project1Stats, project2Stats] = await Promise.all([
          this.getProject1Statistics({ academicYear: year }),
          this.getProject2Statistics({ academicYear: year })
        ]);

        trends.push({
          academicYear: year,
          project1: {
            passed: project1Stats.topicExamPassed,
            failed: project1Stats.topicExamFailed,
            passRate: project1Stats.topicPassRate
          },
          project2: {
            passed: project2Stats.thesisExamPassed,
            failed: project2Stats.thesisExamFailed,
            passRate: project2Stats.thesisPassRate
          }
        });
      }

      return trends;
    } catch (error) {
      logger.error('Error in getExamTrends:', error);
      throw error;
    }
  }
}

module.exports = new ProjectReportService();

