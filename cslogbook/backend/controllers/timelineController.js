const { TimelineStep, Student, StudentProgress, ImportantDeadline, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const logger = require('../utils/logger');

// Get timeline steps for a specific student
exports.getStudentTimeline = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false,
        message: 'รหัสนักศึกษาไม่ถูกต้อง'
      });
    }
    
    // แก้ไข: ค้นหานักศึกษาจาก studentCode แทน studentId
    const student = await Student.findOne({
      where: { studentCode: studentId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    // ค้นหาหรือสร้างข้อมูล StudentProgress
    let [internshipProgress] = await StudentProgress.findOrCreate({
      where: { 
        studentId: student.studentId, // ใช้ primary key ของนักศึกษา
        progressType: 'internship'
      },
      defaults: {
        currentStep: 0,
        totalSteps: 7,
        progressPercent: 0,
        isBlocked: student.totalCredits < 81,
        blockReason: student.totalCredits < 81 ? 'ต้องมีหน่วยกิตไม่น้อยกว่า 81 หน่วยกิต' : ''
      }
    });

    let [projectProgress] = await StudentProgress.findOrCreate({
      where: { 
        studentId: student.studentId, // ใช้ primary key ของนักศึกษา
        progressType: 'project'
      },
      defaults: {
        currentStep: 0,
        totalSteps: 8, 
        progressPercent: 0,
        isBlocked: (student.totalCredits < 95 || student.majorCredits < 47),
        blockReason: (student.totalCredits < 95 || student.majorCredits < 47) ? 
          'ต้องมีหน่วยกิตไม่น้อยกว่า 95 หน่วยกิต และหน่วยกิตวิชาเอกไม่น้อยกว่า 47 หน่วยกิต' : ''
      }
    });

    // ค้นหาขั้นตอนใน timeline ของนักศึกษา
    const internshipSteps = await TimelineStep.findAll({
      where: { 
        studentId: student.studentId, // ใช้ primary key ของนักศึกษา
        type: 'internship'
      },
      order: [['stepOrder', 'ASC']]
    });
    
    const projectSteps = await TimelineStep.findAll({
      where: { 
        studentId: student.studentId, // ใช้ primary key ของนักศึกษา
        type: 'project'
      },
      order: [['stepOrder', 'ASC']]
    });

    // ค้นหากำหนดการสำคัญ
    const currentDate = new Date();
    const today = moment(currentDate);
    const currentAcademicYear = today.month() >= 7 ? today.year() + 543 : today.year() + 543 - 1;

    const deadlines = await ImportantDeadline.findAll({
      where: {
        academicYear: currentAcademicYear.toString(),
        date: {
          [Op.gte]: currentDate
        }
      },
      order: [['date', 'ASC']],
      limit: 5
    });

    // แปลงข้อมูล deadline ให้อยู่ในรูปแบบที่ต้องการ
    const formattedDeadlines = deadlines.map(deadline => {
      const deadlineDate = moment(deadline.date);
      const daysLeft = deadlineDate.diff(today, 'days');
      
      return {
        id: deadline.importantDeadlineId,
        name: deadline.name,
        date: deadlineDate.format('YYYY-MM-DD'),
        daysLeft: daysLeft,
        related: deadline.relatedTo
      };
    });

    // คำนวณสถานะการมีสิทธิ์
    const internshipEligible = student.totalCredits >= 81;
    const projectEligible = student.totalCredits >= 95 && student.majorCredits >= 47;

    // ตรวจสอบว่ามีการลงทะเบียนหรือไม่
    const isEnrolledInternship = internshipSteps.length > 0;
    const isEnrolledProject = projectSteps.length > 0;

    // กำหนดสถานะ
    let internshipStatus = 'not_started';
    if (isEnrolledInternship) {
      if (internshipSteps.every(step => step.status === 'completed')) {
        internshipStatus = 'completed';
      } else {
        internshipStatus = 'in_progress';
      }
    }

    let projectStatus = 'not_started';
    if (isEnrolledProject) {
      if (projectSteps.every(step => step.status === 'completed')) {
        projectStatus = 'completed';
      } else {
        projectStatus = 'in_progress';
      }
    }

    // กำหนด nextAction ตามสถานะปัจจุบัน
    let nextAction = 'none';
    if (internshipStatus === 'in_progress') {
      const currentStep = internshipSteps.find(step => step.status === 'in_progress');
      if (currentStep) {
        if (currentStep.name.includes('รายงาน')) {
          nextAction = 'upload_internship_report';
        } else if (currentStep.name.includes('บันทึก')) {
          nextAction = 'daily_log';
        } else {
          nextAction = 'continue_internship';
        }
      }
    } else if (internshipStatus === 'not_started' && internshipEligible) {
      nextAction = 'register_internship';
    } else if (projectStatus === 'not_started' && projectEligible) {
      nextAction = 'register_project';
    } else if (projectStatus === 'in_progress') {
      nextAction = 'continue_project';
    }

    // คำนวณความคืบหน้า
    let internshipProgressPercent = 0;
    if (internshipSteps.length > 0) {
      const completedSteps = internshipSteps.filter(step => step.status === 'completed').length;
      internshipProgressPercent = Math.round((completedSteps / internshipSteps.length) * 100);
      
      // อัปเดตค่าใน StudentProgress
      await internshipProgress.update({
        currentStep: internshipSteps.findIndex(step => step.status === 'in_progress') + 1,
        totalSteps: internshipSteps.length,
        progressPercent: internshipProgressPercent
      });
    }

    let projectProgressPercent = 0;
    if (projectSteps.length > 0) {
      const completedSteps = projectSteps.filter(step => step.status === 'completed').length;
      projectProgressPercent = Math.round((completedSteps / projectSteps.length) * 100);
      
      // อัปเดตค่าใน StudentProgress
      await projectProgress.update({
        currentStep: projectSteps.findIndex(step => step.status === 'in_progress') + 1,
        totalSteps: projectSteps.length,
        progressPercent: projectProgressPercent
      });
    }

    // สร้างข้อมูลส่งกลับ
    const data = {
      success: true,
      data: {
        student: {
          id: student.studentCode, // ใช้ studentCode แทน studentId
          name: `${student.firstName || ''} ${student.lastName || ''}`,
          year: student.currentYear || calculateStudentYear(student.studentCode),
          totalCredits: student.totalCredits || 0,
          majorCredits: student.majorCredits || 0,
          status: student.status || 'normal',
          internshipEligible,
          projectEligible,
          isEnrolledInternship,
          isEnrolledProject,
          nextAction,
          internshipStatus,
          projectStatus
        },
        progress: {
          internship: {
            currentStep: internshipProgress.currentStep,
            totalSteps: internshipProgress.totalSteps,
            progress: internshipProgress.progressPercent,
            steps: internshipSteps,
            blocked: internshipProgress.isBlocked,
            blockReason: internshipProgress.blockReason
          },
          project: {
            currentStep: projectProgress.currentStep,
            totalSteps: projectProgress.totalSteps,
            progress: projectProgress.progressPercent,
            steps: projectSteps,
            blocked: projectProgress.isBlocked,
            blockReason: projectProgress.blockReason
          }
        },
        notifications: [], // จะเพิ่มข้อมูลการแจ้งเตือนภายหลัง
        deadlines: formattedDeadlines
      }
    };
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching timeline steps:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Timeline',
      error: error.message
    });
  }
};

