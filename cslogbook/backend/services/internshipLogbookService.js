const path = require("path");
const {
  InternshipLogbook,
  InternshipDocument,
  InternshipLogbookReflection,
  Document,
  Student,
  User,
  sequelize,
  Academic,
} = require("../models");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);
const { calculateWorkdays } = require("../utils/dateUtils");
const logger = require("../utils/logger");

// Thai font paths สำหรับ PDF generation
const FONT_REGULAR = path.join(__dirname, "../fonts/Loma.otf");
const FONT_BOLD = path.join(__dirname, "../fonts/Loma-Bold.otf");

// สถานะของเอกสาร CS05 ที่ถือว่า “มีผล” สำหรับการเข้าถึงข้อมูลฝึกงาน
// ครอบคลุมทั้งกรณีรออนุมัติ, อนุมัติแล้ว และผ่านการตรวจของอาจารย์นิเทศ
const ACTIVE_CS05_STATUSES = [
  "pending",
  "approved",
  "acceptance_approved",
  "supervisor_evaluated",
  "referral_ready",
  "referral_downloaded",
];

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
          status: ACTIVE_CS05_STATUSES,
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
        `InternshipLogbookService: บันทึกข้อมูลการฝึกงานสำหรับ userId ${userId}`
      );

      const student = await Student.findOne({
        where: { userId },
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // ดึงปีการศึกษาและภาคเรียนปัจจุบันจาก Academic
      const currentAcademic = await Academic.findOne({ where: { isCurrent: true } });
      if (!currentAcademic) throw new Error('ไม่พบข้อมูลปีการศึกษาปัจจุบัน');

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

      const document = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: ACTIVE_CS05_STATUSES,
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
        throw new Error("ไม่พบข้อมูล CS05");
      }

      // ตรวจสอบวันที่บันทึก: ห้ามบันทึกล่วงหน้า (อนุญาตวันที่ผ่านมาแล้วทุกวัน)
      const todayBkk = dayjs().tz("Asia/Bangkok").startOf("day");
      const workDateBkk = dayjs(workDate).tz("Asia/Bangkok").startOf("day");
      if (workDateBkk.isAfter(todayBkk)) {
        throw new Error("ไม่สามารถบันทึกล่วงหน้าได้ กรุณาบันทึกในวันที่ถึงแล้วเท่านั้น");
      }

      const internshipId = document.internshipDocument.internshipId;

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
        // เพิ่ม academicYear และ semester ตอนสร้าง logbook
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
            academicYear: currentAcademic.academicYear,
            semester: currentAcademic.currentSemester,
          },
          { transaction }
        );
      }

      // Update workflow เมื่อสร้าง logbook entry แรก (เริ่มฝึกงานแล้ว)
      if (!existingEntry) {
        const logbookCount = await InternshipLogbook.count({
          where: { internshipId },
          transaction
        });
        
        if (logbookCount === 1) {
          // Entry แรก = เริ่มฝึกงานแล้ว
          const workflowService = require('./workflowService');
          await workflowService.updateStudentWorkflowActivity(
            student.studentId,
            'internship',
            'INTERNSHIP_IN_PROGRESS',
            'in_progress',
            'in_progress',
            { firstLogDate: workDate, logId: entry.logId },
            { transaction }
          );
          logger.info(`Updated workflow to IN_PROGRESS for student ${student.studentId}`);
        }
      }

      await transaction.commit();

      // ตรวจสอบว่าควร update เป็น SUMMARY_PENDING หรือไม่ (หลัง commit)
      try {
        await this.checkAndUpdateSummaryPending(internshipId);
      } catch (checkError) {
        logger.error('Error checking summary pending status:', checkError);
        // ไม่ throw เพราะ logbook save สำเร็จแล้ว
      }
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

      // ตรวจสอบวันที่บันทึก: ห้ามบันทึกล่วงหน้า (อนุญาตวันที่ผ่านมาแล้วทุกวัน)
      if (workDate) {
        const todayBkk = dayjs().tz("Asia/Bangkok").startOf("day");
        const workDateBkk = dayjs(workDate).tz("Asia/Bangkok").startOf("day");
        if (workDateBkk.isAfter(todayBkk)) {
          throw new Error("ไม่สามารถบันทึกล่วงหน้าได้ กรุณาบันทึกในวันที่ถึงแล้วเท่านั้น");
        }
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
   * ลบข้อมูลบันทึกการฝึกงาน
   * @param {number} userId - ID ของผู้ใช้
   * @param {number} logId - ID ของบันทึก
   */
  async deleteTimeSheetEntry(userId, logId) {
    const transaction = await sequelize.transaction();
    try {
      logger.info(
        `InternshipLogbookService: ลบบันทึกการฝึกงาน ID: ${logId}`
      );

      const student = await Student.findOne({
        where: { userId },
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // ดึงข้อมูลบันทึกที่ต้องการลบ
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

      // ตรวจสอบว่าบันทึกได้รับการอนุมัติแล้วหรือไม่ ถ้าอนุมัติแล้วห้ามลบ
      if (entry.supervisorApproved || entry.advisorApproved) {
        throw new Error("ไม่สามารถลบบันทึกที่ได้รับการอนุมัติแล้ว");
      }

      await entry.destroy({ transaction });
      await transaction.commit();
      logger.info(
        `InternshipLogbookService: ลบบันทึกการฝึกงานสำเร็จ ID: ${logId}`
      );
      return true;
    } catch (error) {
      await transaction.rollback();
      logger.error(
        "InternshipLogbookService: Error in deleteTimeSheetEntry",
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
          status: ACTIVE_CS05_STATUSES,
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
          status: ACTIVE_CS05_STATUSES,
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
          status: ACTIVE_CS05_STATUSES,
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
        `InternshipLogbookService: บันทึกเวลาเข้างาน userId ${userId}`
      );
      const student = await Student.findOne({ where: { userId } });
      if (!student) throw new Error("ไม่พบข้อมูลนักศึกษา");
      // ดึงปีการศึกษาและภาคเรียนปัจจุบันจาก Academic
      const currentAcademic = await Academic.findOne({ where: { isCurrent: true } });
      if (!currentAcademic) throw new Error('ไม่พบข้อมูลปีการศึกษาปัจจุบัน');
      const {
        workDate,
        timeIn,
        logTitle,
        workDescription,
        learningOutcome,
        problems,
        solutions,
      } = checkInData;
      const document = await Document.findOne({
        where: {
          userId,
          documentName: "CS05",
          status: ACTIVE_CS05_STATUSES,
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
      if (!document) throw new Error("ไม่พบข้อมูล CS05");
      const internshipId = document.internshipDocument.internshipId;
      let entry = await InternshipLogbook.findOne({
        where: {
          internshipId,
          studentId: student.studentId,
          workDate,
        },
        transaction,
      });
      if (entry) {
        const updateData = { timeIn };
        if (logTitle !== undefined) updateData.logTitle = logTitle;
        if (workDescription !== undefined) updateData.workDescription = workDescription;
        if (learningOutcome !== undefined) updateData.learningOutcome = learningOutcome;
        if (problems !== undefined) updateData.problems = problems || "";
        if (solutions !== undefined) updateData.solutions = solutions || "";
        entry = await entry.update(updateData, { transaction });
      } else {
        // เพิ่ม academicYear และ semester ตอนสร้าง logbook
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
            academicYear: currentAcademic.academicYear,
            semester: currentAcademic.currentSemester,
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
        `InternshipLogbookService: บันทึกเวลาออกงาน userId ${userId}`
      );
      const student = await Student.findOne({ where: { userId } });
      if (!student) throw new Error("ไม่พบข้อมูลนักศึกษา");
      // ดึงปีการศึกษาและภาคเรียนปัจจุบันจาก Academic
      const currentAcademic = await Academic.findOne({ where: { isCurrent: true } });
      if (!currentAcademic) throw new Error('ไม่พบข้อมูลปีการศึกษาปัจจุบัน');
      const {
        workDate,
        timeOut,
        logTitle,
        workDescription,
        learningOutcome,
        problems,
        solutions,
      } = checkOutData;
      const entry = await InternshipLogbook.findOne({
        where: {
          studentId: student.studentId,
          workDate,
        },
        transaction,
      });
      if (!entry) throw new Error("ไม่พบข้อมูลการบันทึกเวลาเข้างาน");
      // อัปเดตข้อมูลเวลาออกงานและรายละเอียด
      await entry.update(
        {
          timeOut,
          logTitle,
          workDescription,
          learningOutcome,
          problems: problems || "",
          solutions: solutions || "",
          // ไม่ต้องอัปเดต academicYear/semester เพราะถูกกำหนดตอน checkIn แล้ว
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
          status: ACTIVE_CS05_STATUSES,
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
          status: ACTIVE_CS05_STATUSES,
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
          status: ACTIVE_CS05_STATUSES,
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
          studentId: student.studentCode,
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

  /**
   * 🆕 ดึงข้อมูลสรุปบันทึกฝึกงาน (สำหรับ admin) จาก internshipId โดยตรง
   * รวมบันทึกรายวัน + reflection + สถิติ เหมือน getInternshipSummaryForPDF แต่ไม่ต้องทราบ userId
   * @param {number} internshipId
   * @returns {Object} summaryData
   */
  async getInternshipSummaryByInternshipId(internshipId) {
    try {
      logger.info(`InternshipLogbookService: getInternshipSummaryByInternshipId ${internshipId}`);

      // หา InternshipDocument -> ใช้ documentId -> หา Document (เพื่อ userId) -> หา Student
      const { Document } = require('../models');
      const internshipDoc = await InternshipDocument.findByPk(internshipId, {
        include: [{ model: Document, as: 'document', attributes: ['userId'] }]
      });
      if (!internshipDoc) throw new Error('ไม่พบข้อมูลการฝึกงาน');

      const student = await Student.findOne({
        where: { userId: internshipDoc.document.userId },
        include: [{ model: User, as: 'user', attributes: ['firstName','lastName','email'] }]
      });
      if (!student) throw new Error('ไม่พบข้อมูลนักศึกษา');

      // บันทึกการฝึกงาน
      const logEntries = await InternshipLogbook.findAll({
        where: { internshipId, studentId: student.studentId },
        order: [['work_date','ASC']]
      });

      // reflection (อาจไม่มี)
      const reflection = await InternshipLogbookReflection.findOne({
        where: { internship_id: internshipId, student_id: student.studentId }
      });

      const totalHours = logEntries.reduce((sum,e)=> sum + (parseFloat(e.workHours) || 0), 0);
      const totalDays = logEntries.length;
      const averageHours = totalDays ? (totalHours/totalDays).toFixed(1) : 0;

      return {
        studentInfo: {
          // ใช้รหัสนักศึกษาจริง (studentCode) สำหรับแสดงผล PDF และเก็บค่า primary key แยก
          studentId: student.studentCode, // สำหรับการแสดงผล
          studentPrimaryId: student.studentId, // เก็บไว้เผื่ออ้างอิงภายใน
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          email: student.user.email,
          yearLevel: student.yearLevel,
          classroom: student.classroom,
          phoneNumber: student.phoneNumber,
        },
        companyInfo: {
          companyName: internshipDoc.companyName,
          companyAddress: internshipDoc.companyAddress,
          supervisorName: internshipDoc.supervisorName,
          supervisorPosition: internshipDoc.supervisorPosition,
          supervisorPhone: internshipDoc.supervisorPhone,
          supervisorEmail: internshipDoc.supervisorEmail,
        },
        internshipPeriod: {
          startDate: internshipDoc.startDate,
          endDate: internshipDoc.endDate,
        },
        logEntries: logEntries.map(entry => ({
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
        reflection: reflection ? {
          learningOutcome: reflection.learning_outcome,
          keyLearnings: reflection.key_learnings,
          futureApplication: reflection.future_application,
          improvements: reflection.improvements,
        } : null,
        statistics: { totalDays, totalHours, averageHours },
      };
    } catch (error) {
      logger.error('InternshipLogbookService: Error in getInternshipSummaryByInternshipId', error);
      throw error;
    }
  }

  /**
   * 🆕 สร้าง PDF บันทึกฝึกงานจาก summaryData (ใช้ได้ทั้ง student/admin)
   * @param {Object} summaryData
   * @returns {Buffer}
   */
  async generateInternshipSummaryPDF(summaryData) {
    const PDFDocument = require('pdfkit');
    try {
      logger.info('InternshipLogbookService: generateInternshipSummaryPDF start');

      if (!summaryData || !summaryData.logEntries) {
        throw new Error('ข้อมูลสรุปไม่ครบถ้วน');
      }

      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];

      // ลงทะเบียน Thai font
      doc.registerFont('Thai', FONT_REGULAR);
      doc.registerFont('Thai-Bold', FONT_BOLD);

      return await new Promise((resolve, reject) => {
        doc.on('data', (c)=> chunks.push(c));
        doc.on('error', (err)=> { logger.error('PDF generation error', err); reject(err); });
        doc.on('end', ()=> resolve(Buffer.concat(chunks)));

        // Header
        doc.font('Thai-Bold').fontSize(18).text('สรุปบันทึกการฝึกงาน (Internship Logbook Summary)', { align: 'center' });
        doc.moveDown(0.5);

        const s = summaryData.studentInfo || {};
        const c = summaryData.companyInfo || {};
        const p = summaryData.internshipPeriod || {};
        const stats = summaryData.statistics || {};

        doc.font('Thai').fontSize(12).text(`รหัสนักศึกษา: ${s.studentId || '-'}`);
        doc.text(`ชื่อ: ${[s.firstName, s.lastName].filter(Boolean).join(' ') || '-'}`);
        doc.text(`ชั้นปี: ${s.yearLevel || '-'}   ห้อง: ${s.classroom || '-'}`);
        doc.text(`อีเมล: ${s.email || '-'}`);
        doc.moveDown(0.5);
        doc.text(`สถานประกอบการ: ${c.companyName || '-'}`);
        doc.text(`ที่อยู่: ${c.companyAddress || '-'}`);
        doc.text(`ผู้ควบคุมงาน: ${c.supervisorName || '-'} (${c.supervisorPosition || '-'})`);
        doc.moveDown(0.5);
        doc.text(`ช่วงฝึกงาน: ${p.startDate || '-'} ถึง ${p.endDate || '-'}`);
        doc.text(`จำนวนวัน: ${stats.totalDays || 0}  ชั่วโมงรวม: ${stats.totalHours || 0}  เฉลี่ยต่อวัน: ${stats.averageHours || 0}`);
        doc.moveDown();

        // ตารางบันทึกรายวัน
        doc.font('Thai-Bold').fontSize(14).text('บันทึกรายวัน', { underline: true });
        doc.moveDown(0.5);
        doc.font('Thai');
        summaryData.logEntries.forEach(entry => {
          // เพิ่มหน้าใหม่เมื่อใกล้ขอบล่าง
          if (doc.y > 720) {
            doc.addPage();
          }
          doc.fontSize(10).text(`• ${entry.workDate}: ${entry.workHours || 0} ชม. - ${entry.workDescription || ''}`);
        });

        // Reflection
        if (summaryData.reflection) {
          if (doc.y > 650) doc.addPage();
          doc.moveDown();
          doc.font('Thai-Bold').fontSize(14).text('บทสรุปการฝึกงาน', { underline: true });
          const r = summaryData.reflection;
          doc.font('Thai').fontSize(10);
          doc.text(`สิ่งที่ได้เรียนรู้: ${r.learningOutcome || '-'}`);
          doc.text(`ทักษะสำคัญ: ${r.keyLearnings || '-'}`);
          doc.text(`การประยุกต์ใช้ในอนาคต: ${r.futureApplication || '-'}`);
          doc.text(`ข้อเสนอแนะ/ปรับปรุง: ${r.improvements || '-'}`);
        }

        doc.end();
      });
    } catch (error) {
      logger.error('InternshipLogbookService: Error in generateInternshipSummaryPDF', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบและอัปเดต workflow เมื่อใกล้ถึง endDate หรือชั่วโมงครบ
   * เรียกใช้จาก cron job หรือหลังบันทึก logbook
   * @param {number} internshipId - ID ของการฝึกงาน
   */
  async checkAndUpdateSummaryPending(internshipId) {
    try {
      const { Internship } = require('../models');
      const internship = await Internship.findByPk(internshipId, {
        include: [{ model: Student, as: 'student' }]
      });

      if (!internship || !internship.student) {
        logger.warn(`Internship ${internshipId} not found or no student`);
        return;
      }

      // ตรวจสอบ workflow ปัจจุบัน
      const workflowService = require('./workflowService');
      const { StudentWorkflowActivity } = require('../models');
      const activity = await StudentWorkflowActivity.findOne({
        where: {
          studentId: internship.student.studentId,
          workflowType: 'internship'
        }
      });

      // ถ้ายังไม่ได้อยู่ในขั้นตอน IN_PROGRESS หรือสูงกว่า ข้าม
      if (!activity || !['INTERNSHIP_IN_PROGRESS'].includes(activity.currentStepKey)) {
        return;
      }

      // เงื่อนไข 1: ใกล้ถึง endDate (เหลือ 7 วัน)
      let shouldUpdateToSummaryPending = false;
      const now = dayjs();
      const endDate = internship.endDate ? dayjs(internship.endDate) : null;
      const daysUntilEnd = endDate ? endDate.diff(now, 'day') : null;

      if (daysUntilEnd !== null && daysUntilEnd <= 7 && daysUntilEnd >= 0) {
        shouldUpdateToSummaryPending = true;
        logger.info(`Internship ${internshipId} is ${daysUntilEnd} days from end date`);
      }

      // เงื่อนไข 2: ชั่วโมงครบ 360 ชั่วโมงขึ้นไป (หรือตามที่กำหนด)
      const totalHours = await InternshipLogbook.sum('workHours', {
        where: {
          internshipId,
          supervisorApproved: true // นับเฉพาะที่ผู้ควบคุมอนุมัติแล้ว
        }
      });

      const REQUIRED_HOURS = 360; // ชั่วโมงขั้นต่ำ
      if (totalHours >= REQUIRED_HOURS) {
        shouldUpdateToSummaryPending = true;
        logger.info(`Internship ${internshipId} has ${totalHours} hours (>= ${REQUIRED_HOURS})`);
      }

      // Update workflow ถ้าตรงเงื่อนไข
      if (shouldUpdateToSummaryPending) {
        await workflowService.updateStudentWorkflowActivity(
          internship.student.studentId,
          'internship',
          'INTERNSHIP_SUMMARY_PENDING',
          'awaiting_student_action',
          'in_progress',
          {
            totalHours: totalHours || 0,
            daysUntilEnd,
            triggeredAt: new Date().toISOString()
          }
        );
        logger.info(`Updated workflow to SUMMARY_PENDING for student ${internship.student.studentId}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error in checkAndUpdateSummaryPending:', error);
      throw error;
    }
  }
}

module.exports = new InternshipLogbookService();
