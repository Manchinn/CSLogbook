const { promoteAllStudents } = require('../utils/promotionUtils');
const { ActivityLog } = require('../models');

// ...existing code...

// เพิ่ม controller สำหรับการเลื่อนชั้นปี
const promoteStudents = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'ไม่มีสิทธิ์ในการเลื่อนชั้นปี' 
      });
    }

    const results = await promoteAllStudents();
    
    await ActivityLog.create({
      userId: req.user.id,
      action: 'promote_students',
      details: JSON.stringify(results)
    });

    res.json({
      success: true,
      message: 'เลื่อนชั้นปีเรียบร้อยแล้ว',
      results
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการเลื่อนชั้นปี',
      details: error.message 
    });
  }
};

module.exports = {
  // ...existing exports...
  promoteStudents
};