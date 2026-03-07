const validateEnv = require('../utils/validateEnv');

validateEnv('email');

module.exports = {
  provider: process.env.EMAIL_PROVIDER || 'gmail',
  emailSender: process.env.EMAIL_SENDER
};
