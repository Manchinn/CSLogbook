const {
  ProjectDocument,
  ProjectMember,
  Student,
  Teacher,
  User,
  Document,
  ProjectTrack,
  sequelize
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * ProjectMembersService - บริการสำหรับจัดการข้อมูลสมาชิกโครงงาน
 * แยก business logic ออกจาก controller เพื่อความง่ายในการดูแลรักษาและทดสอบ
 */
class ProjectMembersService {
  /**
   * ดึงข้อมูลโครงงานและสมาชิกทั้งหมดที่ได้รับการอนุมัติ
   * @returns {Array} รายการโครงงานพร้อมข้อมูลสมาชิก
   */
  async getAllApprovedProjectMembers({ projectStatus, documentStatus, trackCodes, projectType } = {}) {
    try {
      logger.info('ProjectMembersService: Fetching project member overview', {
        projectStatus,
        documentStatus,
        trackCodes,
        projectType
      });

      const whereClause = {};
      if (projectStatus) {
        const statusList = Array.isArray(projectStatus) ? projectStatus : [projectStatus];
        whereClause.status = { [Op.in]: statusList };
      }
      if (projectType) {
        const typeList = Array.isArray(projectType) ? projectType : [projectType];
        whereClause.projectType = { [Op.in]: typeList };
      }

      const documentWhere = {};
      if (documentStatus) {
        const docStatusList = Array.isArray(documentStatus) ? documentStatus : [documentStatus];
        documentWhere.status = { [Op.in]: docStatusList };
      }

      const projects = await ProjectDocument.findAll({
        where: Object.keys(whereClause).length ? whereClause : undefined,
        include: [
          {
            model: Document,
            as: 'document',
            attributes: ['documentId', 'status', 'category', 'submittedAt', 'reviewDate'],
            ...(Object.keys(documentWhere).length ? { where: documentWhere } : {})
          },
          {
            model: ProjectMember,
            as: 'members',
            include: [
              {
                model: Student,
                as: 'student',
                attributes: [
                  'studentId',
                  'studentCode',
                  'classroom',
                  'phoneNumber',
                  'isEligibleInternship',
                  'isEligibleProject',
                  'totalCredits',
                  'majorCredits'
                ],
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
            attributes: ['teacherId', 'teacherCode', 'position'],
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
            attributes: ['teacherId', 'teacherCode', 'position'],
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email']
              }
            ]
          },
          {
            model: ProjectTrack,
            as: 'tracks',
            attributes: ['trackCode']
          }
        ],
        order: [
          ['created_at', 'DESC'],
          [{ model: ProjectMember, as: 'members' }, 'role', 'ASC']
        ]
      });

      logger.info(`ProjectMembersService: Found ${projects.length} projects matching filters`);

      const filteredProjects = Array.isArray(trackCodes) && trackCodes.length
        ? projects.filter(project =>
            (project.tracks || []).some(track => trackCodes.includes(track.trackCode))
          )
        : projects;

      const formattedProjects = filteredProjects.map(project => {
        const projectJson = project.toJSON();

        const memberDetails = (projectJson.members || [])
          .map(member => {
            const student = member.student;
            const user = student?.user;
            return {
              role: member.role,
              joinedAt: member.joinedAt,
              studentId: student?.studentId,
              studentCode: student?.studentCode,
              classroom: student?.classroom,
              phoneNumber: student?.phoneNumber,
              isEligibleInternship: student?.isEligibleInternship,
              isEligibleProject: student?.isEligibleProject,
              totalCredits: student?.totalCredits,
              majorCredits: student?.majorCredits,
              userId: user?.userId,
              firstName: user?.firstName,
              lastName: user?.lastName,
              fullName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null,
              email: user?.email
            };
          })
          // จัดให้นำหัวหน้าทีมมาแสดงก่อน
          .sort((a, b) => {
            if (a.role === b.role) {
              return 0;
            }
            if (a.role === 'leader') {
              return -1;
            }
            if (b.role === 'leader') {
              return 1;
            }
            return 0;
          });

        const advisorUser = projectJson.advisor?.user;
        const coAdvisorUser = projectJson.coAdvisor?.user;

        return {
          projectId: projectJson.projectId,
          projectCode: projectJson.projectCode,
          projectNameTh: projectJson.projectNameTh,
          projectNameEn: projectJson.projectNameEn,
          projectType: projectJson.projectType,
          status: projectJson.status,
          documentStatus: projectJson.document?.status ?? null,
          documentCategory: projectJson.document?.category ?? null,
          academicYear: projectJson.academicYear,
          semester: projectJson.semester,
          objective: projectJson.objective,
          background: projectJson.background,
          scope: projectJson.scope,
          expectedOutcome: projectJson.expectedOutcome,
          benefit: projectJson.benefit,
          methodology: projectJson.methodology,
          tools: projectJson.tools,
          timelineNote: projectJson.timelineNote,
          risk: projectJson.risk,
          constraints: projectJson.constraints,
          createdAt: projectJson.created_at,
      updatedAt: projectJson.updated_at,
          submittedAt: projectJson.document?.submittedAt ?? null,
          reviewDate: projectJson.document?.reviewDate ?? null,
          tracks: (projectJson.tracks || []).map(track => track.trackCode),
          advisor: projectJson.advisor
            ? {
                teacherId: projectJson.advisor.teacherId,
                teacherCode: projectJson.advisor.teacherCode,
                position: projectJson.advisor.position,
                userId: advisorUser?.userId,
                firstName: advisorUser?.firstName,
                lastName: advisorUser?.lastName,
                fullName: advisorUser
                  ? `${advisorUser.firstName || ''} ${advisorUser.lastName || ''}`.trim()
                  : null,
                email: advisorUser?.email
              }
            : null,
          coAdvisor: projectJson.coAdvisor
            ? {
                teacherId: projectJson.coAdvisor.teacherId,
                teacherCode: projectJson.coAdvisor.teacherCode,
                position: projectJson.coAdvisor.position,
                userId: coAdvisorUser?.userId,
                firstName: coAdvisorUser?.firstName,
                lastName: coAdvisorUser?.lastName,
                fullName: coAdvisorUser
                  ? `${coAdvisorUser.firstName || ''} ${coAdvisorUser.lastName || ''}`.trim()
                  : null,
                email: coAdvisorUser?.email
              }
            : null,
          members: memberDetails
        };
      });

      return formattedProjects;
    } catch (error) {
      logger.error('ProjectMembersService: Error fetching approved project members', error);
      throw new Error('ไม่สามารถดึงข้อมูลสมาชิกโครงงานได้: ' + error.message);
    }
  }

  /**
   * อัปเดตสถานะการฝึกงานของสมาชิกโครงงาน
   * @returns {Object} ผลการอัปเดต
   */
  async updateProjectMembersInternshipStatus() {
    const t = await sequelize.transaction();
    
    try {
      logger.info('ProjectMembersService: Updating project members internship status');

      // ดึงข้อมูลสมาชิกโครงงานที่ได้รับการอนุมัติ
      const projectMembers = await ProjectMember.findAll({
        include: [
          {
            model: ProjectDocument,
            where: { status: 'approved' }
          },
          {
            model: User,
            include: [
              {
                model: Student
              }
            ]
          }
        ],
        transaction: t
      });

      logger.info(`ProjectMembersService: Found ${projectMembers.length} project members to update`);

      // อัปเดตสถานะการฝึกงานของแต่ละสมาชิก
      let updatedCount = 0;
      for (const member of projectMembers) {
        if (member.User && member.User.Student) {
          await Student.update(
            { isEligibleInternship: member.User.Student.isEligibleInternship },
            { 
              where: { userId: member.userId },
              transaction: t 
            }
          );
          updatedCount++;
        }
      }

      await t.commit();
      
      logger.info(`ProjectMembersService: Successfully updated ${updatedCount} project members`);
      return {
        success: true,
        updatedCount,
        message: 'อัปเดตสถานะการฝึกงานของสมาชิกโครงงานสำเร็จ'
      };
      
    } catch (error) {
      await t.rollback();
      logger.error('ProjectMembersService: Error updating project members internship status', error);
      throw new Error('ไม่สามารถอัปเดตสถานะการฝึกงานของสมาชิกโครงงานได้: ' + error.message);
    }
  }
}

module.exports = new ProjectMembersService();
