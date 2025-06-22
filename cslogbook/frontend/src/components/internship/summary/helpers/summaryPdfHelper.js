import { message } from "antd";
import pdfService from "../../../../services/PDFServices/PDFService";
import templateDataService from "../../../../services/PDFServices/TemplateDataService";
import officialDocumentService from "../../../../services/PDFServices/OfficialDocumentService";
import { InternshipLogbookTemplate } from "../../templates";
import dayjs from "dayjs";

/**
 * Helper functions สำหรับ PDF Operations ในหน้า Summary
 */

/**
 * เตรียมข้อมูลสำหรับ PDF Template บันทึกฝึกงาน
 * @param {Object} summaryData - ข้อมูลสรุปการฝึกงาน
 * @param {Array} logEntries - รายการบันทึกการฝึกงาน
 * @param {Object} reflection - บทสรุปประสบการณ์
 * @param {number} totalApprovedHours - จำนวนชั่วโมงที่ได้รับการอนุมัติ
 * @returns {Object|null} - ข้อมูลที่เตรียมแล้วสำหรับ PDF
 */
export const prepareSummaryDataForPDF = (summaryData, logEntries, reflection, totalApprovedHours) => {
  try {
    if (!summaryData || !logEntries || logEntries.length === 0) {
      throw new Error("ข้อมูลไม่เพียงพอสำหรับสร้าง PDF");
    }

    return {
      // ข้อมูลเอกสาร
      documentId: summaryData.documentId || `LOGBOOK-${Date.now()}`,
      documentDate: new Date(),
      
      // ข้อมูลนักศึกษา
      studentInfo: {
        firstName: summaryData.studentFirstName || summaryData.firstName || "",
        lastName: summaryData.studentLastName || summaryData.lastName || "",
        studentId: summaryData.studentId || "",
        yearLevel: summaryData.yearLevel || 3,
        classroom: summaryData.classroom || "",
        phoneNumber: summaryData.phoneNumber || "",
        email: summaryData.email || "",
      },
      
      // ข้อมูลบริษัท
      companyName: summaryData.companyName || "",
      companyAddress: summaryData.companyAddress || "",
      
      // ข้อมูลผู้ควบคุมงาน
      supervisorName: summaryData.supervisorName || "",
      supervisorPosition: summaryData.supervisorPosition || "",
      supervisorPhone: summaryData.supervisorPhone || "",
      supervisorEmail: summaryData.supervisorEmail || "",
      
      // ข้อมูลระยะเวลา
      startDate: summaryData.startDate,
      endDate: summaryData.endDate,
      
      // บันทึกรายวัน
      logEntries: logEntries.map(entry => ({
        workDate: entry.workDate,
        timeIn: entry.timeIn,
        timeOut: entry.timeOut,
        workHours: entry.workHours,
        workDescription: entry.workDescription,
        learningOutcome: entry.learningOutcome,
        problems: entry.problems,
        solutions: entry.solutions,
        supervisorApproved: entry.supervisorApproved,
      })),
      
      // บทสรุปประสบการณ์
      reflection: reflection || null,
      
      // สถิติ
      statistics: {
        totalDays: logEntries.length,
        totalHours: totalApprovedHours,
        averageHours: logEntries.length > 0 ? (totalApprovedHours / logEntries.length).toFixed(1) : 0,
      },
    };
  } catch (error) {
    console.error("Error preparing summary data for PDF:", error);
    message.error("เกิดข้อผิดพลาดในการเตรียมข้อมูล PDF");
    return null;
  }
};

/**
 * Preview PDF บันทึกฝึกงาน (อัปเดตใหม่)
 */
export const handlePreviewInternshipLogbook = async (
  summaryData,
  logEntries,
  reflection,
  totalApprovedHours,
  setLoading
) => {
  setLoading(true);
  try {
    message.info("กำลังเตรียมตัวอย่างเอกสาร...");
    
    // เตรียมข้อมูลสำหรับ PDF
    const pdfData = prepareSummaryDataForPDF(summaryData, logEntries, reflection, totalApprovedHours);
    if (!pdfData) return;

    // ✅ ใช้ OfficialDocumentService แทน templateDataService โดยตรง
    await officialDocumentService.previewInternshipLogbookPDF(pdfData);
    message.success("เปิดตัวอย่างเอกสารในแท็บใหม่แล้ว");
    
  } catch (error) {
    console.error("Error previewing internship logbook:", error);
    
    // จัดการข้อผิดพลาดเฉพาะ
    if (error.message.includes("ข้อมูลไม่เพียงพอ")) {
      message.error("ข้อมูลไม่ครบถ้วน กรุณาเพิ่มบันทึกการฝึกงานเพิ่มเติม");
    } else {
      message.error("ไม่สามารถแสดงตัวอย่างเอกสารได้ กรุณาลองอีกครั้ง");
    }
  } finally {
    setLoading(false);
  }
};

/**
 * ดาวน์โหลด PDF บันทึกฝึกงาน (อัปเดตใหม่)
 */
export const handleDownloadInternshipLogbook = async (
  summaryData,
  logEntries,
  reflection,
  totalApprovedHours,
  setLoading
) => {
  setLoading(true);
  try {
    message.info("กำลังเตรียมเอกสารสรุป...");
    
    // เตรียมข้อมูลสำหรับ PDF
    const pdfData = prepareSummaryDataForPDF(summaryData, logEntries, reflection, totalApprovedHours);
    if (!pdfData) return;

    // ✅ ใช้ OfficialDocumentService แทน templateDataService โดยตรง
    await officialDocumentService.generateInternshipLogbookPDF(pdfData);
    message.success("ดาวน์โหลดเอกสารสรุปการฝึกงานสำเร็จ!");
    
  } catch (error) {
    console.error("Error downloading internship logbook:", error);
    
    // จัดการข้อผิดพลาดเฉพาะ
    if (error.message.includes("ข้อมูลไม่เพียงพอ")) {
      message.error("ข้อมูลไม่ครบถ้วน กรุณาเพิ่มบันทึกการฝึกงานเพิ่มเติม");
    } else {
      message.error("ไม่สามารถดาวน์โหลดเอกสารสรุปได้ กรุณาลองอีกครั้ง");
    }
  } finally {
    setLoading(false);
  }
};

/**
 * ตรวจสอบว่ามีข้อมูลเพียงพอสำหรับสร้าง PDF หรือไม่
 * @param {Object} summaryData - ข้อมูลสรุปการฝึกงาน
 * @param {Array} logEntries - รายการบันทึกการฝึกงาน
 * @returns {boolean} - true หากมีข้อมูลเพียงพอ
 */
export const validateDataForPDF = (summaryData, logEntries) => {
  return summaryData && logEntries && logEntries.length >= 1;
};

/**
 * สร้างชื่อไฟล์สำหรับ PDF
 * @param {Object} studentInfo - ข้อมูลนักศึกษา
 * @param {string} prefix - คำนำหน้าชื่อไฟล์
 * @returns {string} - ชื่อไฟล์ที่สร้างขึ้น
 */
export const generatePDFFilename = (studentInfo, prefix = "บันทึกฝึกงาน") => {
  const currentDate = dayjs().format("YYYYMMDD");
  const studentName = studentInfo?.firstName && studentInfo?.lastName 
    ? `${studentInfo.firstName}_${studentInfo.lastName}`
    : "student";
  
  return `${prefix}_${studentName}_${currentDate}.pdf`;
};