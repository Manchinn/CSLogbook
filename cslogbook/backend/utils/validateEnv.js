const requiredEnvVars = {
  database: ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'],
  server: ['PORT', 'BASE_URL', 'API_PREFIX'],
  jwt: ['JWT_SECRET', 'JWT_EXPIRES_IN'],
  email: ['SENDGRID_API_KEY', 'EMAIL_SENDER'],
  features: ['EMAIL_LOGIN_ENABLED', 'EMAIL_DOCUMENT_ENABLED', 'EMAIL_LOGBOOK_ENABLED', 'EMAIL_MEETING_ENABLED']
};

function validateEnv(category = 'all', isOptional = false) {
  const varsToCheck = category === 'all' 
    ? Object.values(requiredEnvVars).flat() 
    : requiredEnvVars[category] || [];

  const missingVars = varsToCheck.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0 && !isOptional) {
    throw new Error(
      `Missing required environment variables:\n${missingVars.join('\n')}\n` +
      'Please check your .env file'
    );
  }

  // Validate specific formats
  if (category === 'all' || category === 'server') {
    if (process.env.PORT && isNaN(process.env.PORT)) {
      throw new Error('PORT must be a number');
    }
    if (process.env.BASE_URL) {
      try {
        new URL(process.env.BASE_URL);
      } catch (e) {
        throw new Error('BASE_URL must be a valid URL');
      }
    }
  }

  if (category === 'all' || category === 'jwt') {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET should be at least 32 characters');
    }
  }

  if (category === 'all' || category === 'features') {
  ['EMAIL_LOGIN_ENABLED', 'EMAIL_DOCUMENT_ENABLED', 'EMAIL_LOGBOOK_ENABLED', 'EMAIL_MEETING_ENABLED'].forEach(flag => {
      if (process.env[flag] && !['true', 'false'].includes(process.env[flag].toLowerCase())) {
        throw new Error(`${flag} must be 'true' or 'false'`);
      }
    });
  }
  
  return missingVars.length === 0;
}

module.exports = validateEnv;
