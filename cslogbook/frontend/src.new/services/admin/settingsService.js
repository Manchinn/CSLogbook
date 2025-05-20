// filepath: c:\Users\chinn\CSLog\cslogbook\frontend\src.new\services\admin\settingsService.js
import apiClient from "../apiClient";

export const settingsService = {
  // ดึงข้อมูลการตั้งค่าปีการศึกษา
  getAcademicSettings: async () => {
    try {
      const response = await apiClient.get("/admin/academic");
      return response.data;
    } catch (error) {
      console.error("Error fetching academic settings:", error);
      throw error;
    }
  },

  // อัปเดตข้อมูลการตั้งค่าปีการศึกษา
  updateAcademicSettings: async (data) => {
    try {
      const response = await apiClient.put("/admin/academic", data);
      return response.data;
    } catch (error) {
      console.error("Error updating academic settings:", error);
      throw error;
    }
  },

  getCurriculumMappings: async () => {
    try {
      const response = await apiClient.get("/admin/curriculums/mappings");
      return response.data;
    } catch (error) {
      console.error("Error fetching curriculum mappings:", error);
      throw error;
    }
  },

  // ดึงข้อมูลเกณฑ์คุณสมบัติ
  getEligibilitySettings: async () => {
    try {
      const response = await apiClient.get("/admin/settings/eligibility");
      return response.data;
    } catch (error) {
      console.error("Error fetching eligibility settings:", error);
      throw error;
    }
  },

  // อัปเดตข้อมูลเกณฑ์คุณสมบัติ
  updateEligibilitySettings: async (data) => {
    try {
      const response = await apiClient.put("/admin/settings/eligibility", data);
      return response.data;
    } catch (error) {
      console.error("Error updating eligibility settings:", error);
      throw error;
    }
  },

  // ดึงข้อมูลสถานะนักเรียน
  getStudentStatuses: async () => {
    try {
      const response = await apiClient.get("/admin/settings/student-statuses"); // Changed from /admin2 to /admin
      return response.data;
    } catch (error) {
      console.error("Error fetching student statuses:", error);
      throw error;
    }
  },

  // อัปเดตข้อมูลสถานะนักเรียน
  updateStudentStatus: async (statusData) => {
    try {
      const response = await apiClient.put(
        `/admin/settings/student-statuses/${statusData.id}`,
        statusData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating student status:", error);
      throw error;
    }
  },

  // สร้างข้อมูลสถานะนักเรียน
  createStudentStatus: async (statusData) => {
    try {
      const response = await apiClient.post(
        "/admin/settings/student-statuses", // Changed from /admin2 to /admin
        statusData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating student status:", error);
      throw error;
    }
  },

  // ลบข้อมูลสถานะนักเรียน
  deleteStudentStatus: async (statusId) => {
    try {
      const response = await apiClient.delete(
        `/admin/settings/student-statuses/${statusId}` // Changed from /admin2 to /admin
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting student status:", error);
      throw error;
    }
  },

  // ดึงข้อมูลหลักสูตรทั้งหมด
  getCurriculums: async () => {
    const response = await apiClient.get("/admin/curriculums"); 
    return response.data;
  },

  // ดึงข้อมูลหลักสูตรตาม ID
  getCurriculumById: async (id) => {
    const response = await apiClient.get(`/admin/curriculums/${id}`); 
    return response.data;
  },

  // สร้างหลักสูตรใหม่
  createCurriculum: async (curriculumData) => {
    const response = await apiClient.post("/admin/curriculums", curriculumData); 
    return response.data;
  },

  // อัปเดตข้อมูลหลักสูตร
  updateCurriculum: async (id, curriculumData) => {
    console.log("Updating curriculum with ID:", id); 
    console.log("Updating curriculum with data:", curriculumData); 
    const response = await apiClient.put(
      `/admin/curriculums/${id}`,
      curriculumData
    );
    return response.data;
  },

  // ลบหลักสูตร
  deleteCurriculum: async (id) => {
    const response = await apiClient.delete(`/admin/curriculums/${id}`); 
    return response.data;
  },

  // ดึงข้อมูลการตั้งค่าหลักสูตร
  getCurriculumSettings: async () => {
    try {
      const response = await apiClient.get("/admin/curriculums/settings"); 
      return response.data;
    } catch (error) {
      console.error("Error fetching curriculum settings:", error);
      throw error;
    }
  },
};