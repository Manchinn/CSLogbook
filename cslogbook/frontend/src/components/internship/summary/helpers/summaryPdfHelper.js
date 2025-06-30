import { message } from "antd";
import officialDocumentService from "../../../../services/PDFServices/OfficialDocumentService";
import dayjs from "dayjs";

/**
 * Helper functions สำหรับ PDF Operations ในหน้า Summary
 */

/**
 * 🆕 ฟังก์ชันสร้าง studentData จาก userInfo และ summaryData
 * @param {Object} summaryData - ข้อมูลสรุปการฝึกงาน
 * @param {Object} userInfo - ข้อมูลผู้ใช้
 * @returns {Object} - ข้อมูลนักศึกษาที่จัดรูปแบบแล้ว
 */
const createStudentData = (summaryData, userInfo) => {
  // ใช้ userInfo เป็นหลัก แล้วค่อย fallback ไป summaryData
  if (userInfo) {
    return {
      firstName: userInfo.firstName || summaryData.studentFirstName || summaryData.firstName || "",
      lastName: userInfo.lastName || summaryData.studentLastName || summaryData.lastName || "",
      fullName: userInfo.fullName || 
               `${userInfo.firstName || ""} ${userInfo.lastName || ""}`.trim() ||
               summaryData.studentFullName || 
               `${summaryData.studentFirstName || summaryData.firstName || ""} ${summaryData.studentLastName || summaryData.lastName || ""}`.trim(),
      studentId: userInfo.studentId || summaryData.studentId || "",
      yearLevel: userInfo.yearLevel || summaryData.yearLevel || 3,
      classroom: userInfo.classroom || summaryData.classroom || "",
      phoneNumber: userInfo.phoneNumber || summaryData.phoneNumber || "",
      email: userInfo.email || summaryData.email || "",
      title: userInfo.title || summaryData.title || "",
    };
  }
  
  // fallback ใช้ summaryData เท่านั้น
  return {
    firstName: summaryData.studentFirstName || summaryData.firstName || "",
    lastName: summaryData.studentLastName || summaryData.lastName || "",
    fullName: summaryData.studentFullName || 
             `${summaryData.studentFirstName || summaryData.firstName || ""} ${summaryData.studentLastName || summaryData.lastName || ""}`.trim(),
    studentId: summaryData.studentId || "",
    yearLevel: summaryData.yearLevel || 3,
    classroom: summaryData.classroom || "",
    phoneNumber: summaryData.phoneNumber || "",
    email: summaryData.email || "",
    title: summaryData.title || "",
  };
};

/**
 * เตรียมข้อมูลสำหรับ PDF Template บันทึกฝึกงาน (✅ แก้ไขโครงสร้างข้อมูล)
 * @param {Object} summaryData - ข้อมูลสรุปการฝึกงาน
 * @param {Array} logEntries - รายการบันทึกการฝึกงาน
 * @param {Object} reflection - บทสรุปประสบการณ์
 * @param {number} totalApprovedHours - จำนวนชั่วโมงที่ได้รับการอนุมัติ
 * @param {Object} userInfo - ข้อมูลผู้ใช้ (🆕 เพิ่ม parameter ใหม่)
 * @returns {Object|null} - ข้อมูลที่เตรียมแล้วสำหรับ PDF
 */
