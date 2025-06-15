import { formatThaiDate, calculateInternshipDays, formatDurationText } from '../../utils/dateUtils';
import { formatThaiPhoneNumber, formatFullName, cleanText, formatStudentId } from '../../utils/thaiFormatter';

class TemplateDataService {
  /**
   * เตรียมข้อมูลสำหรับ CS05 Template
   * @param {Object} formData - ข้อมูลจากฟอร์ม
   * @param {Object} options - ตัวเลือกเพิ่มเติม
   */
  prepareCS05Data(formData, options = {}) {
    try {
      const defaultOptions = {
        showWatermark: true,
        status: 'draft',
        ...options
      };

      // ตรวจสอบข้อมูลพื้นฐาน
      if (!formData) {
        throw new Error('ไม่มีข้อมูลสำหรับสร้าง PDF');
      }

      // เตรียมข้อมูลนักศึกษา
      const studentData = this._prepareStudentData(formData.studentData);
      
      // คำนวณระยะเวลาฝึกงาน
      const internshipDays = this._calculateDurationDays(formData.startDate, formData.endDate);
      const durationText = formatDurationText(formData.startDate, formData.endDate);

      return {
        // ข้อมูลเอกสาร
        documentId: formData.documentId || 'DRAFT',
        status: defaultOptions.status,
        createdDate: formData.createdDate || new Date().toISOString(),
        documentDate: formatThaiDate(new Date().toISOString(), 'DD MMMM BBBB'),
        
        // ข้อมูลนักศึกษา
        studentData: studentData,
        hasTwoStudents: Array.isArray(formData.studentData) && formData.studentData.length === 2,
        
        // ข้อมูลบริษัท
        companyName: cleanText(formData.companyName || ''),
        companyAddress: cleanText(formData.companyAddress || ''),
        internshipPosition: cleanText(formData.internshipPosition || ''),
        contactPersonName: cleanText(formData.contactPersonName || ''),
        contactPersonPosition: cleanText(formData.contactPersonPosition || ''),
        
        // ข้อมูลระยะเวลา (ใช้ utils ใหม่)
        startDate: formData.startDate,
        endDate: formData.endDate,
        startDateThai: formatThaiDate(formData.startDate, 'DD MMMM BBBB'),
        endDateThai: formatThaiDate(formData.endDate, 'DD MMMM BBBB'),
        internshipDays: internshipDays,
        internshipDuration: durationText,
        durationDisplay: `${internshipDays} วัน`,
        
        // ข้อมูลเพิ่มเติม
        jobDescription: cleanText(formData.jobDescription || ''),
        additionalRequirements: cleanText(formData.additionalRequirements || ''),
        
        // ข้อมูลมหาวิทยาลัย
        universityName: 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ',
        facultyName: 'คณะวิทยาศาสตร์ประยุกต์',
        departmentName: 'ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ',
        
        // ตัวเลือก
        showWatermark: defaultOptions.showWatermark,
        watermarkText: defaultOptions.status === 'draft' ? 'ร่าง' : 'อนุมัติแล้ว'
      };
    } catch (error) {
      console.error('Error preparing CS05 data:', error);
      throw new Error(`ไม่สามารถเตรียมข้อมูล CS05 ได้: ${error.message}`);
    }
  }

