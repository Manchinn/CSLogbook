// ใช้ apiClient ที่มี interceptor แทน (เดิม import ผิด path)
import apiClient from '../../../services/apiClient';

// Service ดึงเอกสารของนักศึกษา (ใช้ token ปัจจุบัน)
export const studentDocumentService = {
  async listMyDocuments(params = {}) {
    // baseURL = REACT_APP_API_URL (ควรลงท้ายด้วย /api) ดังนั้น path นี้จะกลายเป็น /api/documents/my
    const res = await apiClient.get('/documents/my', { params });
    return res.data; // { success, documents }
  },
  async viewDocument(id) {
    return apiClient.get(`/documents/${id}/view`, { responseType: 'blob' });
  },
  async downloadDocument(id) {
    return apiClient.get(`/documents/${id}/download`, { responseType: 'blob' });
  }
};
