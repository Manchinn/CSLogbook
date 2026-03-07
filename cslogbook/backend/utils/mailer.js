require('dotenv').config();
const emailTransport = require('./emailTransport');
const fs = require('fs');
const path = require('path');
const notificationSettingsService = require('../services/notificationSettingsService');
const logger = require('./logger');

// Helper ส่งอีเมลกลาง
async function sendEmail(msg) {
    if (!msg.from) msg.from = process.env.EMAIL_SENDER;
    return emailTransport.send(msg);
}

// Helper ดึง messageId
function extractMessageId(res) {
    if (!res) return undefined;
    return res.messageId || res.id;
}

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

// ครอบ content HTML ด้วย base template
function wrapWithBase(contentHtml, vars = {}) {
    const baseVars = {
        currentYear: new Date().getFullYear(),
        extraStyles: '',
        emailTitle: 'CS Logbook',
        headerTitle: 'CS Logbook',
        ...vars,
        content: contentHtml
    };
    return loadTemplate('base', baseVars);
}

function escapeHtml(value) {
    if (value === undefined || value === null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

        const contentHtml = loadTemplate('loginNotification', {
            username: username,
            email: email,
            loginDateTime: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
        });
        const htmlContent = wrapWithBase(contentHtml, {
            headerTitle: 'แจ้งเตือนการเข้าสู่ระบบ',
            emailTitle: 'แจ้งเตือนการเข้าสู่ระบบ',
            extraStyles: `
                .greeting { font-size: 18px; font-weight: 500; color: #1a1a1a; margin-bottom: 24px; }
                .info-box { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #AC3520; }
                .info-title { color: #AC3520; font-size: 18px; font-weight: 600; margin: 0 0 16px 0; }
                .info-list { list-style: none; padding-left: 0; margin: 0; }
                .info-list li { padding: 8px 0; display: flex; align-items: center; font-size: 15px; }
                .info-list li .icon { margin-right: 12px; font-size: 16px; width: 20px; }
                .info-list li strong { color: #AC3520; }
                .security-warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 24px 0; }
                .security-warning h3 { color: #856404; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; }
                .security-warning p { color: #856404; margin: 8px 0; font-size: 14px; line-height: 1.6; }
                .security-warning ul { color: #856404; margin: 12px 0; padding-left: 20px; font-size: 14px; }
            `
        });

        const msg = {
            to: email,
            from: process.env.EMAIL_SENDER,
            subject: 'KMUTNB CS Logbook - การแจ้งเตือนการเข้าสู่ระบบ',
            html: htmlContent
        };

    // OLD (SendGrid): const response = await sgMail.send(msg);
    const response = await sendEmail(msg); // NEW
    const messageId = extractMessageId(response); // NEW
    logger.info('ส่งอีเมลการแจ้งเตือนการเข้าสู่ระบบสำเร็จ', { email, username, messageId, notificationType: 'LOGIN' });
    return { sent: true, response, messageId };
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

        const contentHtml = loadTemplate('documentApproval', {
            username: username,
            documentType: documentType,
            status: status,
            statusClass: statusClass
        });
        const htmlContent = wrapWithBase(contentHtml, {
            headerTitle: `แจ้งผลการพิจารณา${documentType}`,
            emailTitle: 'แจ้งผลการพิจารณาเอกสาร',
            extraStyles: `
                .status-approved { color: #52c41a; font-weight: bold; }
                .status-rejected { color: #f5222d; font-weight: bold; }
            `
        });

        const msg = {
            to: email,
            from: process.env.EMAIL_SENDER,
            subject: `CS Logbook - แจ้งผลการพิจารณา${documentType}`,
            html: htmlContent
        };
        
    // OLD: const response = await sgMail.send(msg);
    const response = await sendEmail(msg); // NEW
    const messageId = extractMessageId(response); // NEW
    logger.info('ส่งอีเมลการแจ้งเตือนการอนุมัติเอกสารสำเร็จ', { email, username, documentType, status, messageId, notificationType: 'DOCUMENT' });
    return { sent: true, response, messageId };
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

        const contentHtml = loadTemplate('logbookSubmission', {
            username: username,
            title: title
        });
        const htmlContent = wrapWithBase(contentHtml, {
            headerTitle: 'การส่ง Logbook ใหม่',
            emailTitle: 'แจ้งเตือนการส่ง Logbook ใหม่',
            extraStyles: `
                .logbook-title { background-color: #f0f8ff; padding: 10px; border-radius: 5px; border-left: 4px solid #AC3520; margin: 15px 0; }
            `
        });

        const msg = {
            to: email,
            from: process.env.EMAIL_SENDER,
            subject: 'CS Logbook - มีการส่ง Logbook ใหม่',
            html: htmlContent
        };
        
    // OLD: const response = await sgMail.send(msg);
    const response = await sendEmail(msg); // NEW
    const messageId = extractMessageId(response); // NEW
    logger.info('ส่งอีเมลการแจ้งเตือนการส่ง Logbook สำเร็จ', { email, username, title, messageId, notificationType: 'LOGBOOK' });
    return { sent: true, response, messageId };
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

// สำหรับการแจ้งเตือนการนัดหมายประชุมโครงงาน
async function sendMeetingScheduledNotification({
    recipientEmail,
    recipientName,
    projectName,
    meetingTitle,
    meetingDate,
    meetingDateLabel,
    meetingMethod,
    meetingMethodLabel,
    meetingLocation,
    meetingLink,
    participants = [],
    initiatorName,
    note
}) {
    try {
        const isEnabled = await isNotificationEnabled('MEETING');

        if (!isEnabled) {
            logger.info('การแจ้งเตือน MEETING ถูกปิดใช้งาน - ไม่ส่งอีเมลแจ้งนัดหมายการพบ', {
                recipientEmail,
                projectName,
                meetingTitle,
                notificationType: 'MEETING'
            });
            return { sent: false, reason: 'notification_disabled' };
        }

        const formatDateTime = (value) => {
            if (!value) return '-';
            try {
                return new Date(value).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                return escapeHtml(value);
            }
        };

        const safeMeetingDate = meetingDateLabel || formatDateTime(meetingDate);

        const participantsMarkup = Array.isArray(participants) && participants.length
            ? participants
                .map((participant) => {
                    const name = escapeHtml(participant.name || '-');
                    const code = participant.studentCode ? ` (${escapeHtml(participant.studentCode)})` : '';
                    const roleLabel = participant.roleLabel ? ` – ${escapeHtml(participant.roleLabel)}` : '';
                    return `<li><strong>${name}</strong>${code}${roleLabel}</li>`;
                })
                .join('')
            : '<li>—</li>';

        const participantsSection = `<ul>${participantsMarkup}</ul>`;

        const locationSection = meetingLocation
            ? `<div><strong>สถานที่:</strong> ${escapeHtml(meetingLocation)}</div>`
            : '';

        const linkSection = meetingLink
            ? `<div><strong>ลิงก์ประชุม:</strong> <a href="${escapeHtml(meetingLink)}" target="_blank" rel="noopener">${escapeHtml(meetingLink)}</a></div>`
            : '';

        const noteSection = note
            ? `
                <div class="note-box">
                    <div class="note-box__title">ข้อความเพิ่มเติมจากผู้สร้างนัดหมาย</div>
                    <div class="note-box__body">${escapeHtml(note)}</div>
                </div>
            `
            : '';

        const contentHtml = loadTemplate('meetingScheduledNotification', {
            recipientName: escapeHtml(recipientName || 'ผู้เข้าร่วม'),
            projectName: escapeHtml(projectName || 'โครงงานพิเศษ'),
            meetingTitle: escapeHtml(meetingTitle || 'การประชุมโครงงาน'),
            meetingDateTime: escapeHtml(safeMeetingDate || '-'),
            meetingMethodLabel: escapeHtml(meetingMethodLabel || meetingMethod || '-'),
            meetingLocationSection: locationSection,
            meetingLinkSection: linkSection,
            participantsHtml: participantsSection,
            initiatorName: escapeHtml(initiatorName || 'ผู้ใช้ระบบ'),
            noteSection,
            generatedDateTime: new Date().toLocaleString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        });
        const htmlContent = wrapWithBase(contentHtml, {
            headerTitle: 'แจ้งนัดหมายการพบ',
            emailTitle: 'แจ้งนัดหมายการพบอาจารย์',
            extraStyles: `
                .salutation { font-size: 16px; font-weight: 600; margin-bottom: 18px; }
                .meeting-box { background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px 22px; margin-bottom: 24px; border-left: 4px solid #AC3520; }
                .meeting-box strong { color: #1e3a8a; display: block; font-size: 15px; margin-bottom: 6px; }
                .meeting-box div { font-size: 14px; color: #1f2937; margin: 4px 0; }
                .section-title { font-size: 15px; font-weight: 600; color: #1f2937; margin: 26px 0 12px; }
                .participant-list { margin: 0; padding: 18px 22px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
                .participant-list ul { margin: 0; padding-left: 18px; color: #334155; font-size: 14px; }
                .note-box { margin-top: 24px; padding: 16px 18px; border-radius: 10px; background: #fef3c7; border: 1px solid #fbbf24; }
                .note-box__title { font-weight: 600; color: #b45309; margin-bottom: 8px; font-size: 14px; }
                .note-box__body { font-size: 14px; color: #92400e; line-height: 1.5; }
                .cta { margin-top: 28px; text-align: center; font-size: 14px; color: #475569; line-height: 1.6; }
            `
        });

        const subject = `CS Logbook - แจ้งนัดหมายการพบ (${meetingTitle || projectName || 'Project'})`;

        const msg = {
            to: recipientEmail,
            from: process.env.EMAIL_SENDER,
            subject,
            html: htmlContent
        };

        const response = await sendEmail(msg);
        const messageId = extractMessageId(response);
        logger.info('ส่งอีเมลแจ้งนัดหมายการพบสำเร็จ', {
            recipientEmail,
            projectName,
            meetingTitle,
            messageId,
            notificationType: 'MEETING_SCHEDULED'
        });
        return { sent: true, response, messageId };
    } catch (error) {
        logger.error('เกิดข้อผิดพลาดในการส่งอีเมลแจ้งนัดหมายการพบ', {
            error: error.message,
            recipientEmail,
            projectName,
            meetingTitle,
            stack: error.stack
        });
        throw error;
    }
}

// สำหรับการส่งคำขออนุมัติบันทึกการฝึกงานไปยังหัวหน้างาน
async function sendTimeSheetApprovalRequest(email, supervisorName, studentName, webApprovalLink, rejectLink, timeSheetData, type = 'single') {
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

        const contentHtml = loadTemplate('timesheetApprovalRequest', {
            supervisorName: supervisorName,
            studentName: studentName,
            studentCode: timeSheetData?.studentCode || (Array.isArray(timeSheetData) && timeSheetData[0]?.studentCode) || 'ไม่ระบุ',
            companyName: timeSheetData?.companyName || (Array.isArray(timeSheetData) && timeSheetData[0]?.companyName) || 'ไม่ระบุ',
            introText: introText,
            timeSheetHtml: timeSheetHtml,
            webApprovalLink: webApprovalLink
        });
        const htmlContent = wrapWithBase(contentHtml, {
            headerTitle: 'คำขออนุมัติบันทึกการฝึกงาน',
            emailTitle: 'แจ้งเตือนรายการรออนุมัติ',
            extraStyles: `
                .message-box { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #AC3520; text-align: center; }
                .message-box .salutation { font-weight: 600; color: #2c3e50; margin-bottom: 10px; font-size: 16px; }
                .message-box .content-text { color: #34495e; line-height: 1.7; font-size: 14px; margin-bottom: 15px; }
                .button-container { display: flex; justify-content: center; margin-top: 20px; }
                .button { display: inline-block; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; color: #ffffff !important; font-size: 15px; text-align: center; background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .important-notice { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 25px 0; border-left: 4px solid #f39c12; }
                .important-notice h4 { color: #856404; margin: 0 0 8px 0; font-size: 14px; font-weight: 600; }
                .important-notice p { color: #856404; margin: 0; font-size: 13px; line-height: 1.5; }
            `
        });

        const msg = {
            to: email,
            from: process.env.EMAIL_SENDER,
            subject: subject,
            html: htmlContent
        };

    // OLD: const response = await sgMail.send(msg);
    const response = await sendEmail(msg); // NEW
    const messageId = extractMessageId(response); // NEW
    logger.info('ส่งอีเมลคำขออนุมัติสำเร็จ', { email, supervisorName, studentName, type, messageId, notificationType: 'APPROVAL_REQUEST' });
    return { sent: true, response, messageId };
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
  const isEnabled = await isNotificationEnabled('APPROVAL');
  if (!isEnabled) {
    logger.info('Timesheet approval result email notification is currently disabled');
    return;
  }

  try {
    const statusText = status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ';
    const statusColor = status === 'approved' ? '#52c41a' : '#f5222d';
    
    // สร้าง HTML สำหรับ comment section
    const commentSection = comment ? `
      <div class="comment-box" style="border-left: 4px solid ${statusColor};">
        <h4 style="color: ${statusColor};">ความคิดเห็นจากหัวหน้างาน:</h4>
        <p>${comment}</p>
      </div>
    ` : '';

    const contentHtml = loadTemplate('timesheetApprovalResult', {
      studentName: studentName,
      statusText: statusText,
      statusColor: statusColor,
      workDate: entryData.workDate,
      commentSection: commentSection
    });
    const htmlContent = wrapWithBase(contentHtml, {
      headerTitle: `บันทึกการฝึกงานได้รับการ${statusText}แล้ว`,
      emailTitle: 'ผลการพิจารณาบันทึกการฝึกงาน',
      extraStyles: `
        .info-box { background-color: #f8f9fa; padding: 15px; border-radius: 4px; }
        .comment-box { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 3px; }
        .comment-box h4 { margin-top: 0; }
        .comment-box p { margin-bottom: 0; }
      `
    });
    
    const msg = {
      to: email,
      from: process.env.EMAIL_SENDER,
      subject: `CS Logbook - บันทึกการฝึกงานของคุณได้รับการ${statusText}แล้ว`,
      html: htmlContent
    };

    // OLD: const response = await sgMail.send(msg);
    const response = await sendEmail(msg); // NEW
    logger.info('Approval result notification sent successfully');
    return response;
  } catch (error) {
    logger.error('Error sending approval result notification:', error);
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

        const contentHtml = loadTemplate('evaluationRequest', {
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
        const htmlContent = wrapWithBase(contentHtml, {
            headerTitle: 'คำขอประเมินผลการฝึกงาน',
            emailTitle: 'คำขอประเมินผลการฝึกงาน',
            extraStyles: `
                .official-header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #AC3520; }
                .official-header h2 { color: #2c3e50; font-size: 20px; margin: 0 0 8px 0; font-weight: 600; }
                .official-header .document-type { color: #7f8c8d; font-size: 13px; font-weight: 500; }
                .greeting-box { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #AC3520; }
                .greeting-box .salutation { font-weight: 600; color: #2c3e50; margin-bottom: 10px; font-size: 16px; }
                .greeting-box .content-text { color: #34495e; line-height: 1.7; text-align: justify; }
                .student-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #dee2e6; border-left: 4px solid #AC3520; }
                .student-info h4 { color: #2c3e50; margin: 0 0 15px 0; font-size: 16px; font-weight: 600; }
                .info-row { display: flex; margin-bottom: 10px; align-items: flex-start; }
                .info-label { font-weight: 600; color: #2c3e50; min-width: 140px; margin-right: 15px; }
                .info-value { color: #495057; flex: 1; }
                .evaluation-purpose { background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745; }
                .evaluation-purpose h3 { color: #155724; margin: 0 0 12px 0; font-size: 16px; font-weight: 600; }
                .evaluation-purpose p { color: #155724; margin: 0; line-height: 1.6; text-align: justify; }
                .action-section { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; margin: 30px 0; border-radius: 8px; text-align: center; border: 1px solid #dee2e6; }
                .action-section h3 { color: #2c3e50; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; }
                .action-section p { color: #6c757d; margin-bottom: 20px; font-size: 14px; line-height: 1.6; }
                .button-container { margin: 25px 0; }
                .evaluation-button { display: inline-block; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; color: #ffffff; font-size: 16px; text-align: center; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3); min-width: 250px; }
                .expiry-notice { background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border: 1px solid #ffeaa7; border-radius: 8px; padding: 18px; margin: 20px 0; border-left: 4px solid #f39c12; }
                .expiry-notice h4 { color: #856404; margin: 0 0 10px 0; font-size: 15px; font-weight: 600; }
                .expiry-notice p { color: #856404; margin: 5px 0; font-size: 14px; line-height: 1.5; }
                .expiry-date { background-color: #fff; padding: 8px 12px; border-radius: 4px; display: inline-block; font-weight: 600; margin: 5px 0; }
                .important-notice { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border: 1px solid #bbdefb; border-radius: 8px; padding: 18px; margin: 20px 0; border-left: 4px solid #2196f3; }
                .important-notice h4 { color: #0d47a1; margin: 0 0 10px 0; font-size: 15px; font-weight: 600; }
                .important-notice ul { color: #0d47a1; margin: 8px 0; padding-left: 20px; font-size: 13px; line-height: 1.6; }
                .important-notice li { margin: 5px 0; }
                .appreciation { background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #9c27b0; text-align: center; }
                .appreciation p { color: #4a148c; margin: 0; font-size: 15px; font-weight: 500; line-height: 1.6; }
                @media (max-width: 600px) { .info-row { flex-direction: column; } .info-label { min-width: auto; margin-bottom: 5px; } .evaluation-button { min-width: auto; width: 100%; padding: 12px 20px; } }
            `
        });

        const msg = {
            to: supervisorEmail,
            from: process.env.EMAIL_SENDER,
            subject: `คำขอประเมินผลการฝึกงานของนักศึกษา: ${studentFullName} (${studentCode})`,
            html: htmlContent,
        };

    // OLD: const response = await sgMail.send(msg);
    const response = await sendEmail(msg); // NEW
    const messageId = extractMessageId(response); // NEW
    logger.info('ส่งอีเมลคำขอประเมินผลการฝึกงานสำเร็จ', { supervisorEmail, studentFullName, studentCode, messageId, notificationType: 'EVALUATION_REQUEST' });
    return { sent: true, response, messageId };
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

        const contentHtml = loadTemplate('studentEvaluationSubmitted', {
            studentFirstName: studentFirstName,
            evaluatorName: evaluatorName,
            companyName: companyName
        });
        const htmlContent = wrapWithBase(contentHtml, {
            headerTitle: 'แจ้งผลการประเมินการฝึกงาน',
            emailTitle: 'ผลการประเมินการฝึกงาน'
        });

        const subject = `CS Logbook - ผลการประเมินการฝึกงานของคุณที่ ${companyName} ได้รับการส่งแล้ว`;

        const msg = {
            to: studentEmail,
            from: process.env.EMAIL_SENDER,
            subject: subject,
            html: htmlContent,
        };

    // OLD: const response = await sgMail.send(msg);
    const response = await sendEmail(msg); // NEW
    const messageId = extractMessageId(response); // NEW
    logger.info('ส่งการแจ้งเตือนผลการประเมินให้นักศึกษาสำเร็จ', { studentEmail, studentFirstName, companyName, messageId, notificationType: 'EVALUATION_RESULT_STUDENT' });
    return { sent: true, response, messageId };
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

        const contentHtml = loadTemplate('advisorEvaluationSubmitted', {
            studentFullName: studentFullName,
            studentCode: studentCode,
            companyName: companyName,
            evaluatorName: evaluatorName
        });
        const htmlContent = wrapWithBase(contentHtml, {
            headerTitle: 'แจ้งผลการประเมินการฝึกงาน',
            emailTitle: 'แจ้งเตือนการส่งผลประเมินการฝึกงาน'
        });

        const subject = `CS Logbook - นักศึกษา (${studentFullName}) ได้รับการประเมินผลการฝึกงานแล้ว`;

        const msg = {
            to: advisorEmail,
            from: process.env.EMAIL_SENDER,
            subject: subject,
            html: htmlContent,
        };

    // OLD: const response = await sgMail.send(msg);
    const response = await sendEmail(msg); // NEW
    const messageId = extractMessageId(response); // NEW
    logger.info('ส่งการแจ้งเตือนผลการประเมินให้อาจารย์สำเร็จ', { advisorEmail, studentFullName, studentCode, messageId, notificationType: 'EVALUATION_RESULT_ADVISOR' });
    return { sent: true, response, messageId };
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
    sendMeetingScheduledNotification,
    sendTimeSheetApprovalRequest,
    sendTimeSheetApprovalResultNotification,
    sendInternshipEvaluationRequestEmail,
    sendEvaluationSubmittedNotificationToStudent,
    sendEvaluationSubmittedNotificationToAdvisor,
    loadTemplate,
    wrapWithBase
};
