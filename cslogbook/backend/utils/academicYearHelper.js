// utils/academicYearHelper.js
const { Op } = require('sequelize');
const logger = require('./logger');

/**
 * ดึง filter สำหรับ academicYear จาก Academic ที่ active อยู่
 * รองรับทั้ง ค.ศ. และ พ.ศ. (return Op.in array)
 * @returns {Object|null} Sequelize where condition หรือ null ถ้าไม่พบ
 */
async function getActiveAcademicYearFilter() {
  try {
    const { Academic } = require('../models');
    const active = await Academic.findOne({ where: { status: 'active' } })
      || await Academic.findOne({ where: { isCurrent: true } });

    if (!active || !active.academicYear) {
      logger.warn('academicYearHelper: No active academic year found');
      return null;
    }

    const year = parseInt(active.academicYear, 10);
    if (isNaN(year)) {
      logger.warn(`academicYearHelper: Invalid academicYear value: ${active.academicYear}`);
      return null;
    }

    // รองรับทั้ง ค.ศ. และ พ.ศ. (pattern เดียวกับ importantDeadlineService.getAll)
    const adYear = year >= 2500 ? year - 543 : year;
    const beYear = year >= 2500 ? year : year + 543;

    return { [Op.in]: [String(adYear), String(beYear)] };
  } catch (error) {
    logger.error('academicYearHelper: Error fetching active academic year:', error);
    return null;
  }
}

module.exports = { getActiveAcademicYearFilter };
