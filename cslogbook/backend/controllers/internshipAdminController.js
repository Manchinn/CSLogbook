const internshipAdminService = require('../services/internshipAdminService');
const logger = require('../utils/logger');

/**
 * Controller สำหรับจัดการข้อมูลการฝึกงานโดยเจ้าหน้าที่ภาควิชา
 */
class InternshipAdminController {
  /**
   * ดึงรายการนักศึกษาทั้งหมดพร้อมข้อมูลการฝึกงาน
   * GET /api/admin/internships/students
   * @access Admin only
   */
  async getAllInternshipStudents(req, res) {
    try {
      const filters = {
        academicYear: req.query.academicYear,
        semester: req.query.semester,
        status: req.query.status,
        search: req.query.search
      };

      const students = await internshipAdminService.getAllInternshipStudents(filters);

      res.json({
        success: true,
        data: students,
        filters,
        total: students.length,
        message: 'ดึงข้อมูลนักศึกษาฝึกงานสำเร็จ'
      });

    } catch (error) {
      logger.error('[InternshipAdminController] Error in getAllInternshipStudents:', error);
      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * อัพเดทข้อมูลการฝึกงานของนักศึกษา
   * PUT /api/admin/internships/:internshipId
   * @access Admin only
   */
  async updateInternship(req, res) {
    try {
      const { internshipId } = req.params;
      const updateData = req.body;
      const adminId = req.user.userId;

      if (!internshipId) {
        return res.status(400).json({
          success: false,
          error: 'กรุณาระบุ internshipId'
        });
      }

      const result = await internshipAdminService.updateInternshipData(
        parseInt(internshipId),
        updateData,
        adminId
      );

      res.json({
        success: true,
        data: result,
        message: 'อัพเดทข้อมูลการฝึกงานสำเร็จ'
      });

    } catch (error) {
      logger.error('[InternshipAdminController] Error in updateInternship:', error);

      if (error.message.includes('ไม่พบข้อมูล')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * ยกเลิกการฝึกงานของนักศึกษา
   * POST /api/admin/internships/:internshipId/cancel
   * @access Admin only
   */
  async cancelInternship(req, res) {
    try {
      const { internshipId } = req.params;
      const { reason } = req.body;
      const adminId = req.user.userId;

      if (!internshipId) {
        return res.status(400).json({
          success: false,
          error: 'กรุณาระบุ internshipId'
        });
      }

      if (!reason || !reason.trim()) {
        return res.status(400).json({
          success: false,
          error: 'กรุณาระบุเหตุผลในการยกเลิก'
        });
      }

      const result = await internshipAdminService.cancelInternship(
        parseInt(internshipId),
        adminId,
        reason.trim()
      );

      res.json({
        success: true,
        data: result,
        message: 'ยกเลิกการฝึกงานสำเร็จ'
      });

    } catch (error) {
      logger.error('[InternshipAdminController] Error in cancelInternship:', error);

      if (error.message.includes('ไม่พบข้อมูล')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'เกิดข้อผิดพลาดในการยกเลิก',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new InternshipAdminController();

