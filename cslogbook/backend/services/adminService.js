const { User, Student, Document } = require('../models');
const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const logger = require('../utils/logger');

/**
 * AdminService - บริการสำหรับจัดการข้อมูลและสถิติของระบบ
 * แยก business logic ออกจาก controller เพื่อความง่ายในการดูแลรักษาและทดสอบ
 */
class AdminService {
  
  /**
   * ดึงสถิตินักศึกษาทั้งหมด
   * @returns {Object} ข้อมูลสถิตินักศึกษา
   */
  async getStudentStats() {
    try {
      logger.info('AdminService: Fetching student statistics...');

      const stats = await Student.findOne({
        include: [{
          model: User,
          as: 'user',
          where: { 
            role: 'student',
            activeStatus: true 
          },
          attributes: []
        }],
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('Student.student_id')), 'total'],
          [
            Sequelize.fn('SUM', 
              Sequelize.literal('CASE WHEN Student.is_eligible_internship = 1 THEN 1 ELSE 0 END')
            ),
            'internshipEligible'
          ],
          [
            Sequelize.fn('SUM', 
              Sequelize.literal('CASE WHEN Student.is_eligible_project = 1 THEN 1 ELSE 0 END')
            ),
            'projectEligible'
          ]
        ],
        raw: true
      });

      // จัดการข้อมูลและให้ default values
      const result = {
        total: parseInt(stats?.total) || 0,
        internshipEligible: parseInt(stats?.internshipEligible) || 0,
        projectEligible: parseInt(stats?.projectEligible) || 0
      };

      // คำนวณเปอร์เซ็นต์เพิ่มเติม
      if (result.total > 0) {
        result.internshipEligiblePercentage = Math.round((result.internshipEligible / result.total) * 100);
        result.projectEligiblePercentage = Math.round((result.projectEligible / result.total) * 100);
      } else {
        result.internshipEligiblePercentage = 0;
        result.projectEligiblePercentage = 0;
      }

      logger.info('AdminService: Student stats retrieved successfully', result);
      return result;

    } catch (error) {
      logger.error('AdminService: Error fetching student stats', error);
      throw new Error('ไม่สามารถดึงข้อมูลสถิตินักศึกษาได้: ' + error.message);
    }
  }

  /**
   * ดึงสถิติเอกสารทั้งหมด
   * @returns {Object} ข้อมูลสถิติเอกสาร
   */
  async getDocumentStats() {
    try {
      logger.info('AdminService: Fetching document statistics...');

      const docs = await Document.findAndCountAll({
        attributes: [
          [Sequelize.fn('COUNT', Sequelize.col('*')), 'total'],
          [
            Sequelize.fn('COUNT', 
              Sequelize.literal('CASE WHEN status = \'pending\' THEN 1 END')
            ),
            'pending'
          ],
          [
            Sequelize.fn('COUNT', 
              Sequelize.literal('CASE WHEN status = \'approved\' THEN 1 END')
            ),
            'approved'
          ],
          [
            Sequelize.fn('COUNT', 
              Sequelize.literal('CASE WHEN status = \'rejected\' THEN 1 END')
            ),
            'rejected'
          ]
        ],
        raw: true
      });

      const result = {
        total: parseInt(docs.rows[0]?.total) || 0,
        pending: parseInt(docs.rows[0]?.pending) || 0,
        approved: parseInt(docs.rows[0]?.approved) || 0,
        rejected: parseInt(docs.rows[0]?.rejected) || 0
      };

      logger.info('AdminService: Document stats retrieved successfully', result);
      return result;

    } catch (error) {
      logger.error('AdminService: Error fetching document stats', error);
      throw new Error('ไม่สามารถดึงข้อมูลสถิติเอกสารได้: ' + error.message);
    }
  }

  /**
   * ดึงสถิติระบบทั่วไป
   * @returns {Object} ข้อมูลสถิติระบบ
   */
  async getSystemStats() {
    try {
      logger.info('AdminService: Fetching system statistics...');

      // ผู้ใช้ที่ออนไลน์ (เข้าสู่ระบบใน 15 นาทีที่ผ่านมา)
      const onlineUsers = await User.count({
        where: {
          lastLogin: {
            [Op.gte]: moment().subtract(15, 'minutes')
          }
        }
      });

      // ผู้ใช้ที่เข้าสู่ระบบวันนี้
      const todayUsers = await User.count({
        where: {
          lastLogin: {
            [Op.gte]: moment().startOf('day')
          }
        }
      });

      // ผู้ใช้ทั้งหมดในระบบ
      const totalUsers = await User.count({
        where: {
          activeStatus: true
        }
      });

      const result = {
        onlineUsers,
        todayUsers,
        totalUsers,
        lastUpdate: moment().format()
      };

      logger.info('AdminService: System stats retrieved successfully', result);
      return result;

    } catch (error) {
      logger.error('AdminService: Error fetching system stats', error);
      throw new Error('ไม่สามารถดึงข้อมูลสถิติระบบได้: ' + error.message);
    }
  }

  /**
   * ดึงข้อมูลสถิติทั้งหมดในครั้งเดียว
   * @returns {Object} ข้อมูลสถิติทั้งหมด
   */
  async getAllStats() {
    try {
      logger.info('AdminService: Fetching all statistics...');

      // ใช้ Promise.all เพื่อดึงข้อมูลพร้อมกัน (ประสิทธิภาพดีกว่า)
      const [studentStats, documentStats, systemStats] = await Promise.all([
        this.getStudentStats(),
        this.getDocumentStats(),
        this.getSystemStats()
      ]);

      const result = {
        students: studentStats,
        documents: documentStats,
        system: systemStats,
        generatedAt: moment().format()
      };

      logger.info('AdminService: All stats retrieved successfully');
      return result;

    } catch (error) {
      logger.error('AdminService: Error fetching all stats', error);
      throw new Error('ไม่สามารถดึงข้อมูลสถิติทั้งหมดได้: ' + error.message);
    }
  }

  /**
   * ดึงกิจกรรมล่าสุดของระบบ
   * @param {number} limit - จำนวนกิจกรรมที่ต้องการดึง
   * @returns {Array} รายการกิจกรรมล่าสุด
   */
  async getRecentActivities(limit = 10) {
    try {
      logger.info(`AdminService: Fetching recent activities (limit: ${limit})...`);

      // TODO: ในอนาคตอาจจะมีตาราง ActivityLog หรือ AuditLog
      // ตอนนี้ใช้ข้อมูลตัวอย่างก่อน
      const activities = [
        {
          id: 1,
          type: 'document_approved',
          title: 'เอกสาร คพ.05 ได้รับการอนุมัติ',
          description: 'เอกสารคำร้องขอฝึกงานของนักศึกษา รหัส 6309850001 ได้รับการอนุมัติ',
          timestamp: moment().subtract(5, 'minutes').format(),
          user: 'อาจารย์สมชาย'
        },
        {
          id: 2,
          type: 'student_registered',
          title: 'นักศึกษาลงทะเบียนใหม่',
          description: 'นักศึกษาใหม่ 3 คน ได้ลงทะเบียนเข้าใช้ระบบ',
          timestamp: moment().subtract(1, 'hour').format(),
          user: 'ระบบ'
        },
        {
          id: 3,
          type: 'timeline_updated',
          title: 'อัปเดต Timeline',
          description: 'นักศึกษา รหัส 6309850002 อัปเดตขั้นตอนการฝึกงาน',
          timestamp: moment().subtract(2, 'hours').format(),
          user: 'นางสาวสมหญิง'
        }
      ];

      const result = activities.slice(0, limit);
      logger.info(`AdminService: Retrieved ${result.length} recent activities`);
      return result;

    } catch (error) {
      logger.error('AdminService: Error fetching recent activities', error);
      throw new Error('ไม่สามารถดึงข้อมูลกิจกรรมล่าสุดได้: ' + error.message);
    }
  }
}

module.exports = new AdminService();
