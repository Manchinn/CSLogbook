import officialDocumentService from '../../../../services/PDFServices/OfficialDocumentService';

/**
 * PDF Helper สำหรับจัดการหนังสือรับรองการฝึกงาน (Frontend Only)
 */
class CertificatePDFHelper {
  constructor() {
    this.officialDocumentService = officialDocumentService;
  }

  /**
   * เตรียมข้อมูลหนังสือรับรองสำหรับ PDF Generation
   * @param {Object} certificateData - ข้อมูลหนังสือรับรองจาก API (โครงสร้างใหม่)
   * @returns {Object} ข้อมูลที่เตรียมแล้วสำหรับ PDF
   */
  prepareCertificateDataForPDF(certificateData) {
    try {
      if (!certificateData) {
        throw new Error('ไม่มีข้อมูลหนังสือรับรอง');
      }

      console.log('📋 Preparing certificate data for PDF generation...');
      console.log('🔍 Raw certificate data:', certificateData);

      // ✅ ฟังก์ชันทำความสะอาดข้อความภาษาไทย
      const cleanThaiText = (text) => {
        if (!text) return '';
        
        return text
          .toString()
          .trim()
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // ลบ control characters
          .replace(/[^\u0E00-\u0E7F\w\s\-_.()\/,]/g, '') // เก็บเฉพาะอักษรไทย อังกฤษ และเครื่องหมายที่จำเป็น
          .replace(/\s+/g, ' '); // แทนที่ช่องว่างซ้ำ
      };

      // ✅ ดึงข้อมูลจากโครงสร้างใหม่
      const studentInfo = certificateData.studentInfo || {};
      const certificateRequest = certificateData.certificateRequest || {};
      const requirements = certificateData.requirements || {};

      // ✅ ดึงข้อมูลสถานที่ฝึกงานจาก internshipInfo (ถ้ามี)
      const internshipInfo = certificateData.internshipInfo || {};

      // จัดรูปแบบข้อมูลให้ตรงกับ CertificateTemplate
      const preparedData = {
        // ✅ ข้อมูลนักศึกษาจาก certificateData.studentInfo
        studentName: cleanThaiText(studentInfo.fullName || studentInfo.firstName || ''),
        studentId: cleanThaiText(studentInfo.studentId || ''),
        fullName: cleanThaiText(studentInfo.fullName || ''),
        firstName: cleanThaiText(studentInfo.firstName || ''),
        lastName: cleanThaiText(studentInfo.lastName || ''),
        email: cleanThaiText(studentInfo.email || ''),
        
        // ข้อมูลระดับการศึกษาและสาขา (ค่าเริ่มต้น)
        yearLevel: parseInt(studentInfo.yearLevel || studentInfo.year || 4),
        classroom: cleanThaiText(studentInfo.classroom || studentInfo.class || ''),
        department: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
        faculty: "คณะวิทยาศาสตร์ประยุกต์",
        university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",

        // ✅ ข้อมูลการฝึกงาน (จาก internshipInfo หรือ requirements)
        companyName: cleanThaiText(
          internshipInfo.companyName || 
          certificateData.companyName || 
          'สถานประกอบการที่ฝึกงาน' // ค่า default ถ้าไม่มีข้อมูล
        ),
        companyAddress: cleanThaiText(
          internshipInfo.companyAddress || 
          certificateData.companyAddress || 
          'ที่อยู่สถานประกอบการ'
        ),
        
        // ข้อมูลระยะเวลาฝึกงาน
        internshipStartDate: internshipInfo.startDate || certificateData.startDate || '2025-01-01',
        internshipEndDate: internshipInfo.endDate || certificateData.endDate || '2025-03-01',
        totalHours: parseInt(requirements.totalHours?.current || 240),
        totalDays: this.calculateDaysFromHours(requirements.totalHours?.current || 240),
        
        // ✅ ข้อมูลผู้ควบคุมงาน
        supervisorName: cleanThaiText(
          internshipInfo.supervisorName || 
          certificateData.supervisorName || 
          'ผู้ควบคุมงาน'
        ),
        supervisorPosition: cleanThaiText(
          internshipInfo.supervisorPosition || 
          certificateData.supervisorPosition || 
          'ตำแหน่งผู้ควบคุมงาน'
        ),

        // ✅ ข้อมูลเอกสาร
        certificateDate: certificateRequest.requestDate ? new Date(certificateRequest.requestDate) : new Date(),
        certificateNumber: this.generateCertificateNumber(),
        isCompleted: certificateRequest.status === 'approved' || certificateData.status === 'ready',
        
        // ข้อมูลการอนุมัติ
        approvedBy: cleanThaiText("นางสาวจันทิมา อรรฆจิตต์"),
        approverTitle: cleanThaiText("นักวิชาการศึกษา"),
        approvedDate: certificateRequest.requestDate ? new Date(certificateRequest.requestDate) : new Date(),

        // ✅ ข้อมูลเพิ่มเติมเพื่อ debug
        debug: {
          originalData: certificateData,
          studentInfoFound: !!studentInfo.fullName,
          studentIdFound: !!studentInfo.studentId,
          companyNameFound: !!(internshipInfo.companyName || certificateData.companyName),
          certificateStatus: certificateData.status,
          requestStatus: certificateRequest.status
        }
      };

      console.log('✅ Certificate data prepared for PDF:', preparedData);
      console.log('🎯 Key data for display:', {
        studentName: preparedData.studentName,
        studentId: preparedData.studentId,
        companyName: preparedData.companyName,
        isCompleted: preparedData.isCompleted
      });
      
      return preparedData;

    } catch (error) {
      console.error('❌ Error preparing certificate data:', error);
      throw new Error(`ไม่สามารถเตรียมข้อมูลหนังสือรับรองได้: ${error.message}`);
    }
  }

