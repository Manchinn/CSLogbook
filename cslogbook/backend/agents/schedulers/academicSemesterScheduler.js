/**
 * ตัวตั้งเวลาสำหรับอัปเดตภาคเรียนปัจจุบันโดยอัตโนมัติ
 * อ่านช่วงเวลาจากตาราง academics แล้วเปลี่ยน currentSemester เมื่อถึงช่วงที่กำหนด
 */

const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const logger = require('../../utils/logger');
const { Academic } = require('../../models');

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = 'Asia/Bangkok';
const DEFAULT_CRON = '5 0 * * *'; // รันเวลา 00:05 ของทุกวันตามเวลาประเทศไทย
const AGENT_META = { agent: 'AcademicSemesterScheduler' };

class AcademicSemesterScheduler {
  constructor() {
    this.job = null;
    this.isRunning = false;
  }

  /**
   * ตรวจสอบว่าเปิดใช้งานฟีเจอร์อัปเดตอัตโนมัติผ่าน ENV หรือไม่
     * Default: enabled (ปิดได้ด้วยการตั้งค่าเป็น 'false')
   * @returns {boolean}
   */
  isEnabled() {
    const envValue = (process.env.ACADEMIC_AUTO_UPDATE_ENABLED || 'true').toLowerCase();
    return envValue !== 'false';
  }

  /**
   * ดึง cron expression จาก ENV (ถ้าไม่มีใช้ค่าเริ่มต้น)
   * @returns {string}
   */
  getCronExpression() {
    return process.env.ACADEMIC_AUTO_UPDATE_CRON || DEFAULT_CRON;
  }

  /**
   * แปลงข้อมูลช่วงเวลา (JSON) ให้เป็น dayjs object
   * @param {object|string|null} rawRange
   * @returns {{start: dayjs.Dayjs, end: dayjs.Dayjs, raw: object}|null}
   */
  normalizeRange(rawRange) {
    if (!rawRange) {
      return null;
    }

    let parsed = rawRange;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (error) {
        logger.warn('AcademicSemesterScheduler: แปลงช่วงเวลาไม่สำเร็จ (JSON.parse ล้มเหลว)', {
          ...AGENT_META,
          value: rawRange,
          error: error.message
        });
        return null;
      }
    }

    if (!parsed.start || !parsed.end) {
      return null;
    }

    const start = dayjs.tz(parsed.start, TIMEZONE);
    const end = dayjs.tz(parsed.end, TIMEZONE);

    if (!start.isValid() || !end.isValid()) {
      logger.warn('AcademicSemesterScheduler: ค่าช่วงเวลาไม่ถูกต้อง', {
        ...AGENT_META,
        start: parsed.start,
        end: parsed.end
      });
      return null;
    }

