import pdfService from './PDFService';
import templateDataService from './TemplateDataService';
import apiClient from '../apiClient';
import { 
  CS05PDFTemplate, 
  OfficialLetterTemplate, 
  StudentSummaryTemplate, 
  CompanyInfoTemplate 
} from '../../components/internship/templates';

class OfficialDocumentService {
  constructor() {
    this.pdfService = pdfService;
    this.templateDataService = templateDataService;
    
    // 🔧 การตั้งค่าสำหรับการบันทึก PDF Records
    // เปิด/ปิดการบันทึกข้อมูล PDF ไปยัง Backend
    this.enableServerRecording = false; // ปิดชั่วคราว เนื่องจากยังไม่มี Backend API
  }

  /**
   * สร้าง PDF คำร้อง CS05
   * @param {Object} formData - ข้อมูลฟอร์ม CS05
   * @param {boolean} isDraft - เป็นร่างหรือไม่
   * @param {Object} options - ตัวเลือกเพิ่มเติม
   */
  async generateCS05PDF(formData, isDraft = false, options = {}) {
    try {
      // เตรียมข้อมูลด้วย TemplateDataService
      const preparedData = this.templateDataService.prepareCS05Data(formData, {
        showWatermark: isDraft,
        status: isDraft ? 'draft' : 'final',
        ...options
      });

      // สร้างชื่อไฟล์
      const studentId = preparedData.studentData?.[0]?.studentId || 'UNKNOWN';
      const suffix = isDraft ? 'DRAFT' : 'FINAL';
      const filename = this.pdfService.generateFileName('CS05', studentId, suffix);

      // สร้างและดาวน์โหลด PDF
      const template = CS05PDFTemplate({ data: preparedData });
      await this.pdfService.generateAndDownload(template, filename);

      // 🔒 บันทึกข้อมูลไปยัง Server (ปิดชั่วคราว)
      // หมายเหตุ: ปิดการบันทึก PDF record เนื่องจากยังไม่มี Backend API endpoints
      // เปิดใช้งานได้เมื่อพัฒนา Backend API เสร็จสิ้น
      if (!isDraft && options.saveToServer !== false && this.enableServerRecording) {
        try {
          await this.savePDFRecord('CS05', preparedData, filename);
        } catch (recordError) {
          // ไม่ให้ record error ส่งผลต่อการสร้าง PDF
          console.warn('📝 PDF record save failed (but PDF generation succeeded):', recordError.message);
        }
      } else if (!this.enableServerRecording) {
        console.info('ℹ️ PDF record saving is disabled. Enable by setting enableServerRecording = true');
      }

      console.log(`✅ CS05 PDF generated: ${filename}`);
      return { success: true, filename, data: preparedData };
    } catch (error) {
      console.error('Error generating CS05 PDF:', error);
      throw error;
    }
  }

