const {
  InternshipLogbook,
  InternshipDocument,
  InternshipLogbookReflection,
  Document,
  Student,
  User,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const { calculateWorkdays } = require("../utils/dateUtils");
const logger = require("../utils/logger");
class InternshipLogbookService {
  /**
   * ดึงข้อมูลบันทึกการฝึกงานทั้งหมดของนักศึกษา
   * @param {number} userId - ID ของผู้ใช้
   * @returns {Array} รายการบันทึกการฝึกงาน
   */
  async getTimeSheetEntries(userId) {
    try {
      logger.info(
        `InternshipLogbookService: ดึงข้อมูลบันทึกการฝึกงานสำหรับผู้ใช้ ${userId}`
      );

      // ดึงข้อมูลนักศึกษา
      const student = await Student.findOne({
        where: { userId },
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // ดึงข้อมูลการฝึกงานปัจจุบัน
      const document = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: ["pending", "approved", "supervisor_evaluated"],
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
            attributes: ["internshipId", "startDate", "endDate", "updated_at"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      if (!document) {
        throw new Error("ไม่พบข้อมูล CS05 ที่รออนุมัติ");
      }

      const internshipId = document.internshipDocument.internshipId;

      // ดึงบันทึกการฝึกงานทั้งหมด
      const entries = await InternshipLogbook.findAll({
        where: {
          internshipId,
          studentId: student.studentId,
        },
        order: [["work_date", "ASC"]],
      });

      logger.info(
        `InternshipLogbookService: พบบันทึกการฝึกงาน ${entries.length} รายการ`
      );
      return entries;
    } catch (error) {
      logger.error(
        "InternshipLogbookService: Error in getTimeSheetEntries",
        error
      );
      throw error;
    }
  }

  /**
   * บันทึกข้อมูลการฝึกงานประจำวัน
   * @param {number} userId - ID ของผู้ใช้
   * @param {Object} entryData - ข้อมูลบันทึกการฝึกงาน
   * @returns {Object} บันทึกที่สร้างหรืออัปเดต
   */
  async saveTimeSheetEntry(userId, entryData) {
    const transaction = await sequelize.transaction();

    try {
      logger.info(
        `InternshipLogbookService: บันทึกข้อมูลการฝึกงานสำหรับผู้ใช้ ${userId}`
      );

      const student = await Student.findOne({
        where: { userId },
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      const {
        workDate,
        timeIn,
        timeOut,
        workHours,
        logTitle,
        workDescription,
        learningOutcome,
        problems,
        solutions,
      } = entryData;

      // ตรวจสอบว่ามี CS05 ที่อนุมัติแล้วหรือไม่
      const document = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: ["pending", "approved", "supervisor_evaluated"],
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
            attributes: ["internshipId", "startDate", "endDate"],
          },
        ],
        transaction,
      });

      if (!document) {
        throw new Error("ไม่พบข้อมูล CS05 ที่รออนุมัติ");
      }

      const internshipId = document.internshipDocument.internshipId;

      // ตรวจสอบว่ามีบันทึกสำหรับวันที่นี้แล้วหรือไม่
      const existingEntry = await InternshipLogbook.findOne({
        where: {
          internshipId,
          studentId: student.studentId,
          workDate,
        },
        transaction,
      });

      let entry;
      if (existingEntry) {
        // อัปเดตบันทึกที่มีอยู่
        entry = await existingEntry.update(
          {
            timeIn,
            timeOut,
            workHours,
            logTitle,
            workDescription,
            learningOutcome,
            problems: problems || "",
            solutions: solutions || "",
          },
          { transaction }
        );
      } else {
        // สร้างบันทึกใหม่
        entry = await InternshipLogbook.create(
          {
            internshipId,
            studentId: student.studentId,
            workDate,
            timeIn,
            timeOut,
            workHours,
            logTitle,
            workDescription,
            learningOutcome,
            problems: problems || "",
            solutions: solutions || "",
            supervisorApproved: false,
            advisorApproved: false,
          },
          { transaction }
        );
      }

      await transaction.commit();
      logger.info(
        `InternshipLogbookService: บันทึกข้อมูลการฝึกงานสำเร็จ ID: ${entry.logId}`
      );
      return entry;
    } catch (error) {
      await transaction.rollback();
      logger.error(
        "InternshipLogbookService: Error in saveTimeSheetEntry",
        error
      );
      throw error;
    }
  }

  /**
   * อัปเดตข้อมูลการฝึกงานประจำวัน
   * @param {number} userId - ID ของผู้ใช้
   * @param {number} logId - ID ของบันทึกที่ต้องการอัปเดต
   * @param {Object} updateData - ข้อมูลที่ต้องการอัปเดต
   * @returns {Object} บันทึกที่อัปเดตแล้ว
   */
  async updateTimeSheetEntry(userId, logId, updateData) {
    const transaction = await sequelize.transaction();

    try {
      logger.info(
        `InternshipLogbookService: อัปเดตบันทึกการฝึกงาน ID: ${logId}`
      );

      const student = await Student.findOne({
        where: { userId },
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      const {
        workDate,
        timeIn,
        timeOut,
        workHours,
        logTitle,
        workDescription,
        learningOutcome,
        problems,
        solutions,
      } = updateData;

      // ดึงข้อมูลบันทึกที่ต้องการอัปเดต
      const entry = await InternshipLogbook.findOne({
        where: {
          logId,
          studentId: student.studentId,
        },
        transaction,
      });

      if (!entry) {
        throw new Error("ไม่พบข้อมูลบันทึกการฝึกงาน");
      }

      // ตรวจสอบว่าบันทึกได้รับการอนุมัติแล้วหรือไม่
      if (entry.supervisorApproved || entry.advisorApproved) {
        throw new Error("ไม่สามารถแก้ไขบันทึกที่ได้รับการอนุมัติแล้ว");
      }

      // อัปเดตข้อมูล
      await entry.update(
        {
          workDate,
          timeIn,
          timeOut,
          workHours,
          logTitle,
          workDescription,
          learningOutcome,
          problems: problems || "",
          solutions: solutions || "",
        },
        { transaction }
      );

      await transaction.commit();
      logger.info(
        `InternshipLogbookService: อัปเดตบันทึกการฝึกงานสำเร็จ ID: ${logId}`
      );
      return entry;
    } catch (error) {
      await transaction.rollback();
      logger.error(
        "InternshipLogbookService: Error in updateTimeSheetEntry",
        error
      );
      throw error;
    }
  }

  /**
   * ดึงข้อมูลสถิติการฝึกงาน
   * @param {number} userId - ID ของผู้ใช้
   * @returns {Object} สถิติการฝึกงาน
   */
  async getTimeSheetStats(userId) {
    try {
      logger.info(
        `InternshipLogbookService: ดึงสถิติการฝึกงานสำหรับผู้ใช้ ${userId}`
      );

      const student = await Student.findOne({
        where: { userId },
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // ดึงข้อมูล CS05
      const document = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: ["pending", "approved", "supervisor_evaluated"],
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
            attributes: ["internshipId", "startDate", "endDate"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      if (!document) {
        throw new Error(
          "ไม่พบข้อมูล CS05 ที่รออนุมัติหรือได้รับการอนุมัติแล้ว"
        );
      }

      const internshipId = document.internshipDocument.internshipId;
      const startDate = document.internshipDocument.startDate;
      const endDate = document.internshipDocument.endDate;

      // คำนวณวันทำงานทั้งหมด
      const workdays = await calculateWorkdays(startDate, endDate);
      const totalDays = workdays.length;

      // ดึงข้อมูลบันทึกที่บันทึกแล้ว
      const entries = await InternshipLogbook.findAll({
        where: {
          internshipId,
          studentId: student.studentId,
          workHours: {
            [Op.not]: null,
          },
        },
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("log_id")), "count"],
          [sequelize.fn("SUM", sequelize.col("work_hours")), "totalHours"],
        ],
        raw: true,
      });

      const hasEntries = entries && entries.length > 0;
      const completedCount = hasEntries ? parseInt(entries[0].count) || 0 : 0;
      const totalHours = hasEntries
        ? parseFloat(entries[0].totalHours) || 0
        : 0;
      const pendingCount = totalDays - completedCount;
      const averageHoursPerDay =
        completedCount > 0 ? totalHours / completedCount : 0;

      // เพิ่มการ query จำนวนวันที่อนุมัติโดย Supervisor
      const approvedBySupervisorCount = await InternshipLogbook.count({
        where: {
          studentId: student.studentId,
          supervisor_approved: 1,
        },
      });

      // คำนวณวันที่เหลือจริงๆ
      const today = new Date();
      const endDateObj = new Date(endDate);
      const remainingDays = Math.max(
        0,
        Math.ceil((endDateObj - today) / (24 * 60 * 60 * 1000))
      );

      const stats = {
        total: totalDays,
        completed: parseInt(completedCount),
        pending: pendingCount,
        totalHours: parseFloat(totalHours.toFixed(1)),
        averageHoursPerDay: parseFloat(averageHoursPerDay.toFixed(1)),
        remainingDays: remainingDays,
        approvedBySupervisor: parseInt(approvedBySupervisorCount) || 0,
      };

      logger.info(`InternshipLogbookService: ดึงสถิติการฝึกงานสำเร็จ`);
      return stats;
    } catch (error) {
      logger.error(
        "InternshipLogbookService: Error in getTimeSheetStats",
        error
      );
      throw error;
    }
  }

  /**
   * ดึงช่วงวันที่ฝึกงานจาก CS05
   * @param {number} userId - ID ของผู้ใช้
   * @returns {Object} ช่วงวันที่ฝึกงาน
   */
  async getInternshipDateRange(userId) {
    try {
      logger.info(
        `InternshipLogbookService: ดึงช่วงวันที่ฝึกงานสำหรับผู้ใช้ ${userId}`
      );

      const document = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: ["pending", "approved", "supervisor_evaluated"],
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
            attributes: ["startDate", "endDate"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      if (!document) {
        throw new Error("ไม่พบข้อมูล CS05 ที่รออนุมัติ");
      }

      const result = {
        startDate: document.internshipDocument.startDate,
        endDate: document.internshipDocument.endDate,
      };

      logger.info(`InternshipLogbookService: ดึงช่วงวันที่ฝึกงานสำเร็จ`);
      return result;
    } catch (error) {
      logger.error(
        "InternshipLogbookService: Error in getInternshipDateRange",
        error
      );
      throw error;
    }
  }

  /**
   * สร้างรายการวันทำงานทั้งหมด (ไม่รวมวันหยุด)
   * @param {number} userId - ID ของผู้ใช้
   * @returns {Array} รายการวันทำงาน
   */
  async generateInternshipDates(userId) {
    try {
      logger.info(
        `InternshipLogbookService: สร้างรายการวันทำงานสำหรับผู้ใช้ ${userId}`
      );

      const document = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: ["pending", "approved", "supervisor_evaluated"],
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
            attributes: ["startDate", "endDate"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      if (!document) {
        throw new Error("ไม่พบข้อมูล CS05 ที่รออนุมัติ");
      }

      const startDate = document.internshipDocument.startDate;
      const endDate = document.internshipDocument.endDate;

      // คำนวณวันทำงานทั้งหมด (ไม่รวมวันหยุด)
      const workdays = await calculateWorkdays(startDate, endDate);

      logger.info(
        `InternshipLogbookService: สร้างรายการวันทำงานสำเร็จ ${workdays.length} วัน`
      );
      return workdays;
    } catch (error) {
      logger.error(
        "InternshipLogbookService: Error in generateInternshipDates",
        error
      );
      throw error;
    }
  }

  /**
   * ดึงข้อมูลบันทึกการฝึกงานตาม ID
   * @param {number} userId - ID ของผู้ใช้
   * @param {number} logId - ID ของบันทึก
   * @returns {Object} บันทึกการฝึกงาน
   */
  async getTimeSheetEntryById(userId, logId) {
    try {
      logger.info(
        `InternshipLogbookService: ดึงบันทึกการฝึกงาน ID: ${logId} สำหรับผู้ใช้ ${userId}`
      );

      const student = await Student.findOne({
        where: { userId },
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      const entry = await InternshipLogbook.findOne({
        where: {
          logId,
          studentId: student.studentId,
        },
      });

      if (!entry) {
        throw new Error("ไม่พบข้อมูลบันทึกการฝึกงาน");
      }

      logger.info(
        `InternshipLogbookService: ดึงบันทึกการฝึกงานสำเร็จ ID: ${logId}`
      );
      return entry;
    } catch (error) {
      logger.error(
        "InternshipLogbookService: Error in getTimeSheetEntryById",
        error
      );
      throw error;
    }
  }

  /**
   * บันทึกเวลาเข้างาน (Check In)
   * @param {number} userId - ID ของผู้ใช้
   * @param {Object} checkInData - ข้อมูลการบันทึกเวลาเข้างาน
   * @returns {Object} บันทึกที่สร้างหรืออัปเดต
   */
  async checkIn(userId, checkInData) {
    const transaction = await sequelize.transaction();

    try {
      logger.info(
        `InternshipLogbookService: บันทึกเวลาเข้างานสำหรับผู้ใช้ ${userId}`
      );

      const student = await Student.findOne({
        where: { userId },
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      const {
        workDate,
        timeIn,
        logTitle,
        workDescription,
        learningOutcome,
        problems,
        solutions,
      } = checkInData;

      // ตรวจสอบว่ามี CS05 ที่รออนุมัติหรือไม่
      const document = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: ["pending", "approved"],
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
            attributes: ["internshipId"],
          },
        ],
        transaction,
      });

      if (!document) {
        throw new Error("ไม่พบข้อมูล CS05 ที่รออนุมัติ");
      }

      const internshipId = document.internshipDocument.internshipId;

      // ตรวจสอบว่ามีบันทึกของวันนี้แล้วหรือไม่
      let entry = await InternshipLogbook.findOne({
        where: {
          internshipId,
          studentId: student.studentId,
          workDate,
        },
        transaction,
      });

      if (entry) {
        // ถ้ามีบันทึกแล้ว ให้อัปเดตเวลาเข้างาน และข้อมูลเพิ่มเติมหากมี
        const updateData = { timeIn };

        if (logTitle !== undefined) updateData.logTitle = logTitle;
        if (workDescription !== undefined)
          updateData.workDescription = workDescription;
        if (learningOutcome !== undefined)
          updateData.learningOutcome = learningOutcome;
        if (problems !== undefined) updateData.problems = problems || "";
        if (solutions !== undefined) updateData.solutions = solutions || "";

        entry = await entry.update(updateData, { transaction });
      } else {
        // ถ้ายังไม่มีบันทึก ให้สร้างบันทึกใหม่
        entry = await InternshipLogbook.create(
          {
            internshipId,
            studentId: student.studentId,
            workDate,
            timeIn,
            timeOut: null,
            workHours: 0,
            logTitle: logTitle || "",
            workDescription: workDescription || "",
            learningOutcome: learningOutcome || "",
            problems: problems || "",
            solutions: solutions || "",
            supervisorApproved: false,
            advisorApproved: false,
          },
          { transaction }
        );
      }

      await transaction.commit();
      logger.info(`InternshipLogbookService: บันทึกเวลาเข้างานสำเร็จ`);
      return entry;
    } catch (error) {
      await transaction.rollback();
      logger.error("InternshipLogbookService: Error in checkIn", error);
      throw error;
    }
  }

  /**
   * บันทึกเวลาออกงาน (Check Out)
   * @param {number} userId - ID ของผู้ใช้
   * @param {Object} checkOutData - ข้อมูลการบันทึกเวลาออกงาน
   * @returns {Object} บันทึกที่อัปเดตแล้ว
   */
  async checkOut(userId, checkOutData) {
    const transaction = await sequelize.transaction();

    try {
      logger.info(
        `InternshipLogbookService: บันทึกเวลาออกงานสำหรับผู้ใช้ ${userId}`
      );

      const student = await Student.findOne({
        where: { userId },
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      const {
        workDate,
        timeOut,
        logTitle,
        workDescription,
        learningOutcome,
        problems,
        solutions,
      } = checkOutData;

      // ตรวจสอบว่ามีบันทึกของวันนี้แล้วหรือไม่
      const entry = await InternshipLogbook.findOne({
        where: {
          studentId: student.studentId,
          workDate,
        },
        transaction,
      });

      if (!entry) {
        throw new Error(
          "ไม่พบข้อมูลการบันทึกเวลาเข้างาน กรุณาบันทึกเวลาเข้างานก่อน"
        );
      }

      // ตรวจสอบว่าบันทึกได้รับการอนุมัติแล้วหรือไม่
      if (entry.supervisorApproved || entry.advisorApproved) {
        throw new Error("ไม่สามารถแก้ไขบันทึกที่ได้รับการอนุมัติแล้ว");
      }

      // คำนวณชั่วโมงทำงาน
      const timeInParts = entry.timeIn.split(":");
      const timeOutParts = timeOut.split(":");

      const timeInMinutes =
        parseInt(timeInParts[0]) * 60 + parseInt(timeInParts[1]);
      const timeOutMinutes =
        parseInt(timeOutParts[0]) * 60 + parseInt(timeOutParts[1]);

      if (timeOutMinutes <= timeInMinutes) {
        throw new Error("เวลาออกงานต้องมากกว่าเวลาเข้างาน");
      }

      // คำนวณชั่วโมงทำงานเป็นทศนิยม 1 ตำแหน่ง
      const workHours = Math.round((timeOutMinutes - timeInMinutes) / 30) / 2;

      // อัปเดตข้อมูล
      await entry.update(
        {
          timeOut,
          workHours,
          logTitle,
          workDescription,
          learningOutcome,
          problems: problems || "",
          solutions: solutions || "",
        },
        { transaction }
      );

      await transaction.commit();
      logger.info(`InternshipLogbookService: บันทึกเวลาออกงานสำเร็จ`);
      return entry;
    } catch (error) {
      await transaction.rollback();
      logger.error("InternshipLogbookService: Error in checkOut", error);
      throw error;
    }
  }

  /**
   * อนุมัติบันทึกการฝึกงาน (สำหรับอาจารย์ที่ปรึกษา)
   * @param {number} teacherId - ID ของอาจารย์
   * @param {number} logId - ID ของบันทึก
   * @param {string} comment - ความคิดเห็น
   * @returns {Object} บันทึกที่อนุมัติแล้ว
   */
  async approveTimeSheetEntry(teacherId, logId, comment) {
    const transaction = await sequelize.transaction();

    try {
      logger.info(
        `InternshipLogbookService: อนุมัติบันทึกการฝึกงาน ID: ${logId} โดยอาจารย์ ${teacherId}`
      );

      // ดึงข้อมูลบันทึกที่ต้องการอนุมัติ
      const entry = await InternshipLogbook.findOne({
        where: { logId },
        include: [
          {
            model: Student,
            as: "student",
            attributes: ["studentId", "userId", "advisorId"],
            where: {
              advisorId: teacherId,
            },
            required: true,
          },
        ],
        transaction,
      });

      if (!entry) {
        throw new Error(
          "ไม่พบข้อมูลบันทึกการฝึกงานหรือคุณไม่ใช่อาจารย์ที่ปรึกษาของนักศึกษาคนนี้"
        );
      }

      // อัปเดตสถานะการอนุมัติ
      await entry.update(
        {
          advisorComment: comment || null,
          advisorApproved: true,
        },
        { transaction }
      );

      await transaction.commit();
      logger.info(
        `InternshipLogbookService: อนุมัติบันทึกการฝึกงานสำเร็จ ID: ${logId}`
      );
      return entry;
    } catch (error) {
      await transaction.rollback();
      logger.error(
        "InternshipLogbookService: Error in approveTimeSheetEntry",
        error
      );
      throw error;
    }
  }

  /**
   * บันทึกบทสรุปการฝึกงาน
   * @param {number} userId - ID ของผู้ใช้
   * @param {Object} reflectionData - ข้อมูลบทสรุป
   * @returns {Object} บทสรุปที่สร้างหรืออัปเดต
   */
  async saveReflection(userId, reflectionData) {
    const transaction = await sequelize.transaction();

    try {
      logger.info(
        `InternshipLogbookService: บันทึกบทสรุปการฝึกงานสำหรับผู้ใช้ ${userId}`
      );

      // ดึงข้อมูลนักศึกษา
      const student = await Student.findOne({
        where: { userId },
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // ดึงข้อมูล CS05
      const document = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: ["pending", "approved"],
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
            attributes: ["internshipId"],
          },
        ],
        order: [["created_at", "DESC"]],
        transaction,
      });

      if (!document) {
        throw new Error(
          "ไม่พบข้อมูล CS05 ที่รออนุมัติหรือได้รับการอนุมัติแล้ว"
        );
      }

      const internshipId = document.internshipDocument.internshipId;

      const { learningOutcome, keyLearnings, futureApplication, improvements } =
        reflectionData;

      if (!learningOutcome || !keyLearnings || !futureApplication) {
        throw new Error("กรุณากรอกข้อมูลให้ครบถ้วน");
      }

      // ตรวจสอบว่ามีบทสรุปอยู่แล้วหรือไม่
      const existingReflection = await InternshipLogbookReflection.findOne({
        where: {
          internship_id: internshipId,
          student_id: student.studentId,
        },
        transaction,
      });

      let reflection;
      if (existingReflection) {
        // อัปเดตบทสรุปที่มีอยู่แล้ว
        reflection = await existingReflection.update(
          {
            learning_outcome: learningOutcome,
            key_learnings: keyLearnings,
            future_application: futureApplication,
            improvements: improvements || "",
          },
          { transaction }
        );
      } else {
        // สร้างบทสรุปใหม่
        reflection = await InternshipLogbookReflection.create(
          {
            internship_id: internshipId,
            student_id: student.studentId,
            learning_outcome: learningOutcome,
            key_learnings: keyLearnings,
            future_application: futureApplication,
            improvements: improvements || "",
          },
          { transaction }
        );
      }

      await transaction.commit();
      logger.info(`InternshipLogbookService: บันทึกบทสรุปการฝึกงานสำเร็จ`);

      return {
        id: reflection.id,
        learningOutcome: reflection.learning_outcome,
        keyLearnings: reflection.key_learnings,
        futureApplication: reflection.future_application,
        improvements: reflection.improvements,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error("InternshipLogbookService: Error in saveReflection", error);
      throw error;
    }
  }

  /**
   * ดึงบทสรุปการฝึกงาน
   * @param {number} userId - ID ของผู้ใช้
   * @returns {Object|null} บทสรุปการฝึกงาน
   */
  async getReflection(userId) {
    try {
      logger.info(
        `InternshipLogbookService: ดึงบทสรุปการฝึกงานสำหรับผู้ใช้ ${userId}`
      );

      // ดึงข้อมูลนักศึกษา
      const student = await Student.findOne({
        where: { userId },
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // ดึงข้อมูล CS05
      const document = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: ["pending", "approved", "supervisor_evaluated"],
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
            attributes: ["internshipId"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      if (!document) {
        throw new Error(
          "ไม่พบข้อมูล CS05 ที่รออนุมัติหรือได้รับการอนุมัติแล้ว"
        );
      }

      const internshipId = document.internshipDocument.internshipId;

      // ดึงบทสรุปการฝึกงาน
      const reflection = await InternshipLogbookReflection.findOne({
        where: {
          internship_id: internshipId,
        },
      });

      if (!reflection) {
        logger.info(`InternshipLogbookService: ยังไม่มีบทสรุปการฝึกงาน`);
        return null;
      }

      const result = {
        id: reflection.id,
        learningOutcome: reflection.learning_outcome,
        keyLearnings: reflection.key_learnings,
        futureApplication: reflection.future_application,
        improvements: reflection.improvements,
        createdAt: reflection.created_at,
        updatedAt: reflection.updated_at,
      };

      logger.info(`InternshipLogbookService: ดึงบทสรุปการฝึกงานสำเร็จ`);
      return result;
    } catch (error) {
      logger.error("InternshipLogbookService: Error in getReflection", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลสรุปการฝึกงานสำหรับสร้าง PDF
   * @param {number} userId - ID ของผู้ใช้
   * @returns {Object} ข้อมูลสรุปการฝึกงานครบถ้วน
   */
  async getInternshipSummaryForPDF(userId) {
    try {
      logger.info(
        `InternshipLogbookService: ดึงข้อมูลสรุปการฝึกงานสำหรับ PDF ผู้ใช้ ${userId}`
      );

      // ดึงข้อมูลนักศึกษา
      const student = await Student.findOne({
        where: { userId },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["firstName", "lastName", "email"],
          },
        ],
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // ดึงข้อมูล CS05 และ Internship Document
      const document = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: ["pending", "approved", "supervisor_evaluated"],
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument",
            required: true,
          },
        ],
        order: [["created_at", "DESC"]],
      });

      if (!document) {
        throw new Error(
          "ไม่พบข้อมูล CS05 ที่รออนุมัติหรือได้รับการอนุมัติแล้ว"
        );
      }

      const internshipId = document.internshipDocument.internshipId;

      // ดึงบันทึกการฝึกงานทั้งหมด
      const logEntries = await InternshipLogbook.findAll({
        where: {
          internshipId,
          studentId: student.studentId,
        },
        order: [["work_date", "ASC"]],
      });

      // ดึงบทสรุปการฝึกงาน
      const reflection = await InternshipLogbookReflection.findOne({
        where: {
          internship_id: internshipId,
          student_id: student.studentId,
        },
      });

      // คำนวณสถิติ
      const totalHours = logEntries.reduce(
        (sum, entry) => sum + (entry.workHours || 0),
        0
      );
      const totalDays = logEntries.length;
      const averageHours =
        totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0;

      // จัดเตรียมข้อมูลสำหรับ PDF
      const summaryData = {
        studentInfo: {
          studentId: student.studentId,
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          email: student.user.email,
          yearLevel: student.yearLevel,
          classroom: student.classroom,
          phoneNumber: student.phoneNumber,
        },
        companyInfo: {
          companyName: document.internshipDocument.companyName,
          companyAddress: document.internshipDocument.companyAddress,
          supervisorName: document.internshipDocument.supervisorName,
          supervisorPosition: document.internshipDocument.supervisorPosition,
          supervisorPhone: document.internshipDocument.supervisorPhone,
          supervisorEmail: document.internshipDocument.supervisorEmail,
        },
        internshipPeriod: {
          startDate: document.internshipDocument.startDate,
          endDate: document.internshipDocument.endDate,
        },
        logEntries: logEntries.map((entry) => ({
          workDate: entry.workDate,
          timeIn: entry.timeIn,
          timeOut: entry.timeOut,
          workHours: entry.workHours,
          workDescription: entry.workDescription,
          learningOutcome: entry.learningOutcome,
          problems: entry.problems,
          solutions: entry.solutions,
          supervisorApproved: entry.supervisorApproved,
        })),
        reflection: reflection
          ? {
              learningOutcome: reflection.learning_outcome,
              keyLearnings: reflection.key_learnings,
              futureApplication: reflection.future_application,
              improvements: reflection.improvements,
            }
          : null,
        statistics: {
          totalDays,
          totalHours,
          averageHours,
        },
      };

      logger.info(`InternshipLogbookService: ดึงข้อมูลสรุปการฝึกงานสำเร็จ`);
      return summaryData;
    } catch (error) {
      logger.error(
        "InternshipLogbookService: Error in getInternshipSummaryForPDF",
        error
      );
      throw error;
    }
  }
}

module.exports = new InternshipLogbookService();
