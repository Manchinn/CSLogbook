// Backend build script for production
console.log('🏗️  Building backend for production...');

// Set production environment
process.env.NODE_ENV = 'production';

// Load production environment variables
require('dotenv').config({
  path: '.env.production'
});

console.log('✅ Backend build completed successfully!');
console.log(`📦 Environment: ${process.env.NODE_ENV}`);
console.log(`🌐 Port: ${process.env.PORT}`);
console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);