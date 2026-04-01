/**
 * Scheduler: Partial soft-delete โครงงานที่สอบหัวข้อไม่ผ่าน
 * เกณฑ์: examResult = 'failed' AND status='archived' AND studentAcknowledgedAt != null AND archivedAt < NOW - RETENTION_DAYS
 *
 * Soft-delete strategy:
 * - เก็บไว้ (audit trail + report stats): ProjectDocument, ProjectWorkflowState, ProjectExamResult, ProjectDefenseRequest, ProjectMember
 * - ลบออก (bulky data): ProjectArtifact, ProjectMilestone, ProjectTrack, Meeting
 * - Mark purgedAt บน ProjectDocument เพื่อระบุว่าข้อมูลบางส่วนถูกล้างแล้ว
 */

const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const logger = require('../../utils/logger');
const { ProjectDocument, ProjectTrack } = require('../../models');

function loadExtraModels() {
  const { ProjectMilestone, ProjectArtifact, Meeting } = require('../../models');
  return { ProjectMilestone, ProjectArtifact, Meeting };
}

const RETENTION_DAYS = parseInt(process.env.PROJECT_FAILED_PURGE_DAYS || '30', 10); // เพิ่มเป็น 30 วัน (จากเดิม 7)
const SCHEDULE = process.env.PROJECT_FAILED_PURGE_CRON || '15 2 * * *';

async function purgeOnce() {
  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000);
    const targets = await ProjectDocument.findAll({
      where: {
        examResult: 'failed',
        status: 'archived',
        studentAcknowledgedAt: { [Op.ne]: null },
        archivedAt: { [Op.lte]: cutoff },
        purgedAt: { [Op.is]: null } // ยังไม่เคย purge
      },
      attributes: ['projectId', 'projectCode', 'archivedAt', 'studentAcknowledgedAt']
    });
    if (!targets.length) {
      logger.info(`[ProjectPurgeScheduler] ไม่มีโครงงานที่ต้อง purge รอบนี้ (retention=${RETENTION_DAYS}d)`);
      return { purged: 0 };
    }

    const { ProjectMilestone, ProjectArtifact, Meeting } = loadExtraModels();

    logger.info(`[ProjectPurgeScheduler] เริ่ม partial purge ${targets.length} โครงงาน: ${targets.map(p => p.projectId).join(',')}`);

    let success = 0;
    for (const proj of targets) {
      const pid = proj.projectId;

      const t = await ProjectDocument.sequelize.transaction();
      try {
        // ลบ bulky DB data (ไม่รวม Artifact — จัดการแยกพร้อม file deletion)
        await ProjectMilestone.destroy({ where: { projectId: pid }, transaction: t });
        await ProjectTrack.destroy({ where: { projectId: pid }, transaction: t });
        await Meeting.destroy({ where: { projectId: pid }, transaction: t });

        // Mark purgedAt แทนการลบ ProjectDocument
        await ProjectDocument.update(
          { purgedAt: new Date() },
          { where: { projectId: pid }, transaction: t }
        );

        await t.commit();
        success++;
        logger.info('[ProjectPurgeScheduler] Partial purge completed', { projectId: pid, projectCode: proj.projectCode });
      } catch (err) {
        await t.rollback();
        logger.error('[ProjectPurgeScheduler] Purge ล้มเหลว', { projectId: pid, error: err.message });
      }
    }

    // Phase 2: ลบ Artifact files + records ทีละตัว (retryable — ถ้า file ลบไม่ได้ record ยังอยู่)
    await cleanupArtifactFiles(ProjectArtifact);

    logger.info(`[ProjectPurgeScheduler] สรุป purge สำเร็จ ${success}/${targets.length}`);
    return { purged: success, total: targets.length };
  } catch (error) {
    logger.error('[ProjectPurgeScheduler] เกิดข้อผิดพลาดหลักระหว่าง purge', { error: error.message });
    return { purged: 0, error: error.message };
  }
}

/**
 * ลบ Artifact files จาก disk แล้วลบ DB record ทีละตัว
 * ถ้า file ลบไม่ได้ (permission/locked) → DB record ยังอยู่ → retry รอบถัดไป
 */
async function cleanupArtifactFiles(ProjectArtifact) {
  try {
    // หา artifacts ของ projects ที่ purge แล้ว (purgedAt != null) แต่ยังมี artifact record ค้างอยู่
    const orphanedArtifacts = await ProjectArtifact.findAll({
      include: [{
        model: ProjectDocument,
        as: 'project',
        where: { purgedAt: { [Op.ne]: null } },
        attributes: ['projectId']
      }],
      attributes: ['id', 'filePath', 'projectId']
    });

    if (!orphanedArtifacts.length) return;

    let deleted = 0;
    let failed = 0;
    for (const art of orphanedArtifacts) {
      // ลบไฟล์จาก disk ก่อน
      if (art.filePath) {
        const fullPath = path.resolve(process.cwd(), art.filePath);
        try {
          fs.unlinkSync(fullPath);
        } catch (unlinkErr) {
          if (unlinkErr.code !== 'ENOENT') {
            // File ยังลบไม่ได้ → เก็บ record ไว้ retry รอบหน้า
            failed++;
            logger.warn('[ProjectPurgeScheduler] ลบไฟล์ไม่สำเร็จ (จะ retry รอบถัดไป)', {
              artifactId: art.id, filePath: fullPath, error: unlinkErr.message
            });
            continue;
          }
          // ENOENT = ไฟล์หายไปแล้ว → ลบ record ได้
        }
      }

      // File ลบสำเร็จ (หรือไม่มีไฟล์) → ลบ DB record
      await art.destroy();
      deleted++;
    }

    if (deleted > 0 || failed > 0) {
      logger.info(`[ProjectPurgeScheduler] Artifact cleanup: deleted=${deleted}, failed=${failed} (will retry)`);
    }
  } catch (error) {
    logger.error('[ProjectPurgeScheduler] Artifact cleanup error:', error.message);
  }
}

let cronTask = null;

function scheduleProjectPurge() {
  cronTask = cron.schedule(SCHEDULE, () => {
    logger.info(`[ProjectPurgeScheduler] เริ่มงาน purge ตาม schedule (${SCHEDULE}, retention=${RETENTION_DAYS}d)`);
    purgeOnce().catch(err => logger.error('[ProjectPurgeScheduler] purgeOnce throw', { error: err.message }));
  }, { timezone: 'Asia/Bangkok' });
  logger.info(`[ProjectPurgeScheduler] ตั้ง cron สำเร็จ (${SCHEDULE})`);
  if (process.env.PROJECT_FAILED_PURGE_RUN_ON_START === '1') {
    purgeOnce();
  }
}

function stopProjectPurge() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
}

module.exports = { scheduleProjectPurge, stopProjectPurge, purgeOnce };
