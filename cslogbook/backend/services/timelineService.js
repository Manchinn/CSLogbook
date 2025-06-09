const { Student, sequelize } = require('../models');
const logger = require('../utils/logger');
const workflowService = require('./workflowService');

class TimelineService {
  /**
   * ดึงข้อมูล timeline รวมของนักศึกษา (internship + project)
   * @param {string|number} studentId - รหัสนักศึกษาหรือ studentId
   * @returns {Object} ข้อมูล timeline รวมของนักศึกษา
   */
  async getStudentCompleteTimeline(studentId) {
    try {
      logger.info(`TimelineService: กำลังค้นหานักศึกษาด้วย ID/รหัสนักศึกษา: ${studentId}`);
      
      // ค้นหานักศึกษา
      const student = await this.findStudent(studentId);
      
      if (!student) {
        throw new Error(`ไม่พบนักศึกษาที่มีรหัส ${studentId}`);
      }
      
      logger.info(`TimelineService: พบนักศึกษา: ${student.studentId} (รหัสนักศึกษา: ${student.studentCode})`);
      
      // สร้าง timeline สำหรับการฝึกงานและโครงงานแยกกัน
      const [internshipTimeline, projectTimeline] = await Promise.all([
        workflowService.generateStudentTimeline(student.studentId, 'internship'),
        workflowService.generateStudentTimeline(student.studentId, 'project')
      ]);
      
      // เพิ่มการปรับแต่งสถานะตามข้อมูลในฐานข้อมูล
      this.adjustTimelineStatus(internshipTimeline, student, 'internship');
      this.adjustTimelineStatus(projectTimeline, student, 'project');
      
      return {
        student: this.formatStudentData(student),
        progress: {
          internship: internshipTimeline,
          project: projectTimeline
        },
        summary: this.createTimelineSummary(internshipTimeline, projectTimeline)
      };
      
    } catch (error) {
      logger.error('TimelineService: Error in getStudentCompleteTimeline', error);
      throw error;
    }
  }

  /**
   * ค้นหานักศึกษาทั้งจาก studentId และ studentCode
   * @param {string|number} studentId - รหัสนักศึกษา
   * @returns {Object|null} ข้อมูลนักศึกษา
   */
  async findStudent(studentId) {
    let student = null;
    
    const numericId = parseInt(studentId);
    if (!isNaN(numericId)) {
      student = await Student.findByPk(numericId, {
        attributes: ['studentId', 'studentCode', 'isEligibleInternship', 'isEligibleProject', 
                  'internshipStatus', 'projectStatus', 'isEnrolledInternship', 'isEnrolledProject']
      });
    }
    
    if (!student) {
      student = await Student.findOne({
        where: { studentCode: studentId.toString() },
        attributes: ['studentId', 'studentCode', 'isEligibleInternship', 'isEligibleProject', 
                  'internshipStatus', 'projectStatus', 'isEnrolledInternship', 'isEnrolledProject']
      });
    }
    
    return student;
  }

  /**
   * ปรับแต่งสถานะ timeline ตามข้อมูลในฐานข้อมูล
   * @param {Object} timeline - ข้อมูล timeline
   * @param {Object} student - ข้อมูลนักศึกษา
   * @param {string} type - ประเภท timeline
   */
  adjustTimelineStatus(timeline, student, type) {
    if (type === 'internship' && student.isEnrolledInternship && timeline.status === 'not_started') {
      timeline.status = student.internshipStatus || 'in_progress';
      timeline.progress = student.internshipStatus === 'completed' ? 100 : Math.max(timeline.progress, 30);
    } else if (type === 'project' && student.isEnrolledProject && timeline.status === 'not_started') {
      timeline.status = student.projectStatus || 'in_progress';
      timeline.progress = student.projectStatus === 'completed' ? 100 : Math.max(timeline.progress, 30);
    }
  }

  /**
   * จัดรูปแบบข้อมูลนักศึกษาสำหรับการส่งกลับ
   * @param {Object} student - ข้อมูลนักศึกษา
   * @returns {Object} ข้อมูลนักศึกษาที่จัดรูปแบบแล้ว
   */
  formatStudentData(student) {
    return {
      id: student.studentId,
      studentId: student.studentId,
      studentCode: student.studentCode,
      internshipStatus: student.internshipStatus,
      isEnrolledInternship: !!student.isEnrolledInternship,
      isEligibleInternship: student.isEligibleInternship,
      isEligibleProject: student.isEligibleProject,
      isEnrolledProject: !!student.isEnrolledProject,
      projectStatus: student.projectStatus,
    };
  }

