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
  }
};