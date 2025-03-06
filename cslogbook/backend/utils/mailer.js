const sgMail = require('@sendgrid/mail');
require('dotenv').config();

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

module.exports = { sendLoginNotification, sendDocumentApprovalNotification, sendLogbookSubmissionNotification };
