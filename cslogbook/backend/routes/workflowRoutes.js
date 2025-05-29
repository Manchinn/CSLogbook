const express = require('express');
const router = express.Router();
const workflowService = require('../services/workflowService');
const {
  authenticateToken,
  checkRole,
} = require("../middleware/authMiddleware");

/**
 * GET /api/workflow/steps/:workflowType
 * ดึงขั้นตอนการทำงานตาม workflow type
 */
router.get('/steps/:workflowType', 
  authenticateToken, // ✅ เปลี่ยนจาก authenticate เป็น authenticateToken
  async (req, res) => {
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
      console.error('Error in getWorkflowSteps:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลขั้นตอนการทำงาน',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/workflow/timeline/:studentId/:workflowType
 * ดึง timeline ของนักศึกษาตาม workflow type
 */
router.get('/timeline/:studentId/:workflowType', 
  authenticateToken, // ✅ เปลี่ยนจาก authenticate เป็น authenticateToken
  async (req, res) => {
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

      // ใช้ WorkflowService ที่มีอยู่แล้ว
      const timelineData = await workflowService.getStudentTimelineData(studentId, workflowType);
      
      res.json({
        success: true,
        message: `ดึงข้อมูล timeline ${workflowType} ของนักศึกษา ${studentId} สำเร็จ`,
        data: timelineData
      });
    } catch (error) {
      console.error('Error in getStudentTimeline:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล timeline',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * PUT /api/workflow/update
 * อัปเดตสถานะขั้นตอนของนักศึกษา
 */
router.put('/update', 
  authenticateToken, // ✅ เปลี่ยนจาก authenticate เป็น authenticateToken
  async (req, res) => {
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
      console.error('Error in updateWorkflowStep:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะขั้นตอน',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;