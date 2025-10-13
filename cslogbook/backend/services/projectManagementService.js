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
 * ProjectManagementService - บริการสำหรับจัดการโครงงานพิเศษโดยเจ้าหน้าที่ภาควิชา
 * รองรับการเพิ่มโครงงานพิเศษแบบ manual และการจัดการข้อมูลโครงงาน
 */
class ProjectManagementService {

  /**
   * เพิ่มโครงงานพิเศษใหม่โดยเจ้าหน้าที่ภาควิชา (Manual)
   * @param {Object} projectData - ข้อมูลโครงงานพิเศษ
   * @param {string} projectData.studentCode - รหัสนักศึกษาคนที่ 1
   * @param {string} projectData.student2Code - รหัสนักศึกษาคนที่ 2 (optional)
   * @param {string} projectData.projectNameTh - ชื่อโครงงานภาษาไทย (optional)
   * @param {string} projectData.projectNameEn - ชื่อโครงงานภาษาอังกฤษ (optional)
   * @param {string} projectData.projectType - ประเภทโครงงาน (optional)
   * @param {number} projectData.advisorId - ID อาจารย์ที่ปรึกษา (optional)
   * @param {number} projectData.coAdvisorId - ID อาจารย์ที่ปรึกษาร่วม (optional)
   * @param {Array} projectData.trackCodes - รหัสสาย/แทร็ก (optional)
   * @param {number} createdByUserId - ID ของเจ้าหน้าที่ที่สร้าง
   * @returns {Object} ข้อมูลโครงงานที่สร้างใหม่
   */
  async createProjectManually(projectData, createdByUserId) {
    const transaction = await sequelize.transaction();
    
    try {
      const { 
        studentCode, 
        student2Code,
        projectNameTh, 
        projectNameEn, 
        projectType, 
        advisorId, 
        coAdvisorId, 
        trackCodes = [] 
      } = projectData;

      // ตรวจสอบว่านักศึกษาคนที่ 1 มีอยู่จริง
      const student1 = await Student.findOne({
        where: { studentCode },
        include: [{
          model: User,
          as: 'user',
          attributes: ['userId', 'firstName', 'lastName', 'email']
        }],
        transaction
      });

      if (!student1) {
        throw new Error(`ไม่พบนักศึกษารหัส ${studentCode} ในระบบ`);
      }

      // ตรวจสอบว่านักศึกษาคนที่ 1 มีสิทธิ์ทำโครงงานพิเศษ
      if (!student1.isEligibleProject) {
        throw new Error(`นักศึกษารหัส ${studentCode} ยังไม่มีสิทธิ์ทำโครงงานพิเศษ`);
      }

      // ตรวจสอบว่านักศึกษาคนที่ 1 ยังไม่มีโครงงานที่ยังไม่เสร็จสิ้น
      const existingProject1 = await ProjectMember.findOne({
        where: { studentId: student1.studentId },
        include: [{
          model: ProjectDocument,
          as: 'project',
          where: { 
            status: { [Op.notIn]: ['completed', 'archived'] }
          }
        }],
        transaction
      });

      if (existingProject1) {
        throw new Error(`นักศึกษารหัส ${studentCode} มีโครงงานที่ยังไม่เสร็จสิ้นอยู่แล้ว`);
      }

      // ตรวจสอบนักศึกษาคนที่ 2 (ถ้ามี)
      let student2 = null;
      if (student2Code) {
        student2 = await Student.findOne({
          where: { studentCode: student2Code },
          include: [{
            model: User,
            as: 'user',
            attributes: ['userId', 'firstName', 'lastName', 'email']
          }],
          transaction
        });

        if (!student2) {
          throw new Error(`ไม่พบนักศึกษารหัส ${student2Code} ในระบบ`);
        }

        // ตรวจสอบว่านักศึกษาคนที่ 2 มีสิทธิ์ทำโครงงานพิเศษ
        if (!student2.isEligibleProject) {
          throw new Error(`นักศึกษารหัส ${student2Code} ยังไม่มีสิทธิ์ทำโครงงานพิเศษ`);
        }

        // ตรวจสอบว่านักศึกษาคนที่ 2 ยังไม่มีโครงงานที่ยังไม่เสร็จสิ้น
        const existingProject2 = await ProjectMember.findOne({
          where: { studentId: student2.studentId },
          include: [{
            model: ProjectDocument,
            as: 'project',
            where: { 
              status: { [Op.notIn]: ['completed', 'archived'] }
            }
          }],
          transaction
        });

        if (existingProject2) {
          throw new Error(`นักศึกษารหัส ${student2Code} มีโครงงานที่ยังไม่เสร็จสิ้นอยู่แล้ว`);
        }

        // ตรวจสอบว่าไม่ใช่นักศึกษาคนเดียวกัน
        if (studentCode === student2Code) {
          throw new Error(`ไม่สามารถเลือกนักศึกษาคนเดียวกันได้`);
        }
      }

      // ตรวจสอบอาจารย์ที่ปรึกษา (ถ้ามี)
      if (advisorId) {
        const advisor = await Teacher.findByPk(advisorId, { transaction });
        if (!advisor) {
          throw new Error(`ไม่พบอาจารย์ที่ปรึกษา ID: ${advisorId}`);
        }
      }

      // ตรวจสอบอาจารย์ที่ปรึกษาร่วม (ถ้ามี)
      if (coAdvisorId) {
        const coAdvisor = await Teacher.findByPk(coAdvisorId, { transaction });
        if (!coAdvisor) {
          throw new Error(`ไม่พบอาจารย์ที่ปรึกษาร่วม ID: ${coAdvisorId}`);
        }
      }

      // กำหนดปีการศึกษาและเทอมปัจจุบัน
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      // กำหนดเทอมตามเดือน (สมมติ: ม.ค.-พ.ค. = เทอม 2, มิ.ย.-ต.ค. = เทอม 1, พ.ย.-ธ.ค. = เทอม 2)
      let semester = 1;
      let academicYear = currentYear + 543; // แปลงเป็น พ.ศ.
      
      if (currentMonth >= 1 && currentMonth <= 5) {
        semester = 2;
      } else if (currentMonth >= 6 && currentMonth <= 10) {
        semester = 1;
      } else {
        semester = 2;
        academicYear += 1; // ถ้าเป็น พ.ย.-ธ.ค. จะเป็นเทอม 2 ของปีการศึกษาถัดไป
      }

      // สร้าง ProjectDocument (บันทึกลงตาราง project_documents เท่านั้น)
      const projectDocument = await ProjectDocument.create({
        projectNameTh: projectNameTh || null,
        projectNameEn: projectNameEn || null,
        projectType: projectType || null,
        advisorId: advisorId || null,
        coAdvisorId: coAdvisorId || null,
        status: advisorId ? 'in_progress' : 'draft',
        academicYear,
        semester,
        createdByStudentId: student1.studentId,
        // ตั้งค่าผลสอบหัวข้อเป็น 'passed' สำหรับโครงงานที่สร้างแบบ manual
        examResult: 'passed',
        examResultAt: new Date()
      }, { transaction });

      // เพิ่มนักศึกษาคนที่ 1 เป็นสมาชิกโครงงาน (เป็น leader)
      await ProjectMember.create({
        projectId: projectDocument.projectId,
        studentId: student1.studentId,
        role: 'leader'
      }, { transaction });

      // เพิ่มนักศึกษาคนที่ 2 เป็นสมาชิกโครงงาน (ถ้ามี)
      if (student2) {
        await ProjectMember.create({
          projectId: projectDocument.projectId,
          studentId: student2.studentId,
          role: 'member'
        }, { transaction });
      }

      // เพิ่ม tracks (ถ้ามี)
      if (trackCodes.length > 0) {
        const trackPromises = trackCodes.map(trackCode => 
          ProjectTrack.create({
            projectId: projectDocument.projectId,
            trackCode
          }, { transaction })
        );
        await Promise.all(trackPromises);
      }

      await transaction.commit();

      logger.info(`ProjectManagementService: สร้างโครงงานพิเศษสำเร็จ`, {
        projectId: projectDocument.projectId,
        studentCode,
        createdBy: createdByUserId
      });

      // ดึงข้อมูลโครงงานที่สร้างใหม่พร้อม relations
      const createdProject = await this.getProjectById(projectDocument.projectId);

      return {
        success: true,
        message: 'สร้างโครงงานพิเศษสำเร็จ',
        data: createdProject
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('ProjectManagementService: เกิดข้อผิดพลาดในการสร้างโครงงานพิเศษ', {
        error: error.message,
        projectData,
        createdBy: createdByUserId
      });
      throw error;
    }
  }

  /**
   * ดึงข้อมูลโครงงานตาม ID
   * @param {number} projectId - ID ของโครงงาน
   * @returns {Object} ข้อมูลโครงงาน
   */
  async getProjectById(projectId) {
    try {
      const project = await ProjectDocument.findByPk(projectId, {
        include: [
          {
            model: Document,
            as: 'document',
            attributes: ['documentId', 'status', 'created_at', 'updated_at']
          },
          {
            model: ProjectMember,
            as: 'members',
            include: [{
              model: Student,
              as: 'student',
              attributes: ['studentId', 'studentCode', 'classroom'],
              include: [{
                model: User,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email']
              }]
            }]
          },
          {
            model: Teacher,
            as: 'advisor',
            attributes: ['teacherId', 'teacherCode', 'position'],
            include: [{
              model: User,
              as: 'user',
              attributes: ['userId', 'firstName', 'lastName']
            }]
          },
          {
            model: Teacher,
            as: 'coAdvisor',
            attributes: ['teacherId', 'teacherCode', 'position'],
            include: [{
              model: User,
              as: 'user',
              attributes: ['userId', 'firstName', 'lastName']
            }]
          },
          {
            model: ProjectTrack,
            as: 'tracks',
            attributes: ['trackCode']
          }
        ]
      });

      if (!project) {
        throw new Error(`ไม่พบโครงงาน ID: ${projectId}`);
      }

      return project;
    } catch (error) {
      logger.error('ProjectManagementService: เกิดข้อผิดพลาดในการดึงข้อมูลโครงงาน', {
        error: error.message,
        projectId
      });
      throw error;
    }
  }

  /**
   * ดึงรายการโครงงานทั้งหมดสำหรับเจ้าหน้าที่ภาควิชา
   * @param {Object} filters - ตัวกรองข้อมูล
   * @param {string} filters.status - สถานะโครงงาน
   * @param {string} filters.academicYear - ปีการศึกษา
   * @param {number} filters.semester - เทอม
   * @param {number} filters.page - หน้า
   * @param {number} filters.limit - จำนวนรายการต่อหน้า
   * @returns {Object} รายการโครงงานและข้อมูล pagination
   */
  async getAllProjects(filters = {}) {
    try {
      const {
        status,
        academicYear,
        semester,
        page = 1,
        limit = 20
      } = filters;

      const where = {};
      if (status) where.status = status;
      if (academicYear) where.academicYear = academicYear;
      if (semester) where.semester = semester;

      const offset = (page - 1) * limit;

      const { count, rows: projects } = await ProjectDocument.findAndCountAll({
        where,
        include: [
          {
            model: Document,
            as: 'document',
            attributes: ['documentId', 'status', 'created_at']
          },
          {
            model: ProjectMember,
            as: 'members',
            include: [{
              model: Student,
              as: 'student',
              attributes: ['studentId', 'studentCode', 'classroom'],
              include: [{
                model: User,
                as: 'user',
                attributes: ['firstName', 'lastName']
              }]
            }]
          },
          {
            model: Teacher,
            as: 'advisor',
            attributes: ['teacherId', 'teacherCode'],
            include: [{
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }]
          },
          {
            model: ProjectTrack,
            as: 'tracks',
            attributes: ['trackCode']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      const totalPages = Math.ceil(count / limit);

      return {
        projects,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };

    } catch (error) {
      logger.error('ProjectManagementService: เกิดข้อผิดพลาดในการดึงรายการโครงงาน', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูลโครงงานโดยเจ้าหน้าที่ภาควิชา
   * @param {number} projectId - ID ของโครงงาน
   * @param {Object} updateData - ข้อมูลที่ต้องการอัปเดต
   * @param {number} updatedByUserId - ID ของผู้อัปเดต
   * @returns {Object} ข้อมูลโครงงานที่อัปเดตแล้ว
   */
  async updateProject(projectId, updateData, updatedByUserId) {
    const transaction = await sequelize.transaction();

    try {
      const project = await ProjectDocument.findByPk(projectId, { transaction });
      
      if (!project) {
        throw new Error(`ไม่พบโครงงาน ID: ${projectId}`);
      }

      // อัปเดตข้อมูลโครงงาน
      await project.update(updateData, { transaction });

      // อัปเดต tracks (ถ้ามี)
      if (updateData.trackCodes) {
        // ลบ tracks เดิม
        await ProjectTrack.destroy({
          where: { projectId },
          transaction
        });

        // เพิ่ม tracks ใหม่
        if (updateData.trackCodes.length > 0) {
          const trackPromises = updateData.trackCodes.map(trackCode => 
            ProjectTrack.create({
              projectId,
              trackCode
            }, { transaction })
          );
          await Promise.all(trackPromises);
        }
      }

      await transaction.commit();

      logger.info(`ProjectManagementService: อัปเดตโครงงานสำเร็จ`, {
        projectId,
        updatedBy: updatedByUserId
      });

      // ดึงข้อมูลโครงงานที่อัปเดตแล้ว
      const updatedProject = await this.getProjectById(projectId);

      return {
        success: true,
        message: 'อัปเดตข้อมูลโครงงานสำเร็จ',
        data: updatedProject
      };

    } catch (error) {
      await transaction.rollback();
      logger.error('ProjectManagementService: เกิดข้อผิดพลาดในการอัปเดตโครงงาน', {
        error: error.message,
        projectId,
        updateData,
        updatedBy: updatedByUserId
      });
      throw error;
    }
  }

  /**
   * ค้นหานักศึกษาตามรหัสนักศึกษา
   * @param {string} studentCode - รหัสนักศึกษา
   * @returns {Object} ข้อมูลนักศึกษา
   */
  async findStudentByCode(studentCode) {
    try {
      const student = await Student.findOne({
        where: { studentCode },
        include: [{
          model: User,
          as: 'user',
          attributes: ['userId', 'firstName', 'lastName', 'email']
        }],
        attributes: [
          'studentId', 
          'studentCode', 
          'classroom', 
          'isEligibleProject',
          'totalCredits',
          'majorCredits'
        ]
      });

      if (!student) {
        return null;
      }

      // ตรวจสอบว่ามีโครงงานที่ยังไม่เสร็จสิ้น
      const existingProject = await ProjectMember.findOne({
        where: { studentId: student.studentId },
        include: [{
          model: ProjectDocument,
          as: 'project',
          where: { 
            status: { [Op.notIn]: ['completed', 'archived'] }
          },
          attributes: ['projectId', 'projectNameTh', 'status']
        }]
      });

      return {
        ...student.toJSON(),
        hasActiveProject: !!existingProject,
        activeProject: existingProject?.project || null
      };

    } catch (error) {
      logger.error('ProjectManagementService: เกิดข้อผิดพลาดในการค้นหานักศึกษา', {
        error: error.message,
        studentCode
      });
      throw error;
    }
  }

  /**
   * ดึงรายการอาจารย์ที่สามารถเป็นที่ปรึกษาได้
   * @returns {Array} รายการอาจารย์
   */
  async getAvailableAdvisors() {
    try {
      const advisors = await Teacher.findAll({
        where: {
          teacherType: 'academic' // เฉพาะอาจารย์สายวิชาการ
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['userId', 'firstName', 'lastName', 'email']
        }],
        attributes: ['teacherId', 'teacherCode', 'position'],
        order: [
          [{ model: User, as: 'user' }, 'firstName', 'ASC']
        ]
      });

      return advisors;
    } catch (error) {
      logger.error('ProjectManagementService: เกิดข้อผิดพลาดในการดึงรายการอาจารย์', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new ProjectManagementService();