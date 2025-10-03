const {
  ProjectExamResult,
  ProjectDocument,
  ProjectMember,
  Student,
  User,
  Teacher,
  ProjectDefenseRequest,
  Academic,
  sequelize
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const projectDocumentService = require('./projectDocumentService');
const projectWorkflowService = require('./projectWorkflowService');
const dayjs = require('dayjs');

const DEFENSE_READY_STATUSES = ['staff_verified', 'scheduled', 'completed'];

class ProjectExamResultService {
  /**
   * รวม include พื้นฐานของ ProjectDocument เพื่อป้องกันโค้ดซ้ำ
   */
  _buildProjectIncludes({ includeDefenseRequests = false, defenseWhere, defenseRequired = false } = {}) {
    const includes = [
      {
        model: ProjectMember,
        as: 'members',
        include: [
          {
            model: Student,
            as: 'student',
            include: [{ model: User, as: 'user' }]
          }
        ]
      },
      {
        model: Teacher,
        as: 'advisor',
        include: [{ model: User, as: 'user' }]
      },
      {
        model: Teacher,
        as: 'coAdvisor',
        include: [{ model: User, as: 'user' }]
      }
    ];

    if (includeDefenseRequests) {
      includes.push({
        model: ProjectDefenseRequest,
        as: 'defenseRequests',
        where: defenseWhere,
        required: defenseRequired
      });
    }

    return includes;
  }

  /**
   * ดึงรายการโครงงานที่พร้อมบันทึกผลสอบ PROJECT1
   */
  async getProject1PendingResults({ academicYear, semester, search, status } = {}) {
    try {
      const whereClause = {};

      if (academicYear) {
        whereClause.academicYear = academicYear;
      }

      if (semester) {
        whereClause.semester = semester;
      }

      const projects = await ProjectDocument.findAll({
        where: whereClause,
        include: [
          ...this._buildProjectIncludes({
            includeDefenseRequests: true,
            defenseRequired: true,
            defenseWhere: {
              defenseType: 'PROJECT1',
              status: { [Op.in]: DEFENSE_READY_STATUSES }
            }
          }),
          {
            model: ProjectExamResult,
            as: 'examResults',
            where: { exam_type: 'PROJECT1' },
            required: false
          }
        ],
        order: [['projectId', 'ASC']]
      });

      const normalizedStatus = (status || 'pending').toLowerCase();

      let projectList = projects.map((project) => {
        const json = project.toJSON();
        const normalizedId = json.projectId ?? json.project_id ?? null;
        const sortedExamResults = Array.isArray(json.examResults)
          ? [...json.examResults].sort((a, b) => {
              const aTime = a.recordedAt ? new Date(a.recordedAt).getTime() : 0;
              const bTime = b.recordedAt ? new Date(b.recordedAt).getTime() : 0;
              return bTime - aTime;
            })
          : [];

        return {
          ...json,
          projectId: normalizedId != null ? Number(normalizedId) : null,
          examResults: sortedExamResults
        };
      });

      switch (normalizedStatus) {
        case 'pending':
          projectList = projectList.filter((project) => !project.examResults || project.examResults.length === 0);
          break;
        case 'passed':
          projectList = projectList.filter(
            (project) => project.examResults && project.examResults.length > 0 && project.examResults[0].result === 'PASS'
          );
          break;
        case 'failed':
          projectList = projectList.filter(
            (project) => project.examResults && project.examResults.length > 0 && project.examResults[0].result === 'FAIL'
          );
          break;
        case 'all':
          // ไม่กรอง
          break;
          break;
        default:
          // สำหรับค่าที่ไม่รู้จัก ให้ถือว่า pending เพื่อความเข้ากันได้ย้อนหลัง
          projectList = projectList.filter((project) => !project.examResults || project.examResults.length === 0);
          break;
      }

      if (search) {
        const keyword = search.trim().toLowerCase();

        projectList = projectList.filter((project) => {
          const projectFields = [
            project.projectNameTh,
            project.projectNameEn,
            project.projectCode,
            project.projectId != null ? String(project.projectId) : null
          ];

          const projectMatches = projectFields.some(
            (field) => field && field.toLowerCase().includes(keyword)
          );

          const memberMatches = (project.members || []).some((member) => {
            const studentCode = member.student?.studentCode;
            const fullName = member.student?.user
              ? `${member.student.user.firstName || ''} ${member.student.user.lastName || ''}`.trim()
              : '';

            return (
              (studentCode && studentCode.toLowerCase().includes(keyword)) ||
              (fullName && fullName.toLowerCase().includes(keyword))
            );
          });

          return projectMatches || memberMatches;
        });
      }

      return projectList;
    } catch (error) {
      logger.error('Error in getProject1PendingResults:', error);
      throw error;
    }
  }

  /**
   * บันทึกผลสอบโครงงานพิเศษ
   */
  async recordExamResult(projectId, examData, recordedByUserId) {
    const normalizedProjectId = Number(projectId);

    if (!Number.isInteger(normalizedProjectId) || normalizedProjectId <= 0) {
      throw new Error('รหัสโครงงานไม่ถูกต้อง');
    }

    const transaction = await sequelize.transaction();

    try {
      const { examType, result, score, notes, requireScopeRevision } = examData;

      const project = await ProjectDocument.findByPk(normalizedProjectId, {
        include: this._buildProjectIncludes({ includeDefenseRequests: true }),
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!project) {
        throw new Error(`ไม่พบโครงงานที่ระบุ (ID: ${normalizedProjectId})`);
      }

      const existingResult = await ProjectExamResult.hasExamResult(normalizedProjectId, examType);
      if (existingResult) {
        throw new Error('โครงงานนี้มีผลสอบแล้ว ไม่สามารถบันทึกซ้ำได้');
      }

      const defenseRequest = (project.defenseRequests || []).find(
        (request) =>
          request.defenseType === examType && DEFENSE_READY_STATUSES.includes(request.status)
      );

      if (!defenseRequest) {
        throw new Error('โครงงานยังไม่พร้อมสำหรับบันทึกผลสอบ');
      }

      const examResult = await ProjectExamResult.create(
        {
          projectId: normalizedProjectId,
          examType,
          result,
          score: score ?? null,
          notes: notes ?? null,
          requireScopeRevision: result === 'PASS' ? Boolean(requireScopeRevision) : false,
          recordedByUserId,
          recordedAt: new Date()
        },
        { transaction }
      );

      const examRecordedAt = new Date();
      const projectUpdates = {
        examResult: result === 'PASS' ? 'passed' : 'failed',
        examResultAt: examRecordedAt,
        examFailReason: result === 'FAIL' ? notes || null : null,
        studentAcknowledgedAt: null
      };

      if (result === 'PASS') {
        projectUpdates.status = examType === 'THESIS' ? 'completed' : 'in_progress';
      }

      await project.update(projectUpdates, { transaction });
      await defenseRequest.update({ status: 'completed' }, { transaction });

      await project.reload({
        include: this._buildProjectIncludes({ includeDefenseRequests: true }),
        transaction
      });

      // ซิงก์สถานะ Workflow ให้อัตโนมัติ เพื่อให้นักศึกษามองเห็นสเตตัสล่าสุด
      await projectDocumentService.syncProjectWorkflowState(project.projectId, {
        transaction,
        projectInstance: project
      });

      if (examType === 'PROJECT1' && result === 'PASS') {
        const canUnlock = await this._canUnlockNextPhase(project, transaction);
        if (canUnlock) {
          for (const member of project.members || []) {
            if (!member.studentId) {
              continue;
            }
            await projectWorkflowService.unlockNextPhase(
              member.studentId,
              'PROJECT1_DEFENSE_RESULT',
              transaction
            );
          }
        }
      }

      await this._sendExamResultNotifications(project, examResult);

      await transaction.commit();

      logger.info(`ผลสอบ ${examType} ถูกบันทึกสำหรับโครงงาน ${normalizedProjectId}: ${result}`);
      return examResult;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error in recordExamResult:', error);
      throw error;
    }
  }

  /**
   * ดึงผลสอบของโครงงาน
   */
  async getExamResult(projectId, examType) {
    try {
      return await ProjectExamResult.getExamResult(projectId, examType);
    } catch (error) {
      logger.error('Error in getExamResult:', error);
      throw error;
    }
  }

  /**
   * นักศึกษารับทราบผลสอบ (กรณีไม่ผ่าน)
   */
  async acknowledgeExamResult(projectId, examType, studentId) {
    const normalizedProjectId = Number(projectId);

    if (!Number.isInteger(normalizedProjectId) || normalizedProjectId <= 0) {
      throw new Error('รหัสโครงงานไม่ถูกต้อง');
    }

    const transaction = await sequelize.transaction();

    try {
      const member = await ProjectMember.findOne({
        where: { projectId: normalizedProjectId, studentId },
        transaction
      });

      if (!member) {
        throw new Error('คุณไม่ได้เป็นสมาชิกของโครงงานนี้');
      }

      const examResult = await ProjectExamResult.findOne({
        where: { project_id: normalizedProjectId, exam_type: examType },
        transaction
      });

      if (!examResult) {
        throw new Error('ไม่พบผลสอบ');
      }

      if (examResult.result !== 'FAIL') {
        throw new Error('สามารถรับทราบได้เฉพาะกรณีสอบไม่ผ่านเท่านั้น');
      }

      if (examResult.studentAcknowledgedAt) {
        throw new Error('รับทราบผลแล้ว');
      }

      const acknowledgedAt = new Date();

      await examResult.update(
        {
          studentAcknowledgedAt: acknowledgedAt
        },
        { transaction }
      );

      const project = await ProjectDocument.findByPk(normalizedProjectId, {
        include: this._buildProjectIncludes({ includeDefenseRequests: true }),
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!project) {
        throw new Error(`ไม่พบโครงงานที่ระบุ (ID: ${normalizedProjectId})`);
      }

      await project.update(
        {
          status: 'archived',
          archivedAt: acknowledgedAt,
          studentAcknowledgedAt: acknowledgedAt
        },
        { transaction }
      );

      await project.reload({
        include: this._buildProjectIncludes({ includeDefenseRequests: true }),
        transaction
      });

      await projectDocumentService.syncProjectWorkflowState(project.projectId, {
        transaction,
        projectInstance: project
      });

      await transaction.commit();

      logger.info(`นักศึกษา ${studentId} รับทราบผลสอบ ${examType} ของโครงงาน ${normalizedProjectId}`);
      return examResult;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error in acknowledgeExamResult:', error);
      throw error;
    }
  }

  /**
   * ดึงสถิติผลสอบ (สำหรับรายงาน)
   */
  async getExamStatistics({ academicYear, semester, examType = 'PROJECT1' } = {}) {
    try {
      const whereClause = { exam_type: examType };

      const include = [
        {
          model: ProjectDocument,
          as: 'project',
          attributes: ['projectId', 'projectNameTh', 'status', 'academicYear', 'semester']
        }
      ];

      if (academicYear || semester) {
        include[0].where = {};
        if (academicYear) {
          include[0].where.academicYear = academicYear;
        }
        if (semester) {
          include[0].where.semester = semester;
        }
      }

      const results = await ProjectExamResult.findAll({
        where: whereClause,
        include
      });

      const stats = {
        total: results.length,
        pass: results.filter((r) => r.result === 'PASS').length,
        fail: results.filter((r) => r.result === 'FAIL').length,
        passRate: 0,
        requireScopeRevision: results.filter((r) => r.requireScopeRevision).length,
        acknowledged: results.filter((r) => r.result === 'FAIL' && r.studentAcknowledgedAt).length
      };

      stats.passRate = stats.total > 0 ? Number(((stats.pass / stats.total) * 100).toFixed(2)) : 0;

      return stats;
    } catch (error) {
      logger.error('Error in getExamStatistics:', error);
      throw error;
    }
  }

  /**
   * ส่งการแจ้งเตือนผลสอบ
   */
  async _canUnlockNextPhase(project, transaction) {
    try {
      if (!project || !project.semester) {
        return false;
      }

      const nextSemester = project.semester === 3 ? 1 : project.semester + 1;

      if (!nextSemester || nextSemester === project.semester) {
        return false;
      }

      const whereCandidates = [];
      if (project.academicYear) {
        whereCandidates.push({ academicYear: project.academicYear });
      }
      whereCandidates.push({ isCurrent: true });

      let academicSettings = null;
      for (const where of whereCandidates) {
        academicSettings = await Academic.findOne({
          where,
          order: [['updated_at', 'DESC']],
          transaction
        });
        if (academicSettings) {
          break;
        }
      }

      if (!academicSettings) {
        logger.warn('ข้ามการปลดล็อก Phase 2: ไม่พบข้อมูลปีการศึกษา', {
          projectId: project.projectId
        });
        return false;
      }

      const rangeField = nextSemester === 1 ? 'semester1Range' : nextSemester === 2 ? 'semester2Range' : 'semester3Range';
      const rangeValue = academicSettings[rangeField];

      if (!rangeValue || !rangeValue.start) {
        logger.info('ข้ามการปลดล็อก Phase 2: ยังไม่มีช่วงภาคเรียนถัดไปหรือยังไม่กำหนดวันที่เริ่มต้น', {
          projectId: project.projectId,
          nextSemester
        });
        return false;
      }

      const start = dayjs(rangeValue.start);

      if (!start.isValid()) {
        logger.warn('ข้ามการปลดล็อก Phase 2: ค่ากำหนดวันเริ่มภาคเรียนถัดไปไม่ถูกต้อง', {
          projectId: project.projectId,
          nextSemester,
          start: rangeValue.start
        });
        return false;
      }

      const now = dayjs();

      if (start.isAfter(now)) {
        logger.info('ข้ามการปลดล็อก Phase 2: ภาคเรียนถัดไปยังไม่เปิด', {
          projectId: project.projectId,
          nextSemester,
          startsAt: start.toISOString()
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in _canUnlockNextPhase:', error);
      return false;
    }
  }

  async _sendExamResultNotifications(project, examResult) {
    try {
      const examTypeTh = examResult.examType === 'PROJECT1' ? 'โครงงานพิเศษ 1' : 'ปริญญานิพนธ์';
      const resultTh = examResult.result === 'PASS' ? 'ผ่าน' : 'ไม่ผ่าน';
      const resultIcon = examResult.result === 'PASS' ? '🎉' : '❌';

      for (const member of project.members) {
        const studentEmail = member.student?.user?.email;
        if (!studentEmail) {
          continue;
        }

        let message = `${resultIcon} ผลการสอบ${examTypeTh}: ${resultTh}\n\nโครงงาน: ${project.projectNameTh}`;

        if (examResult.notes) {
          message += `\n\nหมายเหตุจากคณะกรรมการ:\n${examResult.notes}`;
        }

        if (examResult.result === 'PASS') {
          if (examResult.requireScopeRevision) {
            message += '\n\n⚠️ คุณต้องส่งเอกสารปรับปรุง Scope ก่อนดำเนินการต่อ';
          } else {
            message += '\n\n✅ คุณสามารถเดินหน้าไปยังขั้นตอนถัดไปได้แล้ว';
          }
        } else {
          message += '\n\nกรุณาเข้าระบบเพื่อรับทราบผล';
        }

        logger.info(`Notification sent to student: ${studentEmail}`);
      }

      const advisorEmail = project.advisor?.user?.email;
      if (advisorEmail) {
        logger.info(`Notification sent to advisor: ${advisorEmail}`);
      }

      const coAdvisorEmail = project.coAdvisor?.user?.email;
      if (coAdvisorEmail) {
        logger.info(`Notification sent to co-advisor: ${coAdvisorEmail}`);
      }
    } catch (error) {
      logger.error('Error sending exam result notifications:', error);
    }
  }
}

module.exports = new ProjectExamResultService();
