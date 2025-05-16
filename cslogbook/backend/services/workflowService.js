const { 
  Student, 
  WorkflowStepDefinition, 
  StudentWorkflowActivity 
} = require('../models');
const logger = require('../utils/logger');

class WorkflowService {
  // ฟังก์ชันดึงข้อมูล WorkflowStepDefinitions ตาม workflowType
  async getWorkflowStepDefinitions(workflowType) {
    try {
      return await WorkflowStepDefinition.findAll({
        where: { workflowType },
        order: [['stepOrder', 'ASC']]
      });
    } catch (error) {
      logger.error('Error getting workflow step definitions:', error);
      throw error;
    }
  }

  // ฟังก์ชันอัปเดตหรือสร้าง StudentWorkflowActivity
  async updateStudentWorkflowActivity(studentId, workflowType, stepKey, status, overallStatus, dataPayload = {}) {
    try {
      console.log(`Updating workflow: ${workflowType}.${stepKey} for student ${studentId} status: ${status}`);
      
      // ค้นหากิจกรรม workflow ที่มีอยู่แล้ว
      let activity = await StudentWorkflowActivity.findOne({
        where: { studentId, workflowType }
      });
      
      // แปลง dataPayload เป็น string (ถ้าเป็น object)
      let payloadData = dataPayload;
      if (typeof dataPayload === 'object' && dataPayload !== null) {
        payloadData = JSON.stringify(dataPayload);
      }
      
      // ถ้าไม่มี ให้สร้างใหม่
      if (!activity) {
        console.log(`Creating new workflow activity for student ${studentId}`);
        activity = await StudentWorkflowActivity.create({
          studentId,
          workflowType,
          currentStepKey: stepKey,
          currentStepStatus: status,
          overallWorkflowStatus: overallStatus,
          dataPayload: payloadData,
          startedAt: new Date()
        });
      } else {
        // ถ้ามีอยู่แล้ว ให้อัปเดต
        console.log(`Updating existing workflow activity for student ${studentId}`);
        
        // อัปเดตค่าใหม่
        await activity.update({
          currentStepKey: stepKey,
          currentStepStatus: status,
          overallWorkflowStatus: overallStatus,
          dataPayload: payloadData
        });
      }
      
      console.log(`Successfully updated workflow activity for student ${studentId}`);
      return activity;
    } catch (error) {
      logger.error(`Error updating workflow activity:`, error);
      throw error;
    }
  }