  /**
   * เตรียมข้อมูลสำหรับ Official Letter Template
   * @param {Object} letterData - ข้อมูลหนังสือ
   */
  prepareOfficialLetterData(letterData) {
    try {
      if (!letterData) {
        throw new Error('ไม่มีข้อมูลสำหรับสร้างหนังสือ');
      }

      // เตรียมข้อมูลนักศึกษา
      const studentData = this._prepareStudentData(letterData.studentData);
      
      // คำนวณระยะเวลาฝึกงาน
      const internshipDays = this._calculateDurationDays(letterData.startDate, letterData.endDate);

      return {
        // ข้อมูลเอกสาร
        documentNumber: this._generateDocumentNumber(letterData.documentNumber),
        documentDate: letterData.documentDate || new Date().toISOString(),
        documentDateThai: formatThaiDate(letterData.documentDate || new Date().toISOString(), 'DD MMMM BBBB'),
        
        // ข้อมูลผู้รับ - เพิ่มการตรวจสอบ defensive
        companyName: cleanText(letterData.companyName || ''),
        companyAddress: cleanText(letterData.companyAddress || ''),
        contactPersonName: cleanText(letterData.contactPersonName || ''),
        contactPersonPosition: cleanText(letterData.contactPersonPosition || ''),
        
        // ข้อมูลนักศึกษา
        studentData: studentData,
        hasTwoStudents: Array.isArray(studentData) && studentData.length === 2,
        
        // ข้อมูลระยะเวลา
        startDate: letterData.startDate,
        endDate: letterData.endDate,
        startDateThai: formatThaiDate(letterData.startDate, 'DD MMMM BBBB'),
        endDateThai: formatThaiDate(letterData.endDate, 'DD MMMM BBBB'),
        internshipDays: internshipDays,
        durationText: formatDurationText(letterData.startDate, letterData.endDate),
        
        // ข้อมูลอาจารย์
        advisorTitle: 'หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ',
        advisorName: 'รองศาสตราจารย์ ดร.ธนภัทร์ อนุศาสน์อมรกุล',
        
        // ข้อมูลเพิ่มเติม
        internshipPosition: cleanText(letterData.internshipPosition || ''),
        
        // ข้อมูลมหาวิทยาลัย
        universityName: 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ',
        facultyName: 'คณะวิทยาศาสตร์ประยุกต์',
        departmentName: 'ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ',
        address: '1518 ถ.ประชาราษฎร์ 1 เขตบางซื่อ กทม.10800',
        phone: '02-555-2000',
        website: 'http://www.cs.kmutnb.ac.th/'
      };
    } catch (error) {
      console.error('Error preparing Official Letter data:', error);
      throw new Error(`ไม่สามารถเตรียมข้อมูลหนังสือได้: ${error.message}`);
    }
  }

  /**
   * เตรียมข้อมูลสำหรับ Student Summary Template
   * @param {Object} summaryData - ข้อมูลสรุปนักศึกษา
   */
  prepareStudentSummaryData(summaryData) {
    try {
      if (!summaryData) {
        throw new Error('ไม่มีข้อมูลสำหรับสร้างสรุปนักศึกษา');
      }

      const studentData = this._prepareStudentData(summaryData.studentData);
      const timelineData = this.createTimelineData(summaryData);

      return {
        // ข้อมูลเอกสาร
        documentId: summaryData.documentId || 'SUMMARY',
        createdDate: summaryData.createdDate || new Date().toISOString(),
        createdDateThai: formatThaiDate(summaryData.createdDate || new Date().toISOString(), 'DD MMMM BBBB'),
        
        // ข้อมูลนักศึกษา
        studentData: studentData,
        hasTwoStudents: Array.isArray(studentData) && studentData.length === 2,
        
        // ข้อมูลบริษัท
        companyName: cleanText(summaryData.companyName || ''),
        companyAddress: cleanText(summaryData.companyAddress || ''),
        internshipPosition: cleanText(summaryData.internshipPosition || ''),
        
        // ข้อมูลระยะเวลา
        startDate: summaryData.startDate,
        endDate: summaryData.endDate,
        startDateThai: formatThaiDate(summaryData.startDate, 'DD MMMM BBBB'),
        endDateThai: formatThaiDate(summaryData.endDate, 'DD MMMM BBBB'),
        internshipDays: this._calculateDurationDays(summaryData.startDate, summaryData.endDate),
        durationText: formatDurationText(summaryData.startDate, summaryData.endDate),
        
        // ข้อมูล Timeline
        timeline: timelineData,
        completedSteps: timelineData.filter(step => step.status === 'completed').length,
        totalSteps: timelineData.length,
        progressPercentage: Math.round((timelineData.filter(step => step.status === 'completed').length / timelineData.length) * 100),
        
        // ข้อมูลมหาวิทยาลัย
        universityName: 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ',
        facultyName: 'คณะวิทยาศาสตร์ประยุกต์',
        departmentName: 'ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ'
      };
    } catch (error) {
      console.error('Error preparing Student Summary data:', error);
      throw new Error(`ไม่สามารถเตรียมข้อมูลสรุปนักศึกษาได้: ${error.message}`);
    }
  }

