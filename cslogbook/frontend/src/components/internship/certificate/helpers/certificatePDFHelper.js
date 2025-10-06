import officialDocumentService from '../../../../services/PDFServices/OfficialDocumentService';

/**
 * PDF Helper สำหรับจัดการหนังสือรับรองการฝึกงาน (Frontend Only)
 */
class CertificatePDFHelper {
  constructor() {
    this.officialDocumentService = officialDocumentService;
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
  // ✅ ส่งข้อมูลดิบเข้า service (ใช้ template เริ่มต้นเดิม)
  const result = await this.officialDocumentService.generateCertificatePDF(certificateData);
      
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
  // ✅ ส่งข้อมูลดิบเข้า service (ลด double transform)
  const result = await this.officialDocumentService.previewCertificatePDF(certificateData);
      
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