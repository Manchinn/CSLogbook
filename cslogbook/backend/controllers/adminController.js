// นำเข้า adminService สำหรับจัดการ business logic
const adminService = require('../services/adminService');

// Controller exports
module.exports = {
  getStats: async (req, res) => {
    try {
      // ใช้ adminService เพื่อดึงสถิติทั้งหมด
      const stats = await adminService.getAllStats();

      res.json(stats);

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
      const stats = await adminService.getStudentStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching student stats:', error);
      res.status(500).json({ 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getDocumentStats: async (req, res) => {
    try {
      const stats = await adminService.getDocumentStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching document stats:', error);
      res.status(500).json({ 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getSystemStats: async (req, res) => {
    try {
      const stats = await adminService.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      res.status(500).json({ 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลระบบ',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getRecentActivities: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const activities = await adminService.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ 
        error: 'เกิดข้อผิดพลาดในการดึงกิจกรรมล่าสุด',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};