export const prepareSummaryDataForPDF = (summaryData, logEntries, reflection, totalApprovedHours, userInfo = null) => {
  try {
    if (!summaryData || !logEntries || logEntries.length === 0) {
      throw new Error("ข้อมูลไม่เพียงพอสำหรับสร้าง PDF");
    }

    // ✅ ปรับโครงสร้างข้อมูลให้ตรงกับ TemplateDataService
    return {
      // ข้อมูลเอกสาร
      documentId: summaryData.documentId || `LOGBOOK-${Date.now()}`,
      documentDate: new Date(),
      
      // 🆕 ปรับปรุงการสร้าง studentData ให้ใช้ userInfo ก่อน
      studentData: [createStudentData(summaryData, userInfo)],
      
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
      
      // ✅ ปรับโครงสร้าง logEntries ให้ตรงกับที่ template คาดหวัง
      entries: logEntries.map(entry => ({
        workDate: entry.workDate,
        timeIn: entry.timeIn,
        timeOut: entry.timeOut,
        workHours: entry.workHours || entry.approvedHours || entry.totalHours || 0,
        approvedHours: entry.approvedHours || entry.workHours || entry.totalHours || 0,
        totalHours: entry.totalHours || entry.workHours || entry.approvedHours || 0,
        activities: entry.workDescription || entry.activities || entry.description || "",
        workDescription: entry.workDescription || entry.activities || entry.description || "",
        learnings: entry.learningOutcome || entry.learnings || entry.knowledgeGained || "",
        learningOutcome: entry.learningOutcome || entry.learnings || entry.knowledgeGained || "",
        knowledgeGained: entry.knowledgeGained || entry.learningOutcome || entry.learnings || "",
        problems: entry.problems || "",
        solutions: entry.solutions || "",
        notes: entry.notes || "",
        supervisorApproved: entry.supervisorApproved || false,
        status: entry.status || "completed",
      })),
      
      // บทสรุปประสบการณ์ - แก้ไข mapping เพื่อให้ตรงกับ useSummaryData
      reflection: reflection ? {
        experience: reflection.learningOutcome || reflection.experience || "",
        skillsLearned: reflection.keyLearnings || reflection.skillsLearned || reflection.skills || "",
        challenges: reflection.improvements || reflection.challenges || reflection.problems || "",
        suggestions: reflection.futureApplication || reflection.suggestions || reflection.recommendations || "",
        overallRating: reflection.overallRating || reflection.rating || 0,
        wouldRecommend: reflection.wouldRecommend || false,
      } : null,
      
      // สถิติ
      statistics: {
        totalDays: logEntries.length,
        totalHours: totalApprovedHours || 0,
        averageHours: logEntries.length > 0 ? (totalApprovedHours / logEntries.length).toFixed(1) : 0,
      },

      // ✅ เพิ่มข้อมูลเพื่อ debugging
      sourceDataTypes: {
        hasSummaryData: !!summaryData,
        hasLogEntries: !!(logEntries && logEntries.length > 0),
        hasReflection: !!reflection,
        entriesCount: logEntries ? logEntries.length : 0,
      }
    };
  } catch (error) {
    console.error("Error preparing summary data for PDF:", error);
    message.error("เกิดข้อผิดพลาดในการเตรียมข้อมูล PDF");
    return null;
  }
};

/**
 * ✅ Preview PDF บันทึกฝึกงาน (ปรับปรุงใหม่)
 */
export const handlePreviewInternshipLogbook = async (
  summaryData,
  logEntries,
  reflection,
  totalApprovedHours,
  setLoading,
  userInfo = null
) => {
  setLoading(true);
  try {
    message.info("กำลังเตรียมตัวอย่างเอกสาร...");
    
    // ✅ ตรวจสอบข้อมูลก่อนเตรียม
    if (!summaryData) {
      throw new Error("ไม่มีข้อมูลสรุปการฝึกงาน");
    }
    
    if (!logEntries || logEntries.length === 0) {
      throw new Error("ไม่มีบันทึกการฝึกงานรายวัน กรุณาเพิ่มบันทึกอย่างน้อย 1 รายการ");
    }
    
    // เตรียมข้อมูลสำหรับ PDF
    const pdfData = prepareSummaryDataForPDF(summaryData, logEntries, reflection, totalApprovedHours, userInfo);
    if (!pdfData) return;

    console.log("🔍 PDF Data prepared:", pdfData); // Debug log

    // ✅ ใช้ OfficialDocumentService
    await officialDocumentService.previewInternshipLogbookPDF(pdfData);
    message.success("เปิดตัวอย่างเอกสารในแท็บใหม่แล้ว");
    
  } catch (error) {
    console.error("Error previewing internship logbook:", error);
    
    // จัดการข้อผิดพลาดเฉพาะ
    if (error.message.includes("ข้อมูลไม่เพียงพอ") || error.message.includes("ไม่มีบันทึก")) {
      message.error(error.message);
    } else if (error.message.includes("ไม่มีข้อมูลสรุป")) {
      message.error("ไม่มีข้อมูลสรุปการฝึกงาน กรุณาตรวจสอบข้อมูลอีกครั้ง");
    } else {
      message.error("ไม่สามารถแสดงตัวอย่างเอกสารได้ กรุณาลองอีกครั้ง");
    }
  } finally {
    setLoading(false);
  }
};

