const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const checkModels = async () => {
    try {
        console.log('🔍 Checking database models...');
        
        // Get all models
        const models = Object.keys(sequelize.models);
        
        console.log('📋 Found models:', models);
        
        // Check each model's attributes
        for (const modelName of models) {
            const model = sequelize.models[modelName];
            const attributes = Object.keys(model.rawAttributes);
            
            console.log(`\n📌 ${modelName} attributes:`, attributes);
            
            // Check associations
            if (model.associations) {
                console.log(`🔗 ${modelName} associations:`, 
                    Object.keys(model.associations));
            }
        }
        
        console.log('\n✅ Model check completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Model check failed:', error);
        process.exit(1);
    }
};

checkModels();