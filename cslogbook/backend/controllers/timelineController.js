const { TimelineStep, Student, StudentProgress, ImportantDeadline, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const logger = require('../utils/logger');

// Get timeline steps for a specific student
exports.getStudentTimeline = async (req, res) => {
  try {
    const { studentId } = req.params;

    // ตรวจสอบว่าเป็นการเรียก API จากเส้นทางเก่าหรือไม่
    if (req.isDeprecatedRoute) {
      logger.warn(`DEPRECATED: Timeline API called via deprecated route for student ${studentId}. Please update your frontend code.`);
    }
    
    // ค้นหาข้อมูลนักศึกษา
    const student = await Student.findOne({
      where: {
        [Op.or]: [
          { studentId: studentId },
          { studentCode: studentId }
        ]
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }
    
    logger.info(`Looking for timeline for student ID: ${student.studentId}`);
    
    // ค้นหาขั้นตอนใน timeline ของนักศึกษา
    const internshipSteps = await TimelineStep.findAll({
      where: { 
        student_id: student.studentId,
        type: 'internship'
      },
      order: [['step_order', 'ASC']]
    });
    
    const projectSteps = await TimelineStep.findAll({
      where: { 
        student_id: student.studentId,
        type: 'project'
      },
      order: [['step_order', 'ASC']]
    });

    // ค้นหากำหนดการสำคัญ
    const academicYear = new Date().getFullYear() + 543; // แปลงเป็นปี พ.ศ.
    const today = moment().format('YYYY-MM-DD');
    
    const upcomingDeadlines = await ImportantDeadline.findAll({
      where: {
        date: { [Op.gte]: today },
        academicYear: academicYear.toString(),
      },
      order: [['date', 'ASC']],
      limit: 5
    });

    // ดึงข้อมูล StudentProgress
    const internshipProgress = await StudentProgress.findOne({
      where: { 
        studentId: student.studentId,
        progressType: 'internship'
      }
    });
    
    const projectProgress = await StudentProgress.findOne({
      where: { 
        studentId: student.studentId,
        progressType: 'project'
      }
    });
    
    // แปลงขั้นตอนให้เป็นรูปแบบที่ frontend ต้องการ
    const transformedInternshipSteps = internshipSteps.map(step => ({
      id: step.id,
      name: step.name,
      description: step.description,
      status: step.status,
      date: step.date,
      startDate: step.start_date,
      endDate: step.end_date,
      deadline: step.deadline,
      document: step.document_type,
      actionText: step.action_text,
      actionLink: step.action_link
    }));
    
    const transformedProjectSteps = projectSteps.map(step => ({
      id: step.id,
      name: step.name,
      description: step.description,
      status: step.status,
      date: step.date,
      startDate: step.start_date,
      endDate: step.end_date,
      deadline: step.deadline,
      document: step.document_type,
      actionText: step.action_text,
      actionLink: step.action_link
    }));
    
    // แปลงกำหนดการให้เป็นรูปแบบที่ frontend ต้องการ
    const formattedDeadlines = upcomingDeadlines.map(deadline => {
      const dueDate = moment(deadline.date);
      const today = moment();
      const daysLeft = dueDate.diff(today, 'days');
      
      return {
        id: deadline.id,
        name: deadline.title,
        date: deadline.date,
        daysLeft: daysLeft,
        related: deadline.category
      };
    });
    
    // สร้างข้อมูลนักศึกษาในรูปแบบที่ frontend ต้องการ
    const studentData = {
      id: student.studentId,
      code: student.studentCode,
      name: `${student.firstName} ${student.lastName}`,
      year: calculateStudentYear(student.studentId),
      totalCredits: student.totalCredits || 0,
      majorCredits: student.majorCredits || 0,
      status: student.status || "normal",
      internshipEligible: student.totalCredits >= 81,
      projectEligible: student.totalCredits >= 95 && student.majorCredits >= 47,
      isEnrolledInternship: internshipSteps.length > 0,
      isEnrolledProject: projectSteps.length > 0,
      nextAction: determineNextAction(transformedInternshipSteps, transformedProjectSteps),
      internshipStatus: determineProgressStatus(transformedInternshipSteps),
      projectStatus: determineProgressStatus(transformedProjectSteps)
    };
    
    // สร้างข้อมูล progress ในรูปแบบที่ frontend ต้องการ
    const progressData = {
      internship: {
        steps: transformedInternshipSteps,
        currentStep: internshipProgress?.currentStep || 0,
        totalSteps: internshipProgress?.totalSteps || transformedInternshipSteps.length,
        progress: internshipProgress?.progressPercent || calculateProgressPercent(transformedInternshipSteps),
        blocked: internshipProgress?.isBlocked || student.totalCredits < 81,
        blockReason: internshipProgress?.blockReason || (student.totalCredits < 81 ? "ต้องมีหน่วยกิตสะสมไม่น้อยกว่า 81 หน่วยกิต" : "")
      },
      project: {
        steps: transformedProjectSteps,
        currentStep: projectProgress?.currentStep || 0,
        totalSteps: projectProgress?.totalSteps || transformedProjectSteps.length,
        progress: projectProgress?.progressPercent || calculateProgressPercent(transformedProjectSteps),
        blocked: projectProgress?.isBlocked || (student.totalCredits < 95 || student.majorCredits < 47),
        blockReason: projectProgress?.blockReason || 
          ((student.totalCredits < 95 || student.majorCredits < 47) ? 
          "ต้องมีหน่วยกิตสะสมไม่น้อยกว่า 95 หน่วยกิต และหน่วยกิตวิชาเอกไม่น้อยกว่า 47 หน่วยกิต" : "")
      }
    };

    // สร้างข้อมูลการแจ้งเตือนตัวอย่าง (ในระบบจริงควรดึงจากตาราง Notifications)
    const notificationsData = [
      {
        id: 1,
        message: "บันทึกการทำงานวันนี้เพื่อติดตามความก้าวหน้าฝึกงาน",
        type: "info",
        date: moment().format('YYYY-MM-DD')
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        student: studentData,
        progress: progressData,
        timeline: { // ส่งในรูปแบบเดิม เพื่อความเข้ากันได้กับ API เก่า
          internship: transformedInternshipSteps,
          project: transformedProjectSteps
        },
        notifications: notificationsData,
        deadlines: formattedDeadlines,
        upcomingDeadlines: formattedDeadlines // เพิ่มเพื่อความเข้ากันได้กับโค้ดเดิม
      }
    });
  } catch (error) {
    logger.error('Error fetching timeline steps:', error);
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
    
    // ตรวจสอบว่าเป็นการเรียก API จากเส้นทางเก่าหรือไม่
    if (req.isDeprecatedRoute) {
      logger.warn(`DEPRECATED: Timeline Init API called via deprecated route for student ${studentId}. Please update your frontend code.`);
    }

    // ค้นหาข้อมูลนักศึกษา
    const student = await Student.findOne({
      where: {
        [Op.or]: [
          { studentId: studentId },
          { studentCode: studentId }
        ]
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    // ตรวจสอบว่ามีไทม์ไลน์อยู่แล้วหรือไม่
    const existingSteps = await TimelineStep.findAll({
      where: {
        student_id: student.studentId
      }
    });

    if (existingSteps.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'นักศึกษามีไทม์ไลน์อยู่แล้ว'
      });
    }

    // ค้นหาหรือสร้างข้อมูล StudentProgress
    await StudentProgress.findOrCreate({
      where: { 
        studentId: student.studentId,
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
        studentId: student.studentId,
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
        student_id: student.studentId,
        type: 'internship',
        step_order: 1,
        name: 'ลงทะเบียนฝึกงาน',
        description: 'ลงทะเบียนฝึกงานในระบบและเลือกสถานประกอบการ',
        status: 'waiting',
        document_type: 'registration',
        action_text: 'ลงทะเบียนฝึกงาน',
        action_link: '/internship/register'
      },
      {
        student_id: student.studentId,
        type: 'internship',
        step_order: 2,
        name: 'ส่งเอกสารขอฝึกงาน',
        description: 'ส่งเอกสารขอฝึกงานให้อาจารย์ตรวจสอบและอนุมัติ',
        status: 'waiting',
        document_type: 'request',
        action_text: 'อัปโหลดเอกสาร',
        action_link: '/internship/documents/upload'
      },
      {
        student_id: student.studentId,
        type: 'internship',
        step_order: 3,
        name: 'รอการตอบรับจากสถานประกอบการ',
        description: 'รอการยืนยันจากสถานประกอบการหลังจากส่งเอกสารขอฝึกงาน',
        status: 'waiting'
      },
      {
        student_id: student.studentId,
        type: 'internship',
        step_order: 4,
        name: 'เริ่มฝึกงาน',
        description: 'เริ่มการฝึกงานที่สถานประกอบการ',
        status: 'waiting'
      },
      {
        student_id: student.studentId,
        type: 'internship',
        step_order: 5,
        name: 'บันทึกการฝึกงานประจำวัน',
        description: 'บันทึกการฝึกงานในแต่ละวันตลอดระยะเวลาการฝึกงาน',
        status: 'waiting',
        action_text: 'บันทึกการฝึกงาน',
        action_link: '/internship/logbook'
      },
      {
        student_id: student.studentId,
        type: 'internship',
        step_order: 6,
        name: 'ส่งรายงานฝึกงาน',
        description: 'ส่งรายงานฝึกงานและแบบประเมินหลังจากฝึกงานเสร็จสิ้น',
        status: 'waiting',
        document_type: 'report',
        action_text: 'ส่งรายงานฝึกงาน',
        action_link: '/internship/report/upload'
      },
      {
        student_id: student.studentId,
        type: 'internship',
        step_order: 7,
        name: 'อาจารย์ตรวจรายงานและประเมินผล',
        description: 'อาจารย์ตรวจสอบรายงานและประเมินผลการฝึกงาน',
        status: 'waiting'
      }
    ];
    
    // สร้าง timeline steps สำหรับโครงงานพิเศษ
    const projectSteps = [
      {
        student_id: student.studentId,
        type: 'project',
        step_order: 1,
        name: 'ลงทะเบียนโครงงานพิเศษ',
        description: 'ลงทะเบียนโครงงานพิเศษในระบบและเลือกอาจารย์ที่ปรึกษา',
        status: 'waiting',
        document_type: 'registration',
        action_text: 'ลงทะเบียนโครงงาน',
        action_link: '/project/register'
      },
      {
        student_id: student.studentId,
        type: 'project',
        step_order: 2,
        name: 'ส่งเอกสารหัวข้อโครงงาน',
        description: 'ส่งเอกสารหัวข้อโครงงานให้อาจารย์ตรวจสอบและอนุมัติ',
        status: 'waiting',
        document_type: 'proposal',
        action_text: 'อัปโหลดเอกสาร',
        action_link: '/project/documents/upload'
      },
      {
        student_id: student.studentId,
        type: 'project',
        step_order: 3,
        name: 'สอบหัวข้อโครงงาน',
        description: 'นำเสนอหัวข้อโครงงานต่อคณะกรรมการ',
        status: 'waiting'
      },
      {
        student_id: student.studentId,
        type: 'project',
        step_order: 4,
        name: 'พัฒนาโครงงาน',
        description: 'ดำเนินการพัฒนาโครงงานตามแผนที่วางไว้',
        status: 'waiting'
      },
      {
        student_id: student.studentId,
        type: 'project',
        step_order: 5,
        name: 'ส่งรายงานความก้าวหน้า',
        description: 'ส่งรายงานความก้าวหน้าของโครงงานเป็นระยะ',
        status: 'waiting',
        document_type: 'progress',
        action_text: 'ส่งรายงานความก้าวหน้า',
        action_link: '/project/progress/upload'
      },
      {
        student_id: student.studentId,
        type: 'project',
        step_order: 6,
        name: 'สอบโครงงาน',
        description: 'นำเสนอผลงานโครงงานต่อคณะกรรมการสอบ',
        status: 'waiting'
      },
      {
        student_id: student.studentId,
        type: 'project',
        step_order: 7,
        name: 'แก้ไขโครงงานตามข้อเสนอแนะ',
        description: 'ปรับปรุงโครงงานตามข้อเสนอแนะของคณะกรรมการสอบ',
        status: 'waiting'
      },
      {
        student_id: student.studentId,
        type: 'project',
        step_order: 8,
        name: 'ส่งเล่มรายงานฉบับสมบูรณ์',
        description: 'ส่งรายงานโครงงานฉบับสมบูรณ์และไฟล์ผลงาน',
        status: 'waiting',
        document_type: 'final',
        action_text: 'ส่งรายงานฉบับสมบูรณ์',
        action_link: '/project/final/upload'
      }
    ];
    
    // รวม steps ทั้งหมดเข้าด้วยกัน
    const allSteps = [...internshipSteps, ...projectSteps];
    
    // บันทึก steps ลงฐานข้อมูล
    const createdSteps = await TimelineStep.bulkCreate(allSteps);

    // แปลง steps ให้เป็นรูปแบบที่ frontend ต้องการ
    const transformedInternshipSteps = internshipSteps.map((step, index) => ({
      id: index + 1, // จำลอง ID ชั่วคราว (จะถูกแทนที่ด้วย ID จริงเมื่อบันทึกลงฐานข้อมูล)
      name: step.name,
      description: step.description,
      status: step.status,
      document: step.document_type,
      actionText: step.action_text,
      actionLink: step.action_link
    }));

    const transformedProjectSteps = projectSteps.map((step, index) => ({
      id: internshipSteps.length + index + 1, // จำลอง ID ชั่วคราว
      name: step.name,
      description: step.description,
      status: step.status,
      document: step.document_type,
      actionText: step.action_text,
      actionLink: step.action_link
    }));
    
    return res.status(201).json({
      success: true,
      message: 'สร้าง Timeline เริ่มต้นสำเร็จ',
      data: {
        student: {
          id: student.studentId,
          code: student.studentCode,
          name: `${student.firstName} ${student.lastName}`,
          year: calculateStudentYear(student.studentId),
          totalCredits: student.totalCredits || 0,
          majorCredits: student.majorCredits || 0,
          internshipEligible: student.totalCredits >= 81,
          projectEligible: student.totalCredits >= 95 && student.majorCredits >= 47,
          isEnrolledInternship: true,
          isEnrolledProject: true
        },
        progress: {
          internship: {
            steps: transformedInternshipSteps,
            currentStep: 0,
            totalSteps: transformedInternshipSteps.length,
            progress: 0,
            blocked: student.totalCredits < 81,
            blockReason: student.totalCredits < 81 ? 'ต้องมีหน่วยกิตไม่น้อยกว่า 81 หน่วยกิต' : ''
          },
          project: {
            steps: transformedProjectSteps,
            currentStep: 0,
            totalSteps: transformedProjectSteps.length,
            progress: 0,
            blocked: (student.totalCredits < 95 || student.majorCredits < 47),
            blockReason: (student.totalCredits < 95 || student.majorCredits < 47) ? 
              'ต้องมีหน่วยกิตไม่น้อยกว่า 95 หน่วยกิต และหน่วยกิตวิชาเอกไม่น้อยกว่า 47 หน่วยกิต' : ''
          }
        },
        internshipSteps: createdSteps.filter(step => step.type === 'internship'),
        projectSteps: createdSteps.filter(step => step.type === 'project')
      }
    });
  } catch (error) {
    logger.error('Error initializing timeline:', error);
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
          student_id: step.student_id,
          type: step.type,
          step_order: step.step_order + 1
        }
      });
      
      if (nextStep) {
        await nextStep.update({ status: 'in_progress' });
      }
      
      // อัปเดตความคืบหน้า
      await updateProgressInfo(step.student_id, step.type);
    }
    
    return res.status(200).json({
      success: true,
      message: 'อัปเดตขั้นตอนสำเร็จ',
      data: { step }
    });
  } catch (error) {
    logger.error('Error updating timeline step:', error);
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
      include: [ {
        model: Student,
        as: 'student',
        attributes: ['studentId', 'firstName', 'lastName']
      } ],
      order: [['studentId', 'ASC'], ['type', 'ASC'], ['stepOrder', 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      data: { timelines }
    });
  } catch (error) {
    logger.error('Error fetching all timelines:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Timeline ทั้งหมด',
      error: error.message
    });
  }
};

