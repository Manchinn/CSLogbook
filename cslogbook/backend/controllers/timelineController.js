const { Student, ImportantDeadline, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const logger = require('../utils/logger');
const workflowService = require('../services/workflowService'); // เพิ่ม WorkflowService

// Get timeline steps for a specific student
exports.getStudentTimeline = async (req, res) => {
  try {
    // แก้จาก id เป็น studentId ตามที่กำหนดใน route
    const studentId = req.params.studentId || req.query.studentId;
    
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }
    
    console.log(`กำลังค้นหานักศึกษาด้วย ID/รหัสนักศึกษา: ${studentId}`);
    
    // ค้นหานักศึกษาทั้งจาก studentId (ID ในฐานข้อมูล) และ studentCode (รหัสนักศึกษา)
    let student = null;
    
    try {
      // ถ้าเป็นตัวเลข ลองค้นหาจาก studentId ก่อน
      const numericId = parseInt(studentId);
      if (!isNaN(numericId)) {
        student = await Student.findByPk(numericId, {
          attributes: ['studentId', 'studentCode', 'isEligibleInternship', 'isEligibleProject', 
                    'internshipStatus', 'projectStatus', 'isEnrolledInternship', 'isEnrolledProject']
        });
      }
      
      // ถ้าไม่พบ ลองค้นหาจาก studentCode แทน
      if (!student) {
        student = await Student.findOne({
          where: { studentCode: studentId.toString() },
          attributes: ['studentId', 'studentCode', 'isEligibleInternship', 'isEligibleProject', 
                    'internshipStatus', 'projectStatus', 'isEnrolledInternship', 'isEnrolledProject']
        });
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการค้นหานักศึกษา',
        error: dbError.message
      });
    }
    
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: `ไม่พบนักศึกษาที่มีรหัส ${studentId}`, 
        data: null 
      });
    }
    
    console.log(`พบนักศึกษา: ${student.studentId} (รหัสนักศึกษา: ${student.studentCode})`);
    
    try {
      // ใช้ WorkflowService เพื่อดึงข้อมูล timeline
      const internshipTimeline = await workflowService.generateStudentTimeline(student.studentId, 'internship');
      const projectTimeline = await workflowService.generateStudentTimeline(student.studentId, 'project1');
      
      // สร้างข้อมูล response
      const response = {
        success: true,
        data: {
          student: {
            id: student.studentId,
            studentCode: student.studentCode,
            isEligibleInternship: student.isEligibleInternship,
            isEligibleProject: student.isEligibleProject,
            isEnrolledInternship: student.isEnrolledInternship,
            isEnrolledProject: student.isEnrolledProject,
            internshipStatus: student.internshipStatus,
            projectStatus: student.projectStatus,
          },
          progress: {
            internship: internshipTimeline,
            project: projectTimeline
          },
        }
      };
      
      res.json(response);
    } catch (workflowError) {
      console.error("Error generating student timeline:", workflowError);
      return res.status(500).json({ 
        success: false, 
        message: 'เกิดข้อผิดพลาดในการสร้าง Timeline',
        error: workflowError.message
      });
    }
  } catch (error) {
    console.error('Error in getStudentTimeline:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch student timeline',
      error: error.message 
    });
  }
};

// Initialize a timeline for a student
exports.initializeStudentTimeline = async (req, res) => {
  try {
    // แก้ไขการอ่าน studentId จาก params ให้ถูกต้อง
    const studentId = parseInt(req.params.studentId || req.body.studentId);
    const timelineType = req.body.timelineType || 'internship'; // default to internship if not specified
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required' 
      });
    }
    
    // ตรวจสอบว่านักศึกษามีอยู่จริง
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // ตรวจสอบประเภท timeline
    let workflowType;
    if (timelineType === 'internship') {
      workflowType = 'internship';
    } else if (timelineType === 'project') {
      workflowType = 'project1'; // สมมติว่าใช้ 'project1'
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid timeline type. Must be "internship" or "project".' 
      });
    }
    
    // ใช้ WorkflowService เพื่อเริ่มต้น workflow ใหม่
    // เริ่มต้นที่ขั้นตอนแรกสุด (Eligibility Check)
    const firstStep = await workflowService.getWorkflowStepDefinitions(workflowType)
      .then(steps => steps.length > 0 ? steps[0] : null);
      
    if (!firstStep) {
      return res.status(500).json({ 
        success: false, 
        message: `No step definitions found for ${workflowType}` 
      });
    }
    
    const activity = await workflowService.updateStudentWorkflowActivity(
      studentId,
      workflowType,
      firstStep.stepKey,
      'pending', // เริ่มที่สถานะ pending
      'not_started',
      {}
    );
    
    // ส่งผลลัพธ์กลับในรูปแบบที่ frontend คาดหวัง
    res.json({ 
      success: true, 
      message: `${timelineType} timeline initialized successfully`,
      data: activity
    });
    
  } catch (error) {
    logger.error('Error in initializeStudentTimeline:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize timeline',
      error: error.message 
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
    
    // ตรวจสอบว่า stepKey มีอยู่จริงใน workflow นั้น
    const stepExists = await sequelize.models.WorkflowStepDefinition.findOne({
      where: { workflowType, stepKey }
    });
    
    if (!stepExists) {
      return res.status(404).json({ 
        success: false, 
        message: `Step ${stepKey} not found in ${workflowType} workflow` 
      });
    }
    
    // ใช้ WorkflowService เพื่ออัปเดตขั้นตอน
    const activity = await workflowService.updateStudentWorkflowActivity(
      studentId,
      workflowType,
      stepKey,
      status || 'in_progress',
      overallStatus || 'in_progress',
      dataPayload || {}
    );
    
    // หลังจากอัปเดต สร้าง timeline ใหม่และส่งกลับให้ frontend
    const updatedTimeline = await workflowService.generateStudentTimeline(studentId, workflowType);
    
    res.json({ 
      success: true, 
      message: 'Timeline step updated successfully',
      timeline: updatedTimeline
    });
    
  } catch (error) {
    logger.error('Error in updateTimelineStep:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update timeline step',
      error: error.message 
    });
  }
};

