import apiClient from '../apiClient';

const getToken = () => {
  return localStorage.getItem('token');
};

// ออบเจกต์สำหรับการจัดการข้อมูลนักศึกษา
export const studentService = {
  // ดึงข้อมูลนักศึกษาทั้งหมด
  getAllStudents: async (params = {}) => {
    try {
      const response = await apiClient.get('/admin/students', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  // ดึงข้อมูลนักศึกษาจาก ID
  getStudentInfo: async (studentId) => {
    try {
      const response = await apiClient.get(`/students/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching student info:', error);
      throw error;
    }
  },

  // อัปเดตข้อมูลนักศึกษา
  updateStudent: async (studentId, data) => {
    try {
      const response = await apiClient.put(`/students/${studentId}`, data, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  // เพิ่มนักศึกษา
  addStudent: async (data) => {
    try {
      const response = await apiClient.post(`/admin/students`, data, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  },

  // ลบนักศึกษา
  deleteStudent: async (studentId) => {
    try {
      const response = await apiClient.delete(`/admin/students/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  },

  // ดึงตัวเลือกสำหรับการกรอง
  getFilterOptions: async () => {
    try {
      const response = await apiClient.get(`/admin/students/filter-options`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }
};

// ออบเจกต์สำหรับการจัดการข้อมูลอาจารย์
export const userService = {
  // ดึงข้อมูลอาจารย์ทั้งหมด
  getTeachers: async (params = {}) => {
    try {
      const response = await apiClient.get('/admin/teachers', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  },

  // ดึงข้อมูลอาจารย์จาก ID
  getTeacherById: async (teacherId) => {
    try {
      const response = await apiClient.get(`/admin/teachers/${teacherId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching teacher:', error);
      throw error;
    }
  },

  // อัปเดตข้อมูลอาจารย์
  updateTeacher: async (teacherId, data) => {
    try {
      const response = await apiClient.put(`/admin/teachers/${teacherId}`, data, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  },

  // เพิ่มอาจารย์
  createTeacher: async (data) => {
    try {
      const response = await apiClient.post('/admin/teachers', data);
      return response.data;
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw error;
    }
  },

  // ลบอาจารย์
  deleteTeacher: async (teacherId) => {
    try {
      const response = await apiClient.delete(`/admin/teachers/${teacherId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw error;
    }
  },

  // Export ฟังก์ชันหลักสำหรับนักศึกษาด้วย
  ...studentService
};

export default userService;