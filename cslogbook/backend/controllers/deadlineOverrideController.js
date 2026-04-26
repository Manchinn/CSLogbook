/**
 * Deadline Override Controller (Phase 2)
 *
 * Routes (mounted under /api/admin/important-deadlines/:id/overrides):
 *   GET    /                — list overrides for a deadline
 *   POST   /                — grant override (body: studentId, extendedUntil?, bypassLock?, reason?)
 *   DELETE /:studentId      — revoke override
 *
 * สิทธิ์: deadlineOverride.{view|grant|revoke} จาก policies/permissions.js
 */

const logger = require('../utils/logger');
const overrideService = require('../services/deadlineOverrideService');
const { ImportantDeadline } = require('../models');

function parsePositiveInt(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function ensureDeadlineExists(deadlineId) {
  const deadline = await ImportantDeadline.findByPk(deadlineId);
  return deadline || null;
}

exports.list = async (req, res) => {
  try {
    const deadlineId = parsePositiveInt(req.params.id);
    if (!deadlineId) {
      return res.status(400).json({ success: false, message: 'invalid deadline id' });
    }

    const deadline = await ensureDeadlineExists(deadlineId);
    if (!deadline) {
      return res.status(404).json({ success: false, message: 'ไม่พบกำหนดการ' });
    }

    const overrides = await overrideService.listOverridesByDeadline(deadlineId);
    return res.json({ success: true, data: overrides });
  } catch (err) {
    logger.error('deadlineOverrideController.list error', { error: err.message });
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.grant = async (req, res) => {
  try {
    const deadlineId = parsePositiveInt(req.params.id);
    if (!deadlineId) {
      return res.status(400).json({ success: false, message: 'invalid deadline id' });
    }

    const deadline = await ensureDeadlineExists(deadlineId);
    if (!deadline) {
      return res.status(404).json({ success: false, message: 'ไม่พบกำหนดการ' });
    }

    const { studentId, extendedUntil, bypassLock, reason } = req.body || {};
    const sid = parsePositiveInt(studentId);
    if (!sid) {
      return res.status(400).json({ success: false, message: 'studentId is required' });
    }

    let extDate = null;
    if (extendedUntil) {
      const d = new Date(extendedUntil);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ success: false, message: 'invalid extendedUntil' });
      }
      extDate = d;
    }

    const bypass = Boolean(bypassLock);
    if (!extDate && !bypass) {
      return res.status(400).json({
        success: false,
        message: 'ต้องระบุ extendedUntil หรือ bypassLock อย่างน้อยหนึ่งอย่าง'
      });
    }

    const grantedBy = req.user?.userId || req.user?.id;
    if (!grantedBy) {
      return res.status(401).json({ success: false, message: 'unauthorized' });
    }

    const row = await overrideService.grantOverride({
      studentId: sid,
      deadlineId,
      extendedUntil: extDate,
      bypassLock: bypass,
      grantedBy,
      reason: reason || null
    });

    return res.status(201).json({
      success: true,
      data: {
        studentDeadlineStatusId: row.get('studentDeadlineStatusId'),
        studentId: row.get('studentId'),
        importantDeadlineId: row.get('importantDeadlineId'),
        extendedUntil: row.get('extendedUntil'),
        bypassLock: row.get('bypassLock'),
        grantedBy: row.get('grantedBy'),
        grantedAt: row.get('grantedAt'),
        reason: row.get('reason')
      }
    });
  } catch (err) {
    logger.error('deadlineOverrideController.grant error', { error: err.message });
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.revoke = async (req, res) => {
  try {
    const deadlineId = parsePositiveInt(req.params.id);
    const studentId = parsePositiveInt(req.params.studentId);
    if (!deadlineId || !studentId) {
      return res.status(400).json({ success: false, message: 'invalid deadline id หรือ studentId' });
    }

    const revokedBy = req.user?.userId || req.user?.id;
    if (!revokedBy) {
      return res.status(401).json({ success: false, message: 'unauthorized' });
    }

    const reason = req.body?.reason || req.query?.reason || null;
    const row = await overrideService.revokeOverride({
      studentId,
      deadlineId,
      revokedBy,
      reason
    });

    if (!row) {
      return res.status(404).json({ success: false, message: 'ไม่พบ override ที่ active' });
    }

    return res.json({
      success: true,
      data: {
        studentDeadlineStatusId: row.get('studentDeadlineStatusId'),
        revokedAt: row.get('revokedAt')
      }
    });
  } catch (err) {
    logger.error('deadlineOverrideController.revoke error', { error: err.message });
    return res.status(400).json({ success: false, message: err.message });
  }
};
