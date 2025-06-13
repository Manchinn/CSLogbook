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

      // เพิ่มการตรวจสอบและมีค่าเริ่มต้นสำหรับฟิลด์ classroom และ phoneNumber
      const studentData = response.data.student;
      if (studentData) {
        // กำหนดค่าเริ่มต้นถ้าไม่มีข้อมูล
        studentData.classroom = studentData.classroom || '';
        studentData.phoneNumber = studentData.phoneNumber || '';
      }

      return {
        success: true,
        student: studentData
      };

    } catch (error) {
      console.error('Error fetching student info:', error);
      throw new Error('ไม่สามารถดึงข้อมูลนักศึกษาได้');
    }
  },

  /**
   * อัพเดทข้อมูลติดต่อของนักศึกษา (เพิ่มฟังก์ชันใหม่)
   */
  updateStudentContactInfo: async (contactInfo) => {
    try {
      const { classroom, phoneNumber } = contactInfo;
      
      const response = await apiClient.patch('/students/contact-info', {
        classroom,
        phoneNumber
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถอัปเดตข้อมูลติดต่อได้');
      }

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error updating contact info:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลติดต่อได้'
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
        endDate: formData.endDate,
        // เพิ่มฟิลด์ใหม่
        internshipPosition: formData.internshipPosition || '',
        contactPersonName: formData.contactPersonName || '',
        contactPersonPosition: formData.contactPersonPosition || '',
        classroom: formData.classroom || null,
        phoneNumber: formData.phoneNumber || null,
        // ข้อมูลนักศึกษาเพิ่มเติม
        studentData: formData.studentData || []
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

      if (response.data.data) {
        response.data.data.internshipPosition = response.data.data.internshipPosition || '';
        response.data.data.contactPersonName = response.data.data.contactPersonName || '';
        response.data.data.contactPersonPosition = response.data.data.contactPersonPosition || '';
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
      // ถ้า formData เป็น FormData object
      if (formData instanceof FormData) {
        // ดึง JSON string จาก formData
        const formDataJson = formData.get('formData');
        if (formDataJson) {
          const formDataObj = JSON.parse(formDataJson);
          
          // เพิ่มข้อมูล classroom และ phoneNumber ถ้ามีในข้อมูลนักศึกษา
          if (formDataObj.studentData && formDataObj.studentData[0]) {
            formDataObj.classroom = formDataObj.studentData[0].classroom || null;
            formDataObj.phoneNumber = formDataObj.studentData[0].phoneNumber || null;
          }
          // เพิ่มการจัดการฟิลด์ใหม่ทั้ง 3 ฟิลด์
          formDataObj.internshipPosition = formDataObj.internshipPosition || '';
          formDataObj.contactPersonName = formDataObj.contactPersonName || '';
          formDataObj.contactPersonPosition = formDataObj.contactPersonPosition || '';
          
          // อัปเดต formData กลับไป
          formData.set('formData', JSON.stringify(formDataObj));
        }
      }

      const response = await apiClient.post('/internship/cs-05/submit-with-transcript', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // อัพเดทข้อมูลติดต่อหลังส่งคำร้องสำเร็จ
      if (response.data.success && response.data.data) {
        try {
          const formDataObj = formData instanceof FormData 
            ? JSON.parse(formData.get('formData')) 
            : formData;
          
          if (formDataObj.studentData && formDataObj.studentData[0]) {
            const { classroom, phoneNumber } = formDataObj.studentData[0];
            if (classroom || phoneNumber) {
              await internshipService.updateStudentContactInfo({
                classroom,
                phoneNumber
              });
            }
          }
        } catch (contactError) {
          console.warn('Failed to update contact info, but CS05 was submitted:', contactError);
        }
      }

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

  // === ส่วนจัดการข้อมูลสถานประกอบการและผู้ควบคุมงาน ===

  /**
   * ดึงข้อมูลสถานประกอบการและผู้ควบคุมงาน
   */
  getCompanyInfo: async (documentId) => {
    try {
      if (!documentId) {
        throw new Error('ไม่พบรหัสเอกสาร CS05');
      }

      const response = await apiClient.get(`/internship/company-info/${documentId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถดึงข้อมูลสถานประกอบการได้');
      }

      // จัดการข้อมูลให้มีค่าเริ่มต้นที่เหมาะสม
      const companyData = response.data.data || {};
      
      return {
        success: true,
        data: {
          companyName: companyData.companyName || '',
          companyAddress: companyData.companyAddress || '',
          supervisorName: companyData.supervisorName || '',
          supervisorPosition: companyData.supervisorPosition || '', // เพิ่มฟิลด์ตำแหน่ง
          supervisorPhone: companyData.supervisorPhone || '',
          supervisorEmail: companyData.supervisorEmail || '',
          internshipPosition: companyData.internshipPosition || '',
          contactPersonName: companyData.contactPersonName || '',
          contactPersonPosition: companyData.contactPersonPosition || ''
        }
      };
    } catch (error) {
      console.error('Error fetching company info:', error);
      
      // กรณียังไม่มีข้อมูล - ไม่ถือเป็น error
      if (error.response?.status === 404) {
        return {
          success: true,
          data: null,
          message: 'ยังไม่มีข้อมูลสถานประกอบการ'
        };
      }

      throw new Error(error.response?.data?.message || 'ไม่สามารถดึงข้อมูลสถานประกอบการได้');
    }
  },

  /**
   * บันทึกข้อมูลสถานประกอบการและผู้ควบคุมงาน
   */
  submitCompanyInfo: async (companyData) => {
    try {
      if (!companyData.documentId) {
        throw new Error('ไม่พบรหัสเอกสาร CS05');
      }

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!companyData.supervisorName || !companyData.supervisorPhone || !companyData.supervisorEmail) {
        throw new Error('กรุณากรอกข้อมูลผู้ควบคุมงานให้ครบถ้วน');
      }

      const submitData = {
        documentId: companyData.documentId,
        supervisorName: companyData.supervisorName.trim(),
        supervisorPosition: companyData.supervisorPosition?.trim() || '', // เพิ่มฟิลด์ตำแหน่ง
        supervisorPhone: companyData.supervisorPhone.trim(),
        supervisorEmail: companyData.supervisorEmail.trim()
      };

      const response = await apiClient.post('/internship/company-info/submit', submitData);

      if (!response.data.success) {
        throw new Error(response.data.message || 'ไม่สามารถบันทึกข้อมูลสถานประกอบการได้');
      }

      return {
        success: true,
        data: response.data.data,
        message: 'บันทึกข้อมูลสถานประกอบการเรียบร้อยแล้ว'
      };
    } catch (error) {
      console.error('Error submitting company info:', error);
      throw new Error(error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลสถานประกอบการได้');
    }
  },

  /**
   * อัพเดทข้อมูลผู้ควบคุมงาน (แก้ไขจากฟังก์ชันเดิม)
   */
  updateCS05Supervisor: async (documentId, supervisorInfo) => {
    try {
      const response = await apiClient.patch(`/internship/cs-05/${documentId}/supervisor`, {
        supervisorName: supervisorInfo.name,
        supervisorPosition: supervisorInfo.position || '', // เพิ่มฟิลด์ตำแหน่ง
        supervisorPhone: supervisorInfo.phone,
        supervisorEmail: supervisorInfo.email
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'ไม่สามารถอัพเดทข้อมูลผู้ควบคุมงาน');
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
  sendEvaluationForm: async (documentId) => { // Changed to accept internshipId
    try {
      const response = await apiClient.post(`/internship/request-evaluation/send/${documentId}`); // New endpoint
      return response.data;
    } catch (error) {
      console.error('❌ Error sending evaluation form:', {
        documentId,
        error: error.response?.data || error.message,
        status: error.response?.status,
        url: error.config?.url
      });
      
      // ส่งต่อข้อมูล error ที่มีรายละเอียดมากขึ้น
      const errorData = error.response?.data;
      const customError = new Error(errorData?.message || 'ไม่สามารถส่งแบบประเมินไปยังพี่เลี้ยงได้');
      customError.type = errorData?.errorType || 'UNKNOWN_ERROR';
      customError.status = error.response?.status;
      customError.originalError = errorData;
      
      throw customError;
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
      // ส่งค่า default กลับไปเพื่อไม่ให้ frontend พัง
      return {
        success: true,
        message: 'ไม่สามารถตรวจสอบสถานะการส่งแบบประเมิน แต่ดำเนินการต่อได้',
        data: {
          hasEvaluation: false,
          isSent: false,
          isCompleted: false,
          notificationEnabled: false, // เพิ่มค่าเริ่มต้น
          canSendEvaluation: false,   // เพิ่มค่าเริ่มต้น
          error: true
        }
      };
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

  // โหลดเอกสารการฝึกงาน
  getInternshipDocuments: async (cs05Id) => {
    try {
      const response = await apiClient.get(`/internship/documents/${cs05Id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถโหลดเอกสารได้'
      };
    }
  },

  // ดาวน์โหลดเอกสาร
  downloadDocument: async (cs05Id, documentType) => {
    try {
      const response = await apiClient.get(`/internship/documents/${cs05Id}/download/${documentType}`, {
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถดาวน์โหลดเอกสารได้'
      };
    }
  },

  // อัปโหลดเอกสาร
  uploadDocument: async (cs05Id, documentType, file) => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);

      const response = await apiClient.post(`/internship/documents/${cs05Id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'ไม่สามารถอัปโหลดเอกสารได้'
      };
    }
  }

};

export default internshipService;