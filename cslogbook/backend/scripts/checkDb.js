require('dotenv').config({ path: '.env.development' });
const { testConnection } = require('../config/database');
const logger = require('../utils/logger');

const checkDatabase = async () => {
    try {
        console.log('🔍 Testing database connection...');
        
        // Check environment variables
        const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            console.error('❌ Missing environment variables:', missingVars.join(', '));
            process.exit(1);
        }

        const isConnected = await testConnection();
        
        if (isConnected) {
            console.log('✅ Database connection test passed');
            console.log(`📊 Connected to: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
            process.exit(0);
        } else {
            console.error('❌ Database connection test failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Database check failed:', error);
        process.exit(1);
    }
};

checkDatabase();