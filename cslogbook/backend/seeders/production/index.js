'use strict';

const path = require('path');

const PRODUCTION_SEEDERS = [
  '../20250428081219-create-default-curriculum',
  '../20250513000001-initial-internship-steps',
  '../20250513000002-initial-project-steps',
  '../20250930121000-update-project1-workflow-steps',
  '../20250528101244-seed-notification-settings-default'
];

async function runSequentially(queryInterface, Sequelize, method) {
  for (const relativePath of PRODUCTION_SEEDERS) {
    const seederModule = require(path.resolve(__dirname, relativePath));

    if (typeof seederModule[method] !== 'function') {
      console.warn(`[seed:prod] ข้าม ${relativePath} เพราะไม่มีเมธอด ${method}`);
      continue;
    }

    console.log(`[seed:prod] เริ่ม ${method} -> ${relativePath}`);
    // ใส่คอมเมนต์ภาษาไทยเพื่อให้ทีมเข้าใจลำดับการทำงาน
    await seederModule[method](queryInterface, Sequelize);
    console.log(`[seed:prod] สำเร็จ ${method} -> ${relativePath}`);
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await runSequentially(queryInterface, Sequelize, 'up');
  },

  async down(queryInterface, Sequelize) {
    const reversed = [...PRODUCTION_SEEDERS].reverse();
    for (const relativePath of reversed) {
      const seederModule = require(path.resolve(__dirname, relativePath));
      if (typeof seederModule.down !== 'function') {
        console.warn(`[seed:prod] ข้ามการ rollback -> ${relativePath}`);
        continue;
      }
      console.log(`[seed:prod] rollback -> ${relativePath}`);
      await seederModule.down(queryInterface, Sequelize);
    }
  }
};
