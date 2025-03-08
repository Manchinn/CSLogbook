const pool = require('../config/database');

exports.getStats = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // ดึงข้อมูลสถิติรวมของนักศึกษาที่เป็น active จากตาราง users
    const [studentStats] = await connection.execute(`
      SELECT 
        COUNT(s.user_id) as total,
        SUM(CASE WHEN s.is_eligible_internship = 1 THEN 1 ELSE 0 END) as internship_eligible,
        SUM(CASE WHEN s.is_eligible_project = 1 THEN 1 ELSE 0 END) as project_eligible
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      WHERE u.active_status = true AND u.role = 'student'
    `);

    // ดึงข้อมูลคำร้องที่รอดำเนินการ
    const [pendingDocs] = await connection.execute(`
      SELECT COUNT(*) as pending
      FROM documents
      WHERE status = 'pending'
    `);

    // เพิ่ม logging เพื่อตรวจสอบข้อมูล
    console.log('Student stats:', studentStats[0]);
    console.log('Pending docs:', pendingDocs[0]);

    // ส่งข้อมูลกลับ
    res.json({
      total: studentStats[0].total || 0,
      internshipEligible: studentStats[0].internship_eligible || 0,
      projectEligible: studentStats[0].project_eligible || 0,
      pendingRequests: pendingDocs[0].pending || 0,
      systemStats: {
        usageRate: 0,
        onlineUsers: 0,
        todayDocuments: 0
      }
    });

  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ',
      details: error.message 
    });
  } finally {
    connection.release();
  }
};