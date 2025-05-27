const { User, Teacher, Student } = require('../models');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

class TeacherService {
  /**
   * ดึงข้อมูลอาจารย์ทั้งหมด
   */
  async getAllTeachers() {
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

      return teachers.map(user => ({
        userId: user.userId,
        teacherId: user.teacher?.teacherId,
        teacherCode: user.teacher?.teacherCode || '',
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactExtension: user.teacher?.contactExtension || ''
      }));
    } catch (error) {
      logger.error('Error in getAllTeachers service:', error);
      throw new Error('ไม่สามารถดึงข้อมูลอาจารย์ได้');
    }
  }

  /**
   * ดึงข้อมูลอาจารย์ตาม teacherCode
   */
  async getTeacherById(teacherCode) {
    try {
      const teacher = await Teacher.findOne({
        where: { teacherCode },
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }]
      });

      if (!teacher) {
        throw new Error('ไม่พบข้อมูลอาจารย์');
      }

      return {
        teacherCode: teacher.teacherCode,
        firstName: teacher.user.firstName,
        lastName: teacher.user.lastName,
        email: teacher.user.email,
        contactExtension: teacher.contactExtension
      };
    } catch (error) {
      logger.error('Error in getTeacherById service:', error);
      if (error.message === 'ไม่พบข้อมูลอาจารย์') {
        throw error;
      }
      throw new Error('ไม่สามารถดึงข้อมูลอาจารย์ได้');
    }
  }

  /**
   * เพิ่มอาจารย์ใหม่
   */
  async addTeacher(teacherData) {
    const transaction = await sequelize.transaction();

    try {
      const {
        teacherCode,
        firstName,
        lastName,
        email,
        contactExtension
      } = teacherData;

      if (!teacherCode || !firstName || !lastName) {
        throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
      }

      const existingTeacher = await Teacher.findOne({
        where: { teacherCode },
        transaction
      });

      if (existingTeacher) {
        await transaction.rollback();
        throw new Error('รหัสอาจารย์นี้มีในระบบแล้ว');
      }

      const username = email ? email.split('@')[0] : `t${teacherCode}`;

      const user = await User.create({
        username,
        password: await bcrypt.hash(username, 10),
        firstName,
        lastName,
        email: email || `${teacherCode}@sci.kmutnb.ac.th`,
        role: 'teacher',
        activeStatus: true
      }, { transaction });

      const teacher = await Teacher.create({
        teacherCode,
        userId: user.userId,
        contactExtension
      }, { transaction });

      await transaction.commit();

      return {
        teacherId: teacher.teacherId,
        teacherCode: teacher.teacherCode,
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactExtension: teacher.contactExtension
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error in addTeacher service:', error);
      throw error;
    }
  }

  /**
   * อัพเดทข้อมูลอาจารย์
   */
  async updateTeacher(teacherId, updateData) {
    const transaction = await sequelize.transaction();

    try {
      const { firstName, lastName, email, contactExtension } = updateData;

      const teacher = await Teacher.findOne({
        where: { teacherId },
        include: [{
          model: User,
          as: 'user'
        }],
        transaction
      });

      if (!teacher) {
        await transaction.rollback();
        throw new Error('ไม่พบข้อมูลอาจารย์');
      }

      // Update teacher record
      await Teacher.update({
        contactExtension: contactExtension || teacher.contactExtension
      }, {
        where: { teacherId },
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

      return {
        teacherId,
        teacherCode: teacher.teacherCode,
        firstName: firstName || teacher.user.firstName,
        lastName: lastName || teacher.user.lastName,
        email: email || teacher.user.email,
        contactExtension: contactExtension || teacher.contactExtension
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error in updateTeacher service:', error);
      throw error;
    }
  }

  /**
   * ลบข้อมูลอาจารย์
   */
  async deleteTeacher(teacherId) {
    const transaction = await sequelize.transaction();

    try {
      const teacher = await Teacher.findOne({
        where: { teacherId },
        transaction
      });

      if (!teacher) {
        await transaction.rollback();
        throw new Error('ไม่พบข้อมูลอาจารย์');
      }

      await Teacher.destroy({
        where: { teacherId },
        transaction
      });

      await User.destroy({
        where: { userId: teacher.userId },
        transaction
      });

      await transaction.commit();

      return {
        teacherId,
        teacherCode: teacher.teacherCode
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error in deleteTeacher service:', error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลนักศึกษาในที่ปรึกษา
   */
  async getAdvisees(teacherCode) {
    try {
      // ตรวจสอบว่ามีอาจารย์คนนี้หรือไม่
      const teacher = await Teacher.findOne({
        where: { teacherCode }
      });

      if (!teacher) {
        throw new Error('ไม่พบข้อมูลอาจารย์');
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

      return advisees.map(student => ({
        studentCode: student.studentCode,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        totalCredits: student.totalCredits,
        majorCredits: student.majorCredits,
        isEligibleInternship: student.isEligibleInternship,
        isEligibleProject: student.isEligibleProject
      }));
    } catch (error) {
      logger.error('Error in getAdvisees service:', error);
      if (error.message === 'ไม่พบข้อมูลอาจารย์') {
        throw error;
      }
      throw new Error('ไม่สามารถดึงข้อมูลนักศึกษาในที่ปรึกษาได้');
    }
  }

  /**
   * สร้าง username จาก email
   */
  generateUsernameFromEmail(email) {
    const [name, domain] = email.split('@');
    const [firstName, lastNameInitial] = name.split('.');
    return `${firstName}.${lastNameInitial.charAt(0)}`.toLowerCase();
  }

  /**
   * สร้าง student ID แบบสุ่ม
   */
  generateRandomStudentID() {
    return Math.random().toString().slice(2, 15); // สุ่มเลข 13 ตัว
  }
}

module.exports = new TeacherService();
