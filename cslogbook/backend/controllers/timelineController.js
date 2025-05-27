const timelineService = require('../services/timelineService');
const logger = require('../utils/logger');

// Get timeline steps for a specific student
exports.getStudentTimeline = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.query.studentId;
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required' 
      });
    }
    
    const data = await timelineService.getStudentTimeline(studentId);
    
    res.json({
      success: true,
      data
    });
    
  } catch (error) {
    logger.error('Error in getStudentTimeline:', error);
    
    if (error.message.includes('ไม่พบนักศึกษา')) {
      return res.status(404).json({ 
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล timeline',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Initialize a timeline for a student
exports.initializeStudentTimeline = async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId || req.body.studentId);
    const timelineType = req.body.timelineType || 'internship';
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required' 
      });
    }
    
    const activity = await timelineService.initializeStudentTimeline(studentId, timelineType);
    
    res.json({ 
      success: true, 
      message: `${timelineType} timeline initialized successfully`,
      data: activity
    });
    
  } catch (error) {
    logger.error('Error in initializeStudentTimeline:', error);
    
    if (error.message === 'ไม่พบข้อมูลนักศึกษา') {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    if (error.message.includes('ประเภท timeline ไม่ถูกต้อง')) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    if (error.message.includes('ไม่พบข้อมูลขั้นตอน')) {
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการเริ่มต้น timeline',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update a specific timeline step
exports.updateTimelineStep = async (req, res) => {
  try {
    const { studentId, workflowType, stepKey, status, overallStatus, dataPayload } = req.body;
    
    if (!studentId || !workflowType || !stepKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID, workflow type, and step key are required' 
      });
    }
    
    const updatedTimeline = await timelineService.updateTimelineStep({
      studentId,
      workflowType,
      stepKey,
      status,
      overallStatus,
      dataPayload
    });
    
    res.json({ 
      success: true, 
      message: 'Timeline step updated successfully',
      timeline: updatedTimeline
    });
    
  } catch (error) {
    logger.error('Error in updateTimelineStep:', error);
    
    if (error.message.includes('ไม่พบขั้นตอน')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการอัปเดตขั้นตอน timeline',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all timelines (admin function)
exports.getAllTimelines = async (req, res) => {
  try {
    const timelines = await timelineService.getAllTimelines();
    
    res.json({
      success: true,
      timelines
    });
    
  } catch (error) {
    logger.error('Error in getAllTimelines:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล timeline ทั้งหมด',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

