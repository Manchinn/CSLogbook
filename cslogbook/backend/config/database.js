const { Sequelize } = require('sequelize');
const validateEnv = require('../utils/validateEnv');
const logger = require('../utils/logger');

const sequelize = new Sequelize({
    dialect: "mysql",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
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

sequelize.afterConnect((connection) => {
  console.log('New connection established');
});

sequelize.beforeDisconnect((connection) => {
  console.log('Connection terminated');
});

const initializeDatabase = async () => {
    // Validate database environment variables
    if (!validateEnv('database')) {
        logger.error('Database configuration is incomplete. Please check your .env file.');
        process.exit(1);
    }

    try {
        // Test connection only
        await sequelize.authenticate();
        
        // Set charset
        await sequelize.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');

        logger.info('Database connection established successfully');
        return sequelize;
    } catch (error) {
        logger.error('Database initialization error:', error);
        throw error;
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