import pdfService from "./PDFService";
import templateDataService from "./TemplateDataService";
import apiClient from "../apiClient";
import {
  CS05PDFTemplate,
  OfficialLetterTemplate,
  StudentSummaryTemplate,
  CompanyInfoTemplate,
  AcceptanceLetterTemplate,
  ReferralLetterTemplate, // 🆕 เพิ่ม import
  InternshipLogbookTemplate, // 🆕 เพิ่ม import
  CertificateTemplate,
} from "../../components/internship/templates";

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
        status: isDraft ? "draft" : "final",
        ...options,
      });

      // สร้างชื่อไฟล์ - ใช้ชื่อนักศึกษาแทนรหัส
      const studentName = preparedData.studentData?.[0]?.fullName || "นักศึกษา";
      const suffix = isDraft ? "ร่าง" : "";
      const filename = this.pdfService.generateFileName(
        "cs05",
        studentName,
        suffix
      );

      // สร้างและดาวน์โหลด PDF
      const template = CS05PDFTemplate({ data: preparedData });
      await this.pdfService.generateAndDownload(template, filename);

      // 🔒 บันทึกข้อมูลไปยัง Server (ปิดชั่วคราว)
      if (
        !isDraft &&
        options.saveToServer !== false &&
        this.enableServerRecording
      ) {
        try {
          await this.savePDFRecord("CS05", preparedData, filename);
        } catch (recordError) {
          console.warn(
            "📝 PDF record save failed (but PDF generation succeeded):",
            recordError.message
          );
        }
      } else if (!this.enableServerRecording) {
        console.info(
          "ℹ️ PDF record saving is disabled. Enable by setting enableServerRecording = true"
        );
      }

      console.log(`✅ CS05 PDF generated: ${filename}`);
      return { success: true, filename, data: preparedData };
    } catch (error) {
      console.error("Error generating CS05 PDF:", error);
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
        throw new Error("ไม่มีข้อมูลสำหรับสร้างหนังสือ");
      }

      const preparedData =
        this.templateDataService.prepareOfficialLetterData(letterData);

      // ตรวจสอบ preparedData
      if (!preparedData) {
        throw new Error("ไม่สามารถเตรียมข้อมูลหนังสือได้");
      }

      // สร้างชื่อไฟล์ - ใช้ชื่อนักศึกษาแทนรหัส
      const studentName = preparedData.studentData?.[0]?.fullName || "นักศึกษา";
      const filename = this.pdfService.generateFileName(
        "official_letter",
        studentName
      );

      const template = OfficialLetterTemplate({ data: preparedData });
      await this.pdfService.generateAndDownload(template, filename);

      // 🔒 บันทึกข้อมูลไปยัง Server (ปิดชั่วคราว)
      if (options.saveToServer !== false && this.enableServerRecording) {
        try {
          await this.savePDFRecord("OFFICIAL_LETTER", preparedData, filename);
        } catch (recordError) {
          console.warn(
            "📝 PDF record save failed (but PDF generation succeeded):",
            recordError.message
          );
        }
      } else if (!this.enableServerRecording) {
        console.info(
          "ℹ️ PDF record saving is disabled. Enable by setting enableServerRecording = true"
        );
      }

      console.log(`✅ Official Letter PDF generated: ${filename}`);
      return { success: true, filename, data: preparedData };
    } catch (error) {
      console.error("Error generating Official Letter PDF:", error);
      console.error("Error stack:", error.stack);
      throw error;
    }
  }

  /**
   * สร้าง PDF สรุปข้อมูลนักศึกษา
   * @param {Object} studentData - ข้อมูลนักศึกษา
   * @param {Object} options - ตัวเลือกเพิ่มเติม
   */
  async generateStudentSummaryPDF(studentData, options = {}) {
    try {
      const preparedData =
        this.templateDataService.prepareStudentSummaryData(studentData);

      // สร้างชื่อไฟล์ - ใช้ชื่อนักศึกษา
      const studentName = preparedData.fullName || "นักศึกษา";
      const filename = this.pdfService.generateFileName(
        "student_summary",
        studentName
      );

      const template = StudentSummaryTemplate({ data: preparedData });
      await this.pdfService.generateAndDownload(template, filename);

      console.log(`✅ Student Summary PDF generated: ${filename}`);
      return { success: true, filename, data: preparedData };
    } catch (error) {
      console.error("Error generating Student Summary PDF:", error);
      throw error;
    }
  }

  /**
   * สร้าง PDF ข้อมูลสถานประกอบการ
   * @param {Object} companyData - ข้อมูลบริษัท
   * @param {Object} options - ตัวเลือกเพิ่มเติม
   */
  async generateCompanyInfoPDF(companyData, options = {}) {
    try {
      const preparedData =
        this.templateDataService.prepareCompanyInfoData(companyData);

      // สร้างชื่อไฟล์ - ใช้ชื่อนักศึกษา (ถ้ามี) หรือชื่อบริษัท
      const studentName =
        preparedData.studentData?.[0]?.fullName ||
        preparedData.companyName ||
        "ข้อมูลบริษัท";
      const filename = this.pdfService.generateFileName(
        "company_info",
        studentName
      );

      const template = CompanyInfoTemplate({ data: preparedData });
      await this.pdfService.generateAndDownload(template, filename);

      console.log(`✅ Company Info PDF generated: ${filename}`);
      return { success: true, filename, data: preparedData };
    } catch (error) {
      console.error("Error generating Company Info PDF:", error);
      throw error;
    }
  }

  /**
   * สร้าง PDF แบบฟอร์มหนังสือตอบรับ
   * @param {Object} letterData - ข้อมูลหนังสือ (สำหรับแบบฟอร์มที่มีข้อมูล)
   * @param {boolean} isBlank - สร้างแบบฟอร์มว่างหรือไม่
   * @param {Object} options - ตัวเลือกเพิ่มเติม
   */
  async generateAcceptanceFormPDF(
    letterData = null,
    isBlank = true,
    options = {}
  ) {
    try {
      // 🔧 ใช้ method ใหม่สำหรับเตรียมข้อมูลแบบฟอร์ม
      const preparedData =
        letterData && !isBlank
          ? this.templateDataService.prepareAcceptanceFormData(letterData)
          : { documentDate: new Date(), studentData: [] };

      // สร้างชื่อไฟล์
      const studentName =
        preparedData?.studentData?.[0]?.fullName || "แบบฟอร์ม";
      const suffix = isBlank ? "แบบฟอร์มว่าง" : "แบบฟอร์มมีข้อมูล";
      const filename = this.pdfService.generateFileName(
        "acceptance_letter",
        studentName,
        suffix
      );

      // สร้าง template
      const template = AcceptanceLetterTemplate({
        data: preparedData,
        isBlank: isBlank,
      });

      await this.pdfService.generateAndDownload(template, filename);

      console.log(`✅ Acceptance Form PDF generated: ${filename}`);
      return { success: true, filename, data: preparedData };
    } catch (error) {
      console.error("Error generating Acceptance Form PDF:", error);
      throw error;
    }
  }

  /**
   * แสดง Preview แบบฟอร์มหนังสือตอบรับ
   * @param {Object} letterData - ข้อมูลหนังสือ
   * @param {boolean} isBlank - แสดงแบบฟอร์มว่างหรือไม่
   */
  async previewAcceptanceForm(letterData = null, isBlank = true) {
    try {
      // 🔧 ใช้ method ใหม่สำหรับเตรียมข้อมูลแบบฟอร์ม
      const preparedData =
        letterData && !isBlank
          ? this.templateDataService.prepareAcceptanceFormData(letterData)
          : { documentDate: new Date(), studentData: [] };

      const template = AcceptanceLetterTemplate({
        data: preparedData,
        isBlank: isBlank,
      });

      await this.pdfService.previewPDF(template);
      console.log(`👁️ Acceptance Form preview opened`);
      return { success: true };
    } catch (error) {
      console.error("Error previewing Acceptance Form:", error);
      throw error;
    }
  }

  /**
   * 🆕 สร้าง PDF หนังสือส่งตัวนักศึกษา
   * @param {Object} referralData - ข้อมูลหนังสือส่งตัว
   * @param {Object} options - ตัวเลือกเพิ่มเติม
   */
  async generateReferralLetterPDF(referralData, options = {}) {
    try {
      await this.pdfService.initialize();

      // ตรวจสอบข้อมูลพื้นฐานก่อนเตรียมข้อมูล
      if (!referralData) {
        throw new Error("ไม่มีข้อมูลสำหรับสร้างหนังสือส่งตัว");
      }

      // 🔧 ใช้ method ใหม่สำหรับเตรียมข้อมูลหนังสือส่งตัว
      const preparedData =
        this.templateDataService.prepareReferralLetterData(referralData);

      // ตรวจสอบ preparedData
      if (!preparedData) {
        throw new Error("ไม่สามารถเตรียมข้อมูลหนังสือส่งตัวได้");
      }

      // สร้างชื่อไฟล์ - ใช้ชื่อนักศึกษา
      const studentName = preparedData.studentData?.[0]?.fullName || "นักศึกษา";
      const filename = this.pdfService.generateFileName(
        "referral_letter",
        studentName,
        "หนังสือส่งตัว"
      );

      // สร้าง template
      const template = ReferralLetterTemplate({ data: preparedData });
      await this.pdfService.generateAndDownload(template, filename);

      // 🔒 บันทึกข้อมูลไปยัง Server (ปิดชั่วคราว)
      if (options.saveToServer !== false && this.enableServerRecording) {
        try {
          await this.savePDFRecord("REFERRAL_LETTER", preparedData, filename);
        } catch (recordError) {
          console.warn(
            "📝 PDF record save failed (but PDF generation succeeded):",
            recordError.message
          );
        }
      } else if (!this.enableServerRecording) {
        console.info(
          "ℹ️ PDF record saving is disabled. Enable by setting enableServerRecording = true"
        );
      }

      console.log(`✅ Referral Letter PDF generated: ${filename}`);
      return { success: true, filename, data: preparedData };
    } catch (error) {
      console.error("Error generating Referral Letter PDF:", error);
      console.error("Error stack:", error.stack);
      throw new Error(`ไม่สามารถสร้างหนังสือส่งตัวได้: ${error.message}`);
    }
  }

  /**
   * 🆕 แสดง Preview หนังสือส่งตัวนักศึกษา
   * @param {Object} referralData - ข้อมูลหนังสือส่งตัว
   */
  async previewReferralLetterPDF(referralData) {
    try {
      await this.pdfService.initialize();

      // ตรวจสอบข้อมูลพื้นฐาน
      if (!referralData) {
        throw new Error("ไม่มีข้อมูลสำหรับแสดงตัวอย่างหนังสือส่งตัว");
      }

      // เตรียมข้อมูล
      const preparedData =
        this.templateDataService.prepareReferralLetterData(referralData);

      if (!preparedData) {
        throw new Error("ไม่สามารถเตรียมข้อมูลหนังสือส่งตัวได้");
      }

      // สร้าง template และแสดง preview
      const template = ReferralLetterTemplate({ data: preparedData });
      await this.pdfService.previewPDF(template);

      console.log(`👁️ Referral Letter preview opened`);
      return { success: true };
    } catch (error) {
      console.error("Error previewing Referral Letter:", error);
      throw new Error(
        `ไม่สามารถแสดงตัวอย่างหนังสือส่งตัวได้: ${error.message}`
      );
    }
  }

  /**
   * 🆕 สร้าง PDF บันทึกการฝึกงาน
   * @param {Object} logbookData - ข้อมูลบันทึกฝึกงาน
   * @param {Object} options - ตัวเลือกเพิ่มเติม
   */
  async generateInternshipLogbookPDF(logbookData, options = {}) {
    try {
      await this.pdfService.initialize();

      // ตรวจสอบข้อมูลพื้นฐาน
      if (!logbookData) {
        throw new Error("ไม่มีข้อมูลสำหรับสร้างบันทึกฝึกงาน");
      }

      // 🆕 พยายามหา userInfo จาก localStorage หรือแหล่งอื่น
      let userInfo = null;
      try {
        const cachedUserInfo = localStorage.getItem("userInfo");
        if (cachedUserInfo) {
          userInfo = JSON.parse(cachedUserInfo);
          console.log("📦 Found userInfo for logbook:", userInfo);
        }
      } catch (error) {
        console.warn("⚠️ Could not load userInfo from localStorage:", error);
      }

      // เตรียมข้อมูลสำหรับ template
      const preparedData =
        this.templateDataService.prepareInternshipLogbookData(
          logbookData,
          null, // summaryData
          userInfo // userInfo จาก localStorage
        );

      if (!preparedData) {
        throw new Error("ไม่สามารถเตรียมข้อมูลสำหรับบันทึกฝึกงานได้");
      }

      // สร้างชื่อไฟล์
      const studentName = preparedData.studentData?.[0]?.fullName || "นักศึกษา";
      const filename = this.pdfService.generateFileName(
        "internship_logbook",
        studentName
      );

      // สร้าง template
      const template = InternshipLogbookTemplate({
        logbookData: preparedData.logEntries,
        summaryData: preparedData,
        userInfo: preparedData.studentData?.[0],
      });

      // สร้างและดาวน์โหลด PDF
      await this.pdfService.generateAndDownload(template, filename);

      // 🔒 บันทึกข้อมูลไปยัง Server (ปิดชั่วคราว)
      if (options.saveToServer !== false && this.enableServerRecording) {
        try {
          await this.savePDFRecord(
            "INTERNSHIP_LOGBOOK",
            preparedData,
            filename
          );
        } catch (recordError) {
          console.warn(
            "📝 PDF record save failed (but PDF generation succeeded):",
            recordError.message
          );
        }
      } else if (!this.enableServerRecording) {
        console.info(
          "ℹ️ PDF record saving is disabled. Enable by setting enableServerRecording = true"
        );
      }

      console.log(`✅ Internship Logbook PDF generated: ${filename}`);
      return { success: true, filename, data: preparedData };
    } catch (error) {
      console.error("Error generating Internship Logbook PDF:", error);
      throw error;
    }
  }

  /**
   * 🆕 แสดง Preview บันทึกการฝึกงาน
   * @param {Object} logbookData - ข้อมูลบันทึกฝึกงาน
   */
  async previewInternshipLogbookPDF(logbookData) {
    try {
      await this.pdfService.initialize();

      // 🆕 พยายามหา userInfo จาก localStorage
      let userInfo = null;
      try {
        const cachedUserInfo = localStorage.getItem("userInfo");
        if (cachedUserInfo) {
          userInfo = JSON.parse(cachedUserInfo);
        }
      } catch (error) {
        console.warn("⚠️ Could not load userInfo for preview:", error);
      }

      const preparedData =
        this.templateDataService.prepareInternshipLogbookData(
          logbookData,
          null, // summaryData
          userInfo // userInfo จาก localStorage
        );

      const template = InternshipLogbookTemplate({
        logbookData: preparedData.logEntries,
        summaryData: preparedData,
        userInfo: preparedData.studentData?.[0],
      });

      await this.pdfService.previewPDF(template);
      console.log("👁️ Internship Logbook PDF preview opened");
      return { success: true };
    } catch (error) {
      console.error("Error previewing Internship Logbook PDF:", error);
      throw error;
    }
  }

  /**
   * อัปเดต previewPDF ให้รองรับ internship_logbook
   */
  async previewPDF(templateType, data) {
    try {
      await this.pdfService.initialize();

      let template;
      let preparedData;

      switch (templateType) {
        case "cs05":
          preparedData = this.templateDataService.prepareCS05Data(data);
          template = CS05PDFTemplate({ data: preparedData });
          break;
        case "official_letter":
          preparedData =
            this.templateDataService.prepareOfficialLetterData(data);
          template = OfficialLetterTemplate({ data: preparedData });
          break;
        case "acceptance_letter":
          preparedData =
            this.templateDataService.prepareAcceptanceFormData(data);
          template = AcceptanceLetterTemplate({
            data: preparedData,
            isBlank: data?.isBlank || false,
          });
          break;
        case "referral_letter":
        case "referral":
          preparedData =
            this.templateDataService.prepareReferralLetterData(data);
          template = ReferralLetterTemplate({ data: preparedData });
          break;
        // 🆕 เพิ่ม case สำหรับ internship_logbook
        case "internship_logbook":
        case "logbook":
          // พยายามหา userInfo จาก localStorage
          let userInfoForLogbook = null;
          try {
            const cachedUserInfo = localStorage.getItem("userInfo");
            if (cachedUserInfo) {
              userInfoForLogbook = JSON.parse(cachedUserInfo);
            }
          } catch (error) {
            console.warn("⚠️ Could not load userInfo for logbook case:", error);
          }

          preparedData = this.templateDataService.prepareInternshipLogbookData(
            data,
            null, // summaryData
            userInfoForLogbook // userInfo จาก localStorage
          );
          template = InternshipLogbookTemplate({
            logbookData: preparedData.logEntries,
            summaryData: preparedData,
            userInfo: preparedData.studentData?.[0],
          });
          break;
        case "student_summary":
        case "summary":
          preparedData =
            this.templateDataService.prepareStudentSummaryData(data);
          template = StudentSummaryTemplate({ data: preparedData });
          break;
        case "company_info":
        case "company":
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
      console.error(`Error previewing PDF ${templateType}:`, error);
      throw error;
    }
  }

  /**
   * ✅ สร้าง PDF หนังสือรับรองการฝึกงาน (แก้ไขแล้ว)
   * @param {Object} certificateData - ข้อมูลหนังสือรับรอง
   * @param {Object} options - ตัวเลือกเพิ่มเติม
   */
  async generateCertificatePDF(certificateData, options = {}) {
    try {
      // ตรวจสอบว่า pdfService พร้อมใช้งาน
      if (!this.pdfService) {
        throw new Error("PDF Service ไม่พร้อมใช้งาน");
      }

      // ตรวจสอบข้อมูลพื้นฐาน
      if (!certificateData) {
        throw new Error("ไม่มีข้อมูลสำหรับสร้างหนังสือรับรอง");
      }

      console.log("🎓 สร้างหนังสือรับรองการฝึกงาน:", certificateData);

      // เตรียมข้อมูลสำหรับ template
      const preparedData = this.prepareCertificateData(certificateData);

      if (!preparedData) {
        throw new Error("ไม่สามารถเตรียมข้อมูลหนังสือรับรองได้");
      }

      // ✅ แก้ไข: ใช้ this.pdfService.generateFileName แทน this.pdf.generateFileName
      const studentName = preparedData.studentInfo?.fullName || "นักศึกษา";
      const filename = this.pdfService.generateFileName(
        "certificate",
        studentName
      );

      // ✅ แก้ไข: ใช้ CertificateTemplate แทน this.createCertificateTemplate
      const template = CertificateTemplate({
        data: preparedData,
        isPreview: false,
      });

      // ✅ แก้ไข: ใช้ this.pdfService.generateAndDownload แทน this.downloadPDF
      await this.pdfService.generateAndDownload(template, filename);

      // 🔒 บันทึกข้อมูลไปยัง Server (ปิดชั่วคราว)
      if (options.saveToServer !== false && this.enableServerRecording) {
        try {
          await this.savePDFRecord("CERTIFICATE", preparedData, filename);
        } catch (recordError) {
          console.warn(
            "📝 PDF record save failed (but PDF generation succeeded):",
            recordError.message
          );
        }
      } else if (!this.enableServerRecording) {
        console.info(
          "ℹ️ PDF record saving is disabled. Enable by setting enableServerRecording = true"
        );
      }

      console.log(`✅ Certificate PDF generated: ${filename}`);
      return { success: true, filename, data: preparedData };
    } catch (error) {
      console.error("Error generating Certificate PDF:", error);
      throw new Error(`ไม่สามารถสร้างหนังสือรับรองได้: ${error.message}`);
    }
  }

  /**
   * ✅ แสดง Preview หนังสือรับรองการฝึกงาน (แก้ไขแล้ว)
   * @param {Object} certificateData - ข้อมูลหนังสือรับรอง
   */
  async previewCertificatePDF(certificateData) {
    try {
      // ตรวจสอบข้อมูลพื้นฐาน
      if (!certificateData) {
        throw new Error("ไม่มีข้อมูลสำหรับแสดงตัวอย่างหนังสือรับรอง");
      }

      console.log("👀 สร้างตัวอย่างหนังสือรับรอง:", certificateData);

      // เตรียมข้อมูล
      const preparedData = this.prepareCertificateData(certificateData);

      if (!preparedData) {
        throw new Error("ไม่สามารถเตรียมข้อมูลหนังสือรับรองได้");
      }

      // ✅ แก้ไข: ใช้ CertificateTemplate พร้อม watermark
      const template = CertificateTemplate({
        data: preparedData,
        isPreview: true,
      });

      // ✅ แก้ไข: ใช้ this.pdfService.previewPDF แทน this.previewPDF
      await this.pdfService.previewPDF(template);

      console.log(`👁️ Certificate preview opened`);
      return { success: true };
    } catch (error) {
      console.error("Error previewing Certificate:", error);
      throw new Error(
        `ไม่สามารถแสดงตัวอย่างหนังสือรับรองได้: ${error.message}`
      );
    }
  }

  /**
   * 🆕 เตรียมข้อมูลสำหรับหนังสือรับรองการฝึกงาน
   * @param {Object} certificateData - ข้อมูลหนังสือรับรอง
   * @returns {Object} ข้อมูลที่เตรียมแล้วสำหรับ CertificateTemplate
   */
  prepareCertificateData(certificateData) {
    try {
      // ตรวจสอบข้อมูลพื้นฐาน
      if (!certificateData) {
        throw new Error("ไม่มีข้อมูลหนังสือรับรอง");
      }

      // เตรียมข้อมูลตามโครงสร้างที่ CertificateTemplate ต้องการ
      const preparedData = {
        // ข้อมูลเอกสาร
        documentInfo: {
          certificateNumber:
            certificateData.certificateNumber ||
            this.generateCertificateNumber(),
          issueDate: certificateData.issueDate || new Date(),
          documentDate: certificateData.documentDate || new Date(),
          validityPeriod: "ไม่มีกำหนดหมดอายุ",
          purpose:
            certificateData.purpose ||
            "เพื่อใช้เป็นหลักฐานการฝึกงานตามหลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
        },

        // ข้อมูลนักศึกษา
        studentInfo: {
          studentId:
            certificateData.studentInfo?.studentId || certificateData.studentId,
          firstName:
            certificateData.studentInfo?.firstName || certificateData.firstName,
          lastName:
            certificateData.studentInfo?.lastName || certificateData.lastName,
          fullName:
            certificateData.studentInfo?.fullName ||
            `${certificateData.firstName || ""} ${
              certificateData.lastName || ""
            }`.trim(),
          yearLevel:
            certificateData.studentInfo?.yearLevel || certificateData.yearLevel,
          classroom:
            certificateData.studentInfo?.classroom || certificateData.classroom,
          department: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          faculty: "คณะวิทยาศาสตร์ประยุกต์",
          university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
        },

        // ข้อมูลบริษัทและการฝึกงาน
        internshipInfo: {
          companyName:
            certificateData.companyName ||
            certificateData.internshipInfo?.companyName,
          companyAddress:
            certificateData.companyAddress ||
            certificateData.internshipInfo?.companyAddress,
          startDate:
            certificateData.startDate ||
            certificateData.internshipInfo?.startDate,
          endDate:
            certificateData.endDate || certificateData.internshipInfo?.endDate,
          totalDays:
            certificateData.totalDays ||
            certificateData.internshipInfo?.totalDays,
          totalHours:
            certificateData.totalHours ||
            certificateData.internshipInfo?.totalHours,
          supervisorName:
            certificateData.supervisorName ||
            certificateData.internshipInfo?.supervisorName,
          supervisorPosition:
            certificateData.supervisorPosition ||
            certificateData.internshipInfo?.supervisorPosition,
          supervisorPhone:
            certificateData.supervisorPhone ||
            certificateData.internshipInfo?.supervisorPhone,
          supervisorEmail:
            certificateData.supervisorEmail ||
            certificateData.internshipInfo?.supervisorEmail,
        },

        // ข้อมูลการประเมิน (ถ้ามี)
        evaluationInfo: certificateData.evaluationInfo || null,

        // ข้อมูลผู้อนุมัติ
        approvalInfo: {
          approvedBy:
            certificateData.approvedBy || "ผู้ช่วยศาสตราจารย์ ดร.อภิชาต บุญมา",
          approverTitle:
            certificateData.approverTitle ||
            "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          approvedDate: certificateData.approvedDate || new Date(),
          departmentName: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          facultyName: "คณะวิทยาศาสตร์ประยุกต์",
          universityName: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
        },

        // Metadata สำหรับ PDF
        metadata: {
          templateType: "certificate",
          fileName: `หนังสือรับรองการฝึกงาน-${
            certificateData.studentInfo?.studentId || certificateData.studentId
          }`,
          title: "หนังสือรับรองการฝึกงาน",
          subject: `หนังสือรับรองการฝึกงาน - ${
            certificateData.studentInfo?.fullName || certificateData.fullName
          }`,
          author: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
          keywords: ["หนังสือรับรอง", "การฝึกงาน", "วิทยาการคอมพิวเตอร์"],
        },
      };

      console.log("✅ Certificate data prepared successfully");
      return preparedData;
    } catch (error) {
      console.error("❌ Error preparing certificate data:", error);
      throw new Error(
        `ไม่สามารถเตรียมข้อมูลหนังสือรับรองได้: ${error.message}`
      );
    }
  }

  /**
   * 🆕 สร้างหมายเลขหนังสือรับรอง
   * @returns {string} หมายเลขหนังสือรับรอง
   */
  generateCertificateNumber() {
    const year = new Date().getFullYear() + 543; // พ.ศ.
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 999)
      .toString()
      .padStart(3, "0");

    return `อว 7105(16)/${month}${year.toString().slice(-2)}-${random}`;
  }

  /**
   * อัปเดต generateBatchPDFs ให้รองรับ INTERNSHIP_LOGBOOK
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
            case "CS05":
              result = await this.generateCS05PDF(
                doc.data,
                doc.isDraft,
                options
              );
              break;
            case "OFFICIAL_LETTER":
              result = await this.generateOfficialLetterPDF(doc.data, options);
              break;
            case "ACCEPTANCE_LETTER":
              result = await this.generateAcceptanceFormPDF(
                doc.data,
                doc.isBlank,
                options
              );
              break;
            case "REFERRAL_LETTER":
              result = await this.generateReferralLetterPDF(doc.data, options);
              break;
            // 🆕 เพิ่ม case สำหรับ INTERNSHIP_LOGBOOK
            case "INTERNSHIP_LOGBOOK":
              result = await this.generateInternshipLogbookPDF(
                doc.data,
                options
              );
              break;
            // 🆕 เพิ่ม case สำหรับ CERTIFICATE
            case "CERTIFICATE":
              result = await this.generateCertificatePDF(doc.data, options);
              break;
            case "STUDENT_SUMMARY":
              result = await this.generateStudentSummaryPDF(doc.data, options);
              break;
            case "COMPANY_INFO":
              result = await this.generateCompanyInfoPDF(doc.data, options);
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
            documentId: doc.id,
          });
          errorCount++;
        }
      }

      console.log(
        `📊 Batch PDF generation completed: ${successCount} success, ${errorCount} errors`
      );
      return {
        success: errorCount === 0,
        results,
        summary: { successCount, errorCount, total: documents.length },
      };
    } catch (error) {
      console.error("Error in batch PDF generation:", error);
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
        studentName: data.studentData?.[0]?.fullName, // เพิ่มชื่อนักศึกษา
        companyName: data.companyName,
        createdDate: new Date().toISOString(),
        status: "generated",
      };

      console.log("📋 API Request:", {
        method: "post",
        url: "/documents/pdf-records",
        data: metadata,
      });

      // 🚫 ปิดการเรียก API ชั่วคราว - จะเปิดเมื่อมี Backend API พร้อม
      const response = await apiClient.post("/documents/pdf-records", metadata);

      if (response.data.success) {
        console.log("✅ PDF record saved:", response.data.data);
        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "ไม่สามารถบันทึกข้อมูล PDF ได้"
        );
      }
    } catch (error) {
      console.error("❌ Error saving PDF record:", error.message);

      // ไม่ throw error เพื่อไม่ให้ส่งผลต่อการสร้าง PDF
      console.warn("⚠️ PDF record not saved, but PDF generation continues");
    }
  }

  /**
   * ดึงประวัติการสร้าง PDF
   * 🔒 ฟังก์ชันนี้ถูกปิดใช้งานชั่วคราว เนื่องจากยังไม่มี Backend API
   */
  async getPDFHistory(filters = {}) {
    try {
      // 🚫 ปิดการเรียก API ชั่วคราว
      console.warn(
        "⚠️ getPDFHistory: Using mock data - Backend API not available yet"
      );
      return {
        success: true,
        data: [], // Mock empty history
        message: "Backend API ยังไม่พร้อม - แสดงข้อมูลจำลอง",
      };
    } catch (error) {
      console.error("Error fetching PDF history:", error);

      // Return fallback data แทนการ throw error
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  }

  /**
   * 🔧 เปิด/ปิดการบันทึก PDF Records
   */
  setServerRecording(enabled) {
    this.enableServerRecording = enabled;
    console.log(`🔧 PDF Server Recording ${enabled ? "ENABLED" : "DISABLED"}`);

    if (enabled) {
      console.info("✅ PDF records will be saved to backend when available");
    } else {
      console.info("❌ PDF records will NOT be saved to backend");
    }
  }

  /**
   * 📊 ตรวจสอบการตั้งค่าการบันทึก
   */
  getRecordingStatus() {
    return {
      enabled: this.enableServerRecording,
      reason: this.enableServerRecording
        ? "Backend recording is enabled"
        : "Backend API not available - recording disabled",
      requiredEndpoints: [
        "POST /api/documents/pdf-records",
        "GET /api/documents/pdf-records",
        "DELETE /api/documents/pdf-records/:id",
      ],
    };
  }

  /**
   * ตรวจสอบสถานะของ Official Document Service
   */
  getStatus() {
    return {
      ...this.pdfService.getStatus(),
      availableTemplates: [
        "CS05",
        "OFFICIAL_LETTER",
        "ACCEPTANCE_LETTER",
        "REFERRAL_LETTER",
        "CERTIFICATE", // 🆕 เพิ่มใหม่
        "INTERNSHIP_LOGBOOK",
        "STUDENT_SUMMARY",
        "COMPANY_INFO",
      ],
      serviceVersion: "1.7.0", // อัปเดตเวอร์ชัน
      recordingStatus: this.getRecordingStatus(),
    };
  }
}

// สร้าง instance เดียวสำหรับทั้งระบบ
const officialDocumentService = new OfficialDocumentService();

export default officialDocumentService;
