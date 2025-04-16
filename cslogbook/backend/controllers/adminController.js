const { User, Student, Document, ActivityLog } = require('../models');
const { Op, Sequelize } = require('sequelize');
const moment = require('moment');

// ฟังก์ชันย่อยสำหรับดึงข้อมูลนักศึกษา
const getStudentStats = async () => {
  try {
    //console.log('Fetching student stats...');

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

    //console.log('Raw stats:', stats); // Debug log

    return {
      total: parseInt(stats?.total) || 0,
      internshipEligible: parseInt(stats?.internshipEligible) || 0,
      projectEligible: parseInt(stats?.projectEligible) || 0
    };
  } catch (error) {
    console.error('Error in getStudentStats:', error);
    throw error;
  }
};

// ฟังก์ชันย่อยสำหรับดึงข้อมูลเอกสาร
const getDocumentStats = async () => {
  const docs = await Document.findAndCountAll({
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('*')), 'total'],
      [
        Sequelize.fn('COUNT', 
          Sequelize.literal('CASE WHEN status = \'pending\' THEN 1 END')
        ),
        'pending'
      ]
    ],
    raw: true
  });

  return {
    total: parseInt(docs.rows[0]?.total) || 0,
    pending: parseInt(docs.rows[0]?.pending) || 0
  };
};

// ฟังก์ชันย่อยสำหรับดึงข้อมูลระบบ
const getSystemStats = async () => {
  const onlineUsers = await User.count({
    where: {
      lastLogin: {
        [Op.gte]: moment().subtract(15, 'minutes')
      }
    }
  });

  return {
    onlineUsers,
    lastUpdate: moment().format()
  };
};

// เพิ่มฟังก์ชันสำหรับดึงกิจกรรมล่าสุด
const getRecentActivities = async (req, res) => {
  try {
    // ดึง 20 กิจกรรมล่าสุด (แก้ไขตามชื่อ model และ field ที่ใช้จริง)
    const activities = await ActivityLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงกิจกรรมล่าสุด' });
  }
};

// Controller exports
module.exports = {
  getStats: async (req, res) => {
    try {

      const stats = await getStudentStats();

      const responseData = {
        students: {
          total: stats.total,
          internshipEligible: parseInt(stats.internshipEligible),
          projectEligible: parseInt(stats.projectEligible)
        },
        documents: {
          total: await Document.count(),
          pending: await Document.count({ where: { status: 'pending' } })
        },
        system: {
          onlineUsers: await User.count({
            where: {
              lastLogin: {
                [Op.gte]: moment().subtract(15, 'minutes')
              }
            }
          }),
          lastUpdate: moment().format()
        }
      };

      res.json(responseData);

    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Individual stats endpoints
  getStudentStats: async (req, res) => {
    try {
      const stats = await getStudentStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา' });
    }
  },

  getDocumentStats: async (req, res) => {
    try {
      const total = await Document.count();
      const pending = await Document.count({ where: { status: 'pending' } });
      res.json({ total, pending });
    } catch (error) {
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร' });
    }
  },

  getSystemStats: async (req, res) => {
    try {
      const onlineUsers = await User.count({
        where: {
          lastLogin: {
            [Op.gte]: moment().subtract(15, 'minutes')
          }
        }
      });
      res.json({
        onlineUsers,
        lastUpdate: moment().format()
      });
    } catch (error) {
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลระบบ' });
    }
  },

  // เพิ่ม export ฟังก์ชันนี้
  getRecentActivities
};