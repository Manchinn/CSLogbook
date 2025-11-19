import apiClient from 'services/apiClient';

/**
 * Service สำหรับจัดการข้อมูลการฝึกงานโดยเจ้าหน้าที่ภาควิชา
 */
const internshipAdminService = {
  /**
   * ดึงรายการนักศึกษาทั้งหมดพร้อมข้อมูลการฝึกงาน
   * @param {Object} filters - { academicYear, semester, status, search }
   * @returns {Promise} ข้อมูลนักศึกษาพร้อมการฝึกงาน
   */
  getAllInternshipStudents: async (filters = {}) => {
    try {
      const params = {};
      if (filters.academicYear) params.academicYear = filters.academicYear;
      if (filters.semester) params.semester = filters.semester;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const response = await apiClient.get('/admin/internships/students', { params });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'ไม่สามารถดึงข้อมูลได้');
      }

      return {
        success: true,
        data: response.data.data || [],
        total: response.data.total || 0,
        filters: response.data.filters || {},
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching internship students:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล'
      };
    }
  },

  /**
   * อัพเดทข้อมูลการฝึกงาน
   * @param {number} internshipId - ID ของการฝึกงาน
   * @param {Object} updateData - ข้อมูลที่ต้องการอัพเดท
   * @returns {Promise} ผลลัพธ์การอัพเดท
   */
  updateInternship: async (internshipId, updateData) => {
    try {
      const response = await apiClient.put(`/admin/internships/${internshipId}`, updateData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'ไม่สามารถอัพเดทข้อมูลได้');
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'อัพเดทข้อมูลสำเร็จ'
      };
    } catch (error) {
      console.error('Error updating internship:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล',
        details: error.response?.data?.details
      };
    }
  },

  /**
   * ยกเลิกการฝึกงาน
   * @param {number} internshipId - ID ของการฝึกงาน
   * @param {string} reason - เหตุผลในการยกเลิก
   * @returns {Promise} ผลลัพธ์การยกเลิก
   */
  cancelInternship: async (internshipId, reason) => {
    try {
      if (!reason || !reason.trim()) {
        throw new Error('กรุณาระบุเหตุผลในการยกเลิก');
      }

      const response = await apiClient.post(`/admin/internships/${internshipId}/cancel`, {
        reason: reason.trim()
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'ไม่สามารถยกเลิกการฝึกงานได้');
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'ยกเลิกการฝึกงานสำเร็จ'
      };
    } catch (error) {
      console.error('Error cancelling internship:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการยกเลิก',
        details: error.response?.data?.details
      };
    }
  }
};

export default internshipAdminService;

