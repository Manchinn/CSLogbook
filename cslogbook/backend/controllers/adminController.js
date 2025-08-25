// นำเข้า adminService สำหรับจัดการ business logic
const adminService = require('../services/adminService');
const { updateAllStudentsEligibility, updateStudentEligibility } = require('../agents/eligibilityUpdater');

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
  const offset = req.query.offset ? parseInt(req.query.offset) : undefined;
  const cursor = req.query.cursor || undefined; // timestamp string
  const format = req.query.format || 'array';
  const mode = req.query.mode || undefined; // documents | all (default)

  const options = { limit, offset, cursor, format, mode };
  const activities = await adminService.getRecentActivities(options);
  res.json(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ 
        error: 'เกิดข้อผิดพลาดในการดึงกิจกรรมล่าสุด',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * อัปเดตสิทธิ์การฝึกงาน/โครงงานของนักศึกษาทั้งหมด
   */
  async updateAllStudentsEligibility(req, res) {
    try {
      logger.info('Admin: เริ่มการอัปเดตสิทธิ์นักศึกษาทั้งหมด');
      
      const result = await updateAllStudentsEligibility();
      
      if (result.success) {
        logger.info(`Admin: อัปเดตสิทธิ์สำเร็จ ${result.updated}/${result.total} คน`);
        res.json({
          success: true,
          message: `อัปเดตสิทธิ์สำเร็จ ${result.updated}/${result.total} คน`,
          data: result
        });
      } else {
        logger.error(`Admin: เกิดข้อผิดพลาดในการอัปเดตสิทธิ์: ${result.error}`);
        res.status(500).json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์',
          error: result.error
        });
      }
    } catch (error) {
      logger.error('Admin: Error in updateAllStudentsEligibility:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์',
        error: error.message
      });
    }
  },

  /**
   * อัปเดตสิทธิ์การฝึกงาน/โครงงานของนักศึกษารายบุคคล
   */
  async updateStudentEligibility(req, res) {
    try {
      const { studentCode } = req.params;
      
      if (!studentCode) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุรหัสนักศึกษา'
        });
      }
      
      logger.info(`Admin: เริ่มการอัปเดตสิทธิ์นักศึกษา ${studentCode}`);
      
      const result = await updateStudentEligibility(studentCode);
      
      if (result.success) {
        logger.info(`Admin: อัปเดตสิทธิ์นักศึกษา ${studentCode} สำเร็จ`);
        res.json({
          success: true,
          message: `อัปเดตสิทธิ์นักศึกษา ${studentCode} สำเร็จ`,
          data: result
        });
      } else {
        logger.error(`Admin: เกิดข้อผิดพลาดในการอัปเดตสิทธิ์นักศึกษา ${studentCode}: ${result.message || result.error}`);
        res.status(400).json({
          success: false,
          message: result.message || 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์',
          error: result.error
        });
      }
    } catch (error) {
      logger.error('Admin: Error in updateStudentEligibility:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์',
        error: error.message
      });
    }
  }
};