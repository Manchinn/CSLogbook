const { Curriculum, Academic, sequelize } = require('../models');
const logger = require('../utils/logger');

/**
 * CurriculumService - บริการสำหรับจัดการข้อมูลหลักสูตร
 * แยก business logic ออกจาก controller เพื่อความง่ายในการดูแลรักษาและทดสอบ
 */
class CurriculumService {
  /**
   * ดึงข้อมูลหลักสูตรทั้งหมด
   * @returns {Array} รายการหลักสูตรทั้งหมด
   */
  async getAllCurriculums() {
    try {
      logger.info('CurriculumService: Fetching all curriculums');
      
      const curriculums = await Curriculum.findAll();
      
      logger.info(`CurriculumService: Found ${curriculums.length} curriculums`);
      return curriculums;
      
    } catch (error) {
      logger.error('CurriculumService: Error fetching all curriculums', error);
      throw new Error('ไม่สามารถดึงข้อมูลหลักสูตรทั้งหมดได้: ' + error.message);
    }
  }

  /**
   * ดึงข้อมูลหลักสูตรตาม ID
   * @param {number} id - รหัสหลักสูตร
   * @returns {Object|null} ข้อมูลหลักสูตรหรือ null หากไม่พบ
   */
  async getCurriculumById(id) {
    try {
      logger.info(`CurriculumService: Fetching curriculum with ID: ${id}`);
      
      const curriculum = await Curriculum.findByPk(id);
      
      if (!curriculum) {
        logger.warn(`CurriculumService: Curriculum with ID: ${id} not found`);
        return null;
      }
      
      logger.info(`CurriculumService: Found curriculum: ${curriculum.name} (${curriculum.code})`);
      return curriculum;
      
    } catch (error) {
      logger.error(`CurriculumService: Error fetching curriculum with ID: ${id}`, error);
      throw new Error('ไม่สามารถดึงข้อมูลหลักสูตรได้: ' + error.message);
    }
  }

  /**
   * ดึงข้อมูลหลักสูตรที่ใช้งานอยู่ในปัจจุบัน
   * @returns {Object|null} ข้อมูลหลักสูตรที่ใช้งานอยู่หรือ null หากไม่พบ
   */
  async getActiveCurriculum() {
    try {
      logger.info('CurriculumService: Fetching active curriculum');
      
      const activeCurriculum = await Curriculum.findOne({
        where: { active: true },
        order: [["startYear", "DESC"]]
      });
      
      if (!activeCurriculum) {
        logger.warn('CurriculumService: No active curriculum found');
        return null;
      }
      
      logger.info(`CurriculumService: Found active curriculum: ${activeCurriculum.name} (${activeCurriculum.code})`);
      return activeCurriculum;
      
    } catch (error) {
      logger.error('CurriculumService: Error fetching active curriculum', error);
      throw new Error('ไม่สามารถดึงข้อมูลหลักสูตรที่ใช้งานอยู่ได้: ' + error.message);
    }
  }

  /**
   * อัปเดตสถานะ active ของหลักสูตร (ทำให้หลักสูตรอื่นไม่ active)
   * @param {number} activeId - ID ของหลักสูตรที่จะตั้งเป็น active
   * @param {Object} transaction - Transaction object สำหรับ Sequelize
   */
  async updateActiveStatus(activeId = null, transaction = null) {
    try {
      let whereClause = {};
      
      if (activeId) {
        whereClause.curriculumId = { [sequelize.Op.ne]: activeId };
      }
      
      const options = { where: whereClause };
      
      if (transaction) {
        options.transaction = transaction;
      }
      
      logger.info(`CurriculumService: Setting all curriculums to inactive (excluding ID: ${activeId || 'none'})`);
      
      await Curriculum.update({ active: false }, options);
      
    } catch (error) {
      logger.error('CurriculumService: Error updating active status', error);
      throw new Error('ไม่สามารถอัปเดตสถานะหลักสูตรได้: ' + error.message);
    }
  }

