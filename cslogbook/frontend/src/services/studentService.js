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
  },

  // ดึงรายการนักศึกษาทั้งหมด (สำหรับหน้า StudentList)
  getAllStudents: async () => {
    try {
      console.log('Fetching all students...');
      const response = await apiClient.get('/students');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลนักศึกษาได้');
      }

      return response.data.data;

    } catch (error) {
      console.error('Error details:', {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // เพิ่มนักศึกษาใหม่
  addStudent: async (studentData) => {
    try {
      const response = await apiClient.post('/admin/students', studentData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถเพิ่มข้อมูลนักศึกษาได้');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  },

  // อัพเดทข้อมูลนักศึกษา
  updateStudentAdmin: async (studentId, studentData) => {
    try {
      const response = await apiClient.put(`/admin/students/${studentId}`, studentData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถอัพเดทข้อมูลนักศึกษาได้');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  // ลบข้อมูลนักศึกษา
  deleteStudentAdmin: async (studentId) => {
    try {
      const response = await apiClient.delete(`/admin/students/${studentId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถลบข้อมูลนักศึกษาได้');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  },

  // ดึงรายการนักศึกษาทั้งหมดพร้อม filter
  getAllStudents: async (filters = {}) => {
    try {
      console.log('Fetching students with filters:', filters);
      const params = new URLSearchParams();
      
      // เพิ่ม parameters สำหรับ filter
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
      if (filters.search) params.append('search', filters.search);

      const queryString = params.toString();
      const url = queryString ? `/students?${queryString}` : '/students';
      
      const response = await apiClient.get(url);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลนักศึกษาได้');
      }

      return response.data.data;

    } catch (error) {
      console.error('Error fetching students:', {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // ดึงข้อมูลภาคเรียนปัจจุบัน
  getCurrentSemester: async () => {
    try {
      const response = await apiClient.get('/academic/current-semester');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching current semester:', error);
      throw error;
    }
  },

  // ดึงข้อมูลปีการศึกษาปัจจุบัน
  getCurrentAcademicYear: async () => {
    try {
      const response = await apiClient.get('/academic/current-year');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching current academic year:', error);
      throw error;
    }
  },

  // อัพเดทข้อมูลภาคเรียนและปีการศึกษา
  updateAcademicInfo: async (studentId, academicInfo) => {
    try {
      const response = await apiClient.put(`/students/${studentId}/academic-info`, {
        semester: academicInfo.semester,
        academicYear: academicInfo.academicYear
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถอัพเดทข้อมูลการศึกษาได้');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error updating academic info:', error);
      throw error;
    }
  },

  // เพิ่มฟังก์ชันดึงตัวเลือกการกรอง
  getFilterOptions: async () => {
    try {
      const response = await apiClient.get('/students/filter-options');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลตัวเลือกการกรอง');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // ส่งค่าเริ่มต้นถ้าไม่สามารถดึงข้อมูลได้
      return {
        semesters: [
          { value: 1, label: 'ภาคเรียนที่ 1' },
          { value: 2, label: 'ภาคเรียนที่ 2' },
          { value: 3, label: 'ภาคฤดูร้อน' }
        ],
        academicYears: [
          { value: new Date().getFullYear() + 543, label: `ปีการศึกษา ${new Date().getFullYear() + 543}` }
        ]
      };
    }
  }
};