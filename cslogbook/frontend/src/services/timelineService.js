import apiClient from './apiClient';

// ตั้งค่าสำหรับ Development mode เพื่อให้สามารถทดสอบได้ง่ายขึ้น
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * TimelineService สำหรับจัดการการเรียกใช้ API ที่เกี่ยวข้องกับไทม์ไลน์
 */
export const timelineService = {
  /**
   * ดึงข้อมูลไทม์ไลน์ของนักศึกษา
   * @param {string} studentId - รหัสนักศึกษา
   * @returns {Promise} - ข้อมูลไทม์ไลน์ของนักศึกษา
   */
  getStudentTimeline: async (studentId) => {
    try {
      // ในโหมดพัฒนา ใช้ public endpoint ที่ไม่ต้องการ token
      if (IS_DEV) {
        const response = await apiClient.get(`/timeline/public/student/${studentId}`);
        return response.data;
      } else {
        const response = await apiClient.get(`/timeline/student/${studentId}`);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching student timeline:', error);
      throw error;
    }
  },

  /**
   * สร้างข้อมูลไทม์ไลน์เริ่มต้นสำหรับนักศึกษา
   * @param {string} studentId - รหัสนักศึกษา
   * @returns {Promise} - ผลลัพธ์การสร้างข้อมูลไทม์ไลน์
   */
  initializeStudentTimeline: async (studentId) => {
    try {
      // ในโหมดพัฒนา ใช้ public endpoint ที่ไม่ต้องการ token
      if (IS_DEV) {
        const response = await apiClient.post(`/timeline/public/student/${studentId}/init`, {});
        return response.data;
      } else {
        const response = await apiClient.post(`/timeline/student/${studentId}/init`, {});
        return response.data;
      }
    } catch (error) {
      console.error('Error initializing student timeline:', error);
      throw error;
    }
  },

  /**
   * อัพเดทขั้นตอนในไทม์ไลน์
   * @param {string} stepId - รหัสขั้นตอน
   * @param {Object} updateData - ข้อมูลที่ต้องการอัพเดท
   * @returns {Promise} - ผลลัพธ์การอัพเดทขั้นตอน
   */
  updateTimelineStep: async (stepId, updateData) => {
    try {
      const response = await apiClient.put(`/timeline/step/${stepId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating timeline step:', error);
      throw error;
    }
  }
};

export default timelineService;