  /**
   * อัปเดตการตั้งค่าปีการศึกษาเมื่อหลักสูตร active เปลี่ยนแปลง
   * @param {number} curriculumId - รหัสหลักสูตร
   * @param {boolean} isActive - สถานะ active ของหลักสูตร
   * @param {Object} transaction - Transaction object สำหรับ Sequelize
   */
  async updateAcademicSettings(curriculumId, isActive, transaction = null) {
    try {
      const options = { where: { isCurrent: true } };
      
      if (transaction) {
        options.transaction = transaction;
      }
      
      if (isActive) {
        // ถ้าหลักสูตรถูกตั้งค่าเป็น active ให้อัปเดตการตั้งค่าปีการศึกษาปัจจุบัน
        logger.info(`CurriculumService: Updating current academic settings with active curriculum ID: ${curriculumId}`);
        await Academic.update({ activeCurriculumId: curriculumId }, options);
      } else {
        // ถ้าหลักสูตรถูกตั้งค่าเป็นไม่ active และเป็นหลักสูตรที่กำลังใช้งานในการตั้งค่าปีการศึกษาปัจจุบัน
        const currentAcademicSettings = await Academic.findOne({ where: { isCurrent: true } });
        
        if (currentAcademicSettings && currentAcademicSettings.activeCurriculumId === curriculumId) {
          logger.info(`CurriculumService: Clearing active curriculum from current academic settings as curriculum ${curriculumId} is now inactive`);
          await Academic.update({ activeCurriculumId: null }, options);
        }
      }
    } catch (error) {
      logger.error('CurriculumService: Error updating academic settings', error);
      throw new Error('ไม่สามารถอัปเดตการตั้งค่าปีการศึกษาได้: ' + error.message);
    }
  }

  /**
   * สร้างหลักสูตรใหม่
   * @param {Object} curriculumData - ข้อมูลหลักสูตรที่จะสร้าง
   * @returns {Object} ข้อมูลหลักสูตรที่สร้างแล้ว
   */
  async createCurriculum(curriculumData) {
    const t = await sequelize.transaction();
    
    try {
      logger.info('CurriculumService: Creating new curriculum');
      
      const {
        code,
        name,
        short_name,
        start_year,
        end_year,
        active,
        max_credits,
        total_credits,
        major_credits,
        internship_base_credits,
        project_base_credits,
        project_major_base_credits,
      } = curriculumData;
      
      // ถ้าหลักสูตรใหม่ตั้งเป็น active ให้ทำหลักสูตรอื่นเป็น inactive
      if (active === true) {
        await this.updateActiveStatus(null, t);
      }
      
      // สร้างหลักสูตรใหม่
      const newCurriculum = await Curriculum.create(
        {
          code,
          name,
          shortName: short_name,
          startYear: start_year,
          endYear: end_year,
          active: active === undefined ? false : active,
          maxCredits: max_credits,
          totalCredits: total_credits,
          majorCredits: major_credits,
          internshipBaseCredits: internship_base_credits,
          projectBaseCredits: project_base_credits,
          projectMajorBaseCredits: project_major_base_credits,
        },
        { transaction: t }
      );
      
      // ถ้าหลักสูตรใหม่เป็น active ให้อัปเดตการตั้งค่าปีการศึกษาปัจจุบัน
      if (newCurriculum.active) {
        await this.updateAcademicSettings(newCurriculum.curriculumId, true, t);
      }
      
      await t.commit();
      
      logger.info(`CurriculumService: Successfully created curriculum: ${newCurriculum.name} (${newCurriculum.code}) with ID: ${newCurriculum.curriculumId}`);
      return newCurriculum;
      
    } catch (error) {
      await t.rollback();
      logger.error('CurriculumService: Error creating curriculum', error);
      throw new Error('ไม่สามารถสร้างหลักสูตรใหม่ได้: ' + error.message);
    }
  }