  /**
   * สร้างสรุป timeline
   * @param {Object} internshipTimeline - timeline การฝึกงาน
   * @param {Object} projectTimeline - timeline โครงงาน
   * @returns {Object} สรุป timeline
   */
  createTimelineSummary(internshipTimeline, projectTimeline) {
    return {
      overallProgress: Math.round((internshipTimeline.progress + projectTimeline.progress) / 2),
      nextAction: this.determineNextAction(internshipTimeline.steps, projectTimeline.steps),
      completedSteps: (internshipTimeline.steps?.filter(s => s.status === 'completed')?.length || 0) +
                     (projectTimeline.steps?.filter(s => s.status === 'completed')?.length || 0),
      totalSteps: (internshipTimeline.totalStepsDisplay || 0) + (projectTimeline.totalStepsDisplay || 0)
    };
  }

  /**
   * ดึงข้อมูล timeline ของนักศึกษา
   * @param {string|number} studentId - รหัสนักศึกษาหรือ studentId
   * @returns {Object} ข้อมูล timeline ของนักศึกษา
   */
  async getStudentTimeline(studentId) {
    try {
      logger.info(`TimelineService: กำลังค้นหานักศึกษาด้วย ID/รหัสนักศึกษา: ${studentId}`);
      
      // ค้นหานักศึกษาทั้งจาก studentId และ studentCode
      let student = null;
      
      const numericId = parseInt(studentId);
      if (!isNaN(numericId)) {
        student = await Student.findByPk(numericId, {
          attributes: ['studentId', 'studentCode', 'isEligibleInternship', 'isEligibleProject', 
                    'internshipStatus', 'projectStatus', 'isEnrolledInternship', 'isEnrolledProject']
        });
      }
      
      if (!student) {
        student = await Student.findOne({
          where: { studentCode: studentId.toString() },
          attributes: ['studentId', 'studentCode', 'isEligibleInternship', 'isEligibleProject', 
                    'internshipStatus', 'projectStatus', 'isEnrolledInternship', 'isEnrolledProject']
        });
      }
      
      if (!student) {
        throw new Error(`ไม่พบนักศึกษาที่มีรหัส ${studentId}`);
      }
      
      logger.info(`TimelineService: พบนักศึกษา: ${student.studentId} (รหัสนักศึกษา: ${student.studentCode})`);
      
      // สร้าง timeline สำหรับการฝึกงานและโครงงาน
      const [internshipTimeline, projectTimeline] = await Promise.all([
        this.generateTimelineForType(student.studentId, 'internship', student),
        this.generateTimelineForType(student.studentId, 'project', student)
      ]);
      
      return {
        student: {
          id: student.studentId,
          studentId: student.studentId,
          studentCode: student.studentCode,
          internshipStatus: student.internshipStatus,
          isEnrolledInternship: !!student.isEnrolledInternship,
          isEligibleInternship: student.isEligibleInternship,
          isEligibleProject: student.isEligibleProject,
          isEnrolledProject: student.isEnrolledProject,
          projectStatus: student.projectStatus,
        },
        progress: {
          internship: internshipTimeline,
          project: projectTimeline
        }
      };
      
    } catch (error) {
      logger.error('TimelineService: Error in getStudentTimeline', error);
      throw error;
    }
  }
  
  /**
   * สร้าง timeline สำหรับประเภทที่กำหนด
   * @param {number} studentId - ID ของนักศึกษา
   * @param {string} type - ประเภท timeline ('internship' หรือ 'project')
   * @param {Object} student - ข้อมูลนักศึกษา
   * @returns {Object} timeline ที่สร้างขึ้น
   */
  async generateTimelineForType(studentId, type, student) {
    try {
      const timeline = await workflowService.generateStudentTimeline(studentId, type);
      
      // ปรับแต่งสถานะตามข้อมูลในฐานข้อมูล
      if (type === 'internship' && student.isEnrolledInternship && timeline.status === 'not_started') {
        timeline.status = student.internshipStatus || 'in_progress';
        timeline.progress = student.internshipStatus === 'completed' ? 100 : 30;
      }
      
      return timeline;
    } catch (error) {
      logger.error(`TimelineService: Error generating ${type} timeline:`, error);
      
      // กำหนดค่าเริ่มต้นในกรณีเกิดข้อผิดพลาด
      const statusField = type === 'internship' ? 'internshipStatus' : 'projectStatus';
      return {
        steps: [],
        progress: 0,
        status: student[statusField] || 'not_started',
        currentStepDisplay: 0,
        totalStepsDisplay: 0
      };
    }
  }
  
