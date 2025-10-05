import apiClient from './apiClient';

const documentStatusService = {
  /**
   * อัปเดตสถานะเอกสารสำหรับเจ้าหน้าที่ภาค/อาจารย์ที่รับผิดชอบ
   */
  async updateStatus(documentId, { status, comment } = {}) {
    if (!documentId) {
      throw new Error('จำเป็นต้องระบุรหัสเอกสาร (documentId)');
    }

    try {
      const payload = {
        status,
        comment: comment && comment.trim() ? comment.trim() : null
      };

      const response = await apiClient.patch(`/documents/${documentId}/status`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating document status:', error);
      throw error;
    }
  },

  async updateProjectFinalStatus(projectId, { status, comment } = {}) {
    if (!projectId) {
      throw new Error('จำเป็นต้องระบุรหัสโครงงาน (projectId)');
    }

    try {
      const payload = {
        status,
        comment: comment && comment.trim() ? comment.trim() : null
      };

      const response = await apiClient.patch(`/projects/${projectId}/final-document/status`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating project final document status:', error);
      throw error;
    }
  }
};

export const FINAL_DOCUMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'รอตรวจสอบ' },
  { value: 'approved', label: 'อนุมัติ' },
  { value: 'rejected', label: 'ปฏิเสธ' },
];

export default documentStatusService;
