const { Academic, Curriculum, sequelize } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const ACADEMIC_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ACTIVE: 'active',
};

const normalizeStatus = (status) => {
  if (!status) {
    return ACADEMIC_STATUSES.DRAFT;
  }
  const normalized = String(status).toLowerCase();
  return Object.values(ACADEMIC_STATUSES).includes(normalized)
    ? normalized
    : ACADEMIC_STATUSES.DRAFT;
};

const getSemesterRange = (semesters, key) => {
  if (!semesters) return null;
  const entry = semesters[key] ?? semesters[String(key)];
  if (!entry || typeof entry !== 'object') return null;
  return Object.prototype.hasOwnProperty.call(entry, 'range') ? entry.range ?? null : null;
};

const removeUndefined = (payload = {}) =>
  Object.entries(payload).reduce((acc, [field, value]) => {
    if (value !== undefined) {
      acc[field] = value;
    }
    return acc;
  }, {});

/**
 * AcademicService - บริการสำหรับจัดการข้อมูลการตั้งค่าปีการศึกษาและหลักสูตร
 * แยก business logic ออกจาก controller เพื่อความง่ายในการดูแลรักษาและทดสอบ
 */
class AcademicService {
  constructor() {
    this.statuses = ACADEMIC_STATUSES;
  }

  /**
   * ค้นหาการตั้งค่าปีการศึกษาปัจจุบัน
   * @returns {Object|null} ข้อมูลการตั้งค่าปีการศึกษาหรือ null หากไม่พบ
   */
  async getCurrentAcademicSettings() {
    try {
      logger.info('AcademicService: Fetching current academic settings');

      const settings =
        (await Academic.findOne({ where: { status: ACADEMIC_STATUSES.ACTIVE } })) ||
        (await Academic.findOne({ where: { isCurrent: true } }));

      if (!settings) {
        logger.warn('AcademicService: No current academic settings found');
        return null;
      }

      logger.info(`AcademicService: Current academic settings retrieved with ID: ${settings.id}`);
      return settings;
    } catch (error) {
      logger.error('AcademicService: Error fetching current academic settings', error);
      throw new Error('ไม่สามารถดึงข้อมูลการตั้งค่าปีการศึกษาปัจจุบันได้: ' + error.message);
    }
  }

  /**
   * ตรวจสอบความถูกต้องของรหัสหลักสูตร
   * @param {number} curriculumId - รหัสหลักสูตร
   * @param {Object} transaction - Transaction object สำหรับ Sequelize
   * @returns {Object|null} ข้อมูลหลักสูตรที่พบหรือ null หากไม่พบ
   */
  async validateActiveCurriculum(curriculumId, transaction = null) {
    try {
      if (!curriculumId) return null;

      logger.info(`AcademicService: Validating curriculum ID: ${curriculumId}`);

      const options = {
        where: { curriculumId, active: true },
      };

      if (transaction) {
        options.transaction = transaction;
      }

      const curriculum = await Curriculum.findOne(options);

      if (!curriculum) {
        logger.warn(`AcademicService: No active curriculum found with ID: ${curriculumId}`);
      } else {
        logger.info(`AcademicService: Validated active curriculum: ${curriculum.name} (${curriculumId})`);
      }

      return curriculum;
    } catch (error) {
      logger.error('AcademicService: Error validating curriculum', error);
      throw new Error('ไม่สามารถตรวจสอบหลักสูตรได้: ' + error.message);
    }
  }

  async buildScheduleAttributes(scheduleData = {}, transaction = null) {
    const {
      academicYear,
      currentSemester,
      semesters,
      internshipRegistration,
      projectRegistration,
      internshipSemesters,
      projectSemesters,
      activeCurriculumId,
      active_curriculum_id,
      selectedCurriculum,
      ...rest
    } = scheduleData;

    const curriculumId =
      activeCurriculumId ?? active_curriculum_id ?? selectedCurriculum ?? null;

    if (curriculumId) {
      const curriculum = await this.validateActiveCurriculum(curriculumId, transaction);
      if (!curriculum) {
        throw new Error('ไม่พบหลักสูตรที่ใช้งาน (active) หรือ ID หลักสูตรไม่ถูกต้อง');
      }
    }

    return removeUndefined({
      academicYear,
      currentSemester,
      activeCurriculumId: curriculumId,
      semester1Range: getSemesterRange(semesters, 1),
      semester2Range: getSemesterRange(semesters, 2),
      semester3Range: getSemesterRange(semesters, 3),
      internshipRegistration: internshipRegistration ?? null,
      projectRegistration: projectRegistration ?? null,
      internshipSemesters: internshipSemesters ?? null,
      projectSemesters: projectSemesters ?? null,
      ...rest,
    });
  }

