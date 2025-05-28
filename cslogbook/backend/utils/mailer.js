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

// ปรับปรุงฟังก์ชันเช็คสถานะการเปิด/ปิดการแจ้งเตือน
const isNotificationEnabled = async (type) => {
    try {
        return await notificationSettingsService.isNotificationEnabled(type);
    } catch (error) {
        logger.error(`Error checking notification status: ${type}`, { error });
        // Fallback ไปใช้ค่าจาก environment variable
        const enabledSetting = process.env[`EMAIL_${type.toUpperCase()}_ENABLED`];
        return enabledSetting === 'true';
    }
};

async function sendLoginNotification(email, username) {
    if (!await isNotificationEnabled('LOGIN')) {
        logger.info(`Login email notification is disabled for user: ${username}`);
        return Promise.resolve();
    }

    try {
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
        logger.info('Login notification email sent successfully', { email, username });
        return response;
    } catch (error) {
        logger.error('Error sending login notification email', { error, email, username });
        throw error;
    }
}

// สำหรับการแจ้งเตือนเมื่อเอกสารได้รับการอนุมัติ
async function sendDocumentApprovalNotification(email, username, documentType, status) {
  if (!isNotificationEnabled('DOCUMENT')) {
    console.log('Document approval email notification is currently disabled');
    return Promise.resolve();
  }

  try {
    // กำหนด CSS class สำหรับสถานะ
    const statusClass = status === 'อนุมัติ' ? 'status-approved' : 'status-rejected';

    // ใช้ loadTemplate function แทนการอ่านไฟล์ตรงๆ
    const htmlContent = loadTemplate('documentApproval', {
      username: username,
      documentType: documentType,
      status: status,
      statusClass: statusClass
    });

    const msg = {
      to: email,
      from: process.env.EMAIL_SENDER,
      subject: `CS Logbook - แจ้งผลการพิจารณา${documentType}`,
      html: htmlContent
    };
    
    return await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending document approval notification:', error);
    throw error;
  }
}

// สำหรับการแจ้งเตือนเมื่อมีการส่ง Logbook
async function sendLogbookSubmissionNotification(email, username, title) {
  if (!isNotificationEnabled('LOGBOOK')) {
    console.log('Logbook submission email notification is currently disabled');
    return Promise.resolve();
  }

  try {
    // ใช้ loadTemplate function แทนการอ่านไฟล์ตรงๆ
    const htmlContent = loadTemplate('logbookSubmission', {
      username: username,
      title: title
    });

    const msg = {
      to: email,
      from: process.env.EMAIL_SENDER,
      subject: 'CS Logbook - มีการส่ง Logbook ใหม่',
      html: htmlContent
    };
    
    return await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending logbook submission notification:', error);
    throw error;
  }
}

// สำหรับการส่งคำขออนุมัติบันทึกการฝึกงานไปยังหัวหน้างาน
async function sendTimeSheetApprovalRequest(email, supervisorName, studentName, approveLink, rejectLink, timeSheetData, type = 'single') {
  if (!isNotificationEnabled('DOCUMENT')) {
    console.log('Document approval email notification is currently disabled');
    return Promise.resolve();
  }

  try {
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

    // ใช้ template แทนการเขียน HTML ตรงๆ
    const htmlContent = loadTemplate('timesheetApprovalRequest', {
      supervisorName: supervisorName,
      introText: introText,
      timeSheetHtml: timeSheetHtml,
      approveLink: approveLink,
      rejectLink: rejectLink
    });

    const msg = {
      to: email,
      from: process.env.EMAIL_SENDER,
      subject: subject,
      html: htmlContent
    };

    const response = await sgMail.send(msg);
    console.log('Approval request email sent successfully');
    return response;
  } catch (error) {
    console.error('Error sending approval request email:', error);
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
  if (!isNotificationEnabled('DOCUMENT')) {
    console.log('Email notifications for DOCUMENT (Internship Evaluation Request) are disabled.');
    return Promise.resolve(); // Resolve immediately if notifications are off
  }

  try {
    // ใช้ loadTemplate function แทนการอ่านไฟล์ตรงๆ
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
      })
    });

    const msg = {
      to: supervisorEmail,
      from: process.env.EMAIL_SENDER,
      subject: `คำขอประเมินผลการฝึกงานของนักศึกษา: ${studentFullName} (${studentCode})`,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`Internship evaluation request email sent to ${supervisorEmail} for student ${studentFullName}`);
  } catch (error) {
    console.error('Error sending internship evaluation request email:', error.response ? error.response.body : error);
    // Do not throw error to prevent interruption of the main flow, but log it.
  }
}

// สำหรับการแจ้งเตือนนักศึกษาเมื่อผู้ควบคุมงานส่งแบบประเมินแล้ว
async function sendEvaluationSubmittedNotificationToStudent(studentEmail, studentFirstName, companyName, evaluatorName) {
  if (!isNotificationEnabled('EVALUATION_SUBMITTED_STUDENT')) { // Using a new specific type
    console.log('Email notifications for EVALUATION_SUBMITTED_STUDENT are disabled.');
    return Promise.resolve();
  }

  try {
    // ใช้ loadTemplate function แทนการอ่านไฟล์ตรงๆ
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

    await sgMail.send(msg);
    console.log(`Evaluation submission notification sent to student ${studentEmail}`);
  } catch (error) {
    console.error('Error sending evaluation submission notification to student:', error.response ? error.response.body : error);
  }
}

// สำหรับการแจ้งเตือนอาจารย์ที่ปรึกษาเมื่อผู้ควบคุมงานส่งแบบประเมินแล้ว
async function sendEvaluationSubmittedNotificationToAdvisor(advisorEmail, studentFullName, studentCode, companyName, evaluatorName) {
  if (!isNotificationEnabled('EVALUATION_SUBMITTED_ADVISOR')) { // Using a new specific type
    console.log('Email notifications for EVALUATION_SUBMITTED_ADVISOR are disabled.');
    return Promise.resolve();
  }

  try {
    // ใช้ loadTemplate function แทนการอ่านไฟล์ตรงๆ
    const htmlContent = loadTemplate('advisorEvaluationSubmitted', {
      studentFullName: studentFullName,
      studentCode: studentCode,
      companyName: companyName,
      evaluatorName: evaluatorName,
      currentYear: new Date().getFullYear()
    });
    // TODO: Replace placeholder [ใส่ Link ไปยังหน้า Login ของระบบ หรือหน้าที่เกี่ยวข้อง] with actual link

    const subject = `CS Logbook - นักศึกษา (${studentFullName}) ได้รับการประเมินผลการฝึกงานแล้ว`;

    const msg = {
      to: advisorEmail,
      from: process.env.EMAIL_SENDER,
      subject: subject,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`Evaluation submission notification sent to advisor ${advisorEmail} for student ${studentFullName}`);
  } catch (error) {
    console.error('Error sending evaluation submission notification to advisor:', error.response ? error.response.body : error);
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
