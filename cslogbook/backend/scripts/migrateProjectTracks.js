#!/usr/bin/env node
/**
 * สคริปต์ migrate ค่าจากคอลัมน์เดิม project_documents.track (string/comma separated/label) -> project_tracks (codes)
 * ใช้ครั้งเดียว แล้วสามารถพิจารณาลบคอลัมน์ track เดิมในการ migration ภายหลัง
 * วิธีรัน:  node scripts/migrateProjectTracks.js  (ภายใต้โฟลเดอร์ backend)
 */
const { sequelize } = require('../config/database');
const { ProjectDocument, ProjectTrack } = require('../models');
const { Op } = require('sequelize');

// Mapping label -> code
const LABEL_TO_CODE = {
  'Network & Cyber Security': 'NETSEC',
  'Mobile and Web Technology': 'WEBMOBILE',
  'Mobile and Web Technology (Web / Mobile Application)': 'WEBMOBILE',
  'Smart Technology': 'SMART',
  'Artificial Intelligence': 'AI',
  'Games & Multimedia': 'GAMEMEDIA'
};

async function migrate() {
  console.log('--- Start migrate project tracks ---');
  const tx = await sequelize.transaction();
  try {
    const projects = await ProjectDocument.findAll({
      where: { track: { [Op.ne]: null } },
      transaction: tx,
      lock: tx.LOCK.UPDATE
    });

    console.log(`Found ${projects.length} project(s) with legacy track column.`);

    let migratedCount = 0;
    for (const p of projects) {
      if (!p.track) continue;
      // แยกค่า: อนุญาตคั่นด้วย comma หรือ semicolon
      const rawParts = p.track.split(/[,;]/).map(s => s.trim()).filter(Boolean);
      const codes = [...new Set(rawParts.map(label => LABEL_TO_CODE[label] || null).filter(Boolean))];
      if (!codes.length) {
        console.log(`[Skip] projectId=${p.projectId} no valid codes derived from '${p.track}'`);
        continue;
      }
      // ลบของเก่าใน project_tracks (ถ้ามี) แล้ว insert ใหม่
      await ProjectTrack.destroy({ where: { projectId: p.projectId }, transaction: tx });
      await ProjectTrack.bulkCreate(codes.map(code => ({ projectId: p.projectId, trackCode: code })), { transaction: tx });
      migratedCount++;
      console.log(`[OK] projectId=${p.projectId} tracks => ${codes.join(',')}`);
    }

    await tx.commit();
    console.log(`--- Done. Migrated ${migratedCount} project(s). ---`);
  } catch (e) {
    await tx.rollback();
    console.error('Migration failed:', e.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

migrate();
