const db = require('../models');
const Student = db.Student; // เพิ่มบรรทัดนี้เพื่อ import Student model
const Internship = db.Internship;
const Project = db.Project;
const moment = require('moment');

class WorkflowService {
  constructor() {
    this.models = db;  // เพิ่มบรรทัดนี้เพื่อให้เข้าถึง models ได้ทั้งหมด
  }

  /**
   * ดึงคำนิยามขั้นตอนทั้งหมดของ workflow ประเภทที่ระบุ
   * @param {string} workflowType - ประเภทของ workflow ('internship', 'project1', 'project2')
   */
  async getWorkflowStepDefinitions(workflowType) {
    try {
      const steps = await this.models.WorkflowStepDefinition.findAll({
        where: { workflowType },
        order: [['stepOrder', 'ASC']]
      });
      return steps;
    } catch (error) {
      console.error('Error fetching workflow step definitions:', error);
      throw new Error('Failed to fetch workflow steps');
    }
  }

  /**
   * สร้างหรืออัปเดต activity ของนักศึกษาในระบบ workflow
   * @param {number} studentId - รหัสนักศึกษา
   * @param {string} workflowType - ประเภทของ workflow
   * @param {string} stepKey - รหัสขั้นตอนปัจจุบัน
   * @param {string} stepStatus - สถานะของขั้นตอนปัจจุบัน
   * @param {string} overallStatus - สถานะรวมของทั้ง workflow
   * @param {Object} dataPayload - ข้อมูลเพิ่มเติม (optional)
   */
  async updateStudentWorkflowActivity(
    studentId, 
    workflowType, 
    stepKey, 
    stepStatus = 'in_progress',
    overallStatus = 'in_progress',
    dataPayload = {}
  ) {
    try {
      // ตรวจสอบว่า stepKey มีอยู่จริงใน WorkflowStepDefinition
      const stepExists = await this.models.WorkflowStepDefinition.findOne({
        where: {
          workflowType,
          stepKey
        }
      });

      if (!stepExists) {
        throw new Error(`Step key "${stepKey}" does not exist for workflow type "${workflowType}"`);
      }

      // หาหรือสร้าง activity
      const [activity, created] = await this.models.StudentWorkflowActivity.findOrCreate({
        where: {
          studentId,
          workflowType
        },
        defaults: {
          currentStepKey: stepKey,
          currentStepStatus: stepStatus,
          overallWorkflowStatus: overallStatus,
          dataPayload,
          startedAt: new Date()
        }
      });

      // ถ้า activity มีอยู่แล้ว ทำการอัปเดต
      if (!created) {
        activity.currentStepKey = stepKey;
        activity.currentStepStatus = stepStatus;
        activity.overallWorkflowStatus = overallStatus;
        
        // อัปเดต dataPayload โดยเก็บข้อมูลเดิมไว้ และเพิ่ม/แก้ไขข้อมูลใหม่
        activity.dataPayload = {
          ...(activity.dataPayload || {}),
          ...dataPayload,
          lastUpdated: new Date().toISOString()
        };

        // หาก overallStatus เป็น 'completed' ให้บันทึกวันที่เสร็จสิ้น
        if (overallStatus === 'completed' && !activity.completedAt) {
          activity.completedAt = new Date();
        }

        await activity.save();
      }

      // เมื่ออัปเดต StudentWorkflowActivity แล้ว อัปเดต status ที่เกี่ยวข้องใน Student ด้วย
      await this.syncStudentStatus(studentId, workflowType, overallStatus);

      return activity;
    } catch (error) {
      console.error('Error updating student workflow activity:', error);
      throw error;
    }
  }

  /**
   * ซิงค์สถานะจาก StudentWorkflowActivity ไปยัง Student model
   */
  async syncStudentStatus(studentId, workflowType, overallStatus) {
    try {
      const student = await Student.findByPk(studentId);
      if (!student) {
        throw new Error(`Student ID ${studentId} not found`);
      }

      // อัปเดตสถานะใน Student model ตามประเภทของ workflow
      if (workflowType === 'internship') {
        // อัปเดต isEnrolledInternship ถ้าสถานะเป็น 'enrolled' หรือสูงกว่า
        if (['enrolled', 'in_progress', 'completed'].includes(overallStatus)) {
          student.isEnrolledInternship = true;
        }

        // อัปเดต internshipStatus
        switch(overallStatus) {
          case 'not_started':
          case 'eligible':
            student.internshipStatus = 'not_started';
            break;
          case 'enrolled':
          case 'in_progress':
            student.internshipStatus = 'in_progress';
            break;
          case 'completed':
            student.internshipStatus = 'completed';
            break;
          default:
            // Don't change status for 'blocked' or other statuses
        }
      }
      else if (workflowType === 'project1' || workflowType === 'project2') {
        // อัปเดต isEnrolledProject ถ้าสถานะเป็น 'enrolled' หรือสูงกว่า
        if (['enrolled', 'in_progress', 'completed'].includes(overallStatus)) {
          student.isEnrolledProject = true;
        }

        // อัปเดต projectStatus
        switch(overallStatus) {
          case 'not_started':
          case 'eligible':
            student.projectStatus = 'not_started';
            break;
          case 'enrolled':
          case 'in_progress':
            student.projectStatus = 'in_progress';
            break;
          case 'completed':
            student.projectStatus = 'completed';
            break;
          default:
            // Don't change status for 'blocked' or other statuses
        }
      }

      await student.save();
      return true;
    } catch (error) {
      console.error('Error syncing student status:', error);
      throw error;
    }
  }

