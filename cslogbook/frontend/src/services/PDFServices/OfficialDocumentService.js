import pdfService from "./PDFService";
import templateDataService from "./TemplateDataService";
import apiClient from "../apiClient";
import {
  CS05PDFTemplate,
  OfficialLetterTemplate,
  StudentSummaryTemplate,
  CompanyInfoTemplate,
  AcceptanceLetterTemplate,
  ReferralLetterTemplate,
  InternshipLogbookTemplate,
  CertificateTemplate,
} from "../../components/internship/templates";

class OfficialDocumentService {
  constructor() {
    this.pdfService = pdfService;
    this.templateDataService = templateDataService;
    this.enableServerRecording = false;
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
   * ✅ สร้าง PDF หนังสือรับรองการฝึกงาน (แก้ไขให้รองรับโครงสร้างใหม่)
   * @param {Object} certificateData - ข้อมูลหนังสือรับรองจาก API
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

      console.log("🎓 Starting certificate PDF generation with data:", certificateData);

      // ✅ เตรียมข้อมูลสำหรับ template ด้วย method ใหม่
      const preparedData = this.prepareCertificateDataNew(certificateData);

      if (!preparedData) {
        throw new Error("ไม่สามารถเตรียมข้อมูลหนังสือรับรองได้");
      }

      console.log("📋 Prepared data for PDF:", preparedData);

      // สร้างชื่อไฟล์
      const studentName = preparedData.studentName || preparedData.fullName || "นักศึกษา";
      const filename = this.pdfService.generateFileName("certificate", studentName);

      // ✅ สร้าง template พร้อมข้อมูลที่เตรียมแล้ว
  const template = CertificateTemplate({ data: preparedData, isPreview: false });

      // สร้างและดาวน์โหลด PDF
      await this.pdfService.generateAndDownload(template, filename);

      console.log(`✅ Certificate PDF generated successfully: ${filename}`);
      return { success: true, filename, data: preparedData };

    } catch (error) {
      console.error("❌ Error generating Certificate PDF:", error);
      throw new Error(`ไม่สามารถสร้างหนังสือรับรองได้: ${error.message}`);
    }
  }

  /**
   * ✅ แสดง Preview หนังสือรับรองการฝึกงาน (แก้ไขให้รองรับโครงสร้างใหม่)
   * @param {Object} certificateData - ข้อมูลหนังสือรับรอง
   */
  async previewCertificatePDF(certificateData) {
    try {
      // ตรวจสอบข้อมูลพื้นฐาน
      if (!certificateData) {
        throw new Error("ไม่มีข้อมูลสำหรับแสดงตัวอย่างหนังสือรับรอง");
      }

      console.log("👀 Starting certificate preview with data:", certificateData);

      // ✅ เตรียมข้อมูลด้วย method ใหม่
      const preparedData = this.prepareCertificateDataNew(certificateData);

      if (!preparedData) {
        throw new Error("ไม่สามารถเตรียมข้อมูลหนังสือรับรองได้");
      }

      console.log("📋 Prepared data for preview:", preparedData);

      // สร้าง template พร้อม watermark สำหรับ preview
  const template = CertificateTemplate({ data: preparedData, isPreview: true });

      // แสดง preview
      await this.pdfService.previewPDF(template);

      console.log(`👁️ Certificate preview opened successfully`);
      return { success: true };

    } catch (error) {
      console.error("❌ Error previewing Certificate:", error);
      throw new Error(`ไม่สามารถแสดงตัวอย่างหนังสือรับรองได้: ${error.message}`);
    }
  }

  /**
   * 🆕 เตรียมข้อมูลสำหรับหนังสือรับรองการฝึกงาน (เพิ่มการค้นหา Company ครอบคลุม)
   * @param {Object} certificateData - ข้อมูลหนังสือรับรองจาก API
   * @returns {Object} ข้อมูลที่เตรียมแล้วสำหรับ CertificateTemplate
   */
  prepareCertificateDataNew(certificateData) {
    try {
      console.log("🔄 Preparing certificate data with new structure:", certificateData);

      // ตรวจสอบข้อมูลพื้นฐาน
      if (!certificateData) {
        throw new Error("ไม่มีข้อมูลหนังสือรับรอง");
      }

      // ✅ ฟังก์ชันทำความสะอาดข้อความภาษาไทย
      const cleanThaiText = (text) => {
        if (!text) return '';
        const str = text.toString().trim();
        // ใช้ whitelist: เก็บอักษรไทย อังกฤษ ตัวเลข ช่องว่าง และสัญลักษณ์ทั่วไป แทนการลบ control ranges ตรงๆ เพื่อลด lint warning
        return str.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9 ,./()\-_%@]/g, '');
      };

      // ✅ รองรับทั้งโครงสร้างแบบ nested และ flat
      // ตรวจสอบข้อมูลจาก root level ก่อน (กรณี flat structure)
      const hasRootLevelData = certificateData.studentName || certificateData.studentId || certificateData.fullName;
      
      let studentInfo, certificateRequest, requirements, internshipInfo;

      if (hasRootLevelData) {
        // ✅ กรณีข้อมูลอยู่ใน root level (flat structure)
        console.log("📋 Using flat structure data");
        studentInfo = {
          fullName: certificateData.fullName || certificateData.studentName || '',
          studentId: certificateData.studentId || '',
          firstName: certificateData.firstName || '',
          lastName: certificateData.lastName || '',
          email: certificateData.email || '',
          yearLevel: certificateData.yearLevel || certificateData.year || 4,
          classroom: certificateData.classroom || certificateData.class || ''
        };
        
        certificateRequest = {
          requestDate: certificateData.certificateDate || certificateData.requestDate || new Date(),
          status: certificateData.status || 'ready'
        };
        
        requirements = {
          totalHours: {
            current: certificateData.totalHours || 240
          }
        };
        
        // ✅ ปรับปรุงการค้นหาข้อมูล Company ให้ครอบคลุมมากขึ้น
        internshipInfo = {
          companyName: certificateData.companyName || 
                       certificateData.company_name ||
                       certificateData.company?.name ||
                       certificateData.company?.companyName ||
                       '',
          companyAddress: certificateData.companyAddress || 
                          certificateData.company_address ||
                          certificateData.company?.address ||
                          certificateData.company?.companyAddress ||
                          '',
          supervisorName: certificateData.supervisorName || 
                          certificateData.supervisor_name ||
                          certificateData.supervisor?.name ||
                          '',
          supervisorPosition: certificateData.supervisorPosition || 
                             certificateData.supervisor_position ||
                             certificateData.supervisor?.position ||
                             '',
          startDate: certificateData.internshipStartDate || 
                     certificateData.startDate ||
                     certificateData.start_date,
          endDate: certificateData.internshipEndDate || 
                   certificateData.endDate ||
                   certificateData.end_date
        };
      } else {
        // ✅ กรณีข้อมูลอยู่ใน nested structure
        console.log("📋 Using nested structure data");
        studentInfo = certificateData.studentInfo || {};
        certificateRequest = certificateData.certificateRequest || {};
        requirements = certificateData.requirements || {};
        
        // ✅ ปรับปรุงการค้นหาข้อมูล Company จาก nested structure
        const rawInternshipInfo = certificateData.internshipInfo || 
                                 certificateData.companyInfo || 
                                 certificateData.company || 
                                 {};
        
        internshipInfo = {
          companyName: rawInternshipInfo.companyName || 
                       rawInternshipInfo.company_name ||
                       rawInternshipInfo.name ||
                       certificateData.companyName ||
                       '',
          companyAddress: rawInternshipInfo.companyAddress || 
                          rawInternshipInfo.company_address ||
                          rawInternshipInfo.address ||
                          certificateData.companyAddress ||
                          '',
          supervisorName: rawInternshipInfo.supervisorName || 
                          rawInternshipInfo.supervisor_name ||
                          rawInternshipInfo.supervisor?.name ||
                          certificateData.supervisorName ||
                          '',
          supervisorPosition: rawInternshipInfo.supervisorPosition || 
                             rawInternshipInfo.supervisor_position ||
                             rawInternshipInfo.supervisor?.position ||
                             certificateData.supervisorPosition ||
                             '',
          startDate: rawInternshipInfo.startDate || 
                     rawInternshipInfo.start_date ||
                     certificateData.startDate,
          endDate: rawInternshipInfo.endDate || 
                   rawInternshipInfo.end_date ||
                   certificateData.endDate
        };
      }

      // ✅ เพิ่ม Debug logging สำหรับข้อมูล Company โดยเฉพาะ
      console.log("🔍 Processed student info:", studentInfo);
      console.log("🔍 Processed certificate request:", certificateRequest);
      console.log("🏢 Processed company/internship info:", internshipInfo);
      console.log("🔍 Company name detection:", {
        fromInternshipInfo: internshipInfo.companyName,
        fromCertificateData: certificateData.companyName,
        fromCompany: certificateData.company?.name,
        fromCompanyInfo: certificateData.companyInfo?.companyName,
        allCompanyFields: Object.keys(certificateData).filter(key => 
          key.toLowerCase().includes('company') || 
          key.toLowerCase().includes('internship')
        )
      });

      // ✅ Enhanced Company Name Detection - ค้นหาจากทุกแหล่งที่เป็นไปได้
      const detectCompanyName = () => {
        const possibleSources = [
          // จาก internshipInfo ที่ประมวลผลแล้ว
          internshipInfo.companyName,
          
          // จาก root level
          certificateData.companyName,
          certificateData.company_name,
          
          // จาก nested objects
          certificateData.company?.name,
          certificateData.company?.companyName,
          certificateData.companyInfo?.companyName,
          certificateData.companyInfo?.name,
          certificateData.internshipInfo?.companyName,
          certificateData.internshipInfo?.company_name,
          
          // จาก CS05 form data (ถ้ามี)
          certificateData.cs05Data?.companyName,
          certificateData.formData?.companyName,
          
          // จาก array ของ companies (ถ้ามี)
          certificateData.companies?.[0]?.name,
          certificateData.companies?.[0]?.companyName,
          
          // จาก user data หรือ profile
          certificateData.profile?.currentCompany,
          certificateData.userData?.company,
          
          // จาก document metadata
          certificateData.documentData?.companyName,
          certificateData.metadata?.companyName
        ];
        
        for (const source of possibleSources) {
          if (source && typeof source === 'string' && source.trim()) {
            console.log("✅ Found company name from source:", source);
            return cleanThaiText(source);
          }
        }
        
        console.warn("⚠️ No company name found in any source");
        return '';
      };

      const detectedCompanyName = detectCompanyName();

      // ✅ จัดรูปแบบข้อมูลให้ตรงกับ CertificateTemplate
      const preparedData = {
        // ข้อมูลนักศึกษา - รองรับทั้งสองโครงสร้าง
        studentName: cleanThaiText(studentInfo.fullName || studentInfo.firstName || studentInfo.studentName || ''),
        studentId: cleanThaiText(studentInfo.studentId || ''),
        fullName: cleanThaiText(studentInfo.fullName || studentInfo.studentName || ''),
        firstName: cleanThaiText(studentInfo.firstName || ''),
        lastName: cleanThaiText(studentInfo.lastName || ''),
        email: cleanThaiText(studentInfo.email || ''),
        
        // ข้อมูลระดับการศึกษาและสาขา
        yearLevel: parseInt(studentInfo.yearLevel || studentInfo.year || 4),
        classroom: cleanThaiText(studentInfo.classroom || studentInfo.class || ''),
        department: "ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
        faculty: "คณะวิทยาศาสตร์ประยุกต์",
        university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",

        // ✅ ข้อมูลการฝึกงาน - ใช้ข้อมูลที่ตรวจจับได้
        companyName: detectedCompanyName || 'สถานประกอบการที่ฝึกงาน',
        companyAddress: cleanThaiText(
          internshipInfo.companyAddress || 
          certificateData.companyAddress || 
          'ที่อยู่สถานประกอบการ'
        ),
        
        // ข้อมูลระยะเวลาฝึกงาน
        internshipStartDate: internshipInfo.startDate || certificateData.startDate || '2025-01-01',
        internshipEndDate: internshipInfo.endDate || certificateData.endDate || '2025-03-01',
        totalHours: parseInt(
          requirements.totalHours?.current || 
          internshipInfo.totalHours || 
          certificateData.totalHours || 
          240
        ),
        totalDays: this.calculateDaysFromHours(
          requirements.totalHours?.current || 
          certificateData.totalHours || 
          240
        ),
        
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
        certificateDate: certificateRequest.requestDate ? 
          new Date(certificateRequest.requestDate) : 
          (certificateData.certificateDate ? new Date(certificateData.certificateDate) : new Date()),
        // ใช้หมายเลขที่มาจากต้นทางหากมี เพื่อความคงที่ ลดการสุ่มซ้ำ
        certificateNumber: certificateData.certificateNumber || this.generateCertificateNumber(),
        // Override isCompleted ถ้าต้นทางส่ง isCompleted = true มาแล้ว
        isCompleted: certificateData.isCompleted === true ? true : (
          certificateRequest.status === 'approved' || 
          certificateData.status === 'ready' ||
          certificateData.status === 'approved'
        ),
        
        // ข้อมูลการอนุมัติ
        approvedBy: cleanThaiText("นางสาวจันทิมา อรรฆจิตต์"),
        approverTitle: cleanThaiText("นักวิชาการศึกษา"),
        approvedDate: certificateRequest.requestDate ? 
          new Date(certificateRequest.requestDate) : 
          new Date(),

        // ✅ ข้อมูลเพิ่มเติมสำหรับ debug
        debug: {
          originalData: certificateData,
          dataStructure: hasRootLevelData ? 'flat' : 'nested',
          studentInfoFound: !!(studentInfo.fullName || studentInfo.firstName || studentInfo.studentName),
          studentIdFound: !!studentInfo.studentId,
          companyNameFound: !!detectedCompanyName,
          companyNameSource: detectedCompanyName ? 'detected' : 'none',
          certificateStatus: certificateData.status,
          requestStatus: certificateRequest.status,
          totalHoursFromRequirements: requirements.totalHours?.current,
          processedStudentInfo: studentInfo,
          processedInternshipInfo: internshipInfo,
          companyDetectionLog: {
            detectedCompanyName,
            internshipInfoCompanyName: internshipInfo.companyName,
            rootLevelCompanyName: certificateData.companyName,
            nestedCompanyName: certificateData.company?.name,
            allCompanyFields: Object.keys(certificateData).filter(key => 
              key.toLowerCase().includes('company') || 
              key.toLowerCase().includes('internship')
            )
          }
        }
      };

      console.log("✅ Certificate data prepared successfully:", {
        dataStructure: preparedData.debug.dataStructure,
        studentName: preparedData.studentName,
        studentId: preparedData.studentId,
        companyName: preparedData.companyName,
        companyNameFound: preparedData.debug.companyNameFound,
        totalHours: preparedData.totalHours,
        isCompleted: preparedData.isCompleted,
        debugInfo: preparedData.debug
      });
      
      return preparedData;

    } catch (error) {
      console.error("❌ Error preparing certificate data:", error);
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
   * สร้างหมายเลขหนังสือรับรอง
   * @returns {string} หมายเลขหนังสือรับรอง
   */
  generateCertificateNumber() {
    const year = new Date().getFullYear() + 543; // พ.ศ.
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    
    return `อว 7105(05)/${year}${month}${randomNum}`;
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
        "CERTIFICATE", // ✅ รองรับโครงสร้างทั้งสองแบบ
        "INTERNSHIP_LOGBOOK",
        "STUDENT_SUMMARY",
        "COMPANY_INFO",
      ],
      serviceVersion: "1.9.0", // อัปเดตเวอร์ชัน
      recordingStatus: this.getRecordingStatus(),
      newFeatures: [
        "Flexible Data Structure Support", // ใหม่!
        "Root Level Data Processing", // ใหม่!
        "Enhanced Debug Logging",
        "Improved Error Handling"
      ]
    };
  }
}

// สร้าง instance เดียวสำหรับทั้งระบบ
const officialDocumentService = new OfficialDocumentService();

export default officialDocumentService;
