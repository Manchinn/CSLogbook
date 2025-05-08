'use strict';

const crypto = require('crypto');
const { 
  InternshipLogbook, 
  ApprovalToken, 
  Student, 
  User, 
  InternshipDocument, 
  sequelize 
} = require('../../models');
const { sendTimeSheetApprovalRequest, sendTimeSheetApprovalResultNotification } = require('../../utils/mailer');
const dayjs = require('dayjs');
const { Op } = require('sequelize');

// สร้าง token สำหรับการอนุมัติ
const generateApprovalToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * สร้างและส่งคำขออนุมัติผ่านอีเมลไปยังหัวหน้างาน
 * type: 'single' | 'weekly' | 'monthly' | 'full' | 'selected'
 */
exports.sendApprovalRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { studentId } = req.params;
    const { type, startDate, endDate, logIds } = req.body;
    
    // ตรวจสอบว่าเป็นนักศึกษาที่มีสิทธิ์หรือไม่
    const student = await Student.findOne({
      where: { 
        studentId,
        //userId: req.user.userId // ตรวจสอบว่าเป็น request จากเจ้าของบัญชีจริงๆ
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['email', 'firstName', 'lastName']
      }]
    });

    if (!student) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    // ดึงข้อมูลหัวหน้างานจากการฝึกงานของนักศึกษา
    const internshipDoc = await InternshipDocument.findOne({
      include: [{
        model: Document,
        as: 'document',
        where: {
          userId: student.userId // หรือ studentId ตามที่กำหนดใน Document model
        }
      }]
    });

    if (!internshipDoc) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการฝึกงานสำหรับนักศึกษานี้'
      });
    }

    const supervisor = await User.findByPk(internshipDoc.supervisorId);

    if (!supervisor) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลหัวหน้างานสำหรับนักศึกษานี้'
      });
    }    
    // ดึงข้อมูลบันทึกการฝึกงานตามเงื่อนไข
    let timeSheetEntries;
    
    if (type === 'selected' && logIds && logIds.length > 0) {
      // กรณีระบุ ID เฉพาะ
      timeSheetEntries = await InternshipLogbook.findAll({
        where: {
          logId: logIds,
          studentId: student.studentId,
          supervisorApproved: false // เฉพาะที่ยังไม่ได้อนุมัติ
        },
        order: [['workDate', 'ASC']]
      });
    } else if (type === 'weekly' || type === 'monthly') {
      // กรณีขออนุมัติรายสัปดาห์หรือรายเดือน
      let queryStartDate = startDate ? dayjs(startDate).toDate() : dayjs().subtract(type === 'weekly' ? 7 : 30, 'day').toDate();
      let queryEndDate = endDate ? dayjs(endDate).toDate() : dayjs().toDate();
      
      timeSheetEntries = await InternshipLogbook.findAll({
        where: {
          studentId: student.studentId,
          workDate: {
            [Op.between]: [queryStartDate, queryEndDate]
          },
          supervisorApproved: false
        },
        order: [['workDate', 'ASC']]
      });
    } else if (type === 'full') {
      // กรณีขออนุมัติทั้งหมด
      timeSheetEntries = await InternshipLogbook.findAll({
        where: {
          studentId: student.studentId,
          supervisorApproved: false
        },
        order: [['workDate', 'ASC']]
      });
    } else {
      // กรณีขออนุมัติวันล่าสุด (default: single)
      timeSheetEntries = await InternshipLogbook.findAll({
        where: {
          studentId: student.studentId,
          supervisorApproved: false
        },
        order: [['workDate', 'DESC']],
        limit: 1
      });
    }

    if (!timeSheetEntries || timeSheetEntries.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'ไม่พบบันทึกการฝึกงานที่รอการอนุมัติ'
      });
    }

    // สร้าง token สำหรับการอนุมัติ
    const approveToken = generateApprovalToken();
    const rejectToken = generateApprovalToken();
    
    // กำหนดวันหมดอายุเป็น 7 วัน
    const expiresAt = dayjs().add(7, 'day').toDate();
    
    // เก็บ logIds เป็น string คั่นด้วย comma
    const logIdsString = timeSheetEntries.map(entry => entry.logId).join(',');
    
    // เก็บ token ลงในฐานข้อมูล
    const approvalToken = await ApprovalToken.create({
      token: approveToken,
      logId: logIdsString,
      supervisorId: supervisor.userId,
      studentId: student.studentId,
      type: type || 'single',
      status: 'pending',
      expiresAt
    }, { transaction });
    
    const rejectionToken = await ApprovalToken.create({
      token: rejectToken,
      logId: logIdsString,
      supervisorId: supervisor.userId,
      studentId: student.studentId,
      type: type || 'single',
      status: 'pending',
      expiresAt
    }, { transaction });

    // สร้าง URL สำหรับปุ่มอนุมัติและปฏิเสธ
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const approveUrl = `${baseUrl}/api/email-approval/approve/${approveToken}`;
    const rejectUrl = `${baseUrl}/api/email-approval/reject/${rejectToken}`;

    // สร้างชื่อนักศึกษาและหัวหน้างานแบบเต็ม
    const studentFullName = `${student.user.firstName} ${student.user.lastName}`;
    const supervisorFullName = `${supervisor.firstName} ${supervisor.lastName}`;
    
    // ส่งอีเมลไปยังหัวหน้างาน
    await sendTimeSheetApprovalRequest(
      supervisor.email,
      supervisorFullName,
      studentFullName,
      approveUrl,
      rejectUrl,
      timeSheetEntries,
      type
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'ส่งคำขออนุมัติผ่านอีเมลไปยังหัวหน้างานเรียบร้อยแล้ว',
      data: {
        tokenId: approvalToken.tokenId,
        expiresAt
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Send Email Approval Request Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการส่งคำขออนุมัติผ่านอีเมล',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ฟังก์ชันสำหรับรับการอนุมัติจากลิงก์ในอีเมล
 */
exports.approveTimeSheetViaEmail = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { token } = req.params;
    const { comment } = req.body || {};

    // ดึงข้อมูล token จากฐานข้อมูล
    const approvalToken = await ApprovalToken.findOne({
      where: {
        token,
        status: 'pending',
        expiresAt: {
          [Op.gt]: new Date() // ตรวจสอบว่า token ยังไม่หมดอายุ
        }
      }
    });

    if (!approvalToken) {
      return res.status(400).json({
        success: false,
        message: 'Token ไม่ถูกต้องหรือหมดอายุแล้ว'
      });
    }

    // ดึงข้อมูลนักศึกษา
    const student = await Student.findByPk(approvalToken.studentId, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['email', 'firstName', 'lastName']
      }]
    });

    if (!student) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    // ดึง logIds จาก string คั่นด้วย comma
    const logIds = approvalToken.logId.split(',').map(id => parseInt(id.trim(), 10));

    // อัพเดทสถานะการอนุมัติในตาราง InternshipLogbook
    await InternshipLogbook.update({
      supervisorApproved: true,
      supervisorComment: comment || null,
      supervisorApprovedAt: new Date()
    }, {
      where: {
        logId: {
          [Op.in]: logIds
        }
      },
      transaction
    });

    // อัพเดทสถานะ token เป็น approved
    await approvalToken.update({
      status: 'approved',
      comment: comment || null
    }, { transaction });

    // เลือกบันทึกแรกเพื่อแจ้งเตือนผ่านอีเมล (กรณีมีหลายรายการ)
    const firstEntry = await InternshipLogbook.findOne({
      where: {
        logId: logIds[0]
      }
    });

    // ส่งอีเมลแจ้งเตือนนักศึกษา
    await sendTimeSheetApprovalResultNotification(
      student.User.email,
      `${student.User.firstName} ${student.User.lastName}`,
      'approved',
      comment,
      firstEntry
    );

    await transaction.commit();

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
          <p>คุณได้ทำการอนุมัติบันทึกการฝึกงานของ ${student.User.firstName} ${student.User.lastName} เรียบร้อยแล้ว</p>
          <p>ระบบได้ส่งอีเมลแจ้งผลการอนุมัติให้กับนักศึกษาเรียบร้อยแล้ว</p>
          <p style="margin-top: 30px; color: #666;">CS Logbook System</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    await transaction.rollback();
    console.error('Approve TimeSheet Via Email Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอนุมัติบันทึกการฝึกงาน',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ฟังก์ชันสำหรับรับการปฏิเสธจากลิงก์ในอีเมล
 */
exports.rejectTimeSheetViaEmail = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { token } = req.params;
    const { comment } = req.body || {};

    // ตรวจสอบว่าต้องระบุเหตุผลในการปฏิเสธ
    if (!comment) {
      return res.send(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>กรุณาระบุเหตุผลในการปฏิเสธ</title>
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
            }
            h1 {
              color: #ff4d4f;
              margin-bottom: 20px;
              text-align: center;
            }
            p {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 20px;
            }
            .logo {
              display: block;
              max-width: 150px;
              margin: 0 auto 20px;
            }
            form {
              margin-top: 20px;
            }
            textarea {
              width: 100%;
              padding: 10px;
              border: 1px solid #d9d9d9;
              border-radius: 4px;
              resize: vertical;
              min-height: 100px;
              font-family: inherit;
              margin-bottom: 20px;
            }
            button {
              background-color: #ff4d4f;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
              font-family: inherit;
            }
            button:hover {
              background-color: #ff7875;
            }
            .text-center {
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="https://www.sci.kmutnb.ac.th/wp-content/uploads/2020/08/cropped-sci-logo-1.png" alt="KMUTNB Logo" class="logo">
            <h1>กรุณาระบุเหตุผลในการปฏิเสธ</h1>
            <p>เพื่อให้นักศึกษาได้นำไปปรับปรุงบันทึกการฝึกงาน โปรดระบุเหตุผลในการปฏิเสธด้วย:</p>
            
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

    // ดึงข้อมูล token จากฐานข้อมูล
    const rejectionToken = await ApprovalToken.findOne({
      where: {
        token,
        status: 'pending',
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!rejectionToken) {
      return res.status(400).json({
        success: false,
        message: 'Token ไม่ถูกต้องหรือหมดอายุแล้ว'
      });
    }

    // ดึงข้อมูลนักศึกษา
    const student = await Student.findByPk(rejectionToken.studentId, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['email', 'firstName', 'lastName']
      }]
    });

    if (!student) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }

    // ดึง logIds จาก string
    const logIds = rejectionToken.logId.split(',').map(id => parseInt(id.trim(), 10));
    
    // อัพเดทสถานะ token เป็น rejected
    await rejectionToken.update({
      status: 'rejected',
      comment
    }, { transaction });

    // อัพเดต InternshipLogbook เพื่อเพิ่มเหตุผลในการปฏิเสธ
    await InternshipLogbook.update({
      supervisorComment: comment,
      needsRevision: true
    }, {
      where: {
        logId: {
          [Op.in]: logIds
        }
      },
      transaction
    });

    // เลือกบันทึกแรกเพื่อแจ้งเตือนผ่านอีเมล (กรณีมีหลายรายการ)
    const firstEntry = await InternshipLogbook.findOne({
      where: {
        logId: logIds[0]
      }
    });

    // ส่งอีเมลแจ้งเตือนนักศึกษา
    await sendTimeSheetApprovalResultNotification(
      student.User.email,
      `${student.User.firstName} ${student.User.lastName}`,
      'rejected',
      comment,
      firstEntry
    );

    await transaction.commit();

    // ส่งหน้าแจ้งผลการปฏิเสธกลับไป
    return res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ปฏิเสธบันทึกการฝึกงานเรียบร้อย</title>
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
            color: #ff4d4f;
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
            color: #ff4d4f;
            margin-bottom: 20px;
          }
          .reason {
            background-color: #fff1f0;
            border: 1px solid #ffccc7;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="https://www.sci.kmutnb.ac.th/wp-content/uploads/2020/08/cropped-sci-logo-1.png" alt="KMUTNB Logo" class="logo">
          <div class="icon">❌</div>
          <h1>ปฏิเสธบันทึกการฝึกงานเรียบร้อย</h1>
          <p>คุณได้ทำการปฏิเสธบันทึกการฝึกงานของ ${student.User.firstName} ${student.User.lastName} เรียบร้อยแล้ว</p>
          
          <div class="reason">
            <h3>เหตุผลในการปฏิเสธ:</h3>
            <p>${comment}</p>
          </div>
          
          <p>ระบบได้ส่งอีเมลแจ้งผลการปฏิเสธให้กับนักศึกษาเรียบร้อยแล้ว</p>
          <p style="margin-top: 30px; color: #666;">CS Logbook System</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    await transaction.rollback();
    console.error('Reject TimeSheet Via Email Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการปฏิเสธบันทึกการฝึกงาน',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * ดึงข้อมูลประวัติการส่งคำขออนุมัติของนักศึกษา
 */
exports.getApprovalHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // ตรวจสอบว่าเป็นนักศึกษาที่มีสิทธิ์หรือไม่
    const student = await Student.findOne({
      where: { 
        studentId,
        userId: req.user.userId // ตรวจสอบว่าเป็น request จากเจ้าของบัญชีจริงๆ
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลนักศึกษา'
      });
    }
    
    // ดึงประวัติการส่งคำขออนุมัติ
    const tokens = await ApprovalToken.findAll({
      where: { 
        studentId,
        // แสดงเฉพาะ token ที่ใช้สำหรับอนุมัติ ไม่รวม token สำหรับปฏิเสธ
        status: {
          [Op.in]: ['pending', 'approved', 'rejected']
        }
      },
      order: [
        ['createdAt', 'DESC']
      ],
      limit: 50
    });
    
    return res.status(200).json({
      success: true,
      message: 'ดึงข้อมูลประวัติการส่งคำขออนุมัติสำเร็จ',
      data: tokens
    });
    
  } catch (error) {
    console.error('Get Approval History Error:', error);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการส่งคำขออนุมัติ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};