  // ฟังก์ชันสร้าง timeline สำหรับแสดงผลใน frontend
  async generateStudentTimeline(studentId, workflowType) {
    try {
      console.log(`Generating ${workflowType} timeline for student ${studentId}`);

      // แก้ไขจากการใช้ sequelize.models.Student เป็น Student โดยตรง
      const student = await Student.findByPk(studentId);
      
      // เพิ่มการ log เพื่อตรวจสอบค่า
      console.log("Student internship info:", {
        studentId,
        internshipStatus: student?.internshipStatus,
        isEnrolledInternship: student?.isEnrolledInternship
      });

      // ดึงข้อมูลขั้นตอนทั้งหมดของ workflow ประเภทนี้
      const stepDefinitions = await this.getWorkflowStepDefinitions(workflowType);
      
      // ดึงข้อมูลกิจกรรมปัจจุบันของนักศึกษา (ถ้ามี)
      let workflowActivity = await StudentWorkflowActivity.findOne({
        where: { studentId, workflowType }
      });

      console.log(`Found ${stepDefinitions.length} step definitions, activity exists: ${!!workflowActivity}`);

      // สำคัญ: ถ้าไม่มีข้อมูล workflow activity แต่นักศึกษาได้ลงทะเบียนแล้ว
      // ให้สร้าง activity ใหม่ตามสถานะในตาราง students
      if (!workflowActivity && workflowType === 'internship' && 
          student && student.isEnrolledInternship) {
        
        console.log("Creating new workflow activity based on student status");
        
        // สร้างค่าเริ่มต้นตามสถานะในตาราง students
        let stepKey = 'INTERNSHIP_ELIGIBILITY_CHECK';
        let status = 'completed';
        let overallStatus = 'in_progress';
        
        // ถ้ามีสถานะเป็น completed ให้ตั้งขั้นตอนเป็นขั้นสุดท้าย
        if (student.internshipStatus === 'completed') {
          stepKey = 'INTERNSHIP_COMPLETE';
          overallStatus = 'completed';
        }
        
        // สร้างข้อมูล workflow ใหม่
        workflowActivity = await this.updateStudentWorkflowActivity(
          studentId,
          workflowType,
          stepKey,
          status,
          overallStatus,
          { createdFromStudentStatus: true }
        );
      }
      
      // สร้าง response ตามรูปแบบเดิม
      const steps = [];
      let currentStepIndex = -1;
      let progress = 0;
      let status = 'not_started';

      // ถ้ามีขั้นตอนให้แสดง
      if (stepDefinitions.length > 0) {
        // หาตำแหน่งของขั้นตอนปัจจุบัน (ถ้ามี workflow activity)
        if (workflowActivity) {
          currentStepIndex = stepDefinitions.findIndex(
            step => step.stepKey === workflowActivity.currentStepKey
          );
        }
        
        // แปลงขั้นตอนทั้งหมดเป็นรูปแบบที่ frontend คาดหวัง
        stepDefinitions.forEach((def, index) => {
          // กำหนดสถานะของขั้นตอนนี้
          let stepStatus = 'NOT_STARTED';
          let completed = false;
          let completedDate = null;
          
          if (workflowActivity) {
            if (index < currentStepIndex) {
              // ขั้นตอนก่อนหน้าให้ถือว่าเสร็จสิ้นแล้ว
              stepStatus = 'COMPLETED';
              completed = true;
            } else if (index === currentStepIndex) {
              // ขั้นตอนปัจจุบัน ใช้สถานะจาก workflow activity
              switch (workflowActivity.currentStepStatus) {
                case 'completed':
                  stepStatus = 'COMPLETED';
                  completed = true;
                  completedDate = workflowActivity.updatedAt;
                  break;
                case 'pending':
                  stepStatus = 'PENDING';
                  break;
                case 'awaiting_student_action':
                  stepStatus = 'AWAITING_ACTION';
                  break;
                case 'awaiting_admin_action':
                  stepStatus = 'AWAITING_APPROVAL';
                  break;
                case 'in_progress':
                  stepStatus = 'IN_PROGRESS';
                  break;
                default:
                  stepStatus = 'NOT_STARTED';
              }
              
              // ถ้าเป็น CS05_APPROVED และสถานะเป็น completed ให้แสดงผู้อนุมัติ
              if (def.stepKey === 'INTERNSHIP_CS05_APPROVED' && workflowActivity.currentStepStatus === 'completed') {
                completedDate = workflowActivity.updatedAt;
                
                // ตรวจสอบว่ามีข้อมูล dataPayload หรือไม่
                try {
                  const payload = typeof workflowActivity.dataPayload === 'string' ? 
                    JSON.parse(workflowActivity.dataPayload) : workflowActivity.dataPayload;
                  
                  // ดึงข้อมูลเพิ่มเติม เช่น ผู้อนุมัติ
                  if (payload && payload.approvedBy) {
                    // เพิ่มข้อมูลผู้อนุมัติ (ถ้ามี)
                  }
                } catch (e) {
                  console.error('Error parsing dataPayload:', e);
                }
              }
            }
          }
          
          // เพิ่มขั้นตอนเข้าไปใน steps array
          steps.push({
            id: def.stepKey,
            title: def.title,
            description: def.descriptionTemplate,
            status: stepStatus,
            completed: completed,
            completedDate: completedDate,
            order: def.stepOrder
          });
        });
        
        // คำนวณความคืบหน้าโดยรวม
        if (currentStepIndex >= 0) {
          progress = Math.round(((currentStepIndex + (workflowActivity?.currentStepStatus === 'completed' ? 1 : 0.5)) / stepDefinitions.length) * 100);
        }
      }
      
      // อัปเดตสถานะโดยรวม
      if (student && student.internshipStatus === 'in_progress') {
        status = 'in_progress';
      } else if (student && student.internshipStatus === 'completed') {
        status = 'completed';
      } else if (workflowActivity) {
        status = workflowActivity.overallWorkflowStatus;
      }
      
      console.log(`Generated timeline with ${steps.length} steps, progress: ${progress}%`);
      
      // ส่งข้อมูลกลับ
      return {
        steps: steps || [],
        progress: progress || 0,
        status: student ? student.internshipStatus || 'not_started' : 'not_started',
        currentStepDisplay: currentStepIndex + 1,
        totalStepsDisplay: stepDefinitions.length
      };
    } catch (error) {
      console.error('Error generating student timeline:', error);
      // ถึงแม้มี error ก็ส่งข้อมูลกลับ
      return {
        steps: [],
        progress: 0,
        status: 'not_started',
        currentStepDisplay: 0,
        totalStepsDisplay: 0
      };
    }
  }
}

module.exports = new WorkflowService();