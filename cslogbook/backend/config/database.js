const { Sequelize } = require('sequelize');
const validateEnv = require('../utils/validateEnv');
const logger = require('../utils/logger');

const isJest = Boolean(process.env.JEST_WORKER_ID);
const isTestEnv = isJest || process.env.NODE_ENV === 'test';

const buildSequelizeInstance = () => {
    if (isTestEnv) {
        // สำหรับ Jest ให้ใช้ SQLite in-memory เพื่อหลีกเลี่ยงการเปิด socket ค้างกับ MySQL
        return new Sequelize('sqlite::memory:', {
            logging: false
        });
    }

    return new Sequelize({
        dialect: "mysql",
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 3306,
        username: process.env.DB_USER || 'root' ,
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'cslogbook_local_dev',
        logging: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        timezone: '+07:00',
        define: {
            timestamps: true,
            underscored: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        },
        dialectOptions: {
            connectTimeout: 60000,
            charset: 'utf8mb4'
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
};

const sequelize = buildSequelizeInstance();

if (!isTestEnv) {
    sequelize.afterConnect(() => {
      console.log('New connection established');
    });

    sequelize.beforeDisconnect(() => {
      console.log('Connection terminated');
    });
}

const initializeDatabase = async () => {
    try {
        // Test connection only
        await sequelize.authenticate();
        
        // Set charset
        await sequelize.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');

        logger.info('Database connection established successfully');
        return sequelize;
    } catch (error) {
        logger.warn('Database connection failed. This is normal if database is not set up yet.');
        logger.warn('Error details:', error.message);
        return null;
    }
};

// Simplified test connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        return true;
    } catch (error) {
        logger.error('Test connection failed:', error);
        return false;
    }
};

module.exports = {
    sequelize,
    Sequelize,
    initializeDatabase,
    testConnection
};