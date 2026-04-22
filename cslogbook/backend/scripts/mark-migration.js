// scripts/mark-migration.js
// ใช้สำหรับ mark migration ที่ column มีอยู่แล้วในฐานข้อมูลว่า "executed"
require('dotenv').config({ path: '.env.development' });
const { Sequelize } = require('sequelize');
const config = require('../config/config.js').development;

const seq = new Sequelize(config.database, config.username, config.password, {
  ...config,
  logging: false,
});

const names = process.argv.slice(2);
if (!names.length) {
  console.error('Usage: node scripts/mark-migration.js <migration-name>');
  process.exit(1);
}

(async () => {
  for (const name of names) {
    await seq.query(`INSERT IGNORE INTO SequelizeMeta (name) VALUES ('${name}')`);
    console.log(`✅ Marked as executed: ${name}`);
  }
  await seq.close();
})().catch(e => { console.error(e.message); process.exit(1); });
