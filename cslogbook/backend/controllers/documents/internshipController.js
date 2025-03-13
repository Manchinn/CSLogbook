const { Document, InternshipDocument, Student, User } = require('../../models');
const { Sequelize, Op } = require('sequelize'); // แก้ไขการ import
const { sequelize } = require('../../config/database');
const { 
  calculateStudentYear,
  isEligibleForInternship,
  getCurrentAcademicYear
} = require('../../utils/studentUtils');

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

exports.getCurrentCS05 = async (req, res) => {
  try {
    const document = await Document.findOne({
      where: { 
        userId: req.user.userId,
        documentName: 'CS05'
      },
      include: [
        {
          model: InternshipDocument,
          as: 'internshipDocument', // Add the alias here
          required: true
        },
        {
          model: Student,
          as: 'student', // Add the alias here
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!document) {
      return res.json({
        success: true,
        isSubmitted: false,
        data: null
      });
    }

    return res.json({
      success: true,
      isSubmitted: true,
      data: {
        documentId: document.documentId,
        status: document.status,
        studentCode: document.student.studentCode,
        fullName: `${document.student.user.firstName} ${document.student.user.lastName}`,
        companyName: document.internshipDocument.companyName,
        companyAddress: document.internshipDocument.companyAddress,
        startDate: document.internshipDocument.startDate,
        endDate: document.internshipDocument.endDate,
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

    // 1. สร้าง Document
    const document = await Document.create({
      userId: req.user.userId,
      documentType,
      documentName,
      status: 'pending',
      category,
      filePath: null,      // เพิ่มเข้ามา
      fileSize: null,      // เพิ่มเข้ามา
      mimeType: null       // เพิ่มเข้ามา
    }, { transaction });

    // 2. สร้าง InternshipDocument
    const internshipDoc = await InternshipDocument.create({
      documentId: document.documentId,
      companyName,
      companyAddress,
      startDate,
      endDate,
      status: 'pending',
      // เพิ่มค่าว่างสำหรับฟิลด์ที่จะกรอกภายหลัง
      supervisorName: null,
      supervisorPosition: null,
      supervisorPhone: null,
      supervisorEmail: null
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'บันทึกคำร้องเรียบร้อย',
      data: {
        documentId: document.documentId,
        internshipDocId: internshipDoc.id,
        status: document.status
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

exports.submitCompanyInfo = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      supervisorName,
      supervisorPhone,
      supervisorEmail
    } = req.body;
    const documentId = req.query.documentId;

    // Validation
    if (!supervisorName?.trim() || !supervisorPhone?.trim() || !supervisorEmail?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลผู้ควบคุมงานให้ครบถ้วน'
      });
    }

    const findDocument = documentId 
      ? { documentId, userId: req.user.userId }
      : { 
          userId: req.user.userId,
          documentName: 'CS05',
          status: { [Op.not]: 'rejected' }
        };

    const document = await Document.findOne({
      where: findDocument,
      include: [{
        model: InternshipDocument,
        as: 'internshipDocument',
        required: true
      }],
      order: documentId ? undefined : [['created_at', 'DESC']]
    });

    if (!document) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'กรุณายื่นแบบฟอร์ม คพ.05 ก่อนบันทึกข้อมูลผู้ควบคุมงาน'
      });
    }

    // อัพเดทเฉพาะข้อมูลผู้ควบคุมงาน
    await document.internshipDocument.update({
      supervisorName: supervisorName.trim(),
      supervisorPhone: supervisorPhone.trim(),
      supervisorEmail: supervisorEmail.trim()
    }, { transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: documentId ? 'แก้ไขข้อมูลผู้ควบคุมงานสำเร็จ' : 'บันทึกข้อมูลผู้ควบคุมงานสำเร็จ',
      data: {
        documentId: document.documentId,
        companyName: document.internshipDocument.companyName,
        supervisorName: supervisorName.trim(),
        supervisorPhone: supervisorPhone.trim(),
        supervisorEmail: supervisorEmail.trim()
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Company Info Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ควบคุมงาน'
    });
  }
};