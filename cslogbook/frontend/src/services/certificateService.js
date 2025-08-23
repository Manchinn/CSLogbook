import apiClient from './apiClient';

/**
 * Service สำหรับจัดการหนังสือรับรองการฝึกงาน (Admin)
 */
export const certificateService = {
  // ดึงรายการคำขอหนังสือรับรองทั้งหมด
  getCertificateRequests: async (params = {}) => {
    try {
      const response = await apiClient.get('/admin/certificate-requests', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching certificate requests:', error);
      throw error;
    }
  },

  // ดึงรายละเอียดคำขอเดียว (สำหรับ Drawer Review)
  getCertificateRequestDetail: async (requestId) => {
    try {
      const response = await apiClient.get(`/admin/certificate-requests/${requestId}/detail`);
      return response.data;
    } catch (error) {
      console.error('Error fetching certificate request detail:', error);
      throw error;
    }
  },

  // อนุมัติคำขอหนังสือรับรอง
  approveCertificateRequest: async (requestId, certificateNumber) => {
    try {
      const response = await apiClient.post(`/admin/certificate-requests/${requestId}/approve`, {
        certificateNumber
      });
      return response.data;
    } catch (error) {
      console.error('Error approving certificate request:', error);
      throw error;
    }
  },

  // ปฏิเสธคำขอหนังสือรับรอง
  rejectCertificateRequest: async (requestId, remarks) => {
    try {
      const response = await apiClient.post(`/admin/certificate-requests/${requestId}/reject`, {
        remarks
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting certificate request:', error);
      throw error;
    }
  },

  // ดาวน์โหลดหนังสือรับรองสำหรับ Admin
  downloadCertificateForAdmin: async (requestId) => {
    try {
      const response = await apiClient.get(`/admin/certificate-requests/${requestId}/download`, {
        responseType: 'blob'
      });
      
      // สร้างไฟล์ดาวน์โหลด
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `หนังสือรับรองการฝึกงาน-${requestId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading certificate:', error);
      throw error;
    }
  },

  // ส่งการแจ้งเตือนให้นักศึกษา
  notifyStudent: async (studentId, type, status, certificateNumber = null, remarks = null) => {
    try {
      const response = await apiClient.post('/admin/notify-student', {
        studentId,
        type,
        status,
        certificateNumber,
        remarks
      });
      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
};

export default certificateService;