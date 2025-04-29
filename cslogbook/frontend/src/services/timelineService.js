import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
        const response = await axios.get(
          `${API_URL}/timeline/public/student/${studentId}`
        );
        return response.data;
      } else {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/timeline/student/${studentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
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
        const response = await axios.post(
          `${API_URL}/timeline/public/student/${studentId}/init`,
          {}
        );
        return response.data;
      } else {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${API_URL}/timeline/student/${studentId}/init`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
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
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/timeline/step/${stepId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating timeline step:', error);
      throw error;
    }
  }
};

export default timelineService;