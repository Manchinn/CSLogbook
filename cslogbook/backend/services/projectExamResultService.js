const { ProjectExamResult, ProjectDocument, ProjectMember, Student, User, Teacher, sequelize } = require('../models');
const logger = require('../utils/logger');
// const notificationService = require('./notificationService'); // TODO: เพิ่มเมื่อมี notification service
const projectWorkflowService = require('./projectWorkflowService');

/**
 * Service: ProjectExamResultService
 * จัดการผลการสอบโครงงานพิเศษ (PROJECT1 และ THESIS)
 */
class ProjectExamResultService {
  /**
   * ดึงรายการโครงงานที่พร้อมบันทึกผลสอบ PROJECT1
   * (โครงงานที่ผ่านการอนุมัติจากเจ้าหน้าที่แล้ว แต่ยังไม่มีผลสอบ)
   */
  async getProject1PendingResults({ academicYear, semester } = {}) {
    try {
      const whereClause = {
        status: ['staff_verified', 'scheduled'] // สถานะที่พร้อมบันทึกผล
      };

      // ดึงรายการโครงงานที่มี defense request แต่ยังไม่มีผลสอบ
      const projects = await ProjectDocument.findAll({
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
          },
          {
            model: Teacher,
            as: 'advisor',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email']
              }
            ]
          },
          {
            model: Teacher,
            as: 'coAdvisor',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email']
              }
            ]
          },
          {
            model: ProjectExamResult,
            as: 'examResults',
            where: { exam_type: 'PROJECT1' },
            required: false // LEFT JOIN เพื่อดูว่ามีผลสอบหรือยัง
          }
        ],
        where: whereClause
      });

      // กรองเฉพาะโครงงานที่ยังไม่มีผลสอบ PROJECT1
      const pendingProjects = projects.filter(project => 
        !project.examResults || project.examResults.length === 0
      );

      return pendingProjects;
    } catch (error) {
      logger.error('Error in getProject1PendingResults:', error);
      throw error;
    }
  }

  /**
   * บันทึกผลสอบโครงงานพิเศษ
   */
  async recordExamResult(projectId, examData, recordedByUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      const { examType, result, score, notes, requireScopeRevision } = examData;

      // 1. ตรวจสอบว่าโครงงานมีอยู่จริง
      const project = await ProjectDocument.findByPk(projectId, {
        include: [
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
        ],
        transaction
      });

      if (!project) {
        throw new Error('ไม่พบโครงงานที่ระบุ');
      }

      // 2. ตรวจสอบว่ามีผลสอบแล้วหรือยัง
      const existingResult = await ProjectExamResult.hasExamResult(projectId, examType);
      if (existingResult) {
        throw new Error('โครงงานนี้มีผลสอบแล้ว ไม่สามารถบันทึกซ้ำได้');
      }

      // 3. ตรวจสอบสถานะโครงงาน (ต้องผ่านการอนุมัติจากเจ้าหน้าที่แล้ว)
      if (!['staff_verified', 'scheduled'].includes(project.status)) {
        throw new Error('โครงงานยังไม่พร้อมสำหรับบันทึกผลสอบ');
      }

      // 4. สร้างผลสอบ
      const examResult = await ProjectExamResult.create({
        projectId,
        examType,
        result,
        score: score || null,
        notes: notes || null,
        requireScopeRevision: result === 'PASS' ? (requireScopeRevision || false) : false,
        recordedByUserId,
        recordedAt: new Date()
      }, { transaction });

      // 5. อัปเดตสถานะโครงงาน
      let newProjectStatus;
      if (examType === 'PROJECT1') {
        if (result === 'PASS') {
          newProjectStatus = 'project1_completed';
        } else {
          newProjectStatus = 'project1_failed_pending_ack';
        }
      } else if (examType === 'THESIS') {
        if (result === 'PASS') {
          newProjectStatus = 'thesis_completed';
        } else {
          newProjectStatus = 'thesis_failed_pending_ack';
        }
      }

      await project.update({ status: newProjectStatus }, { transaction });

      // 6. อัปเดต Workflow สำหรับนักศึกษา (ถ้าผ่าน)
      if (result === 'PASS' && examType === 'PROJECT1') {
        // Unlock ขั้นตอนถัดไป (Phase 2)
        for (const member of project.members) {
          await projectWorkflowService.unlockNextPhase(
            member.studentId,
            'PROJECT1_DEFENSE_RESULT',
            transaction
          );
        }
      }

      // 7. ส่งการแจ้งเตือน
      await this._sendExamResultNotifications(project, examResult, transaction);

      await transaction.commit();

      logger.info(`ผลสอบ ${examType} ถูกบันทึกสำหรับโครงงาน ${projectId}: ${result}`);
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
    const transaction = await sequelize.transaction();
    
    try {
      // 1. ตรวจสอบว่านักศึกษาเป็นสมาชิกของโครงงาน
      const member = await ProjectMember.findOne({
        where: { projectId, studentId },
        transaction
      });

      if (!member) {
        throw new Error('คุณไม่ได้เป็นสมาชิกของโครงงานนี้');
      }

      // 2. ดึงผลสอบ
      const examResult = await ProjectExamResult.findOne({
        where: { project_id: projectId, exam_type: examType },
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

      // 3. บันทึกการรับทราบ
      await examResult.update({ 
        studentAcknowledgedAt: new Date() 
      }, { transaction });

      // 4. อัปเดตสถานะโครงงานเป็น archived
      const project = await ProjectDocument.findByPk(projectId, { transaction });
      await project.update({ 
        status: examType === 'PROJECT1' ? 'project1_failed_acknowledged' : 'thesis_failed_acknowledged'
      }, { transaction });

      await transaction.commit();

      logger.info(`นักศึกษา ${studentId} รับทราบผลสอบ ${examType} ของโครงงาน ${projectId}`);
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

      const results = await ProjectExamResult.findAll({
        where: whereClause,
        include: [
          {
            model: ProjectDocument,
            as: 'project',
            attributes: ['projectId', 'projectNameTh', 'status']
          }
        ]
      });

      const stats = {
        total: results.length,
        pass: results.filter(r => r.result === 'PASS').length,
        fail: results.filter(r => r.result === 'FAIL').length,
        passRate: 0,
        requireScopeRevision: results.filter(r => r.requireScopeRevision).length,
        acknowledged: results.filter(r => r.result === 'FAIL' && r.studentAcknowledgedAt).length
      };

      stats.passRate = stats.total > 0 ? ((stats.pass / stats.total) * 100).toFixed(2) : 0;

      return stats;
    } catch (error) {
      logger.error('Error in getExamStatistics:', error);
      throw error;
    }
  }

  /**
   * ส่งการแจ้งเตือนผลสอบ
   * @private
   */
  async _sendExamResultNotifications(project, examResult, transaction) {
    try {
      const examTypeTh = examResult.examType === 'PROJECT1' ? 'โครงงานพิเศษ 1' : 'ปริญญานิพนธ์';
      const resultTh = examResult.result === 'PASS' ? 'ผ่าน' : 'ไม่ผ่าน';
      const resultIcon = examResult.result === 'PASS' ? '🎉' : '❌';

      // แจ้งนักศึกษาทุกคน
      for (const member of project.members) {
        const studentEmail = member.student?.user?.email;
        if (studentEmail) {
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

          // ส่งอีเมล (ถ้า service พร้อม)
          // await notificationService.sendEmail(studentEmail, `ผลการสอบ${examTypeTh}`, message);
          
          logger.info(`Notification sent to student: ${studentEmail}`);
        }
      }

      // แจ้งอาจารย์ที่ปรึกษา
      const advisorEmail = project.advisor?.user?.email;
      if (advisorEmail) {
        const message = `ผลการสอบ${examTypeTh} ของโครงงาน "${project.projectNameTh}": ${resultTh}`;
        // await notificationService.sendEmail(advisorEmail, `ผลการสอบ${examTypeTh}`, message);
        logger.info(`Notification sent to advisor: ${advisorEmail}`);
      }

      // แจ้งอาจารย์ร่วม (ถ้ามี)
      if (project.coAdvisor) {
        const coAdvisorEmail = project.coAdvisor?.user?.email;
        if (coAdvisorEmail) {
          const message = `ผลการสอบ${examTypeTh} ของโครงงาน "${project.projectNameTh}": ${resultTh}`;
          // await notificationService.sendEmail(coAdvisorEmail, `ผลการสอบ${examTypeTh}`, message);
          logger.info(`Notification sent to co-advisor: ${coAdvisorEmail}`);
        }
      }
    } catch (error) {
      logger.error('Error sending exam result notifications:', error);
      // ไม่ throw error เพราะเป็น side effect
    }
  }
}

module.exports = new ProjectExamResultService();
