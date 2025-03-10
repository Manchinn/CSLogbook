const { User, Student, Teacher, Sequelize } = require('../models');
const bcrypt = require('bcrypt');
const { calculateStudentYear, isEligibleForInternship, isEligibleForProject } = require('../utils/studentUtils');
const { Op } = require('sequelize');

// ฟังก์ชันดึงข้อมูลนักศึกษาตาม ID
const calculateEligibility = (studentCode, totalCredits, majorCredits) => {
  const studentYear = calculateStudentYear(studentCode);
  return {
    studentYear,
    internship: isEligibleForInternship(studentYear, totalCredits),
    project: isEligibleForProject(studentYear, totalCredits, majorCredits)
  };
};

// เพิ่มฟังก์ชันใหม่สำหรับดึงตัวเลือก filter
exports.getAcademicFilterOptions = async (req, res) => {
  try {
    // ดึงข้อมูล semester และ academic_year ที่มีในระบบ
    const filterOptions = await Student.findAll({
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('semester')), 'semester'],
        [Sequelize.fn('DISTINCT', Sequelize.col('academic_year')), 'academicYear']
      ],
      raw: true
    });

    // จัดกลุ่มและเรียงลำดับข้อมูล
    const semesters = [...new Set(filterOptions.map(opt => opt.semester))]
      .filter(sem => sem) // กรองค่า null/undefined
      .sort();

    const academicYears = [...new Set(filterOptions.map(opt => opt.academicYear))]
      .filter(year => year) // กรองค่า null/undefined
      .sort((a, b) => b - a); // เรียงจากปีล่าสุด

    res.json({
      success: true,
      data: {
        semesters: semesters.map(sem => ({
          value: sem,
          label: sem === 3 ? 'ภาคฤดูร้อน' : `ภาคเรียนที่ ${sem}`
        })),
        academicYears: academicYears.map(year => ({
          value: year,
          label: `ปีการศึกษา ${year}`
        }))
      }
    });

  } catch (error) {
    console.error('Error getting filter options:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงตัวเลือกการกรอง'
    });
  }
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
      where: { studentCode: req.params.id }
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

    // ส่ง response ในรูปแบบที่ frontend ต้องการ
    res.json({
      success: true,
      data: {
        studentCode: student.studentCode,
        totalCredits: student.totalCredits || 0,
        majorCredits: student.majorCredits || 0,
        eligibility: {
          studentYear: eligibility.studentYear,
          internship: eligibility.internship,
          project: eligibility.project
        }
      }
    });
    /* console.log('Eligibility calculation:', {
      studentCode: student.studentCode,
      totalCredits: student.totalCredits,
      majorCredits: student.majorCredits,
      eligibility
    }); */

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
  try {
    const { id } = req.params;
    const { totalCredits, majorCredits, gpa } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!totalCredits || !majorCredits) {
      return res.status(400).json({
        message: 'กรุณาระบุหน่วยกิตรวมและหน่วยกิตภาควิชา',
        received: { totalCredits, majorCredits }
      });
    }

    // แปลงและคำนวณข้อมูล
    const parsedTotalCredits = parseInt(totalCredits);
    const parsedMajorCredits = parseInt(majorCredits);
    const parsedGpa = parseFloat(gpa || 0);

    const studentYear = calculateStudentYear(id);
    const projectEligibility = isEligibleForProject(studentYear, parsedTotalCredits, parsedMajorCredits);
    const internshipEligibility = isEligibleForInternship(studentYear, parsedTotalCredits);

    // อัพเดทข้อมูลในฐานข้อมูล
    const [updatedRows] = await Student.update({
      totalCredits: parsedTotalCredits,
      majorCredits: parsedMajorCredits,
      gpa: parsedGpa,
      isEligibleInternship: internshipEligibility.eligible,
      isEligibleProject: projectEligibility.eligible,
      lastUpdated: new Date()
    }, {
      where: { studentCode: id },
      returning: true
    });

    if (updatedRows === 0) {
      return res.status(404).json({
        message: 'ไม่พบข้อมูลนักศึกษา',
        studentId: id
      });
    }

    // ส่งข้อมูลที่อัพเดทกลับ
    res.json({
      student_code: id,
      total_credits: parsedTotalCredits,
      major_credits: parsedMajorCredits,
      gpa: parsedGpa.toFixed(2),
      is_eligible_internship: internshipEligibility.eligible,
      is_eligible_project: projectEligibility.eligible,
      messages: {
        project: projectEligibility.message,
        internship: internshipEligibility.message
      }
    });

  } catch (error) {
    console.error('Error in updateStudent:', error);
    res.status(500).json({
      message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล',
      error: error.message
    });
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await User.destroy({
      where: {
        studentID: id,
        role: 'student'
      }
    });

    if (result === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลนักศึกษา' });
    }

    // Student record will be deleted automatically due to CASCADE
    res.json({ success: true, message: 'ลบข้อมูลนักศึกษาเรียบร้อย' });
  } catch (error) {
    console.error('Error deleting student:', error);
    next(error);
  }
};

exports.addStudent = async (req, res) => {
  try {
    const {
      studentCode,
      firstName,
      lastName,
      email,
      totalCredits,
      majorCredits,
      gpa,
      studyType,
      advisorId
    } = req.body;

    // สร้าง user account
    const password = studentCode; // รหัสผ่านเริ่มต้นคือรหัสนักศึกษา
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: `s${studentCode}`,
      password: hashedPassword,
      firstName,
      lastName,
      email,
      role: 'student'
    });

    // สร้างข้อมูลนักศึกษา
    const student = await Student.create({
      studentCode,
      userId: user.id,
      totalCredits: totalCredits || 0,
      majorCredits: majorCredits || 0,
      gpa: gpa || 0.00,
      studyType: studyType || 'regular',
      advisorId,
      isEligibleInternship: false,
      isEligibleProject: false
    });

    res.status(201).json({
      success: true,
      message: 'เพิ่มข้อมูลนักศึกษาสำเร็จ',
      data: {
        studentId: student.studentId,
        studentCode: student.studentCode
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล' });
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
