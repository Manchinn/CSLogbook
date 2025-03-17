const { Document, InternshipDocument, Student, User } = require('../../models');
const { Sequelize, Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const { 
  calculateStudentYear,
  isEligibleForInternship,
  getCurrentAcademicYear
} = require('../../utils/studentUtils');

// ============= Controller สำหรับข้อมูลนักศึกษา =============
/**
 * ดึงข้อมูลนักศึกษาและตรวจสอบสิทธิ์การฝึกงาน
 */
exports.getStudentInfo = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { userId: req.user.userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    // คำนวณข้อมูลปีการศึกษาโดยใช้ utility functions
    const yearInfo = calculateStudentYear(student.studentCode);
    if (yearInfo.error) {
      return res.status(400).json({
        success: false,
        message: yearInfo.message
      });
    }

    // ตรวจสอบสิทธิ์การฝึกงาน
    const eligibilityCheck = isEligibleForInternship(yearInfo.year, student.totalCredits);

    return res.json({
      success: true,
      student: {
        studentId: student.studentCode,
        fullName: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email,
        faculty: student.faculty,
        major: student.major,
        totalCredits: student.totalCredits,
        year: yearInfo.year,
        status: yearInfo.status,
        statusLabel: yearInfo.statusLabel,
        isEligible: eligibilityCheck.eligible,
        academicYear: getCurrentAcademicYear(),
        department: 'ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ',
        faculty: 'คณะวิทยาศาสตร์ประยุกต์',
        university: 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ'
      },
      message: !eligibilityCheck.eligible ? eligibilityCheck.message : undefined
    });

  } catch (error) {
    console.error('Get Student Info Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา'
    });
  }
};

// ============= Controller สำหรับจัดการ คพ.05 =============
/**
 * ดึงข้อมูล คพ.05 ปัจจุบันของนักศึกษา
 */
exports.getCurrentCS05 = async (req, res) => {
  try {
    const document = await Document.findOne({
      where: { 
        userId: req.user.userId,
        documentName: 'CS05'
      },
      include: [{
        model: InternshipDocument,
        as: 'internshipDocument',
        required: true,
        attributes: [
          'internshipId', 
          'companyName',
          'companyAddress',
          'startDate',
          'endDate',
          'supervisorName',
          'supervisorPosition',
          'supervisorPhone',
          'supervisorEmail'
        ]
      }],
      order: [['created_at', 'DESC']]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล CS05'
      });
    }

    // ดึงข้อมูลจาก internshipDocument
    const internshipData = document.internshipDocument;

    // ส่งข้อมูลกลับในรูปแบบที่ frontend ต้องการ
    return res.json({
      success: true,
      data: {
        documentId: document.documentId,
        status: document.status,
        companyName: internshipData.companyName,
        companyAddress: internshipData.companyAddress,
        startDate: internshipData.startDate,
        endDate: internshipData.endDate,
        supervisorName: internshipData.supervisorName || '',
        supervisorPosition: internshipData.supervisorPosition || '',
        supervisorPhone: internshipData.supervisorPhone || '',
        supervisorEmail: internshipData.supervisorEmail || '',
        createdAt: document.createdAt
      }
    });

  } catch (error) {
    console.error('Get Current CS05 Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล CS05'
    });
  }
};

/**
 * บันทึกคำร้องขอฝึกงาน (คพ.05)
 */
exports.submitCS05 = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      documentType,
      documentName,
      category,
      companyName,
      companyAddress,
      startDate,
      endDate
    } = req.body;

    // ตรวจสอบว่ามี CS05 ที่ pending อยู่หรือไม่
    const existingDocument = await Document.findOne({
      where: {
        userId: req.user.userId,
        documentName: 'CS05',
        status: 'pending'
      }
    });

    if (existingDocument) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'คุณมีคำร้อง CS05 ที่รอการพิจารณาอยู่แล้ว'
      });
    }

    // 1. สร้าง Document
    const document = await Document.create({
      userId: req.user.userId,
      documentType: 'INTERNSHIP',
      documentName: 'CS05',
      category: 'proposal',
      status: 'pending',
      filePath: null,
      fileSize: null,
      mimeType: null
    }, { transaction });

    // 2. สร้าง InternshipDocument
    const internshipDoc = await InternshipDocument.create({
      documentId: document.documentId,
      companyName,
      companyAddress,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'pending',
      supervisorName: null,
      supervisorPosition: null,
      supervisorPhone: null,
      supervisorEmail: null
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'บันทึกคำร้องเรียบร้อย กรุณาอัปโหลด Transcript',
      data: {
        documentId: document.documentId,
        internshipDocId: internshipDoc.id,
        status: document.status,
        requireTranscript: true
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Submit CS05 Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
    });
  }
};

/**
 * ดึงข้อมูล คพ.05 ตาม ID
 */
