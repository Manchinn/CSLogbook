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
      // กรณียังไม่มีข้อมูล คพ.05 (404 Not Found) - ไม่ถือเป็น error
      if (error.response?.status === 404) {
        console.info('ไม่พบข้อมูล CS05 (นักศึกษายังไม่ได้กรอกข้อมูล)');
        return { 
          success: true, 
          data: null,
          message: 'กรุณากรอกข้อมูลฝึกงาน'
        };
      }

      // บันทึก error จริงๆ สำหรับกรณีอื่นๆ
      console.error('Get Current CS05 Error:', error);
      console.error('Error details:', error.response?.data || error.message);

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
 * บันทึกคำร้องขอฝึกงาน (คพ.05) พร้อม transcript
 */
  submitCS05WithTranscript: async (formData) => {
    try {
      const response = await apiClient.post('/internship/cs-05/submit-with-transcript', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('ไม่มีสิทธิ์ในการสร้างคำร้อง');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'ข้อมูลไม่ถูกต้อง');
      } else {
        throw new Error('เกิดข้อผิดพลาดในการส่งข้อมูล');
      }
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

  // === ส่วนจัดการสมุดบันทึกการฝึกงาน ===

  /**
   * ดึงข้อมูลบันทึกการฝึกงานทั้งหมด
   */
  getTimeSheetEntries: async () => {
    try {
      const response = await apiClient.get('/internship/logbook/timesheet');

      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลบันทึกการฝึกงานได้');
      }

      // ตรวจสอบและจัดการรูปแบบข้อมูลที่หลากหลาย
      let entries = [];
      
      if (Array.isArray(response.data)) {
        entries = response.data;
      } else if (response.data && response.data.data) {
        if (Array.isArray(response.data.data)) {
          entries = response.data.data;
        } else if (typeof response.data.data === 'object') {
          // กรณีข้อมูลเป็น object แต่ไม่ใช่ array
          entries = [response.data.data];
        }
      }
      
      return {
        success: true,
        data: entries
      };
    } catch (error) {
      console.error('Error fetching timesheet entries:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลการฝึกงาน');
    }
  },

  /**
   * บันทึกข้อมูลการฝึกงานประจำวัน
   */
  saveTimeSheetEntry: async (entryData) => {
    try {
      const response = await apiClient.post('/internship/logbook/timesheet', entryData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถบันทึกข้อมูลการฝึกงานได้');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error saving timesheet entry:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลการฝึกงาน');
    }
  },

  /**
   * อัพเดทข้อมูลการฝึกงานประจำวัน
   */
  updateTimeSheetEntry: async (entryId, entryData) => {
    try {
      const response = await apiClient.put(`/internship/logbook/timesheet/${entryId}`, entryData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถอัพเดทข้อมูลการฝึกงานได้');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error updating timesheet entry:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถอัพเดทข้อมูลการฝึกงาน');
    }
  },

  /**
 * บันทึกเวลาเข้างาน
 */
  checkIn: async (workDate, timeIn) => {
    try {
      const response = await apiClient.post('/internship/logbook/check-in', {
        workDate,
        timeIn
      });
      return response.data.data;
    } catch (error) {
      console.error('Error checking in:', error);
      throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกเวลาเข้างาน');
    }
  },

  /**
   * บันทึกเวลาออกงานและรายละเอียด
   */
  checkOut: async (logData) => {
    try {
      const response = await apiClient.post('/internship/logbook/check-out', logData);
      return response.data.data;
    } catch (error) {
      console.error('Error checking out:', error);
      throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกเวลาออกงาน');
    }
  },

  /**
   * ดึงข้อมูลสถิติการฝึกงาน
   */
  getTimeSheetStats: async () => {
    try {
      const response = await apiClient.get('/internship/logbook/timesheet/stats');

      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลสถิติการฝึกงานได้');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching timesheet stats:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลสถิติการฝึกงาน');
    }
  },

  // เพิ่มฟังก์ชันใหม่ ดึงวันที่ฝึกงานจาก CS05
  getInternshipDateRange: async () => {
    try {
      const response = await apiClient.get('/internship/logbook/cs05/date-range');

      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลวันที่ฝึกงานได้');
      }

      return response.data.data; // จะได้ { startDate: '2025-XX-XX', endDate: '2025-XX-XX' }
    } catch (error) {
      console.error('Error fetching internship date range:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลวันที่ฝึกงาน');
    }
  },

  // ฟังก์ชันสร้างรายการวันที่ฝึกงานทั้งหมด (ไม่รวมวันหยุด)
  generateInternshipDates: async () => {
    try {
      const response = await apiClient.get('/internship/logbook/workdays');
      console.log('API Response from workdays (raw):', response);

      // ตรวจสอบการตอบกลับ
      if (!response.data.success) {
        console.warn('API แจ้งว่าไม่สำเร็จ:', response.data.message);
        throw new Error(response.data.message || 'ไม่สามารถสร้างรายการวันที่ฝึกงานได้');
      }

      // ตรวจสอบโครงสร้างข้อมูล
      const workdays = response.data.data;
      
      // ตรวจสอบความถูกต้องของข้อมูล
      if (!workdays || !Array.isArray(workdays)) {
        console.warn('API ส่งข้อมูลในรูปแบบที่ไม่ใช่ array:', workdays);
        return []; // ส่งคืน array ว่าง
      }

      console.log('พบข้อมูลวันทำงาน:', workdays.length, 'วัน');
      return workdays; // ส่งคืน array ของวันที่
    } catch (error) {
      console.error('Error generating internship dates:', error);
      throw error;
    }
  },

  // === ส่วนสรุปข้อมูลการฝึกงาน ===
  /**
   * ดึงข้อมูลสรุปการฝึกงาน
   */
  getInternshipSummary: async () => {
    try {
      const response = await apiClient.get('/internship/summary');

      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลสรุปการฝึกงานได้');
      }

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching internship summary:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลสรุปการฝึกงาน');
    }
  },
  /**
   * ดาวน์โหลดเอกสารสรุปการฝึกงาน PDF
   */
  downloadInternshipSummary: async () => {
    try {
      const response = await apiClient.get('/internship/summary/download', {
        responseType: 'blob'
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error downloading internship summary PDF:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถดาวน์โหลดเอกสารสรุปการฝึกงาน');
    }
  },
  
  /**
   * บันทึกบทสรุปการฝึกงาน
   */
  saveReflection: async (data) => {
    try {
      const response = await apiClient.post('/internship/logbook/reflection', data);
      return response.data;
    } catch (error) {
      console.error('Error saving reflection:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถบันทึกบทสรุปการฝึกงาน');
    }
  },
  
  /**
   * ดึงบทสรุปการฝึกงาน
   */  getReflection: async () => {
    try {
      const response = await apiClient.get('/internship/logbook/reflection');
      return response.data;
    } catch (error) {
      console.error('Error getting reflection:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถดึงบทสรุปการฝึกงาน');
    }
  },
  
  /**
   * ส่งแบบประเมินให้พี่เลี้ยง
   */
  sendEvaluationForm: async (data) => {
    try {
      if (!data.supervisorEmail) {
        throw new Error('กรุณาระบุอีเมลของพี่เลี้ยง');
      }
      
      const response = await apiClient.post('/internship/evaluation/send', data);
      return response.data;
    } catch (error) {
      console.error('Error sending evaluation form:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถส่งแบบประเมินไปยังพี่เลี้ยง');
    }
  },
  
  /**
   * ตรวจสอบสถานะการส่งแบบประเมินให้พี่เลี้ยง
   */  getEvaluationFormStatus: async () => {
    try {
      const response = await apiClient.get('/internship/evaluation/status');
      return response.data;
    } catch (error) {
      console.error('Error getting evaluation form status:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถตรวจสอบสถานะการส่งแบบประเมิน');
    }
  },
  
  /**
   * ดึงข้อมูลแบบประเมินโดยใช้โทเค็น
   */
  getEvaluationFormByToken: async (token) => {
    try {
      if (!token) {
        throw new Error('ไม่พบโทเค็นสำหรับการประเมิน');
      }
      
      const response = await apiClient.get(`/internship/evaluation/form/${token}`);
      return response.data;
    } catch (error) {
      console.error('Error getting evaluation form by token:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถดึงข้อมูลแบบประเมิน');
    }
  },
  
  /**
   * บันทึกผลการประเมินจากพี่เลี้ยง
   */
  submitSupervisorEvaluation: async (data) => {
    try {
      if (!data.token) {
        throw new Error('ไม่พบโทเค็นสำหรับการประเมิน');
      }
      
      const response = await apiClient.post('/internship/evaluation/submit', data);
      return response.data;
    } catch (error) {
      console.error('Error submitting supervisor evaluation:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถบันทึกผลการประเมิน');
    }
  },

};

export default internshipService;