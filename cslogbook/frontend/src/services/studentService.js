import apiClient from './apiClient';

export const studentService = {
  // ดึงข้อมูลสิทธิ์และข้อมูลนักศึกษา
  getStudentInfo: async (studentCode) => {
    try {
      console.log('Fetching student info for:', studentCode);
      const response = await apiClient.get(`/students/${studentCode}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่พบข้อมูลนักศึกษา');
      }

      return response.data;

    } catch (error) {
      console.error('Error details:', {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // ดึงข้อมูลสถิติ (สำหรับ admin/teacher)
  getStats: async () => {
    const response = await apiClient.get('/students/stats');
    return response.data;
  },

  // อัพเดทข้อมูลนักศึกษา (สำหรับ admin/teacher)
  updateStudent: async (studentCode, data) => {
    const response = await apiClient.put(`/students/${studentCode}`, data);
    return response.data;
  },

  // เพิ่มข้อมูลนักศึกษา (สำหรับ admin)
  addStudent: async (data) => {
    const response = await apiClient.post('/students', data);
    return response.data;
  },

  // ลบข้อมูลนักศึกษา (สำหรับ admin)
  deleteStudent: async (studentCode) => {
    const response = await apiClient.delete(`/students/${studentCode}`);
    return response.data;
  }
};