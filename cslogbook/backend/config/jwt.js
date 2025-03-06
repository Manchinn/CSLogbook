const validateEnv = require('../utils/validateEnv');

validateEnv('jwt');

module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN
};