  /**
   * อัปเดตหลักสูตร
   * @param {number} id - รหัสหลักสูตรที่จะอัปเดต
   * @param {Object} curriculumData - ข้อมูลที่จะอัปเดต
   * @returns {Object|null} ข้อมูลหลักสูตรที่อัปเดตแล้ว หรือ null หากไม่พบหลักสูตร
   */
  async updateCurriculum(id, curriculumData) {
    const t = await sequelize.transaction();
    
    try {
      logger.info(`CurriculumService: Updating curriculum with ID: ${id}`);
      
      // หาหลักสูตรที่จะอัปเดต
      const curriculumToUpdate = await Curriculum.findByPk(id, { transaction: t });
      
      if (!curriculumToUpdate) {
        await t.rollback();
        logger.warn(`CurriculumService: Curriculum with ID: ${id} not found for update`);
        return null;
      }
      
      const {
        code,
        name,
        short_name,
        start_year,
        end_year,
        active,
        max_credits,
        total_credits,
        major_credits,
        internship_base_credits,
        project_base_credits,
        project_major_base_credits,
      } = curriculumData;
      
      // ถ้าหลักสูตรถูกเปลี่ยนเป็น active ให้ทำหลักสูตรอื่นเป็น inactive
      if (active === true && curriculumToUpdate.active === false) {
        await this.updateActiveStatus(id, t);
      }
      
      // สร้างข้อมูลสำหรับการอัปเดต
      const updatedCurriculumData = {
        code,
        name,
        shortName: short_name,
        startYear: start_year,
        endYear: end_year,
        active: active === undefined ? curriculumToUpdate.active : active,
        maxCredits: max_credits,
        totalCredits: total_credits,
        majorCredits: major_credits,
        internshipBaseCredits: internship_base_credits,
        projectBaseCredits: project_base_credits,
        projectMajorBaseCredits: project_major_base_credits,
      };
      
      // อัปเดตหลักสูตร
      await curriculumToUpdate.update(updatedCurriculumData, { transaction: t });
      
      // อัปเดตการตั้งค่าปีการศึกษาถ้าสถานะ active เปลี่ยนแปลง
      const curriculumActive = active === undefined ? curriculumToUpdate.active : active;
      await this.updateAcademicSettings(id, curriculumActive, t);
      
      await t.commit();
      
      // ดึงข้อมูลหลักสูตรที่อัปเดตแล้ว
      const result = await Curriculum.findByPk(id);
      
      logger.info(`CurriculumService: Successfully updated curriculum: ${result.name} (${result.code}) with ID: ${result.curriculumId}`);
      return result;
      
    } catch (error) {
      await t.rollback();
      logger.error(`CurriculumService: Error updating curriculum with ID: ${id}`, error);
      throw new Error('ไม่สามารถอัปเดตหลักสูตรได้: ' + error.message);
    }
  }

  /**
   * ลบหลักสูตร
   * @param {number} id - รหัสหลักสูตรที่จะลบ
   * @returns {number} จำนวนรายการที่ลบสำเร็จ
   */
  async deleteCurriculum(id) {
    try {
      logger.info(`CurriculumService: Deleting curriculum with ID: ${id}`);
      
      // ตรวจสอบว่าหลักสูตรนี้เป็นหลักสูตรที่ใช้งานอยู่ในการตั้งค่าปีการศึกษาหรือไม่
      const curriculum = await Curriculum.findByPk(id);
      if (curriculum && curriculum.active) {
        const currentAcademicSettings = await Academic.findOne({ where: { isCurrent: true, activeCurriculumId: id } });
        if (currentAcademicSettings) {
          // ล้างการอ้างอิงหลักสูตรในการตั้งค่าปีการศึกษา
          await Academic.update({ activeCurriculumId: null }, { where: { isCurrent: true } });
        }
      }
      
      const deleted = await Curriculum.destroy({ where: { curriculumId: id } });
      
      if (deleted === 0) {
        logger.warn(`CurriculumService: No curriculum found with ID: ${id} to delete`);
      } else {
        logger.info(`CurriculumService: Successfully deleted curriculum with ID: ${id}`);
      }
      
      return deleted;
      
    } catch (error) {
      logger.error(`CurriculumService: Error deleting curriculum with ID: ${id}`, error);
      throw new Error('ไม่สามารถลบหลักสูตรได้: ' + error.message);
    }
  }
}

module.exports = new CurriculumService();