  /**
   * คำนวณจำนวนวันจากชั่วโมง
   * @param {number} hours - จำนวนชั่วโมง
   * @returns {number} จำนวนวัน (ประมาณการ)
   */
  calculateDaysFromHours(hours) {
    if (!hours || hours <= 0) return 60; // ค่าเริ่มต้น
    
    // คำนวณจากชั่วโมงต่อวัน (เฉลี่ย 8 ชั่วโมงต่อวัน)
    const daysCalculated = Math.ceil(hours / 8);
    
    // ตรวจสอบให้อยู่ในช่วงที่สมเหตุสมผล (60-120 วัน)
    if (daysCalculated < 60) return 60;
    if (daysCalculated > 120) return 120;
    
    return daysCalculated;
  }

  /**
   * ✅ ตรวจสอบข้อมูลพื้นฐาน (อัปเดตให้รองรับโครงสร้างใหม่)
   * @param {Object} certificateData - ข้อมูลหนังสือรับรอง
   * @returns {boolean} true ถ้ามีข้อมูลพื้นฐาน
   */
  hasBasicCertificateData(certificateData) {
    if (!certificateData) {
      console.warn('⚠️ Certificate data is null or undefined');
      return false;
    }

    // ✅ ตรวจสอบโครงสร้างข้อมูลใหม่
    const studentInfo = certificateData.studentInfo;
    
    if (!studentInfo) {
      console.warn('⚠️ No studentInfo found in certificate data');
      return false;
    }

    // ตรวจสอบข้อมูลพื้นฐานที่สำคัญ
    const hasStudentName = !!(studentInfo.fullName || studentInfo.firstName);
    const hasStudentId = !!studentInfo.studentId;
    
    if (!hasStudentName) {
      console.warn('⚠️ Student name not found');
      return false;
    }
    
    if (!hasStudentId) {
      console.warn('⚠️ Student ID not found');
      return false;
    }

    console.log('✅ Basic certificate data validation passed:', {
      studentName: studentInfo.fullName || studentInfo.firstName,
      studentId: studentInfo.studentId,
      status: certificateData.status
    });
    
    return true;
  }

  /**
   * ตรวจสอบว่า OfficialDocumentService พร้อมใช้งานหรือไม่
   * @returns {boolean} true ถ้าพร้อมใช้งาน
   */
  isOfficialDocumentServiceAvailable() {
    return this.officialDocumentService && 
           typeof this.officialDocumentService.generateCertificatePDF === 'function' &&
           typeof this.officialDocumentService.previewCertificatePDF === 'function';
  }

  /**
   * สร้างและดาวน์โหลดหนังสือรับรอง (Frontend Only)
   * @param {Object} certificateData - ข้อมูลหนังสือรับรอง
   * @returns {Promise<Object>} ผลลัพธ์การดาวน์โหลด
   */
  async downloadCertificate(certificateData) {
    try {
      console.log('🔄 Starting certificate download process...');
      
      // ✅ ตรวจสอบว่า OfficialDocumentService พร้อมใช้งาน
      if (!this.isOfficialDocumentServiceAvailable()) {
        throw new Error('PDF Service ไม่พร้อมใช้งาน กรุณาตรวจสอบระบบ');
      }

      // ✅ ตรวจสอบข้อมูลพื้นฐาน (ลดความเข้มงวด)
      if (!this.hasBasicCertificateData(certificateData)) {
        console.warn('⚠️ Some certificate data is missing, but continuing with defaults...');
      }

      console.log('🔄 Using Frontend PDF Generation...');
      
      // เตรียมข้อมูลสำหรับ PDF
      const preparedData = this.prepareCertificateDataForPDF(certificateData);
      
      // ใช้ OfficialDocumentService สร้าง PDF
      const result = await this.officialDocumentService.generateCertificatePDF(preparedData);
      
      if (result.success) {
        console.log('✅ Certificate downloaded successfully:', result.filename);
        return {
          success: true,
          message: `ดาวน์โหลดหนังสือรับรองเรียบร้อยแล้ว: ${result.filename}`,
          filename: result.filename,
          data: result.data
        };
      } else {
        throw new Error('ไม่สามารถสร้างหนังสือรับรองได้');
      }

    } catch (error) {
      console.error('❌ Error downloading certificate:', error);
      
      // ✅ จัดการ error แบบเจาะจง
      if (error.message?.includes('ไม่มีข้อมูลหนังสือรับรอง')) {
        throw new Error('ข้อมูลไม่ครบถ้วนสำหรับสร้างหนังสือรับรอง กรุณาตรวจสอบข้อมูลการฝึกงาน');
      } else if (error.message?.includes('PDF Service ไม่พร้อมใช้งาน')) {
        throw new Error('ระบบสร้าง PDF ไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง');
      } else if (error.message?.includes('ข้อมูลไม่ครบถ้วน')) {
        throw new Error('ข้อมูลการฝึกงานไม่ครบถ้วน กรุณาติดต่อเจ้าหน้าที่ภาควิชา');
      } else {
        throw new Error(error.message || 'ไม่สามารถดาวน์โหลดหนังสือรับรองได้');
      }
    }
  }

