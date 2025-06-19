"use strict";

const crypto = require("crypto");
const dayjs = require("dayjs");
const { Op } = require("sequelize");
const logger = require("../utils/logger");
const {
  InternshipLogbook,
  ApprovalToken,
  Student,
  User,
  InternshipDocument,
  Document,
  sequelize,
} = require("../models");
const {
  sendTimeSheetApprovalRequest,
  sendTimeSheetApprovalResultNotification,
} = require("../utils/mailer");

class EmailApprovalService {
  /**
   * สร้าง token สำหรับการอนุมัติ
   */
  generateApprovalToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * ดึงข้อมูลประวัติการส่งคำขออนุมัติของนักศึกษา
   */
  async getApprovalHistory(studentId) {
    try {
      logger.info(
        `EmailApprovalService: ดึงประวัติการส่งคำขออนุมัติสำหรับนักศึกษา ${studentId}`
      );

      const tokens = await ApprovalToken.findAll({
        where: {
          studentId,
          status: {
            [Op.in]: ["pending", "approved", "rejected"],
          },
        },
        order: [["createdAt", "DESC"]],
        limit: 50,
      });

      return tokens;
    } catch (error) {
      logger.error("EmailApprovalService: Error in getApprovalHistory", error);
      throw error;
    }
  }

  /**
   * ดึงข้อมูลบันทึกการฝึกงานสำหรับการขออนุมัติ
   */
  async getTimesheetEntriesForApproval(studentId, type, options = {}) {
    try {
      const { startDate, endDate, logIds } = options;
      let timeSheetEntries;

      if (type === "selected" && logIds && logIds.length > 0) {
        // กรณีระบุ ID เฉพาะ
        timeSheetEntries = await InternshipLogbook.findAll({
          where: {
            logId: logIds,
            studentId,
            supervisorApproved: false, // เฉพาะที่ยังไม่ได้อนุมัติ
          },
          order: [["workDate", "ASC"]],
        });
      } else if (type === "weekly" || type === "monthly") {
        // กรณีขออนุมัติรายสัปดาห์หรือรายเดือน
        let queryStartDate = startDate
          ? dayjs(startDate).toDate()
          : dayjs()
              .subtract(type === "weekly" ? 7 : 30, "day")
              .toDate();
        let queryEndDate = endDate ? dayjs(endDate).toDate() : dayjs().toDate();

        timeSheetEntries = await InternshipLogbook.findAll({
          where: {
            studentId,
            workDate: {
              [Op.between]: [queryStartDate, queryEndDate],
            },
            supervisorApproved: false,
          },
          order: [["workDate", "ASC"]],
        });
      } else if (type === "full") {
        // กรณีขออนุมัติทั้งหมด
        timeSheetEntries = await InternshipLogbook.findAll({
          where: {
            studentId,
            supervisorApproved: false,
          },
          order: [["workDate", "ASC"]],
        });
      } else {
        // กรณีขออนุมัติวันล่าสุด (default: single)
        timeSheetEntries = await InternshipLogbook.findAll({
          where: {
            studentId,
            supervisorApproved: false,
          },
          order: [["workDate", "DESC"]],
          limit: 1,
        });
      }

      return timeSheetEntries;
    } catch (error) {
      logger.error(
        "EmailApprovalService: Error in getTimesheetEntriesForApproval",
        error
      );
      throw error;
    }
  }

  /**
   * สร้าง approval tokens และบันทึกลงฐานข้อมูล
   */
  async generateApprovalTokens(
    logIds,
    studentId,
    supervisorEmail,
    type,
    transaction
  ) {
    try {
      const approveToken = this.generateApprovalToken();
      const rejectToken = this.generateApprovalToken();

      // กำหนดวันหมดอายุเป็น 7 วัน
      const expiresAt = dayjs().add(7, "day").toDate();

      // เก็บ logIds เป็น string คั่นด้วย comma
      const logIdsString = logIds.join(",");

      // เก็บ token ลงในฐานข้อมูล
      const approvalToken = await ApprovalToken.create(
        {
          token: approveToken,
          logId: logIdsString,
          supervisorId: supervisorEmail,
          studentId,
          type: type || "single",
          status: "pending",
          expiresAt,
        },
        { transaction }
      );

      const rejectionToken = await ApprovalToken.create(
        {
          token: rejectToken,
          logId: logIdsString,
          supervisorId: supervisorEmail,
          studentId,
          type: type || "single",
          status: "pending",
          expiresAt,
        },
        { transaction }
      );

      return {
        approveToken,
        rejectToken,
        approvalTokenRecord: approvalToken,
        rejectionTokenRecord: rejectionToken,
      };
    } catch (error) {
      logger.error(
        "EmailApprovalService: Error in generateApprovalTokens",
        error
      );
      throw error;
    }
  }

