const validateEnv = require('../utils/validateEnv');

validateEnv('email');
validateEnv('features');

module.exports = {
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  emailSender: process.env.EMAIL_SENDER,
  features: {
    loginEnabled: process.env.EMAIL_LOGIN_ENABLED === 'true',
    documentEnabled: process.env.EMAIL_DOCUMENT_ENABLED === 'true',
    logbookEnabled: process.env.EMAIL_LOGBOOK_ENABLED === 'true',
    meetingEnabled: process.env.EMAIL_MEETING_ENABLED === 'true'
  }
};
