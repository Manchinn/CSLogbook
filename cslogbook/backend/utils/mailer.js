
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
