import apiClient from './apiClient';

const internshipService = {
  // ============= ส่วนจัดการข้อมูลนักศึกษา =============
  /**
   * ดึงข้อมูลและสิทธิ์การฝึกงานของนักศึกษา
   */
  getStudentInfo: async () => {
    try {
      const response = await apiClient.get('/internship/student/info');

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return {
        success: true,
        student: response.data.student
      };

    } catch (error) {
      throw new Error('ไม่สามารถดึงข้อมูลนักศึกษาได้');
    }
  },

  // ============= ส่วนจัดการแบบฟอร์ม คพ.05 =============
  /**
   * บันทึกคำร้องขอฝึกงาน (คพ.05)
   */
  submitCS05: async (formData) => {
    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!formData.companyName || !formData.companyAddress || !formData.startDate || !formData.endDate) {
        throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
      }

      const response = await apiClient.post('/internship/cs-05/submit', {
        documentType: 'internship',
        documentName: 'CS05',
        category: 'proposal',
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        startDate: formData.startDate,
        endDate: formData.endDate
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('ไม่มีสิทธิ์ส่งคำร้อง');
      }
      throw new Error(error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  },

  /**
   * ดึงข้อมูล คพ.05 ปัจจุบัน
   */
  getCurrentCS05: async () => {
    try {
      const response = await apiClient.get('/internship/current-cs05');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูล CS05');
      }

      return response.data;
    } catch (error) {
      console.error('Get Current CS05 Error:', error);
      if (error.response?.status === 404) {
        return { success: true, data: null }; // ส่งค่าว่างถ้าไม่พบข้อมูล
      }
      throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล CS05');
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
            email: response.data.supervisorEmail
          }
        }
      };
    } catch (error) {
      throw new Error('ไม่สามารถดึงข้อมูลแบบฟอร์ม คพ.05 ได้');
    }
  },

  /**
   * บันทึกข้อมูลผู้ควบคุมงาน
   */
  submitCompanyInfo: async (companyInfo) => {
    try {
      const { documentId, ...data } = companyInfo;
      
      // ตรวจสอบเฉพาะข้อมูลผู้ควบคุมงาน
      if (!data.supervisorName?.trim() || 
          !data.supervisorPhone?.trim() || 
          !data.supervisorEmail?.trim()) {
        throw new Error('กรุณากรอกข้อมูลผู้ควบคุมงานให้ครบถ้วน');
      }
      
      // Validate เบอร์โทรและอีเมล
      const phoneRegex = /^[0-9]{9,10}$/;
      if (!phoneRegex.test(data.supervisorPhone)) {
        throw new Error('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.supervisorEmail)) {
        throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
      }      

      // ส่งเฉพาะข้อมูลผู้ควบคุมงาน
      const supervisorData = {
        supervisorName: data.supervisorName.trim(),
        supervisorPhone: data.supervisorPhone.trim(),
        supervisorEmail: data.supervisorEmail.trim()
      };

      const endpoint = documentId 
        ? `/internship/company-info?documentId=${documentId}`
        : '/internship/company-info';

      const response = await apiClient.post(endpoint, supervisorData);
      return response.data;
    } catch (error) {
      console.error('Company Info Error:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลผู้ควบคุมงาน');
    }
  },

  // ============= ส่วนที่ยังไม่ได้ใช้งาน (รอการพัฒนา) =============
  /**
   * ดึงรายการ คพ.05 ทั้งหมด
   */
  getCS05List: async () => {
    try {
      const response = await apiClient.get('/internship/cs-05/list');
      return response.data;
    } catch (error) {
      throw new Error('ไม่สามารถดึงรายการแบบฟอร์ม คพ.05 ได้');
    }
  },

  /**
   * อัพเดทข้อมูลผู้ควบคุมงาน
   */
  updateCS05Supervisor: async (documentId, supervisorInfo) => {
    try {
      const response = await apiClient.patch(`/internship/cs-05/${documentId}/supervisor`, {
        supervisorName: supervisorInfo.name,
        supervisorPosition: supervisorInfo.position,
        supervisorPhone: supervisorInfo.phone,
        supervisorEmail: supervisorInfo.email
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'ไม่สามารถอัพเดทข้อมูลผู้นิเทศงาน');
    }
  },

  /* // === ส่วนจัดการสมุดบันทึกการฝึกงาน ===
  submitDailyRecord: async (record) => {
    // TODO: Implement daily record submission
  },

  getLogbookEntries: async () => {
    // TODO: Implement getting logbook entries
  },

  // === ส่วนจัดการข้อมูลสรุปการฝึกงาน ===
  getInternshipSummary: async (studentId) => {
    // TODO: Implement getting internship summary
  },

  // === ส่วนจัดการข้อมูลสถานประกอบการ ===
  getCompanyInfo: async () => {
    // TODO: Implement getting company info
  } */
};

export default internshipService;