import apiClient from './apiClient';

export const internshipApprovalService = {
  // Head of department queue (supports status filter via query string)
  getHeadQueue: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/internship/cs-05/head/queue?${query}` : '/internship/cs-05/head/queue';
    const res = await apiClient.get(url);
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
  },
  // Acceptance Letter: คิวหัวหน้าภาค, ตรวจโดยเจ้าหน้าที่ภาค, อนุมัติ, ปฏิเสธ
  getAcceptanceHeadQueue: async () => {
    const res = await apiClient.get(`/internship/acceptance/head/queue`);
    if (!res.data?.success) {
      throw new Error('ไม่สามารถดึงคิว Acceptance Letter ได้');
    }
    return res.data;
  },
  reviewAcceptanceByStaff: async (documentId, comment) => {
    const res = await apiClient.post(`/internship/acceptance/${documentId}/review`, { comment });
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'ไม่สามารถตรวจสอบ Acceptance Letter ได้');
    }
    return res.data;
  },
  approveAcceptanceByHead: async (documentId, payload = {}) => {
    const res = await apiClient.post(`/internship/acceptance/${documentId}/approve`, payload);
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'ไม่สามารถอนุมัติ Acceptance Letter ได้');
    }
    return res.data;
  },
  rejectAcceptance: async (documentId, reason) => {
    const res = await apiClient.post(`/internship/acceptance/${documentId}/reject`, { reason });
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'ไม่สามารถปฏิเสธ Acceptance Letter ได้');
    }
    return res.data;
  },
};
