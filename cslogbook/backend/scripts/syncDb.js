const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const syncDatabase = async () => {
    try {
        console.log('🔄 Starting database synchronization...');
        
        // Force sync in development only
        const force = process.argv.includes('--force');
        
        if (process.env.NODE_ENV === 'production' && force) {
            console.error('❌ Force sync is not allowed in production!');
            process.exit(1);
        }

        // Sync all models
        await sequelize.sync({ force, alter: !force });
        
        // Log all synchronized models
        const models = Object.keys(sequelize.models);
        console.log('📋 Synchronized models:', models);
        
        // Test each model's connection
        for (const modelName of models) {
            const model = sequelize.models[modelName];
            try {
                await model.findOne();
                console.log(`✅ Model ${modelName} verified`);
            } catch (err) {
                console.error(`❌ Model ${modelName} verification failed:`, err.message);
                throw err;
            }
        }

        console.log('✨ Database synchronization completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Synchronization failed:', error);
        process.exit(1);
    }
};

// Add warning for force sync
if (process.argv.includes('--force')) {
    console.warn('⚠️ WARNING: Force sync will drop all tables! ⚠️');
    console.warn('You have 5 seconds to cancel (Ctrl+C)');
    console.warn('Database:', process.env.DB_NAME);
    setTimeout(syncDatabase, 5000);
} else {
    syncDatabase();
}