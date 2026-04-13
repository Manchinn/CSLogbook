// Controller สำหรับ Company Internship Stats
const internshipCompanyStatsService = require('../services/internshipCompanyStatsService');
const logger = require('../utils/logger');

module.exports = {
  async getCompanyStats(req, res) {
    try {
      const { academicYear, semester, limit, page } = req.query;
      const isStaff = ['admin', 'teacher'].includes(req.user.role);

      const data = await internshipCompanyStatsService.getCompanyStats({
        academicYear: academicYear ? parseInt(academicYear, 10) : null,
        semester: semester ? parseInt(semester, 10) : null,
        limit: limit ? parseInt(limit, 10) : (isStaff ? 50 : 10),
        page: page ? parseInt(page, 10) : 1,
        isStaff
      });

      return res.json({ success: true, ...data });
    } catch (error) {
      logger.error('Error getCompanyStats:', error);
      return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงสถิติ' });
    }
  },

  // รายละเอียดนักศึกษาที่ฝึกในบริษัท (approved CS05)
  async getCompanyDetail(req, res) {
    try {
      const { companyName } = req.params;
      const { academicYear } = req.query;
      if (!companyName) {
        return res.status(400).json({ success: false, message: 'ต้องระบุ companyName' });
      }
      const data = await internshipCompanyStatsService.getCompanyDetail({
        companyName,
        academicYear: academicYear ? parseInt(academicYear, 10) : null
      });
      return res.json({ success: true, ...data });
    } catch (error) {
      logger.error('Error getCompanyDetail:', error);
      return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท' });
    }
  }
};
