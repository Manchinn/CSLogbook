import apiClient from "services/apiClient";
// ✅ ใช้ static import

const internshipService = {
  // ============= ส่วนจัดการข้อมูลนักศึกษา =============
  /**
   * ดึงข้อมูลและสิทธิ์การฝึกงานของนักศึกษา
   */
  getStudentInfo: async () => {
    try {
      const response = await apiClient.get("/internship/student/info");

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      // เพิ่มการตรวจสอบและมีค่าเริ่มต้นสำหรับฟิลด์ classroom และ phoneNumber
      const studentData = response.data.student;
      if (studentData) {
        // กำหนดค่าเริ่มต้นถ้าไม่มีข้อมูล
        studentData.classroom = studentData.classroom || "";
        studentData.phoneNumber = studentData.phoneNumber || "";
      }

      return {
        success: true,
        student: studentData,
      };
    } catch (error) {
      console.error("Error fetching student info:", error);
      throw new Error("ไม่สามารถดึงข้อมูลนักศึกษาได้");
    }
  },

  /**
   * อัพเดทข้อมูลติดต่อของนักศึกษา (เพิ่มฟังก์ชันใหม่)
   */
  updateStudentContactInfo: async (contactInfo) => {
    try {
      const { classroom, phoneNumber } = contactInfo;

      const response = await apiClient.patch("/students/contact-info", {
        classroom,
        phoneNumber,
      });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถอัปเดตข้อมูลติดต่อได้"
        );
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Error updating contact info:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "ไม่สามารถอัปเดตข้อมูลติดต่อได้",
      };
    }
  },

  // ============= ส่วนจัดการแบบฟอร์ม คพ.05 =============
  /**
   * บันทึกคำร้องขอฝึกงาน (คพ.05)
   */
  submitCS05: async (formData) => {
    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (
        !formData.companyName ||
        !formData.companyAddress ||
        !formData.startDate ||
        !formData.endDate
      ) {
        throw new Error("กรุณากรอกข้อมูลให้ครบถ้วน");
      }

      const response = await apiClient.post("/internship/cs-05/submit", {
        documentType: "internship",
        documentName: "CS05",
        category: "proposal",
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        startDate: formData.startDate,
        endDate: formData.endDate,
        // เพิ่มฟิลด์ใหม่
        internshipPosition: formData.internshipPosition || "",
        contactPersonName: formData.contactPersonName || "",
        contactPersonPosition: formData.contactPersonPosition || "",
        classroom: formData.classroom || null,
        phoneNumber: formData.phoneNumber || null,
        // ข้อมูลนักศึกษาเพิ่มเติม
        studentData: formData.studentData || [],
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error("ไม่มีสิทธิ์ส่งคำร้อง");
      }
      throw new Error(
        error.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้"
      );
    }
  },

  /**
   * ดึงข้อมูล คพ.05 ปัจจุบัน
   */
  getCurrentCS05: async () => {
    try {
      const response = await apiClient.get("/internship/current-cs05");

      if (!response.data.success) {
        throw new Error(response.data.message || "ไม่สามารถดึงข้อมูล CS05");
      }

      if (response.data.data) {
        response.data.data.internshipPosition =
          response.data.data.internshipPosition || "";
        response.data.data.contactPersonName =
          response.data.data.contactPersonName || "";
        response.data.data.contactPersonPosition =
          response.data.data.contactPersonPosition || "";
      }

      return response.data;
    } catch (error) {
      // กรณียังไม่มีข้อมูล คพ.05 (404 Not Found) - ไม่ถือเป็น error
      if (error.response?.status === 404) {
        console.info("ไม่พบข้อมูล CS05 (นักศึกษายังไม่ได้กรอกข้อมูล)");
        return {
          success: true,
          data: null,
          message: "กรุณากรอกข้อมูลฝึกงาน",
        };
      }

      // บันทึก error จริงๆ สำหรับกรณีอื่นๆ
      console.error("Get Current CS05 Error:", error);
      console.error("Error details:", error.response?.data || error.message);

      throw new Error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการดึงข้อมูล CS05"
      );
    }
  },

  /**
   * ดึงข้อมูล คพ.05 ตาม ID
   */
  getCS05ById: async (id) => {
    try {
      const response = await apiClient.get(`/internship/cs-05/${id}`);
      return {
        success: true,
        data: {
          ...response.data,
          supervisorInfo: {
            name: response.data.supervisorName,
            position: response.data.supervisorPosition,
            phone: response.data.supervisorPhone,
            email: response.data.supervisorEmail,
          },
        },
      };
    } catch (error) {
      throw new Error("ไม่สามารถดึงข้อมูลแบบฟอร์ม คพ.05 ได้");
    }
  },

  /**
   * อัปโหลดไฟล์ใบแสดงผลการเรียน (Transcript)
   */
  uploadTranscript: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "INTERNSHIP");
      formData.append("category", "transcript");

      const response = await apiClient.post(
        "/internship/upload-transcript",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "ไม่สามารถอัปโหลดไฟล์ได้");
      }

      return response.data;
    } catch (error) {
      console.error("Upload Transcript Error:", error);
      throw new Error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์"
      );
    }
  },

  /**
   * บันทึกคำร้องขอฝึกงาน (คพ.05) พร้อม transcript
   */
  submitCS05WithTranscript: async (formData) => {
    try {
      // ถ้า formData เป็น FormData object
      if (formData instanceof FormData) {
        // ดึง JSON string จาก formData
        const formDataJson = formData.get("formData");
        if (formDataJson) {
          const formDataObj = JSON.parse(formDataJson);

          // เพิ่มข้อมูล classroom และ phoneNumber ถ้ามีในข้อมูลนักศึกษา
          if (formDataObj.studentData && formDataObj.studentData[0]) {
            formDataObj.classroom =
              formDataObj.studentData[0].classroom || null;
            formDataObj.phoneNumber =
              formDataObj.studentData[0].phoneNumber || null;
          }
          // เพิ่มการจัดการฟิลด์ใหม่ทั้ง 3 ฟิลด์
          formDataObj.internshipPosition = formDataObj.internshipPosition || "";
          formDataObj.contactPersonName = formDataObj.contactPersonName || "";
          formDataObj.contactPersonPosition =
            formDataObj.contactPersonPosition || "";

          // อัปเดต formData กลับไป
          formData.set("formData", JSON.stringify(formDataObj));
        }
      }

      const response = await apiClient.post(
        "/internship/cs-05/submit-with-transcript",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // อัพเดทข้อมูลติดต่อหลังส่งคำร้องสำเร็จ
      if (response.data.success && response.data.data) {
        try {
          const formDataObj =
            formData instanceof FormData
              ? JSON.parse(formData.get("formData"))
              : formData;

          if (formDataObj.studentData && formDataObj.studentData[0]) {
            const { classroom, phoneNumber } = formDataObj.studentData[0];
            if (classroom || phoneNumber) {
              await internshipService.updateStudentContactInfo({
                classroom,
                phoneNumber,
              });
            }
          }
        } catch (contactError) {
          console.warn(
            "Failed to update contact info, but CS05 was submitted:",
            contactError
          );
        }
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error("ไม่มีสิทธิ์ในการสร้างคำร้อง");
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || "ข้อมูลไม่ถูกต้อง");
      } else {
        throw new Error("เกิดข้อผิดพลาดในการส่งข้อมูล");
      }
    }
  },

  /**
   * ดึงรายการ คพ.05 ทั้งหมด
   */
  getCS05List: async () => {
    try {
      const response = await apiClient.get("/internship/cs-05/list");
      return response.data;
    } catch (error) {
      throw new Error("ไม่สามารถดึงรายการแบบฟอร์ม คพ.05 ได้");
    }
  },

  // ============= ส่วนจัดการเอกสารและการอัปโหลด =============
  /**
   * อัปโหลดหนังสือตอบรับนักศึกษาเข้าฝึกงาน
   * @param {FormData} formData - FormData ที่มี file และ documentId
   * @returns {Promise<Object>} ผลลัพธ์การอัปโหลด
   */
  uploadAcceptanceLetter: async (formData) => {
    try {
      // ตรวจสอบว่า formData มีข้อมูลที่จำเป็น
      if (!formData || !(formData instanceof FormData)) {
        throw new Error("ข้อมูลไฟล์ไม่ถูกต้อง");
      }

      // ตรวจสอบว่ามีไฟล์ที่ส่งมา
      const file = formData.get("acceptanceLetter");
      if (!file) {
        throw new Error("กรุณาเลือกไฟล์หนังสือตอบรับ");
      }

      // ตรวจสอบประเภทไฟล์
      if (file.type !== "application/pdf") {
        throw new Error("กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น");
      }

      // ตรวจสอบขนาดไฟล์ (สูงสุด 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("ขนาดไฟล์ต้องไม่เกิน 10MB");
      }

      // ส่งข้อมูลไปยัง API
      const response = await apiClient.post(
        "/internship/upload-acceptance-letter",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // ตรวจสอบผลลัพธ์จาก API
      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถอัปโหลดหนังสือตอบรับได้"
        );
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || "อัปโหลดหนังสือตอบรับเรียบร้อยแล้ว",
      };
    } catch (error) {
      console.error("Error uploading acceptance letter:", error);

      // จัดการข้อผิดพลาดตามประเภท
      if (error.response) {
        // Error จาก API response
        const status = error.response.status;
        const message = error.response.data?.message;

        switch (status) {
          case 400:
            throw new Error(message || "ข้อมูลที่ส่งไม่ถูกต้อง");
          case 403:
            throw new Error("ไม่มีสิทธิ์ในการอัปโหลดไฟล์");
          case 404:
            throw new Error("ไม่พบข้อมูลเอกสาร CS05");
          case 413:
            throw new Error("ขนาดไฟล์ใหญ่เกินไป");
          case 422:
            throw new Error(message || "ไฟล์ไม่ถูกต้องหรือเสียหาย");
          case 500:
            throw new Error("เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง");
          default:
            throw new Error(message || "เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
        }
      } else if (error.request) {
        // Error จาก network
        throw new Error(
          "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"
        );
      } else {
        // Error อื่นๆ
        throw new Error(error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
      }
    }
  },

  /**
   * ตรวจสอบสถานะการอัปโหลดหนังสือตอบรับ
   * @param {number} documentId - ID ของเอกสาร CS05
   * @returns {Promise<Object>} สถานะการอัปโหลด
   */
  checkAcceptanceLetterStatus: async (documentId) => {
    try {
      if (!documentId) {
        throw new Error("ไม่พบรหัสเอกสาร CS05");
      }

      const response = await apiClient.get(
        `/internship/acceptance-letter-status/${documentId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "ไม่สามารถตรวจสอบสถานะได้");
      }

      // 🔧 ปรับการแปลงสถานะจาก database
      const data = response.data.data;
      let mappedStatus;

      if (data.hasAcceptanceLetter) {
        // มีการอัปโหลดแล้ว
        if (data.status === "pending") {
          mappedStatus = "uploaded"; // pending -> uploaded (รออนุมัติ)
        } else if (data.status === "approved") {
          mappedStatus = "approved";
        } else if (data.status === "rejected") {
          mappedStatus = "rejected"; // แสดงสถานะปฏิเสธ
        } else if (data.status === "cancelled" || data.originalStatus === "cancelled") {
          // ✅ หนังสือตอบรับถูกยกเลิก - ถือว่าเป็นกระบวนการใหม่
          mappedStatus = "not_uploaded"; // อนุญาตให้อัปโหลดใหม่
        } else {
          mappedStatus = "uploaded"; // fallback อื่นๆ
        }
      } else {
        mappedStatus = "not_uploaded"; // ยังไม่มีการอัปโหลด
      }

      return {
        success: true,
        data: {
          ...data,
          status: mappedStatus, // ใช้ status ที่แปลงแล้ว
          originalStatus: data.status, // เก็บสถานะเดิมไว้สำหรับ debug
          rejectionReason:
            data.status === "rejected" ? data.reviewComment || null : null,
        },
      };
    } catch (error) {
      console.error("Error checking acceptance letter status:", error);

      // กรณี 404 ไม่ถือเป็น error
      if (error.response?.status === 404) {
        return {
          success: true,
          data: {
            hasAcceptanceLetter: false,
            status: "not_uploaded",
            originalStatus: null,
            uploadDate: null,
          },
        };
      }

      throw new Error(
        error.response?.data?.message || "ไม่สามารถตรวจสอบสถานะการอัปโหลดได้"
      );
    }
  },

  /**
   * ดาวน์โหลดหนังสือตอบรับที่อัปโหลดแล้ว
   * @param {number} documentId - ID ของเอกสาร CS05
   * @returns {Promise<Object>} ไฟล์ PDF
   */
  downloadAcceptanceLetter: async (documentId) => {
    try {
      const response = await apiClient.get(
        `/internship/download-acceptance-letter/${documentId}`,
        {
          responseType: "blob",
        }
      );

      // สร้าง URL สำหรับดาวน์โหลด
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `หนังสือตอบรับ-${documentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error("Download acceptance letter error:", error);
      throw error;
    }
  },

  /**
   * ตรวจสอบสถานะหนังสือส่งตัวนักศึกษา (ปรับปรุงใหม่)
   * @param {number} documentId - ID ของเอกสาร CS05
   * @returns {Promise<Object>} สถานะหนังสือส่งตัว
   */
  checkReferralLetterStatus: async (documentId) => {
    try {
      if (!documentId) {
        throw new Error("ไม่พบรหัสเอกสาร CS05");
      }

      const response = await apiClient.get(
        `/internship/referral-letter-status/${documentId}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถตรวจสอบสถานะหนังสือส่งตัวได้"
        );
      }

      const data = response.data.data;

      // ✅ ใช้ข้อมูล mappingInfo จาก backend
      const frontendStatus =
        data.mappingInfo?.shouldMapTo ||
        (() => {
          // fallback mapping
          switch (data.status) {
            case "referral_ready":
              return "ready";
            case "referral_downloaded":
              return "downloaded";
            case "supervisor_evaluated":
              return "downloaded";
            default:
              return "not_ready";
          }
        })();

      return {
        success: true,
        data: {
          ...data,
          status: frontendStatus, // สถานะสำหรับ UI
          originalStatus: data.status, // สถานะจาก database
          backendStatus: data.status, // alias สำหรับความชัดเจน
        },
      };
    } catch (error) {
      console.error("Error checking referral letter status:", error);

      if (error.response?.status === 404) {
        return {
          success: true,
          data: {
            hasReferralLetter: false,
            status: "not_ready",
            originalStatus: null,
            backendStatus: null,
          },
        };
      }

      throw new Error(
        error.response?.data?.message || "ไม่สามารถตรวจสอบสถานะหนังสือส่งตัวได้"
      );
    }
  },

  /**
   * ดาวน์โหลดหนังสือส่งตัวนักศึกษา
   * @param {number} documentId - ID ของเอกสาร CS05
   * @returns {Promise<Object>} ไฟล์ PDF หนังสือส่งตัว
   */
  downloadReferralLetter: async (documentId) => {
    try {
      if (!documentId) {
        throw new Error("ไม่พบรหัสเอกสาร CS05");
      }

      const response = await apiClient.get(
        `/internship/download-referral-letter/${documentId}`,
        {
          responseType: "blob",
          timeout: 30000, // 30 วินาที สำหรับการสร้าง PDF ที่อาจใช้เวลานาน
        }
      );

      // ตรวจสอบว่าได้ไฟล์ PDF กลับมา
      if (!response.data || response.data.size === 0) {
        throw new Error("ไฟล์หนังสือส่งตัวไม่ถูกต้องหรือเสียหาย");
      }

      // สร้างชื่อไฟล์แบบไดนามิก
      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `หนังสือส่งตัวนักศึกษา-${documentId}-${currentDate}.pdf`;

      // สร้าง URL สำหรับดาวน์โหลด
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // 🚫 ลบการเรียก mark downloaded ออก - Backend จะทำเองในขั้นตอน download
      // ใน Backend API `/download-referral-letter` จะอัปเดตสถานะเองอัตโนมัติ

      return {
        success: true,
        message: `ดาวน์โหลดหนังสือส่งตัวเรียบร้อยแล้ว: ${filename}`,
      };
    } catch (error) {
      console.error("Error downloading referral letter:", error);

      // จัดการข้อผิดพลาดตามประเภท
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;

        switch (status) {
          case 400:
            throw new Error(message || "ข้อมูลคำร้องไม่ถูกต้อง");
          case 403:
            throw new Error("ไม่มีสิทธิ์ในการดาวน์โหลดหนังสือส่งตัว");
          case 404:
            throw new Error("ไม่พบหนังสือส่งตัว อาจยังไม่ได้รับการอนุมัติ");
          case 409:
            throw new Error(
              "หนังสือส่งตัวยังไม่พร้อม กรุณารอการดำเนินการจากเจ้าหน้าที่"
            );
          case 500:
            throw new Error("เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง");
          default:
            throw new Error(
              message || "เกิดข้อผิดพลาดในการดาวน์โหลดหนังสือส่งตัว"
            );
        }
      } else if (error.request) {
        throw new Error(
          "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"
        );
      } else {
        throw new Error(error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
      }
    }
  },

  /**
   * แจ้ง Backend ว่าได้ดาวน์โหลดหนังสือส่งตัวแล้ว
   * @param {number} documentId - ID ของเอกสาร CS05
   * @returns {Promise<Object>} ผลการอัปเดตสถานะ
   */
  markReferralLetterDownloaded: async (documentId) => {
    try {
      if (!documentId) {
        throw new Error("ไม่พบรหัสเอกสาร CS05");
      }

      const response = await apiClient.patch(
        `/internship/referral-letter/${documentId}/mark-downloaded`,
        {},
        {
          timeout: 10000, // 10 วินาที
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถอัปเดตสถานะการดาวน์โหลดได้"
        );
      }

      return {
        success: true,
        message: "อัปเดตสถานะการดาวน์โหลดเรียบร้อยแล้ว",
        data: response.data.data,
      };
    } catch (error) {
      console.error("Error marking referral letter as downloaded:", error);

      // จัดการข้อผิดพลาดตามประเภท
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;

        switch (status) {
          case 400:
            throw new Error(message || "ข้อมูลคำร้องไม่ถูกต้อง");
          case 403:
            throw new Error("ไม่มีสิทธิ์ในการอัปเดตสถานะ");
          case 404:
            throw new Error("ไม่พบหนังสือส่งตัว");
          case 409:
            throw new Error("สถานะไม่สามารถเปลี่ยนแปลงได้");
          case 500:
            throw new Error("เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง");
          default:
            throw new Error(message || "เกิดข้อผิดพลาดในการอัปเดตสถานะ");
        }
      } else if (error.request) {
        throw new Error(
          "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต"
        );
      } else {
        throw new Error(error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ");
      }
    }
  },

  // ============= ส่วนจัดการข้อมูลสถานประกอบการ =============
  /**
   * ดึงข้อมูลสถานประกอบการและผู้ควบคุมงาน
   */
  getCompanyInfo: async (documentId) => {
    try {
      if (!documentId) {
        throw new Error("ไม่พบรหัสเอกสาร CS05");
      }

      const response = await apiClient.get(
        `/internship/company-info/${documentId}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถดึงข้อมูลสถานประกอบการได้"
        );
      }

      // จัดการข้อมูลให้มีค่าเริ่มต้นที่เหมาะสม
      const companyData = response.data.data || {};

      return {
        success: true,
        data: {
          companyName: companyData.companyName || "",
          companyAddress: companyData.companyAddress || "",
          supervisorName: companyData.supervisorName || "",
          supervisorPosition: companyData.supervisorPosition || "", // เพิ่มฟิลด์ตำแหน่ง
          supervisorPhone: companyData.supervisorPhone || "",
          supervisorEmail: companyData.supervisorEmail || "",
          internshipPosition: companyData.internshipPosition || "",
          contactPersonName: companyData.contactPersonName || "",
          contactPersonPosition: companyData.contactPersonPosition || "",
        },
      };
    } catch (error) {
      console.error("Error fetching company info:", error);

      // กรณียังไม่มีข้อมูล - ไม่ถือเป็น error
      if (error.response?.status === 404) {
        return {
          success: true,
          data: null,
          message: "ยังไม่มีข้อมูลสถานประกอบการ",
        };
      }

      throw new Error(
        error.response?.data?.message || "ไม่สามารถดึงข้อมูลสถานประกอบการได้"
      );
    }
  },

  /**
   * บันทึกข้อมูลสถานประกอบการและผู้ควบคุมงาน
   */
  submitCompanyInfo: async (companyData) => {
    try {
      if (!companyData.documentId) {
        throw new Error("ไม่พบรหัสเอกสาร CS05");
      }

      // ตรวจสอบข้อมูลที่จำเป็น
      if (
        !companyData.supervisorName ||
        !companyData.supervisorPhone ||
        !companyData.supervisorEmail
      ) {
        throw new Error("กรุณากรอกข้อมูลผู้ควบคุมงานให้ครบถ้วน");
      }

      const submitData = {
        documentId: companyData.documentId,
        supervisorName: companyData.supervisorName.trim(),
        supervisorPosition: companyData.supervisorPosition?.trim() || "", // เพิ่มฟิลด์ตำแหน่ง
        supervisorPhone: companyData.supervisorPhone.trim(),
        supervisorEmail: companyData.supervisorEmail.trim(),
      };

      const response = await apiClient.post(
        "/internship/company-info/submit",
        submitData
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถบันทึกข้อมูลสถานประกอบการได้"
        );
      }

      return {
        success: true,
        data: response.data.data,
        message: "บันทึกข้อมูลสถานประกอบการเรียบร้อยแล้ว",
      };
    } catch (error) {
      console.error("Error submitting company info:", error);
      throw new Error(
        error.response?.data?.message || "ไม่สามารถบันทึกข้อมูลสถานประกอบการได้"
      );
    }
  },

  /**
   * อัพเดทข้อมูลผู้ควบคุมงาน (แก้ไขจากฟังก์ชันเดิม)
   */
  updateCS05Supervisor: async (documentId, supervisorInfo) => {
    try {
      const response = await apiClient.patch(
        `/internship/cs-05/${documentId}/supervisor`,
        {
          supervisorName: supervisorInfo.name,
          supervisorPosition: supervisorInfo.position || "", // เพิ่มฟิลด์ตำแหน่ง
          supervisorPhone: supervisorInfo.phone,
          supervisorEmail: supervisorInfo.email,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "ไม่สามารถอัพเดทข้อมูลผู้ควบคุมงาน"
      );
    }
  },

  // ============= ส่วนจัดการสมุดบันทึกการฝึกงาน =============
  /**
   * ดึงข้อมูลบันทึกการฝึกงานทั้งหมด
   */
  getTimeSheetEntries: async () => {
    try {
      const response = await apiClient.get("/internship/logbook/timesheet");

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถดึงข้อมูลบันทึกการฝึกงานได้"
        );
      }

      // ตรวจสอบและจัดการรูปแบบข้อมูลที่หลากหลาย
      let entries = [];

      if (Array.isArray(response.data)) {
        entries = response.data;
      } else if (response.data && response.data.data) {
        if (Array.isArray(response.data.data)) {
          entries = response.data.data;
        } else if (typeof response.data.data === "object") {
          // กรณีข้อมูลเป็น object แต่ไม่ใช่ array
          entries = [response.data.data];
        }
      }

      return {
        success: true,
        data: entries,
      };
    } catch (error) {
      console.error("Error fetching timesheet entries:", error);
      throw new Error(
        error.response?.data?.message || "ไม่สามารถโหลดข้อมูลการฝึกงาน"
      );
    }
  },

  /**
   * บันทึกข้อมูลการฝึกงานประจำวัน
   */
  saveTimeSheetEntry: async (entryData) => {
    try {
      const response = await apiClient.post(
        "/internship/logbook/timesheet",
        entryData
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถบันทึกข้อมูลการฝึกงานได้"
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("Error saving timesheet entry:", error);
      throw new Error(
        error.response?.data?.message || "ไม่สามารถบันทึกข้อมูลการฝึกงาน"
      );
    }
  },

  /**
   * อัพเดทข้อมูลการฝึกงานประจำวัน
   */
  updateTimeSheetEntry: async (entryId, entryData) => {
    try {
      const response = await apiClient.put(
        `/internship/logbook/timesheet/${entryId}`,
        entryData
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถอัพเดทข้อมูลการฝึกงานได้"
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("Error updating timesheet entry:", error);
      throw new Error(
        error.response?.data?.message || "ไม่สามารถอัพเดทข้อมูลการฝึกงาน"
      );
    }
  },

  /**
   * บันทึกเวลาเข้างาน
   */
  checkIn: async (workDate, timeIn) => {
    try {
      const response = await apiClient.post("/internship/logbook/check-in", {
        workDate,
        timeIn,
      });
      return response.data.data;
    } catch (error) {
      console.error("Error checking in:", error);
      throw new Error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกเวลาเข้างาน"
      );
    }
  },

  /**
   * บันทึกเวลาออกงานและรายละเอียด
   */
  checkOut: async (logData) => {
    try {
      const response = await apiClient.post(
        "/internship/logbook/check-out",
        logData
      );
      return response.data.data;
    } catch (error) {
      console.error("Error checking out:", error);
      throw new Error(
        error.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกเวลาออกงาน"
      );
    }
  },

  /**
   * ดึงข้อมูลสถิติการฝึกงาน
   */
  getTimeSheetStats: async () => {
    try {
      const response = await apiClient.get(
        "/internship/logbook/timesheet/stats"
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถดึงข้อมูลสถิติการฝึกงานได้"
        );
      }

      return response.data.data;
    } catch (error) {
      console.error("Error fetching timesheet stats:", error);
      throw new Error(
        error.response?.data?.message || "ไม่สามารถโหลดข้อมูลสถิติการฝึกงาน"
      );
    }
  },

  // เพิ่มฟังก์ชันใหม่ ดึงวันที่ฝึกงานจาก CS05
  getInternshipDateRange: async () => {
    try {
      const response = await apiClient.get(
        "/internship/logbook/cs05/date-range"
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถดึงข้อมูลวันที่ฝึกงานได้"
        );
      }

      return response.data.data; // จะได้ { startDate: '2025-XX-XX', endDate: '2025-XX-XX' }
    } catch (error) {
      console.error("Error fetching internship date range:", error);
      throw new Error(
        error.response?.data?.message || "ไม่สามารถโหลดข้อมูลวันที่ฝึกงาน"
      );
    }
  },

  // ฟังก์ชันสร้างรายการวันที่ฝึกงานทั้งหมด (ไม่รวมวันหยุด)
  generateInternshipDates: async () => {
    try {
      const response = await apiClient.get("/internship/logbook/workdays");
      // ตรวจสอบการตอบกลับ
      if (!response.data.success) {
        console.warn("API แจ้งว่าไม่สำเร็จ:", response.data.message);
        throw new Error(
          response.data.message || "ไม่สามารถสร้างรายการวันที่ฝึกงานได้"
        );
      }

      // ตรวจสอบโครงสร้างข้อมูล
      const workdays = response.data.data;

      // ตรวจสอบความถูกต้องของข้อมูล
      if (!workdays || !Array.isArray(workdays)) {
        console.warn("API ส่งข้อมูลในรูปแบบที่ไม่ใช่ array:", workdays);
        return []; // ส่งคืน array ว่าง
      }

      console.log("พบข้อมูลวันทำงาน:", workdays.length, "วัน");
      return workdays; // ส่งคืน array ของวันที่
    } catch (error) {
      console.error("Error generating internship dates:", error);
      throw error;
    }
  },

  // ============= ส่วนสรุปข้อมูลการฝึกงาน =============
  /**
   * ดึงข้อมูลสรุปการฝึกงาน
   */
  getInternshipSummary: async () => {
    try {
      const response = await apiClient.get("/internship/summary");

      if (!response.data.success) {
        throw new Error(
          response.data.message || "ไม่สามารถดึงข้อมูลสรุปการฝึกงานได้"
        );
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("Error fetching internship summary:", error);
      // ปรับปรุง error handling ให้แสดง error message ที่ชัดเจน
      const errorMessage = error.response?.data?.message || error.message || "ไม่สามารถโหลดข้อมูลสรุปการฝึกงาน";
      throw new Error(errorMessage);
    }
  },
  /**
   * ดาวน์โหลดเอกสารสรุปการฝึกงาน PDF (เวอร์ชัน Backend)
   */
  downloadInternshipSummary: async () => {
    try {
      // เรียก API backend เพื่อสร้างและดาวน์โหลด PDF
      const response = await apiClient.get("/internship/summary/download", {
        responseType: "blob", // สำคัญ: ต้องเป็น blob เพื่อรับ PDF
        timeout: 30000, // 30 วินาที เพื่อให้เวลาสร้าง PDF
      });

      // สร้างชื่อไฟล์แบบไดนามิก
      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `บันทึกฝึกงาน-${currentDate}.pdf`;

      // สร้าง URL สำหรับดาวน์โหลด
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: `ดาวน์โหลดบันทึกฝึกงานเรียบร้อยแล้ว: ${filename}`,
        filename,
      };
    } catch (error) {
      console.error("Error downloading internship summary PDF:", error);

      // จัดการข้อผิดพลาดที่เฉพาะเจาะจง
      if (error.response?.status === 404) {
        throw new Error(
          "ไม่พบข้อมูลการฝึกงาน กรุณาตรวจสอบว่าได้บันทึกข้อมูลแล้ว"
        );
      } else if (error.response?.status === 400) {
        throw new Error("ยังไม่มีบันทึกการฝึกงาน กรุณาบันทึกข้อมูลก่อน");
      } else if (error.response?.status === 403) {
        throw new Error("ไม่มีสิทธิ์ในการดาวน์โหลดเอกสาร");
      } else if (error.name === "NetworkError") {
        throw new Error("ปัญหาการเชื่อมต่อเครือข่าย กรุณาลองใหม่อีกครั้ง");
      } else {
        throw new Error(
          error.response?.data?.message ||
            error.message ||
            "ไม่สามารถสร้างเอกสารบันทึกฝึกงานได้"
        );
      }
    }
  },

  /**
   * แสดงตัวอย่าง PDF ก่อนดาวน์โหลด (เวอร์ชัน Backend)
   */
  previewInternshipSummary: async () => {
    try {
      // เรียก API backend เพื่อแสดงตัวอย่าง PDF
      const response = await apiClient.get("/internship/summary/preview", {
        responseType: "blob",
        timeout: 30000,
      });

      // สร้าง blob URL สำหรับ preview
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = window.URL.createObjectURL(pdfBlob);

      // ทำความสะอาด URL หลังจาก 1 นาที
      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 60000);

      return {
        success: true,
        message: "เปิดตัวอย่างบันทึกฝึกงานในแท็บใหม่แล้ว",
      };
    } catch (error) {
      console.error("Error previewing internship summary:", error);
      throw new Error("ไม่สามารถแสดงตัวอย่างเอกสารได้");
    }
  },

  // ============= ส่วนการประเมินและบทสรุป =============
  /**
   * บันทึกบทสรุปการฝึกงาน
   */
  saveReflection: async (data) => {
    try {
      const response = await apiClient.post(
        "/internship/logbook/reflection",
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error saving reflection:", error);
      throw new Error(
        error.response?.data?.message || "ไม่สามารถบันทึกบทสรุปการฝึกงาน"
      );
    }
  },

  /**
   * ดึงบทสรุปการฝึกงาน
   */ getReflection: async () => {
    try {
      const response = await apiClient.get("/internship/logbook/reflection");
      return response.data;
    } catch (error) {
      console.error("Error getting reflection:", error);
      throw new Error(
        error.response?.data?.message || "ไม่สามารถดึงบทสรุปการฝึกงาน"
      );
    }
  },

  /**
   * ส่งแบบประเมินให้ผู้ควบคุมงาน
   */
  sendEvaluationForm: async (documentId) => {
    // Changed to accept internshipId
    try {
      const response = await apiClient.post(
        `/internship/request-evaluation/send/${documentId}`
      ); // New endpoint
      return response.data;
    } catch (error) {
      console.error("❌ Error sending evaluation form:", {
        documentId,
        error: error.response?.data || error.message,
        status: error.response?.status,
        url: error.config?.url,
      });

      // ส่งต่อข้อมูล error ที่มีรายละเอียดมากขึ้น
      const errorData = error.response?.data;
      const customError = new Error(
        errorData?.message || "ไม่สามารถส่งแบบประเมินไปยังผู้ควบคุมงานได้"
      );
      customError.type = errorData?.errorType || "UNKNOWN_ERROR";
      customError.status = error.response?.status;
      customError.originalError = errorData;

      throw customError;
    }
  },

  /**
   * ตรวจสอบสถานะการส่งแบบประเมินให้ผู้ควบคุมงาน
   */
  getEvaluationFormStatus: async () => {
    try {
      const response = await apiClient.get("/internship/evaluation/status");

      // ✅ เพิ่มการตรวจสอบและกำหนดค่าเริ่มต้นที่ถูกต้อง
      if (response.data.success) {
        return {
          ...response.data,
          data: {
            ...response.data.data,
            // ✅ ตั้งค่าเริ่มต้นที่เหมาะสม
            notificationEnabled:
              response.data.data.notificationEnabled !== false, // เปิดเป็นค่าเริ่มต้น
            canSendEvaluation: response.data.data.canSendEvaluation !== false,
          },
        };
      }

      return response.data;
    } catch (error) {
      console.error("Error getting evaluation form status:", error);

      // ✅ ปรับปรุงการจัดการ error - อย่าปิดการแจ้งเตือนทันที
      if (error.response?.status === 404) {
        // กรณีไม่พบข้อมูล - ให้สามารถส่งได้
        return {
          success: true,
          message: "ยังไม่มีการส่งแบบประเมิน",
          data: {
            hasEvaluation: false,
            evaluationStatus: "not_sent",
            isSent: false,
            isCompleted: false,
            notificationEnabled: true, // ✅ เปิดให้ส่งได้
            canSendEvaluation: true, // ✅ เปิดให้ส่งได้
            supervisorEmail: null,
            lastSentDate: null,
            error: false,
          },
        };
      }

      // กรณี error อื่นๆ ให้ลองส่งได้ แต่แสดงคำเตือน
      return {
        success: true,
        message: "ไม่สามารถตรวจสอบสถานะได้ชัดเจน",
        data: {
          hasEvaluation: false,
          evaluationStatus: "unknown",
          isSent: false,
          isCompleted: false,
          notificationEnabled: true, // ✅ เปิดให้ลองส่งได้
          canSendEvaluation: true, // ✅ เปิดให้ลองส่งได้
          supervisorEmail: null,
          lastSentDate: null,
          error: true,
          errorMessage: error.response?.data?.message || error.message,
        },
      };
    }
  },

  /**
   * ดึงข้อมูลแบบประเมินโดยใช้โทเค็น
   */
  getEvaluationFormByToken: async (token) => {
    try {
      if (!token) {
        throw new Error("ไม่พบโทเค็นสำหรับการประเมิน");
      }

      const response = await apiClient.get(
        `/internship/evaluation/form/${token}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting evaluation form by token:", error);
      throw new Error(
        error.response?.data?.message || "ไม่สามารถดึงข้อมูลแบบประเมิน"
      );
    }
  },

  /**
   * บันทึกผลการประเมินจากผู้ควบคุมงาน
   */
  submitSupervisorEvaluation: async (data) => {
    try {
      if (!data.token) {
        throw new Error("ไม่พบโทเค็นสำหรับการประเมิน");
      }

      const response = await apiClient.post(
        "/internship/evaluation/submit",
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error submitting supervisor evaluation:", error);
      throw new Error(
        error.response?.data?.message || "ไม่สามารถบันทึกผลการประเมิน"
      );
    }
  },

  // ============= ส่วนจัดการหนังสือรับรองการฝึกงาน =============
  /**
   * ตรวจสอบสถานะหนังสือรับรอง
   */
  getCertificateStatus: async () => {
    try {
      const response = await apiClient.get("/internship/certificate-status");

      // ถ้า success: true, data: null (ยังไม่ถึงขั้นตอน)
      if (response.data.success && !response.data.data) {
        return {
          success: true,
          data: null,
          message: response.data.message || "ยังไม่มีข้อมูลสถานะหนังสือรับรอง"
        };
      }

      // ถ้าสำเร็จและมีข้อมูล
      return response.data;
    } catch (error) {
      // ถ้า error 404 หรือ error message "ไม่พบข้อมูล" ให้ถือว่าเป็นปกติ
      if (
        error.response?.status === 404 ||
        (error.response?.data?.message &&
          (
            error.response.data.message.includes("ไม่พบข้อมูล") ||
            error.response.data.message.includes("ยังไม่มีข้อมูล") ||
            error.response.data.message.includes("ยังไม่ถึงขั้นตอน")
          )
        )
      ) {
        return {
          success: true,
          data: null,
          message: error.response?.data?.message || "ยังไม่มีข้อมูลสถานะหนังสือรับรอง"
        };
      }

      // error จริง
      console.error("Error getting certificate status:", error);
      throw new Error(
        error.response?.data?.message || "ไม่สามารถดึงข้อมูลสถานะหนังสือรับรอง"
      );
    }
  },

  /**
   * ส่งคำขอหนังสือรับรอง
   */
  submitCertificateRequest: async (requestData) => {
    try {
      const response = await apiClient.post(
        "/internship/certificate-request",
        requestData
      );
      return response.data;
    } catch (error) {
      console.error("Error submitting certificate request:", error);
      throw error;
    }
  },

  // ============= ส่วนจัดการหนังสือรับรองการฝึกงาน (Frontend PDF Generation) =============

  /**
   * ดาวน์โหลดหนังสือรับรอง (ใช้ Backend API)
   */
  downloadCertificate: async () => {
    try {
      console.log('[downloadCertificate] Starting download...');
      
      const response = await apiClient.get("/internship/certificate/download", {
        responseType: "blob", // สำคัญ: ต้องเป็น blob เพื่อรับ PDF
        timeout: 30000, // 30 วินาที เพื่อให้เวลาสร้าง PDF
      });

      // ตรวจสอบว่าได้รับ PDF จริงหรือไม่
      if (!response.data || response.data.size === 0) {
        throw new Error("ไม่ได้รับไฟล์ PDF จากเซิร์ฟเวอร์");
      }

      // ตรวจสอบ Content-Type
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('application/pdf')) {
        // อาจจะได้ HTML error page แทน PDF
        const text = await response.data.text();
        if (text.includes('<!DOCTYPE html>')) {
          throw new Error("เซิร์ฟเวอร์ส่งกลับหน้า HTML แทน PDF - อาจเป็นปัญหา route");
        }
        throw new Error("ไฟล์ที่ได้รับไม่ใช่ PDF");
      }

      // สร้างชื่อไฟล์แบบไดนามิก
      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `หนังสือรับรองการฝึกงาน-${currentDate}.pdf`;

      // สร้าง URL สำหรับดาวน์โหลด
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // ทำความสะอาด
      window.URL.revokeObjectURL(url);

      console.log('[downloadCertificate] Download completed successfully');

      return {
        success: true,
        message: `ดาวน์โหลดหนังสือรับรองเรียบร้อยแล้ว: ${filename}`,
        filename,
      };
    } catch (error) {
      console.error("Error downloading certificate:", error);

      // จัดการข้อผิดพลาดที่เฉพาะเจาะจง
      if (error.response?.status === 404) {
        throw new Error(
          "ไม่พบข้อมูลหนังสือรับรอง กรุณาตรวจสอบว่าได้ส่งคำขอแล้ว"
        );
      } else if (error.response?.status === 409) {
        throw new Error("หนังสือรับรองยังไม่พร้อม กรุณารอการดำเนินการจากเจ้าหน้าที่");
      } else if (error.response?.status === 403) {
        throw new Error("ไม่มีสิทธิ์ในการดาวน์โหลดหนังสือรับรอง");
      } else if (error.name === "NetworkError") {
        throw new Error("ปัญหาการเชื่อมต่อเครือข่าย กรุณาลองใหม่อีกครั้ง");
      } else {
        throw new Error(
          error.response?.data?.message ||
            error.message ||
            "ไม่สามารถดาวน์โหลดหนังสือรับรองได้"
        );
      }
    }
  },

  /**
   * ✅ แสดงตัวอย่างหนังสือรับรอง (ใช้ Backend API)
   */
  previewCertificate: async () => {
    try {
      console.log('[previewCertificate] Starting preview...');
      
      const response = await apiClient.get("/internship/certificate/preview", {
        responseType: "blob",
        timeout: 30000,
      });

      // ตรวจสอบว่าได้รับ PDF จริงหรือไม่
      if (!response.data || response.data.size === 0) {
        throw new Error("ไม่ได้รับไฟล์ PDF จากเซิร์ฟเวอร์");
      }

      // ตรวจสอบ Content-Type
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error("ไฟล์ที่ได้รับไม่ใช่ PDF");
      }

      // สร้าง blob URL สำหรับ preview
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = window.URL.createObjectURL(pdfBlob);

      // ทำความสะอาด URL หลังจาก 1 นาที
      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 60000);

      console.log('[previewCertificate] Preview opened successfully');

      return {
        success: true,
        message: "เปิดตัวอย่างหนังสือรับรองในแท็บใหม่แล้ว",
      };
    } catch (error) {
      console.error("Error previewing certificate:", error);
      
      // จัดการ Error แบบเจาะจง
      if (error.response?.status === 404) {
        throw new Error("ไม่พบข้อมูลหนังสือรับรอง กรุณาตรวจสอบว่าได้ส่งคำขอแล้ว");
      } else if (error.response?.status === 409) {
        throw new Error("หนังสือรับรองยังไม่พร้อม กรุณารอการดำเนินการจากเจ้าหน้าที่");
      } else if (error.response?.status === 403) {
        throw new Error("ไม่มีสิทธิ์ในการแสดงตัวอย่างหนังสือรับรอง");
      } else if (error.name === "NetworkError") {
        throw new Error("ปัญหาการเชื่อมต่อเครือข่าย กรุณาลองใหม่อีกครั้ง");
      } else {
        throw new Error(
          error.message || "ไม่สามารถแสดงตัวอย่างหนังสือรับรองได้"
        );
      }
    }
  },

  // ============= ส่วนจัดการเอกสารอื่นๆ =============
  /**
   * โหลดเอกสารการฝึกงาน
   */
  getInternshipDocuments: async (cs05Id) => {
    try {
      const response = await apiClient.get(`/internship/documents/${cs05Id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "ไม่สามารถโหลดเอกสารได้",
      };
    }
  },

  /**
   * ดาวน์โหลดเอกสาร
   */
  downloadDocument: async (cs05Id, documentType) => {
    try {
      const response = await apiClient.get(
        `/internship/documents/${cs05Id}/download/${documentType}`,
        {
          responseType: "blob",
        }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "ไม่สามารถดาวน์โหลดเอกสารได้",
      };
    }
  },

  /**
   * อัปโหลดเอกสาร
   */
  uploadDocument: async (cs05Id, documentType, file) => {
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("documentType", documentType);

      const response = await apiClient.post(
        `/internship/documents/${cs05Id}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "ไม่สามารถอัปโหลดเอกสารได้",
      };
    }
  },

  /**
   * แจ้งระบบว่าได้ดาวน์โหลดหนังสือรับรองแล้ว
   */
  /* markCertificateDownloaded: async () => {
    try {
      const response = await apiClient.patch('/internship/certificate/mark-downloaded');
      
      if (response.data.success) {
        return {
          success: true,
          message: 'อัปเดตสถานะการดาวน์โหลดสำเร็จ'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'ไม่สามารถอัปเดตสถานะได้'
        };
      }
    } catch (error) {
      console.error('Error marking certificate downloaded:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ'
      };
    }
  }, */

  /**
   * ดึงข้อมูลโปรไฟล์นักศึกษาสำหรับการฝึกงาน (alias ของ getStudentInfo)
   */
  getStudentProfile: async () => {
    return await internshipService.getStudentInfo();
  },
};

export default internshipService;
