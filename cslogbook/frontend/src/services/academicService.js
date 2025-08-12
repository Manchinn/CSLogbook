import apiClient from './apiClient';

export const academicService = {
  // ดึงข้อมูลการตั้งค่าปีการศึกษาปัจจุบัน
  getCurrentAcademicSettings: async () => {
    try {
      const response = await apiClient.get('/academic/current');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลปีการศึกษาได้');
      }

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching academic settings:', error);
      throw error;
    }
  },

  // ดึงข้อมูลปีการศึกษาและภาคการศึกษาปัจจุบันสำหรับ Header
  getCurrentAcademicInfo: async () => {
    try {
      const response = await academicService.getCurrentAcademicSettings();
      
      if (response.success && response.data) {
        // backend Academic model uses currentSemester
        let academicYear = response.data.academicYear;
        let semester = response.data.currentSemester ?? response.data.semester; // support both keys

        // If semester is missing, compute a reasonable fallback from current date
        if (semester == null) {
          const now = new Date();
          // Simple rule: months 6-10 => semester 1, months 11-5 => semester 2, month 6 of next year => summer(3) if needed
          const m = now.getMonth() + 1; // 1..12
          semester = (m >= 6 && m <= 10) ? 1 : 2; // keep it simple for display
          if (academicYear == null) {
            academicYear = now.getFullYear() + 543; // Thai year fallback
          }
          return {
            academicYear,
            semester,
            displayText: `${academicYear}/${semester}*`, // mark as computed
            isFromDatabase: false
          };
        }

        return {
          academicYear,
          semester,
          displayText: `${academicYear}/${semester}`,
          isFromDatabase: true
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching current academic info:', error);
      
      // ถ้าเป็น error 403 (ไม่มีสิทธิ์) ให้ return null
      if (error.response?.status === 403) {
        return null;
      }
      
      // สำหรับ error อื่นๆ ให้ส่ง error ต่อไปเพื่อให้ component จัดการ fallback
      throw error;
    }
  }
};

export default academicService;
