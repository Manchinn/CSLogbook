import apiClient from './apiClient';

// ออบเจ็กต์ที่รวบรวมบริการ Admin ทั้งหมด
export const adminService = {
  // ดึงข้อมูลสถิติสำหรับ Dashboard
  getStats: async () => {
    try {
      const response = await apiClient.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  // อัปโหลดข้อมูลนักศึกษาจากไฟล์ CSV
  uploadStudentCSV: async (formData) => {
    try {
      const response = await apiClient.post('/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading CSV:', error);
      throw error;
    }
  },

  // ดึงข้อมูลกิจกรรมล่าสุด
  getRecentActivities: async (params = {}) => {
    try {
      const search = new URLSearchParams(params).toString();
      const url = '/admin/activities' + (search ? `?${search}` : '');
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }
};

export default adminService;