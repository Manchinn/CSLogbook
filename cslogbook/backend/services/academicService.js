const { Academic, Curriculum, sequelize } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * AcademicService - บริการสำหรับจัดการข้อมูลการตั้งค่าปีการศึกษาและหลักสูตร
 * แยก business logic ออกจาก controller เพื่อความง่ายในการดูแลรักษาและทดสอบ
 */
class AcademicService {
  /**
   * ค้นหาการตั้งค่าปีการศึกษาปัจจุบัน
   * @returns {Object|null} ข้อมูลการตั้งค่าปีการศึกษาหรือ null หากไม่พบ
   */
  async getCurrentAcademicSettings() {
    try {
      logger.info('AcademicService: Fetching current academic settings');
      
      const settings = await Academic.findOne({ where: { isCurrent: true } });
      
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
        where: { curriculumId: curriculumId, active: true }
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

  /**
   * อัปเดตสถานะ isCurrent ของทุกรายการยกเว้นรายการที่ระบุ
   * @param {number} excludeId - ID ที่จะไม่ถูกอัปเดต
   * @param {Object} transaction - Transaction object สำหรับ Sequelize
   */
  async updateCurrentStatus(excludeId = null, transaction = null) {
    try {
      let whereClause = {};
      
      if (excludeId) {
        whereClause.id = { [Op.ne]: excludeId }; // เปลี่ยนจาก sequelize.Op.ne เป็น Op.ne
      }
      
      const options = { where: whereClause };
      
      if (transaction) {
        options.transaction = transaction;
      }
      
      logger.info(`AcademicService: Setting all academic settings to not current (excluding ID: ${excludeId || 'none'})`);
      
      await Academic.update({ isCurrent: false }, options);
      
    } catch (error) {
      logger.error('AcademicService: Error updating current status', error);
      throw new Error('ไม่สามารถอัปเดตสถานะปัจจุบันได้: ' + error.message);
    }
  }

  /**
   * สร้างการตั้งค่าปีการศึกษาใหม่
   * @param {Object} academicData - ข้อมูลปีการศึกษาที่จะสร้าง
   * @returns {Object} ข้อมูลที่สร้างแล้ว
   */
  async createAcademicSettings(academicData) {
    const t = await sequelize.transaction();
    
    try {
      logger.info('AcademicService: Creating new academic settings');
      
      const { activeCurriculumId, isCurrent, ...restOfData } = academicData;
      
      // ตรวจสอบ activeCurriculumId ถ้ามี
      if (activeCurriculumId) {
        const curriculum = await this.validateActiveCurriculum(activeCurriculumId, t);
        if (!curriculum) {
          await t.rollback();
          throw new Error('ไม่พบหลักสูตรที่ใช้งาน (active) หรือ ID หลักสูตรไม่ถูกต้อง');
        }
      }
      
      // ถ้า isCurrent เป็น true ให้เปลี่ยนรายการอื่นเป็น false
      if (isCurrent === true) {
        await this.updateCurrentStatus(null, t);
      }
      
      // สร้างการตั้งค่าใหม่
      const newSettings = await Academic.create(
        { 
          ...restOfData, 
          activeCurriculumId, 
          isCurrent: isCurrent === undefined ? false : isCurrent 
        },
        { transaction: t }
      );
      
      await t.commit();
      
      logger.info(`AcademicService: Successfully created academic settings with ID: ${newSettings.id}`);
      return newSettings;
      
    } catch (error) {
      await t.rollback();
      logger.error('AcademicService: Error creating academic settings', error);
      throw new Error(error.message || 'เกิดข้อผิดพลาดในการสร้างข้อมูลการตั้งค่าปีการศึกษา');
    }
  }

  /**
   * อัปเดตการตั้งค่าปีการศึกษา
   * @param {number} id - ID ของรายการที่จะอัปเดต
   * @param {Object} academicData - ข้อมูลที่จะอัปเดต
   * @returns {number} จำนวนรายการที่อัปเดตสำเร็จ
   */
  async updateAcademicSettings(id, academicData) {
    const t = await sequelize.transaction();
    
    try {
      logger.info(`AcademicService: Updating academic settings with ID: ${id}`);
      logger.info(`AcademicService: Received data:`, JSON.stringify(academicData, null, 2));
      
      if (!id) {
        await t.rollback();
        throw new Error('ID ไม่ถูกต้อง');
      }
      
      const { activeCurriculumId, isCurrent, semesters, ...rest } = academicData;
      
      // ตรวจสอบ activeCurriculumId ถ้ามี
      if (activeCurriculumId) {
        const curriculum = await this.validateActiveCurriculum(activeCurriculumId, t);
        if (!curriculum) {
          await t.rollback();
          throw new Error('ไม่พบหลักสูตรที่ใช้งาน (active) หรือ ID หลักสูตรไม่ถูกต้อง');
        }
      }
      
      // ถ้า isCurrent เป็น true ให้เปลี่ยนรายการอื่นเป็น false
      if (isCurrent === true) {
        await this.updateCurrentStatus(id, t);
      }
      
      // เตรียมข้อมูลที่จะอัปเดต
      const updatedData = { ...rest, activeCurriculumId, isCurrent };
      
      logger.info(`AcademicService: Initial update data:`, JSON.stringify(updatedData, null, 2));
      
      // อัปเดตข้อมูลภาคเรียน
      if (semesters) {
        if (semesters["1"] && semesters["1"].range !== undefined) {
          updatedData.semester1Range = semesters["1"].range;
        }
        if (semesters["2"] && semesters["2"].range !== undefined) {
          updatedData.semester2Range = semesters["2"].range;
        }
        if (semesters["3"] && semesters["3"].range !== undefined) {
          updatedData.semester3Range = semesters["3"].range;
        }
      }
      
      logger.info(`AcademicService: Final update data:`, JSON.stringify(updatedData, null, 2));
      
      // อัปเดตข้อมูล
      const [updatedCount] = await Academic.update(updatedData, {
        where: { id },
        transaction: t
      });
      
      logger.info(`AcademicService: Update result - affected rows: ${updatedCount}`);
      
      if (updatedCount === 0) {
        await t.rollback();
        throw new Error('ไม่พบข้อมูลการตั้งค่าที่จะอัปเดต');
      }
      
      await t.commit();
      
      // ตรวจสอบข้อมูลหลังอัปเดต
      const updatedRecord = await Academic.findByPk(id);
      logger.info(`AcademicService: Updated record:`, JSON.stringify(updatedRecord.toJSON(), null, 2));
      
      logger.info(`AcademicService: Successfully updated academic settings with ID: ${id}`);
      return updatedCount;
      
    } catch (error) {
      if (t && !t.finished) {
        await t.rollback();
      }
      logger.error(`AcademicService: Error updating academic settings with ID: ${id}`, error);
      throw new Error(error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการตั้งค่าปีการศึกษา');
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
      
      const deleted = await Academic.destroy({ where: { id } });
      
      if (deleted === 0) {
        logger.warn(`AcademicService: No academic settings found with ID: ${id} to delete`);
        return 0;
      }
      
      logger.info(`AcademicService: Successfully deleted academic settings with ID: ${id}`);
      return deleted;
      
    } catch (error) {
      logger.error(`AcademicService: Error deleting academic settings with ID: ${id}`, error);
      throw new Error('ไม่สามารถลบข้อมูลการตั้งค่าปีการศึกษาได้: ' + error.message);
    }
  }
}

module.exports = new AcademicService();
