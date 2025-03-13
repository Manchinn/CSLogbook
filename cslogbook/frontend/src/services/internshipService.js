import apiClient from './apiClient';

const internshipService = {
  // ดึงข้อมูลนักศึกษา
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

  // ปรับปรุง submitCS05
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

  // เพิ่ม method สำหรับอัพเดทข้อมูล supervisor
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

  // แก้ไข getCS05ById ให้รวมข้อมูล supervisor
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

  // ดึงรายการ CS05 ทั้งหมด
  getCS05List: async () => {
    try {
      const response = await apiClient.get('/internship/cs-05/list');
      return response.data;
    } catch (error) {
      throw new Error('ไม่สามารถดึงรายการแบบฟอร์ม คพ.05 ได้');
    }
  },

  // บันทึก Logbook
  submitDailyRecord: async (record) => {
    try {
      const response = await apiClient.post('/internship/logbook/entry', record);
      return response.data;
    } catch (error) {
      throw new Error('ไม่สามารถบันทึกข้อมูลได้');
    }
  },

  // ดึงข้อมูล Logbook
  getLogbookEntries: async () => {
    try {
      const response = await apiClient.get('/internship/logbook');
      return response.data;
    } catch (error) {
      throw new Error('ไม่สามารถดึงข้อมูลบันทึกประจำวันได้');
    }
  },

  // Get summary
  getInternshipSummary: async (studentId) => {
    try {
      const response = await apiClient.get(`/summary/${studentId}`);
      return response.data;
    } catch (error) {
      throw new Error('ไม่สามารถดึงข้อมูลสรุปการฝึกงานได้');
    }
  },
};

export default internshipService;