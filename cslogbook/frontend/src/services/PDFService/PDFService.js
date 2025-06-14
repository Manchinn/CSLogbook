import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import fontService from './fontService';

class PDFService {
  constructor() {
    this.initialized = false;
  }

  /**
   * เริ่มต้นระบบ PDF (โหลดฟอนต์)
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      await fontService.loadThaiFont();
      this.initialized = true;
      console.log('✅ PDF Service พร้อมใช้งาน');
    } catch (error) {
      console.error('❌ ไม่สามารถเริ่มต้น PDF Service ได้:', error);
      throw error;
    }
  }

  /**
   * สร้างและดาวน์โหลด PDF
   * @param {React.Component} template - PDF Template Component
   * @param {string} filename - ชื่อไฟล์
   */
  async generateAndDownload(template, filename) {
    try {
      // ตรวจสอบการเริ่มต้นระบบ
      if (!this.initialized) {
        await this.initialize();
      }

      // สร้าง PDF blob จาก React Component
      const pdfBlob = await pdf(template).toBlob();
      
      // ตรวจสอบขนาดไฟล์
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (pdfBlob.size > maxSize) {
        throw new Error('ไฟล์ PDF มีขนาดใหญ่เกินกำหนด (10MB)');
      }
      
      // ดาวน์โหลดไฟล์
      saveAs(pdfBlob, filename);
      
      return {
        success: true,
        message: 'สร้าง PDF สำเร็จ',
        size: pdfBlob.size,
        filename: filename
      };
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw new Error(`ไม่สามารถสร้าง PDF ได้: ${error.message}`);
    }
  }

  /**
   * แสดง PDF ในหน้าต่างใหม่
   * @param {React.Component} template - PDF Template Component
   */
  async previewPDF(template) {
    try {
      // ตรวจสอบการเริ่มต้นระบบ
      if (!this.initialized) {
        await this.initialize();
      }

      const pdfBlob = await pdf(template).toBlob();
      const pdfURL = URL.createObjectURL(pdfBlob);
      
      // เปิดในหน้าต่างใหม่
      const newWindow = window.open(pdfURL, '_blank');
      
      // ทำความสะอาด URL หลังจากใช้งาน
      setTimeout(() => {
        URL.revokeObjectURL(pdfURL);
      }, 10000);
      
      return {
        success: true,
        message: 'เปิด PDF Preview สำเร็จ',
        window: newWindow
      };
    } catch (error) {
      console.error('PDF Preview Error:', error);
      throw new Error(`ไม่สามารถแสดง PDF ได้: ${error.message}`);
    }
  }

  /**
   * สร้าง PDF เป็น Blob สำหรับการใช้งานอื่น
   * @param {React.Component} template - PDF Template Component
   */
  async generateBlob(template) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      return await pdf(template).toBlob();
    } catch (error) {
      console.error('PDF Blob Generation Error:', error);
      throw new Error(`ไม่สามารถสร้าง PDF Blob ได้: ${error.message}`);
    }
  }

  /**
   * สร้างชื่อไฟล์ PDF โดยอัตโนมัติ
   * @param {string} type - ประเภทเอกสาร (cs05, letter, summary)
   * @param {string} studentId - รหัสนักศึกษา
   * @param {string} suffix - ส่วนท้ายเพิ่มเติม
   */
  generateFileName(type, studentId, suffix = '') {
    const timestamp = new Date().toISOString().split('T')[0];
    const fileNames = {
      cs05: `แบบฟอร์ม_คพ05_${studentId}_${timestamp}${suffix}.pdf`,
      letter: `หนังสือขอความอนุเคราะห์_${studentId}_${timestamp}${suffix}.pdf`,
      summary: `สรุปข้อมูลนักศึกษา_${timestamp}${suffix}.pdf`,
      company: `ข้อมูลสถานประกอบการ_${studentId}_${timestamp}${suffix}.pdf`,
      draft: `ร่าง_${studentId}_${timestamp}${suffix}.pdf`
    };

    return fileNames[type] || `เอกสาร_${studentId}_${timestamp}${suffix}.pdf`;
  }

  /**
   * ทำความสะอาดข้อมูลก่อนใส่ใน PDF
   * @param {string} input - ข้อมูลที่ต้องการทำความสะอาด
   */
  sanitizeInput(input) {
    if (!input) return '';
    
    return String(input)
      .replace(/[<>]/g, '') // ลบ HTML tags
      .trim();
  }

  /**
   * ตรวจสอบขนาดไฟล์ PDF
   * @param {Blob} pdfBlob - PDF Blob
   * @param {number} maxSize - ขนาดสูงสุดที่อนุญาต (bytes)
   */
  validatePDFSize(pdfBlob, maxSize = 5 * 1024 * 1024) {
    if (pdfBlob.size > maxSize) {
      throw new Error(`ไฟล์ PDF มีขนาดใหญ่เกินกำหนด (${Math.round(maxSize / 1024 / 1024)}MB)`);
    }
    return true;
  }

  /**
   * รีเซ็ตระบบ PDF Service
   */
  reset() {
    this.initialized = false;
    fontService.reset();
  }
}

export default new PDFService();