  /**
   * แสดงตัวอย่างหนังสือรับรอง (Frontend Only)
   * @param {Object} certificateData - ข้อมูลหนังสือรับรอง
   * @returns {Promise<Object>} ผลลัพธ์การแสดงตัวอย่าง
   */
  async previewCertificate(certificateData) {
    try {
      console.log('🔄 Starting certificate preview process...');
      console.log('🔍 Certificate data for preview:', certificateData);
      
      // ✅ ตรวจสอบว่า OfficialDocumentService พร้อมใช้งาน
      if (!this.isOfficialDocumentServiceAvailable()) {
        throw new Error('PDF Service ไม่พร้อมใช้งาน กรุณาตรวจสอบระบบ');
      }

      // ✅ ตรวจสอบข้อมูลพื้นฐาน (ลดความเข้มงวด)
      if (!this.hasBasicCertificateData(certificateData)) {
        console.warn('⚠️ Some certificate data is missing, but continuing with defaults for preview...');
      }

      console.log('🔄 Using Frontend PDF Generation for preview...');
      
      // เตรียมข้อมูลสำหรับ PDF
      const preparedData = this.prepareCertificateDataForPDF(certificateData);
      
      // ใช้ OfficialDocumentService แสดงตัวอย่าง PDF
      const result = await this.officialDocumentService.previewCertificatePDF(preparedData);
      
      if (result.success) {
        console.log('✅ Certificate preview opened successfully');
        return {
          success: true,
          message: 'เปิดตัวอย่างหนังสือรับรองในแท็บใหม่แล้ว'
        };
      } else {
        throw new Error('ไม่สามารถแสดงตัวอย่างหนังสือรับรองได้');
      }

    } catch (error) {
      console.error('❌ Error previewing certificate:', error);
      
      // ✅ จัดการ error แบบเจาะจง
      if (error.message?.includes('ไม่มีข้อมูลหนังสือรับรอง')) {
        throw new Error('ข้อมูลไม่ครบถ้วนสำหรับแสดงตัวอย่างหนังสือรับรอง กรุณาตรวจสอบข้อมูลการฝึกงาน');
      } else if (error.message?.includes('PDF Service ไม่พร้อมใช้งาน')) {
        throw new Error('ระบบสร้าง PDF ไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง');
      } else if (error.message?.includes('ข้อมูลไม่ครบถ้วน')) {
        throw new Error('ข้อมูลการฝึกงานไม่ครบถ้วน กรุณาติดต่อเจ้าหน้าที่ภาควิชา');
      } else if (error.message?.includes('ไม่สามารถเปิดแท็บใหม่ได้')) {
        throw new Error('ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาอนุญาต popup ในเบราว์เซอร์');
      } else {
        throw new Error(error.message || 'ไม่สามารถแสดงตัวอย่างหนังสือรับรองได้');
      }
    }
  }

  /**
   * สร้างหมายเลขหนังสือรับรอง
   * @returns {string} หมายเลขหนังสือรับรอง
   */
  generateCertificateNumber() {
    const year = new Date().getFullYear() + 543; // พ.ศ.
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `อว 7105(05)/${year}${month}${randomNum}`;
  }

  /**
   * ล็อกสถานะการทำงานปัจจุบัน
   * @returns {Object} ข้อมูลสถานะ
   */
  getStatus() {
    return {
      serviceAvailable: this.isOfficialDocumentServiceAvailable(),
      serviceType: 'Frontend PDF Generation Only',
      version: '2.1.0', // อัปเดตเวอร์ชัน
      features: [
        'Frontend PDF Generation',
        'Certificate Preview',
        'Enhanced Data Validation',
        'New Certificate Data Structure Support', // ใหม่!
        'Thai Text Cleaning',
        'Error Handling',
        'Flexible Data Processing'
      ],
      lastUpdate: new Date().toISOString()
    };
  }
}

export default CertificatePDFHelper;