    return { start, end, raw: parsed };
  }

  /**
   * ตรวจสอบว่าเวลาปัจจุบันอยู่ในช่วงที่กำหนดหรือไม่ (รวมปลายทั้งสองด้าน)
   * @param {dayjs.Dayjs} now
   * @param {{start: dayjs.Dayjs, end: dayjs.Dayjs}} range
   * @returns {boolean}
   */
  isWithinRange(now, range) {
    return !now.isBefore(range.start) && !now.isAfter(range.end);
  }

  /**
   * คำนวณภาคเรียนที่ควรใช้งานจากข้อมูลปัจจุบัน
   * @param {dayjs.Dayjs} now
   * @param {Array<{semester: number, range: {start: dayjs.Dayjs, end: dayjs.Dayjs, raw: object}}>} ranges
   * @returns {{semester: number, range: object}|null}
   */
  determineActiveSemester(now, ranges) {
    for (const item of ranges) {
      if (item.range && this.isWithinRange(now, item.range)) {
        return item;
      }
    }
    return null;
  }

  /**
   * แปลงปี ค.ศ. ให้เป็นปี พ.ศ. หากข้อมูลถูกต้อง
   * @param {{start: dayjs.Dayjs}|null} range
   * @param {number|null} fallbackYear
   * @param {number} semester
   * @returns {number|null}
   */
  calculateAcademicYear(range, fallbackYear, semester) {
    if (!range || !range.start || !range.start.isValid()) {
      return fallbackYear || null;
    }

    // อัปเดตปีการศึกษาเฉพาะเมื่อเป็นภาคเรียนที่ 1 เพื่อหลีกเลี่ยงปีข้ามกัน
    if (semester !== 1) {
      return fallbackYear || null;
    }

    const gregorianYear = range.start.year();
    if (Number.isNaN(gregorianYear)) {
      return fallbackYear || null;
    }

    return gregorianYear + 543;
  }

  /**
   * ทำงานหลัก: อัปเดตภาคเรียนปัจจุบันให้ตรงกับวันที่จริง
   */
  async updateCurrentSemester() {
    const now = dayjs().tz(TIMEZONE);

    try {
      const settings = await Academic.findOne({
        where: { isCurrent: true },
        order: [['updated_at', 'DESC']]
      });

      if (!settings) {
        logger.warn('AcademicSemesterScheduler: ไม่พบข้อมูล Academic ที่ตั้งเป็นปัจจุบัน', AGENT_META);
        return;
      }

      const current = settings.get({ plain: true });

      const ranges = [
        { semester: 1, range: this.normalizeRange(current.semester1Range) },
        { semester: 2, range: this.normalizeRange(current.semester2Range) },
        { semester: 3, range: this.normalizeRange(current.semester3Range) }
      ];

      const active = this.determineActiveSemester(now, ranges);

      if (!active) {
        logger.info('AcademicSemesterScheduler: ยังไม่พบช่วงภาคเรียนที่ครอบคลุมวันที่ปัจจุบัน', {
          ...AGENT_META,
          checkedAt: now.format()
        });
        return;
      }

      const updates = {};

      if (current.currentSemester !== active.semester) {
        updates.currentSemester = active.semester;
      }

      const computedAcademicYear = this.calculateAcademicYear(active.range, current.academicYear, active.semester);
      if (computedAcademicYear && current.academicYear !== computedAcademicYear) {
        updates.academicYear = computedAcademicYear;
      }

      if (!current.isCurrent) {
        updates.isCurrent = true;
      }

      if (Object.keys(updates).length === 0) {
        logger.debug('AcademicSemesterScheduler: ข้อมูลภาคเรียนปัจจุบันถูกต้องอยู่แล้ว', AGENT_META);
        return;
      }

      await settings.update(updates);

      logger.info('AcademicSemesterScheduler: อัปเดตภาคเรียนอัตโนมัติสำเร็จ', {
        ...AGENT_META,
        newSemester: updates.currentSemester || current.currentSemester,
        academicYear: updates.academicYear || current.academicYear,
        checkedAt: now.format()
      });
    } catch (error) {
      logger.error('AcademicSemesterScheduler: เกิดข้อผิดพลาดระหว่างอัปเดตภาคเรียน', {
        ...AGENT_META,
        error
      });
    }
  }

  /**
   * เริ่มต้น cron job เพื่อตรวจสอบทุกวัน
   */
  start() {
    if (!this.isEnabled()) {
      logger.info('AcademicSemesterScheduler: ปิดการใช้งาน (ตั้งค่า ACADEMIC_AUTO_UPDATE_ENABLED=false)', AGENT_META);
      this.isRunning = false;
      return false;
    }

    if (this.isRunning) {
      logger.warn('AcademicSemesterScheduler: งานถูกเริ่มไว้แล้ว', AGENT_META);
      return true;
    }

    const cronExpression = this.getCronExpression();

    this.job = cron.schedule(cronExpression, () => {
      this.updateCurrentSemester().catch((error) => {
        logger.error('AcademicSemesterScheduler: อัปเดตภาคเรียนล้มเหลวในรอบ cron', error);
      });
    }, {
      timezone: TIMEZONE
    });

    this.job.start();
    this.isRunning = true;

    logger.info('AcademicSemesterScheduler: เริ่มงานอัปเดตภาคเรียนอัตโนมัติ', {
      ...AGENT_META,
      cron: cronExpression,
      timezone: TIMEZONE
    });

    // รันหนึ่งครั้งทันทีหลังเริ่มต้น
    this.updateCurrentSemester().catch((error) => {
      logger.error('AcademicSemesterScheduler: อัปเดตครั้งแรกหลังเริ่มงานล้มเหลว', {
        ...AGENT_META,
        error
      });
    });

    return true;
  }

  /**
   * หยุด cron job ที่ทำงานอยู่
   */
  stop() {
    if (!this.job) {
      return true;
    }

    try {
      this.job.stop();
      this.job = null;
      this.isRunning = false;
      logger.info('AcademicSemesterScheduler: หยุดงานอัปเดตภาคเรียนแล้ว', AGENT_META);
    } catch (error) {
      logger.error('AcademicSemesterScheduler: ไม่สามารถหยุดงาน cron ได้', {
        ...AGENT_META,
        error
      });
    }

    return true;
  }
}

module.exports = new AcademicSemesterScheduler();