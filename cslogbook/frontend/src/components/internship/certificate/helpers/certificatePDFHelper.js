import officialDocumentService from '../../../../services/PDFServices/OfficialDocumentService';
import internshipService from '../../../../services/internshipService';

/**
 * PDF Helper สำหรับจัดการหนังสือรับรองการฝึกงาน
 */
class CertificatePDFHelper {
  constructor() {
    // ✅ ใช้ instance ที่ import เข้ามาโดยตรง (ไม่ใช้ new)
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

      // จัดรูปแบบข้อมูลให้ตรงกับ CertificateTemplate
      const preparedData = {
        // ข้อมูลนักศึกษา
        studentInfo: {
          studentId: certificateData.studentInfo?.studentId || certificateData.studentId,
          firstName: certificateData.studentInfo?.firstName || certificateData.firstName,
          lastName: certificateData.studentInfo?.lastName || certificateData.lastName,
          fullName: certificateData.studentInfo?.fullName || 
                   `${certificateData.firstName || ''} ${certificateData.lastName || ''}`.trim(),
          yearLevel: certificateData.studentInfo?.yearLevel || certificateData.yearLevel,
          classroom: certificateData.studentInfo?.classroom || certificateData.classroom,
          department: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          faculty: "คณะวิทยาศาสตร์ประยุกต์",
          university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
        },

        // ข้อมูลการฝึกงาน
        internshipInfo: {
          companyName: certificateData.companyName || certificateData.internshipInfo?.companyName,
          companyAddress: certificateData.companyAddress || certificateData.internshipInfo?.companyAddress,
          startDate: certificateData.startDate || certificateData.internshipInfo?.startDate,
          endDate: certificateData.endDate || certificateData.internshipInfo?.endDate,
          totalDays: certificateData.totalDays || certificateData.internshipInfo?.totalDays,
          totalHours: certificateData.totalHours || certificateData.internshipInfo?.totalHours,
          supervisorName: certificateData.supervisorName || certificateData.internshipInfo?.supervisorName,
          supervisorPosition: certificateData.supervisorPosition || certificateData.internshipInfo?.supervisorPosition,
        },

        // ข้อมูลเอกสาร
        documentInfo: {
          certificateNumber: certificateData.certificateNumber || this.generateCertificateNumber(),
          issueDate: certificateData.issueDate || new Date(),
          documentDate: certificateData.documentDate || new Date(),
          purpose: certificateData.purpose || "เพื่อใช้เป็นหลักฐานการฝึกงานตามหลักสูตร",
        },

        // ข้อมูลผู้อนุมัติ
        approvalInfo: {
          approvedBy: certificateData.approvedBy || "ผู้ช่วยศาสตราจารย์ ดร.อภิชาต บุญมา",
          approverTitle: certificateData.approverTitle || "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
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
           typeof this.officialDocumentService.generateCertificatePDF === 'function';
  }

  /**
   * สร้างและดาวน์โหลดหนังสือรับรอง
   * @param {Object} certificateData - ข้อมูลหนังสือรับรอง
   * @returns {Promise<Object>} ผลลัพธ์การดาวน์โหลด
   */
  async downloadCertificate(certificateData) {
    try {
      console.log('🔄 Starting certificate download process...');
      
      // ✅ ตรวจสอบว่า OfficialDocumentService พร้อมใช้งานหรือไม่
      if (this.isOfficialDocumentServiceAvailable()) {
        console.log('🔄 Using Frontend PDF Generation...');
        
        try {
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
          }
        } catch (pdfError) {
          console.warn('⚠️ Frontend PDF generation failed, trying backend fallback...', pdfError);
        }
      }
      
      // ✅ Fallback: ใช้ Backend API
      console.log('🔄 Using Backend API fallback for download...');
      return await this.downloadCertificateFromBackend();

    } catch (error) {
      console.error('❌ Error downloading certificate:', error);
      
      // จัดการ error แบบเจาะจง
      if (error.message?.includes('ไม่มีข้อมูลสำหรับสร้าง')) {
        throw new Error('ข้อมูลไม่ครบถ้วนสำหรับสร้างหนังสือรับรอง กรุณาตรวจสอบข้อมูลการฝึกงาน');
      } else if (error.message?.includes('PDF Service ไม่พร้อมใช้งาน')) {
        throw new Error('ระบบสร้าง PDF ไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง');
      } else {
        throw new Error(error.message || 'ไม่สามารถดาวน์โหลดหนังสือรับรองได้');
      }
    }
  }

  /**
   * แสดงตัวอย่างหนังสือรับรอง
   * @param {Object} certificateData - ข้อมูลหนังสือรับรอง
   * @returns {Promise<Object>} ผลลัพธ์การแสดงตัวอย่าง
   */
  async previewCertificate(certificateData) {
    try {
      console.log('🔄 Starting certificate preview process...');
      
      // ✅ ตรวจสอบว่า OfficialDocumentService พร้อมใช้งานหรือไม่
      if (this.isOfficialDocumentServiceAvailable()) {
        console.log('🔄 Using Frontend PDF Generation...');
        
        try {
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
          }
        } catch (pdfError) {
          console.warn('⚠️ Frontend PDF preview failed, trying backend fallback...', pdfError);
        }
      }
      
      // ✅ Fallback: ใช้ Backend API
      console.log('🔄 Using Backend API fallback for preview...');
      return await this.previewCertificateFromBackend();

    } catch (error) {
      console.error('❌ Error previewing certificate:', error);
      
      // จัดการ error แบบเจาะจง
      if (error.message?.includes('ไม่มีข้อมูลสำหรับสร้าง')) {
        throw new Error('ข้อมูลไม่ครบถ้วนสำหรับสร้างหนังสือรับรอง กรุณาตรวจสอบข้อมูลการฝึกงาน');
      } else if (error.message?.includes('PDF Service ไม่พร้อมใช้งาน')) {
        throw new Error('ระบบสร้าง PDF ไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง');
      } else {
        throw new Error(error.message || 'ไม่สามารถแสดงตัวอย่างหนังสือรับรองได้');
      }
    }
  }

