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
 * อัปโหลดไฟล์ใบแสดงผลการเรียน (Transcript)
 */
  uploadTranscript: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'INTERNSHIP');
      formData.append('category', 'transcript');

      const response = await apiClient.post('/internship/upload-transcript', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถอัปโหลดไฟล์ได้');
      }

      return response.data;
    } catch (error) {
      console.error('Upload Transcript Error:', error);
      throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
    }
  },

  /**
   * บันทึกข้อมูลผู้ควบคุมงาน
   */
  submitCompanyInfo: async (companyInfo) => {
    try {
      const { documentId, ...data } = companyInfo;

      // เพิ่ม debug log
      console.log('Sending data:', {
        documentId,
        supervisorName: data.supervisorName?.trim(),
        supervisorPhone: data.supervisorPhone?.trim(),
        supervisorEmail: data.supervisorEmail?.trim()
      });

      if (!documentId) {
        throw new Error('ไม่พบข้อมูลเอกสาร CS05');
      }

      const response = await apiClient.post('/internship/company-info', {
        documentId,
        supervisorName: data.supervisorName.trim(),
        supervisorPhone: data.supervisorPhone.trim(),
        supervisorEmail: data.supervisorEmail.trim()
      });

      // เพิ่ม debug log
      console.log('Response:', response.data);

      return response.data;
    } catch (error) {
      console.error('Request details:', {
        url: '/internship/company-info',
        data: companyInfo,
        error: error.response?.data
      });
      throw new Error(error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลผู้ควบคุมงาน');
    }
  },

  /**
   * ดึงข้อมูลผู้ควบคุมงาน
   */
  getCompanyInfo: async (documentId) => {
    try {
      console.log('Fetching company info with documentId:', documentId);

      const response = await apiClient.get(`/internship/company-info/${documentId}`);
      console.log('Raw API Response:', response.data);

      // เพิ่มการตรวจสอบข้อมูล
      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลผู้ควบคุมงาน');
      }

      // ตรวจสอบว่ามีข้อมูลจริงหรือไม่
      if (!response.data.data?.supervisorName) {
        return {
          success: true,
          data: null
        };
      }

      return response.data;
    } catch (error) {
      console.error('Get Company Info Error:', error);
      throw error;
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