exports.getCS05ById = async (req, res) => {
  try {
    const { id } = req.params;

    // ดึงข้อมูล CS05 พร้อมข้อมูลที่เกี่ยวข้อง
    const document = await Document.findOne({
      where: { 
        documentId: id,
        documentName: 'CS05'
      },
      include: [
        {
          model: InternshipDocument,
          required: true
        },
        {
          model: Student,
          include: [{
            model: User,
            attributes: ['firstName', 'lastName']
          }]
        }
      ]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลแบบฟอร์ม คพ.05'
      });
    }

    // ตรวจสอบสิทธิ์การเข้าถึงข้อมูล
    if (document.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึงข้อมูล'
      });
    }

    return res.json({
      success: true,
      data: {
        documentId: document.documentId,
        studentName: `${document.Student.User.firstName} ${document.Student.User.lastName}`,
        studentCode: document.Student.studentCode,
        companyName: document.InternshipDocument.companyName,
        companyAddress: document.InternshipDocument.companyAddress,
        startDate: document.InternshipDocument.startDate,
        endDate: document.InternshipDocument.endDate,
        status: document.status,
        createdAt: document.createdAt
      }
    });

  } catch (error) {
    console.error('Get CS05 Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * บันทึกข้อมูลผู้ควบคุมงาน
 */
exports.submitCompanyInfo = async (req, res) => {
  let transaction;
  try {
    transaction = await sequelize.transaction();
    
    const { documentId, supervisorName, supervisorPhone, supervisorEmail } = req.body;

    const document = await Document.findOne({
      where: { 
        documentId,
        userId: req.user.userId 
      },
      include: [{
        model: InternshipDocument,
        as: 'internshipDocument',
        required: true,
        attributes: ['internshipId', 'companyName'] // ระบุ attributes ที่ต้องการ
      }],
      transaction
    });

    if (!document) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลเอกสาร CS05'
      });
    }

    // อัพเดทข้อมูลผู้ควบคุมงาน
    await document.internshipDocument.update({
      supervisorName,
      supervisorPhone,
      supervisorEmail
    }, { transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: 'บันทึกข้อมูลผู้ควบคุมงานสำเร็จ',
      data: {
        documentId: document.documentId,
        companyName: document.internshipDocument.companyName,
        supervisorName,
        supervisorPhone,
        supervisorEmail
      }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Submit Company Info Error:', error);
    return res.status(500).json({
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

    const document = await Document.findOne({
      where: { 
        documentId,
        userId: req.user.userId 
      },
      include: [{
        model: InternshipDocument,
        as: 'internshipDocument',
        required: true,
        attributes: [
          'supervisorName',
          'supervisorPhone',
          'supervisorEmail'
        ]
      }]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลเอกสาร'
      });
    }

    return res.json({
      success: true,
      data: {
        documentId: document.documentId,
        supervisorName: document.internshipDocument.supervisorName,
        supervisorPhone: document.internshipDocument.supervisorPhone,
        supervisorEmail: document.internshipDocument.supervisorEmail
      }
    });

  } catch (error) {
    console.error('Get Company Info Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
};

// ============= Controller ที่ยังไม่ได้ใช้งาน (รอการพัฒนา) =============

/**
 * ดึงรายการ คพ.05 ทั้งหมดของนักศึกษา
 */
exports.getCS05List = async (req, res) => {
  try {
    const documents = await Document.findAll({
      where: { 
        documentName: 'CS05',
        userId: req.user.userId 
      },
      include: [{
        model: InternshipDocument,
        required: true
      }],
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      success: true,
      data: documents.map(doc => ({
        documentId: doc.documentId,
        companyName: doc.InternshipDocument.companyName,
        status: doc.status,
        createdAt: doc.createdAt,
        startDate: doc.InternshipDocument.startDate,
        endDate: doc.InternshipDocument.endDate
      }))
    });

  } catch (error) {
    console.error('Get CS05 List Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
};

/* 
// === Controller สำหรับสมุดบันทึกการฝึกงาน ===
exports.addLogbookEntry = async (req, res) => {
  // TODO: Implement logbook entry creation
};

exports.getLogbookEntries = async (req, res) => {
  // TODO: Implement getting logbook entries
};

// === Controller สำหรับจัดการไฟล์เอกสาร ===
exports.uploadDocument = async (req, res) => {
  // TODO: Implement document upload
};

exports.getDocuments = async (req, res) => {
  // TODO: Implement getting all documents
};

exports.getDocumentById = async (req, res) => {
  // TODO: Implement getting document by id
};

exports.downloadDocument = async (req, res) => {
  // TODO: Implement document download
};

// === Controller สำหรับผู้ดูแลระบบ ===
exports.updateStatus = async (req, res) => {
  // TODO: Implement document status update
};
*/