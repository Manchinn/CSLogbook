import apiClient from "../apiClient";

// ออบเจกต์สำหรับการจัดการข้อมูลนักศึกษา
export const studentService = {
  // ดึงข้อมูลนักศึกษาทั้งหมด
  getAllStudents: async (params = {}) => {
    try {
      const response = await apiClient.get("/admin/students", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    }
  },

  // ดึงข้อมูลนักศึกษาจาก ID
  getStudentInfo: async (studentId) => {
    try {
      const response = await apiClient.get(`/students/${studentId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching student info:", error);
      throw error;
    }
  },

  // อัปเดตข้อมูลนักศึกษา
  updateStudent: async (studentCode, data) => {
    try {
      const response = await apiClient.put(
        `/admin/students/${studentCode}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating student:", error);
      throw error;
    }
  },

  // เพิ่มนักศึกษา
  addStudent: async (data) => {
    try {
      const response = await apiClient.post(`/admin/students`, data);
      return response.data;
    } catch (error) {
      console.error("Error adding student:", error);
      throw error;
    }
  },

  // ลบนักศึกษา
  deleteStudent: async (studentCode) => {
    try {
      const response = await apiClient.delete(`/admin/students/${studentCode}`);
      return response.data;
    } catch (error) {
      console.error("Error adding student:", error);
      throw error;
    }
  },

  // ดึงตัวเลือกสำหรับการกรอง
  getFilterOptions: async () => {
    try {
      const response = await apiClient.get(`/admin/students/filter-options`);
      return response.data;
    } catch (error) {
      console.error("Error fetching filter options:", error);
      throw error;
    }
  },
};

// ออบเจกต์สำหรับการจัดการข้อมูลอาจารย์
export const teacherService = {
  // ดึงข้อมูลอาจารย์ทั้งหมด
  getTeachers: async (params = {}) => {
    try {
      const response = await apiClient.get("/admin/teachers", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching teachers:", error);
      throw error;
    }
  },

  // ดึงข้อมูลอาจารย์จาก ID
  getTeacherById: async (teacherId) => {
    try {
      // ลบการกำหนด headers เพราะ apiClient จะจัดการให้
      const response = await apiClient.get(`/admin2/teachers/${teacherId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching teacher:", error);
      throw error;
    }
  },

  // อัปเดตข้อมูลอาจารย์
  updateTeacher: async (teacherId, data) => {
    try {
      // เปลี่ยนจาก teacherCode เป็น teacherId
      const response = await apiClient.put(
        `/admin/teachers/${teacherId}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating teacher:", error);
      throw error;
    }
  },

  // เพิ่มอาจารย์
  createTeacher: async (data) => {
    try {
      const response = await apiClient.post("/admin/teachers", data);
      return response.data;
    } catch (error) {
      console.error("Error creating teacher:", error);
      throw error;
    }
  },

  // ลบอาจารย์
  deleteTeacher: async (teacherId) => {
    try {
      // ลบการกำหนด headers เพราะ apiClient จะจัดการให้
      const response = await apiClient.delete(`/admin2/teachers/${teacherId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting teacher:", error);
      throw error;
    }
  },
};

// รวม services
export const userService = {
  ...studentService,
  ...teacherService
};

export default userService;
