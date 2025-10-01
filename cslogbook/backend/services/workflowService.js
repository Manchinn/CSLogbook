const { 
  Student, 
  WorkflowStepDefinition, 
  StudentWorkflowActivity 
} = require('../models');
const logger = require('../utils/logger');

class WorkflowService {
  // เพิ่มฟังก์ชันสำหรับ refresh cache หลังจากแก้ไข step definitions
  async refreshStepDefinitionsCache(workflowType) {
    try {
      // ถ้ามีระบบ cache ให้ clear cache ของ workflowType นี้
      // เช่น Redis cache invalidation
      logger.info(`Refreshing step definitions cache for ${workflowType}`);
      
      // สามารถเพิ่มโค้ดสำหรับ cache invalidation ได้ที่นี่
    } catch (error) {
      logger.error('Error refreshing step definitions cache:', error);
    }
  }

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
  async updateStudentWorkflowActivity(studentId, workflowType, stepKey, status, overallStatus, dataPayload = {}, options = {}) {
    try {
      console.log(`Updating workflow: ${workflowType}.${stepKey} for student ${studentId} status: ${status}`, options);
      const { transaction } = options;
      
      // ค้นหากิจกรรม workflow ที่มีอยู่แล้ว
      let activity = await StudentWorkflowActivity.findOne({
        where: { studentId, workflowType },
        transaction
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
        }, { transaction });
      } else {
        // ถ้ามีอยู่แล้ว ให้อัปเดต
        console.log(`Updating existing workflow activity for student ${studentId}`);
        
        // อัปเดตค่าใหม่
        await activity.update({
          currentStepKey: stepKey,
          currentStepStatus: status,
          overallWorkflowStatus: overallStatus,
          dataPayload: payloadData
        }, { transaction });
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

      const student = await Student.findByPk(studentId, {
        attributes: ['studentId', 'studentCode', 'isEligibleInternship', 'isEligibleProject', 
                  'internshipStatus', 'projectStatus', 'isEnrolledInternship', 'isEnrolledProject']
      });
      
      console.log("Student workflow info:", { // เปลี่ยนชื่อ log เล็กน้อย
        studentId,
        internshipStatus: student?.internshipStatus,
        projectStatus: student?.projectStatus, // เพิ่ม projectStatus ด้วยถ้ามี
        isEnrolledInternship: student?.isEnrolledInternship,
        isEnrolledProject: student?.isEnrolledProject // เพิ่ม isEnrolledProject ด้วยถ้ามี
      });
      
      // เพิ่ม debug log เพื่อตรวจสอบข้อมูลที่ดึงมาจากฐานข้อมูล
      console.log("WorkflowService: ข้อมูลจากฐานข้อมูล:", {
        studentId: student?.studentId,
        studentCode: student?.studentCode,
        isEnrolledInternship: student?.isEnrolledInternship,
        internshipStatus: student?.internshipStatus,
        isEligibleInternship: student?.isEligibleInternship,
        isEligibleProject: student?.isEligibleProject,
        isEnrolledProject: student?.isEnrolledProject,
        projectStatus: student?.projectStatus
      });

      const stepDefinitions = await this.getWorkflowStepDefinitions(workflowType);
      let workflowActivity = await StudentWorkflowActivity.findOne({
        where: { studentId, workflowType }
      });

      let activityPayload = {};
      if (workflowActivity?.dataPayload) {
        try {
          activityPayload = JSON.parse(workflowActivity.dataPayload);
        } catch (payloadError) {
          logger.warn('workflowService: parse dataPayload error', { workflowType, studentId, error: payloadError.message });
        }
      }

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
      } else if ((workflowType === 'project' || workflowType === 'project1') && student) {
        overallTimelineStatus = student.projectStatus || 'not_started';
      }
      // ถ้ามี activity, overallWorkflowStatus จาก activity อาจจะแม่นยำกว่า
      if (workflowActivity) {
        overallTimelineStatus = workflowActivity.overallWorkflowStatus;
      }

      if (
        overallTimelineStatus === 'archived' &&
        (activityPayload?.examResult === 'failed' || activityPayload?.failureAcknowledged)
      ) {
        overallTimelineStatus = 'failed';
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
                case 'awaiting_admin_action':
                  stepUiStatus = 'pending';
                  break;
                case 'in_progress': // กำลังดำเนินการใน step นั้นๆ
                  stepUiStatus = 'in_progress';
                  break;
                case 'blocked':
                  stepUiStatus = 'blocked';
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
          let stepProgressFactor = 0.5;
          if (workflowActivity.currentStepStatus === 'completed') stepProgressFactor = 1;
          if (workflowActivity.currentStepStatus === 'blocked') stepProgressFactor = 0.8;
          progress = Math.round(((currentStepIndex + stepProgressFactor) / stepDefinitions.length) * 100);
        } else if (!workflowActivity && student && overallTimelineStatus === 'in_progress' && stepDefinitions.length > 0) {
          // กรณีไม่มี activity แต่สถานะ in_progress (อาจจะเพิ่งเริ่ม) ให้ progress เล็กน้อยสำหรับ step แรก
          progress = Math.round(((0 + 0.5) / stepDefinitions.length) * 100);
        } else if (overallTimelineStatus === 'completed') {
          progress = 100;
        } else if (overallTimelineStatus === 'archived') {
          progress = 100;
        }
      }

