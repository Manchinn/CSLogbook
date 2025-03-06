const validateEnv = require('../utils/validateEnv');

validateEnv('server');

module.exports = {
  port: parseInt(process.env.PORT, 10),
  baseUrl: process.env.BASE_URL.replace(/\/$/, ''), // Remove trailing slash
  apiPrefix: process.env.API_PREFIX.startsWith('/') ? 
    process.env.API_PREFIX : 
    `/${process.env.API_PREFIX}`
};
