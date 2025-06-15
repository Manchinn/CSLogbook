import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import apiClient from '../apiClient';
import FontService from './FontService';

class PDFService {
  constructor() {
    // 🔧 แก้ไข: สร้าง instance ใหม่
    this.fontService = new FontService();
    this.isInitialized = false;
  }

  /**
   * เริ่มต้น PDF Service และโหลดฟอนต์
   */
  async initialize() {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    try {
      await this.fontService.loadThaiFont();
      this.isInitialized = true;
      console.log('✅ PDF Service initialized successfully');
    } catch (error) {
      console.error('❌ PDF Service initialization failed:', error);
      throw new Error('ไม่สามารถเริ่มต้น PDF Service ได้');
    }
  }

  /**
   * สร้าง PDF Blob จาก React Component
   * @param {ReactElement} template - PDF Template component
   * @returns {Promise<Blob>} - PDF blob
   */
  async generateBlob(template) {
    try {
      await this.initialize();
      
      const blob = await pdf(template).toBlob();
      
      // ตรวจสอบขนาดไฟล์
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (blob.size > maxSize) {
        throw new Error('ไฟล์ PDF มีขนาดใหญ่เกิน 10MB');
      }

      return blob;
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      throw new Error(`ไม่สามารถสร้าง PDF ได้: ${error.message}`);
    }
  }

