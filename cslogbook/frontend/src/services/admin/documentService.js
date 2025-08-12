import apiClient from '../apiClient';

// รวมฟังก์ชันเกี่ยวกับเอกสารทั้งหมดเป็น Object เดียว
export const documentService = {
  // ดึงข้อมูลเอกสารทั้งหมด
  getAllDocuments: async (type = 'project') => {
    try {
      const response = await apiClient.get(`/admin/documents?type=${type}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },
  
  // ดึงรายการเอกสารทั้งหมดพร้อมตัวกรอง
  getDocuments: async (params) => {
    try {
      const response = await apiClient.get('/admin/documents', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching filtered documents:', error);
      throw error; // ต้องมี throw error ด้วย
    }
  },

  // เพิ่มฟังก์ชันสำหรับดึงข้อมูลเอกสารตาม ID
  getDocumentById: async (documentId) => {
    try {
      const response = await apiClient.get(`/admin/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching document details:', error);
      throw error;
    }
  },

  // เพิ่มฟังก์ชันสำหรับอนุมัติเอกสาร
  approveDocument: async (documentId) => {
    try {
      const response = await apiClient.post(`/admin/documents/${documentId}/approve`);
      return response.data;
    } catch (error) {
      console.error('Error approving document:', error);
      throw error;
    }
  },

  // อัปเดตสถานะเอกสารแบบยืดหยุ่น (ใช้เพื่อ set reviewerId เวลาเจ้าหน้าที่ภาค "ตรวจและส่งต่อ" เอกสารที่ไม่ใช่ CS05)
  updateStatus: async (documentId, status, comment = null) => {
    try {
      const response = await apiClient.patch(`/admin/documents/${documentId}/status`, { status, comment });
      return response.data;
    } catch (error) {
      console.error('Error updating document status:', error);
      throw error;
    }
  },

  // เพิ่มฟังก์ชันสำหรับปฏิเสธเอกสาร
  rejectDocument: async (documentId) => {
    try {
      const response = await apiClient.post(`/admin/documents/${documentId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting document:', error);
      throw error;
    }
  }
};

export default documentService;