  /**
   * เตรียมข้อมูลสำหรับ Company Info Template
   * @param {Object} companyData - ข้อมูลบริษัท
   */
  prepareCompanyInfoData(companyData) {
    try {
      if (!companyData) {
        throw new Error('ไม่มีข้อมูลสำหรับสร้างข้อมูลบริษัท');
      }

      const timelineData = this.createTimelineData(companyData);

      return {
        // ข้อมูลเอกสาร
        documentId: companyData.documentId || 'COMPANY_INFO',
        createdDate: companyData.createdDate || new Date().toISOString(),
        createdDateThai: formatThaiDate(companyData.createdDate || new Date().toISOString(), 'DD MMMM BBBB'),
        
        // สถานะ CS05
        cs05Status: companyData.cs05Status || 'unknown',
        cs05StatusText: this._getStatusText(companyData.cs05Status),
        
        // ข้อมูลบริษัท
        companyName: cleanText(companyData.companyName || ''),
        companyAddress: cleanText(companyData.companyAddress || ''),
        internshipPosition: cleanText(companyData.internshipPosition || ''),
        contactPersonName: cleanText(companyData.contactPersonName || ''),
        contactPersonPosition: cleanText(companyData.contactPersonPosition || ''),
        
        // ข้อมูลผู้ควบคุมงาน (ใช้ utils ใหม่)
        supervisorName: cleanText(companyData.supervisorName || ''),
        supervisorPosition: cleanText(companyData.supervisorPosition || ''),
        supervisorPhone: formatThaiPhoneNumber(companyData.supervisorPhone || ''),
        supervisorEmail: cleanText(companyData.supervisorEmail || ''),
        
        // ข้อมูลระยะเวลา
        startDate: companyData.startDate,
        endDate: companyData.endDate,
        startDateThai: formatThaiDate(companyData.startDate, 'DD MMMM BBBB'),
        endDateThai: formatThaiDate(companyData.endDate, 'DD MMMM BBBB'),
        internshipDays: this._calculateDurationDays(companyData.startDate, companyData.endDate),
        durationText: formatDurationText(companyData.startDate, companyData.endDate),
        
        // ข้อมูลการดำเนินงาน
        cs05SubmissionDate: companyData.cs05SubmissionDate,
        cs05SubmissionDateThai: formatThaiDate(companyData.cs05SubmissionDate, 'DD MMMM BBBB'),
        cs05ApprovalDate: companyData.cs05ApprovalDate,
        cs05ApprovalDateThai: formatThaiDate(companyData.cs05ApprovalDate, 'DD MMMM BBBB'),
        companyInfoSubmissionDate: companyData.companyInfoSubmissionDate,
        companyInfoSubmissionDateThai: formatThaiDate(companyData.companyInfoSubmissionDate, 'DD MMMM BBBB'),
        internshipStarted: companyData.internshipStarted || false,
        
        // ข้อมูลนักศึกษา
        studentId: formatStudentId(companyData.studentId || ''),
        
        // ข้อมูล Timeline
        timeline: timelineData,
        completedSteps: timelineData.filter(step => step.status === 'completed').length,
        totalSteps: timelineData.length,
        progressPercentage: Math.round((timelineData.filter(step => step.status === 'completed').length / timelineData.length) * 100),
        
        // ข้อมูลมหาวิทยาลัย
        universityName: 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ',
        facultyName: 'คณะวิทยาศาสตร์ประยุกต์',
        departmentName: 'ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ'
      };
    } catch (error) {
      console.error('Error preparing Company Info data:', error);
      throw new Error(`ไม่สามารถเตรียมข้อมูลบริษัทได้: ${error.message}`);
    }
  }

  /**
   * เตรียมข้อมูลสำหรับแบบฟอร์มหนังสือตอบรับ
   * @param {Object} letterData - ข้อมูลหนังสือ
   */
  prepareAcceptanceFormData(letterData) {
    try {
      if (!letterData) {
        return {
          documentDate: new Date(),
          studentData: []
        };
      }

      return {
        // ข้อมูลเอกสาร
        documentNumber: letterData.documentNumber || '',
        documentDate: letterData.documentDate || new Date(),
        letterDate: letterData.documentDate || new Date(),

        // ข้อมูลบริษัท
        companyName: letterData.companyName || '',
        companyAddress: letterData.companyAddress || '',
        contactPhone: letterData.contactPhone || '',
        contactPersonPosition: letterData.contactPersonPosition || '',
        internshipPosition: letterData.internshipPosition || '',

        // ข้อมูลนักศึกษา
        studentData: letterData.studentData || [],

        // ข้อมูลระยะเวลา
        startDate: letterData.startDate || '',
        endDate: letterData.endDate || '',
        internshipDays: letterData.internshipDays || 0
      };
    } catch (error) {
      console.error('Error preparing acceptance form data:', error);
      return {
        documentDate: new Date(),
        studentData: []
      };
    }
  }