  /**
   * ส่งคำขออนุมัติผ่านอีเมลไปยังหัวหน้างาน
   */
  async sendApprovalRequest(studentId, approvalData) {
    const transaction = await sequelize.transaction();

    try {
      const { type, startDate, endDate, logIds } = approvalData;

      logger.info(
        `EmailApprovalService: ส่งคำขออนุมัติสำหรับนักศึกษา ${studentId}, ประเภท: ${type}`
      );

      // ตรวจสอบข้อมูลนักศึกษา
      const student = await Student.findOne({
        where: { studentId },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["userId", "email", "firstName", "lastName"],
          },
        ],
      });

      if (!student) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      logger.info(
        `✅ พบข้อมูลนักศึกษา: ${student.user.firstName} ${student.user.lastName}`
      );

      // ✅ ปรับปรุง: ค้นหา Document พร้อมกับ InternshipDocument ในครั้งเดียว
      const document = await Document.findOne({
        where: {
          userId: student.user.userId,
          documentType: "internship",
        },
        include: [
          {
            model: InternshipDocument,
            as: "internshipDocument", // ใช้ alias ที่ถูกต้องตาม association
            required: true, // ต้องมี InternshipDocument เท่านั้น
          },
        ],
        order: [["created_at", "DESC"]],
      });

      if (!document) {
        throw new Error("ไม่พบข้อมูลเอกสารการฝึกงาน");
      }

      // ✅ เพิ่ม logging เพื่อ debug
      logger.info(`✅ พบเอกสารการฝึกงาน documentId: ${document.documentId}`);

      if (!document.internshipDocument) {
        logger.error(
          `❌ ไม่พบ InternshipDocument สำหรับ documentId: ${document.documentId}`
        );
        throw new Error(
          "ไม่พบข้อมูลรายละเอียดการฝึกงาน (InternshipDocument) ที่เชื่อมกับเอกสารของนักศึกษานี้"
        );
      }

      const internshipDoc = document.internshipDocument;
      logger.info(
        `✅ พบข้อมูลการฝึกงาน supervisorEmail: ${internshipDoc.supervisorEmail}`
      );

      if (!internshipDoc.supervisorEmail) {
        throw new Error(
          "ไม่พบข้อมูลอีเมลหัวหน้างาน (supervisor_email) ในรายละเอียดการฝึกงาน"
        );
      }

      // ดึงข้อมูลบันทึกการฝึกงานตามเงื่อนไข
      const timeSheetEntries = await this.getTimesheetEntriesForApproval(
        student.studentId,
        type,
        { startDate, endDate, logIds }
      );

      if (!timeSheetEntries || timeSheetEntries.length === 0) {
        throw new Error("ไม่พบบันทึกการฝึกงานที่รอการอนุมัติ");
      }

      logger.info(`✅ พบบันทึกการฝึกงาน ${timeSheetEntries.length} รายการ`);

      // สร้าง approval tokens
      const logIdsArray = timeSheetEntries.map((entry) => entry.logId);
      const tokens = await this.generateApprovalTokens(
        logIdsArray,
        student.studentId,
        internshipDoc.supervisorEmail,
        type,
        transaction
      );

      logger.info(`✅ สร้าง approval tokens สำเร็จ`);

      // สร้าง URL สำหรับหน้าเว็บการอนุมัติ
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const webApprovalLink = `${baseUrl}/approval/timesheet/${tokens.approveToken}`;