  /**
   * สร้าง timeline เต็มรูปแบบของนักศึกษาสำหรับ workflow ที่ระบุ
   * (สำหรับส่งให้ frontend แสดงผลในหน้า timeline)
   * @param {number} studentId - รหัสนักศึกษา
   * @param {string} workflowType - ประเภทของ workflow ('internship', 'project1', 'project2')
   */
  async generateStudentTimeline(studentId, workflowType) {
    try {
      // ตรวจสอบว่า studentId ถูกส่งมาหรือไม่
      if (!studentId) {
        throw new Error('Student ID is required');
      }

      // ตรวจสอบว่า workflowType ถูกส่งมาหรือไม่
      if (!workflowType) {
        throw new Error('Workflow type is required');
      }

      // แก้ไขจากเดิมที่เป็น this.models.Student เป็น Student หรือ db.Student
      const student = await Student.findByPk(studentId);
      
      // ถ้าไม่พบนักศึกษา
      if (!student) {
        throw new Error(`Student not found with ID: ${studentId}`);
      }

      // 2. ดึงคำนิยามขั้นตอนทั้งหมดของ workflow ประเภทนี้
      const stepDefinitions = await this.getWorkflowStepDefinitions(workflowType);
      
      // 3. ดึงข้อมูล activity ปัจจุบันของนักศึกษา (ถ้ามี)
      let currentActivity = await this.models.StudentWorkflowActivity.findOne({
        where: {
          studentId,
          workflowType
        }
      });

      // 4. เตรียมข้อมูล timeline
      let timelineItems = [];
      let currentStepFound = false;
      let currentStepOrder = 0;
      
      // ถ้าพบ activity
      if (currentActivity) {
        // หา stepOrder ของขั้นตอนปัจจุบัน
        const currentStepDef = stepDefinitions.find(step => step.stepKey === currentActivity.currentStepKey);
        if (currentStepDef) {
          currentStepOrder = currentStepDef.stepOrder;
          currentStepFound = true;
        }
      }

      // 5. สร้าง timeline items
      for (const stepDef of stepDefinitions) {
        // กำหนดสถานะของแต่ละขั้นตอนบน timeline
        let status = 'pending'; // default

        if (currentStepFound) {
          if (stepDef.stepOrder < currentStepOrder) {
            status = 'completed';
          } else if (stepDef.stepOrder === currentStepOrder) {
            status = currentActivity ? currentActivity.currentStepStatus : 'pending';
          } else {
            status = 'pending';
          }
        } else if (workflowType === 'internship' && student.isEnrolledInternship && stepDef.stepKey === 'INTERNSHIP_ELIGIBILITY_MET') {
          // กรณีพิเศษ: ถ้านักศึกษาลงทะเบียนฝึกงานแล้ว แต่ไม่มี activity ให้ถือว่าผ่านขั้นตอนแรกแล้ว
          status = 'completed';
        }

        // สร้าง timelineItem
        timelineItems.push({
          key: stepDef.stepKey,
          title: stepDef.title,
          description: stepDef.descriptionTemplate,
          status,
          currentLabel: this.getStatusLabel(status), // Helper function เพิ่มเติม
          // timestamp: ถ้ามีข้อมูล timestamp ให้เพิ่มตรงนี้
        });
      }

      // 6. คำนวณค่า progress สำหรับ UI
      const totalSteps = timelineItems.length;
      const completedSteps = timelineItems.filter(item => item.status === 'completed').length;
      const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
      
      // 7. รวบรวมข้อมูลทั้งหมดและส่งกลับ
      return {
        steps: timelineItems,
        progress: progressPercent,
        currentStep: currentStepOrder,
        totalSteps: totalSteps,
        currentStepDisplay: currentStepOrder,
        totalStepsDisplay: totalSteps,
        // ถ้านักศึกษายังไม่มีสิทธิ์ ให้ blocked = true
        blocked: this.isWorkflowBlocked(workflowType, student),
        // สถานะโดยรวม
        overallStatus: currentActivity ? currentActivity.overallWorkflowStatus : 'not_started'
      };
    } catch (error) {
      logger.error(`Error generating timeline: ${error.message}`, { error });
      throw error;
    }
  }

  /**
   * ตรวจสอบว่า workflow นี้ถูกบล็อกหรือไม่สำหรับนักศึกษาคนนี้
   */
  isWorkflowBlocked(workflowType, student) {
    if (workflowType === 'internship') {
      return !student.isEligibleInternship;
    } else if (workflowType === 'project1' || workflowType === 'project2') {
      return !student.isEligibleProject;
    }
    return true; // Default is blocked for unknown workflow types
  }
  
  /**
   * แปลงสถานะเป็นข้อความสำหรับแสดงผล
   */
  getStatusLabel(status) {
    switch (status) {
      case 'completed': return 'เสร็จสิ้น';
      case 'in_progress': return 'กำลังดำเนินการ';
      case 'awaiting_student_action': return 'รอดำเนินการ';
      case 'awaiting_admin_action': return 'รอการอนุมัติ';
      case 'pending': return 'รอดำเนินการ';
      case 'rejected': return 'ไม่อนุมัติ';
      case 'skipped': return 'ข้าม';
      default: return 'รอดำเนินการ';
    }
  }
}

module.exports = new WorkflowService();