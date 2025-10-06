/**
 * Scheduler: ลบ (purge) โครงงานที่สอบหัวข้อไม่ผ่าน นักศึกษากดรับทราบผลแล้ว และเก็บถาวรเกิน N วัน
 * เกณฑ์: examResult = 'failed' AND status='archived' AND studentAcknowledgedAt != null AND archivedAt < NOW - RETENTION_DAYS
 * หมายเหตุ: เลือกใช้การ hard delete แบบ manual cascade (ลบตารางลูกหลัก ๆ) เพื่อไม่ทิ้ง orphan
 */

const cron = require('node-cron');
const { Op } = require('sequelize');
const logger = require('../../utils/logger');
const { ProjectDocument, ProjectMember, ProjectTrack } = require('../../models');

// โหลดแบบ lazy เฉพาะตอน purge เพื่อลด circular require
function loadExtraModels() {
  const { ProjectMilestone, ProjectArtifact, Meeting } = require('../../models');
  return { ProjectMilestone, ProjectArtifact, Meeting };
}

const RETENTION_DAYS = parseInt(process.env.PROJECT_FAILED_PURGE_DAYS || '7', 10); // ค่าเริ่มต้น 7 วัน
const SCHEDULE = process.env.PROJECT_FAILED_PURGE_CRON || '15 2 * * *'; // ดีฟอลต์รันทุกวัน 02:15 น. เวลาไทย

async function purgeOnce() {
  try {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000);
    // หา project ที่เข้าเกณฑ์
    const targets = await ProjectDocument.findAll({
      where: {
        examResult: 'failed',
        status: 'archived',
        studentAcknowledgedAt: { [Op.ne]: null },
        archivedAt: { [Op.lte]: cutoff }
      },
      attributes: ['projectId','projectCode','archivedAt','studentAcknowledgedAt']
    });
    if (!targets.length) {
      logger.info(`[ProjectPurgeScheduler] ไม่มีโครงงานที่ต้อง purge รอบนี้ (retention=${RETENTION_DAYS}d)`);
      return { purged: 0 };
    }

    const ids = targets.map(p => p.projectId);
    const { ProjectMilestone, ProjectArtifact, Meeting } = loadExtraModels();

    logger.info(`[ProjectPurgeScheduler] เริ่ม purge โครงงาน ${ids.length} รายการ: ${ids.join(',')}`);

    // ลบแบบ manual cascade (ตามที่ระบบยังไม่ได้ประกาศ FK cascade ทุกตัว) – ใช้ transaction ต่อ project เพื่อจำกัดผลกระทบ
    let success = 0;
    for (const proj of targets) {
      const t = await ProjectDocument.sequelize.transaction();
      try {
        const pid = proj.projectId;
        await ProjectMember.destroy({ where: { projectId: pid }, transaction: t });
        await ProjectTrack.destroy({ where: { projectId: pid }, transaction: t });
        await ProjectMilestone.destroy({ where: { projectId: pid }, transaction: t });
        await ProjectArtifact.destroy({ where: { projectId: pid }, transaction: t });
        await Meeting.destroy({ where: { projectId: pid }, transaction: t });
        await ProjectDocument.destroy({ where: { projectId: pid }, transaction: t });
        await t.commit();
        success++;
        logger.info('[ProjectPurgeScheduler] Purged project', { projectId: pid, projectCode: proj.projectCode });
      } catch (err) {
        await t.rollback();
        logger.error('[ProjectPurgeScheduler] Purge ล้มเหลว', { projectId: proj.projectId, error: err.message });
      }
    }

    logger.info(`[ProjectPurgeScheduler] สรุป purge สำเร็จ ${success}/${targets.length}`);
    return { purged: success, total: targets.length };
  } catch (error) {
    logger.error('[ProjectPurgeScheduler] เกิดข้อผิดพลาดหลักระหว่าง purge', { error: error.message });
    return { purged: 0, error: error.message };
  }
}

function scheduleProjectPurge() {
  cron.schedule(SCHEDULE, () => {
    logger.info(`[ProjectPurgeScheduler] เริ่มงาน purge ตาม schedule (${SCHEDULE}, retention=${RETENTION_DAYS}d)`);
    purgeOnce().catch(err => logger.error('[ProjectPurgeScheduler] purgeOnce throw', { error: err.message }));
  }, { timezone: 'Asia/Bangkok' });
  logger.info(`[ProjectPurgeScheduler] ตั้ง cron สำเร็จ (${SCHEDULE})`);
  // อาจ run ครั้งแรกเมื่อเริ่มระบบ (optional) – เปิดใช้ถ้าต้องการ:
  if (process.env.PROJECT_FAILED_PURGE_RUN_ON_START === '1') {
    purgeOnce();
  }
}

module.exports = { scheduleProjectPurge, purgeOnce };
