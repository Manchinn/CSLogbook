
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',        
    port: 587,                
    secure: false,                      
    auth: {
      user: 'apikey',                  
      pass: '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'
    }
  });

function sendLoginNotification(email, username) {
  const mailOptions = {
    from: 'chinnakrit50@hotmail.com',
    to: email,
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

            <div style="background-color: #fff3e0; padding: 10px; border-left: 4px solid #ff9800; margin: 15px 0;">
              <p style="margin: 0;">⚠️ หากคุณไม่ได้เป็นผู้เข้าสู่ระบบ กรุณาติดต่อผู้ดูแลระบบทันที</p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666;">CS Logbook System</p>
            <p style="color: #666;">คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</p>
            <p style="font-size: 12px; color: #999;">อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับ</p>
          </div>
        </div>
      `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

module.exports = { sendLoginNotification };
