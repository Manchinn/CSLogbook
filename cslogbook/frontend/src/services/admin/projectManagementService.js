import apiClient from '../apiClient';

/**
 * Project Management Service
 * สำหรับจัดการ API calls ที่เกี่ยวข้องกับการจัดการโครงงานพิเศษ
 */
class ProjectManagementService {
  constructor() {
    // ใช้ apiClient ที่มีอยู่แล้วแทนการสร้าง axios instance ใหม่
    this.api = apiClient;
    // ไม่ต้องใส่ /api เพราะ apiClient มี baseURL เป็น /api อยู่แล้ว
    this.baseURL = '/admin';
  }

  /**
   * สร้างโครงงานพิเศษใหม่แบบ manual
   * @param {Object} projectData - ข้อมูลโครงงาน
   * @returns {Promise<Object>} - ผลลัพธ์การสร้างโครงงาน
   */
  async createProjectManually(projectData) {
    try {
      const response = await this.api.post(`${this.baseURL}/projects/create-manually`, projectData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error creating project manually:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างโครงงาน',
        error: error.response?.data
      };
    }
  }

  /**
   * ดึงรายการโครงงานทั้งหมด
   * @param {Object} filters - ตัวกรองข้อมูล
   * @returns {Promise<Object>} - รายการโครงงาน
   */
  async getAllProjects(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filters to params
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await this.api.get(`${this.baseURL}/projects?${params.toString()}`);
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error getting all projects:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลโครงงาน',
        error: error.response?.data
      };
    }
  }

  /**
   * ดึงข้อมูลโครงงานตาม ID
   * @param {string} projectId - ID ของโครงงาน
   * @returns {Promise<Object>} - ข้อมูลโครงงาน
   */
  async getProjectById(projectId) {
    try {
      const response = await this.api.get(`${this.baseURL}/projects/${projectId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error getting project by ID:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลโครงงาน',
        error: error.response?.data
      };
    }
  }

  /**
   * อัปเดตข้อมูลโครงงาน
   * @param {string} projectId - ID ของโครงงาน
   * @param {Object} updateData - ข้อมูลที่ต้องการอัปเดต
   * @returns {Promise<Object>} - ผลลัพธ์การอัปเดต
   */
  async updateProject(projectId, updateData) {
    try {
      const response = await this.api.put(`${this.baseURL}/projects/${projectId}`, updateData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error updating project:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตโครงงาน',
        error: error.response?.data
      };
    }
  }

  /**
   * ค้นหานักศึกษาจากรหัสนักศึกษา
   * @param {string} studentCode - รหัสนักศึกษา
   * @returns {Promise<Object>} - ข้อมูลนักศึกษา
   */
  async findStudentByCode(studentCode) {
    try {
      const response = await this.api.get(`${this.baseURL}/projects/student/${studentCode}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error finding student by code:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการค้นหานักศึกษา',
        error: error.response?.data
      };
    }
  }

  /**
   * ดึงรายชื่ออาจารย์ที่สามารถเป็นที่ปรึกษาได้
   * @returns {Promise<Object>} - รายชื่ออาจารย์
   */
  async getAvailableAdvisors() {
    try {
      const response = await this.api.get(`${this.baseURL}/advisors`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error getting available advisors:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงรายชื่ออาจารย์',
        error: error.response?.data
      };
    }
  }

  /**
   * ดึงรายการ tracks ที่มีอยู่
   * @returns {Promise<Object>} - รายการ tracks
   */
  async getAvailableTracks() {
    try {
      const response = await this.api.get(`${this.baseURL}/projects/tracks`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error getting available tracks:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงรายการ tracks',
        error: error.response?.data
      };
    }
  }

  /**
   * ลบโครงงาน (ถ้าจำเป็น)
   * @param {string} projectId - ID ของโครงงาน
   * @returns {Promise<Object>} - ผลลัพธ์การลบ
   */
  async deleteProject(projectId) {
    try {
      const response = await this.api.delete(`${this.baseURL}/projects/${projectId}`);
      return {
        success: true,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error deleting project:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบโครงงาน',
        error: error.response?.data
      };
    }
  }

  /**
   * เปลี่ยนสถานะโครงงาน
   * @param {string} projectId - ID ของโครงงาน
   * @param {string} status - สถานะใหม่
   * @returns {Promise<Object>} - ผลลัพธ์การเปลี่ยนสถานะ
   */
  async changeProjectStatus(projectId, status) {
    try {
      const response = await this.api.patch(`${this.baseURL}/projects/${projectId}/status`, { status });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error changing project status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะโครงงาน',
        error: error.response?.data
      };
    }
  }

  /**
   * ดึงสถิติโครงงาน
   * @returns {Promise<Object>} - สถิติโครงงาน
   */
  async getProjectStatistics() {
    try {
      const response = await this.api.get(`${this.baseURL}/projects/statistics`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error getting project statistics:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงสถิติโครงงาน',
        error: error.response?.data
      };
    }
  }

  /**
   * ยกเลิกโครงงานพิเศษ
   * @param {string} projectId - ID ของโครงงาน
   * @param {string} reason - เหตุผลในการยกเลิก
   * @returns {Promise<Object>} - ผลลัพธ์การยกเลิก
   */
  async cancelProject(projectId, reason) {
    try {
      const response = await this.api.post(`${this.baseURL}/projects/${projectId}/cancel`, { reason });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error cancelling project:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการยกเลิกโครงงาน',
        error: error.response?.data
      };
    }
  }
}

// Export singleton instance
export const projectManagementService = new ProjectManagementService();
export default projectManagementService;