      // สร้างชื่อนักศึกษาและหัวหน้างานแบบเต็ม
      const studentFullName = `${student.user.firstName} ${student.user.lastName}`;
      const supervisorDisplayName =
        internshipDoc.supervisorName || internshipDoc.supervisorEmail;

      logger.info(`✅ เตรียมส่งอีเมลไปยัง: ${internshipDoc.supervisorEmail}`);
      logger.info(`✅ Web approval link: ${webApprovalLink}`);

      // ส่งอีเมลไปยังหัวหน้างาน
      const emailResult = await sendTimeSheetApprovalRequest(
        internshipDoc.supervisorEmail,
        supervisorDisplayName,
        studentFullName,
        webApprovalLink, // ใช้ลิงก์เว็บแทน
        null, // ไม่ต้องใช้ reject link แยก
        timeSheetEntries,
        type
      );

      logger.info(`✅ ผลการส่งอีเมล:`, emailResult);

      // เพิ่มการจัดการผลลัพธ์จากการส่งอีเมล
      if (emailResult.sent) {
        logger.info(
          `✅ ส่งอีเมลคำขออนุมัติสำเร็จ - นักศึกษา: ${studentFullName}, ประเภท: ${type}`,
          {
            supervisorEmail: internshipDoc.supervisorEmail,
            supervisorName: supervisorDisplayName,
            studentName: studentFullName,
            type,
            messageId: emailResult.messageId,
            service: "EmailApprovalService",
          }
        );
      } else {
        logger.warn(
          `⚠️ ไม่สามารถส่งอีเมลคำขออนุมัติได้ - นักศึกษา: ${studentFullName}, ประเภท: ${type}`,
          {
            supervisorEmail: internshipDoc.supervisorEmail,
            supervisorName: supervisorDisplayName,
            studentName: studentFullName,
            type,
            reason: emailResult.reason,
            service: "EmailApprovalService",
          }
        );
      }

      await transaction.commit();

