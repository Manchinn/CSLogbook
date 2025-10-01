import apiClient from './apiClient';

export const teacherService = {
  // ดึงรายการอาจารย์สำหรับให้นักศึกษาเลือกเป็น advisor (payload ย่อเฉพาะที่จำเป็น)
  getAdvisors: async () => {
    try {
      const response = await apiClient.get('/teachers/advisors');
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงรายชื่ออาจารย์ที่ปรึกษาได้');
      }
      return response.data.data; // array ของ { teacherId, teacherCode, firstName, lastName, position }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงรายชื่ออาจารย์ที่ปรึกษา');
    }
  },
  getAllDeadlines: async (academicYear) => {
    const response = await apiClient.get('/teachers/important-deadlines', { params: { academicYear } });
    return response.data.data || [];
  },
  // ดึงข้อมูลอาจารย์
  getTeacherInfo: async (teacherId) => {
    try {
      const response = await apiClient.get(`/teachers/${teacherId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่พบข้อมูลอาจารย์');
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

  // ดึงข้อมูลสถิติ
  getStats: async () => {
    try {
      const response = await apiClient.get('/teachers/stats');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลสถิติได้');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  // อัพเดทข้อมูลอาจารย์
  updateTeacher: async (teacherId, data) => {
    try {
      const response = await apiClient.put(`/teachers/${teacherId}`, data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถอัพเดทข้อมูลอาจารย์ได้');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating teacher:', error);
      if (error.response?.status === 404) {
        throw new Error('ไม่พบข้อมูลอาจารย์');
      }
      throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล');
    }
  },

  // เพิ่มข้อมูลอาจารย์
  addTeacher: async (teacherData) => {
    try {
      const response = await apiClient.post('/teachers', teacherData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถเพิ่มข้อมูลอาจารย์ได้');
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 409) {
        throw new Error('รหัสอาจารย์นี้มีในระบบแล้ว');
      }
      throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
    }
  },

  // ลบข้อมูลอาจารย์
  deleteTeacher: async (teacherId) => {
    try {
      const response = await apiClient.delete(`/teachers/${teacherId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถลบข้อมูลอาจารย์ได้');
      }

      return response.data;
    } catch (error) {
      console.error('Error deleting teacher:', error);
      if (error.response?.status === 404) {
        throw new Error('ไม่พบข้อมูลอาจารย์');
      }
      throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  },

  // ดึงรายการอาจารย์ทั้งหมด
  getAllTeachers: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      // เพิ่ม parameters สำหรับ filter
      if (filters.search) params.append('search', filters.search);
      if (filters.department) params.append('department', filters.department);
      
      const queryString = params.toString();
      const url = queryString ? `/teachers?${queryString}` : '/teachers';
      
      const response = await apiClient.get(url);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลอาจารย์ได้');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  },

  // ดึงข้อมูลนักศึกษาในที่ปรึกษา
  getAdvisees: async (teacherId) => {
    try {
      const response = await apiClient.get(`/teachers/${teacherId}/advisees`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลนักศึกษาในที่ปรึกษาได้');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching advisees:', error);
      throw error;
    }
  }
};