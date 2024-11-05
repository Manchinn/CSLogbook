// src/utils/mailer.js

const nodemailer = require('nodemailer');

// ตั้งค่า transporter สำหรับ responsemailmerge หรือ SMTP server ของคุณ
const transporter = nodemailer.createTransport({
  service: 'Gmail', // เช่น 'Gmail' หรือ 'responsemailmerge'
  auth: {
    user: 'chinnakrit150@gmail.com',
    pass: 'xx0778247544'
  }
});

// ฟังก์ชันสำหรับส่งอีเมลแจ้งเตือน
function sendLoginNotification() {
  const mailOptions = {
    from: 'chinnakrit150@gmail.com',
    to: 's6404062630295@gmail.com',
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