  async demoteOtherActiveSchedules(excludeId, transaction) {
    logger.info(
      `AcademicService: Demoting other active schedules (exclude ID: ${excludeId || 'none'})`,
    );

    const whereClause = excludeId
      ? { status: ACADEMIC_STATUSES.ACTIVE, id: { [Op.ne]: excludeId } }
      : { status: ACADEMIC_STATUSES.ACTIVE };

    await Academic.update(
      { status: ACADEMIC_STATUSES.PUBLISHED, isCurrent: false },
      { where: whereClause, transaction },
    );
  }

  async listAcademicSchedules({ status } = {}) {
    const where = {};
    if (status) {
      where.status = normalizeStatus(status);
    }

    const schedules = await Academic.findAll({
      where,
      order: [
        ['academicYear', 'DESC'],
        ['currentSemester', 'DESC'],
        ['updated_at', 'DESC'],
      ],
    });

    return schedules;
  }

  async getAcademicScheduleById(id) {
    if (!id) {
      throw new Error('ID ไม่ถูกต้อง');
    }
    const schedule = await Academic.findByPk(id);
    if (!schedule) {
      throw new Error('ไม่พบข้อมูลปีการศึกษา');
    }
    return schedule;
  }

  /**
   * สร้างการตั้งค่าปีการศึกษาใหม่
   * @param {Object} scheduleData - ข้อมูลปีการศึกษาที่จะสร้าง
   * @returns {Object} ข้อมูลที่สร้างแล้ว
   */
  async createAcademicSchedule(scheduleData) {
    const transaction = await sequelize.transaction();

    try {
      logger.info('AcademicService: Creating new academic schedule');

      const status = normalizeStatus(scheduleData.status);
      const attributes = await this.buildScheduleAttributes(scheduleData, transaction);

      const payload = {
        ...attributes,
        status,
        isCurrent: status === ACADEMIC_STATUSES.ACTIVE,
      };

      const newSchedule = await Academic.create(payload, { transaction });

      if (status === ACADEMIC_STATUSES.ACTIVE) {
        await this.demoteOtherActiveSchedules(newSchedule.id, transaction);
      }

      await transaction.commit();

      logger.info(
        `AcademicService: Successfully created academic schedule with ID: ${newSchedule.id}`,
      );
      return newSchedule;
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      logger.error('AcademicService: Error creating academic schedule', error);
      throw new Error(error.message || 'เกิดข้อผิดพลาดในการสร้างข้อมูลปีการศึกษา');
    }
  }

