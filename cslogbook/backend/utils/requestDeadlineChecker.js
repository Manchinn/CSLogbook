/**
 * Request-Specific Deadline Checker
 * 
 * ตรวจสอบสถานะ deadline สำหรับคำร้อง/เอกสารที่ส่งไปยังเจ้าหน้าที่
 * เช่น คพ.02, คพ.03, คำขอทดสอบระบบ เป็นต้น
 */

const dayjs = require('dayjs');
const logger = require('./logger');
const { ImportantDeadline } = require('../models');
const { Op } = require('sequelize');

/**
 * หา deadline ที่เกี่ยวข้องกับ deadline name และ academic period
 * @param {Object} params - { deadlineName, relatedTo, academicYear, semester }
 * @returns {Promise<Object|null>} ImportantDeadline record หรือ null
 */
async function findApplicableDeadline({ deadlineName, relatedTo, academicYear, semester }) {
  try {
    const where = {
      name: deadlineName, // ใช้ name แทน documentSubtype
      relatedTo,
      isPublished: true
    };

    // ถ้าระบุปีการศึกษาและภาคเรียน ให้ค้นหาแบบเฉพาะเจาะจง
    if (academicYear && semester) {
      where.academicYear = academicYear;
      where.semester = semester;
    }

    const deadline = await ImportantDeadline.findOne({
      where,
      order: [
        ['academicYear', 'DESC'],
        ['semester', 'DESC'],
        ['id', 'DESC'] // ใช้ id แทน createdAt (id ล่าสุด = deadline ล่าสุด)
      ]
    });

    return deadline;
  } catch (error) {
    logger.error('Error finding applicable deadline:', error);
    return null;
  }
}

/**
 * คำนวณสถานะการส่งคำร้อง/เอกสาร เทียบกับ deadline
 * @param {Date} submittedAt - เวลาที่ส่งคำร้อง
 * @param {Object} deadline - ImportantDeadline record
 * @returns {Object} { isLate, isLocked, minutesLate, status, deadlineInfo }
 */
function computeSubmissionStatus(submittedAt, deadline) {
  if (!deadline || !submittedAt) {
    return {
      isLate: false,
      isLocked: false,
      minutesLate: 0,
      status: 'unknown',
      deadlineInfo: null
    };
  }

  const submissionTime = dayjs(submittedAt);
  const deadlineTime = dayjs(deadline.deadlineAt);
  
  // คำนวณ effective deadline (รวม grace period)
  let effectiveDeadline = deadlineTime;
  if (deadline.allowLate && deadline.gracePeriodMinutes) {
    effectiveDeadline = deadlineTime.add(deadline.gracePeriodMinutes, 'minute');
  }

  const now = dayjs();
  
  // ตรวจสอบว่าส่งสายหรือไม่
  const isLate = submissionTime.isAfter(deadlineTime);
  const minutesLate = isLate ? submissionTime.diff(deadlineTime, 'minute') : 0;
  
  // ตรวจสอบว่าล็อคแล้วหรือไม่ (ส่งหลัง grace period และมีการล็อค)
  const isLockedSubmission = submissionTime.isAfter(effectiveDeadline) && deadline.lockAfterDeadline;
  
  // ตรวจสอบว่า deadline ล็อคแล้วหรือไม่ (สำหรับการแสดงผล)
  const isCurrentlyLocked = now.isAfter(effectiveDeadline) && deadline.lockAfterDeadline;

  let status = 'on_time';
  if (isLockedSubmission) {
    status = 'submitted_after_lock';
  } else if (isLate) {
    status = 'submitted_late';
  }

  return {
    isLate,
    isLocked: isLockedSubmission,
    isCurrentlyLocked,
    minutesLate,
    status,
    deadlineInfo: {
      id: deadline.id,
      name: deadline.name,
      deadlineAt: deadline.deadlineAt,
      effectiveDeadline: effectiveDeadline.toISOString(),
      gracePeriodMinutes: deadline.gracePeriodMinutes,
      allowLate: deadline.allowLate,
      lockAfterDeadline: deadline.lockAfterDeadline,
      documentSubtype: deadline.documentSubtype,
      relatedTo: deadline.relatedTo
    }
  };
}

/**
 * ตรวจสอบสถานะ deadline สำหรับคำร้อง Defense (คพ.02, คพ.03)
 * @param {Object} request - Defense request object { submittedAt, defenseType, project: { academicYear, semester } }
 * @returns {Promise<Object>} Deadline status
 */
