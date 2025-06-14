import { formatThaiDate } from '../components/internship/templates/styles/commonStyles';

class TemplateDataService {
  /**
   * เตรียมข้อมูลสำหรับ CS05 Template
   * @param {Object} formData - ข้อมูลจากฟอร์ม
   * @param {Object} options - ตัวเลือกเพิ่มเติม
   */
  prepareCS05Data(formData, options = {}) {
    const defaultOptions = {
      showWatermark: true,
      status: 'draft',
      ...options
    };

    return {
      // ข้อมูลเอกสาร
      documentId: formData.documentId || 'DRAFT',
      status: defaultOptions.status,
      createdDate: formData.createdDate || new Date().toISOString(),
      
      // ข้อมูลนักศึกษา
      studentData: this._prepareStudentData(formData.studentData),
      hasTwoStudents: formData.studentData?.length === 2,
      
      // ข้อมูลบริษัท
      companyName: this._safeString(formData.companyName),
      companyAddress: this._safeString(formData.companyAddress),
      internshipPosition: this._safeString(formData.internshipPosition),
      contactPersonName: this._safeString(formData.contactPersonName),
      contactPersonPosition: this._safeString(formData.contactPersonPosition),
      
      // ข้อมูลระยะเวลา
      startDate: formData.startDate,
      endDate: formData.endDate,
      internshipDuration: this._calculateDuration(formData.startDate, formData.endDate),
      
      // ข้อมูลเพิ่มเติม
      jobDescription: this._safeString(formData.jobDescription),
      additionalRequirements: this._safeString(formData.additionalRequirements),
      advisorName: this._safeString(formData.advisorName),
      
      // ตัวเลือก
      showWatermark: defaultOptions.showWatermark
    };
  }

  /**
   * เตรียมข้อมูลสำหรับ Official Letter Template
   * @param {Object} letterData - ข้อมูลหนังสือ
   */
  prepareOfficialLetterData(letterData) {
    return {
      // ข้อมูลเอกสาร
      documentNumber: this._generateDocumentNumber(letterData.documentNumber),
      documentDate: letterData.documentDate || new Date().toISOString(),
      
      // ข้อมูลผู้รับ
      companyName: this._safeString(letterData.companyName),
      contactPersonName: this._safeString(letterData.contactPersonName),
      contactPersonPosition: this._safeString(letterData.contactPersonPosition),
      
      // ข้อมูลนักศึกษา
      studentData: this._prepareStudentData(letterData.studentData),
      
      // ข้อมูลระยะเวลา
      startDate: letterData.startDate,
      endDate: letterData.endDate,
      internshipDuration: this._calculateDuration(letterData.startDate, letterData.endDate),
      
      // ข้อมูลอาจารย์
      advisorName: this._safeString(letterData.advisorName),
      
      // ข้อมูลเพิ่มเติม
      internshipPosition: this._safeString(letterData.internshipPosition)
    };
  }

  /**
   * เตรียมข้อมูลสำหรับ Company Info Template
   * @param {Object} companyData - ข้อมูลบริษัท
   */
  prepareCompanyInfoData(companyData) {
    return {
      // ข้อมูลเอกสาร
      documentId: companyData.documentId,
      createdDate: companyData.createdDate || new Date().toISOString(),
      
      // สถานะ CS05
      cs05Status: companyData.cs05Status || 'unknown',
      
      // ข้อมูลบริษัท
      companyName: this._safeString(companyData.companyName),
      companyAddress: this._safeString(companyData.companyAddress),
      internshipPosition: this._safeString(companyData.internshipPosition),
      contactPersonName: this._safeString(companyData.contactPersonName),
      contactPersonPosition: this._safeString(companyData.contactPersonPosition),
      
      // ข้อมูลผู้ควบคุมงาน
      supervisorName: this._safeString(companyData.supervisorName),
      supervisorPosition: this._safeString(companyData.supervisorPosition),
      supervisorPhone: this._safeString(companyData.supervisorPhone),
      supervisorEmail: this._safeString(companyData.supervisorEmail),
      
      // ข้อมูลระยะเวลา
      startDate: companyData.startDate,
      endDate: companyData.endDate,
      internshipDuration: this._calculateDuration(companyData.startDate, companyData.endDate),
      
      // ข้อมูลการดำเนินงาน
      cs05SubmissionDate: companyData.cs05SubmissionDate,
      cs05ApprovalDate: companyData.cs05ApprovalDate,
      companyInfoSubmissionDate: companyData.companyInfoSubmissionDate,
      internshipStarted: companyData.internshipStarted || false,
      
      // ข้อมูลนักศึกษา
      studentId: companyData.studentId
    };
  }

