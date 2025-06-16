import { message } from "antd";
import officialDocumentService from "../../../../services/PDFServices/OfficialDocumentService";
import pdfService from "../../../../services/PDFServices/PDFService";
import templateDataService from "../../../../services/PDFServices/TemplateDataService";
import { ReferralLetterTemplate } from "../../templates";

/**
 * Helper functions สำหรับจัดการ PDF Operations
 */

/**
 * เตรียมข้อมูลสำหรับ PDF
 * @param {Object} existingCS05 - ข้อมูล CS05 ที่มีอยู่
 * @param {Object} formData - ข้อมูลฟอร์ม
 * @param {Object} studentData - ข้อมูลนักศึกษา
 * @returns {Object|null} - ข้อมูลที่เตรียมแล้วสำหรับ PDF
 */
export const prepareFormDataForPDF = (existingCS05, formData, studentData) => {
  try {
    const displayData = existingCS05 || formData || {};

    return {
      // ข้อมูลเอกสาร
      documentNumber: "", // จะถูกสร้างอัตโนมัติ
      documentDate: new Date(),

      // ข้อมูลบริษัท
      companyName: displayData.companyName || "",
      companyAddress: displayData.companyAddress || "",
      contactPersonName: displayData.contactPersonName || "",
      contactPersonPosition: displayData.contactPersonPosition || "",
      internshipPosition: displayData.internshipPosition || "",

      // ข้อมูลนักศึกษา
      studentData:
        displayData.studentData ||
        (studentData
          ? [
              {
                fullName: studentData.fullName,
                studentId: studentData.studentId,
                yearLevel: studentData.year || 3,
                classroom: studentData.classroom || "",
                phoneNumber: studentData.phoneNumber || "",
                totalCredits: studentData.totalCredits || 0,
              },
            ]
          : []),

      // ข้อมูลระยะเวลาฝึกงาน
      startDate: displayData.startDate || "",
      endDate: displayData.endDate || "",
      internshipDays: displayData.internshipDuration || 0,

      // ข้อมูลอาจารย์ (ค่าเริ่มต้น)
      advisorName: "ผู้ช่วยศาสตราจารย์ ดร.อภิชาต บุญมา",
      advisorTitle: "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ",
    };
  } catch (error) {
    console.error("Error preparing PDF data:", error);
    message.error("เกิดข้อผิดพลาดในการเตรียมข้อมูล PDF");
    return null;
  }
};

/**
 * Preview PDF หนังสือขอความอนุเคราะห์
 * @param {Function} prepareData - Function สำหรับเตรียมข้อมูล
 * @param {Function} setLoading - Function สำหรับจัดการ loading state
 */