// Initialize a timeline for a student
exports.initializeStudentTimeline = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false,
        message: 'รหัสนักศึกษาไม่ถูกต้อง'
      });
    }
    
    // แก้ไข: ค้นหานักศึกษาจาก studentCode แทน studentId
    const student = await Student.findOne({
      where: { studentCode: studentId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }
    
    // ตรวจสอบว่านักศึกษามี timeline steps อยู่แล้วหรือไม่
    const existingSteps = await TimelineStep.findAll({ 
      where: { studentId: student.studentId } // ใช้ primary key ของนักศึกษา
    });
    
    if (existingSteps.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'นักศึกษามี Timeline อยู่แล้ว',
        data: {
          steps: existingSteps
        }
      });
    }

    // ค้นหาหรือสร้างข้อมูล StudentProgress
    await StudentProgress.findOrCreate({
      where: { 
        studentId: student.id,
        progressType: 'internship'
      },
      defaults: {
        currentStep: 0,
        totalSteps: 7,
        progressPercent: 0,
        isBlocked: student.totalCredits < 81,
        blockReason: student.totalCredits < 81 ? 'ต้องมีหน่วยกิตไม่น้อยกว่า 81 หน่วยกิต' : ''
      }
    });

    await StudentProgress.findOrCreate({
      where: { 
        studentId: student.id,
        progressType: 'project'
      },
      defaults: {
        currentStep: 0,
        totalSteps: 8, 
        progressPercent: 0,
        isBlocked: (student.totalCredits < 95 || student.majorCredits < 47),
        blockReason: (student.totalCredits < 95 || student.majorCredits < 47) ? 
          'ต้องมีหน่วยกิตไม่น้อยกว่า 95 หน่วยกิต และหน่วยกิตวิชาเอกไม่น้อยกว่า 47 หน่วยกิต' : ''
      }
    });
    
    // สร้าง timeline steps สำหรับการฝึกงาน
    const internshipSteps = [
      {
        studentId: student.id,
        type: 'internship',
        stepOrder: 1,
        name: 'ลงทะเบียนฝึกงาน',
        description: 'ลงทะเบียนฝึกงานในระบบและเลือกสถานประกอบการ',
        status: 'waiting',
        documentType: 'registration',
        actionText: 'ลงทะเบียนฝึกงาน',
        actionLink: '/internship/register'
      },
      {
        studentId: student.id,
        type: 'internship',
        stepOrder: 2,
        name: 'ส่งเอกสารขอฝึกงาน',
        description: 'ส่งเอกสารขอฝึกงานให้อาจารย์ตรวจสอบและอนุมัติ',
        status: 'waiting',
        documentType: 'request',
        actionText: 'อัปโหลดเอกสาร',
        actionLink: '/internship/documents/upload'
      },
      {
        studentId: student.id,
        type: 'internship',
        stepOrder: 3,
        name: 'รอการตอบรับจากสถานประกอบการ',
        description: 'รอการยืนยันจากสถานประกอบการหลังจากส่งเอกสารขอฝึกงาน',
        status: 'waiting'
      },
      {
        studentId: student.id,
        type: 'internship',
        stepOrder: 4,
        name: 'เริ่มฝึกงาน',
        description: 'เริ่มการฝึกงานที่สถานประกอบการ',
        status: 'waiting'
      },
      {
        studentId: student.id,
        type: 'internship',
        stepOrder: 5,
        name: 'บันทึกการฝึกงานประจำวัน',
        description: 'บันทึกการฝึกงานในแต่ละวันตลอดระยะเวลาการฝึกงาน',
        status: 'waiting',
        actionText: 'บันทึกการฝึกงาน',
        actionLink: '/internship/logbook'
      },
      {
        studentId: student.id,
        type: 'internship',
        stepOrder: 6,
        name: 'ส่งรายงานฝึกงาน',
        description: 'ส่งรายงานฝึกงานและแบบประเมินหลังจากฝึกงานเสร็จสิ้น',
        status: 'waiting',
        documentType: 'report',
        actionText: 'ส่งรายงานฝึกงาน',
        actionLink: '/internship/report/upload'
      },
      {
        studentId: student.id,
        type: 'internship',
        stepOrder: 7,
        name: 'อาจารย์ตรวจรายงานและประเมินผล',
        description: 'อาจารย์ตรวจสอบรายงานและประเมินผลการฝึกงาน',
        status: 'waiting'
      }
    ];
    
    // สร้าง timeline steps สำหรับโครงงานพิเศษ
    const projectSteps = [
      {
        studentId: student.id,
        type: 'project',
        stepOrder: 1,
        name: 'ลงทะเบียนโครงงานพิเศษ',
        description: 'ลงทะเบียนโครงงานพิเศษในระบบและเลือกอาจารย์ที่ปรึกษา',
        status: 'waiting',
        documentType: 'registration',
        actionText: 'ลงทะเบียนโครงงาน',
        actionLink: '/project/register'
      },
      {
        studentId: student.id,
        type: 'project',
        stepOrder: 2,
        name: 'ส่งเอกสารหัวข้อโครงงาน',
        description: 'ส่งเอกสารหัวข้อโครงงานให้อาจารย์ตรวจสอบและอนุมัติ',
        status: 'waiting',
        documentType: 'proposal',
        actionText: 'อัปโหลดเอกสาร',
        actionLink: '/project/documents/upload'
      },
      {
        studentId: student.id,
        type: 'project',
        stepOrder: 3,
        name: 'สอบหัวข้อโครงงาน',
        description: 'นำเสนอหัวข้อโครงงานต่อคณะกรรมการ',
        status: 'waiting'
      },
      {
        studentId: student.id,
        type: 'project',
        stepOrder: 4,
        name: 'พัฒนาโครงงาน',
        description: 'ดำเนินการพัฒนาโครงงานตามแผนที่วางไว้',
        status: 'waiting'
      },
      {
        studentId: student.id,
        type: 'project',
        stepOrder: 5,
        name: 'ส่งรายงานความก้าวหน้า',
        description: 'ส่งรายงานความก้าวหน้าของโครงงานเป็นระยะ',
        status: 'waiting',
        documentType: 'progress',
        actionText: 'ส่งรายงานความก้าวหน้า',
        actionLink: '/project/progress/upload'
      },
      {
        studentId: student.id,
        type: 'project',
        stepOrder: 6,
        name: 'สอบโครงงาน',
        description: 'นำเสนอผลงานโครงงานต่อคณะกรรมการสอบ',
        status: 'waiting'
      },
      {
        studentId: student.id,
        type: 'project',
        stepOrder: 7,
        name: 'แก้ไขโครงงานตามข้อเสนอแนะ',
        description: 'ปรับปรุงโครงงานตามข้อเสนอแนะของคณะกรรมการสอบ',
        status: 'waiting'
      },
      {
        studentId: student.id,
        type: 'project',
        stepOrder: 8,
        name: 'ส่งเล่มรายงานฉบับสมบูรณ์',
        description: 'ส่งรายงานโครงงานฉบับสมบูรณ์และไฟล์ผลงาน',
        status: 'waiting',
        documentType: 'final',
        actionText: 'ส่งรายงานฉบับสมบูรณ์',
        actionLink: '/project/final/upload'
      }
    ];
    
    // รวม steps ทั้งหมดเข้าด้วยกัน
    const allSteps = [...internshipSteps, ...projectSteps];
    
    // บันทึก steps ลงฐานข้อมูล
    const createdSteps = await TimelineStep.bulkCreate(allSteps);
    
    return res.status(201).json({
      success: true,
      message: 'สร้าง Timeline เริ่มต้นสำเร็จ',
      data: {
        internshipSteps: createdSteps.filter(step => step.type === 'internship'),
        projectSteps: createdSteps.filter(step => step.type === 'project')
      }
    });
  } catch (error) {
    console.error('Error initializing timeline:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้าง Timeline',
      error: error.message
    });
  }
};