  /**
   * เริ่มต้น timeline สำหรับนักศึกษา
   * @param {number} studentId - ID ของนักศึกษา
   * @param {string} timelineType - ประเภท timeline ('internship' หรือ 'project')
   * @returns {Object} ผลการเริ่มต้น timeline
   */
  async initializeStudentTimeline(studentId, timelineType = 'internship') {
    try {
      logger.info(`TimelineService: เริ่มต้น timeline ${timelineType} สำหรับนักศึกษา ${studentId}`);
      
      // ตรวจสอบว่านักศึกษามีอยู่จริง
      const student = await Student.findByPk(studentId);
      if (!student) {
        throw new Error('ไม่พบข้อมูลนักศึกษา');
      }
      
      // กำหนด workflow type
      let workflowType;
      if (timelineType === 'internship') {
        workflowType = 'internship';
      } else if (timelineType === 'project') {
        workflowType = 'project1';
      } else {
        throw new Error('ประเภท timeline ไม่ถูกต้อง ต้องเป็น "internship" หรือ "project"');
      }
      
      // ดึงขั้นตอนแรกของ workflow
      const stepDefinitions = await workflowService.getWorkflowStepDefinitions(workflowType);
      const firstStep = stepDefinitions.length > 0 ? stepDefinitions[0] : null;
      
      if (!firstStep) {
        throw new Error(`ไม่พบข้อมูลขั้นตอนสำหรับ ${workflowType}`);
      }
      
      // เริ่มต้น workflow activity
      const activity = await workflowService.updateStudentWorkflowActivity(
        studentId,
        workflowType,
        firstStep.stepKey,
        'pending',
        'not_started',
        {}
      );
      
      logger.info(`TimelineService: เริ่มต้น ${timelineType} timeline สำเร็จ`);
      return activity;
      
    } catch (error) {
      logger.error('TimelineService: Error in initializeStudentTimeline', error);
      throw error;
    }
  }
  
  /**
   * อัปเดตขั้นตอนใน timeline
   * @param {Object} params - พารามิเตอร์สำหรับอัปเดต
   * @returns {Object} timeline ที่อัปเดตแล้ว
   */
  async updateTimelineStep({ studentId, workflowType, stepKey, status, overallStatus, dataPayload }) {
    try {
      logger.info(`TimelineService: อัปเดตขั้นตอน ${stepKey} สำหรับนักศึกษา ${studentId}`);
      
      // ตรวจสอบว่า stepKey มีอยู่จริงใน workflow
      const stepExists = await sequelize.models.WorkflowStepDefinition.findOne({
        where: { workflowType, stepKey }
      });
      
      if (!stepExists) {
        throw new Error(`ไม่พบขั้นตอน ${stepKey} ใน workflow ${workflowType}`);
      }
      
      // อัปเดต workflow activity
      const activity = await workflowService.updateStudentWorkflowActivity(
        studentId,
        workflowType,
        stepKey,
        status || 'in_progress',
        overallStatus || 'in_progress',
        dataPayload || {}
      );
      
      // สร้าง timeline ใหม่หลังจากอัปเดต
      const updatedTimeline = await workflowService.generateStudentTimeline(studentId, workflowType);
      
      logger.info(`TimelineService: อัปเดตขั้นตอน timeline สำเร็จ`);
      return updatedTimeline;
      
    } catch (error) {
      logger.error('TimelineService: Error in updateTimelineStep', error);
      throw error;
    }
  }
  
  /**
   * ดึงข้อมูล timeline ของนักศึกษาทั้งหมด (สำหรับ admin)
   * @returns {Array} รายการ timeline ของนักศึกษาทั้งหมด
   */
  async getAllTimelines() {
    try {
      logger.info('TimelineService: ดึงข้อมูล timeline ทั้งหมด');
      
      // ดึงรายชื่อนักศึกษาทั้งหมด
      const students = await Student.findAll({
        attributes: ['studentId', 'studentCode', 'internshipStatus', 'projectStatus']
      });
      
      // ดึง timeline ของแต่ละนักศึกษา
      const summaries = await Promise.all(students.map(async (student) => {
        const [internshipActivity, projectActivity] = await Promise.all([
          this.getWorkflowActivity(student.studentId, 'internship'),
          this.getWorkflowActivity(student.studentId, 'project1')
        ]);
        
        const [internshipCurrentStep, projectCurrentStep] = await Promise.all([
          this.getCurrentStepTitle(internshipActivity, 'internship'),
          this.getCurrentStepTitle(projectActivity, 'project1')
        ]);
        
        return {
          studentId: student.studentId,
          studentCode: student.studentCode,
          internship: {
            status: student.internshipStatus,
            currentStep: internshipCurrentStep || 'ยังไม่เริ่มต้น',
            overallStatus: internshipActivity?.overallWorkflowStatus || 'not_started',
            lastUpdated: internshipActivity?.updatedAt || null
          },
          project: {
            status: student.projectStatus,
            currentStep: projectCurrentStep || 'ยังไม่เริ่มต้น',
            overallStatus: projectActivity?.overallWorkflowStatus || 'not_started',
            lastUpdated: projectActivity?.updatedAt || null
          }
        };
      }));
      
      logger.info(`TimelineService: ดึงข้อมูล timeline ของนักศึกษา ${summaries.length} คน`);
      return summaries;
      
    } catch (error) {
      logger.error('TimelineService: Error in getAllTimelines', error);
      throw error;
    }
  }
  