export const handlePreviewPDF = async (prepareData, setLoading) => {
  setLoading(true);
  try {
    const pdfData = prepareData();
    if (!pdfData) return;

    await officialDocumentService.previewPDF("official_letter", pdfData);
    message.info("เปิดตัวอย่างหนังสือขอความอนุเคราะห์ในแท็บใหม่");
  } catch (error) {
    console.error("Error previewing PDF:", error);
    message.error(
      "ไม่สามารถแสดงตัวอย่าง PDF ได้: " +
        (error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ")
    );
  } finally {
    setLoading(false);
  }
};

/**
 * สร้างหนังสือขอความอนุเคราะห์
 * @param {Function} prepareData - Function สำหรับเตรียมข้อมูล
 * @param {Function} setLoading - Function สำหรับจัดการ loading state
 */
export const handleGenerateOfficialLetter = async (prepareData, setLoading) => {
  setLoading(true);
  try {
    const pdfData = prepareData();
    if (!pdfData) return;

    await officialDocumentService.generateOfficialLetterPDF(pdfData);
    message.success("สร้างหนังสือขอความอนุเคราะห์สำเร็จ!");
  } catch (error) {
    console.error("Error generating official letter:", error);
    message.error(
      "ไม่สามารถสร้างหนังสือขอความอนุเคราะห์ได้: " +
        (error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ")
    );
  } finally {
    setLoading(false);
  }
};

/**
 * สร้างแบบฟอร์มหนังสือตอบรับ
 * @param {Function} prepareData - Function สำหรับเตรียมข้อมูล
 * @param {Function} setLoading - Function สำหรับจัดการ loading state
 * @param {boolean} isBlank - เป็นแบบฟอร์มว่างหรือไม่
 */
export const handleGenerateAcceptanceForm = async (prepareData, setLoading, isBlank = true) => {
  setLoading(true);
  try {
    const pdfData = isBlank ? null : prepareData();

    await officialDocumentService.generateAcceptanceFormPDF(pdfData, isBlank);

    const formType = isBlank ? "แบบฟอร์มว่าง" : "แบบฟอร์มที่มีข้อมูล";
    message.success(`สร้าง${formType}หนังสือตอบรับสำเร็จ!`);
  } catch (error) {
    console.error("Error generating acceptance form:", error);
    message.error(
      "ไม่สามารถสร้างแบบฟอร์มหนังสือตอบรับได้: " +
        (error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ")
    );
  } finally {
    setLoading(false);
  }
};

/**
 * Preview แบบฟอร์มหนังสือตอบรับ
 * @param {Function} prepareData - Function สำหรับเตรียมข้อมูล
 * @param {Function} setLoading - Function สำหรับจัดการ loading state
 * @param {boolean} isBlank - เป็นแบบฟอร์มว่างหรือไม่
 */
export const handlePreviewAcceptanceForm = async (prepareData, setLoading, isBlank = true) => {
  setLoading(true);
  try {
    const pdfData = isBlank ? null : prepareData();

    await officialDocumentService.previewAcceptanceForm(pdfData, isBlank);

    const formType = isBlank ? "แบบฟอร์มว่าง" : "แบบฟอร์มที่มีข้อมูล";
    message.info(`เปิดตัวอย่าง${formType}หนังสือตอบรับในแท็บใหม่`);
  } catch (error) {
    console.error("Error previewing acceptance form:", error);
    message.error(
      "ไม่สามารถแสดงตัวอย่างแบบฟอร์มได้: " +
        (error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ")
    );
  } finally {
    setLoading(false);
  }
};

/**
 * สร้างหนังสือส่งตัว
 * @param {Function} prepareData - Function สำหรับเตรียมข้อมูล
 * @param {Object} existingCS05 - ข้อมูล CS05 ที่มีอยู่
 * @param {Function} setLoading - Function สำหรับจัดการ loading state
 * @param {Function} setReferralLetterStatus - Function สำหรับอัปเดตสถานะหนังสือส่งตัว
 * @param {Function} setCurrentStep - Function สำหรับอัปเดตขั้นตอน
 * @param {Object} internshipService - Service สำหรับ API calls
 */
export const handleGenerateReferralLetter = async (
  prepareData,
  existingCS05,
  setLoading,
  setReferralLetterStatus,
  setCurrentStep,
  internshipService
) => {
  setLoading(true);
  try {
    const pdfData = prepareData();
    if (!pdfData) return;

    // เพิ่มข้อมูลเฉพาะสำหรับหนังสือส่งตัว
    const referralData = {
      ...pdfData,
      supervisorName: existingCS05?.supervisorName || "",
      supervisorPosition: existingCS05?.supervisorPosition || "",
      supervisorPhone: existingCS05?.supervisorPhone || "",
      supervisorEmail: existingCS05?.supervisorEmail || "",
    };

    // สร้าง PDF
    await pdfService.initialize();
    const preparedData = templateDataService.prepareReferralLetterData(referralData);
    const template = <ReferralLetterTemplate data={preparedData} />;
    const filename = pdfService.generateFileName(
      "referral_letter",
      preparedData.studentData?.[0]?.fullName || "นักศึกษา",
      "หนังสือส่งตัวฝึกงาน"
    );

    await pdfService.generateAndDownload(template, filename);
    message.success("สร้างหนังสือส่งตัวสำเร็จ!");

    // อัปเดต Frontend State
    setReferralLetterStatus("downloaded");
    setCurrentStep(7);

    console.log("✅ อัปเดต Frontend state เรียบร้อย");

    // เรียก Backend API เพื่อซิงค์ข้อมูล
    if (existingCS05?.documentId) {
      try {
        const response = await internshipService.markReferralLetterDownloaded(
          existingCS05.documentId
        );
        console.log("✅ อัปเดตสถานะใน Backend สำเร็จ:", response);

        if (response.data?.shouldUpdateCS05Status) {
          await internshipService.updateCS05Status(
            existingCS05.documentId,
            "referral_downloaded"
          );
          console.log("✅ อัปเดต CS05 status ใน Backend เป็น referral_downloaded");
        }
      } catch (apiError) {
        console.warn("⚠️ Backend API Error (ไม่กระทบการทำงาน):", apiError.message);

        // Fallback: เก็บใน localStorage
        localStorage.setItem(`referral_downloaded_${existingCS05.documentId}`, "true");
        localStorage.setItem(`cs05_status_${existingCS05.documentId}`, "referral_downloaded");
      }
    }
  } catch (error) {
    console.error("Error generating referral letter:", error);
    message.error(
      "ไม่สามารถสร้างหนังสือส่งตัวได้: " +
        (error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ")
    );
  } finally {
    setLoading(false);
  }
};

/**
 * Preview หนังสือส่งตัว
 * @param {Function} prepareData - Function สำหรับเตรียมข้อมูล
 * @param {Object} existingCS05 - ข้อมูล CS05 ที่มีอยู่
 * @param {Function} setLoading - Function สำหรับจัดการ loading state
 */
export const handlePreviewReferralLetter = async (prepareData, existingCS05, setLoading) => {
  setLoading(true);
  try {
    const pdfData = prepareData();
    if (!pdfData) return;

    const referralData = {
      ...pdfData,
      supervisorName: existingCS05?.supervisorName || "",
      supervisorPosition: existingCS05?.supervisorPosition || "",
      supervisorPhone: existingCS05?.supervisorPhone || "",
      supervisorEmail: existingCS05?.supervisorEmail || "",
    };

    await pdfService.initialize();
    const preparedData = templateDataService.prepareReferralLetterData(referralData);
    const template = <ReferralLetterTemplate data={preparedData} />;

    await pdfService.previewPDF(template);
    message.info("เปิดตัวอย่างหนังสือส่งตัวในแท็บใหม่");
  } catch (error) {
    console.error("Error previewing referral letter:", error);
    message.error(
      "ไม่สามารถแสดงตัวอย่างหนังสือส่งตัวได้: " +
        (error.message || "เกิดข้อผิดพลาดไม่ทราบสาเหตุ")
    );
  } finally {
    setLoading(false);
  }


};