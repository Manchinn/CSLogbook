import apiClient from './apiClient';

/**
 * projectService
 * Service เรียกใช้งาน API โครงงานพิเศษ (Phase 2)
 * Endpoint backend อ้างอิง: /api/projects
 */
const projectService = {
  /**
   * สร้างโครงงาน (leader สร้าง) -> status เริ่ม draft หรือ advisor_assigned ถ้าส่ง advisorId
  * payload ตัวเลือก: { projectNameTh, projectNameEn, projectType, tracks, advisorId, coAdvisorId }
   */
  createProject: async (payload = {}) => {
    try {
      const res = await apiClient.post('/projects', payload);
      return res.data; // backend ควรคืนโครงสร้าง { success, data / message }
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถสร้างโครงงานได้');
    }
  },

  /**
   * รายการโครงงานที่นักศึกษามีส่วนร่วม (leader หรือ member)
   */
  getMyProjects: async () => {
    try {
      const res = await apiClient.get('/projects/mine');
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึงรายการโครงงานของคุณได้');
    }
  },

  /**
   * ดึงรายละเอียดโครงงานตาม id (รวม members)
   */
  getProject: async (projectId) => {
    try {
      const res = await apiClient.get(`/projects/${projectId}`);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่พบหรือไม่สามารถดึงข้อมูลโครงงานได้');
    }
  },
  // ดึงรายละเอียดพร้อม summary (milestoneCount, latestProposal)
  getProjectWithSummary: async (projectId) => {
    try {
      const res = await apiClient.get(`/projects/${projectId}?include=summary`);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึงข้อมูลโครงงาน (summary) ได้');
    }
  },

  /**
   * อัปเดต metadata (ชื่อ/ประเภท/track/advisor) - เฉพาะ leader
   */
  updateProject: async (projectId, payload) => {
    try {
      const res = await apiClient.patch(`/projects/${projectId}`, payload);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถอัปเดตข้อมูลโครงงานได้');
    }
  },

  /**
   * เพิ่มสมาชิกคนที่สอง (ใช้ studentCode ของคนที่ต้องการเชิญ) - เฉพาะ leader
   */
  addMember: async (projectId, studentCode) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/members`, { studentCode });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'เพิ่มสมาชิกไม่สำเร็จ');
    }
  },

  /**
   * Promote โครงงาน -> in_progress (เงื่อนไข 2 คน + advisor + ชื่อ TH/EN + type + track ครบ)
   */
  activateProject: async (projectId) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/activate`);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถเริ่มดำเนินโครงงานได้');
    }
  },

  // Acknowledge exam failed -> archive project
  acknowledgeExamResult: async (projectId) => {
    try {
      const res = await apiClient.patch(`/projects/${projectId}/exam-result/ack`);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถรับทราบผลสอบได้');
    }
  },

  getProject1DefenseRequest: async (projectId) => {
    try {
      const res = await apiClient.get(`/projects/${projectId}/kp02`);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึงข้อมูลคำขอสอบได้');
    }
  },

  submitProject1DefenseRequest: async (projectId, payload) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/kp02`, payload);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถบันทึกคำขอสอบได้');
    }
  },

  submitProject1AdvisorDecision: async (projectId, payload) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/kp02/advisor-approve`, payload);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถบันทึกการอนุมัติอาจารย์ได้');
    }
  },

  verifyProject1DefenseRequest: async (projectId, payload = {}) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/kp02/verify`, payload);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถบันทึกการตรวจสอบได้');
    }
  },

  listProject1AdvisorQueue: async (params = {}) => {
    try {
      const res = await apiClient.get('/projects/kp02/advisor-queue', { params });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึงรายการคำขอของอาจารย์ได้');
    }
  },

  listProject1StaffQueue: async (params = {}) => {
    try {
      const res = await apiClient.get('/projects/kp02/staff-queue', { params });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึงคิวคำขอของเจ้าหน้าที่ได้');
    }
  },

  exportProject1StaffQueue: async (params = {}) => {
    try {
      const res = await apiClient.get('/projects/kp02/staff-queue/export', {
        params,
        responseType: 'blob'
      });
      const disposition = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition'] || '';
      const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
      const encodedName = match?.[1];
      const basicName = match?.[2];
      const filename = encodedName ? decodeURIComponent(encodedName) : (basicName || `kp02_staff_queue_${Date.now()}.xlsx`);
      return { blob: res.data, filename };
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถส่งออกข้อมูลได้');
    }
  },

  recordProject1ExamResult: async (projectId, payload) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/exam-result`, payload);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถบันทึกผลสอบได้');
    }
  },

  scheduleProject1Defense: async (projectId, payload) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/kp02/schedule`, payload);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถนัดหมายการสอบได้');
    }
  },

  /**
   * Archive (เฉพาะ admin – ฝั่ง UI ควรซ่อน)
   */
  archiveProject: async (projectId) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/archive`);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถเก็บถาวรโครงงานได้');
    }
  },

  // Milestones
  listMilestones: async (projectId) => {
    try {
      const res = await apiClient.get(`/projects/${projectId}/milestones`);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึง Milestones ได้');
    }
  },
  createMilestone: async (projectId, payload) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/milestones`, payload);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'สร้าง Milestone ไม่สำเร็จ');
    }
  },

  // Proposal upload (multipart)
  uploadProposal: async (projectId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post(`/projects/${projectId}/proposal`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'อัปโหลด Proposal ไม่สำเร็จ');
    }
  }
};

/**
 * Helper แปลง error axios -> ข้อความที่อ่านง่าย
 */
function normalizeError(error, fallbackMessage) {
  if (error?.response?.data?.message) {
    return new Error(error.response.data.message);
  }
  if (error?.message) {
    return new Error(error.message);
  }
  return new Error(fallbackMessage || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
}

export default projectService;