/**
 * ดาวน์โหลด PDF บันทึกฝึกงาน (ปรับปรุงใหม่)
 * @param {Object} summaryData - ข้อมูลสรุปการฝึกงาน
 * @param {Array} logEntries - รายการบันทึกการฝึกงาน
 * @param {Object} reflection - บทสรุปประสบการณ์
 * @param {number} totalApprovedHours - จำนวนชั่วโมงที่ได้รับการอนุมัติ
 * @param {Function} setLoading - ฟังก์ชันจัดการ loading state
 * @param {Object} userInfo - ข้อมูลผู้ใช้ 🆕 เพิ่ม parameter ใหม่
 */
export const handleDownloadInternshipLogbook = async (
  summaryData,
  logEntries,
  reflection,
  totalApprovedHours,
  setLoading,
  userInfo = null
) => {
  setLoading(true);
  try {
    message.info("กำลังเตรียมเอกสารสรุป...");
    
    // ✅ ตรวจสอบข้อมูลก่อนเตรียม
    if (!summaryData) {
      throw new Error("ไม่มีข้อมูลสรุปการฝึกงาน");
    }
    
    if (!logEntries || logEntries.length === 0) {
      throw new Error("ไม่มีบันทึกการฝึกงานรายวัน กรุณาเพิ่มบันทึกอย่างน้อย 1 รายการ");
    }
    
    // เตรียมข้อมูลสำหรับ PDF
    const pdfData = prepareSummaryDataForPDF(summaryData, logEntries, reflection, totalApprovedHours, userInfo);
    if (!pdfData) return;

    console.log("🔍 PDF Data prepared for download:", pdfData); // Debug log

    // ✅ ใช้ OfficialDocumentService
    await officialDocumentService.generateInternshipLogbookPDF(pdfData);
    message.success("ดาวน์โหลดเอกสารสรุปการฝึกงานสำเร็จ!");
    
  } catch (error) {
    console.error("Error downloading internship logbook:", error);
    
    // จัดการข้อผิดพลาดเฉพาะ
    if (error.message.includes("ข้อมูลไม่เพียงพอ") || error.message.includes("ไม่มีบันทึก")) {
      message.error(error.message);
    } else if (error.message.includes("ไม่มีข้อมูลสรุป")) {
      message.error("ไม่มีข้อมูลสรุปการฝึกงาน กรุณาตรวจสอบข้อมูลอีกครั้ง");
    } else {
      message.error("ไม่สามารถดาวน์โหลดเอกสารสรุปได้ กรุณาลองอีกครั้ง");
    }
  } finally {
    setLoading(false);
  }
};

/**
 * ✅ ตรวจสอบว่ามีข้อมูลเพียงพอสำหรับสร้าง PDF หรือไม่
 * @param {Object} summaryData - ข้อมูลสรุปการฝึกงาน
 * @param {Array} logEntries - รายการบันทึกการฝึกงาน
 * @returns {Object} - ผลการตรวจสอบพร้อมข้อความ
 */
export const validateDataForPDF = (summaryData, logEntries) => {
  const result = {
    isValid: false,
    missingData: [],
    suggestions: []
  };

  // ตรวจสอบข้อมูลสรุป
  if (!summaryData) {
    result.missingData.push("ข้อมูลสรุปการฝึกงาน");
    result.suggestions.push("กรุณาเพิ่มข้อมูลการฝึกงาน");
  } else {
    // ตรวจสอบข้อมูลสำคัญ
    if (!summaryData.companyName) {
      result.missingData.push("ชื่อบริษัท/หน่วยงาน");
    }
    if (!summaryData.startDate || !summaryData.endDate) {
      result.missingData.push("ระยะเวลาฝึกงาน");
    }
  }

  // ตรวจสอบบันทึกรายวัน
  if (!logEntries || logEntries.length === 0) {
    result.missingData.push("บันทึกการฝึกงานรายวัน");
    result.suggestions.push("กรุณาเพิ่มบันทึกการฝึกงานอย่างน้อย 1 รายการ");
  } else if (logEntries.length < 5) {
    result.suggestions.push("แนะนำให้มีบันทึกการฝึกงานอย่างน้อย 5 รายการ");
  }

  result.isValid = result.missingData.length === 0;
  return result;
};