// Update a specific timeline step
exports.updateTimelineStep = async (req, res) => {
  try {
    const { stepId } = req.params;
    const updates = req.body;
    
    if (!stepId) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบรหัสขั้นตอน'
      });
    }
    
    const step = await TimelineStep.findByPk(stepId);
    
    if (!step) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบขั้นตอนใน Timeline'
      });
    }
    
    // อัปเดตข้อมูล
    await step.update(updates);
    
    // หากสถานะเปลี่ยนเป็น completed ให้อัปเดตขั้นตอนถัดไปเป็น in_progress
    if (updates.status === 'completed') {
      const nextStep = await TimelineStep.findOne({
        where: {
          studentId: step.studentId,
          type: step.type,
          stepOrder: step.stepOrder + 1
        }
      });
      
      if (nextStep) {
        await nextStep.update({ status: 'in_progress' });
      }
      
      // อัปเดตความคืบหน้า
      await updateProgressInfo(step.studentId, step.type);
    }
    
    return res.status(200).json({
      success: true,
      message: 'อัปเดตขั้นตอนสำเร็จ',
      data: { step }
    });
  } catch (error) {
    console.error('Error updating timeline step:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตขั้นตอน',
      error: error.message
    });
  }
};

// Get all timelines (admin function)
exports.getAllTimelines = async (req, res) => {
  try {
    const timelines = await TimelineStep.findAll({
      include: [{
        model: Student,
        as: 'student',
        attributes: ['studentId', 'firstName', 'lastName']
      }],
      order: [['studentId', 'ASC'], ['type', 'ASC'], ['stepOrder', 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      data: { timelines }
    });
  } catch (error) {
    console.error('Error fetching all timelines:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Timeline ทั้งหมด',
      error: error.message
    });
  }
};

// ฟังก์ชันช่วยในการคำนวณปีการศึกษา
function calculateStudentYear(studentId) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  // สมมติว่ารหัสนักศึกษาขึ้นต้นด้วยปี เช่น 64xxxxx
  const enrollmentYear = parseInt(studentId.substring(0, 2)) + 2500;
  const yearsStudying = currentYear - enrollmentYear;
  
  return Math.min(Math.max(yearsStudying + 1, 1), 4);
}

// ฟังก์ชันอัปเดตข้อมูลความคืบหน้า
async function updateProgressInfo(studentId, progressType) {
  try {
    // ดึงข้อมูลขั้นตอนทั้งหมด
    const steps = await TimelineStep.findAll({
      where: {
        studentId,
        type: progressType
      },
      order: [['stepOrder', 'ASC']]
    });
    
    if (steps.length === 0) {
      return;
    }
    
    // คำนวณความคืบหน้า
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    const progressPercent = Math.round((completedSteps / steps.length) * 100);
    const currentStep = steps.findIndex(step => step.status === 'in_progress') + 1;
    
    // อัปเดตข้อมูลใน StudentProgress
    await StudentProgress.update({
      currentStep,
      totalSteps: steps.length,
      progressPercent
    }, {
      where: {
        studentId,
        progressType
      }
    });
  } catch (error) {
    logger.error('Error updating progress info:', error);
  }
}