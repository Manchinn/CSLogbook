const { Document, InternshipDocument, Student, User, InternshipLogbook } = require('../../models');
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
    // ตรวจสอบว่ามีข้อมูลผู้ใช้หรือไม่
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'ไม่มีข้อมูลผู้ใช้งาน'
      });
    }
    // แยกการดึงข้อมูลเป็น 2 ส่วนเพื่อหลีกเลี่ยงปัญหาการ join
    const document = await Document.findOne({
      where: { 
        userId: req.user.userId,
        documentName: 'CS05'
      },
      attributes: [
        'documentId', 
        'status', 
        'filePath', 
        'fileSize', 
        'mimeType',
      ],
    });

    // ตรวจสอบว่าพบข้อมูลหรือไม่
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล CS05'
      });
    }

    // ดึงข้อมูล InternshipDocument แยกต่างหาก
    const internshipData = await InternshipDocument.findOne({
      where: { documentId: document.documentId },
      attributes: [
        'internshipId', 
        'companyName',
        'companyAddress',
        'startDate',
        'endDate',
        'created_at',
        'supervisorName',
        'supervisorPosition',
        'supervisorPhone',
        'supervisorEmail'
      ]
    });

    if (!internshipData) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการฝึกงาน'
      });
    }

    // ส่งข้อมูลกลับไปยัง frontend
    return res.json({
      success: true,
      data: {
        documentId: document.documentId,
        status: document.status,
        companyName: internshipData.companyName,
        companyAddress: internshipData.companyAddress,
        startDate: internshipData.startDate,
        endDate: internshipData.endDate,
        createdAt: internshipData.created_at || '',
        supervisorName: internshipData.supervisorName || '',
        supervisorPosition: internshipData.supervisorPosition || '',
        supervisorPhone: internshipData.supervisorPhone || '',
        supervisorEmail: internshipData.supervisorEmail || '',
        filePath: document.filePath || '',
        fileName: document.fileName || '',
        fileSize: document.fileSize || 0,
        mimeType: document.mimeType || '',
        transcriptFilename: document.fileName || ''
      }
    });

  } catch (error) {
    console.error('Get Current CS05 Error:', error);
    console.error('Error details:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล CS05',
      debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
 * บันทึกคำร้องขอฝึกงาน (คพ.05) พร้อม transcript
 */
exports.submitCS05WithTranscript = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // ตรวจสอบว่ามีไฟล์ transcript หรือไม่
    if (!req.file) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'กรุณาแนบไฟล์ Transcript'
      });
    }

    // ตรวจสอบประเภทไฟล์
    if (req.file.mimetype !== 'application/pdf') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น'
      });
    }

    // แปลงข้อมูลที่ส่งมาจาก formData.append('formData', JSON.stringify(submitData));
    const formData = JSON.parse(req.body.formData);

    // ดึงข้อมูลจาก formData
    const {
      documentType,
      documentName,
      category,
      companyName,
      companyAddress,
      startDate,
      endDate,
      studentId,
      fullName,
      year,
      totalCredits
    } = formData;

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

    // 1. สร้าง Document ที่มีข้อมูลไฟล์ transcript ด้วย
    const document = await Document.create({
      userId: req.user.userId,
      documentType: 'INTERNSHIP',
      documentName: 'CS05',
      category: 'proposal',
      status: 'pending',
      filePath: req.file.path,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
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
      message: 'บันทึกคำร้องและอัปโหลด Transcript สำเร็จ',
      data: {
        documentId: document.documentId,
        internshipDocId: internshipDoc.id,
        status: document.status,
        companyName,
        companyAddress,
        startDate,
        endDate,
        transcriptFilename: req.file.filename
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Submit CS05 with Transcript Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

/**
 * ดึงข้อมูลสรุปการฝึกงาน
 */
exports.getInternshipSummary = async (req, res) => {
  try {
    // ค้นหาข้อมูลนักศึกษาจาก userId ก่อน
    const student = await Student.findOne({
      where: { userId: req.user.userId },
      attributes: ['studentId', 'studentCode']
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    const studentId = student.studentId;
    
    // ดึงข้อมูล internship document ล่าสุด โดยระบุ attributes ที่ต้องการอย่างชัดเจน
    const internshipDoc = await InternshipDocument.findOne({
      attributes: [
        'internshipId',
        'documentId',
        'companyName',
        'companyAddress',
        'supervisorName',
        'supervisorPosition',
        'supervisorPhone',
        'supervisorEmail',
        'startDate',
        'endDate'
      ],
      include: [
        {
          model: Document,
          as: 'document',
          attributes: ['documentId', 'status'],
          where: {
            userId: req.user.userId,
            documentName: 'CS05',
            status: 'approved'
          }
        }
      ],
      order: [[sequelize.literal('`InternshipDocument`.`created_at`'), 'DESC']]
    });

    if (!internshipDoc) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการฝึกงานที่ได้รับการอนุมัติ'
      });
    }

    // ดึงข้อมูลบันทึกฝึกงาน (logbooks) โดยใช้ internshipId จาก internshipDoc ที่ได้
    const logbooks = await InternshipLogbook.findAll({
      where: {
        internshipId: internshipDoc.internshipId,
        studentId: studentId  // ใช้ studentId จากการค้นหาด้านบน
      },
      order: [['workDate', 'ASC']]
    });

    // คำนวณสถิติต่างๆ
    const totalDays = logbooks.length;
    const totalHours = logbooks.reduce((sum, log) => sum + parseFloat(log.workHours || 0), 0);
    const approvedDays = logbooks.filter(log => log.supervisorApproved).length;
    const approvedHours = logbooks.filter(log => log.supervisorApproved)
      .reduce((sum, log) => sum + parseFloat(log.workHours || 0), 0);

    // รวบรวมทักษะที่ได้เรียนรู้จาก learning outcomes
    const learningOutcomes = logbooks
      .filter(log => log.learningOutcome && log.supervisorApproved)
      .map(log => log.learningOutcome)
      .join('\n');

    return res.status(200).json({
      success: true,
      data: {
        documentId: internshipDoc.document.documentId,
        status: internshipDoc.document.status,
        companyName: internshipDoc.companyName,
        companyAddress: internshipDoc.companyAddress,
        startDate: internshipDoc.startDate,
        endDate: internshipDoc.endDate,
        supervisorName: internshipDoc.supervisorName,
        supervisorPosition: internshipDoc.supervisorPosition,
        supervisorPhone: internshipDoc.supervisorPhone,
        supervisorEmail: internshipDoc.supervisorEmail,
        totalDays: totalDays,
        totalHours: totalHours,
        approvedDays: approvedDays,
        approvedHours: approvedHours,
        learningOutcome: learningOutcomes
      }
    });
  } catch (error) {
    console.error('Error fetching internship summary:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุปการฝึกงาน'
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
            status: 'approved'
          }
        }
      ],
      order: [['createdAt', 'DESC']]
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

/* // === Controller สำหรับผู้ดูแลระบบ ===
exports.updateStatus = async (req, res) => {
  // TODO: Implement document status update
}; */