// Get all timelines (admin function)
exports.getAllTimelines = async (req, res) => {
  try {
    // ดึงรายชื่อนักศึกษาทั้งหมด
    const students = await Student.findAll({
      attributes: ['studentId', 'studentCode', 'internshipStatus', 'projectStatus']
    });
    
    // ดึง timeline ของแต่ละนักศึกษา (แบบย่อ)
    const summaries = await Promise.all(students.map(async (student) => {
      // ดึง workflow activity ล่าสุด
      const internshipActivity = await sequelize.models.StudentWorkflowActivity.findOne({
        where: { studentId: student.studentId, workflowType: 'internship' },
        attributes: ['currentStepKey', 'currentStepStatus', 'overallWorkflowStatus', 'updatedAt']
      });
      
      const projectActivity = await sequelize.models.StudentWorkflowActivity.findOne({
        where: { studentId: student.studentId, workflowType: 'project1' },
        attributes: ['currentStepKey', 'currentStepStatus', 'overallWorkflowStatus', 'updatedAt']
      });
      
      // ดึงข้อมูลขั้นตอนปัจจุบัน (ถ้ามี)
      let internshipCurrentStep = null;
      let projectCurrentStep = null;
      
      if (internshipActivity) {
        internshipCurrentStep = await sequelize.models.WorkflowStepDefinition.findOne({
          where: { workflowType: 'internship', stepKey: internshipActivity.currentStepKey },
          attributes: ['title']
        });
      }
      
      if (projectActivity) {
        projectCurrentStep = await sequelize.models.WorkflowStepDefinition.findOne({
          where: { workflowType: 'project1', stepKey: projectActivity.currentStepKey },
          attributes: ['title']
        });
      }
      
      return {
        studentId: student.studentId,
        studentCode: student.studentCode,
        internship: {
          status: student.internshipStatus,
          currentStep: internshipCurrentStep?.title || 'ยังไม่เริ่มต้น',
          overallStatus: internshipActivity?.overallWorkflowStatus || 'not_started',
          lastUpdated: internshipActivity?.updatedAt || null
        },
        project: {
          status: student.projectStatus,
          currentStep: projectCurrentStep?.title || 'ยังไม่เริ่มต้น',
          overallStatus: projectActivity?.overallWorkflowStatus || 'not_started',
          lastUpdated: projectActivity?.updatedAt || null
        }
      };
    }));
    
    res.json({
      success: true,
      timelines: summaries
    });
    
  } catch (error) {
    logger.error('Error in getAllTimelines:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch all timelines',
      error: error.message 
    });
  }
};

// ฟังก์ชันช่วยในการคำนวณปีการศึกษา (ยังคงไว้เผื่อมีการใช้งานที่อื่น)
function calculateStudentYear(studentId) {
  try {
    // ดึงข้อมูลนักศึกษาจาก database
    // ดึงรหัสนักศึกษา แล้วคำนวณปีการศึกษา
    return 0; // ตัวอย่างการ return ค่า
  } catch (error) {
    logger.error('Error in calculateStudentYear:', error);
    return 0;
  }
}

// ฟังก์ชันใหม่สำหรับกำหนด action ถัดไป (ปรับให้ใช้กับโครงสร้างใหม่)
function determineNextAction(internshipSteps, projectSteps) {
  // ตรวจสอบสถานะของการฝึกงาน
  if (internshipSteps && internshipSteps.length > 0) {
    // หาขั้นตอนที่กำลังดำเนินการ หรือรอการดำเนินการที่ใกล้ที่สุด
    const currentStep = internshipSteps.find(step => 
      step.status === 'in_progress' || 
      step.status === 'awaiting_student_action');
      
    if (currentStep) {
      // ถ้าเป็นขั้นตอนที่รอนักศึกษาดำเนินการ
      if (currentStep.status === 'awaiting_student_action') {
        return `ฝึกงาน: ${currentStep.title}`;
      }
      return `ฝึกงาน: ${currentStep.title} (กำลังดำเนินการ)`;
    }
    
    // หาขั้นตอนถัดไปที่ยังไม่เริ่ม
    const nextStep = internshipSteps.find(step => step.status === 'pending');
    if (nextStep) {
      return `ฝึกงาน: รอ${nextStep.title}`;
    }
  }
  
  // ตรวจสอบสถานะของโครงงานพิเศษ (ถ้าไม่มี action ของการฝึกงาน)
  if (projectSteps && projectSteps.length > 0) {
    const currentStep = projectSteps.find(step => 
      step.status === 'in_progress' || 
      step.status === 'awaiting_student_action');
      
    if (currentStep) {
      if (currentStep.status === 'awaiting_student_action') {
        return `โครงงาน: ${currentStep.title}`;
      }
      return `โครงงาน: ${currentStep.title} (กำลังดำเนินการ)`;
    }
    
    const nextStep = projectSteps.find(step => step.status === 'pending');
    if (nextStep) {
      return `โครงงาน: รอ${nextStep.title}`;
    }
  }
  
  return "ไม่มีการดำเนินการที่รอคอย";
}