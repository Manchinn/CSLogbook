const { ProjectDocument, ProjectMember, User, Student, sequelize } = require('../models');
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
  async getAllApprovedProjectMembers() {
    try {
      logger.info('ProjectMembersService: Fetching all approved project members');
      
      const projects = await ProjectDocument.findAll({
        include: [{
          model: ProjectMember,
          include: [{
            model: User,
            attributes: ['firstName', 'lastName'],
            include: [{
              model: Student,
              attributes: ['studentCode', 'isEligibleInternship']
            }]
          }]
        }],
        where: {
          '$Document.status$': 'approved'
        }
      });

      logger.info(`ProjectMembersService: Found ${projects.length} approved projects`);

      // แปลงข้อมูลให้อยู่ในรูปแบบที่เหมาะสม
      const formattedProjects = projects.map(project => ({
        projectName: project.projectNameTh,
        student1: project.ProjectMembers[0] ? {
          userId: project.ProjectMembers[0]?.User.id,
          studentCode: project.ProjectMembers[0]?.User.Student.studentCode,
          firstName: project.ProjectMembers[0]?.User.firstName,
          lastName: project.ProjectMembers[0]?.User.lastName,
          isEligibleInternship: project.ProjectMembers[0]?.User.Student.isEligibleInternship
        } : null,
        student2: project.ProjectMembers[1] ? {
          userId: project.ProjectMembers[1].User.id,
          studentCode: project.ProjectMembers[1].User.Student.studentCode,
          firstName: project.ProjectMembers[1].User.firstName,
          lastName: project.ProjectMembers[1].User.lastName,
          isEligibleInternship: project.ProjectMembers[1].User.Student.isEligibleInternship
        } : null,
        createdAt: project.createdAt
      }));

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