  /**
   * สร้าง PDF หนังสือขอความอนุเคราะห์
   * @param {Object} letterData - ข้อมูลหนังสือ
   * @param {Object} options - ตัวเลือกเพิ่มเติม
   */
  async generateOfficialLetterPDF(letterData, options = {}) {
    try {
      // ตรวจสอบข้อมูลพื้นฐานก่อนเตรียมข้อมูล
      if (!letterData) {
        throw new Error('ไม่มีข้อมูลสำหรับสร้างหนังสือ');
      }

      // Log ข้อมูลสำหรับ debug
      console.log('=== DEBUG: Letter Data Structure ===');
      console.log('letterData:', letterData);
      console.log('letterData type:', typeof letterData);
      console.log('letterData.studentData:', letterData.studentData);
      console.log('=====================================');

      const preparedData = this.templateDataService.prepareOfficialLetterData(letterData);
      
      // ตรวจสอบ preparedData
      if (!preparedData) {
        throw new Error('ไม่สามารถเตรียมข้อมูลหนังสือได้');
      }

      const studentId = preparedData.studentData?.[0]?.studentId || 'UNKNOWN';
      const filename = this.pdfService.generateFileName('LETTER', studentId, 'OFFICIAL');

      console.log('=== DEBUG: Prepared Data ===');
      console.log('preparedData.studentData:', preparedData.studentData);
      console.log('preparedData.companyName:', preparedData.companyName);
      console.log('=============================');

      const template = OfficialLetterTemplate({ data: preparedData });
      await this.pdfService.generateAndDownload(template, filename);

      // 🔒 บันทึกข้อมูลไปยัง Server (ปิดชั่วคราว)
      // หมายเหตุ: ปิดการบันทึก PDF record เนื่องจากยังไม่มี Backend API endpoints
      // ต้องสร้าง API endpoint: POST /api/documents/pdf-records ก่อน
      if (options.saveToServer !== false && this.enableServerRecording) {
        try {
          await this.savePDFRecord('OFFICIAL_LETTER', preparedData, filename);
        } catch (recordError) {
          // ไม่ให้ record error ส่งผลต่อการสร้าง PDF
          console.warn('📝 PDF record save failed (but PDF generation succeeded):', recordError.message);
        }
      } else if (!this.enableServerRecording) {
        console.info('ℹ️ PDF record saving is disabled. Enable by setting enableServerRecording = true');
      }

      console.log(`✅ Official Letter PDF generated: ${filename}`);
      return { success: true, filename, data: preparedData };
    } catch (error) {
      console.error('Error generating Official Letter PDF:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * แสดง PDF Preview
   * @param {string} templateType - ประเภท template
   * @param {Object} data - ข้อมูล
   */
  async previewPDF(templateType, data) {
    try {
      let template;
      let preparedData;

      switch (templateType.toLowerCase()) {
        case 'cs05':
          preparedData = this.templateDataService.prepareCS05Data(data, { showWatermark: true });
          template = CS05PDFTemplate({ data: preparedData });
          break;
        case 'official_letter':
        case 'letter':
          preparedData = this.templateDataService.prepareOfficialLetterData(data);
          template = OfficialLetterTemplate({ data: preparedData });
          break;
        case 'student_summary':
        case 'summary':
          preparedData = this.templateDataService.prepareStudentSummaryData(data);
          template = StudentSummaryTemplate({ data: preparedData });
          break;
        case 'company_info':
        case 'company':
          preparedData = this.templateDataService.prepareCompanyInfoData(data);
          template = CompanyInfoTemplate({ data: preparedData });
          break;
        default:
          throw new Error(`ไม่รองรับประเภท template: ${templateType}`);
      }

      await this.pdfService.previewPDF(template);
      console.log(`👁️ PDF preview opened: ${templateType}`);
      return { success: true };
    } catch (error) {
      console.error('Error previewing PDF:', error);
      throw error;
    }
  }

  /**
   * สร้าง PDF หลายไฟล์พร้อมกัน (Batch)
   * @param {Array} documents - รายการเอกสาร
   * @param {Object} options - ตัวเลือกเพิ่มเติม
   */
  async generateBatchPDFs(documents, options = {}) {
    try {
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const doc of documents) {
        try {
          let result;
          switch (doc.type) {
            case 'CS05':
              result = await this.generateCS05PDF(doc.data, doc.isDraft, options);
              break;
            case 'OFFICIAL_LETTER':
              result = await this.generateOfficialLetterPDF(doc.data, options);
              break;
            default:
              throw new Error(`ไม่รองรับประเภทเอกสาร: ${doc.type}`);
          }
          results.push({ ...result, documentId: doc.id });
          successCount++;
        } catch (error) {
          console.error(`Error generating PDF for document ${doc.id}:`, error);
          results.push({ 
            success: false, 
            error: error.message, 
            documentId: doc.id 
          });
          errorCount++;
        }
      }

      console.log(`📊 Batch PDF generation completed: ${successCount} success, ${errorCount} errors`);
      return { 
        success: errorCount === 0, 
        results, 
        summary: { successCount, errorCount, total: documents.length }
      };
    } catch (error) {
      console.error('Error in batch PDF generation:', error);
      throw error;
    }
  }

  /**
   * บันทึกข้อมูล PDF ไปยัง Server
   * 🔒 ฟังก์ชันนี้ถูกปิดใช้งานชั่วคราว เนื่องจากยังไม่มี Backend API
   * @param {string} documentType - ประเภทเอกสาร
   * @param {Object} data - ข้อมูลเอกสาร
   * @param {string} filename - ชื่อไฟล์
   */
  async savePDFRecord(documentType, data, filename) {
    try {
      // เตรียมข้อมูล metadata สำหรับบันทึก
      const metadata = {
        documentType,
        filename,
        studentId: data.studentData?.[0]?.studentId,
        companyName: data.companyName,
        createdDate: new Date().toISOString(),
        status: 'generated'
      };

      console.log('📋 API Request:', {
        method: 'post',
        url: '/documents/pdf-records',
        data: metadata
      });

      // 🚫 ปิดการเรียก API ชั่วคราว - จะเปิดเมื่อมี Backend API พร้อม
      const response = await apiClient.post('/documents/pdf-records', metadata);
      
      if (response.data.success) {
        console.log('✅ PDF record saved:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'ไม่สามารถบันทึกข้อมูล PDF ได้');
      }
    } catch (error) {
      console.error('❌ Error saving PDF record:', error.message);
      
      // ไม่ throw error เพื่อไม่ให้ส่งผลต่อการสร้าง PDF
      // แค่ log warning และดำเนินการต่อได้
      console.warn('⚠️ PDF record not saved, but PDF generation continues');
      
      // ใน production อาจต้องการส่ง error ไป monitoring service
      // this.logErrorToMonitoring('pdf-record-save-failed', error);
    }
  }

  /**
   * ดึงประวัติการสร้าง PDF
   * 🔒 ฟังก์ชันนี้ถูกปิดใช้งานชั่วคราว เนื่องจากยังไม่มี Backend API
   * @param {Object} filters - ตัวกรองข้อมูล
   */
  async getPDFHistory(filters = {}) {
    try {
      // 🚫 ปิดการเรียก API ชั่วคราว
      // const response = await apiClient.get('/documents/pdf-records', { params: filters });
      
      // 🔄 Return mock data สำหรับ development
      console.warn('⚠️ getPDFHistory: Using mock data - Backend API not available yet');
      return {
        success: true,
        data: [], // Mock empty history
        message: 'Backend API ยังไม่พร้อม - แสดงข้อมูลจำลอง'
      };
      
      // 📝 Code ที่จะใช้เมื่อมี Backend API
      /*
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'ไม่สามารถดึงประวัติ PDF ได้');
      }
      */
    } catch (error) {
      console.error('Error fetching PDF history:', error);
      
      // Return fallback data แทนการ throw error
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  /**
   * 🔧 เปิด/ปิดการบันทึก PDF Records
   * ใช้เมื่อต้องการเปิดใช้งานการบันทึกข้อมูลไปยัง Backend
   * @param {boolean} enabled - เปิด/ปิดการบันทึก
   */
  setServerRecording(enabled) {
    this.enableServerRecording = enabled;
    console.log(`🔧 PDF Server Recording ${enabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (enabled) {
      console.info('✅ PDF records will be saved to backend when available');
    } else {
      console.info('❌ PDF records will NOT be saved to backend');
    }
  }

  /**
   * 📊 ตรวจสอบการตั้งค่าการบันทึก
   */
  getRecordingStatus() {
    return {
      enabled: this.enableServerRecording,
      reason: this.enableServerRecording 
        ? 'Backend recording is enabled' 
        : 'Backend API not available - recording disabled',
      requiredEndpoints: [
        'POST /api/documents/pdf-records',
        'GET /api/documents/pdf-records',
        'DELETE /api/documents/pdf-records/:id'
      ]
    };
  }

  /**
   * ตรวจสอบสถานะของ Official Document Service
   */
  getStatus() {
    return {
      ...this.pdfService.getStatus(),
      availableTemplates: ['CS05', 'OFFICIAL_LETTER', 'STUDENT_SUMMARY', 'COMPANY_INFO'],
      serviceVersion: '1.3.0',
      // 🆕 เพิ่มข้อมูลสถานะการบันทึก
      recordingStatus: this.getRecordingStatus()
    };
  }
}

// สร้าง instance เดียวสำหรับทั้งระบบ
const officialDocumentService = new OfficialDocumentService();

export default officialDocumentService;