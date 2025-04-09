import apiClient from '../apiClient';

export const settingsService = {
  // ดึงข้อมูลการตั้งค่าปีการศึกษา
  getAcademicSettings: async () => {
    try {
      const response = await apiClient.get('/admin/settings/academic');
      return response.data;
    } catch (error) {
      console.error('Error fetching academic settings:', error);
      throw error;
    }
  },

  // อัปเดตข้อมูลการตั้งค่าปีการศึกษา
  updateAcademicSettings: async (data) => {
    try {
      const response = await apiClient.put('/admin/settings/academic', data);
      return response.data;
    } catch (error) {
      console.error('Error updating academic settings:', error);
      throw error;
    }
  },

  // ดึงข้อมูลเกณฑ์คุณสมบัติ
  getEligibilitySettings: async () => {
    try {
      const response = await apiClient.get('/admin/settings/eligibility');
      return response.data;
    } catch (error) {
      console.error('Error fetching eligibility settings:', error);
      throw error;
    }
  },

  // อัปเดตข้อมูลเกณฑ์คุณสมบัติ
  updateEligibilitySettings: async (data) => {
    try {
      const response = await apiClient.put('/admin/settings/eligibility', data);
      return response.data;
    } catch (error) {
      console.error('Error updating eligibility settings:', error);
      throw error;
    }
  },

  // ดึงข้อมูลสถานะนักเรียน
  getStudentStatuses: async () => {
    try {
      const response = await apiClient.get('/admin2/settings/student-statuses');
      return response.data;
    } catch (error) {
      console.error('Error fetching student statuses:', error);
      throw error;
    }
  },

  // อัปเดตข้อมูลสถานะนักเรียน
  updateStudentStatus: async (statusData) => {
    try {
      const response = await apiClient.put(`/admin2/settings/student-statuses/${statusData.id}`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating student status:', error);
      throw error;
    }
  },

  // สร้างข้อมูลสถานะนักเรียน
  createStudentStatus: async (statusData) => {
    try {
      const response = await apiClient.post('/admin2/settings/student-statuses', statusData);
      return response.data;
    } catch (error) {
      console.error('Error creating student status:', error);
      throw error;
    }
  },

  // ลบข้อมูลสถานะนักเรียน
  deleteStudentStatus: async (statusId) => {
    try {
      const response = await apiClient.delete(`/admin2/settings/student-statuses/${statusId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting student status:', error);
      throw error;
    }
  },

  // ดึงข้อมูลหลักสูตรทั้งหมด
  getCurriculums: async () => {
    try {
      const response = await apiClient.get('/admin2/settings/curriculums');
      return response.data;
    } catch (error) {
      console.error('Error fetching curriculums:', error);
      throw error;
    }
  },

  // อัปเดตข้อมูลหลักสูตร
  updateCurriculum: async (curriculumData) => {
    try {
      const response = await apiClient.put(`/admin2/settings/curriculums/${curriculumData.id}`, curriculumData);
      return response.data;
    } catch (error) {
      console.error('Error updating curriculum:', error);
      throw error;
    }
  },

  // สร้างหลักสูตรใหม่
  createCurriculum: async (curriculumData) => {
    try {
      const response = await apiClient.post('/admin2/settings/curriculums', curriculumData);
      return response.data;
    } catch (error) {
      console.error('Error creating curriculum:', error);
      throw error;
    }
  },

  // ลบหลักสูตร
  deleteCurriculum: async (curriculumId) => {
    try {
      const response = await apiClient.delete(`/admin2/settings/curriculums/${curriculumId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      throw error;
    }
  }
};