async function checkDefenseRequestDeadline(request) {
  if (!request || !request.submittedAt) {
    return {
      hasDeadline: false,
      isLate: false,
      isLocked: false,
      minutesLate: 0,
      status: 'no_submission',
      deadlineInfo: null
    };
  }

  const project = request.project || {};
  const isThesis = request.defenseType === 'THESIS';
  
  // กำหนดชื่อ deadline ตาม defenseType (ตรงกับชื่อใน seeder)
  const deadlineName = isThesis 
    ? 'ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)'  // คพ.03
    : 'ส่งคำร้องขอสอบ (คพ.02)'; // คพ.02
  
  const relatedTo = isThesis ? 'project2' : 'project1';

  // หา deadline ที่เกี่ยวข้อง
  const deadline = await findApplicableDeadline({
    deadlineName,
    relatedTo,
    academicYear: project.academicYear,
    semester: project.semester
  });

  if (!deadline) {
    return {
      hasDeadline: false,
      isLate: false,
      isLocked: false,
      minutesLate: 0,
      status: 'no_deadline',
      deadlineInfo: null
    };
  }

  const submissionStatus = computeSubmissionStatus(request.submittedAt, deadline);

  return {
    hasDeadline: true,
    ...submissionStatus
  };
}

/**
 * ตรวจสอบสถานะ deadline สำหรับคำขอทดสอบระบบ
 * @param {Object} request - System test request object { submittedAt, projectSnapshot: { ... } }
 * @returns {Promise<Object>} Deadline status
 */
async function checkSystemTestRequestDeadline(request) {
  if (!request || !request.timeline?.submittedAt) {
    return {
      hasDeadline: false,
      isLate: false,
      isLocked: false,
      minutesLate: 0,
      status: 'no_submission',
      deadlineInfo: null
    };
  }

  const projectSnapshot = request.projectSnapshot || {};
  
  // หา deadline ที่เกี่ยวข้อง (ตรงกับชื่อใน seeder)
  const deadline = await findApplicableDeadline({
    deadlineName: 'ยื่นคำขอทดสอบระบบ',
    relatedTo: 'project2',
    // System test อาจไม่มี academicYear/semester ใน snapshot
    // ให้ค้นหา deadline ล่าสุดที่เปิดใช้งาน
  });

  if (!deadline) {
    return {
      hasDeadline: false,
      isLate: false,
      isLocked: false,
      minutesLate: 0,
      status: 'no_deadline',
      deadlineInfo: null
    };
  }

  const submissionStatus = computeSubmissionStatus(request.timeline.submittedAt, deadline);

  return {
    hasDeadline: true,
    ...submissionStatus
  };
}

/**
 * สร้าง tag metadata สำหรับแสดงผลใน frontend
 * @param {Object} deadlineStatus - ผลจาก check*Deadline functions
 * @returns {Object|null} { color, text, tooltip } หรือ null ถ้าไม่มี tag
 */
function createDeadlineTag(deadlineStatus) {
  if (!deadlineStatus || !deadlineStatus.hasDeadline) {
    return null;
  }

  const { isLate, isLocked, minutesLate, deadlineInfo } = deadlineStatus;

  if (isLocked) {
    const hoursLate = Math.floor(minutesLate / 60);
    const daysLate = Math.floor(hoursLate / 24);
    
    let lateText = '';
    if (daysLate > 0) {
      lateText = `${daysLate} วัน`;
    } else {
      lateText = `${hoursLate} ชั่วโมง`;
    }

    return {
      color: 'error',
      text: 'ส่งหลังหมดเวลา',
      tooltip: `ส่งช้าเกิน grace period (${lateText}) - ${deadlineInfo?.name || 'ไม่ระบุ'}`,
      type: 'locked'
    };
  }

  if (isLate) {
    const hoursLate = Math.floor(minutesLate / 60);
    const daysLate = Math.floor(hoursLate / 24);
    
    let lateText = '';
    if (daysLate > 0) {
      lateText = `${daysLate} วัน`;
    } else {
      lateText = `${hoursLate} ชั่วโมง`;
    }

    return {
      color: 'warning',
      text: 'ส่งช้า',
      tooltip: `ส่งช้า ${lateText} (ในช่วง grace period) - ${deadlineInfo?.name || 'ไม่ระบุ'}`,
      type: 'late'
    };
  }

  // ส่งทันเวลา - ไม่ต้องแสดง tag
  return null;
}

module.exports = {
  findApplicableDeadline,
  computeSubmissionStatus,
  checkDefenseRequestDeadline,
  checkSystemTestRequestDeadline,
  createDeadlineTag
};

