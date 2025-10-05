'use strict';

const path = require('path');

const DEV_SEEDERS = [
  '../20250428080912-create-default-curriculum',
  '../20250825090000-reset-students-data',
  '../20250101000000-seed-internship-evaluation-student32',
  '../20250511010000-seed-student32-logbook-completion',
  '../20250511145000-approve-all-logbooks',
  '../20250511200000-seed-student42-logbook',
  '../20250511220000-approve-student42-logbooks',
  '../20250523050918-20250523000000-seed-student155-logbook',
  '../20250523052026-seed-student32-logbook',
  '../20250630064320-seed-student32-logbook-56-06-68',
  '../20250630065608-seed-internship-reflections',
  '../20250715140110-seed-student-179',
  '../20250715141952-seed-logbook-studentId-51',
  '../20250716044019-seed-man-logbook',
  '../20250823091500-seed-student31-logbook',
  '../20250922120000-demo-topic-exam-projects',
  '../20250922123000-scenario-topic-exam-projects',
  '../20251004093000-seed-meeting-logs-project-types'
];

async function runSequentially(queryInterface, Sequelize, method) {
  for (const relativePath of DEV_SEEDERS) {
    const seederModule = require(path.resolve(__dirname, relativePath));

    if (typeof seederModule[method] !== 'function') {
      console.warn(`[seed:dev] ข้าม ${relativePath} เพราะไม่มีเมธอด ${method}`);
      continue;
    }

    console.log(`[seed:dev] ${method} -> ${relativePath}`);
    await seederModule[method](queryInterface, Sequelize);
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await runSequentially(queryInterface, Sequelize, 'up');
  },

  async down(queryInterface, Sequelize) {
    const reversed = [...DEV_SEEDERS].reverse();
    for (const relativePath of reversed) {
      const seederModule = require(path.resolve(__dirname, relativePath));
      if (typeof seederModule.down !== 'function') {
        console.warn(`[seed:dev] ข้าม rollback ของ ${relativePath}`);
        continue;
      }
      console.log(`[seed:dev] rollback -> ${relativePath}`);
      await seederModule.down(queryInterface, Sequelize);
    }
  }
};
