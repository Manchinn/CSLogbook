const sgMail = require('@sendgrid/mail');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const notificationSettingsService = require('../services/notificationSettingsService');
const logger = require('./logger');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ฟังก์ชันสำหรับอ่าน HTML template และแทนที่ตัวแปร
function loadTemplate(templateName, variables = {}) {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templateName}.html`);
    }
    
    let htmlContent = fs.readFileSync(templatePath, 'utf8');
    
    // แทนที่ตัวแปรทั้งหมดใน template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, variables[key] || '');
    });
    
    return htmlContent;
  } catch (error) {
    console.error('Error loading template:', error);
    throw error;
  }
}

// ปรับปรุงฟังก์ชันเช็คสถานะการเปิด/ปิดการแจ้งเตือน - ไม่ใช้ .env เป็น fallback
const isNotificationEnabled = async (type) => {
    try {
        // ใช้เฉพาะค่าจากฐานข้อมูลเท่านั้น
        const isEnabled = await notificationSettingsService.isNotificationEnabled(type);
        
        logger.debug(`ตรวจสอบสถานะการแจ้งเตือน ${type} จาก database:`, { 
            type, 
            enabled: isEnabled 
        });
        
        return isEnabled;
    } catch (error) {
        logger.error(`Error checking notification status: ${type}`, { 
            error: error.message,
            stack: error.stack
        });
        
        // คืนค่า false เพื่อความปลอดภัย แทนการใช้ environment variable
        // หลักการคือ "ไม่ส่งดีกว่าส่งผิด"
        logger.warn(`คืนค่า false สำหรับ ${type} เนื่องจากเกิดข้อผิดพลาด - เพื่อความปลอดภัย`);
        return false;
    }
};

// ปรับปรุงฟังก์ชันส่งอีเมลให้มี error handling ที่ดีขึ้น
async function sendLoginNotification(email, username) {
    try {
        // ตรวจสอบการตั้งค่าการแจ้งเตือน
        const isEnabled = await isNotificationEnabled('LOGIN');
        
        if (!isEnabled) {
            logger.info(`การแจ้งเตือน LOGIN ถูกปิดใช้งาน - ไม่ส่งอีเมลให้ผู้ใช้: ${username}`, {
                email,
                username,
                notificationType: 'LOGIN'
            });
            return { sent: false, reason: 'notification_disabled' };
        }

        const htmlContent = loadTemplate('loginNotification', {
            username: username,
            email: email,
            loginDateTime: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
            currentYear: new Date().getFullYear()
        });

        const msg = {
            to: email,
            from: process.env.EMAIL_SENDER,
            subject: 'KMUTNB CS Logbook - การแจ้งเตือนการเข้าสู่ระบบ',
            html: htmlContent
        };

        const response = await sgMail.send(msg);
        logger.info('ส่งอีเมลการแจ้งเตือนการเข้าสู่ระบบสำเร็จ', { 
            email, 
            username,
            messageId: response[0]?.headers?.['x-message-id'] 
        });
        
        return { sent: true, response, messageId: response[0]?.headers?.['x-message-id'] };
    } catch (error) {
        logger.error('เกิดข้อผิดพลาดในการส่งอีเมลการแจ้งเตือนการเข้าสู่ระบบ', { 
            error: error.message,
            email, 
            username,
            stack: error.stack
        });
        throw error;
    }
}

// สำหรับการแจ้งเตือนเมื่อเอกสารได้รับการอนุมัติ
async function sendDocumentApprovalNotification(email, username, documentType, status) {
    try {
        const isEnabled = await isNotificationEnabled('DOCUMENT');
        
        if (!isEnabled) {
            logger.info('การแจ้งเตือน DOCUMENT ถูกปิดใช้งาน - ไม่ส่งอีเมลการอนุมัติเอกสาร', {
                email,
                username,
                documentType,
                status,
                notificationType: 'DOCUMENT'
            });
            return { sent: false, reason: 'notification_disabled' };
        }

        // กำหนด CSS class สำหรับสถานะ
        const statusClass = status === 'อนุมัติ' ? 'status-approved' : 'status-rejected';

        const htmlContent = loadTemplate('documentApproval', {
            username: username,
            documentType: documentType,
            status: status,
            statusClass: statusClass,
            currentYear: new Date().getFullYear()
        });

        const msg = {
            to: email,
            from: process.env.EMAIL_SENDER,
            subject: `CS Logbook - แจ้งผลการพิจารณา${documentType}`,
            html: htmlContent
        };
        
        const response = await sgMail.send(msg);
        logger.info('ส่งอีเมลการแจ้งเตือนการอนุมัติเอกสารสำเร็จ', {
            email,
            username,
            documentType,
            status,
            messageId: response[0]?.headers?.['x-message-id']
        });
        
        return { sent: true, response, messageId: response[0]?.headers?.['x-message-id'] };
    } catch (error) {
        logger.error('เกิดข้อผิดพลาดในการส่งอีเมลการแจ้งเตือนการอนุมัติเอกสาร', {
            error: error.message,
            email,
            username,
            documentType,
            status,
            stack: error.stack
        });
        throw error;
    }
}

// สำหรับการแจ้งเตือนเมื่อมีการส่ง Logbook
async function sendLogbookSubmissionNotification(email, username, title) {
    try {
        const isEnabled = await isNotificationEnabled('LOGBOOK');
        
        if (!isEnabled) {
            logger.info('การแจ้งเตือน LOGBOOK ถูกปิดใช้งาน - ไม่ส่งอีเมลการส่ง Logbook', {
                email,
                username,
                title,
                notificationType: 'LOGBOOK'
            });
            return { sent: false, reason: 'notification_disabled' };
        }

        const htmlContent = loadTemplate('logbookSubmission', {
            username: username,
            title: title,
            currentYear: new Date().getFullYear()
        });

        const msg = {
            to: email,
            from: process.env.EMAIL_SENDER,
            subject: 'CS Logbook - มีการส่ง Logbook ใหม่',
            html: htmlContent
        };
        
        const response = await sgMail.send(msg);
        logger.info('ส่งอีเมลการแจ้งเตือนการส่ง Logbook สำเร็จ', {
            email,
            username,
            title,
            messageId: response[0]?.headers?.['x-message-id']
        });
        
        return { sent: true, response, messageId: response[0]?.headers?.['x-message-id'] };
    } catch (error) {
        logger.error('เกิดข้อผิดพลาดในการส่งอีเมลการแจ้งเตือนการส่ง Logbook', {
            error: error.message,
            email,
            username,
            title,
            stack: error.stack
        });
        throw error;
    }
}

// สำหรับการส่งคำขออนุมัติบันทึกการฝึกงานไปยังหัวหน้างาน
async function sendTimeSheetApprovalRequest(email, supervisorName, studentName, approveLink, rejectLink, timeSheetData, type = 'single') {
    try {
        // ใช้ APPROVAL แทน DOCUMENT เพื่อความชัดเจนมากขึ้น
        const isEnabled = await isNotificationEnabled('APPROVAL');
        
        if (!isEnabled) {
            logger.info('การแจ้งเตือน APPROVAL ถูกปิดใช้งาน - ไม่ส่งอีเมลคำขออนุมัติ', {
                email,
                supervisorName,
                studentName,
                type,
                notificationType: 'APPROVAL'
            });
            return { sent: false, reason: 'notification_disabled' };
        }

        // กำหนดหัวข้ออีเมลตามประเภทการขออนุมัติ
        let subject;
        let introText;
        
        switch(type) {
            case 'weekly':
                subject = `CS Logbook - คำขออนุมัติบันทึกการฝึกงานประจำสัปดาห์ของ ${studentName}`;
                introText = `มีรายการบันทึกการฝึกงานประจำสัปดาห์ของนักศึกษา ${studentName} รอการอนุมัติจากท่าน`;
                break;
            case 'monthly':
                subject = `CS Logbook - คำขออนุมัติบันทึกการฝึกงานประจำเดือนของ ${studentName}`;
                introText = `มีรายการบันทึกการฝึกงานประจำเดือนของนักศึกษา ${studentName} รอการอนุมัติจากท่าน`;
                break;
            case 'full':
                subject = `CS Logbook - คำขออนุมัติบันทึกการฝึกงานทั้งหมดของ ${studentName}`;
                introText = `มีรายการบันทึกการฝึกงานทั้งหมดของนักศึกษา ${studentName} รอการอนุมัติจากท่าน`;
                break;
            default:
                subject = `CS Logbook - คำขออนุมัติบันทึกการฝึกงานของ ${studentName}`;
                introText = `มีรายการบันทึกการฝึกงานของนักศึกษา ${studentName} รอการอนุมัติจากท่าน`;
        }

        let timeSheetHtml = '';
        
        // สร้าง HTML สำหรับแสดงรายการบันทึกการฝึกงาน
        if (Array.isArray(timeSheetData)) {
            timeSheetData.forEach((entry, index) => {
                timeSheetHtml += `
                    <div class="timesheet-entry">
                        <h3>บันทึกวันที่: ${entry.workDate}</h3>
                        <p><strong>เวลาเข้างาน:</strong> ${entry.timeIn || '-'}</p>
                        <p><strong>เวลาออกงาน:</strong> ${entry.timeOut || '-'}</p>
                        <p><strong>จำนวนชั่วโมง:</strong> ${entry.workHours || '-'} ชั่วโมง</p>
                        <p><strong>หัวข้องาน:</strong> ${entry.logTitle || '-'}</p>
                        <p><strong>รายละเอียดงาน:</strong><br>${entry.workDescription || '-'}</p>
                        <p><strong>สิ่งที่ได้เรียนรู้:</strong><br>${entry.learningOutcome || '-'}</p>
                    </div>
                `;
            });
        } else if (timeSheetData) {
            // กรณีส่งข้อมูลเพียงรายการเดียว
            timeSheetHtml = `
                <div class="timesheet-entry">
                    <h3>บันทึกวันที่: ${timeSheetData.workDate}</h3>
                    <p><strong>เวลาเข้างาน:</strong> ${timeSheetData.timeIn || '-'}</p>
                    <p><strong>เวลาออกงาน:</strong> ${timeSheetData.timeOut || '-'}</p>
                    <p><strong>จำนวนชั่วโมง:</strong> ${timeSheetData.workHours || '-'} ชั่วโมง</p>
                    <p><strong>หัวข้องาน:</strong> ${timeSheetData.logTitle || '-'}</p>
                    <p><strong>รายละเอียดงาน:</strong><br>${timeSheetData.workDescription || '-'}</p>
                    <p><strong>สิ่งที่ได้เรียนรู้:</strong><br>${timeSheetData.learningOutcome || '-'}</p>
                </div>
            `;
        }

        const htmlContent = loadTemplate('timesheetApprovalRequest', {
            supervisorName: supervisorName,
            studentName: studentName,
            studentCode: timeSheetData?.studentCode || (Array.isArray(timeSheetData) && timeSheetData[0]?.studentCode) || 'ไม่ระบุ',
            companyName: timeSheetData?.companyName || (Array.isArray(timeSheetData) && timeSheetData[0]?.companyName) || 'ไม่ระบุ',
            introText: introText,
            timeSheetHtml: timeSheetHtml,
            approveLink: approveLink,
            rejectLink: rejectLink,
            currentYear: new Date().getFullYear()
        });

        const msg = {
            to: email,
            from: process.env.EMAIL_SENDER,
            subject: subject,
            html: htmlContent
        };

        const response = await sgMail.send(msg);
        logger.info('ส่งอีเมลคำขออนุมัติสำเร็จ', {
            email,
            supervisorName,
            studentName,
            type,
            messageId: response[0]?.headers?.['x-message-id']
        });
        
        return { sent: true, response, messageId: response[0]?.headers?.['x-message-id'] };
    } catch (error) {
        logger.error('เกิดข้อผิดพลาดในการส่งอีเมลคำขออนุมัติ', {
            error: error.message,
            email,
            supervisorName,
            studentName,
            type,
            stack: error.stack
        });
        throw error;
    }
}

// สำหรับการแจ้งเตือนเมื่อหัวหน้างานดำเนินการอนุมัติหรือปฏิเสธบันทึกการฝึกงาน
async function sendTimeSheetApprovalResultNotification(email, studentName, status, comment, entryData) {
  if (!isNotificationEnabled('DOCUMENT')) {
    console.log('Document approval result email notification is currently disabled');
    return Promise.resolve();
  }

  try {
    const statusText = status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ';
    const statusColor = status === 'approved' ? '#52c41a' : '#f5222d';
    
    // สร้าง HTML สำหรับ comment section
    const commentSection = comment ? `
      <div class="comment-box">
        <h4>ความคิดเห็นจากหัวหน้างาน:</h4>
        <p>${comment}</p>
      </div>
    ` : '';

    // ใช้ template แทนการเขียน HTML ตรงๆ
    const htmlContent = loadTemplate('timesheetApprovalResult', {
      studentName: studentName,
      statusText: statusText,
      statusColor: statusColor,
      workDate: entryData.workDate,
      commentSection: commentSection
    });
    
    const msg = {
      to: email,
      from: process.env.EMAIL_SENDER,
      subject: `CS Logbook - บันทึกการฝึกงานของคุณได้รับการ${statusText}แล้ว`,
      html: htmlContent
    };

    const response = await sgMail.send(msg);
    console.log('Approval result notification sent successfully');
    return response;
  } catch (error) {
    console.error('Error sending approval result notification:', error);
    throw error;
  }
}

// สำหรับการส่งคำขอประเมินผลการฝึกงานไปยังผู้ควบคุมงาน
async function sendInternshipEvaluationRequestEmail(supervisorEmail, supervisorName, studentFullName, studentCode, companyName, evaluationLink, expiresAt) {
    try {
        // ใช้ EVALUATION แทน DOCUMENT เพื่อความชัดเจน
        const isEnabled = await isNotificationEnabled('EVALUATION');
        
        if (!isEnabled) {
            logger.info('การแจ้งเตือน EVALUATION ถูกปิดใช้งาน - ไม่ส่งอีเมลคำขอประเมิน', {
                supervisorEmail,
                supervisorName,
                studentFullName,
                studentCode,
                companyName,
                notificationType: 'EVALUATION'
            });
            return { sent: false, reason: 'notification_disabled' };
        }

        const htmlContent = loadTemplate('evaluationRequest', {
            supervisorName: supervisorName,
            studentFullName: studentFullName,
            studentCode: studentCode,
            companyName: companyName,
            evaluationLink: evaluationLink,
            expiresAt: new Date(expiresAt).toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            currentYear: new Date().getFullYear()
        });

        const msg = {
            to: supervisorEmail,
            from: process.env.EMAIL_SENDER,
            subject: `คำขอประเมินผลการฝึกงานของนักศึกษา: ${studentFullName} (${studentCode})`,
            html: htmlContent,
        };

        const response = await sgMail.send(msg);
        logger.info('ส่งอีเมลคำขอประเมินผลการฝึกงานสำเร็จ', {
            supervisorEmail,
            studentFullName,
            studentCode,
            messageId: response[0]?.headers?.['x-message-id']
        });
        
        return { sent: true, response, messageId: response[0]?.headers?.['x-message-id'] };
    } catch (error) {
        logger.error('เกิดข้อผิดพลาดในการส่งอีเมลคำขอประเมินผลการฝึกงาน', {
            error: error.message,
            supervisorEmail,
            studentFullName,
            studentCode,
            stack: error.stack
        });
        // ไม่ throw error เพื่อไม่ให้ขัดจังหวะ workflow หลัก
        return { sent: false, reason: 'email_error', error: error.message };
    }
}

// สำหรับการแจ้งเตือนนักศึกษาเมื่อผู้ควบคุมงานส่งแบบประเมินแล้ว
async function sendEvaluationSubmittedNotificationToStudent(studentEmail, studentFirstName, companyName, evaluatorName) {
    try {
        // ใช้ EVALUATION สำหรับการแจ้งเตือนการประเมิน
        const isEnabled = await isNotificationEnabled('EVALUATION');
        
        if (!isEnabled) {
            logger.info('การแจ้งเตือน EVALUATION ถูกปิดใช้งาน - ไม่ส่งอีเมลแจ้งผลประเมินให้นักศึกษา', {
                studentEmail,
                studentFirstName,
                companyName,
                evaluatorName,
                notificationType: 'EVALUATION'
            });
            return { sent: false, reason: 'notification_disabled' };
        }

        const htmlContent = loadTemplate('studentEvaluationSubmitted', {
            studentFirstName: studentFirstName,
            evaluatorName: evaluatorName,
            companyName: companyName,
            currentYear: new Date().getFullYear()
        });

        const subject = `CS Logbook - ผลการประเมินการฝึกงานของคุณที่ ${companyName} ได้รับการส่งแล้ว`;

        const msg = {
            to: studentEmail,
            from: process.env.EMAIL_SENDER,
            subject: subject,
            html: htmlContent,
        };

        const response = await sgMail.send(msg);
        logger.info('ส่งการแจ้งเตือนผลการประเมินให้นักศึกษาสำเร็จ', {
            studentEmail,
            studentFirstName,
            companyName,
            messageId: response[0]?.headers?.['x-message-id']
        });
        
        return { sent: true, response, messageId: response[0]?.headers?.['x-message-id'] };
    } catch (error) {
        logger.error('เกิดข้อผิดพลาดในการส่งการแจ้งเตือนผลการประเมินให้นักศึกษา', {
            error: error.message,
            studentEmail,
            studentFirstName,
            companyName,
            stack: error.stack
        });
        return { sent: false, reason: 'email_error', error: error.message };
    }
}

// สำหรับการแจ้งเตือนอาจารย์ที่ปรึกษาเมื่อผู้ควบคุมงานส่งแบบประเมินแล้ว
async function sendEvaluationSubmittedNotificationToAdvisor(advisorEmail, studentFullName, studentCode, companyName, evaluatorName) {
    try {
        // ใช้ EVALUATION สำหรับการแจ้งเตือนการประเมิน
        const isEnabled = await isNotificationEnabled('EVALUATION');
        
        if (!isEnabled) {
            logger.info('การแจ้งเตือน EVALUATION ถูกปิดใช้งาน - ไม่ส่งอีเมลแจ้งผลประเมินให้อาจารย์', {
                advisorEmail,
                studentFullName,
                studentCode,
                companyName,
                evaluatorName,
                notificationType: 'EVALUATION'
            });
            return { sent: false, reason: 'notification_disabled' };
        }

        const htmlContent = loadTemplate('advisorEvaluationSubmitted', {
            studentFullName: studentFullName,
            studentCode: studentCode,
            companyName: companyName,
            evaluatorName: evaluatorName,
            currentYear: new Date().getFullYear()
        });

        const subject = `CS Logbook - นักศึกษา (${studentFullName}) ได้รับการประเมินผลการฝึกงานแล้ว`;

        const msg = {
            to: advisorEmail,
            from: process.env.EMAIL_SENDER,
            subject: subject,
            html: htmlContent,
        };

        const response = await sgMail.send(msg);
        logger.info('ส่งการแจ้งเตือนผลการประเมินให้อาจารย์สำเร็จ', {
            advisorEmail,
            studentFullName,
            studentCode,
            messageId: response[0]?.headers?.['x-message-id']
        });
        
        return { sent: true, response, messageId: response[0]?.headers?.['x-message-id'] };
    } catch (error) {
        logger.error('เกิดข้อผิดพลาดในการส่งการแจ้งเตือนผลการประเมินให้อาจารย์', {
            error: error.message,
            advisorEmail,
            studentFullName,
            studentCode,
            stack: error.stack
        });
        return { sent: false, reason: 'email_error', error: error.message };
    }
}


module.exports = { 
  sendLoginNotification, 
  sendDocumentApprovalNotification, 
  sendLogbookSubmissionNotification,
  sendTimeSheetApprovalRequest,
  sendTimeSheetApprovalResultNotification,
  sendInternshipEvaluationRequestEmail,
  sendEvaluationSubmittedNotificationToStudent, // Added
  sendEvaluationSubmittedNotificationToAdvisor  // Added
};
