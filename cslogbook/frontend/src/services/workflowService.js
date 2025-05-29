import  apiClient  from './apiClient';

export const workflowService = {
  /**
   * ดึงขั้นตอนการทำงานตามประเภท (internship, project)
   * @param {string} workflowType - ประเภท workflow
   * @returns {Promise} - ข้อมูลขั้นตอนจาก database
   */
  getWorkflowSteps: async (workflowType) => {
    try {
      const response = await apiClient.get(`/workflow/steps/${workflowType}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || `ไม่สามารถดึงข้อมูลขั้นตอน ${workflowType} ได้`);
      }

      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message
      };
    } catch (error) {
      console.error(`Error fetching workflow steps for ${workflowType}:`, error);
      return {
        success: false,
        data: [],
        error: error.message || `เกิดข้อผิดพลาดในการดึงข้อมูลขั้นตอน ${workflowType}`
      };
    }
  },

  /**
   * ดึงขั้นตอนการฝึกงาน
   * @returns {Promise} - ข้อมูลขั้นตอนการฝึกงาน
   */
  getInternshipSteps: async () => {
    return await workflowService.getWorkflowSteps('internship');
  },

  /**
   * ดึงขั้นตอนโครงงาน
   * @returns {Promise} - ข้อมูลขั้นตอนโครงงาน
   */
  getProjectSteps: async () => {
    return await workflowService.getWorkflowSteps('project');
  },

  /**
   * ดึง timeline ของนักศึกษาตาม workflow type
   * @param {string|number} studentId - รหัสนักศึกษา
   * @param {string} workflowType - ประเภท workflow (internship, project)
   * @returns {Promise} - ข้อมูล timeline พร้อมขั้นตอนและความคืบหน้า
   */
  getStudentTimeline: async (studentId, workflowType) => {
    try {
      const response = await apiClient.get(`/workflow/timeline/${studentId}/${workflowType}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || `ไม่สามารถดึงข้อมูล timeline ${workflowType} ได้`);
      }

      // แปลงข้อมูลให้เหมาะสมกับการแสดงผลใน frontend
      const timelineData = response.data.data || {};
      
      return {
        success: true,
        data: {
          steps: timelineData.steps || [],
          progress: timelineData.progress || 0,
          status: timelineData.status || 'not_started',
          currentStepDisplay: timelineData.currentStepDisplay || 0,
          totalStepsDisplay: timelineData.totalStepsDisplay || 0,
          blocked: timelineData.status === 'not_started' || timelineData.error,
          blockReason: timelineData.error || null
        },
        message: response.data.message
      };
    } catch (error) {
      console.error(`Error fetching student timeline for ${workflowType}:`, error);
      return {
        success: false,
        data: {
          steps: [],
          progress: 0,
          status: 'not_started',
          currentStepDisplay: 0,
          totalStepsDisplay: 0,
          blocked: true,
          blockReason: error.message || `เกิดข้อผิดพลาดในการดึงข้อมูล timeline`
        },
        error: error.message
      };
    }
  },

  /**
   * ดึง timeline การฝึกงานของนักศึกษา
   * @param {string|number} studentId - รหัสนักศึกษา
   * @returns {Promise} - ข้อมูล timeline การฝึกงาน
   */
  getInternshipTimeline: async (studentId) => {
    return await workflowService.getStudentTimeline(studentId, 'internship');
  },

  /**
   * ดึง timeline โครงงานของนักศึกษา
   * @param {string|number} studentId - รหัสนักศึกษา
   * @returns {Promise} - ข้อมูล timeline โครงงาน
   */
  getProjectTimeline: async (studentId) => {
    return await workflowService.getStudentTimeline(studentId, 'project');
  },

  /**
   * อัปเดตสถานะขั้นตอนของนักศึกษา
   * @param {string|number} studentId - รหัสนักศึกษา
   * @param {string} workflowType - ประเภท workflow
   * @param {string} stepKey - key ของขั้นตอน
   * @param {string} status - สถานะใหม่
   * @param {object} dataPayload - ข้อมูลเพิ่มเติม
   * @returns {Promise} - ผลการอัปเดต
   */
  updateWorkflowStep: async (studentId, workflowType, stepKey, status, dataPayload = {}) => {
    try {
      const response = await apiClient.put(`/workflow/update`, {
        studentId,
        workflowType,
        stepKey,
        status,
        dataPayload
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถอัปเดตสถานะขั้นตอนได้');
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error updating workflow step:', error);
      return {
        success: false,
        error: error.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะขั้นตอน'
      };
    }
  },

  /**
   * แปลง step_key เป็นข้อมูลสำหรับการแสดงผล (icon, สี, ข้อความ)
   * @param {string} stepKey - key ของขั้นตอน
   * @param {string} status - สถานะปัจจุบัน
   * @returns {object} - ข้อมูลสำหรับการแสดงผล
   */
  getStepDisplayInfo: (stepKey, status = 'waiting') => {
    const stepMapping = {
      // ขั้นตอนการฝึกงาน
      'INTERNSHIP_ELIGIBILITY_CHECK': {
        icon: 'CheckCircleOutlined',
        color: 'success',
        actionText: 'ตรวจสอบคุณสมบัติ',
        title: 'ตรวจสอบคุณสมบัติการฝึกงาน',
        description: 'ตรวจสอบหน่วยกิตและเกณฑ์การฝึกงาน'
      },
      'INTERNSHIP_CS05_SUBMITTED': {
        icon: 'FormOutlined',
        color: 'processing',
        actionText: 'ยื่นคำร้อง คพ.05',
        title: 'ยื่นคำร้องขอฝึกงาน (คพ.05)',
        description: 'กรอกแบบฟอร์มคำร้องขอฝึกงานและแนบเอกสารที่จำเป็น'
      },
      'INTERNSHIP_CS05_APPROVED': {
        icon: 'CheckCircleOutlined',
        color: 'success',
        actionText: 'ดาวน์โหลดเอกสาร',
        title: 'คำร้องได้รับการอนุมัติ',
        description: 'หัวหน้าภาคอนุมัติคำร้องขอฝึกงานแล้ว'
      },
      'INTERNSHIP_COMPANY_RESPONSE_PENDING': {
        icon: 'ClockCircleOutlined',
        color: 'warning',
        actionText: 'อัปโหลดหนังสือตอบรับ',
        title: 'รอหนังสือตอบรับจากบริษัท',
        description: 'รอการตอบรับจากบริษัทและอัปโหลดหนังสือตอบรับ'
      },
      'INTERNSHIP_AWAITING_START': {
        icon: 'ClockCircleOutlined',
        color: 'processing',
        actionText: 'เตรียมตัวฝึกงาน',
        title: 'เตรียมตัวสำหรับการฝึกงาน',
        description: 'เตรียมเอกสารและประสานงานกับบริษัทก่อนเริ่มฝึกงาน'
      },
      'INTERNSHIP_IN_PROGRESS': {
        icon: 'SyncOutlined',
        color: 'processing',
        actionText: 'บันทึกรายงานประจำวัน',
        title: 'อยู่ระหว่างการฝึกงาน',
        description: 'บันทึกการทำงานประจำวันและความคืบหน้าการฝึกงาน'
      },
      'INTERNSHIP_SUMMARY_PENDING': {
        icon: 'FileTextOutlined',
        color: 'warning',
        actionText: 'ส่งเอกสารสรุปผล',
        title: 'ส่งเอกสารสรุปผลการฝึกงาน',
        description: 'ส่งรายงานสรุปและเอกสารประเมินผลการฝึกงาน'
      },
      'INTERNSHIP_COMPLETED': {
        icon: 'CheckCircleOutlined',
        color: 'success',
        actionText: 'เสร็จสิ้น',
        title: 'เสร็จสิ้นการฝึกงาน',
        description: 'การฝึกงานเสร็จสิ้นครบถ้วนแล้ว'
      },

      // ขั้นตอนโครงงาน (เพิ่มได้ตามต้องการ)
      'PROJECT_ELIGIBILITY_CHECK': {
        icon: 'CheckCircleOutlined',
        color: 'success',
        actionText: 'ตรวจสอบคุณสมบัติ',
        title: 'ตรวจสอบคุณสมบัติการทำโครงงาน',
        description: 'ตรวจสอบหน่วยกิตและเกณฑ์การทำโครงงาน'
      },
      'PROJECT_TOPIC_SUBMITTED': {
        icon: 'FormOutlined',
        color: 'processing',
        actionText: 'เสนอหัวข้อโครงงาน',
        title: 'เสนอหัวข้อโครงงาน',
        description: 'เสนอหัวข้อและแผนการทำโครงงานพิเศษ'
      }
    };

    const defaultInfo = {
      icon: 'InfoCircleOutlined',
      color: 'default',
      actionText: 'ดำเนินการ',
      title: 'ขั้นตอนการดำเนินการ',
      description: 'รอการดำเนินการ'
    };

    // แก้ไขสีตามสถานะปัจจุบัน
    const stepInfo = stepMapping[stepKey] || defaultInfo;
    let finalColor = stepInfo.color;

    // ปรับสีตามสถานะ
    switch (status) {
      case 'completed':
        finalColor = 'success';
        break;
      case 'in_progress':
        finalColor = 'processing';
        break;
      case 'pending':
      case 'awaiting_approval':
        finalColor = 'warning';
        break;
      case 'awaiting_student_action':
      case 'awaiting_action':
        finalColor = 'warning';
        break;
      case 'blocked':
      case 'rejected':
        finalColor = 'error';
        break;
      case 'waiting':
      case 'not_started':
      default:
        finalColor = 'default';
        break;
    }

    return {
      ...stepInfo,
      color: finalColor
    };
  },

  /**
   * แปลงสถานะเป็นข้อความภาษาไทย
   * @param {string} status - สถานะ
   * @returns {string} - ข้อความภาษาไทย
   */
  getStatusText: (status) => {
    const statusMapping = {
      'completed': 'เสร็จสิ้น',
      'in_progress': 'กำลังดำเนินการ',
      'pending': 'รอการอนุมัติ',
      'awaiting_approval': 'รอการอนุมัติ',
      'awaiting_student_action': 'รอดำเนินการ',
      'awaiting_action': 'รอดำเนินการ',
      'awaiting_admin_action': 'รอเจ้าหน้าที่ดำเนินการ',
      'blocked': 'ไม่สามารถดำเนินการได้',
      'rejected': 'ถูกปฏิเสธ',
      'overdue': 'เกินกำหนด',
      'waiting': 'รอดำเนินการ',
      'not_started': 'ยังไม่เริ่ม'
    };

    return statusMapping[status] || `ไม่ทราบสถานะ (${status})`;
  }
};

export default workflowService;