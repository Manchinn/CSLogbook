const { User, Student, Document } = require('../models');
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
    // แปลง action เป็น type ที่ frontend เข้าใจได้
    const getTypeFromAction = (action) => {
      switch (action) {
        case 'login': return 'user_login';
        case 'upload_document': return 'document_uploaded';
        case 'approve_document': return 'document_approved';
        case 'reject_document': return 'document_rejected';
        default: return 'other';
      }
    };

    // สร้างข้อมูลกิจกรรมตัวอย่างแทนการใช้ ActivityLog model
    const mockActivities = [
      // กิจกรรมการเข้าสู่ระบบ
      {
        id: 1,
        username: 'admin1',
        action: 'login',
        details: 'ผู้ดูแลระบบเข้าสู่ระบบ',
        ip: '::1',
        userAgent: 'Mozilla/5.0',
        createdAt: moment().subtract(10, 'minutes').toDate()
      },
      // กิจกรรมการจัดการเอกสาร
      {
        id: 2,
        username: 'student1',
        action: 'upload_document',
        details: 'อัปโหลดเอกสาร IN-01 (แบบฟอร์มขอฝึกงาน)',
        category: 'internship',
        documentType: 'IN-01',
        ip: '::1',
        userAgent: 'Mozilla/5.0',
        createdAt: moment().subtract(30, 'minutes').toDate()
      },
      {
        id: 3,
        username: 'teacher1',
        action: 'approve_document',
        details: 'อนุมัติเอกสาร IN-01 ของนักศึกษา student1',
        category: 'internship',
        documentType: 'IN-01',
        ip: '::1',
        userAgent: 'Mozilla/5.0',
        createdAt: moment().subtract(2, 'hours').toDate()
      },
      // กิจกรรมการจัดการโครงงาน
      {
        id: 4,
        username: 'student2',
        action: 'upload_document',
        details: 'ส่งเอกสารข้อเสนอโครงงาน PJ-01',
        category: 'project',
        documentType: 'PJ-01',
        ip: '::1',
        userAgent: 'Mozilla/5.0',
        createdAt: moment().subtract(1, 'day').toDate()
      },
      {
        id: 5,
        username: 'academic1',
        action: 'create_deadline',
        details: 'สร้างกำหนดการส่งเอกสาร PJ-02 วันที่ 15 พ.ค. 2568',
        category: 'system',
        ip: '::1',
        userAgent: 'Mozilla/5.0',
        createdAt: moment().subtract(2, 'days').toDate()
      },
      // กิจกรรมการจัดการบัญชี
      {
        id: 6,
        username: 'admin1',
        action: 'create_user',
        details: 'สร้างบัญชีผู้ใช้ใหม่สำหรับ teacher3',
        category: 'user_management',
        ip: '::1',
        userAgent: 'Mozilla/5.0',
        createdAt: moment().subtract(3, 'days').toDate()
      },
      // กิจกรรมการนัดหมาย
      {
        id: 7,
        username: 'teacher2',
        action: 'create_meeting',
        details: 'สร้างการนัดหมายสำหรับกลุ่มโครงงาน CS01',
        category: 'meeting',
        ip: '::1',
        userAgent: 'Mozilla/5.0',
        createdAt: moment().subtract(4, 'days').toDate()
      },
      // กิจกรรมการเข้าดูข้อมูล
      {
        id: 8,
        username: 'admin1',
        action: 'view_stats',
        details: 'ดูสถิติการใช้งานระบบ',
        category: 'system',
        ip: '::1',
        userAgent: 'Mozilla/5.0',
        createdAt: moment().subtract(5, 'days').toDate()
      },
      // กิจกรรมการแก้ไขหลักสูตร
      {
        id: 9,
        username: 'academic1',
        action: 'update_curriculum',
        details: 'อัปเดตข้อมูลหลักสูตร CS2561',
        category: 'curriculum',
        ip: '::1',
        userAgent: 'Mozilla/5.0',
        createdAt: moment().subtract(6, 'days').toDate()
      },
      // กิจกรรมการอนุมัติสิทธิ์
      {
        id: 10,
        username: 'admin1',
        action: 'reject_document',
        details: 'ปฏิเสธเอกสาร IN-02 ของนักศึกษา student3',
        category: 'permission',
        ip: '::1',
        userAgent: 'Mozilla/5.0',
        createdAt: moment().subtract(7, 'days').toDate()
      }
    ];

    // แปลงข้อมูลให้ตรงกับรูปแบบที่ frontend ต้องการ
    const formattedActivities = mockActivities.map(activity => {
      // สร้างข้อความสำหรับ title ตามประเภทกิจกรรม
      let title;
      switch (activity.action) {
        case 'login':
          title = `${activity.username} เข้าสู่ระบบ`;
          break;
        case 'upload_document':
          title = `${activity.username} อัปโหลดเอกสาร`;
          break;
        case 'approve_document':
          title = `${activity.username} อนุมัติเอกสาร`;
          break;
        case 'reject_document':
          title = `${activity.username} ปฏิเสธเอกสาร`;
          break;
        case 'create_deadline':
          title = `${activity.username} สร้างกำหนดการ`;
          break;
        case 'create_user':
          title = `${activity.username} สร้างผู้ใช้ใหม่`;
          break;
        case 'create_meeting':
          title = `${activity.username} สร้างการนัดหมาย`;
          break;
        case 'view_stats':
          title = `${activity.username} ดูสถิติระบบ`;
          break;
        case 'update_curriculum':
          title = `${activity.username} อัปเดตหลักสูตร`;
          break;
        default:
          title = `${activity.username} ทำกิจกรรมในระบบ`;
      }

      return {
        id: activity.id,
        type: getTypeFromAction(activity.action), // แปลง action เป็น type ที่ frontend รู้จัก
        title: title,
        description: activity.details,
        timestamp: activity.createdAt,
        username: activity.username,
        category: activity.category || 'general'
      };
    });

    console.log('Sending formatted activities data');
    res.json(formattedActivities);
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
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