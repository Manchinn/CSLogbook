'use strict';

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

const models = {};

// อ่านไฟล์ทั้งหมดในโฟลเดอร์ models
fs.readdirSync(__dirname)
    .filter(file => {
        return (
            file.indexOf('.') !== 0 &&
            file !== 'index.js' &&
            file.slice(-3) === '.js'
        );
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize);
        models[model.name] = model;
    });

// สร้าง associations ระหว่าง models
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

module.exports = {
    sequelize,
    ...models
};
