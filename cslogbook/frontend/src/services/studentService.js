import apiClient from "./apiClient";

export const studentService = {
  // ดึงข้อมูลสิทธิ์และข้อมูลนักศึกษา
  getStudentInfo: async (studentCode) => {
    try {
      const response = await apiClient.get(`/students/${studentCode}`);

      if (!response.data.success) {
        throw new Error(response.data.message || "ไม่พบข้อมูลนักศึกษา");
      }

      // แปลงโครงสร้างข้อมูลให้ง่ายต่อการใช้งานใน component
      // ตรวจสอบว่ามี data และมีโครงสร้างที่คาดหวังหรือไม่
      const apiData = response.data;

      if (!apiData.data || !apiData.data.eligibility) {
        console.warn("API returned unexpected data structure:", apiData);
        return {
          success: apiData.success,
          message:
            apiData.message || "ได้รับข้อมูลแต่อยู่ในรูปแบบที่ไม่คาดหวัง",
          data: null,
        };
      }

      // โครงสร้างข้อมูลที่ง่ายต่อการใช้งานใน component
      const formattedData = {
        success: apiData.success,
        message: apiData.message,
        data: {
          studentCode: apiData.data.studentCode,
          firstName: apiData.data.firstName || "",
          lastName: apiData.data.lastName || "",
          email: apiData.data.email || "",
          totalCredits: apiData.data.totalCredits ,
          majorCredits: apiData.data.majorCredits ,
          classroom: apiData.data.classroom || "",
          phoneNumber: apiData.data.phoneNumber || "",
          studentYear: apiData.data.studentYear, // รับจาก backend โดยตรง
          // เพิ่มข้อมูลสำหรับ StudentAvatar component
          isEligibleInternship: apiData.data.isEligibleInternship,
          isEnrolledInternship: apiData.data.isEnrolledInternship,
          internshipStatus: apiData.data.internshipStatus,
          projectStatus: apiData.data.projectStatus,
          isEnrolledProject: apiData.data.isEnrolledProject,
          eligibility: {
            internship: {
              eligible: Boolean(apiData.data.eligibility?.internship?.eligible),
              message:
                apiData.data.eligibility?.internship?.message ||
                "ไม่พบข้อมูลสถานะการฝึกงาน",
            },
            project: {
              eligible: Boolean(apiData.data.eligibility?.project?.eligible),
              message:
                apiData.data.eligibility?.project?.message ||
                "ไม่พบข้อมูลสถานะโครงงาน",
            },
          },
        },
      };

      console.log("Formatted student data:", formattedData);
      return formattedData;
    } catch (error) {
      console.error("Error details:", {
        error,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  // ดึงกำหนดการสำคัญที่กำลังจะถึงภายใน X วัน (default 7)
  getUpcomingDeadlines: async (days = 7) => {
    const response = await apiClient.get(`/students/important-deadlines/upcoming`, { params: { days } });
    return response.data.data || [];
  },

  // ดึงข้อมูลสถิติ (สำหรับ admin/teacher)
  getStats: async () => {
    try {
      const response = await apiClient.get("/students/stats");
      console.log("Response from /students/stats:", response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || "ไม่สามารถดึงข้อมูลสถิติได้");
      }

      return response.data.data;
    } catch (error) {
      console.error("Error fetching statistics:", error);
      throw error;
    }
  },

  // อัพเดทข้อมูลนักศึกษา (สำหรับ admin/student)
  updateStudent: async (studentCode, data) => {
    try {
      // กรองข้อมูลเฉพาะฟิลด์ที่จำเป็น
      const sanitizedData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        totalCredits: parseInt(data.totalCredits, 10) || 0,
        majorCredits: parseInt(data.majorCredits, 10) || 0,
      };

      const response = await apiClient.put(
        `/students/${studentCode}`,
        sanitizedData
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถอัพเดทข้อมูลนักศึกษาได้"
        );
      }

      return response.data;
    } catch (error) {
      console.error("Error updating student:", error);
      throw error;
    }
  },

  // ลบข้อมูลนักศึกษา (สำหรับ admin)
  deleteStudent: async (studentCode) => {
    try {
      const response = await apiClient.delete(`/students/${studentCode}`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถลบข้อมูลนักศึกษาได้"
        );
      }

      return response.data;
    } catch (error) {
      console.error("Error deleting student:", error);
      if (error.response?.status === 404) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }
      throw new Error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการลบข้อมูล"
      );
    }
  },

  // เพิ่มนักศึกษาใหม่
  addStudent: async (studentData) => {
    try {
      const payload = {
        studentCode: studentData.studentCode,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        totalCredits: parseInt(studentData.totalCredits, 10) || 0,
        majorCredits: parseInt(studentData.majorCredits, 10) || 0,
      };

      const response = await apiClient.post("/students", payload);

      return response.data; // ส่งค่า response.data ทั้งหมดกลับไป
    } catch (error) {
      // จัดการ error ตามประเภท
      if (error.response?.status === 409) {
        throw new Error("รหัสนักศึกษานี้มีในระบบแล้ว");
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error("เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
    }
  },

  // อัพเดทข้อมูลนักศึกษา
  updateStudentAdmin: async (studentId, studentData) => {
    try {
      const response = await apiClient.put(
        `/admin/students/${studentId}`,
        studentData
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถอัพเดทข้อมูลนักศึกษาได้"
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("Error updating student:", error);
      throw error;
    }
  },

  // ลบข้อมูลนักศึกษา
  deleteStudentAdmin: async (studentId) => {
    try {
      const response = await apiClient.delete(`/admin/students/${studentId}`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถลบข้อมูลนักศึกษาได้"
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("Error deleting student:", error);
      throw error;
    }
  },

  // ดึงรายการนักศึกษาทั้งหมดพร้อม filter
  getAllStudents: async (filters = {}) => {
    try {
      console.log("Filters sent to getAllStudents:", filters);

      const params = new URLSearchParams();

      if (filters.semester) params.append("semester", filters.semester);
      if (filters.academicYear) params.append("academicYear", filters.academicYear);
      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);


      const queryString = params.toString();
      const url = queryString ? `/students?${queryString}` : "/students";

      console.log("Generated URL:", url);

      const response = await apiClient.get(url);

      // เพิ่มการ log ข้อมูลที่ได้รับกลับมา
      console.log("Response data length:", response.data.data?.length || 0);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถดึงข้อมูลนักศึกษาได้"
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    }
  },

  // ดึงข้อมูลภาคเรียนปัจจุบัน
  getCurrentSemester: async () => {
    try {
      const response = await apiClient.get("/academic/current-semester");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching current semester:", error);
      throw error;
    }
  },

  // ดึงข้อมูลปีการศึกษาปัจจุบัน
  getCurrentAcademicYear: async () => {
    try {
      const response = await apiClient.get("/academic/current-year");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching current academic year:", error);
      throw error;
    }
  },

  // อัพเดทข้อมูลภาคเรียนและปีการศึกษา
  updateAcademicInfo: async (studentId, academicInfo) => {
    try {
      const response = await apiClient.put(
        `/students/${studentId}/academic-info`,
        {
          semester: academicInfo.semester,
          academicYear: academicInfo.academicYear,
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถอัพเดทข้อมูลการศึกษาได้"
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("Error updating academic info:", error);
      throw error;
    }
  },

  // เพิ่มฟังก์ชันดึงตัวเลือกการกรอง
  getFilterOptions: async () => {
    try {
      const response = await apiClient.get("/students/filter-options");

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถดึงข้อมูลตัวเลือกการกรอง"
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("Error fetching filter options:", error);
      // ส่งค่าเริ่มต้นถ้าไม่สามารถดึงข้อมูลได้
      return {
        semesters: [
          { value: 1, label: "ภาคเรียนที่ 1" },
          { value: 2, label: "ภาคเรียนที่ 2" },
          { value: 3, label: "ภาคฤดูร้อน" },
        ],
        academicYears: [
          {
            value: new Date().getFullYear() + 543,
            label: `ปีการศึกษา ${new Date().getFullYear() + 543}`,
          },
        ],
      };
    }
  },

  // เพิ่มฟังก์ชันใหม่สำหรับอัพเดทข้อมูลติดต่อเฉพาะ

  // อัพเดทข้อมูลติดต่อของนักศึกษา
  updateContactInfo: async (studentCode, contactData) => {
    try {
      // แยกเฉพาะข้อมูลติดต่อ
      const sanitizedData = {
        classroom: contactData.classroom || null,
        phoneNumber: contactData.phoneNumber || null
      };

      const response = await apiClient.patch(
        `/students/${studentCode}/contact-info`,
        sanitizedData
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถอัพเดทข้อมูลติดต่อได้"
        );
      }

      return response.data;
    } catch (error) {
      console.error("Error updating contact info:", error);
      throw error;
    }
  },
};
