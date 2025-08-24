// Controller สำหรับ Company Internship Stats
const internshipCompanyStatsService = require('../services/internshipCompanyStatsService');

module.exports = {
  async getCompanyStats(req, res) {
    try {
      const { academicYear, semester, limit } = req.query;
      const isStaff = ['admin', 'teacher'].includes(req.user.role); // อนาคตเพิ่ม role staff อื่นได้

      const data = await internshipCompanyStatsService.getCompanyStats({
        academicYear: academicYear ? parseInt(academicYear, 10) : null,
        semester: semester ? parseInt(semester, 10) : null,
        limit: limit ? parseInt(limit, 10) : (isStaff ? 50 : 10),
        isStaff
      });

      return res.json({ success: true, ...data });
    } catch (error) {
      console.error('Error getCompanyStats:', error);
      return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงสถิติ' });
    }
  }
};
