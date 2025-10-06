import apiClient from './apiClient';

const DEFENSE_TYPE_PROJECT1 = 'PROJECT1';
const DEFENSE_TYPE_THESIS = 'THESIS';
const DEFENSE_TYPES = [DEFENSE_TYPE_PROJECT1, DEFENSE_TYPE_THESIS];

const normalizeDefenseType = (value, fallback = DEFENSE_TYPE_PROJECT1) => {
  if (!value && value !== 0) return fallback;
  const normalized = String(value).trim().toUpperCase();
  if (!normalized) return fallback;
  return DEFENSE_TYPES.includes(normalized) ? normalized : fallback;
};

const resolveDefenseTypeOption = (options, fallback = DEFENSE_TYPE_PROJECT1) => {
  if (!options) return fallback;
  if (typeof options === 'string') {
    return normalizeDefenseType(options, fallback);
  }
  if (typeof options === 'object') {
    return normalizeDefenseType(options.defenseType ?? options.type, fallback);
  }
  return fallback;
};

const buildDefenseParams = (options = {}, defenseType = DEFENSE_TYPE_PROJECT1) => {
  const params = { ...(options || {}) };
  delete params.defenseType;
  delete params.type;
  params.defenseType = defenseType;
  return params;
};

const buildDefenseExportFallbackName = (defenseType = DEFENSE_TYPE_PROJECT1) => {
  const prefix = defenseType === DEFENSE_TYPE_THESIS ? 'รายชื่อสอบปริญญานิพนธ์' : 'รายชื่อสอบโครงงานพิเศษ1';
  return `${prefix}_${Date.now()}.xlsx`;
};

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
  acknowledgeExamResult: async (projectId, options) => {
    let examType;

    if (typeof options === 'string') {
      examType = options;
    } else if (options && typeof options === 'object') {
      examType = options.examType ?? options.type;
    }

    const normalizedType = typeof examType === 'string' ? examType.trim().toUpperCase() : undefined;
    const isTopicExam =
      !normalizedType || ['TOPIC', 'TOPIC_EXAM', 'KP02', 'TOPICEXAM'].includes(normalizedType);

    try {
      if (isTopicExam) {
        const res = await apiClient.patch(`/projects/${projectId}/topic-exam-result/ack`);
        return res.data;
      }

      const res = await apiClient.patch(`/projects/${projectId}/exam-result/acknowledge`, {
        examType: normalizedType
      });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถรับทราบผลสอบได้');
    }
  },

  getProject1DefenseRequest: async (projectId, options = {}) => {
    try {
      const defenseType = resolveDefenseTypeOption(options, DEFENSE_TYPE_PROJECT1);
      const res = await apiClient.get(`/projects/${projectId}/kp02`, {
        params: buildDefenseParams({}, defenseType)
      });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึงข้อมูลคำขอสอบได้');
    }
  },

  getProjectExamResult: async (projectId, params = {}) => {
    try {
      const res = await apiClient.get(`/projects/${projectId}/exam-result`, { params });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึงผลสอบโครงงานได้');
    }
  },

  submitProject1DefenseRequest: async (projectId, payload, options = {}) => {
    try {
      const defenseType = resolveDefenseTypeOption(options, DEFENSE_TYPE_PROJECT1);
      const res = await apiClient.post(`/projects/${projectId}/kp02`, payload, {
        params: buildDefenseParams({}, defenseType)
      });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถบันทึกคำขอสอบได้');
    }
  },

  submitProject1AdvisorDecision: async (projectId, payload, options = {}) => {
    try {
      const defenseType = resolveDefenseTypeOption(options, DEFENSE_TYPE_PROJECT1);
      const res = await apiClient.post(`/projects/${projectId}/kp02/advisor-approve`, payload, {
        params: buildDefenseParams({}, defenseType)
      });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถบันทึกการอนุมัติอาจารย์ได้');
    }
  },

  verifyProject1DefenseRequest: async (projectId, payload = {}, options = {}) => {
    try {
      const defenseType = resolveDefenseTypeOption(options, DEFENSE_TYPE_PROJECT1);
      const res = await apiClient.post(`/projects/${projectId}/kp02/verify`, payload, {
        params: buildDefenseParams({}, defenseType)
      });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถบันทึกการตรวจสอบได้');
    }
  },

  listProject1AdvisorQueue: async (params = {}) => {
    try {
      const defenseType = resolveDefenseTypeOption(params, DEFENSE_TYPE_PROJECT1);
      const requestParams = buildDefenseParams(params, defenseType);
      const res = await apiClient.get('/projects/kp02/advisor-queue', { params: requestParams });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึงรายการคำขอของอาจารย์ได้');
    }
  },

  listProject1StaffQueue: async (params = {}) => {
    try {
      const defenseType = resolveDefenseTypeOption(params, DEFENSE_TYPE_PROJECT1);
      const requestParams = buildDefenseParams(params, defenseType);
      const res = await apiClient.get('/projects/kp02/staff-queue', { params: requestParams });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึงคิวคำขอของเจ้าหน้าที่ได้');
    }
  },

  exportProject1StaffQueue: async (params = {}) => {
    try {
      const defenseType = resolveDefenseTypeOption(params, DEFENSE_TYPE_PROJECT1);
      const requestParams = buildDefenseParams(params, defenseType);
      const res = await apiClient.get('/projects/kp02/staff-queue/export', {
        params: requestParams,
        responseType: 'blob'
      });
      const disposition = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition'] || '';
      const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(disposition);
      const encodedName = match?.[1];
      const basicName = match?.[2];
      const filename = encodedName ? decodeURIComponent(encodedName) : (basicName || buildDefenseExportFallbackName(defenseType));
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

  scheduleProject1Defense: async () => {
    throw new Error('การนัดสอบโครงงานพิเศษ 1 ถูกย้ายไปจัดการผ่านปฏิทินภาควิชาแล้ว');
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
  },

  getSystemTestRequest: async (projectId) => {
    try {
      const res = await apiClient.get(`/projects/${projectId}/system-test/request`);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึงข้อมูลคำขอทดสอบระบบได้');
    }
  },

  submitSystemTestRequest: async (projectId, payload = {}) => {
    const formData = new FormData();
    if (payload.testStartDate) formData.append('testStartDate', payload.testStartDate);
    if (payload.testPeriodStart) formData.append('testPeriodStart', payload.testPeriodStart);
    if (payload.testPeriodEnd) formData.append('testPeriodEnd', payload.testPeriodEnd);
    if (payload.testDueDate) formData.append('testDueDate', payload.testDueDate);
    if (payload.studentNote) formData.append('studentNote', payload.studentNote);
    if (payload.requestFile) formData.append('requestFile', payload.requestFile);

    try {
      const res = await apiClient.post(`/projects/${projectId}/system-test/request`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถส่งคำขอทดสอบระบบได้');
    }
  },

  submitSystemTestAdvisorDecision: async (projectId, payload = {}) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/system-test/request/advisor-decision`, payload);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถบันทึกผลการพิจารณาได้');
    }
  },

  submitSystemTestStaffDecision: async (projectId, payload = {}) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/system-test/request/staff-decision`, payload);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถบันทึกผลการตรวจสอบได้');
    }
  },

  uploadSystemTestEvidence: async (projectId, file) => {
    const formData = new FormData();
    formData.append('evidenceFile', file);
    try {
      const res = await apiClient.post(`/projects/${projectId}/system-test/request/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถอัปโหลดหลักฐานการประเมินได้');
    }
  },

  listSystemTestAdvisorQueue: async () => {
    try {
      const res = await apiClient.get('/projects/system-test/advisor-queue');
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึงรายการคำขอที่รออาจารย์พิจารณาได้');
    }
  },

  listSystemTestStaffQueue: async (params = {}) => {
    try {
      const res = await apiClient.get('/projects/system-test/staff-queue', { params });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึงรายการคำขอที่รอเจ้าหน้าที่ตรวจสอบได้');
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
