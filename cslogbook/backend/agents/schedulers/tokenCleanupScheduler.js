/**
 * Scheduler: ลบ ApprovalToken ที่หมดอายุแล้ว
 * เกณฑ์: expiresAt < NOW
 * Schedule: ทุกวัน ตี 3 (default) — configurable via TOKEN_CLEANUP_CRON env
 */

const cron = require('node-cron');
const { Op } = require('sequelize');
const logger = require('../../utils/logger');
const { ApprovalToken } = require('../../models');

const SCHEDULE = process.env.TOKEN_CLEANUP_CRON || '0 3 * * *';
let cronTask = null;

async function cleanupOnce() {
  try {
    const now = new Date();
    const result = await ApprovalToken.destroy({
      where: {
        expiresAt: { [Op.lt]: now }
      }
    });

    if (result > 0) {
      logger.info(`[TokenCleanupScheduler] ลบ expired tokens ${result} รายการ`);
    } else {
      logger.info('[TokenCleanupScheduler] ไม่มี expired tokens ที่ต้องลบรอบนี้');
    }

    return { deleted: result };
  } catch (error) {
    logger.error('[TokenCleanupScheduler] Error:', error);
    throw error;
  }
}

function scheduleTokenCleanup() {
  if (cronTask) {
    logger.warn('[TokenCleanupScheduler] Already scheduled, skipping');
    return;
  }
  cronTask = cron.schedule(SCHEDULE, () => {
    logger.info(`[TokenCleanupScheduler] เริ่มลบ expired tokens (schedule: ${SCHEDULE})`);
    cleanupOnce().catch(err => logger.error('[TokenCleanupScheduler] Unhandled:', err));
  });
  logger.info(`[TokenCleanupScheduler] Scheduled: ${SCHEDULE}`);
}

function stopTokenCleanup() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('[TokenCleanupScheduler] Stopped');
  }
}

module.exports = { cleanupOnce, scheduleTokenCleanup, stopTokenCleanup };
