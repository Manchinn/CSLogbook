/**
 * Late Submission Helper
 * 
 * Utility functions สำหรับคำนวณสถานะการส่งช้า (Google Classroom Style)
 * สำหรับใช้ใน Services ที่บันทึกหัวข้อโครงงาน, คำร้องสอบ, และคำขอทดสอบระบบ
 */

const dayjs = require('dayjs');
const logger = require('./logger');
const { ImportantDeadline } = require('../models');
const { findApplicableDeadline, computeSubmissionStatus } = require('./requestDeadlineChecker');

/**
 * คำนวณสถานะการส่งช้าสำหรับ Project Topic Submission (บันทึกหัวข้อโครงงาน)
 * @param {Date} submittedAt - วันที่บันทึกหัวข้อ
 * @param {Object} project - Project object { academicYear, semester }
 * @returns {Promise<Object>} { submitted_late, submission_delay_minutes, important_deadline_id }
 */
async function calculateTopicSubmissionLate(submittedAt, project = {}) {
  try {
    if (!submittedAt) {
      return {
        submitted_late: false,
        submission_delay_minutes: null,
        important_deadline_id: null
      };
    }

    // หา deadline "บันทึกหัวข้อโครงงานพิเศษ" (ตรงกับชื่อใน seeder)
    const deadline = await findApplicableDeadline({
      deadlineName: 'บันทึกหัวข้อโครงงานพิเศษ',
      relatedTo: 'project1', // หัวข้อโครงงานเป็น project1
      academicYear: project.academicYear,
      semester: project.semester
    });

    if (!deadline || !deadline.deadlineAt) {
      // ไม่มี deadline กำหนด - ไม่นับว่าส่งช้า
      return {
        submitted_late: false,
        submission_delay_minutes: null,
        important_deadline_id: deadline ? deadline.id : null
      };
    }

    const status = computeSubmissionStatus(submittedAt, deadline);

    return {
      submitted_late: status.isLate,
      submission_delay_minutes: status.isLate ? status.minutesLate : null,
      important_deadline_id: deadline.id
    };
  } catch (error) {
    logger.error('Error calculating topic submission late status:', error);
    // กรณี error ให้ return default (ไม่นับว่าส่งช้า)
    return {
      submitted_late: false,
      submission_delay_minutes: null,
      important_deadline_id: null
    };
  }
}

/**
 * คำนวณสถานะการส่งช้าสำหรับ Defense Request (คพ.02 / คพ.03)
 * @param {Date} submittedAt - วันที่ส่งคำร้อง
 * @param {string} defenseType - 'PROJECT1' หรือ 'THESIS'
 * @param {Object} project - Project object { academicYear, semester }
 * @returns {Promise<Object>} { submitted_late, submission_delay_minutes, important_deadline_id }
 */
async function calculateDefenseRequestLate(submittedAt, defenseType, project = {}) {
  try {
    if (!submittedAt) {
      return {
        submitted_late: false,
        submission_delay_minutes: null,
        important_deadline_id: null
      };
    }

    const isThesis = defenseType === 'THESIS';
    
    // กำหนดชื่อ deadline ตาม defenseType
    const deadlineName = isThesis 
      ? 'ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)'
      : 'ส่งคำร้องขอสอบ (คพ.02)';
    
    const relatedTo = isThesis ? 'project2' : 'project1';

    const deadline = await findApplicableDeadline({
      deadlineName,
      relatedTo,
      academicYear: project.academicYear,
      semester: project.semester
    });

    if (!deadline || !deadline.deadlineAt) {
      return {
        submitted_late: false,
        submission_delay_minutes: null,
        important_deadline_id: deadline ? deadline.id : null
      };
    }

    const status = computeSubmissionStatus(submittedAt, deadline);

    return {
      submitted_late: status.isLate,
      submission_delay_minutes: status.isLate ? status.minutesLate : null,
      important_deadline_id: deadline.id
    };
  } catch (error) {
    logger.error('Error calculating defense request late status:', error);
    return {
      submitted_late: false,
      submission_delay_minutes: null,
      important_deadline_id: null
    };
  }
}

/**
 * คำนวณสถานะการส่งช้าสำหรับ System Test Request (คำขอทดสอบระบบ)
 * @param {Date} submittedAt - วันที่ส่งคำขอ
 * @param {Object} project - Project object { academicYear, semester }
 * @returns {Promise<Object>} { submitted_late, submission_delay_minutes, important_deadline_id }
 */
async function calculateSystemTestRequestLate(submittedAt, project = {}) {
  try {
    if (!submittedAt) {
      return {
        submitted_late: false,
        submission_delay_minutes: null,
        important_deadline_id: null
      };
    }

    // หา deadline "ยื่นคำขอทดสอบระบบ"
    const deadline = await findApplicableDeadline({
      deadlineName: 'ยื่นคำขอทดสอบระบบ',
      relatedTo: 'project2', // System test เป็นส่วนของ project2
      academicYear: project.academicYear,
      semester: project.semester
    });

    if (!deadline || !deadline.deadlineAt) {
      return {
        submitted_late: false,
        submission_delay_minutes: null,
        important_deadline_id: deadline ? deadline.id : null
      };
    }

    const status = computeSubmissionStatus(submittedAt, deadline);

    return {
      submitted_late: status.isLate,
      submission_delay_minutes: status.isLate ? status.minutesLate : null,
      important_deadline_id: deadline.id
    };
  } catch (error) {
    logger.error('Error calculating system test request late status:', error);
    return {
      submitted_late: false,
      submission_delay_minutes: null,
      important_deadline_id: null
    };
  }
}

/**
 * สร้างข้อความอธิบายสถานะการส่งช้า (สำหรับ logging หรือแสดงผล)
 * @param {boolean} isLate - ส่งช้าหรือไม่
 * @param {number} minutesLate - จำนวนนาทีที่ส่งช้า
 * @returns {string} ข้อความอธิบาย
 */
function formatLateSubmissionMessage(isLate, minutesLate) {
  if (!isLate || !minutesLate) {
    return 'ส่งทันเวลา';
  }

  const hoursLate = Math.floor(minutesLate / 60);
  const daysLate = Math.floor(hoursLate / 24);

  if (daysLate > 0) {
    const remainingHours = hoursLate % 24;
    if (remainingHours > 0) {
      return `ส่งช้า ${daysLate} วัน ${remainingHours} ชั่วโมง`;
    }
    return `ส่งช้า ${daysLate} วัน`;
  }

  if (hoursLate > 0) {
    const remainingMinutes = minutesLate % 60;
    if (remainingMinutes > 0) {
      return `ส่งช้า ${hoursLate} ชั่วโมง ${remainingMinutes} นาที`;
    }
    return `ส่งช้า ${hoursLate} ชั่วโมง`;
  }

  return `ส่งช้า ${minutesLate} นาที`;
}

module.exports = {
  calculateTopicSubmissionLate,
  calculateDefenseRequestLate,
  calculateSystemTestRequestLate,
  formatLateSubmissionMessage
};