  /**
   * สร้างและดาวน์โหลด PDF
   * @param {ReactElement} template - PDF Template component
   * @param {string} filename - ชื่อไฟล์
   */
  async generateAndDownload(template, filename) {
    try {
      const blob = await this.generateBlob(template);
      const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      
      saveAs(blob, finalFilename);
      console.log(`📄 PDF downloaded: ${finalFilename}`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * แสดง PDF ในหน้าต่างใหม่
   * @param {ReactElement} template - PDF Template component
   */
  async previewPDF(template) {
    try {
      const blob = await this.generateBlob(template);
      const url = URL.createObjectURL(blob);
      
      // เปิดในหน้าต่างใหม่
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        throw new Error('ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาอนุญาต popup');
      }

      // ทำความสะอาด URL หลังจากใช้งาน
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      console.log('👁️ PDF preview opened');
    } catch (error) {
      console.error('Error previewing PDF:', error);
      throw error;
    }
  }

  /**
   * สร้างชื่อไฟล์อัตโนมัติ
   * @param {string} type - ประเภทเอกสาร
   * @param {string} studentId - รหัสนักศึกษา
   * @param {string} suffix - คำต่อท้าย
   * @returns {string} - ชื่อไฟล์
   */
/**
 * สร้างชื่อไฟล์อัตโนมัติ (ปรับปรุงใหม่ - แสดงเฉพาะประเภทไทยและชื่อนักศึกษา)
 * @param {string} type - ประเภทเอกสาร (เช่น 'cs05', 'official_letter', 'company_info')
 * @param {string} studentName - ชื่อนักศึกษา (แทนที่จะเป็น studentId)
 * @param {string} suffix - คำต่อท้าย (optional)
 * @returns {string} - ชื่อไฟล์
 */
generateFileName(type, studentName) {
  // แปลงประเภทเอกสารเป็นภาษาไทย
  const typeMap = {
    'cs05': 'แบบฟอร์ม คพ.05',
    'official_letter': 'หนังสือขอความอนุเคราะห์',
    'acceptance_letter': 'แบบตอบรับนักศึกษาเข้าฝึกงาน', // 🆕 เพิ่มใหม่
    'company_info': 'ข้อมูลสถานประกอบการ',
    'student_summary': 'สรุปข้อมูลนักศึกษา',
    'referral_letter': 'หนังสือส่งตัว',
    'certificate': 'ใบรับรอง',
    'evaluation': 'แบบประเมิน',
    'report': 'รายงาน'
  };

  const thaiType = typeMap[type] || type;
  
  // ทำความสะอาดชื่อนักศึกษา (ลบอักขระพิเศษที่ไม่เหมาะสมในชื่อไฟล์)
  const cleanStudentName = studentName
    ? studentName.replace(/[<>:"/\\|?*]/g, '').trim()
    : '';

  // สร้างชื่อไฟล์ - เฉพาะประเภทไทยและชื่อนักศึกษา
  const parts = [thaiType];
  
  if (cleanStudentName) {
    parts.push(cleanStudentName);
  }

  return parts.join(' - ') + '.pdf';
}

  /**
   * บันทึก PDF ไปยัง Server (ใช้ apiClient)
   * @param {ReactElement} template - PDF Template component
   * @param {Object} metadata - ข้อมูลเอกสาร
   * @returns {Promise<Object>} - ผลลัพธ์การบันทึก
   */
  async savePDFToServer(template, metadata) {
    try {
      const blob = await this.generateBlob(template);
      
      // สร้าง FormData สำหรับส่งไฟล์
      const formData = new FormData();
      formData.append('pdf', blob, metadata.filename || 'document.pdf');
      formData.append('metadata', JSON.stringify(metadata));

      // ส่งไฟล์ไปยัง server ผ่าน apiClient
      const response = await apiClient.post('/documents/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        console.log('✅ PDF saved to server:', response.data.data);
        return response.data;
      } else {
        throw new Error(response.data.message || 'ไม่สามารถบันทึก PDF ได้');
      }
    } catch (error) {
      console.error('Error saving PDF to server:', error);
      throw new Error(`ไม่สามารถบันทึก PDF ไปยัง Server ได้: ${error.message}`);
    }
  }

  /**
   * ดึงรายการ PDF ที่บันทึกไว้ (ใช้ apiClient)
   * @param {Object} filters - ตัวกรองข้อมูล
   * @returns {Promise<Array>} - รายการ PDF
   */
  async getPDFList(filters = {}) {
    try {
      const response = await apiClient.get('/documents/pdfs', { params: filters });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'ไม่สามารถดึงรายการ PDF ได้');
      }
    } catch (error) {
      console.error('Error fetching PDF list:', error);
      throw new Error(`ไม่สามารถดึงรายการ PDF ได้: ${error.message}`);
    }
  }

  /**
   * ลบ PDF จาก Server (ใช้ apiClient)
   * @param {string} pdfId - ID ของ PDF
   * @returns {Promise<Object>} - ผลลัพธ์การลบ
   */
  async deletePDFFromServer(pdfId) {
    try {
      const response = await apiClient.delete(`/documents/pdfs/${pdfId}`);
      
      if (response.data.success) {
        console.log('🗑️ PDF deleted from server:', pdfId);
        return response.data;
      } else {
        throw new Error(response.data.message || 'ไม่สามารถลบ PDF ได้');
      }
    } catch (error) {
      console.error('Error deleting PDF:', error);
      throw new Error(`ไม่สามารถลบ PDF ได้: ${error.message}`);
    }
  }

  /**
   * ดาวน์โหลด PDF จาก Server (ใช้ apiClient)
   * @param {string} pdfId - ID ของ PDF
   * @param {string} filename - ชื่อไฟล์
   */
  async downloadPDFFromServer(pdfId, filename) {
    try {
      const response = await apiClient.get(`/documents/pdfs/${pdfId}/download`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(blob, filename || 'document.pdf');
      
      console.log('📥 PDF downloaded from server:', filename);
    } catch (error) {
      console.error('Error downloading PDF from server:', error);
      throw new Error(`ไม่สามารถดาวน์โหลด PDF ได้: ${error.message}`);
    }
  }

  /**
   * ตรวจสอบสถานะ PDF Service
   * @returns {Object} - ข้อมูลสถานะ
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      fontLoaded: this.fontService.isFontLoaded(),
      version: '1.3.0'
    };
  }
}

// สร้าง instance เดียวสำหรับทั้งระบบ (Singleton)
const pdfService = new PDFService();

export default pdfService;