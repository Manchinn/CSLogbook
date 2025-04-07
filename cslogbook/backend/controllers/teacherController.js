const { User, Teacher, Student, Sequelize } = require('../models');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');

function generateRandomStudentID() {
    return Math.random().toString().slice(2, 15); // สุ่มเลข 13 ตัว
}

function generateUsernameFromEmail(email) {
    const [name, domain] = email.split('@');
    const [firstName, lastNameInitial] = name.split('.');
    return `${firstName}.${lastNameInitial.charAt(0)}`.toLowerCase();
}

exports.getAllTeachers = async (req, res, next) => {
  try {
    const teachers = await User.findAll({
      where: { role: 'teacher' },
      attributes: ['userId', 'firstName', 'lastName', 'email'],
      include: [{
        model: Teacher,
        as: 'teacher',
        required: true,
        attributes: ['teacherId', 'teacherCode', 'contactExtension']
      }]
    });

    const formattedTeachers = teachers.map(user => ({
      userId: user.userId,                    // hidden field
      teacherId: user.teacher?.teacherId,     // hidden field
      teacherCode: user.teacher?.teacherCode || '',
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactExtension: user.teacher?.contactExtension || ''
    }));

    res.json({
      success: true,
      data: formattedTeachers,
      message: 'ดึงข้อมูลอาจารย์สำเร็จ'
    });

  } catch (error) {
    console.error('Error in getAllTeachers:', error);
    next(error);
  }
};

exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({
      where: { teacherCode: req.params.id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลอาจารย์'
      });
    }

    res.json({
      success: true,
      data: {
        teacherCode: teacher.teacherCode,
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
        contactExtension: teacher.contactExtension
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

exports.addTeacher = async (req, res) => {
  let transaction;
  try {
    const {
      teacherCode,
      firstName,
      lastName,
      email,
      contactExtension
    } = req.body;

    if (!teacherCode || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน',
        required: ['teacherCode', 'firstName', 'lastName']
      });
    }

    transaction = await sequelize.transaction();

    const existingTeacher = await Teacher.findOne({
      where: { teacherCode },
      transaction
    });

    if (existingTeacher) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'รหัสอาจารย์นี้มีในระบบแล้ว',
        teacherCode
      });
    }
    const username = email ? email.split('@')[0] : `t${teacherCode}`;

    const user = await User.create({
      username,
      password: await bcrypt.hash(username, 10),
      firstName,
      lastName,
      email: email || `${teacherCode}@sci.kmtunb.ac.th`, //หรือ MBK@sci.kmutnb.ac.th
      role: 'teacher',
      activeStatus: true
    }, { transaction });

    const teacher = await Teacher.create({
      teacherCode,
      userId: user.userId,
      contactExtension
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'เพิ่มข้อมูลอาจารย์สำเร็จ',
      data: {
        teacherId: teacher.teacherId,
        teacherCode: teacher.teacherCode,
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactExtension: teacher.contactExtension
      }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    
    console.error('Error adding teacher:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'ข้อมูลซ้ำในระบบ กรุณาตรวจสอบรหัสอาจารย์หรืออีเมล'
      });
    }

    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateTeacher = async (req, res) => {
  let transaction;
  try {
    const { id } = req.params; // เปลี่ยนชื่อให้สอดคล้องกับการใช้งาน
    const { firstName, lastName, email, contactExtension } = req.body;

    transaction = await sequelize.transaction();

    // เปลี่ยนจากการค้นหาด้วย teacherCode เป็น teacherId
    const teacher = await Teacher.findOne({
      where: { teacherId: id }, // เปลี่ยนจาก teacherCode เป็น teacherId
      include: [{
        model: User,
        as: 'user'
      }],
      transaction
    });

    if (!teacher) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลอาจารย์'
      });
    }

    // Update teacher record - แก้ไขตรงนี้ด้วย
    await Teacher.update({
      contactExtension: contactExtension || teacher.contactExtension
    }, {
      where: { teacherId: id }, // เปลี่ยนจาก teacherCode เป็น teacherId
      transaction
    });

    // Update user record
    if (firstName || lastName || email) {
      await User.update({
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email })
      }, {
        where: { userId: teacher.userId },
        transaction
      });
    }

    await transaction.commit();

    res.json({
      success: true,
      message: 'อัพเดทข้อมูลสำเร็จ',
      data: {
        teacherId: id, // ส่งกลับ teacherId
        teacherCode: teacher.teacherCode, // ยังคงส่ง teacherCode กลับไปด้วย
        firstName: firstName || teacher.user.firstName,
        lastName: lastName || teacher.user.lastName,
        email: email || teacher.user.email,
        contactExtension: contactExtension || teacher.contactExtension
      }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    
    console.error('Error in updateTeacher:', error);
    
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

exports.deleteTeacher = async (req, res) => {
  let transaction;
  try {
    const { id } = req.params; // เก็บชื่อเป็น id แต่จะใช้เป็น teacherId แทน
    
    transaction = await sequelize.transaction();

    // เปลี่ยนการค้นหาจาก teacherCode เป็น teacherId
    const teacher = await Teacher.findOne({
      where: { teacherId: id },
      transaction
    });

    if (!teacher) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลอาจารย์'
      });
    }

    // เปลี่ยนเงื่อนไขการลบจาก teacherCode เป็น teacherId
    await Teacher.destroy({
      where: { teacherId: id },
      transaction
    });

    // คงเดิม
    await User.destroy({
      where: { userId: teacher.userId },
      transaction
    });

    await transaction.commit();

    res.json({
      success: true,
      message: 'ลบข้อมูลอาจารย์เรียบร้อย',
      data: {
        teacherId: id, // เปลี่ยนจาก teacherCode เป็น teacherId
        teacherCode: teacher.teacherCode // ยังคงส่ง teacherCode กลับไปเพื่อความสะดวกในการใช้งาน
      }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    
    console.error('Error deleting teacher:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบข้อมูล',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getAdvisees = async (req, res) => {
  try {
    const { id } = req.params;

    // ตรวจสอบว่ามีอาจารย์คนนี้หรือไม่
    const teacher = await Teacher.findOne({
      where: { teacherCode: id }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลอาจารย์'
      });
    }

    // ดึงข้อมูลนักศึกษาที่เป็นที่ปรึกษา
    const advisees = await Student.findAll({
      where: { advisorId: teacher.teacherId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    const formattedAdvisees = advisees.map(student => ({
      studentCode: student.studentCode,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      totalCredits: student.totalCredits,
      majorCredits: student.majorCredits,
      isEligibleInternship: student.isEligibleInternship,
      isEligibleProject: student.isEligibleProject
    }));

    res.json({
      success: true,
      data: formattedAdvisees,
      message: 'ดึงข้อมูลนักศึกษาในที่ปรึกษาสำเร็จ'
    });

  } catch (error) {
    console.error('Error in getAdvisees:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษาในที่ปรึกษา',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};