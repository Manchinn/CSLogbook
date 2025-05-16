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

      const student = await Student.findByPk(studentId);
      
      console.log("Student workflow info:", { // เปลี่ยนชื่อ log เล็กน้อย
        studentId,
        internshipStatus: student?.internshipStatus,
        projectStatus: student?.projectStatus, // เพิ่ม projectStatus ด้วยถ้ามี
        isEnrolledInternship: student?.isEnrolledInternship,
        isEnrolledProject: student?.isEnrolledProject // เพิ่ม isEnrolledProject ด้วยถ้ามี
      });

      const stepDefinitions = await this.getWorkflowStepDefinitions(workflowType);
      let workflowActivity = await StudentWorkflowActivity.findOne({
        where: { studentId, workflowType }
      });

      console.log(`Found ${stepDefinitions.length} step definitions for ${workflowType}, activity exists: ${!!workflowActivity}`);

      // สร้าง activity ถ้ายังไม่มีและนักศึกษามีสถานะ enrolled (ปรับปรุงให้รองรับ project ด้วยถ้าต้องการ)
      if (!workflowActivity && student) {
        let shouldCreateActivity = false;
        let initialStepKey = '';
        let initialStepStatus = 'completed'; // สมมติว่า eligibility check เสร็จแล้ว
        let initialOverallStatus = 'in_progress';

        if (workflowType === 'internship' && student.isEnrolledInternship) {
          shouldCreateActivity = true;
          initialStepKey = 'INTERNSHIP_ELIGIBILITY_CHECK'; // Key แรกสุด
          if (student.internshipStatus === 'completed') {
            initialStepKey = 'INTERNSHIP_COMPLETED'; // Key สุดท้ายถ้า completed แล้ว
            initialOverallStatus = 'completed';
          } else if (!student.internshipStatus || student.internshipStatus === 'not_started') {
            // ถ้า isEnrolled แต่ยังไม่มีสถานะชัดเจน หรือเป็น not_started
            // อาจจะต้องพิจารณาว่าควรสร้าง activity หรือไม่ หรือสร้างด้วยสถานะอะไร
            // ในที่นี้ยังคง flow เดิมคือถ้า enrolled และไม่ completed จะเริ่มจาก eligibility check
             initialOverallStatus = student.internshipStatus || 'in_progress';
          } else {
            initialOverallStatus = student.internshipStatus;
          }
        }
        // TODO: เพิ่มเงื่อนไขสำหรับ project workflow ถ้าต้องการ
        // else if (workflowType === 'project' && student.isEnrolledProject) { ... }

        if (shouldCreateActivity) {
          console.log(`Creating new ${workflowType} activity for student ${studentId} based on student status.`);
          workflowActivity = await this.updateStudentWorkflowActivity(
            studentId,
            workflowType,
            initialStepKey,
            initialStepStatus, // สถานะของ step แรก
            initialOverallStatus, // สถานะโดยรวม
            { createdFromStudentStatus: true }
          );
        }
      }
      
      const steps = [];
      let currentStepIndex = -1;
      let progress = 0;
      // กำหนด overall status เริ่มต้นให้ถูกต้องตาม workflowType
      let overallTimelineStatus = 'not_started'; 
      if (workflowType === 'internship' && student) {
        overallTimelineStatus = student.internshipStatus || 'not_started';
      } else if (workflowType === 'project' && student) {
        overallTimelineStatus = student.projectStatus || 'not_started';
      }
      // ถ้ามี activity, overallWorkflowStatus จาก activity อาจจะแม่นยำกว่า
      if (workflowActivity) {
        overallTimelineStatus = workflowActivity.overallWorkflowStatus;
      }


      if (stepDefinitions.length > 0) {
        if (workflowActivity) {
          currentStepIndex = stepDefinitions.findIndex(
            step => step.stepKey === workflowActivity.currentStepKey
          );
          
          console.log(`WorkflowActivity currentStepKey for ${workflowType}:`, workflowActivity.currentStepKey);
          console.log(`Available step keys from ${workflowType} definitions:`, stepDefinitions.map(step => step.stepKey));
          console.log(`Current step index found for ${workflowType}:`, currentStepIndex); 
        } else {
            // กรณีไม่มี workflowActivity แต่มี stepDefinitions (อาจจะไม่ควรเกิดขึ้นถ้า logic การสร้าง activity ถูกต้อง)
            console.log(`No workflowActivity found for ${workflowType}, student ${studentId}, but stepDefinitions exist. Timeline might be incomplete.`);
        }
        
        stepDefinitions.forEach((def, index) => {
          let stepUiStatus = 'waiting'; // สถานะที่จะส่งให้ UI (เช่น 'completed', 'pending', 'in_progress', 'waiting')
          let isStepCompleted = false;
          let stepCompletedDate = null;
          
          if (workflowActivity && currentStepIndex !== -1) { // ตรวจสอบว่า currentStepIndex ถูกต้อง
            if (index < currentStepIndex) {
              stepUiStatus = 'completed'; // ใช้ตัวพิมพ์ใหญ่ให้สอดคล้องกับ frontend helper
              isStepCompleted = true;
              // หากต้องการวันที่เสร็จของแต่ละ step ที่ผ่านมา อาจจะต้อง query จากตาราง history
            } else if (index === currentStepIndex) {
              // ขั้นตอนปัจจุบัน ใช้สถานะจาก workflowActivity.currentStepStatus
              // แปลง currentStepStatus จาก activity ไปเป็น UI status ที่ frontend helper รู้จัก
              switch (workflowActivity.currentStepStatus) {
                case 'completed': // step ปัจจุบันเพิ่งเสร็จ
                  stepUiStatus = 'completed';
                  isStepCompleted = true;
                  stepCompletedDate = workflowActivity.updatedAt;
                  break;
                case 'pending': // เช่น รอการอนุมัติเอกสาร
                case 'awaiting_approval': // ชื่อเดิมที่อาจจะใช้
                  stepUiStatus = 'pending';
                  break;
                case 'awaiting_student_action': // รอนักศึกษาดำเนินการ
                case 'awaiting_action': // ชื่อเดิมที่อาจจะใช้
                  stepUiStatus = 'awaiting_action';
                  break;
                case 'in_progress': // กำลังดำเนินการใน step นั้นๆ
                  stepUiStatus = 'in_progress';
                  break;
                default: // 'not_started', 'waiting', หรืออื่นๆ ที่ไม่รู้จัก
                  stepUiStatus = 'waiting'; // ให้เป็น waiting ถ้าไม่เข้าเงื่อนไขอื่น
              }
            }
            // ขั้นตอนที่ index > currentStepIndex จะยังคงเป็น 'waiting' (ค่าเริ่มต้น)
          } else if (!workflowActivity && student && overallTimelineStatus !== 'not_started' && overallTimelineStatus !== 'completed') {
            // กรณีพิเศษ: ไม่มี activity แต่สถานะนักศึกษาคือ in_progress (อาจจะเพิ่งเริ่ม)
            // ให้ขั้นตอนแรก (index 0) เป็น in_progress หรือ awaiting_action
            if (index === 0) {
                stepUiStatus = 'awaiting_action'; // หรือ 'in_progress' ขึ้นอยู่กับว่า step แรกคืออะไร
            }
          }
          
          steps.push({
            id: def.stepKey,
            title: def.title, // มาจากฐานข้อมูล
            description: def.descriptionTemplate, // มาจากฐานข้อมูล
            status: stepUiStatus, // สถานะที่แปลงแล้วสำหรับ UI
            completed: isStepCompleted,
            completedDate: stepCompletedDate,
            order: def.stepOrder
          });
        });
        
        // คำนวณความคืบหน้าโดยรวม
        if (currentStepIndex >= 0 && workflowActivity && stepDefinitions.length > 0) {
          // ถ้า step ปัจจุบัน completed, นับเต็ม step นั้น + index
          // ถ้า step ปัจจุบันยังไม่ completed (เช่น in_progress, pending), นับครึ่ง step นั้น + index
          const stepProgressFactor = workflowActivity.currentStepStatus === 'completed' ? 1 : 0.5;
          progress = Math.round(((currentStepIndex + stepProgressFactor) / stepDefinitions.length) * 100);
        } else if (!workflowActivity && student && overallTimelineStatus === 'in_progress' && stepDefinitions.length > 0) {
          // กรณีไม่มี activity แต่สถานะ in_progress (อาจจะเพิ่งเริ่ม) ให้ progress เล็กน้อยสำหรับ step แรก
          progress = Math.round(((0 + 0.5) / stepDefinitions.length) * 100);
        } else if (overallTimelineStatus === 'completed') {
          progress = 100;
        }
      }
      
      // ตรวจสอบว่า progress ไม่เกิน 100 และไม่ต่ำกว่า 0
      if (progress > 100) progress = 100;
      if (progress < 0) progress = 0;

      console.log(`Generated timeline for ${workflowType} - Student: ${studentId}, Steps: ${steps.length}, Progress: ${progress}%, OverallStatus: ${overallTimelineStatus}, CurrentStepIndex: ${currentStepIndex}`);
      
      return {
        steps: steps, // ไม่ต้อง steps || [] เพราะถ้า stepDefinitions.length > 0 จะมี steps เสมอ
        progress: progress,
        status: overallTimelineStatus, // สถานะโดยรวมของ workflow
        currentStepDisplay: currentStepIndex >= 0 ? currentStepIndex + 1 : (overallTimelineStatus === 'in_progress' && steps.length > 0 ? 1 : 0), // ถ้า in_progress แต่ไม่มี currentStepIndex ให้แสดง step 1
        totalStepsDisplay: stepDefinitions.length
      };
    } catch (error) {
      logger.error(`Error generating student timeline for ${workflowType}, student ${studentId}:`, error);
      return { 
        steps: [],
        progress: 0,
        status: 'not_started',
        currentStepDisplay: 0,
        totalStepsDisplay: 0,
        error: error.message
      };
    }
  }
}

module.exports = new WorkflowService();