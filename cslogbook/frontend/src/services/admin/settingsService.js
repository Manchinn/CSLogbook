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
      // ส่ง id ไปด้วยใน body
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
      const response = await apiClient.get("/admin/settings/student-statuses");
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
        "/admin/settings/student-statuses",
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
        `/admin/settings/student-statuses/${statusId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting student status:", error);
      throw error;
    }
  },

  // ดึงข้อมูลหลักสูตรทั้งหมด
  getCurriculums: async () => {
    const response = await apiClient.get("/admin/curriculums"); // เปลี่ยน Path
    return response.data;
  },

  // ดึงข้อมูลหลักสูตรตาม ID
  getCurriculumById: async (id) => {
    const response = await apiClient.get(`/admin/curriculums/${id}`); // เปลี่ยน Path
    return response.data;
  },

  // สร้างหลักสูตรใหม่
  createCurriculum: async (curriculumData) => {
    const response = await apiClient.post("/admin/curriculums", curriculumData); // เปลี่ยน Path
    return response.data;
  },

  // อัปเดตข้อมูลหลักสูตร
  updateCurriculum: async (id, curriculumData) => {
    console.log("Updating curriculum with ID:", id); // ตรวจสอบค่า id
    console.log("Updating curriculum with data:", curriculumData); // ตรวจสอบ payload
    const response = await apiClient.put(
      `/admin/curriculums/${id}`,
      curriculumData
    );
    return response.data;
  },

  // ลบหลักสูตร
  deleteCurriculum: async (id) => {
    const response = await apiClient.delete(`/admin/curriculums/${id}`); // เปลี่ยน Path
    return response.data;
  },

  // ดึงข้อมูลการตั้งค่าหลักสูตร
  getCurriculumSettings: async () => {
    try {
      const response = await apiClient.get("/admin/curriculums/settings"); // ตรวจสอบว่า backend รองรับ path นี้หรือไม่
      return response.data;
    } catch (error) {
      console.error("Error fetching curriculum settings:", error);
      throw error;
    }
  },
};
