const sgMail = require('@sendgrid/mail');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// เพิ่มฟังก์ชันเช็คสถานะการเปิด/ปิดการแจ้งเตือน
const isNotificationEnabled = (type) => {
  const enabledSetting = process.env[`EMAIL_${type}_ENABLED`];
  return enabledSetting === 'true';
};

async function sendLoginNotification(email, username) {
  if (!isNotificationEnabled('LOGIN')) {
    console.log('Login email notification is currently disabled');
    console.log(`Would send email to: ${email} for user: ${username}`);
    return Promise.resolve();
  }

  try {
    const msg = {
      to: email,
      from: process.env.EMAIL_SENDER,
      subject: 'KMUTNB CS Logbook - การแจ้งเตือนการเข้าสู่ระบบ',
      html: `
        <div style="font-family: 'Sarabun', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.sci.kmutnb.ac.th/wp-content/uploads/2020/08/cropped-sci-logo-1.png" alt="KMUTNB Logo" style="max-width: 200px;">
          </div>
          
          <h2 style="color: #1890ff; text-align: center;">แจ้งเตือนการเข้าสู่ระบบ CS Logbook</h2>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p>สวัสดี คุณ ${username},</p>
            <p>ระบบตรวจพบการเข้าสู่ระบบใหม่ในบัญชีของคุณ</p>
            
            <h3 style="color: #1890ff;">รายละเอียดการเข้าสู่ระบบ:</h3>
            <ul style="list-style: none; padding-left: 0;">
              <li>📅 วันที่และเวลา: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</li>
              <li>👤 ชื่อผู้ใช้: ${username}</li>
              <li>📧 อีเมล: ${email}</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666;">CS Logbook System</p>
            <p style="color: #666;">คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</p>
          </div>
        </div>
      `
    };

    const response = await sgMail.send(msg);
    console.log('Email sent successfully');
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// สำหรับการแจ้งเตือนเมื่อเอกสารได้รับการอนุมัติ
async function sendDocumentApprovalNotification(email, username, documentType, status) {
  if (!isNotificationEnabled('DOCUMENT')) {
    console.log('Document approval email notification is currently disabled');
    return Promise.resolve();
  }

  const msg = {
    to: email,
    from: process.env.EMAIL_SENDER,
    subject: `CS Logbook - แจ้งผลการพิจารณา${documentType}`,
    html: `<div>เรียน ${username}, เอกสาร${documentType}ของคุณได้รับการ${status}</div>`
  };
  return await sgMail.send(msg);
}

// สำหรับการแจ้งเตือนเมื่อมีการส่ง Logbook
async function sendLogbookSubmissionNotification(email, username, title) {
  if (!isNotificationEnabled('LOGBOOK')) {
    console.log('Logbook submission email notification is currently disabled');
    return Promise.resolve();
  }

  const msg = {
    to: email,
    from: process.env.EMAIL_SENDER,
    subject: 'CS Logbook - มีการส่ง Logbook ใหม่',
    html: `<div>เรียน ${username}, มีการส่ง Logbook "${title}" ใหม่</div>`
  };
  return await sgMail.send(msg);
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
          <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #1890ff;">บันทึกวันที่: ${entry.workDate}</h3>
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
        <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #1890ff;">บันทึกวันที่: ${timeSheetData.workDate}</h3>
          <p><strong>เวลาเข้างาน:</strong> ${timeSheetData.timeIn || '-'}</p>
          <p><strong>เวลาออกงาน:</strong> ${timeSheetData.timeOut || '-'}</p>
          <p><strong>จำนวนชั่วโมง:</strong> ${timeSheetData.workHours || '-'} ชั่วโมง</p>
          <p><strong>หัวข้องาน:</strong> ${timeSheetData.logTitle || '-'}</p>
          <p><strong>รายละเอียดงาน:</strong><br>${timeSheetData.workDescription || '-'}</p>
          <p><strong>สิ่งที่ได้เรียนรู้:</strong><br>${timeSheetData.learningOutcome || '-'}</p>
        </div>
      `;
    }

    const msg = {
      to: email,
      from: process.env.EMAIL_SENDER,
      subject: subject,
      html: `
        <div style="font-family: 'Sarabun', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.sci.kmutnb.ac.th/wp-content/uploads/2020/08/cropped-sci-logo-1.png" alt="KMUTNB Logo" style="max-width: 200px;">
          </div>
          
          <h2 style="color: #1890ff; text-align: center;">คำขออนุมัติบันทึกการฝึกงาน</h2>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p>เรียน คุณ ${supervisorName},</p>
            <p>${introText}</p>
          </div>

          ${timeSheetHtml}
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${approveLink}" style="background-color: #52c41a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px; display: inline-block;">อนุมัติ</a>
            <a href="${rejectLink}" style="background-color: #f5222d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">ปฏิเสธ</a>
          </div>
          
          <div style="margin-top: 20px; font-size: 14px; color: #777;">
            <p>* ลิงก์นี้จะมีอายุการใช้งาน 7 วัน หากไม่ได้ดำเนินการภายในเวลาดังกล่าว กรุณาติดต่อนักศึกษาเพื่อส่งคำขอใหม่</p>
          </div>

          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666;">CS Logbook System</p>
            <p style="color: #666;">คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</p>
          </div>
        </div>
      `
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
    
    const msg = {
      to: email,
      from: process.env.EMAIL_SENDER,
      subject: `CS Logbook - บันทึกการฝึกงานของคุณได้รับการ${statusText}แล้ว`,
      html: `
        <div style="font-family: 'Sarabun', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.sci.kmutnb.ac.th/wp-content/uploads/2020/08/cropped-sci-logo-1.png" alt="KMUTNB Logo" style="max-width: 200px;">
          </div>
          
          <h2 style="color: ${statusColor}; text-align: center;">บันทึกการฝึกงานได้รับการ${statusText}แล้ว</h2>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p>เรียน คุณ ${studentName},</p>
            <p>บันทึกการฝึกงานของคุณวันที่ ${entryData.workDate} ได้รับการ<strong style="color: ${statusColor}">${statusText}</strong>จากหัวหน้างานแล้ว</p>
          </div>
          
          ${comment ? `
          <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid ${statusColor}; border-radius: 3px;">
            <h4 style="margin-top: 0;">ความคิดเห็นจากหัวหน้างาน:</h4>
            <p style="margin-bottom: 0;">${comment}</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666;">CS Logbook System</p>
            <p style="color: #666;">คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</p>
          </div>
        </div>
      `
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

  const msg = {
    to: supervisorEmail,
    from: process.env.EMAIL_SENDER,
    subject: `คำขอประเมินผลการฝึกงานของนักศึกษา: ${studentFullName} (${studentCode})`,
    html: `
      <p>เรียน คุณ ${supervisorName},</p>
      <p>นักศึกษา ${studentFullName} (รหัสนักศึกษา: ${studentCode}) จากบริษัท ${companyName} ได้ดำเนินการฝึกงานเสร็จสิ้นแล้ว และใคร่ขอให้ท่านดำเนินการประเมินผลการฝึกงานของนักศึกษาผ่านระบบ CSLogbook</p>
      <p>กรุณาคลิกที่ลิงก์ด้านล่างเพื่อไปยังหน้าแบบประเมิน:</p>
      <p><a href="${evaluationLink}">ไปยังหน้าแบบประเมินผลการฝึกงาน</a></p>
      <p>ลิงก์นี้จะหมดอายุในวันที่ ${new Date(expiresAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.</p>
      <p>ขอขอบคุณสำหรับความร่วมมือในการประเมินผลการฝึกงานของนักศึกษา</p>
      <p>ขอแสดงความนับถือ,<br>ระบบ CSLogbook</p>
    `,
  };

  try {
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
    const templatePath = path.join(__dirname, '..', 'templates', 'studentEvaluationSubmitted.html');
    let htmlBody = fs.readFileSync(templatePath, 'utf-8');

    htmlBody = htmlBody.replace(/{{studentFirstName}}/g, studentFirstName);
    htmlBody = htmlBody.replace(/{{evaluatorName}}/g, evaluatorName);
    htmlBody = htmlBody.replace(/{{companyName}}/g, companyName);
    htmlBody = htmlBody.replace(/{{currentYear}}/g, new Date().getFullYear());

    const subject = `CS Logbook - ผลการประเมินการฝึกงานของคุณที่ ${companyName} ได้รับการส่งแล้ว`;

    const msg = {
      to: studentEmail,
      from: process.env.EMAIL_SENDER,
      subject: subject,
      html: htmlBody,
    };

    await sgMail.send(msg);
    console.log(`Evaluation submission notification sent to student ${studentEmail}`);
  } catch (error) {
    console.error('Error sending evaluation submission notification to student:', error.response ? error.response.body : error);
  }
}

// Placeholder: สำหรับการแจ้งเตือนอาจารย์ที่ปรึกษาเมื่อผู้ควบคุมงานส่งแบบประเมินแล้ว
async function sendEvaluationSubmittedNotificationToAdvisor(advisorEmail, studentFullName, studentCode, companyName, evaluatorName) {
  if (!isNotificationEnabled('EVALUATION_SUBMITTED_ADVISOR')) { // Using a new specific type
    console.log('Email notifications for EVALUATION_SUBMITTED_ADVISOR are disabled.');
    return Promise.resolve();
  }

  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'advisorEvaluationSubmitted.html');
    let htmlBody = fs.readFileSync(templatePath, 'utf-8');

    htmlBody = htmlBody.replace(/{{studentFullName}}/g, studentFullName);
    htmlBody = htmlBody.replace(/{{studentCode}}/g, studentCode);
    htmlBody = htmlBody.replace(/{{companyName}}/g, companyName);
    htmlBody = htmlBody.replace(/{{evaluatorName}}/g, evaluatorName);
    htmlBody = htmlBody.replace(/{{currentYear}}/g, new Date().getFullYear());
    // TODO: Replace placeholder [ใส่ Link ไปยังหน้า Login ของระบบ หรือหน้าที่เกี่ยวข้อง] with actual link

    const subject = `CS Logbook - นักศึกษา (${studentFullName}) ได้รับการประเมินผลการฝึกงานแล้ว`;

    const msg = {
      to: advisorEmail,
      from: process.env.EMAIL_SENDER,
      subject: subject,
      html: htmlBody,
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
