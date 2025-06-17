const workflowService = require('../services/workflowService');
const timelineService = require('../services/timelineService');
const { validateRequest } = require('../middleware/validation');
const logger = require('../utils/logger');

class WorkflowController {
  /**
   * ดึงขั้นตอนการทำงานตาม workflow type
   */
  async getWorkflowSteps(req, res) {
    try {
      const { workflowType } = req.params;
      
      if (!['internship', 'project'].includes(workflowType)) {
        return res.status(400).json({
          success: false,
          message: 'ประเภท workflow ไม่ถูกต้อง กรุณาระบุ internship หรือ project'
        });
      }

      const stepDefinitions = await workflowService.getWorkflowSteps(workflowType);
      
      res.json({
        success: true,
        message: `ดึงข้อมูลขั้นตอน ${workflowType} สำเร็จ`,
        data: stepDefinitions
      });
    } catch (error) {
      logger.error('Error in getWorkflowSteps:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลขั้นตอนการทำงาน',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * ดึง timeline ของนักศึกษาตาม workflow type
   */
  async getStudentTimeline(req, res) {
    try {
      const { studentId, workflowType } = req.params;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุรหัสนักศึกษา'
        });
      }

      if (!['internship', 'project'].includes(workflowType)) {
        return res.status(400).json({
          success: false,
          message: 'ประเภท workflow ไม่ถูกต้อง กรุณาระบุ internship หรือ project'
        });
      }

      // ใช้ WorkflowService โดยตรงสำหรับ timeline เฉพาะ
      const timelineData = await workflowService.getStudentTimelineData(studentId, workflowType);
      
      res.json({
        success: true,
        message: `ดึงข้อมูล timeline ${workflowType} ของนักศึกษา ${studentId} สำเร็จ`,
        data: timelineData
      });
    } catch (error) {
      logger.error('Error in getStudentTimeline:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล timeline',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * ดึง timeline รวมของนักศึกษา (internship + project)
   */
  async getStudentCompleteTimeline(req, res) {
    try {
      const { studentId } = req.params;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุรหัสนักศึกษา'
        });
      }

      // ใช้ TimelineService สำหรับ timeline รวม
      const completeTimeline = await timelineService.getStudentCompleteTimeline(studentId);
      
      res.json({
        success: true,
        message: `ดึงข้อมูล timeline รวมของนักศึกษา ${studentId} สำเร็จ`,
        data: completeTimeline
      });
    } catch (error) {
      logger.error('Error in getStudentCompleteTimeline:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล timeline รวม',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * อัปเดตสถานะขั้นตอนของนักศึกษา
   */
  async updateWorkflowStep(req, res) {
    try {
      const { studentId, workflowType, stepKey, status, dataPayload } = req.body;
      
      if (!studentId || !workflowType || !stepKey || !status) {
        return res.status(400).json({
          success: false,
          message: 'ข้อมูลไม่ครบถ้วน กรุณาระบุ studentId, workflowType, stepKey และ status'
        });
      }

      const result = await workflowService.updateWorkflowStepStatus({
        studentId,
        workflowType,
        stepKey,
        status,
        dataPayload
      });
      
      res.json({
        success: true,
        message: 'อัปเดตสถานะขั้นตอนสำเร็จ',
        data: result
      });
    } catch (error) {
      logger.error('Error in updateWorkflowStep:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะขั้นตอน',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new WorkflowController();