      const completedStepsCount = steps.filter(step => step.completed).length;
      if (!workflowActivity && completedStepsCount > 0 && stepDefinitions.length > 0) {
        const calculatedProgress = Math.round((completedStepsCount / stepDefinitions.length) * 100);
        if (progress < calculatedProgress) {
          progress = calculatedProgress;
        }
        if (currentStepIndex < completedStepsCount - 1) {
          currentStepIndex = completedStepsCount - 1;
        }
      }
      
      // ตรวจสอบว่า progress ไม่เกิน 100 และไม่ต่ำกว่า 0
      if (progress > 100) progress = 100;
      if (progress < 0) progress = 0;

      if ((overallTimelineStatus === 'failed') && progress > 90) {
        progress = 90;
      }

      console.log(`Generated timeline for ${workflowType} - Student: ${studentId}, Steps: ${steps.length}, Progress: ${progress}%, OverallStatus: ${overallTimelineStatus}, CurrentStepIndex: ${currentStepIndex}`);
      
      return {
        steps: steps, // ไม่ต้อง steps || [] เพราะถ้า stepDefinitions.length > 0 จะมี steps เสมอ
        progress: progress,
        status: overallTimelineStatus, // สถานะโดยรวมของ workflow
        currentStepDisplay: currentStepIndex >= 0 ? currentStepIndex + 1 : (completedStepsCount > 0 ? completedStepsCount : (overallTimelineStatus === 'in_progress' && steps.length > 0 ? 1 : 0)), // ถ้า in_progress แต่ไม่มี currentStepIndex ให้แสดง step 1
        totalStepsDisplay: stepDefinitions.length,
        blocked: overallTimelineStatus === 'failed'
      };
    } catch (error) {
      logger.error(`Error generating student timeline for ${workflowType}, student ${studentId}:`, error);
      return { 
        steps: [],
        progress: 0,
        status: 'not_started',
        currentStepDisplay: 0,
        totalStepsDisplay: 0,
        blocked: false,
        error: error.message
      };
    }
  }
  /**
   * ดึงข้อมูลขั้นตอนการทำงานตาม workflow type (สำหรับ Controller)
   * @param {string} workflowType - ประเภท workflow
   * @returns {Promise<Array>} - ข้อมูลขั้นตอนจาก database
   */
  async getWorkflowSteps(workflowType) {
    try {
      return await this.getWorkflowStepDefinitions(workflowType);
    } catch (error) {
      logger.error(`Error getting workflow steps for ${workflowType}:`, error);
      throw error;
    }
  }

  /**
   * ดึง timeline ของนักศึกษาตาม workflow type (สำหรับ Controller)
   * @param {string|number} studentId - รหัสนักศึกษา
   * @param {string} workflowType - ประเภท workflow
   * @returns {Promise<Object>} - ข้อมูล timeline
   */
  async getStudentTimelineData(studentId, workflowType) {
    try {
      return await this.generateStudentTimeline(studentId, workflowType);
    } catch (error) {
      logger.error(`Error getting student timeline data for ${workflowType}:`, error);
      throw error;
    }
  }

  /**
   * อัปเดตสถานะขั้นตอนของนักศึกษา (สำหรับ Controller)
   * @param {Object} params - พารามิเตอร์การอัปเดต
   * @returns {Promise<Object>} - ผลการอัปเดต
   */
  async updateWorkflowStepStatus({ studentId, workflowType, stepKey, status, dataPayload }) {
    try {
      // อัปเดตสถานะ
      const activity = await this.updateStudentWorkflowActivity(
        studentId,
        workflowType,
        stepKey,
        status,
        status, // overallStatus
        dataPayload
      );

      // ส่งคืนข้อมูล timeline ใหม่
      const updatedTimeline = await this.generateStudentTimeline(studentId, workflowType);
      
      return {
        activity,
        timeline: updatedTimeline
      };
    } catch (error) {
      logger.error('Error updating workflow step status:', error);
      throw error;
    }
  }

  // ฟังก์ชันช่วยสำหรับการกำหนด action text
  getActionTextForStep(stepKey, status) {
    const actionMapping = {
      'INTERNSHIP_ELIGIBILITY_CHECK': 'ตรวจสอบคุณสมบัติ',
      'INTERNSHIP_CS05_SUBMITTED': 'ยื่นคำร้อง คพ.05',
      'INTERNSHIP_CS05_APPROVED': 'ดาวน์โหลดเอกสาร',
      'INTERNSHIP_COMPANY_RESPONSE_PENDING': 'อัปโหลดหนังสือตอบรับ',
      'INTERNSHIP_AWAITING_START': 'เตรียมตัวฝึกงาน',
      'INTERNSHIP_IN_PROGRESS': 'บันทึกรายงานประจำวัน',
      'INTERNSHIP_SUMMARY_PENDING': 'ส่งเอกสารสรุปผล',
      'INTERNSHIP_COMPLETED': 'เสร็จสิ้น'
    };

    return actionMapping[stepKey] || 'ดำเนินการ';
  }

  // ฟังก์ชันช่วยสำหรับการกำหนด action link
  getActionLinkForStep(stepKey, status, studentId) {
    if (status !== 'awaiting_student_action' && status !== 'in_progress') {
      return null;
    }

    const linkMapping = {
      'INTERNSHIP_CS05_SUBMITTED': '/internship-registration',
      'INTERNSHIP_COMPANY_RESPONSE_PENDING': '/internship/upload-response',
      'INTERNSHIP_IN_PROGRESS': '/internship/daily-log',
      'INTERNSHIP_SUMMARY_PENDING': '/internship/summary'
    };

    return linkMapping[stepKey] || null;
  }
}

module.exports = new WorkflowService();