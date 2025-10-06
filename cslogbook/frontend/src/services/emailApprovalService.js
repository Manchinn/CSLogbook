import apiClient from './apiClient';

class EmailApprovalService {
  /**
   * ส่งคำขออนุมัติบันทึกการฝึกงานผ่านอีเมลไปยังหัวหน้างาน
   * @param {string} studentId - รหัสนักศึกษา
   * @param {Object} data - ข้อมูลการขออนุมัติ
   * @param {string} data.type - ประเภทการขออนุมัติ ('single', 'weekly', 'monthly', 'full')
   * @param {string} [data.startDate] - วันที่เริ่มต้น (สำหรับแบบ weekly, monthly)
   * @param {string} [data.endDate] - วันที่สิ้นสุด (สำหรับแบบ weekly, monthly)
   * @param {Array<number>} [data.logIds] - รายการ logId ที่ต้องการขออนุมัติ (สำหรับแบบ selected)
   * @returns {Promise} - ผลลัพธ์การส่งคำขอ
   */
  async sendApprovalRequest(studentId, data) {
    try {
      const response = await apiClient.post(`/email-approval/request/${studentId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error sending approval request:', error);
      throw error;
    }
  }

  /**
   * ดึงประวัติการส่งคำขออนุมัติผ่านอีเมล
   * @param {string} studentId - รหัสนักศึกษา
   * @returns {Promise<Array>} - รายการประวัติการส่งคำขออนุมัติ
   */
  async getApprovalHistory(studentId) {
    try {
      const response = await apiClient.get(`/email-approval/history/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching approval history:', error);
      throw error;
    }
  }
}

const emailApprovalService = new EmailApprovalService();

export default emailApprovalService;