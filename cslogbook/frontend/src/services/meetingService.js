import apiClient from './apiClient';

const sanitizeParams = (params = {}) => {
  const cleaned = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }
    if (key === 'projectId') {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) {
        return;
      }
      cleaned[key] = numericValue;
      return;
    }
    cleaned[key] = value;
  });
  return cleaned;
};

function normalizeError(error, fallbackMessage) {
  if (error?.response?.data?.message) {
    return new Error(error.response.data.message);
  }
  if (error?.message) {
    return new Error(error.message);
  }
  return new Error(fallbackMessage || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
}

const meetingService = {
  listMeetings: async (projectId) => {
    try {
      const res = await apiClient.get(`/projects/${projectId}/meetings`);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึงข้อมูลการพบอาจารย์ได้');
    }
  },

  createMeeting: async (projectId, payload) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/meetings`, payload);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถสร้างการประชุมใหม่ได้');
    }
  },

  createMeetingLog: async (projectId, meetingId, payload) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/meetings/${meetingId}/logs`, payload);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถบันทึก log การพบอาจารย์ได้');
    }
  },

  updateLogApproval: async (projectId, meetingId, logId, payload) => {
    try {
      const res = await apiClient.patch(`/projects/${projectId}/meetings/${meetingId}/logs/${logId}/approval`, payload);
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถอัปเดตสถานะการอนุมัติได้');
    }
  },

  listTeacherApprovals: async (params = {}) => {
    try {
      const res = await apiClient.get('/teachers/meeting-approvals', { params: sanitizeParams(params) });
      return res.data;
    } catch (error) {
      throw normalizeError(error, 'ไม่สามารถดึงคิวอนุมัติบันทึกการพบได้');
    }
  }
};

export default meetingService;
