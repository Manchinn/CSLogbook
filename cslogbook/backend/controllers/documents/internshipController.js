const { Document, InternshipDocument, Student, User, InternshipLogbook, Academic, Curriculum } = require('../../models');
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
      status: 'pending', // สถานะเอกสารคือ pending
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
      status: 'pending', // สถานะใน InternshipDocument ก็เป็น pending
      supervisorName: null,
      supervisorPosition: null,
      supervisorPhone: null,
      supervisorEmail: null
    }, { transaction });

    // 3. อัปเดตสถานะการฝึกงานในตาราง students
    const student = await Student.findOne({
      where: { userId: req.user.userId }
    }, { transaction });

    if (student) {
      await student.update({
        internshipStatus: 'pending_approval',  // อัปเดตสถานะนักศึกษาเป็น "รออนุมัติ"
        isEnrolledInternship: true            // ตั้งค่าเป็น enrolled (อาจใช้ boolean true หรือ 1)
      }, { transaction });
      
      console.log(`Updated student ${student.studentId} internship status to pending_approval`);
    }

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'บันทึกคำร้องเรียบร้อย กรุณาอัปโหลด Transcript',
      data: {
        documentId: document.documentId,
        internshipDocId: internshipDoc.id,
        status: document.status, // สถานะของเอกสาร CS05
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
      status: 'pending', // สถานะเอกสารคือ pending
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
      status: 'pending', // สถานะใน InternshipDocument ก็เป็น pending
      supervisorName: null,
      supervisorPosition: null,
      supervisorPhone: null,
      supervisorEmail: null
    }, { transaction });

    // 3. อัปเดตสถานะการฝึกงานในตาราง students
    const student = await Student.findOne({
      where: { userId: req.user.userId }
    }, { transaction });

    console.log('Found student:', student ? student.studentId : 'Not found');
    
    if (student) {
      console.log('About to update student status for ID:', student.studentId);
      console.log('Current student internship status:', student.internshipStatus, 'isEnrolledInternship:', student.isEnrolledInternship);
      
      try {
        await student.update({
          internshipStatus: 'pending_approval', // อัปเดตสถานะนักศึกษาเป็น "รออนุมัติ"
          isEnrolledInternship: true
        }, { transaction });
        
        const updatedStudent = await Student.findOne({
          where: { studentId: student.studentId } // ใช้ studentId ที่เป็น primary key โดยตรง
        }, { transaction }); // ดึงข้อมูลนักศึกษาที่อัปเดตแล้วเพื่อตรวจสอบ
        
        console.log('Updated student internship status:', updatedStudent.internshipStatus, 'isEnrolledInternship:', updatedStudent.isEnrolledInternship);
      } catch (updateError) {
        console.error('Error updating student status:', updateError);
        throw updateError; 
      }
    }

    // Make sure transaction is committed
    console.log('Committing transaction...');
    await transaction.commit();
    console.log('Transaction committed successfully');

    return res.status(201).json({
      success: true,
      message: 'บันทึกคำร้องและอัปโหลด Transcript สำเร็จ',
      data: {
        documentId: document.documentId,
        internshipDocId: internshipDoc.id,
        status: document.status, // สถานะของเอกสาร CS05
        companyName,
        companyAddress,
        startDate,
        endDate,
        transcriptFilename: req.file.filename
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error in submitCS05WithTranscript:', error);
    console.log('Transaction rolled back due to error');
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
        createdAt: document.created_at
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
    const documents = await Document.findAll({
      where: { 
        documentName: 'CS05',
        userId: req.user.userId 
      },
      include: [{
        model: InternshipDocument,
        required: true
      }],
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: documents.map(doc => ({
        documentId: doc.documentId,
        companyName: doc.InternshipDocument.companyName,
        status: doc.status,
        createdAt: doc.created_at,
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

// ============= Controller สำหรับการประเมินผลการฝึกงาน =============
/**
 * ตรวจสอบสถานะการส่งแบบประเมินให้พี่เลี้ยง
 */
exports.getEvaluationStatus = async (req, res) => {
  try {
    const studentUserId = req.user.userId; // Assuming student's user ID is from authenticated user

    // Find the student record to get the studentId (studentCode)
    const student = await Student.findOne({
      where: { userId: studentUserId },
      attributes: ['studentId'], // studentId is the student_code
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา',
      });
    }

    // Find the relevant InternshipDocument through Document, then join to get supervisor info
    const internshipDocument = await InternshipDocument.findOne({
      include: [{
        model: Document,
        as: 'document', // Make sure this alias matches your model definition
        where: { 
          userId: studentUserId,
          documentType: 'internship' 
        },
        attributes: ['documentId', 'status', 'documentName'],
        include: [{ // Include User (owner) from Document to potentially get student info if needed elsewhere
          model: User,
          as: 'owner',
          attributes: ['userId', 'firstName', 'lastName'],
          include: [{
            model: Student,
            as: 'student',
            attributes: ['studentId'] // This is student_code
          }]
        }]
      }],
      // Order by creation date or start date to get the most relevant one if multiple exist
      // For example, order by 'created_at' DESC if InternshipDocument has timestamps
      // or join with Document and order by Document.createdAt
      order: [[{model: Document, as: 'document'}, 'created_at', 'DESC']],
    });

    if (!internshipDocument || !internshipDocument.document) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบเอกสารการฝึกงาน (เช่น คพ.05) หรือข้อมูลการประเมิน',
      });
    }
    
    // Now we have the student's studentId (student.studentId) and internshipDocument details
    // Proceed to find the evaluation form (e.g., CS07) if it's a separate document
    // or check status on the internshipDocument itself if evaluation is part of it.

    // Example: Assuming CS07 is another document linked to the student
    const evaluationForm = await Document.findOne({
      where: {
        userId: studentUserId,
        documentName: 'CS07', // Or whatever the evaluation form is named
        // Potentially link to the specific internship via a shared ID or convention if needed
      },
      order: [['created_at', 'DESC']],
      attributes: ['status', 'filePath', 'reviewComment', 'updated_at'
    ]});

    let evaluationStatus = 'ยังไม่ได้ประเมิน';
    let evaluationDetails = null;

    // Check if CS05 is approved
    const cs05Approved = internshipDocument.document && internshipDocument.document.documentName === 'CS05' && internshipDocument.document.status === 'approved';

    if (cs05Approved) {
      const today = new Date();
      const internshipEndDate = new Date(internshipDocument.endDate);

      if (evaluationForm) {
        // If CS07 exists, use its status
        evaluationStatus = evaluationForm.status === 'approved' ? 'ประเมินแล้ว' :
                           evaluationForm.status === 'pending' ? 'รอการประเมิน' :
                           evaluationForm.status === 'rejected' ? 'ประเมินแล้ว (ไม่ผ่าน)' :
                           'อยู่ระหว่างดำเนินการ';
        evaluationDetails = {
          status: evaluationForm.status,
          filePath: evaluationForm.filePath,
          comment: evaluationForm.reviewComment,
          evaluatedAt: evaluationForm.updated_at,
          supervisorName: internshipDocument.supervisorName,
        };
      } else if (internshipEndDate >= today) {
        // CS05 approved, internship not ended, CS07 not submitted
        evaluationStatus = 'อยู่ระหว่างการฝึกงาน';
        evaluationDetails = {
          status: 'อยู่ระหว่างการฝึกงาน',
          supervisorName: internshipDocument.supervisorName,
          endDate: internshipDocument.endDate,
        };
      } else {
        // CS05 approved, internship ended, CS07 not submitted
        evaluationStatus = 'รอสิ้นสุดการฝึกงานเพื่อประเมิน';
        evaluationDetails = {
          status: 'รอการประเมินจากอาจารย์นิเทศก์ (สิ้นสุดการฝึกงานแล้ว)',
          supervisorName: internshipDocument.supervisorName,
          endDate: internshipDocument.endDate,
        };
      }
    } else if (internshipDocument.document && internshipDocument.document.status === 'approved_evaluation') { // Example status for direct evaluation on internshipDoc (assuming status is on Document)
        evaluationStatus = 'ประเมินแล้ว';
        evaluationDetails = {
            status: 'อนุมัติผลการฝึกงาน', 
            filePath: internshipDocument.evaluationFilePath || null, // Assuming such a field exists on InternshipDocument
            comment: internshipDocument.evaluationComment || null, // Assuming such a field exists on InternshipDocument
            evaluatedAt: internshipDocument.evaluationDate || internshipDocument.document.updatedAt,
            supervisorName: internshipDocument.supervisorName, 
        };
    } else if (internshipDocument.document && internshipDocument.document.status === 'pending_evaluation') { // Assuming status is on Document
        evaluationStatus = 'รอการประเมิน';
        evaluationDetails = {
            status: 'รอการประเมินจากอาจารย์นิเทศก์',
            supervisorName: internshipDocument.supervisorName,
        };
    }
    // ...existing code...
    return res.json({
      success: true,
      evaluationStatus: evaluationStatus,
      evaluationDetails: evaluationDetails,
      studentId: student.studentId, // student_code
      companyName: internshipDocument.companyName,
      // Add other relevant data for the frontend
    });

  } catch (error) {
    console.error('Get Evaluation Status Error:', error);
    // Check for SequelizeHostNotFoundError or other specific DB connection errors
    if (error.name === 'SequelizeHostNotFoundError') {
        // Log more specific details or send a generic message
        console.error('Database connection error in getEvaluationStatus:', error.message);
        return res.status(503).json({ // Service Unavailable
            success: false,
            message: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลเพื่อดึงข้อมูลสถานะการประเมินได้'
        });
    } else if (error.name === 'SequelizeDatabaseError' && error.original && error.original.code === 'ER_BAD_FIELD_ERROR') {
        console.error('Specific SequelizeDatabaseError (ER_BAD_FIELD_ERROR) in getEvaluationStatus:', error.message, error.original.sqlMessage);
         return res.status(500).json({
            success: false,
            message: `เกิดข้อผิดพลาดเกี่ยวกับฟิลด์ในฐานข้อมูล: ${error.original.sqlMessage}`
        });
    }
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงสถานะการประเมิน',
      error: process.env.NODE_ENV === 'development' ? { name: error.name, message: error.message, stack: error.stack, original: error.original } : undefined
    });
  }
};

/**
 * ส่งแบบประเมินให้พี่เลี้ยง
 */
exports.sendEvaluationForm = async (req, res) => {
  try {
    // ตรวจสอบว่ามี request.user และ supervisorEmail หรือไม่
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
      });
    }
    
    const { supervisorEmail } = req.body;
    
    if (!supervisorEmail) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุอีเมลของพี่เลี้ยง'
      });
    }

    // ดึงข้อมูลนักศึกษา
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

    // ในอนาคตจะเพิ่มโค้ดสำหรับการส่งอีเมลและบันทึกข้อมูลลงตาราง evaluations
    
    return res.status(200).json({
      success: true,
      message: 'ส่งแบบประเมินไปยังพี่เลี้ยงสำเร็จ',
      data: {
        isSent: true,
        sentDate: new Date()
      }
    });

  } catch (error) {
    console.error('Send Evaluation Form Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการส่งแบบประเมิน',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};