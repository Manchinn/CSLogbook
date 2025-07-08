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
   * @param {Object} certificateData - ข้อมูลหนังสือรับรองจาก API
   * @returns {Object} ข้อมูลที่เตรียมแล้วสำหรับ PDF
   */
  prepareCertificateDataForPDF(certificateData) {
    try {
      if (!certificateData) {
        throw new Error('ไม่มีข้อมูลหนังสือรับรอง');
      }

      console.log('📋 Preparing certificate data for PDF generation...');
      console.log('🔍 Raw certificate data:', certificateData); // เพิ่ม debug

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

      // จัดรูปแบบข้อมูลให้ตรงกับ CertificateTemplate
      const preparedData = {
        // ข้อมูลนักศึกษา
        studentInfo: {
          studentId: cleanThaiText(certificateData.studentInfo?.studentId || certificateData.studentId || ''),
          firstName: cleanThaiText(certificateData.studentInfo?.firstName || certificateData.firstName || ''),
          lastName: cleanThaiText(certificateData.studentInfo?.lastName || certificateData.lastName || ''),
          fullName: cleanThaiText(
            certificateData.studentInfo?.fullName || 
            `${certificateData.firstName || ''} ${certificateData.lastName || ''}`.trim() ||
            'ไม่ระบุชื่อ'
          ),
          yearLevel: parseInt(certificateData.studentInfo?.yearLevel || certificateData.yearLevel || 4),
          classroom: cleanThaiText(certificateData.studentInfo?.classroom || certificateData.classroom || ''),
          department: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          faculty: "คณะวิทยาศาสตร์ประยุกต์",
          university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
        },

        // ข้อมูลการฝึกงาน
        internshipInfo: {
          companyName: cleanThaiText(
            certificateData.companyName || 
            certificateData.internshipInfo?.companyName || 
            'บริษัท [ชื่อบริษัท]' // ค่า default
          ),
          companyAddress: cleanThaiText(
            certificateData.companyAddress || 
            certificateData.internshipInfo?.companyAddress || 
            'ที่อยู่บริษัท'
          ),
          startDate: certificateData.startDate || certificateData.internshipInfo?.startDate || '2025-01-01',
          endDate: certificateData.endDate || certificateData.internshipInfo?.endDate || '2025-03-01',
          totalDays: parseInt(certificateData.totalDays || certificateData.internshipInfo?.totalDays || 60),
          totalHours: parseInt(certificateData.totalHours || certificateData.internshipInfo?.totalHours || 240),
          supervisorName: cleanThaiText(
            certificateData.supervisorName || 
            certificateData.internshipInfo?.supervisorName || 
            '[ชื่อผู้ควบคุมงาน]'
          ),
          supervisorPosition: cleanThaiText(
            certificateData.supervisorPosition || 
            certificateData.internshipInfo?.supervisorPosition || 
            '[ตำแหน่งผู้ควบคุมงาน]'
          ),
        },

        // ข้อมูลเอกสาร
        documentInfo: {
          certificateNumber: certificateData.certificateNumber || this.generateCertificateNumber(),
          issueDate: certificateData.issueDate || new Date(),
          documentDate: certificateData.documentDate || new Date(),
          purpose: cleanThaiText(certificateData.purpose || "เพื่อใช้เป็นหลักฐานการฝึกงานตามหลักสูตร"),
        },

        // ข้อมูลผู้อนุมัติ
        approvalInfo: {
          approvedBy: cleanThaiText(certificateData.approvedBy || "ผู้ช่วยศาสตราจารย์ ดร.อภิชาต บุญมา"),
          approverTitle: cleanThaiText(certificateData.approverTitle || "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ"),
          approvedDate: certificateData.approvedDate || new Date(),
        }
      };

      console.log('✅ Certificate data prepared for PDF:', preparedData);
      return preparedData;

    } catch (error) {
      console.error('❌ Error preparing certificate data:', error);
      throw new Error(`ไม่สามารถเตรียมข้อมูลหนังสือรับรองได้: ${error.message}`);
    }
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
      console.log('🔍 Certificate data for preview:', certificateData); // เพิ่ม debug
      
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
   * ✅ ตรวจสอบข้อมูลพื้นฐาน (แบบยืดหยุ่น)
   * @param {Object} certificateData - ข้อมูลหนังสือรับรอง
   * @returns {boolean} true ถ้ามีข้อมูลพื้นฐาน
   */
  hasBasicCertificateData(certificateData) {
    if (!certificateData) {
      console.warn('⚠️ Certificate data is null or undefined');
      return false;
    }

    // ตรวจสอบข้อมูลพื้นฐานที่สำคัญที่สุด (อย่างน้อยต้องมี object)
    const hasStudentInfo = certificateData.studentInfo || 
                          (certificateData.studentId || certificateData.firstName || certificateData.lastName);
    
    if (!hasStudentInfo) {
      console.warn('⚠️ No student information found');
      return false;
    }

    console.log('✅ Basic certificate data found');
    return true;
  }

  /**
   * ตรวจสอบว่า certificateData พร้อมใช้งานหรือไม่ (แบบเข้มงวด - ไม่ใช้แล้ว)
   * @param {Object} certificateData - ข้อมูลหนังสือรับรอง
   * @returns {boolean} true ถ้าข้อมูลพร้อมใช้งาน
   */
  validateCertificateData(certificateData) {
    if (!certificateData) {
      console.warn('⚠️ Certificate data is null or undefined');
      return false;
    }

    // ตรวจสอบข้อมูลพื้นฐานที่จำเป็น
    const requiredFields = [
      { field: 'studentId', sources: ['studentId', 'studentInfo.studentId'] },
      { field: 'firstName', sources: ['firstName', 'studentInfo.firstName'] },
      { field: 'lastName', sources: ['lastName', 'studentInfo.lastName'] },
      { field: 'companyName', sources: ['companyName', 'internshipInfo.companyName'] },
      { field: 'startDate', sources: ['startDate', 'internshipInfo.startDate'] },
      { field: 'endDate', sources: ['endDate', 'internshipInfo.endDate'] }
    ];

    for (const { field, sources } of requiredFields) {
      let hasValue = false;
      
      for (const source of sources) {
        const value = this.getNestedValue(certificateData, source);
        if (value && value.toString().trim()) {
          hasValue = true;
          break;
        }
      }
      
      if (!hasValue) {
        console.warn(`⚠️ Missing required field: ${field}`);
        return false;
      }
    }

    console.log('✅ Certificate data validation passed');
    return true;
  }

  /**
   * ดึงค่าจาก nested object
   * @param {Object} obj - Object ที่ต้องการดึงค่า
   * @param {string} path - Path ของ field (เช่น 'studentInfo.studentId')
   * @returns {any} ค่าที่ดึงได้
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
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
      version: '2.0.0',
      features: [
        'Frontend PDF Generation',
        'Certificate Preview',
        'Basic Data Validation',
        'Thai Text Cleaning',
        'Error Handling',
        'Flexible Data Processing'
      ],
      lastUpdate: new Date().toISOString()
    };
  }
}

export default CertificatePDFHelper;