  /**
   * ใช้ Backend API เป็น fallback สำหรับดาวน์โหลด
   * @returns {Promise<Object>} ผลลัพธ์การดาวน์โหลดจาก Backend
   */
  async downloadCertificateFromBackend() {
    try {
      console.log('🔄 Using Backend API for certificate download...');
      
      const result = await internshipService.downloadCertificate();
      
      if (result.success) {
        console.log('✅ Certificate downloaded from backend successfully');
        return {
          success: true,
          message: 'ดาวน์โหลดหนังสือรับรองจาก Backend เรียบร้อยแล้ว'
        };
      } else {
        throw new Error(result.message || 'ไม่สามารถดาวน์โหลดหนังสือรับรองจาก Backend ได้');
      }

    } catch (error) {
      console.error('❌ Error downloading certificate from backend:', error);
      throw error;
    }
  }

  /**
   * ใช้ Backend API เป็น fallback สำหรับแสดงตัวอย่าง
   * @returns {Promise<Object>} ผลลัพธ์การแสดงตัวอย่างจาก Backend
   */
  async previewCertificateFromBackend() {
    try {
      console.log('🔄 Using Backend API for certificate preview...');
      
      const result = await internshipService.previewCertificate();
      
      if (result.success) {
        console.log('✅ Certificate preview from backend opened successfully');
        return {
          success: true,
          message: 'เปิดตัวอย่างหนังสือรับรองจาก Backend ในแท็บใหม่แล้ว'
        };
      } else {
        throw new Error(result.message || 'ไม่สามารถแสดงตัวอย่างหนังสือรับรองจาก Backend ได้');
      }

    } catch (error) {
      console.error('❌ Error previewing certificate from backend:', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบว่า certificateData พร้อมใช้งานหรือไม่
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
      'studentId', 'firstName', 'lastName',
      'companyName', 'startDate', 'endDate'
    ];

    for (const field of requiredFields) {
      const value = certificateData[field] || 
                   certificateData.studentInfo?.[field] || 
                   certificateData.internshipInfo?.[field];
      
      if (!value) {
        console.warn(`⚠️ Missing required field: ${field}`);
        return false;
      }
    }

    console.log('✅ Certificate data validation passed');
    return true;
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
}

export default CertificatePDFHelper;