  /**
   * อัปเดตการตั้งค่าปีการศึกษา
   * @param {number} id - ID ของรายการที่จะอัปเดต
   * @param {Object} scheduleData - ข้อมูลที่จะอัปเดต
   * @returns {Object} ข้อมูลที่อัปเดตแล้ว
   */
  async updateAcademicSchedule(id, scheduleData) {
    const transaction = await sequelize.transaction();

    try {
      logger.info(`AcademicService: Updating academic schedule with ID: ${id}`);

      if (!id) {
        throw new Error('ID ไม่ถูกต้อง');
      }

      const existing = await Academic.findByPk(id, { transaction });
      if (!existing) {
        throw new Error('ไม่พบข้อมูลปีการศึกษาที่ต้องการอัปเดต');
      }

      const incomingStatus =
        scheduleData.status !== undefined
          ? normalizeStatus(scheduleData.status)
          : existing.status;

      if (
        incomingStatus === ACADEMIC_STATUSES.ACTIVE &&
        existing.status !== ACADEMIC_STATUSES.ACTIVE
      ) {
        throw new Error('ไม่สามารถตั้งสถานะ active ผ่านการแก้ไขได้ กรุณาใช้คำสั่ง activate');
      }

      if (
        existing.status === ACADEMIC_STATUSES.ACTIVE &&
        incomingStatus !== ACADEMIC_STATUSES.ACTIVE
      ) {
        throw new Error('ไม่สามารถเปลี่ยนสถานะของปีการศึกษาปัจจุบันได้ กรุณาตั้งค่าใหม่ก่อน');
      }

      const attributes = await this.buildScheduleAttributes(scheduleData, transaction);

      await existing.update(
        {
          ...attributes,
          status: incomingStatus,
          isCurrent: incomingStatus === ACADEMIC_STATUSES.ACTIVE,
        },
        { transaction },
      );

      await transaction.commit();

      logger.info(`AcademicService: Successfully updated academic schedule with ID: ${id}`);
      return existing;
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      logger.error(`AcademicService: Error updating academic schedule with ID: ${id}`, error);
      throw new Error(error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลปีการศึกษา');
    }
  }

  /**
   * ตั้งปีการศึกษาเป็น active (ปีการศึกษาปัจจุบัน)
   * @param {number} id - ID ของรายการที่จะตั้งให้ใช้งาน
   * @returns {Object} ข้อมูลที่อัปเดตแล้ว
   */
  async activateAcademicSchedule(id) {
    const transaction = await sequelize.transaction();

    try {
      logger.info(`AcademicService: Activating academic schedule with ID: ${id}`);

      if (!id) {
        throw new Error('ID ไม่ถูกต้อง');
      }

      const schedule = await Academic.findByPk(id, { transaction });
      if (!schedule) {
        throw new Error('ไม่พบข้อมูลปีการศึกษาที่ต้องการตั้งให้ใช้งาน');
      }

      await this.demoteOtherActiveSchedules(schedule.id, transaction);

      await schedule.update(
        {
          status: ACADEMIC_STATUSES.ACTIVE,
          isCurrent: true,
        },
        { transaction },
      );

      await transaction.commit();

      logger.info(`AcademicService: Schedule ID ${id} is now active`);
      return schedule;
    } catch (error) {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      logger.error(`AcademicService: Error activating academic schedule with ID: ${id}`, error);
      throw new Error(error.message || 'ไม่สามารถตั้งปีการศึกษาให้ใช้งานได้');
    }
  }

  /**
   * ฟังก์ชันช่วยเพื่อคงความเข้ากันได้กับระบบเดิม
   */
  async createAcademicSettings(academicData) {
    const schedule = await this.createAcademicSchedule({
      ...academicData,
      status: ACADEMIC_STATUSES.ACTIVE,
    });
    await this.activateAcademicSchedule(schedule.id);
    return schedule;
  }

  async updateAcademicSettings(id, academicData) {
    return this.updateAcademicSchedule(id, {
      ...academicData,
      status: ACADEMIC_STATUSES.ACTIVE,
    });
  }

  /**
   * อัปเดตสถานะ isCurrent ของทุกรายการยกเว้นรายการที่ระบุ (รองรับระบบเดิม)
   * @param {number} excludeId - ID ที่จะไม่ถูกอัปเดต
   * @param {Object} transaction - Transaction object สำหรับ Sequelize
   */
  async updateCurrentStatus(excludeId = null, transaction = null) {
    try {
      await this.demoteOtherActiveSchedules(excludeId, transaction);
    } catch (error) {
      logger.error('AcademicService: Error updating current status', error);
      throw new Error('ไม่สามารถอัปเดตสถานะปัจจุบันได้: ' + error.message);
    }
  }

  /**
   * ลบการตั้งค่าปีการศึกษา
   * @param {number} id - ID ของรายการที่จะลบ
   * @returns {number} จำนวนรายการที่ลบสำเร็จ
   */
  async deleteAcademicSettings(id) {
    try {
      logger.info(`AcademicService: Deleting academic settings with ID: ${id}`);

      const schedule = await Academic.findByPk(id);
      if (!schedule) {
        logger.warn(`AcademicService: No academic settings found with ID: ${id} to delete`);
        return 0;
      }

      if (schedule.status === ACADEMIC_STATUSES.ACTIVE) {
        throw new Error('ไม่สามารถลบปีการศึกษาที่ใช้งานอยู่ได้');
      }

      const deleted = await Academic.destroy({ where: { id } });
      logger.info(`AcademicService: Successfully deleted academic settings with ID: ${id}`);
      return deleted;
    } catch (error) {
      logger.error(`AcademicService: Error deleting academic settings with ID: ${id}`, error);
      throw new Error('ไม่สามารถลบข้อมูลการตั้งค่าปีการศึกษาได้: ' + error.message);
    }
  }
}

module.exports = new AcademicService();
