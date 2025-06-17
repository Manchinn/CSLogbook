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
      // กรอง studentCode ออกจาก payload ถ้ามี
      const { studentCode: omitted, ...rest } = data;

      // กรอง payload เฉพาะฟิลด์ที่อนุญาตให้แก้ไข
      const updatePayload = {
        firstName: rest.firstName,
        lastName: rest.lastName,
        email: rest.email,
        totalCredits: parseInt(rest.totalCredits, 10) || 0,
        majorCredits: parseInt(rest.majorCredits, 10) || 0,
      };

      // ตรวจสอบเงื่อนไขหน่วยกิต
      if (updatePayload.majorCredits > updatePayload.totalCredits) {
        throw new Error("หน่วยกิตภาควิชาต้องน้อยกว่าหรือเท่ากับหน่วยกิตรวม");
      }

      const response = await apiClient.put(
        `/admin/students/${studentCode}`,
        updatePayload
      );

      // ตรวจสอบ response จาก API
      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถอัปเดทข้อมูลนักศึกษาได้"
        );
      }

      return {
        success: true,
        data: response.data.data || updatePayload, // ใช้ข้อมูลที่ส่งไปถ้าไม่มี data กลับมา
        message: "อัปเดตข้อมูลสำเร็จ",
      };
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error(
          error.response.data.message || "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง"
        );
      }

      throw error;
    }
  },

  // เพิ่มนักศึกษา
  addStudent: async (data) => {
    try {
      const response = await apiClient.post(`/admin/students`, data);
      return response.data;
    } catch (error) {
      // จัดการข้อความ error แบบละเอียด
      if (error.response?.status === 409) {
        const errorMsg =
          error.response.data?.message || "มีข้อมูลนักศึกษานี้ในระบบแล้ว";
        // เพิ่มข้อความรายละเอียด
        const detail = error.response.data?.studentCode
          ? `รหัสนักศึกษา ${
              error.response.data.studentCode || data.studentCode
            } มีอยู่แล้วในระบบ`
          : errorMsg;

        const conflictError = new Error(detail);
        conflictError.isConflict = true;
        throw conflictError;
      }
      console.error("Error adding student:", error);
      throw error;
    }
  },

  // ลบนักศึกษา
  deleteStudent: async (studentCode) => {
    try {
      const response = await apiClient.delete(`/admin/students/${studentCode}`);

      // ⚠️ เพิ่มการตรวจสอบ response
      if (!response.data.success && response.status !== 200) {
        throw new Error(
          response.data.message || "ไม่สามารถลบข้อมูลนักศึกษาได้"
        );
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Error deleting student:", error);
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
      const response = await apiClient.get(`/admin/teachers/${teacherId}`);
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
      // ส่งต่อ error response จาก backend
      if (error.response) {
        throw error; // ส่ง error พร้อม response กลับไป
      }
      throw new Error(error.message || "ไม่สามารถเพิ่มข้อมูลอาจารย์ได้");
    }
  },

  // ลบอาจารย์
  deleteTeacher: async (teacherId) => {
    try {
      // ลบการกำหนด headers เพราะ apiClient จะจัดการให้
      const response = await apiClient.delete(`/admin/teachers/${teacherId}`);
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
  ...teacherService,
};

export default userService;