  /**
   * เตรียมข้อมูลนักศึกษา
   * @param {Array} studentData - ข้อมูลนักศึกษา
   */
  _prepareStudentData(studentData) {
    if (!Array.isArray(studentData)) {
      return [];
    }

    return studentData.map(student => ({
      fullName: this._safeString(student.fullName),
      studentId: this._safeString(student.studentId),
      yearLevel: student.yearLevel || '',
      classroom: this._safeString(student.classroom),
      phoneNumber: this._safeString(student.phoneNumber),
      totalCredits: student.totalCredits || 0
    }));
  }

  /**
   * ทำให้ string ปลอดภัย
   * @param {any} value - ค่าที่ต้องการแปลง
   * @param {string} defaultValue - ค่าเริ่มต้น
   */
  _safeString(value, defaultValue = '') {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    return String(value).trim();
  }

  /**
   * คำนวณระยะเวลาฝึกงาน
   * @param {string} startDate - วันเริ่มต้น
   * @param {string} endDate - วันสิ้นสุด
   */
  _calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) {
      return '';
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // รวมวันเริ่มต้น

      return `${diffDays}`;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return '';
    }
  }

  /**
   * สร้างหมายเลขเอกสาร
   * @param {string} existingNumber - หมายเลขที่มีอยู่
   */
  _generateDocumentNumber(existingNumber) {
    if (existingNumber) {
      return existingNumber;
    }

    const year = new Date().getFullYear() + 543; // พ.ศ.
    const timestamp = Date.now().toString().slice(-6); // 6 หลักท้าย
    
    return `ศธ ๐๕๒๑.๒(๓)/${timestamp}/${year}`;
  }

  /**
   * ตรวจสอบความครบถ้วนของข้อมูล
   * @param {Object} data - ข้อมูลที่ต้องตรวจสอบ
   * @param {Array} requiredFields - ฟิลด์ที่จำเป็น
   */
  validateRequiredFields(data, requiredFields) {
    const missing = [];

    requiredFields.forEach(field => {
      const value = this._getNestedValue(data, field);
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      throw new Error(`ข้อมูลไม่ครบถ้วน: ${missing.join(', ')}`);
    }

    return true;
  }

  /**
   * ดึงค่าจาก nested object
   * @param {Object} obj - object ต้นทาง
   * @param {string} path - path ของข้อมูล (เช่น 'studentData.0.fullName')
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * จัดรูปแบบข้อมูลวันที่
   * @param {string} dateString - วันที่ในรูปแบบ string
   */
  formatDate(dateString) {
    return formatThaiDate(dateString);
  }

  /**
   * สร้างข้อมูลสำหรับ Timeline
   * @param {Object} data - ข้อมูลต้นฉบับ
   */
  createTimelineData(data) {
    const steps = [
      {
        title: 'ส่งแบบฟอร์ม CS05',
        desc: 'นักศึกษาส่งคำร้องขอฝึกงาน',
        status: data.cs05Status ? 'completed' : 'waiting',
        date: data.cs05SubmissionDate
      },
      {
        title: 'การอนุมัติ CS05',
        desc: 'อาจารย์พิจารณาและอนุมัติคำร้อง',
        status: data.cs05Status === 'approved' ? 'completed' : 
                data.cs05Status === 'pending' ? 'pending' : 'waiting',
        date: data.cs05ApprovalDate
      },
      {
        title: 'กรอกข้อมูลสถานประกอบการ',
        desc: 'กรอกข้อมูลผู้ควบคุมงานและรายละเอียดเพิ่มเติม',
        status: data.supervisorName ? 'completed' : 'waiting',
        date: data.companyInfoSubmissionDate
      },
      {
        title: 'เริ่มฝึกงาน',
        desc: 'เริ่มการฝึกงานตามระยะเวลาที่กำหนด',
        status: data.internshipStarted ? 'completed' : 'waiting',
        date: data.startDate
      }
    ];

    return steps;
  }
}

export default new TemplateDataService();