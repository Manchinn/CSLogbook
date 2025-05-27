const { Document, InternshipDocument, Student, User, InternshipLogbook, InternshipLogbookReflection, Academic, Curriculum, ApprovalToken, InternshipEvaluation } = require('../../models');
const { Sequelize, Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const { 
  calculateStudentYear,
  isEligibleForInternship,
  getCurrentAcademicYear
} = require('../../utils/studentUtils');
const emailService = require('../../utils/mailer.js'); // Using mailer.js directly for email functions
const crypto = require('crypto');
const internshipManagementService = require('../../services/internshipManagementService');

// ============= Controller สำหรับข้อมูลนักศึกษา =============
/**
 * ดึงข้อมูลนักศึกษาและตรวจสอบสิทธิ์การฝึกงาน
 */
exports.getStudentInfo = async (req, res) => {
  try {
    const result = await internshipManagementService.getStudentInfo(req.user.userId);
    
    return res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error fetching student info:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา'
    });
  }
};

// ============= Controller สำหรับจัดการ คพ.05 =============
/**
 * ดึงข้อมูล คพ.05 ปัจจุบันของนักศึกษา
 */
exports.getCurrentCS05 = async (req, res) => {
  try {
    const result = await internshipManagementService.getCurrentCS05(req.user.userId);
    
    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get Current CS05 Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล CS05'
    });
  }
};

/**
 * บันทึกคำร้องขอฝึกงาน (คพ.05)
 */
exports.submitCS05 = async (req, res) => {
  try {
    const result = await internshipManagementService.submitCS05(req.user.userId, req.body);
    
    return res.status(201).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Submit CS05 Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
    });
  }
};

/**
 * บันทึกคำร้องขอฝึกงาน (คพ.05) พร้อม transcript
 */
exports.submitCS05WithTranscript = async (req, res) => {
  try {
    const result = await internshipManagementService.submitCS05WithTranscript(req.user.userId, req.body, req.file);
    
    return res.status(201).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error in submitCS05WithTranscript:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
    });
  }
};

/**
 * ดึงข้อมูล คพ.05 ตาม ID
 */
exports.getCS05ById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await internshipManagementService.getCS05ById(id, req.user.userId, req.user.role);
    
    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get CS05 Error:', error);
    const statusCode = error.message.includes('ไม่พบ') ? 404 : 
                      error.message.includes('ไม่มีสิทธิ์') ? 403 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
};

/**
 * บันทึกข้อมูลผู้ควบคุมงาน
 */
exports.submitCompanyInfo = async (req, res) => {
  try {
    const result = await internshipManagementService.submitCompanyInfo(req.user.userId, req.body);
    
    return res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Submit Company Info Error:', error);
    const statusCode = error.message.includes('ไม่พบ') ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
    });
  }
};

/**
 * ดึงข้อมูลผู้ควบคุมงาน
 */
exports.getCompanyInfo = async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await internshipManagementService.getCompanyInfo(documentId, req.user.userId);
    
    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get Company Info Error:', error);
    const statusCode = error.message.includes('ไม่พบ') ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
};

/**
 * ดึงข้อมูลสรุปการฝึกงาน
 */
exports.getInternshipSummary = async (req, res) => {
  try {
    const result = await internshipManagementService.getInternshipSummary(req.user.userId);
    
    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching internship summary:', error);
    const statusCode = error.message.includes('ไม่พบ') ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปการฝึกงาน'
    });
  }
};

/**
 * ดาวน์โหลดเอกสารสรุปการฝึกงาน
 */
