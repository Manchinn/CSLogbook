// src/utils/mailer.js

const nodemailer = require('nodemailer');

// ตั้งค่า transporter สำหรับ responsemailmerge หรือ SMTP server ของคุณ
const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',           // กำหนด host ของ SendGrid
    port: 587,                           // ใช้ port 587 สำหรับ TLS
    secure: false,                       // ไม่ใช้ secure (ใช้ TLS แทน)
    auth: {
      user: 'apikey',                    // ตั้งเป็น 'apikey' ตามที่ SendGrid กำหนด
      pass: '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'      // ใส่ API Key ของคุณที่นี่
    }
  });

// ฟังก์ชันสำหรับส่งอีเมลแจ้งเตือน
function sendLoginNotification(email, username) {
  const mailOptions = {
    from: 'chinnakrit500@hotmail.com',
    to: email,
    subject: 'Login Notification',
    text: `User ${username} has logged in.`
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