// ฟังก์ชันช่วยในการคำนวณปีการศึกษา
function calculateStudentYear(studentId) {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // ตรวจสอบค่า studentId
    if (!studentId) {
      logger.warn('calculateStudentYear called with undefined or null studentId');
      return 1; // ค่าเริ่มต้น
    }
    
    // แปลงค่า studentId เป็น string ก่อนใช้ substring
    const studentIdStr = String(studentId);
    
    // ตรวจสอบรูปแบบรหัสนักศึกษา
    if (studentIdStr.length < 2) {
      logger.warn(`Invalid studentId format: ${studentIdStr}`);
      return 1; // ค่าเริ่มต้น
    }
    
    // สมมติว่ารหัสนักศึกษาขึ้นต้นด้วยปี เช่น 64xxxxx
    const enrollmentYear = parseInt(studentIdStr.substring(0, 2)) + 2500;
    const yearsStudying = currentYear - enrollmentYear;
    
    return Math.min(Math.max(yearsStudying + 1, 1), 4);
  } catch (error) {
    logger.error(`Error calculating student year: ${error.message}`);
    return 1; // ค่าเริ่มต้น
  }
}

// ฟังก์ชันอัปเดตข้อมูลความคืบหน้า
async function updateProgressInfo(studentId, progressType) {
  try {
    // ดึงข้อมูลขั้นตอนทั้งหมด
    const steps = await TimelineStep.findAll({
      where: {
        student_id: studentId,
        type: progressType
      },
      order: [['step_order', 'ASC']]
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

// ฟังก์ชันใหม่สำหรับคำนวณเปอร์เซ็นต์ความคืบหน้า
function calculateProgressPercent(steps) {
  if (!steps || steps.length === 0) return 0;
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  return Math.round((completedSteps / steps.length) * 100);
}

// ฟังก์ชันใหม่สำหรับกำหนดสถานะความคืบหน้า
function determineProgressStatus(steps) {
  if (!steps || steps.length === 0) return 'not_started';
  
  const hasInProgress = steps.some(step => step.status === 'in_progress');
  const allCompleted = steps.every(step => step.status === 'completed');
  
  if (allCompleted) return 'completed';
  if (hasInProgress) return 'in_progress';
  return 'not_started';
}

// ฟังก์ชันใหม่สำหรับกำหนด action ถัดไป
function determineNextAction(internshipSteps, projectSteps) {
  // ตรวจสอบสถานะของการฝึกงาน
  if (internshipSteps && internshipSteps.length > 0) {
    const inProgressStep = internshipSteps.find(step => step.status === 'in_progress');
    
    if (inProgressStep) {
      if (inProgressStep.name.includes('ฝึกงาน')) {
        return 'daily_log';
      } else if (inProgressStep.name.includes('รายงาน')) {
        return 'upload_internship_report';
      }
    }
    
    // หากยังไม่ได้ลงทะเบียนฝึกงาน
    if (internshipSteps[0].status === 'waiting') {
      return 'register_internship';
    }
  }
  
  // ตรวจสอบสถานะของโครงงานพิเศษ
  if (projectSteps && projectSteps.length > 0) {
    const inProgressStep = projectSteps.find(step => step.status === 'in_progress');
    
    if (inProgressStep) {
      return 'continue_project';
    }
    
    // หากยังไม่ได้ลงทะเบียนโครงงาน
    if (projectSteps[0].status === 'waiting') {
      return 'register_project';
    }
  }
  
  return 'none'; // ไม่มีการดำเนินการที่ต้องทำในขณะนี้
}