  /**
   * เตรียมข้อมูลนักศึกษา (แก้ไขเพื่อป้องกัน TypeError)
   * @param {Array} studentData - ข้อมูลนักศึกษา
   */
  _prepareStudentData(studentData) {
    if (!Array.isArray(studentData)) {
      return [];
    }

    return studentData.map((student, index) => {
      if (!student) {
        console.warn(`Student data at index ${index} is null or undefined`);
        return null;
      }

      return {
        // ใช้ || operator และ fallback values เพื่อป้องกัน undefined/null
        fullName: cleanText(student.fullName ?? ''),
        studentId: formatStudentId(student.studentId ?? ''),
        yearLevel: student.yearLevel ?? '',
        yearLevelText: student.yearLevel ? `ชั้นปีที่ ${student.yearLevel}` : '',
        classroom: cleanText(student.classroom ?? ''),
        phoneNumber: formatThaiPhoneNumber(student.phoneNumber ?? ''),
        totalCredits: student.totalCredits ?? 0,
        totalCreditsText: `${student.totalCredits ?? 0} หน่วยกิต`
      };
    }).filter(student => student !== null); // กรองข้อมูลที่ null ออก
  }

  /**
   * คำนวณระยะเวลาฝึกงานเป็นจำนวนวัน (ใช้ utils ใหม่)
   * @param {string} startDate - วันเริ่มต้น
   * @param {string} endDate - วันสิ้นสุด
   */
  _calculateDurationDays(startDate, endDate) {
    if (!startDate || !endDate) {
      return 0;
    }

    try {
      return calculateInternshipDays(startDate, endDate);
    } catch (error) {
      console.error('Error calculating duration days:', error);
      return 0;
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

    // สร้างเลข 3 หลักจากเวลาปัจจุบัน (ม็อด 1000 = 0-999)
    const threedigits = String(Date.now() % 1000).padStart(3, '0');
    
    // รูปแบบใหม่: อว 7105(05)/XXX
    return `อว 7105(05)/${threedigits}`;
  }

  /**
   * สร้างหมายเลขเอกสารใหม่ (public method)
   * @returns {string} - หมายเลขเอกสารที่สร้างขึ้น
   */
  generateNewDocumentNumber() {
    return this._generateDocumentNumber();
  }

  /**
   * แปลงสถานะเป็นข้อความ
   * @param {string} status - สถานะ
   */
  _getStatusText(status) {
    const statusMap = {
      'pending': 'รอการพิจารณา',
      'approved': 'อนุมัติแล้ว',
      'rejected': 'ไม่อนุมัติ',
      'draft': 'ร่าง'
    };
    
    return statusMap[status] || 'ไม่ทราบสถานะ';
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
   * จัดรูปแบบข้อมูลวันที่ (ใช้ utils ใหม่)
   * @param {string} dateString - วันที่ในรูปแบบ string
   * @param {string} format - รูปแบบที่ต้องการ
   */
  formatDate(dateString, format = 'DD MMMM BBBB') {
    return formatThaiDate(dateString, format);
  }

  /**
   * สร้างข้อมูลสำหรับ Timeline (ปรับปรุงใหม่)
   * @param {Object} data - ข้อมูลต้นฉบับ
   */
  createTimelineData(data) {
    const steps = [
      {
        title: 'ส่งแบบฟอร์ม CS05',
        desc: 'นักศึกษาส่งคำร้องขอฝึกงาน',
        status: data.cs05SubmissionDate ? 'completed' : 'waiting',
        date: data.cs05SubmissionDate,
        dateThai: formatThaiDate(data.cs05SubmissionDate, 'DD MMMM BBBB'),
        icon: '📝'
      },
      {
        title: 'การอนุมัติ CS05',
        desc: 'อาจารย์พิจารณาและอนุมัติคำร้อง',
        status: data.cs05Status === 'approved' ? 'completed' : 
                data.cs05Status === 'pending' ? 'pending' : 
                data.cs05Status === 'rejected' ? 'error' : 'waiting',
        date: data.cs05ApprovalDate,
        dateThai: formatThaiDate(data.cs05ApprovalDate, 'DD MMMM BBBB'),
        icon: data.cs05Status === 'approved' ? '✅' : 
              data.cs05Status === 'pending' ? '⏳' : 
              data.cs05Status === 'rejected' ? '❌' : '⚪'
      },
      {
        title: 'กรอกข้อมูลสถานประกอบการ',
        desc: 'กรอกข้อมูลผู้ควบคุมงานและรายละเอียดเพิ่มเติม',
        status: data.supervisorName && data.supervisorPhone && data.supervisorEmail ? 'completed' : 'waiting',
        date: data.companyInfoSubmissionDate,
        dateThai: formatThaiDate(data.companyInfoSubmissionDate, 'DD MMMM BBBB'),
        icon: data.supervisorName ? '🏢' : '⚪'
      },
      {
        title: 'เริ่มฝึกงาน',
        desc: 'เริ่มการฝึกงานตามระยะเวลาที่กำหนด',
        status: data.internshipStarted ? 'completed' : 
                (data.startDate && new Date(data.startDate) <= new Date()) ? 'pending' : 'waiting',
        date: data.startDate,
        dateThai: formatThaiDate(data.startDate, 'DD MMMM BBBB'),
        icon: data.internshipStarted ? '🎯' : '⚪'
      },
      {
        title: 'สิ้นสุดการฝึกงาน',
        desc: 'เสร็จสิ้นการฝึกงานตามระยะเวลาที่กำหนด',
        status: (data.endDate && new Date(data.endDate) < new Date()) ? 'completed' : 'waiting',
        date: data.endDate,
        dateThai: formatThaiDate(data.endDate, 'DD MMMM BBBB'),
        icon: (data.endDate && new Date(data.endDate) < new Date()) ? '🎉' : '⚪'
      }
    ];

    return steps;
  }

  /**
   * สร้างข้อมูลสถิติสำหรับ Dashboard
   * @param {Object} data - ข้อมูลต้นฉบับ
   */
  createStatisticsData(data) {
    const timeline = this.createTimelineData(data);
    const completedSteps = timeline.filter(step => step.status === 'completed').length;
    const totalSteps = timeline.length;
    const pendingSteps = timeline.filter(step => step.status === 'pending').length;
    const errorSteps = timeline.filter(step => step.status === 'error').length;

    return {
      completedSteps,
      totalSteps,
      pendingSteps,
      errorSteps,
      progressPercentage: Math.round((completedSteps / totalSteps) * 100),
      nextAction: this._getNextAction(timeline),
      estimatedCompletion: this._estimateCompletion(data, timeline)
    };
  }

  /**
   * หาการดำเนินการถัดไป
   * @param {Array} timeline - ข้อมูล timeline
   */
  _getNextAction(timeline) {
    const nextStep = timeline.find(step => step.status === 'waiting' || step.status === 'pending');
    
    if (!nextStep) {
      return {
        title: 'เสร็จสิ้นทุกขั้นตอน',
        desc: 'การดำเนินการเสร็จสิ้นแล้ว',
        priority: 'low'
      };
    }

    const priorityMap = {
      'pending': 'high',
      'waiting': 'medium'
    };

    return {
      title: nextStep.title,
      desc: nextStep.desc,
      priority: priorityMap[nextStep.status] || 'low'
    };
  }

  /**
   * ประเมินเวลาเสร็จสิ้น
   * @param {Object} data - ข้อมูลต้นฉบับ
   * @param {Array} timeline - ข้อมูล timeline
   */
  _estimateCompletion(data, timeline) {
    if (data.endDate) {
      return {
        date: data.endDate,
        dateThai: formatThaiDate(data.endDate, 'DD MMMM BBBB'),
        daysRemaining: Math.max(0, Math.ceil((new Date(data.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
      };
    }

    return {
      date: null,
      dateThai: 'ยังไม่กำหนด',
      daysRemaining: null
    };
  }

  /**
   * ตรวจสอบความพร้อมของข้อมูลสำหรับแต่ละ template
   * @param {string} templateType - ประเภท template
   * @param {Object} data - ข้อมูล
   */
  validateDataForTemplate(templateType, data) {
    const requiredFieldsMap = {
      'cs05': ['companyName', 'companyAddress', 'startDate', 'endDate', 'studentData.0.fullName'],
      'official_letter': ['companyName', 'contactPersonName', 'startDate', 'endDate', 'studentData.0.fullName'],
      'student_summary': ['studentData.0.fullName', 'companyName'],
      'company_info': ['companyName', 'supervisorName', 'supervisorPhone', 'supervisorEmail']
    };

    const requiredFields = requiredFieldsMap[templateType];
    if (!requiredFields) {
      throw new Error(`ไม่รองรับประเภท template: ${templateType}`);
    }

    return this.validateRequiredFields(data, requiredFields);
  }

  /**
   * รีเซ็ตข้อมูล cache (ถ้ามี)
   */
  clearCache() {
    // สำหรับการใช้งานในอนาคต
    console.log('Template data cache cleared');
  }

  /**
   * ตรวจสอบสถานะ service
   */
  getStatus() {
    return {
      isReady: true,
      version: '1.3.0',
      supportedTemplates: ['cs05', 'official_letter', 'student_summary', 'company_info'],
      utilsIntegrated: true,
      lastUpdated: new Date().toISOString()
    };
  }
}

// สร้าง instance เดียวสำหรับทั้งระบบ (Singleton pattern)
const templateDataService = new TemplateDataService();

export default templateDataService;