"use strict";

const emailApprovalService = require("../../services/emailApprovalService");
const logger = require("../../utils/logger");
const {
  ApprovalToken,
  Student,
  User,
  Internship,
  InternshipDocument,
  InternshipLogbook,
  Document,
} = require("../../models");
const { Op } = require("sequelize");

/**
 * สร้างและส่งคำขออนุมัติผ่านอีเมลไปยังหัวหน้างาน
 * type: 'single' | 'weekly' | 'monthly' | 'full' | 'selected'
 */
exports.sendApprovalRequest = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { type, startDate, endDate, logIds } = req.body;

    const approvalData = {
      type,
      startDate,
      endDate,
      logIds,
    };

    const result = await emailApprovalService.sendApprovalRequest(
      studentId,
      approvalData
    );

    return res.status(200).json({
      success: true,
      message: "ส่งคำขออนุมัติผ่านอีเมลไปยังหัวหน้างานเรียบร้อยแล้ว",
      data: result,
    });
  } catch (error) {
    logger.error("Send Email Approval Request Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการส่งคำขออนุมัติผ่านอีเมล",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ฟังก์ชันสำหรับรับการอนุมัติจากลิงก์ในอีเมล
 */
exports.approveTimeSheetViaEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const { comment } = req.body || {};

    const result = await emailApprovalService.approveTimesheetEntries(
      token,
      comment
    );

    // ส่งหน้าแจ้งผลการอนุมัติกลับไป
    return res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>อนุมัติบันทึกการฝึกงานเรียบร้อย</title>
        <style>
          body {
            font-family: 'Sarabun', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f0f2f5;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
          }
          h1 {
            color: #52c41a;
            margin-bottom: 20px;
          }
          p {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 15px;
          }
          .logo {
            max-width: 150px;
            margin-bottom: 20px;
          }
          .icon {
            font-size: 60px;
            color: #52c41a;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="https://www.sci.kmutnb.ac.th/wp-content/uploads/2020/08/cropped-sci-logo-1.png" alt="KMUTNB Logo" class="logo">
          <div class="icon">✅</div>
          <h1>อนุมัติบันทึกการฝึกงานเรียบร้อย</h1>
          <p>คุณได้ทำการอนุมัติบันทึกการฝึกงานของ ${result.studentName} เรียบร้อยแล้ว</p>
          <p>ระบบได้ส่งอีเมลแจ้งผลการอนุมัติให้กับนักศึกษาเรียบร้อยแล้ว</p>
          <p style="margin-top: 30px; color: #666;">CS Logbook System</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    logger.error("Approve TimeSheet Via Email Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการอนุมัติบันทึกการฝึกงาน",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ฟังก์ชันสำหรับรับการปฏิเสธจากลิงก์ในอีเมล
 */
exports.rejectTimeSheetViaEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const { comment } = req.body || {};

    // ตรวจสอบว่าต้องระบุเหตุผลในการปฏิเสธ
    if (req.method === "GET" || !comment) {
      // ดึงข้อมูล token เพื่อแสดงชื่อนักศึกษาในหน้าฟอร์ม
      let studentNameForForm = "นักศึกษา";

      try {
        const tokenInfo = await emailApprovalService.getTokenInfo(token);
        if (tokenInfo && tokenInfo.studentName) {
          studentNameForForm = tokenInfo.studentName;
        }
      } catch (error) {
        logger.warn("Could not fetch student name for form:", error.message);
      }

      return res.send(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ปฏิเสธบันทึกการฝึกงาน</title>
          <style>
            body { font-family: 'Sarabun', sans-serif; margin: 0; padding: 20px; background-color: #f0f2f5; color: #333; }
            .container { max-width: 600px; margin: 40px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #ff4d4f; margin-bottom: 10px; text-align: center; }
            p { font-size: 16px; line-height: 1.6; margin-bottom: 15px; }
            .logo { display: block; max-width: 150px; margin: 0 auto 20px; }
            form { margin-top: 20px; }
            textarea { width: 100%; box-sizing: border-box; padding: 10px; border: 1px solid #d9d9d9; border-radius: 4px; resize: vertical; min-height: 100px; font-family: inherit; margin-bottom: 20px; }
            button { background-color: #ff4d4f; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; font-family: inherit; }
            button:hover { background-color: #ff7875; }
            .text-center { text-align: center; }
            .student-info { text-align: center; margin-bottom:20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="https://www.sci.kmutnb.ac.th/wp-content/uploads/2020/08/cropped-sci-logo-1.png" alt="KMUTNB Logo" class="logo">
            <h1>ปฏิเสธบันทึกการฝึกงาน</h1>
            <p class="student-info">สำหรับ: ${studentNameForForm}</p>
            <p>โปรดระบุเหตุผลในการปฏิเสธบันทึกการฝึกงาน เพื่อให้นักศึกษาทราบและนำไปปรับปรุง:</p>
            <form method="POST" action="/api/email-approval/reject/${token}">
              <textarea name="comment" placeholder="ระบุเหตุผลในการปฏิเสธ..." required></textarea>
              <div class="text-center">
                <button type="submit">ยืนยันการปฏิเสธ</button>
              </div>
            </form>
            <p style="margin-top: 30px; text-align: center; color: #666;">CS Logbook System</p>
          </div>
        </body>
        </html>
      `);
    }

    // ดำเนินการปฏิเสธผ่าน service
    const result = await emailApprovalService.rejectTimesheetEntries(
      token,
      comment
    );

    // ส่งหน้าแจ้งผลการปฏิเสธกลับไป
    return res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ปฏิเสธบันทึกการฝึกงานเรียบร้อย</title>
        <style>
          body { font-family: 'Sarabun', sans-serif; margin: 0; padding: 20px; background-color: #f0f2f5; color: #333; }
          .container { max-width: 600px; margin: 40px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
          h1 { color: #ff4d4f; margin-bottom: 20px; }
          p { font-size: 16px; line-height: 1.6; margin-bottom: 15px; }
          .logo { max-width: 150px; margin-bottom: 20px; }
          .icon { font-size: 60px; color: #ff4d4f; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="https://www.sci.kmutnb.ac.th/wp-content/uploads/2020/08/cropped-sci-logo-1.png" alt="KMUTNB Logo" class="logo">
          <div class="icon">❌</div>
          <h1>ปฏิเสธบันทึกการฝึกงานเรียบร้อย</h1>
          <p>คุณได้ทำการปฏิเสธบันทึกการฝึกงานของ ${result.studentName} เรียบร้อยแล้ว</p>
          <p>เหตุผล: ${comment}</p>
          <p>ระบบได้ส่งอีเมลแจ้งผลการปฏิเสธ (พร้อมเหตุผล) ให้กับนักศึกษาเรียบร้อยแล้ว</p>
          <p style="margin-top: 30px; color: #666;">CS Logbook System</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    logger.error("Reject TimeSheet Via Email Error:", error);
    // ส่งหน้า error HTML กลับไปแทน JSON เพื่อประสบการณ์ผู้ใช้ที่ดีขึ้นเมื่อคลิกจากอีเมล
    return res.status(500).send(`
      <!DOCTYPE html><html><head><title>เกิดข้อผิดพลาด</title></head>
      <body>
        <h1>เกิดข้อผิดพลาดในการดำเนินการ</h1>
        <p>ขออภัย เกิดข้อผิดพลาดในการปฏิเสธบันทึกการฝึกงาน กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ</p>
        ${
          process.env.NODE_ENV === "development"
            ? "<pre>" + error.stack + "</pre>"
            : ""
        }
      </body></html>
    `);
  }
};

/**
 * ดึงข้อมูลประวัติการส่งคำขออนุมัติของนักศึกษา
 */
exports.getApprovalHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    const approvalHistory = await emailApprovalService.getApprovalHistory(
      studentId
    );

    return res.status(200).json({
      success: true,
      message: "ดึงข้อมูลประวัติการส่งคำขออนุมัติสำเร็จ",
      data: approvalHistory,
    });
  } catch (error) {
    logger.error("Get Approval History Error:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการส่งคำขออนุมัติ",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลรายละเอียดการอนุมัติ
 */
exports.getApprovalDetails = async (req, res) => {
  try {
    const { token } = req.params;

    const approvalToken = await ApprovalToken.findOne({
      where: {
        token,
        status: "pending",
        expiresAt: { [Op.gt]: new Date() },
      },
      include: [
        {
          model: Student,
          as: "student",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["firstName", "lastName", "email"],
            },
          ],
        },
      ],
    });

    if (!approvalToken) {
      return res.status(404).json({
        success: false,
        message: "Token ไม่ถูกต้อง หมดอายุ หรือถูกใช้งานไปแล้ว",
      });
    }

    // ดึงข้อมูลบันทึกการฝึกงาน
    const logIds = approvalToken.logId
      .split(",")
      .map((id) => parseInt(id.trim(), 10));
    const timesheetEntries = await InternshipLogbook.findAll({
      where: {
        logId: { [Op.in]: logIds },
      },
      order: [["workDate", "ASC"]],
    });

    // ดึงข้อมูลการฝึกงานและบริษัท
    const student = await Student.findByPk(approvalToken.studentId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "email"],
        },
        {
          model: Document, // สมมติว่า InternshipDocument เชื่อมผ่าน Document
          as: "documents", // หรือชื่อ association ที่ถูกต้อง
          where: { documentType: "internship" },
          required: false, // อาจจะไม่จำเป็นต้องมีเอกสารเสมอไป
          include: [
            {
              model: InternshipDocument,
              as: "internshipDocument", // หรือชื่อ association ที่ถูกต้อง
              attributes: ["companyName", "supervisorEmail", "supervisorName"],
            },
          ],
        },
      ],
    });

    const internshipDoc = student?.documents?.[0]?.internshipDocument;

    return res.json({
      success: true,
      data: {
        token: approvalToken.token,
        type: approvalToken.type,
        status: approvalToken.status,
        studentId: approvalToken.studentId,
        studentName: `${student.user.firstName} ${student.user.lastName}` || "N/A",
        studentCode: student?.studentCode || "N/A",
        companyName: internshipDoc?.companyName || "N/A",
        supervisorName: internshipDoc?.supervisorName || "N/A",
        supervisorEmail: internshipDoc?.supervisorEmail || "N/A",
        timesheetEntries: timesheetEntries,
        expiresAt: approvalToken.expiresAt,
      },
    });
  } catch (error) {
    logger.error("Get Approval Details Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลการอนุมัติ",
    });
  }
};