  /**
   * ดึงข้อมูล workflow activity ของนักศึกษา
   * @param {number} studentId - ID ของนักศึกษา
   * @param {string} workflowType - ประเภท workflow
   * @returns {Object|null} ข้อมูล workflow activity
   */
  async getWorkflowActivity(studentId, workflowType) {
    try {
      return await sequelize.models.StudentWorkflowActivity.findOne({
        where: { studentId, workflowType },
        attributes: ['currentStepKey', 'currentStepStatus', 'overallWorkflowStatus', 'updatedAt']
      });
    } catch (error) {
      logger.error(`TimelineService: Error getting workflow activity for ${workflowType}:`, error);
      return null;
    }
  }
  
  /**
   * ดึงชื่อขั้นตอนปัจจุบัน
   * @param {Object} activity - ข้อมูล workflow activity
   * @param {string} workflowType - ประเภท workflow
   * @returns {string|null} ชื่อขั้นตอนปัจจุบัน
   */
  async getCurrentStepTitle(activity, workflowType) {
    try {
      if (!activity || !activity.currentStepKey) return null;
      
      const step = await sequelize.models.WorkflowStepDefinition.findOne({
        where: { workflowType, stepKey: activity.currentStepKey },
        attributes: ['title']
      });
      
      return step?.title || null;
    } catch (error) {
      logger.error(`TimelineService: Error getting current step title:`, error);
      return null;
    }
  }
  
  /**
   * คำนวณปีการศึกษาของนักศึกษา
   * @param {string} studentId - รหัสนักศึกษา
   * @returns {number} ปีการศึกษา
   */
  calculateStudentYear(studentId) {
    try {
      // สามารถเพิ่มการคำนวณปีการศึกษาจากรหัสนักศึกษาได้ที่นี่
      return 0;
    } catch (error) {
      logger.error('TimelineService: Error in calculateStudentYear:', error);
      return 0;
    }
  }
  
  /**
   * กำหนด action ถัดไปที่ต้องทำ
   * @param {Array} internshipSteps - ขั้นตอนการฝึกงาน
   * @param {Array} projectSteps - ขั้นตอนโครงงาน
   * @returns {string} ข้อความบอกการดำเนินการถัดไป
   */
  determineNextAction(internshipSteps, projectSteps) {
    try {
      // ตรวจสอบสถานะของการฝึกงาน
      if (internshipSteps && internshipSteps.length > 0) {
        const currentStep = internshipSteps.find(step => 
          step.status === 'in_progress' || step.status === 'awaiting_student_action');
          
        if (currentStep) {
          if (currentStep.status === 'awaiting_student_action') {
            return `ฝึกงาน: ${currentStep.title}`;
          }
          return `ฝึกงาน: ${currentStep.title} (กำลังดำเนินการ)`;
        }
        
        const nextStep = internshipSteps.find(step => step.status === 'pending');
        if (nextStep) {
          return `ฝึกงาน: รอ${nextStep.title}`;
        }
      }
      
      // ตรวจสอบสถานะของโครงงาน
      if (projectSteps && projectSteps.length > 0) {
        const currentStep = projectSteps.find(step => 
          step.status === 'in_progress' || step.status === 'awaiting_student_action');
          
        if (currentStep) {
          if (currentStep.status === 'awaiting_student_action') {
            return `โครงงาน: ${currentStep.title}`;
          }
          return `โครงงาน: ${currentStep.title} (กำลังดำเนินการ)`;
        }
        
        const nextStep = projectSteps.find(step => step.status === 'pending');
        if (nextStep) {
          return `โครงงาน: รอ${nextStep.title}`;
        }
      }
      
      return "ไม่มีการดำเนินการที่รอคอย";
    } catch (error) {
      logger.error('TimelineService: Error in determineNextAction:', error);
      return "เกิดข้อผิดพลาดในการกำหนดการดำเนินการถัดไป";
    }
  }
}

module.exports = new TimelineService();
