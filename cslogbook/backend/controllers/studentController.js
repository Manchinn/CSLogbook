const { User, Student, Teacher, Sequelize } = require('../models');
const bcrypt = require('bcrypt');
const { calculateStudentYear, isEligibleForInternship, isEligibleForProject, getCurrentAcademicYear, getCurrentSemester } = require('../utils/studentUtils');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// ฟังก์ชันดึงข้อมูลนักศึกษาตาม ID
const calculateEligibility = (studentCode, totalCredits, majorCredits) => {
  const studentYear = calculateStudentYear(studentCode);
  return {
    studentYear,
    internship: isEligibleForInternship(studentYear, totalCredits),
    project: isEligibleForProject(studentYear, totalCredits, majorCredits)
  };
};

// ฟังก์ชันดึงข้อมูลนักศึกษาทั้งหมด
exports.getAllStudents = async (req, res, next) => {
  try {
    const { semester, academicYear } = req.query;
    
    // สร้างเงื่อนไขการค้นหา
    const whereCondition = {
      role: 'student'
    };

    // สร้างเงื่อนไขสำหรับ Student model
    const studentWhereCondition = {};
    if (semester) studentWhereCondition.semester = semester;
    if (academicYear) studentWhereCondition.academicYear = academicYear;

    const students = await User.findAll({
      where: whereCondition,
      attributes: ['userId', 'firstName', 'lastName', 'email'],
      include: [{
        model: Student,
        as: 'student',
        required: true,
        where: studentWhereCondition,
        attributes: [
          'studentId',
          'studentCode',
          'totalCredits',
          'majorCredits',
          'isEligibleInternship',
          'isEligibleProject',
          'semester',
          'academicYear'
        ]
      }]
    });

    const formattedStudents = students.map(user => ({
      userId: user.userId,                    // hidden field
      studentId: user.student?.studentId,   // hidden field
      studentCode: user.student?.studentCode || '',
      firstName: user.firstName,
      lastName: user.lastName,
      totalCredits: user.student?.totalCredits || 0,
      majorCredits: user.student?.majorCredits || 0,
      isEligibleForInternship: Boolean(user.student?.isEligibleInternship),
      isEligibleForProject: Boolean(user.student?.isEligibleProject),
      semester: user.student?.semester,
      academicYear: user.student?.academicYear
    }));

    res.json({
      success: true,
      data: formattedStudents,
      filters: {
        semester: semester || null,
        academicYear: academicYear || null
      },
      message: 'ดึงข้อมูลนักศึกษาสำเร็จ'
    });

  } catch (error) {
    console.error('Error in getAllStudents:', error);
    next(error);
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { studentCode: req.params.id },
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

    // คำนวณสิทธิ์
    const eligibility = calculateEligibility(
      student.studentCode,
      student.totalCredits || 0,
      student.majorCredits || 0
    );

    // ส่ง response ในรูปแบบที่มีข้อมูลเพิ่มเติม
    res.json({
      success: true,
      data: {
        studentCode: student.studentCode,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        totalCredits: student.totalCredits || 0,
        majorCredits: student.majorCredits || 0,
        eligibility: {
          studentYear: eligibility.studentYear,
          internship: eligibility.internship,
          project: eligibility.project
        }
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
};


// ฟังก์ชันอัพเดทข้อมูลนักศึกษา
exports.updateStudent = async (req, res) => {
  let transaction;
  try {
    const { id } = req.params;
    const { totalCredits, majorCredits, firstName, lastName } = req.body;

    // Start transaction
    transaction = await sequelize.transaction();

    // Find student with associated user data
    const student = await Student.findOne({
      where: { studentCode: id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['userId', 'firstName', 'lastName']
      }],
      transaction
    });

    if (!student) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    // Validate credits
    if (!totalCredits || !majorCredits) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุหน่วยกิตรวมและหน่วยกิตภาควิชา',
        received: { totalCredits, majorCredits }
      });
    }

    const parsedTotalCredits = parseInt(totalCredits);
    const parsedMajorCredits = parseInt(majorCredits);

    // Validate credit values
    if (parsedMajorCredits > parsedTotalCredits) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'หน่วยกิตภาควิชาต้องไม่มากกว่าหน่วยกิตรวม'
      });
    }

    // Calculate eligibility
    const studentYear = calculateStudentYear(id);
    const projectEligibility = isEligibleForProject(studentYear, parsedTotalCredits, parsedMajorCredits);
    const internshipEligibility = isEligibleForInternship(studentYear, parsedTotalCredits);

    // Update student record
    await Student.update({
      totalCredits: parsedTotalCredits,
      majorCredits: parsedMajorCredits,
      isEligibleInternship: internshipEligibility.eligible,
      isEligibleProject: projectEligibility.eligible,
      lastUpdated: new Date()
    }, {
      where: { studentCode: id },
      transaction
    });

    // Update user record if name is provided
    if (firstName || lastName) {
      await User.update({
        ...(firstName && { firstName }),
        ...(lastName && { lastName })
      }, {
        where: { userId: student.userId },
        transaction
      });
    }

    await transaction.commit();

    // Send response with updated data
    res.json({
      success: true,
      message: 'อัพเดทข้อมูลสำเร็จ',
      data: {
        studentCode: id,
        totalCredits: parsedTotalCredits,
        majorCredits: parsedMajorCredits,
        firstName: firstName || student.user.firstName,
        lastName: lastName || student.user.lastName,
        isEligibleInternship: internshipEligibility.eligible,
        isEligibleProject: projectEligibility.eligible,
        eligibilityDetails: {
          project: projectEligibility.message,
          internship: internshipEligibility.message
        }
      }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    
    console.error('Error in updateStudent:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deleteStudent = async (req, res, next) => {
  let transaction;
  try {
    const { id } = req.params;
    
    transaction = await sequelize.transaction();

    // Find student first to get userId
    const student = await Student.findOne({
      where: { studentCode: id },
      transaction
    });

    if (!student) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    // Delete student record first (due to foreign key constraint)
    await Student.destroy({
      where: { studentCode: id },
      transaction
    });

    // Then delete user record
    await User.destroy({
      where: { userId: student.userId },
      transaction
    });

    await transaction.commit();

    res.json({
      success: true,
      message: 'ลบข้อมูลนักศึกษาเรียบร้อย',
      data: {
        studentCode: id
      }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบข้อมูล',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.addStudent = async (req, res) => {
  let transaction;
  
  try {
    const {
      studentCode,
      firstName,
      lastName,
      totalCredits = 0,
      majorCredits = 0, 
      email
    } = req.body;

    if (!studentCode || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        required: ['studentCode', 'firstName', 'lastName']
      });
    }

    transaction = await sequelize.transaction();

    const existingStudent = await Student.findOne({
      where: { studentCode },
      transaction
    });

    if (existingStudent) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'รหัสนักศึกษานี้มีในระบบแล้ว',
        studentCode
      });
    }

    const user = await User.create({
      username: `s${studentCode}`,
      password: await bcrypt.hash(studentCode, 10),
      firstName,
      lastName, 
      email: email || `${studentCode}@email.kmutnb.ac.th`,
      role: 'student',
      activeStatus: true
    }, { transaction });

    const student = await Student.create({
      studentCode,
      userId: user.userId,
      totalCredits: parseInt(totalCredits),
      majorCredits: parseInt(majorCredits),
      gpa: 0.00,
      studyType: 'regular',
      isEligibleInternship: false,
      isEligibleProject: false,
      semester: getCurrentSemester(),
      academicYear: getCurrentAcademicYear(),
      advisorId: null
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'เพิ่มข้อมูลนักศึกษาสำเร็จ',
      data: {
        userId: user.userId,
        studentId: student.studentId,
        studentCode: student.studentCode,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        totalCredits: student.totalCredits,
        majorCredits: student.majorCredits
      }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    
    console.error('Error adding student:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'ข้อมูลซ้ำในระบบ กรุณาตรวจสอบรหัสนักศึกษาหรืออีเมล'
      });
    }

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false, 
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// เพิ่มฟังก์ชันสำหรับดึงข้อมูลทั้งหมด
exports.getAllStudentStats = async (req, res) => {
  try {
    const students = await Student.findAll({
      attributes: [
        'studentId',
        'studentCode',
        'totalCredits',
        'majorCredits',
        'isEligibleInternship',
        'isEligibleProject',
        'gpa',
        'studyType'
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName']
        },
        {
          model: Teacher,
          as: 'advisor',
          attributes: ['firstName', 'lastName']
        }
      ]
    });

    // จัดรูปแบบข้อมูลสำหรับการแสดงผล
    const stats = {
      total: students.length,
      internshipEligible: students.filter(s => s.isEligibleInternship).length,
      projectEligible: students.filter(s => s.isEligibleProject).length,
      students: students.map(s => ({
        id: s.studentId,
        studentCode: s.studentCode,
        name: `${s.user.firstName} ${s.user.lastName}`,
        advisor: s.advisor ? `${s.advisor.firstName} ${s.advisor.lastName}` : 'ยังไม่มีที่ปรึกษา',
        totalCredits: s.totalCredits,
        majorCredits: s.majorCredits,
        gpa: s.gpa?.toFixed(2) || '0.00',
        studyType: s.studyType === 'regular' ? 'ภาคปกติ' : 'ภาคพิเศษ',
        isEligibleInternship: s.isEligibleInternship,
        isEligibleProject: s.isEligibleProject
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
};
