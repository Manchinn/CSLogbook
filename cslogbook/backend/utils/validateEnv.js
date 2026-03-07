const requiredEnvVars = {
  database: ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'],
  server: ['PORT', 'BASE_URL', 'API_PREFIX'],
  jwt: ['JWT_SECRET', 'JWT_EXPIRES_IN'],
  email: ['EMAIL_PROVIDER', 'EMAIL_SENDER']
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

  if (category === 'all' || category === 'email') {
    const provider = (process.env.EMAIL_PROVIDER || '').toLowerCase();
    if (provider === 'gmail') {
      const gmailVars = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GMAIL_USER_EMAIL'];
      const missingGmail = gmailVars.filter(v => !process.env[v]);
      if (missingGmail.length > 0 && !isOptional) {
        throw new Error(`Gmail provider requires: ${missingGmail.join(', ')}`);
      }
    }
  }
  
  return missingVars.length === 0;
}

module.exports = validateEnv;
