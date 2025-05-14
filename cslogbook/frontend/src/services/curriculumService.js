import apiClient from './apiClient';

export const curriculumService = {
  /**
   * ดึงข้อมูลหลักสูตรที่ใช้งานอยู่จากฐานข้อมูล
   */
  getActiveCurriculum: async () => {
    try {
/*       // ดึง token จาก localStorage หรือ sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // สร้าง headers พร้อม token สำหรับการ authenticate
      const config = token ? {
        headers: { 'Authorization': `Bearer ${token}` }
      } : {}; */
      
      console.log('Fetching curriculum data from API...');
      const response = await apiClient.get('/curriculums/active');
      console.log('Curriculum data received:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching curriculum data:', error);
      
      // บันทึก error รายละเอียดเพิ่มเติมเพื่อช่วย debug
      console.error('Status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      // แสดง alert หรือข้อความแจ้งเตือนให้ผู้ใช้งานทราบ (optional)
      // alert('ไม่สามารถเชื่อมต่อกับข้อมูลหลักสูตรได้');
      
      // ส่งค่า error กลับไป เพื่อให้ component จัดการต่อไป
      throw error;
    }
  },

  /**
   * ดึงเกณฑ์หน่วยกิตจากหลักสูตรที่ใช้งานอยู่
   */
  getEligibilityCriteria: async () => {
    try {
      const response = await curriculumService.getActiveCurriculum();
      
      if (response.success && response.data) {
        return {
          success: true,
          data: {
            internshipBaseCredits: response.data.internshipBaseCredits,
            projectBaseCredits: response.data.projectBaseCredits,
            projectMajorBaseCredits: response.data.projectMajorBaseCredits
          }
        };
      }
      
      throw new Error('ไม่พบข้อมูลเกณฑ์หน่วยกิตในหลักสูตร');
    } catch (error) {
      console.error('ไม่สามารถดึงข้อมูลเกณฑ์หน่วยกิตได้:', error);
      
      // แจ้งเตือนผู้ดูแลระบบ
      console.warn('กำลังใช้ค่า fallback แทนข้อมูลจากฐานข้อมูล - โปรดแจ้งผู้ดูแลระบบ');
      
      // ส่งค่า error กลับไป เพื่อให้ component จัดการต่อไป
      throw error;
    }
  }
};

export default curriculumService;