      return {
        success: true,
        message: "ส่งคำขออนุมัติผ่านอีเมลไปยังหัวหน้างานเรียบร้อยแล้ว",
        data: {
          studentName: studentFullName,
          supervisorEmail: internshipDoc.supervisorEmail,
          entriesCount: timeSheetEntries.length,
          tokenId: tokens.approvalTokenRecord.tokenId,
          expiresAt: tokens.approvalTokenRecord.expiresAt,
          emailSent: emailResult.sent,
          webApprovalLink: webApprovalLink,
        },
      };
    } catch (error) {
      await transaction.rollback();
      logger.error("EmailApprovalService: Error in sendApprovalRequest", error);
      throw error;
    }
  }

  /**
   * อนุมัติบันทึกการฝึกงานผ่าน token
   */
  async approveTimesheetEntries(token, comment) {
    const transaction = await sequelize.transaction();

    try {
      logger.info(
        `EmailApprovalService: อนุมัติบันทึกการฝึกงานด้วย token: ${token}`
      );

      // ดึงข้อมูล token จากฐานข้อมูล
      const approvalToken = await ApprovalToken.findOne({
        where: {
          token,
          status: "pending",
          expiresAt: { [Op.gt]: new Date() },
        },
      });

      if (!approvalToken) {
        throw new Error("Token ไม่ถูกต้องหรือหมดอายุแล้ว");
      }

      // ดึงข้อมูลนักศึกษา
      const student = await Student.findByPk(approvalToken.studentId, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["email", "firstName", "lastName"],
          },
        ],
        transaction,
      });

      if (!student || !student.user) {
        throw new Error("ไม่พบข้อมูลนักศึกษา");
      }

      // ดึง logIds จาก string คั่นด้วย comma
      const logIds = approvalToken.logId
        .split(",")
        .map((id) => parseInt(id.trim(), 10));

      // อัพเดทสถานะการอนุมัติในตาราง InternshipLogbook
      await InternshipLogbook.update(
        {
          supervisorApproved: true,
          supervisorComment: comment || null,
          supervisorApprovedAt: new Date(),
        },
        {
          where: { logId: { [Op.in]: logIds } },
          transaction,
        }
      );

      // อัพเดทสถานะ token เป็น approved
      await approvalToken.update(
        {
          status: "approved",
          comment: comment || null,
        },
        { transaction }
      );

      // เลือกบันทึกแรกเพื่อแจ้งเตือนผ่านอีเมล (กรณีมีหลายรายการ)
      const firstEntry = await InternshipLogbook.findOne({
        where: { logId: logIds[0] },
      });

      // ส่งอีเมลแจ้งเตือนนักศึกษา
      await sendTimeSheetApprovalResultNotification(
        student.user.email,
        `${student.user.firstName} ${student.user.lastName}`,
        "approved",
        comment,
        firstEntry
      );

      await transaction.commit();

      return {
        success: true,
        message: "อนุมัติบันทึกการฝึกงานเรียบร้อยแล้ว",
        data: {
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          approvedEntries: logIds.length,
          comment,
        },
      };
    } catch (error) {
      await transaction.rollback();
      logger.error(
        "EmailApprovalService: Error in approveTimesheetEntries",
        error
      );
      throw error;
    }
  }

  /**
   * ปฏิเสธบันทึกการฝึกงานผ่าน token
   */
  async rejectTimesheetEntries(token, comment) {
    const transaction = await sequelize.transaction();

    try {
      logger.info(
        `EmailApprovalService: ปฏิเสธบันทึกการฝึกงานด้วย token: ${token}`
      );

      // ดึงข้อมูล token จากฐานข้อมูล
      const rejectionToken = await ApprovalToken.findOne({
        where: {
          token,
          status: "pending",
          expiresAt: { [Op.gt]: new Date() },
        },
        transaction,
      });

      if (!rejectionToken) {
        throw new Error("Token ไม่ถูกต้อง หมดอายุ หรือถูกใช้งานไปแล้ว");
      }

      // ดึงข้อมูลนักศึกษา
      const student = await Student.findByPk(rejectionToken.studentId, {
        include: [
          {
            model: User,
            as: "user",
            attributes: ["email", "firstName", "lastName"],
          },
        ],
        transaction,
      });

      if (!student || !student.user) {
        throw new Error(
          "ไม่พบข้อมูลนักศึกษาหรือข้อมูลผู้ใช้ที่เกี่ยวข้องกับ Token นี้"
        );
      }

      // ดึง logIds จาก string คั่นด้วย comma
      const logIds = rejectionToken.logId
        .split(",")
        .map((id) => parseInt(id.trim(), 10));

      // อัพเดทสถานะการอนุมัติในตาราง InternshipLogbook
      await InternshipLogbook.update(
        {
          supervisorApproved: -1, // -1 แทน rejected
          supervisorComment: comment || null,
          supervisorApprovedAt: null,
          supervisorRejectedAt: new Date(),
        },
        {
          where: { logId: { [Op.in]: logIds } },
          transaction,
        }
      );

      // อัพเดทสถานะ token เป็น rejected
      await rejectionToken.update(
        {
          status: "rejected",
          comment: comment,
        },
        { transaction }
      );

      // เลือกบันทึกแรกเพื่อแจ้งเตือนผ่านอีเมล (กรณีมีหลายรายการ)
      const firstEntry = await InternshipLogbook.findOne({
        where: { logId: logIds[0] },
        transaction,
      });

      // ส่งอีเมลแจ้งเตือนนักศึกษา
      await sendTimeSheetApprovalResultNotification(
        student.user.email,
        `${student.user.firstName} ${student.user.lastName}`,
        "rejected",
        comment,
        firstEntry
      );

      await transaction.commit();

      return {
        success: true,
        message: "ปฏิเสธบันทึกการฝึกงานเรียบร้อยแล้ว",
        data: {
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          rejectedEntries: logIds.length,
          comment,
        },
      };
    } catch (error) {
      await transaction.rollback();
      logger.error(
        "EmailApprovalService: Error in rejectTimesheetEntries",
        error
      );
      throw error;
    }
  }

  /**
   * ดึงข้อมูลพื้นฐานของ token และชื่อนักศึกษา
   */
  async getTokenInfo(token) {
    try {
      logger.info(
        `EmailApprovalService: ดึงข้อมูล token ${token.substring(0, 16)}...`
      );

      // ✅ ขั้นตอนที่ 1: หา ApprovalToken ก่อน (ไม่ใช้ include)
      const tokenResult = await ApprovalToken.findOne({
        where: {
          token,
          status: "pending",
        },
      });

      if (!tokenResult) {
        logger.warn(`No pending token found for: ${token.substring(0, 16)}...`);

        // ลองหา token ที่ไม่ใช่ pending
        const anyTokenResult = await ApprovalToken.findOne({
          where: { token },
        });

        if (anyTokenResult) {
          logger.info(`Found token with status: ${anyTokenResult.status}`);
          return await this.buildTokenResponseFromDatabase(anyTokenResult);
        }

        return null;
      }

      logger.info(`✅ Found ApprovalToken:`, {
        tokenId: tokenResult.tokenId,
        studentId: tokenResult.studentId,
        type: tokenResult.type,
        status: tokenResult.status,
      });

      return await this.buildTokenResponseFromDatabase(tokenResult);
    } catch (error) {
      logger.error("EmailApprovalService: Error in getTokenInfo", error);
      throw new Error(`ไม่สามารถดึงข้อมูล token ได้: ${error.message}`);
    }
  }

  /**
   * ✅ แก้ไข Helper function ให้ดึงข้อมูลแยกเป็นขั้นตอน
   */
  async buildTokenResponseFromDatabase(tokenData) {
    try {
      let studentName = "ไม่ระบุ";
      let studentCode = tokenData.studentId || "ไม่ระบุ";
      let email = null;

      // ✅ ขั้นตอนที่ 1: ดึงข้อมูล Student แบบ direct query
      const student = await Student.findOne({
        where: { studentId: tokenData.studentId },
        attributes: ["studentId", "studentCode", "userId"],
      });

      logger.info(`✅ Student query result:`, {
        found: !!student,
        studentId: student?.studentId,
        studentCode: student?.studentCode,
        userId: student?.userId,
      });

      if (student) {
        // ✅ ใช้ studentCode จาก Student table
        if (student.studentCode) {
          studentCode = student.studentCode;
          logger.info(`✅ Found studentCode: ${studentCode}`);
        }

        // ✅ ขั้นตอนที่ 2: ดึงข้อมูล User แบบ direct query
        if (student.userId) {
          const user = await User.findOne({
            where: { userId: student.userId },
            attributes: ["firstName", "lastName", "email"],
          });

          logger.info(`✅ User query result:`, {
            found: !!user,
            firstName: user?.firstName,
            lastName: user?.lastName,
            hasEmail: !!user?.email,
          });

          if (user) {
            // ✅ สร้างชื่อเต็มจากข้อมูล User
            if (user.firstName && user.lastName) {
              studentName = `${user.firstName} ${user.lastName}`;
              logger.info(`✅ Built student name: ${studentName}`);
            }

            if (user.email) {
              email = user.email;
            }
          } else {
            logger.warn(`⚠️ No user found for userId: ${student.userId}`);
          }
        } else {
          logger.warn(`⚠️ Student found but no userId: ${student.studentId}`);
        }
      } else {
        logger.warn(
          `⚠️ No student found for studentId: ${tokenData.studentId}`
        );
      }

      const result = {
        studentId: tokenData.studentId,
        studentName: studentName,
        studentCode: studentCode,
        type: tokenData.type,
        status: tokenData.status,
        logId: tokenData.logId,
        expiresAt: tokenData.expiresAt,
        createdAt: tokenData.createdAt,
        updatedAt: tokenData.updatedAt,
        email: email,
        tokenId: tokenData.tokenId,
        supervisorId: tokenData.supervisorId,
      };

      logger.info(`✅ Final token response built:`, {
        studentId: result.studentId,
        studentName: result.studentName,
        studentCode: result.studentCode,
        type: result.type,
        status: result.status,
        hasEmail: !!result.email,
      });

      return result;
    } catch (error) {
      logger.error("Error building token response from database:", error);
      throw error;
    }
  }
}

// ✅ สร้าง instance และ export
const emailApprovalService = new EmailApprovalService();

module.exports = {
  EmailApprovalService,
  emailApprovalService,
};

// ❌ ลบส่วน exports.getApprovalDetails ออกทั้งหมด - ควรอยู่ใน Controller เท่านั้น
