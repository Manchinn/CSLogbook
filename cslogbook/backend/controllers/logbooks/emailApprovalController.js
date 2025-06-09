"use strict";

// ✅ แก้ไข import ให้ใช้ instance ที่ถูกต้อง
const { emailApprovalService } = require("../../services/emailApprovalService");
const logger = require("../../utils/logger");
const {
  ApprovalToken,
  Student,
  User,
  InternshipDocument,
  InternshipLogbook,
  Document,
  sequelize
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
 * ฟังก์ชันสำหรับหน้าเว็บอนุมัติ (ใช้กับ TimesheetApproval component)
 * ส่ง JSON response แทน HTML
 */
exports.approveTimesheetViaWeb = async (req, res) => {
  try {
    const { token } = req.params;
    const { comment } = req.body || {};

    logger.info(`Web approval request for token: ${token.substring(0, 16)}...`);

    const result = await emailApprovalService.approveTimesheetEntries(token, comment);

    // ส่ง JSON response สำหรับ web component
    return res.json({
      success: true,
      message: 'อนุมัติบันทึกการฝึกงานเรียบร้อยแล้ว',
      data: {
        token,
        status: 'approved',
        processedAt: new Date(),
        comment: comment || null
      }
    });

  } catch (error) {
    logger.error("Approve TimeSheet Via Web Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการอนุมัติบันทึกการฝึกงาน",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ฟังก์ชันสำหรับหน้าเว็บปฏิเสธ (ใช้กับ TimesheetApproval component)
 * ส่ง JSON response แทน HTML
 */
exports.rejectTimesheetViaWeb = async (req, res) => {
  try {
    const { token } = req.params;
    const { comment } = req.body || {};

    logger.info(`Web rejection request for token: ${token.substring(0, 16)}...`);

    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุเหตุผลในการปฏิเสธ'
      });
    }

    const result = await emailApprovalService.rejectTimesheetEntries(token, comment);

    // ส่ง JSON response สำหรับ web component
    return res.json({
      success: true,
      message: 'ปฏิเสธบันทึกการฝึกงานเรียบร้อยแล้ว',
      data: {
        token,
        status: 'rejected',
        processedAt: new Date(),
        comment: comment
      }
    });

  } catch (error) {
    logger.error("Reject TimeSheet Via Web Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "เกิดข้อผิดพลาดในการปฏิเสธบันทึกการฝึกงาน",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * ฟังก์ชันสำหรับดึงข้อมูลรายละเอียดการอนุมัติ
 * ใช้ Sequelize Models เท่านั้น (ไม่มี Raw SQL fallback)
 */
exports.getApprovalDetails = async (req, res) => {
  try {
    const { token } = req.params;

    // ✅ ตรวจสอบ parameter
    if (!token || token.trim() === '') {
      logger.warn(`Empty or invalid token parameter received`);
      return res.status(400).json({
        success: false,
        message: 'Token parameter is required and cannot be empty'
      });
    }

    logger.info(`Getting approval details for token: ${token.substring(0, 16)}...`);

    // ✅ ดึงข้อมูลจาก service
    const tokenInfo = await emailApprovalService.getTokenInfo(token);
    
    if (!tokenInfo) {
      logger.warn(`No valid token found for: ${token.substring(0, 16)}...`);
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการอนุมัติสำหรับ token นี้ หรือ token หมดอายุแล้ว'
      });
    }

    logger.info(`✅ Token info from service:`, {
      studentId: tokenInfo.studentId,
      studentName: tokenInfo.studentName,
      studentCode: tokenInfo.studentCode,
      type: tokenInfo.type
    });

    // ✅ ดึงข้อมูล ApprovalToken พร้อม associations
    const approvalTokenResult = await ApprovalToken.findOne({
      where: { token },
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['userId', 'firstName', 'lastName', 'email']
            }
          ]
        },
        {
          model: Document,
          as: 'document',
          include: [
            {
              model: InternshipDocument,
              as: 'internshipDocument',
              attributes: ['companyName', 'supervisorName', 'supervisorEmail']
            }
          ]
        }
      ]
    });

    if (!approvalTokenResult) {
      logger.error(`ApprovalToken not found for token: ${token.substring(0, 16)}`);
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล token ในระบบ'
      });
    }

    logger.info(`✅ ApprovalToken data retrieved:`, {
      tokenId: approvalTokenResult.tokenId,
      studentId: approvalTokenResult.studentId,
      logId: approvalTokenResult.logId,
      type: approvalTokenResult.type,
      status: approvalTokenResult.status,
      hasStudent: !!approvalTokenResult.student,
      hasDocument: !!approvalTokenResult.document
    });

    // ✅ ดึงข้อมูล timesheet entries
    let timesheetEntries = [];
    
    if (approvalTokenResult.logId) {
      // ✅ แปลง log_id เป็น array
      let logIds = [];
      if (typeof approvalTokenResult.logId === 'string') {
        if (approvalTokenResult.logId.includes(',')) {
          logIds = approvalTokenResult.logId.split(',')
            .map(id => parseInt(id.trim(), 10))
            .filter(id => !isNaN(id));
        } else {
          const singleId = parseInt(approvalTokenResult.logId.trim(), 10);
          if (!isNaN(singleId)) {
            logIds = [singleId];
          }
        }
      } else if (typeof approvalTokenResult.logId === 'number') {
        logIds = [approvalTokenResult.logId];
      }

      logger.info(`🔍 Processing log_ids:`, {
        originalLogId: approvalTokenResult.logId,
        parsedLogIds: logIds,
        logIdsCount: logIds.length
      });

      if (logIds.length > 0) {
        // ✅ ดึงข้อมูล InternshipLogbook entries ด้วย Sequelize
        const rawTimesheetEntries = await InternshipLogbook.findAll({
          where: {
            logId: {
              [Op.in]: logIds
            }
          },
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['studentId', 'studentCode'],
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['firstName', 'lastName']
                }
              ]
            },
            {
              model: InternshipDocument,
              as: 'internship',
              attributes: ['companyName', 'supervisorName']
            }
          ],
          order: [['workDate', 'ASC']]
        });

        logger.info(`✅ Timesheet entries retrieved:`, {
          resultsCount: rawTimesheetEntries ? rawTimesheetEntries.length : 0,
          firstLogId: rawTimesheetEntries?.[0]?.logId || null
        });

        // ✅ แปลงข้อมูลให้ตรงกับที่ Frontend คาดหวัง
        if (rawTimesheetEntries && rawTimesheetEntries.length > 0) {
          timesheetEntries = rawTimesheetEntries.map(entry => ({
            logId: entry.logId,
            workDate: entry.workDate,
            timeIn: entry.timeIn,
            timeOut: entry.timeOut,
            workHours: entry.workHours,
            logTitle: entry.logTitle,
            workDescription: entry.workDescription,
            supervisorApproved: entry.supervisorApproved,
            advisorApproved: entry.advisorApproved,
            studentName: entry.student?.user 
              ? `${entry.student.user.firstName} ${entry.student.user.lastName}` 
              : tokenInfo.studentName,
            companyName: entry.internship?.companyName || null
          }));

          logger.info(`✅ Processed timesheet entries:`, {
            count: timesheetEntries.length,
            sampleEntry: {
              logId: timesheetEntries[0].logId,
              workDate: timesheetEntries[0].workDate,
              logTitle: timesheetEntries[0].logTitle
            }
          });
        } else {
          logger.warn(`❌ No timesheet entries found for log_ids:`, logIds);
          
          // ✅ Debug: ตรวจสอบว่ามีข้อมูลของนักศึกษาหรือไม่
          const studentLogbookCount = await InternshipLogbook.count({
            where: { studentId: tokenInfo.studentId }
          });
          
          logger.info(`📊 Debug - Total logbook entries for student ${tokenInfo.studentId}: ${studentLogbookCount}`);
          
          if (studentLogbookCount > 0) {
            // ✅ แสดง recent entries เพื่อ debug
            const recentEntries = await InternshipLogbook.findAll({
              where: { studentId: tokenInfo.studentId },
              attributes: ['logId', 'workDate', 'logTitle'],
              order: [['logId', 'DESC']],
              limit: 5
            });
            
            logger.info(`📊 Debug - Recent entries:`, recentEntries.map(e => ({
              logId: e.logId,
              workDate: e.workDate,
              logTitle: e.logTitle
            })));
          }
        }
      } else {
        logger.warn(`❌ No valid log_ids to process from:`, approvalTokenResult.logId);
      }
    } else {
      logger.warn(`❌ No log_id found in approval token:`, {
        tokenId: approvalTokenResult.tokenId,
        logId: approvalTokenResult.logId
      });
    }

    // ✅ ดึงข้อมูล company name จาก associations หรือ direct query
    let companyName = 'ไม่ระบุ';

    // ลองดึงจาก ApprovalToken associations ก่อน
    if (approvalTokenResult.document?.internshipDocument?.companyName) {
      companyName = approvalTokenResult.document.internshipDocument.companyName;
      logger.info(`✅ Company name from ApprovalToken association: ${companyName}`);
    } else {
      // ✅ แก้ไข query สำหรับ company name
      try {
        logger.info(`Attempting to fetch company data for studentId: ${tokenInfo.studentId}`);

        // ✅ วิธีที่ 1: Query ผ่าน Document Model โดยตรง
        const companyDocument = await Document.findOne({
          where: { 
            userId: tokenInfo.studentId,     // ✅ ใช้ studentId ใน User relation
            documentType: 'internship' 
          },
          include: [
            {
              model: InternshipDocument,
              as: 'internshipDocument',
              attributes: ['companyName', 'supervisorName', 'supervisorEmail']
            }
          ],
          order: [['created_at', 'DESC']],
          limit: 1
        });

        if (companyDocument?.internshipDocument?.companyName) {
          companyName = companyDocument.internshipDocument.companyName;
          logger.info(`✅ Company name from Document query: ${companyName}`);
        } else {
          // ✅ วิธีที่ 2: Query ผ่าน Student -> User relation
          const studentUser = await Student.findOne({
            where: { studentId: tokenInfo.studentId },
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['userId']
              }
            ]
          });

          if (studentUser?.user?.userId) {
            const userDocument = await Document.findOne({
              where: { 
                userId: studentUser.user.userId,  // ✅ ใช้ userId ที่ถูกต้อง
                documentType: 'internship' 
              },
              include: [
                {
                  model: InternshipDocument,
                  as: 'internshipDocument',
                  attributes: ['companyName', 'supervisorName', 'supervisorEmail']
                }
              ],
              order: [['created_at', 'DESC']],
              limit: 1
            });

            if (userDocument?.internshipDocument?.companyName) {
              companyName = userDocument.internshipDocument.companyName;
              logger.info(`✅ Company name from User Document query: ${companyName}`);
            } else {
              logger.warn(`❌ No company document found for userId: ${studentUser.user.userId}`);
            }
          } else {
            logger.warn(`❌ No user found for studentId: ${tokenInfo.studentId}`);
          }
        }

      } catch (companyError) {
        logger.error(`Error fetching company data:`, companyError);
        companyName = 'ไม่ระบุ';
      }
    }

    // ✅ สร้างข้อมูลที่จะส่งกลับ
    const result = {
      token: approvalTokenResult.token,
      status: approvalTokenResult.status,
      type: tokenInfo.type || approvalTokenResult.type,
      studentId: tokenInfo.studentId,
      studentName: tokenInfo.studentName,
      studentCode: tokenInfo.studentCode,
      companyName: companyName,
      timesheetEntries: timesheetEntries,
      createdAt: approvalTokenResult.created_at,
      updatedAt: approvalTokenResult.updatedAt,
      expiresAt: tokenInfo.expiresAt
    };

    logger.info(`✅ Final approval details summary:`, {
      studentName: result.studentName,
      studentCode: result.studentCode,
      companyName: result.companyName,
      timesheetCount: result.timesheetEntries.length,
      status: result.status,
      type: result.type,
      logIdFromToken: approvalTokenResult.logId
    });

    return res.json({
      success: true,
      message: 'ดึงข้อมูลการอนุมัติสำเร็จ',
      data: result
    });

  } catch (error) {
    logger.error("Get Approval Details Error:", error);
    
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลการอนุมัติ",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