exports.downloadInternshipSummary = async (req, res) => {
  try {
    // ค้นหาข้อมูลนักศึกษาก่อน
    const student = await Student.findOne({
      where: { userId: req.user.userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName']
      }],
      attributes: ['studentId', 'studentCode']
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    const studentId = student.studentId;
    const studentName = `${student.user.firstName} ${student.user.lastName}`;
    const studentCode = student.studentCode;

    // ดึงข้อมูล internship document ล่าสุด
    const internshipDoc = await InternshipDocument.findOne({
      include: [
        {
          model: Document,
          as: 'document',
          where: {
            userId: req.user.userId,
            documentName: 'CS05',
            category: 'internship',
            status: ['approved', 'supervisor_approved'],
          }
        }
      ],
      order: [['created_at', 'DESC']]
    });

    if (!internshipDoc) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการฝึกงานที่ได้รับการอนุมัติ'
      });
    }

    // ดึงข้อมูลบันทึกฝึกงาน (logbooks)
    const logbooks = await InternshipLogbook.findAll({
      where: {
        internshipId: internshipDoc.internshipId,
        studentId: studentId,
        supervisorApproved: true
      },
      order: [['workDate', 'ASC']]
    });

    // สร้างไฟล์ PDF สรุปการฝึกงาน (เป็นตัวอย่างโครงสร้างฟังก์ชัน)
    // โค้ดสร้าง PDF จะต้องเพิ่มเติมตามต้องการ
    // ตัวอย่างเช่น ใช้ puppeteer, PDFKit, หรือห้องสมุด PDF อื่นๆ

    // ตัวอย่าง (คอมเมนต์ไว้เพื่อให้สมบูรณ์ในอนาคต)
    /*
    const pdfKit = require('pdfkit');
    const pdf = new pdfKit({ margin: 30, size: 'A4' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=internship-summary-${studentCode}.pdf`);
    
    pdf.pipe(res);
    
    pdf.fontSize(18).text('สรุปผลการฝึกงาน', { align: 'center' });
    pdf.moveDown();
    
    // เพิ่มข้อมูลนักศึกษา
    pdf.fontSize(12).text(`ชื่อ-นามสกุล: ${studentName}`);
    pdf.text(`รหัสนักศึกษา: ${studentCode}`);
    pdf.moveDown();
    
    // เพิ่มข้อมูลบริษัท
    pdf.fontSize(14).text('ข้อมูลสถานประกอบการ');
    pdf.fontSize(12).text(`บริษัท: ${internshipDoc.companyName}`);
    pdf.text(`ที่อยู่: ${internshipDoc.companyAddress}`);
    pdf.moveDown();
    
    // ข้อมูลสถิติ
    pdf.fontSize(14).text('สรุปชั่วโมงการฝึกงาน');
    pdf.fontSize(12).text(`จำนวนวันทั้งหมด: ${logbooks.length} วัน`);
    pdf.text(`จำนวนชั่วโมงทั้งหมด: ${logbooks.reduce((sum, log) => sum + parseFloat(log.workHours || 0), 0)} ชั่วโมง`);
    
    // สร้างตาราง logbook entries
    // ...
    
    // ปิด PDF
    pdf.end();
    */
    
    // ส่งข้อความแจ้งว่าฟีเจอร์อยู่ระหว่างการพัฒนา
    return res.status(200).json({
      success: false,
      message: 'ฟีเจอร์นี้อยู่ระหว่างการพัฒนา'
    });
    
  } catch (error) {
    console.error('Error generating internship summary PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างเอกสารสรุปการฝึกงาน'
    });
  }
};

/**
 * ดึงรายการ คพ.05 ทั้งหมดของนักศึกษา
 */
exports.getCS05List = async (req, res) => {
  try {
    const result = await internshipManagementService.getCS05List(req.user.userId);
    
    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get CS05 List Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
};

// ============= Controller สำหรับการประเมินผลการฝึกงาน =============
/**
 * ตรวจสอบสถานะการส่งแบบประเมินให้พี่เลี้ยง
 */
exports.getEvaluationStatus = async (req, res) => {
  try {
    const result = await internshipManagementService.getEvaluationStatus(req.user.userId);
    
    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get Evaluation Status Error:', error);
    const statusCode = error.message.includes('ไม่พบ') ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบสถานะการประเมิน'
    });
  }
};

/**
 * ส่งแบบประเมินให้พี่เลี้ยง (ปรับปรุงใหม่)
 * Handles the request from a student to send an evaluation form link to their supervisor.
 */
exports.sendEvaluationForm = async (req, res) => {
  try {
    const { internshipId } = req.params;
    const result = await internshipManagementService.sendEvaluationForm(req.user.userId, internshipId);
    
    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error sending evaluation form:', error);
    const statusCode = error.message.includes('ไม่พบ') ? 404 : 
                      error.message.includes('ไม่สามารถส่ง') ? 400 :
                      error.message.includes('คำขอประเมิน') ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการส่งคำขอประเมินผล'
    });
  }
};

// ============= Controller สำหรับการประเมินผลการฝึกงาน โดย Supervisor =============

/**
 * ดึงข้อมูลสำหรับหน้าแบบฟอร์มการประเมินผลโดย Supervisor
 */
exports.getSupervisorEvaluationFormDetails = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await internshipManagementService.getSupervisorEvaluationFormDetails(token);
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'ดึงข้อมูลสำหรับแบบประเมินผลสำเร็จ'
    });

  } catch (error) {
    console.error('Error fetching supervisor evaluation form details:', error);
    const statusCode = error.message.includes('ไม่ถูกต้อง') || error.message.includes('หมดอายุ') ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลแบบประเมินผล'
    });
  }
};

/**
 * บันทึกข้อมูลการประเมินผลโดย Supervisor
 */
exports.submitSupervisorEvaluation = async (req, res) => {
  try {
    const { token } = req.params;
    const evaluationData = req.body;
    
    const result = await internshipManagementService.submitSupervisorEvaluation(token, evaluationData);
    
    return res.status(201).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Submit Supervisor Evaluation Error:', error);
    
    // Use error handling from service layer
    let statusCode = error.statusCode || 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการบันทึกผลการประเมิน',
      errors: error.errors
    });
  }
};