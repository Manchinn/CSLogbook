import apiClient from './apiClient';

export const internshipApprovalService = {
  // Head of department queue
  getHeadQueue: async () => {
    const res = await apiClient.get('/internship/cs-05/head/queue');
    return res.data;
  },
  // Approve CS05 by head (รองรับ letterType และ comment)
  approveCS05: async (documentId, payload = {}) => {
    const res = await apiClient.post(`/internship/cs-05/${documentId}/approve`, payload);
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'อนุมัติไม่สำเร็จ');
    }
    return res.data;
  },
  // Reject CS05 (head or staff)
  rejectCS05: async (documentId, reason) => {
    const res = await apiClient.post(`/internship/cs-05/${documentId}/reject`, { reason });
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'ปฏิเสธไม่สำเร็จ');
    }
    return res.data;
  },
  // Staff review (support)
  reviewByStaff: async (documentId, comment) => {
    const res = await apiClient.post(`/internship/cs-05/${documentId}/review`, { comment });
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'ตรวจสอบไม่สำเร็จ');
    }
    return res.data;
  }
};
