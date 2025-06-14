import React from 'react';
import pdfService from '/pdfService';
import { CS05PDFTemplate, OfficialLetterTemplate, CompanyInfoTemplate } from '../components/internship/templates';

class OfficialDocumentService {
  /**
   * สร้าง PDF แบบฟอร์ม CS05
   * @param {Object} formData - ข้อมูลฟอร์ม CS05
   * @param {boolean} isDraft - สถานะร่างหรือฉบับจริง
   */
  async generateCS05PDF(formData, isDraft = true) {
    try {
      // เตรียมข้อมูลสำหรับ PDF
      const pdfData = {
        ...formData,
        documentId: formData.documentId || 'DRAFT',
        status: isDraft ? 'draft' : 'approved',
        createdDate: new Date().toISOString()
      };

      // สร้าง PDF Template
      const template = React.createElement(CS05PDFTemplate, {
        data: pdfData,
        showWatermark: isDraft
      });

      // สร้างชื่อไฟล์
      const suffix = isDraft ? '_ร่าง' : '';
      const filename = pdfService.generateFileName(
        isDraft ? 'draft' : 'cs05',
        formData.studentData?.[0]?.studentId || 'unknown',
        suffix
      );

      // สร้างและดาวน์โหลด PDF
      return await pdfService.generateAndDownload(template, filename);
    } catch (error) {
      console.error('Error generating CS05 PDF:', error);
      throw new Error(`ไม่สามารถสร้าง PDF แบบฟอร์ม CS05 ได้: ${error.message}`);
    }
  }

  /**
   * สร้าง PDF หนังสือขอความอนุเคราะห์
   * @param {Object} letterData - ข้อมูลหนังสือ
   */
  async generateOfficialLetterPDF(letterData) {
    try {
      // เตรียมข้อมูลสำหรับหนังสือ
      const pdfData = {
        ...letterData,
        documentNumber: letterData.documentNumber || `CS05-${Date.now()}`,
        documentDate: letterData.documentDate || new Date().toISOString(),
        advisorName: letterData.advisorName || 'อาจารย์ที่ปรึกษาโครงการ'
      };

      // สร้าง PDF Template
      const template = React.createElement(OfficialLetterTemplate, {
        data: pdfData
      });

      // สร้างชื่อไฟล์
      const filename = pdfService.generateFileName(
        'letter',
        letterData.studentData?.[0]?.studentId || 'unknown'
      );

      // สร้างและดาวน์โหลด PDF
      return await pdfService.generateAndDownload(template, filename);
    } catch (error) {
      console.error('Error generating official letter PDF:', error);
      throw new Error(`ไม่สามารถสร้าง PDF หนังสือขอความอนุเคราะห์ได้: ${error.message}`);
    }
  }

  /**
   * สร้าง PDF ข้อมูลสถานประกอบการ
   * @param {Object} companyData - ข้อมูลบริษัท
   */
  async generateCompanyInfoPDF(companyData) {
    try {
      // สร้าง PDF Template
      const template = React.createElement(CompanyInfoTemplate, {
        data: companyData
      });

      // สร้างชื่อไฟล์
      const filename = pdfService.generateFileName(
        'company',
        companyData.studentId || 'unknown'
      );

      // สร้างและดาวน์โหลด PDF
      return await pdfService.generateAndDownload(template, filename);
    } catch (error) {
      console.error('Error generating company info PDF:', error);
      throw new Error(`ไม่สามารถสร้าง PDF ข้อมูลสถานประกอบการได้: ${error.message}`);
    }
  }

  /**
   * แสดง PDF Preview
   * @param {string} templateType - ประเภท template (cs05, letter, company)
   * @param {Object} data - ข้อมูลสำหรับ PDF
   */
  async previewPDF(templateType, data) {
    try {
      let template;

      switch (templateType) {
        case 'cs05':
          template = React.createElement(CS05PDFTemplate, {
            data: { ...data, status: 'preview' },
            showWatermark: true
          });
          break;
        case 'letter':
          template = React.createElement(OfficialLetterTemplate, {
            data: data
          });
          break;
        case 'company':
          template = React.createElement(CompanyInfoTemplate, {
            data: data
          });
          break;
        default:
          throw new Error('ประเภท template ไม่ถูกต้อง');
      }

      return await pdfService.previewPDF(template);
    } catch (error) {
      console.error('Error previewing PDF:', error);
      throw new Error(`ไม่สามารถแสดง PDF Preview ได้: ${error.message}`);
    }
  }

  /**
   * สร้าง PDF หลายประเภทพร้อมกัน (Batch)
   * @param {Array} documents - รายการเอกสารที่ต้องการสร้าง
   */
  async generateBatchPDFs(documents) {
    try {
      const results = [];

      for (const doc of documents) {
        try {
          let result;
          
          switch (doc.type) {
            case 'cs05':
              result = await this.generateCS05PDF(doc.data, doc.isDraft);
              break;
            case 'letter':
              result = await this.generateOfficialLetterPDF(doc.data);
              break;
            case 'company':
              result = await this.generateCompanyInfoPDF(doc.data);
              break;
            default:
              throw new Error(`ประเภทเอกสาร ${doc.type} ไม่รองรับ`);
          }

          results.push({
            type: doc.type,
            success: true,
            result: result
          });
        } catch (error) {
          results.push({
            type: doc.type,
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        results: results,
        summary: {
          total: documents.length,
          success: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      };
    } catch (error) {
      console.error('Error in batch PDF generation:', error);
      throw new Error(`ไม่สามารถสร้าง PDF แบบ Batch ได้: ${error.message}`);
    }
  }

  /**
   * ตรวจสอบข้อมูลก่อนสร้าง PDF
   * @param {string} type - ประเภทเอกสาร
   * @param {Object} data - ข้อมูลที่ต้องการตรวจสอบ
   */
  validateDocumentData(type, data) {
    const validations = {
      cs05: this._validateCS05Data,
      letter: this._validateLetterData,
      company: this._validateCompanyData
    };

    if (!validations[type]) {
      throw new Error(`ประเภทเอกสาร ${type} ไม่รองรับ`);
    }

    return validations[type](data);
  }

  _validateCS05Data(data) {
    const required = ['studentData', 'companyName', 'startDate', 'endDate'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`ข้อมูลไม่ครบถ้วน: ${missing.join(', ')}`);
    }

    return true;
  }

  _validateLetterData(data) {
    const required = ['companyName', 'contactPersonName', 'studentData'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`ข้อมูลไม่ครบถ้วน: ${missing.join(', ')}`);
    }

    return true;
  }

  _validateCompanyData(data) {
    const required = ['companyName', 'supervisorName'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`ข้อมูลไม่ครบถ้วน: ${missing.join(', ')}`);
    }

    return true;
  }
}

export default new OfficialDocumentService();