const importantDeadlineService = require('../services/importantDeadlineService');
const { listActiveOverridesForStudent } = require('../services/deadlineOverrideService');
const { computeStatus, computeDaysLeft } = require('../utils/deadlineStatusUtil');
const { Document } = require('../models');
const { ExcelExportBuilder, formatThaiDate } = require('../utils/excelExportBuilder');
const logger = require('../utils/logger');

/**
 * ปรับ mapped deadline object ให้สะท้อน per-student override
 * - bypassLock=true → lockAfterDeadline=false, allowLate=true, locked=false
 * - extendedUntil > deadlineAt → ขยาย deadlineAt + effectiveDeadlineAt + grace=0
 * - แนบ bypassActive/bypassReason สำหรับ frontend แสดง badge ภายหลัง
 *
 * Mutates obj และคืน obj
 */
function applyOverrideToMappedDeadline(obj, override, now = new Date()) {
  if (!obj || !override) return obj;

  if (override.extendedUntil) {
    const ext = new Date(override.extendedUntil);
    const origMs = obj.deadlineAt ? new Date(obj.deadlineAt).getTime() : 0;
    if (ext.getTime() > origMs) {
      obj.deadlineAt = override.extendedUntil;
      obj.effectiveDeadlineAt = override.extendedUntil;
      obj.gracePeriodMinutes = 0;
      obj.locked = obj.lockAfterDeadline && now.getTime() > ext.getTime();
      const local = new Date(ext.getTime() + 7 * 60 * 60 * 1000);
      const pad = (n) => n.toString().padStart(2, '0');
      obj.deadlineDate = `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;
      obj.deadlineTime = `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`;
    }
  }

  if (override.bypassLock) {
    obj.lockAfterDeadline = false;
    obj.allowLate = true;
    obj.locked = false;
  }

  obj.bypassActive = true;
  obj.bypassReason = override.reason || null;
  obj.bypassExtendedUntil = override.extendedUntil || null;
  obj.bypassLockApplied = Boolean(override.bypassLock);
  return obj;
}

const resolveDocumentCreatedAttribute = () => {
  const attrs = Document?.rawAttributes;
  if (attrs) {
    if (attrs.createdAt) return 'createdAt';
    if (attrs.created_at) return 'created_at';
  }
  return 'createdAt';
};

// ดึงกำหนดการสำคัญทั้งหมด (สามารถกรองด้วยปีการศึกษา/ภาคเรียน)
// Phase publish: ถ้าไม่ส่ง includeAll=true จะกรองเฉพาะที่เผยแพร่แล้ว (isPublished=true หรือ publishAt <= NOW)
exports.getAll = async (req, res) => {
  try {
    const { academicYear, semester, includeAll } = req.query;
    const deadlines = await importantDeadlineService.getAll({ academicYear, semester });
    const now = new Date();
    const filtered = includeAll === 'true'
      ? deadlines
      : deadlines.filter(d => {
          // ถ้าไม่มีระบบ publishAt/isPublished (row เก่า) ให้ผ่าน
          if (d.isPublished === undefined && d.publishAt === undefined) return true;
          // เผยแพร่โดยตรง
          if (d.isPublished) return true;
          // มี publishAt และถึงเวลาแล้ว
          if (d.publishAt && new Date(d.publishAt) <= now) return true;
          return false;
        });
    // enrich deadlineDate/deadlineTime สำหรับ frontend (Asia/Bangkok)
  const enriched = filtered.map(d => {
      const obj = d.toJSON();
      if (obj.deadlineAt) {
        const utc = new Date(obj.deadlineAt);
        const localMs = utc.getTime() + (7 * 60 * 60 * 1000);
        const ld = new Date(localMs);
        const pad = (n) => n.toString().padStart(2,'0');
        const dateStr = `${ld.getUTCFullYear()}-${pad(ld.getUTCMonth()+1)}-${pad(ld.getUTCDate())}`;
        const timeStr = `${pad(ld.getUTCHours())}:${pad(ld.getUTCMinutes())}:${pad(ld.getUTCSeconds())}`;
        obj.deadlineDate = dateStr;
        obj.deadlineTime = timeStr;
      }
      return obj;
    });
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy/Alias translator สำหรับ payload (รองรับ deadlineDate+deadlineTime / relatedTo alias)
function translateLegacyPayload(body) {
  const out = { ...body };
  // relatedTo alias (deprecated values)
  const relatedAlias = {
    project: 'project', // คงเดิม (ยังรองรับ)
    general: 'general',
    project1: 'project1',
    project2: 'project2',
    internship: 'internship'
  };
  if (out.relatedTo && relatedAlias[out.relatedTo]) {
    out.relatedTo = relatedAlias[out.relatedTo];
  }
  // รองรับกรณี client ส่ง date/time ในชื่อ legacy อยู่แล้ว importantDeadlineService.create รองรับ
  // (ที่นี่เพียงเพิ่ม warning header)
  return out;
}

// เพิ่มกำหนดการใหม่ (พร้อม legacy translate)
exports.create = async (req, res) => {
  try {
    const translated = translateLegacyPayload(req.body);
    const deadline = await importantDeadlineService.createWithMapping(translated);
    
    const d = deadline.deadlineAt ? new Date(deadline.deadlineAt) : null;
    let local = null;
    if (d) {
      // แปลง UTC -> Asia/Bangkok (+07:00)
      const localMs = d.getTime() + (7 * 60 * 60 * 1000);
      const ld = new Date(localMs);
      const pad = (n) => n.toString().padStart(2,'0');
      const dateStr = `${ld.getUTCFullYear()}-${pad(ld.getUTCMonth()+1)}-${pad(ld.getUTCDate())}`;
      const timeStr = `${pad(ld.getUTCHours())}:${pad(ld.getUTCMinutes())}:${pad(ld.getUTCSeconds())}`;
      local = { deadlineDate: dateStr, deadlineTime: timeStr };
    }
    res.status(201).json({ success: true, data: { ...deadline.toJSON(), ...local } });
  } catch (error) {
  logger.error('[importantDeadlineController.create] Error:', error.message, error.stack);
  res.status(400).json({ success: false, message: error.message });
  }
};

// แก้ไขกำหนดการ (รองรับ legacy translate)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const translated = translateLegacyPayload(req.body);
    const deadline = await importantDeadlineService.update(id, translated);
    const d = deadline.deadlineAt ? new Date(deadline.deadlineAt) : null;
    let local = null;
    if (d) {
      const localMs = d.getTime() + (7 * 60 * 60 * 1000);
      const ld = new Date(localMs);
      const pad = (n) => n.toString().padStart(2,'0');
      const dateStr = `${ld.getUTCFullYear()}-${pad(ld.getUTCMonth()+1)}-${pad(ld.getUTCDate())}`;
      const timeStr = `${pad(ld.getUTCHours())}:${pad(ld.getUTCMinutes())}:${pad(ld.getUTCSeconds())}`;
      local = { deadlineDate: dateStr, deadlineTime: timeStr };
    }
    res.json({ success: true, data: { ...deadline.toJSON(), ...local } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ลบกำหนดการ
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await importantDeadlineService.remove(id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}; 

// PATCH ปรับ policy การรับเอกสาร
exports.updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const deadline = await importantDeadlineService.updatePolicy(id, req.body);
    res.json({ success: true, data: deadline });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await importantDeadlineService.getStats(id);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const pad = (n) => n.toString().padStart(2, '0');

const toLocalParts = (dateTime) => {
  if (!dateTime) return null;
  const local = new Date(new Date(dateTime).getTime() + 7 * 60 * 60 * 1000);
  return {
    date: `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`,
    time: `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`,
  };
};

const isPublishedForAudience = (deadline, now = new Date()) => {
  if (deadline.isPublished === undefined && deadline.publishAt === undefined) {
    return true;
  }
  if (deadline.isPublished) {
    return true;
  }
  if (deadline.publishAt && new Date(deadline.publishAt) <= now) {
    return true;
  }
  return false;
};

const isVisibleForTeacher = (deadline) => {
  const scope = deadline.visibilityScope || 'ALL';
  return ['ALL', 'INTERNSHIP_ONLY', 'PROJECT_ONLY'].includes(scope);
};

const buildSubmissionFromDocument = (doc, effectiveDeadlineAt, deadlineObj) => {
  const submission = {
    submitted: false,
    submittedAt: null,
    late: false,
    afterGrace: false,
    status: null,
  };

  if (!doc) {
    return submission;
  }

  // ตรวจสอบว่าส่งเอกสารแล้วหรือไม่
  const submittedStatuses = ['approved', 'completed', 'supervisor_evaluated', 'acceptance_approved', 'referral_ready', 'referral_downloaded', 'submitted'];
  submission.submitted = !!doc.submittedAt || submittedStatuses.includes(doc.status);
  submission.submittedAt = doc.submittedAt ? doc.submittedAt : (doc.created_at ? doc.created_at : null);
  submission.status = doc.status || null;

  // คำนวณสถานะการส่งช้า
  if (submission.submittedAt && effectiveDeadlineAt) {
    const submittedMs = new Date(submission.submittedAt).getTime();
    const effMs = new Date(effectiveDeadlineAt).getTime();
    
    // คำนวณ grace period
    let graceEndMs = effMs;
    if (deadlineObj.allowLate && deadlineObj.gracePeriodMinutes) {
      graceEndMs = effMs + deadlineObj.gracePeriodMinutes * 60 * 1000;
    }
    
    // ตรวจสอบการส่งช้า
    if (submittedMs > effMs) {
      submission.late = true;
    }
    
    // ตรวจสอบการส่งหลัง grace period
    if (submittedMs > graceEndMs && deadlineObj.lockAfterDeadline) {
      submission.afterGrace = true;
    }
  } else if (doc.isLate !== undefined) {
    // ใช้ค่า isLate จาก document ถ้ามี
    submission.late = !!doc.isLate;
  }

  return submission;
};

const mapDeadlineForResponse = (deadline, { document = null, now = new Date() } = {}) => {
  const obj = deadline.toJSON();

  if (obj.deadlineAt) {
    const utc = new Date(obj.deadlineAt);
    const local = new Date(utc.getTime() + 7 * 60 * 60 * 1000);
    obj.deadlineDate = `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;
    obj.deadlineTime = `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`;
  }

  if (obj.windowStartAt && obj.windowEndAt) {
    const start = toLocalParts(obj.windowStartAt);
    const end = toLocalParts(obj.windowEndAt);
    obj.windowStartDate = start?.date;
    obj.windowStartTime = start?.time;
    obj.windowEndDate = end?.date;
    obj.windowEndTime = end?.time;
    obj.isWindow = true;
  } else {
    obj.isWindow = false;
  }

  obj.effectiveDeadlineAt = obj.windowEndAt || obj.deadlineAt || null;
  const submission = buildSubmissionFromDocument(document, obj.effectiveDeadlineAt, obj);
  obj.submission = submission;

  const { status, locked } = computeStatus(obj, submission, now);
  obj.status = status;
  obj.locked = locked;
  obj.daysLeft = computeDaysLeft(obj, now);

  return obj;
};

// สำหรับนักศึกษา: ดึง deadline ที่จะถึงภายใน X วัน (default 7)
module.exports.getUpcomingForStudent = async (req, res) => {
  try {
    const days = parseInt(req.query.days || '7', 10);
    const now = new Date();
    const upper = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const all = await importantDeadlineService.getAll({});
    const overrides = await listActiveOverridesForStudent({ userId: req.user?.userId || req.user?.id });
    // filter เฉพาะที่ยังไม่ผ่าน deadlineAt และภายในช่วง upper
    const upcoming = all.filter(d => d.deadlineAt && new Date(d.deadlineAt) >= now && new Date(d.deadlineAt) <= upper);
    const enriched = upcoming.map(d => {
      const obj = d.toJSON();
      const utc = new Date(obj.deadlineAt);
      const msLeft = utc.getTime() - now.getTime();
      const daysLeft = Math.floor(msLeft / (24*60*60*1000));
      const hoursLeft = Math.floor(msLeft / (60*60*1000));
      const localMs = utc.getTime() + 7*60*60*1000;
      const ld = new Date(localMs);
      const pad = (n) => n.toString().padStart(2,'0');
      obj.deadlineDate = `${ld.getUTCFullYear()}-${pad(ld.getUTCMonth()+1)}-${pad(ld.getUTCDate())}`;
      obj.deadlineTime = `${pad(ld.getUTCHours())}:${pad(ld.getUTCMinutes())}:${pad(ld.getUTCSeconds())}`;
      obj.daysLeft = daysLeft;
      obj.hoursLeft = hoursLeft;
      applyOverrideToMappedDeadline(obj, overrides.get(obj.id), now);
      return obj;
    }).sort((a,b)=> new Date(a.deadlineAt) - new Date(b.deadlineAt));
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// นักศึกษา: ดึง deadlines ทั้งหมดของปีการศึกษาปัจจุบัน (หรือทั้งหมดถ้าไม่ระบุ) สำหรับ calendar/progress
module.exports.getAllForStudent = async (req, res) => {
  try {
    const { academicYear } = req.query;
    const studentId = req.user?.userId || req.user?.id;
    
    const { deadlines, documentsByDeadline } = await importantDeadlineService.getAllForStudentWithDocuments(
      { academicYear },
      studentId
    );

    const overrides = await listActiveOverridesForStudent({ userId: req.user?.userId || req.user?.id });

    const now = new Date();
    const visible = deadlines.filter(d => isPublishedForAudience(d, now));

    const enriched = visible
      .map(d => {
        const document = documentsByDeadline.get(d.id);
        const mapped = mapDeadlineForResponse(d, { document, now });
        applyOverrideToMappedDeadline(mapped, overrides.get(d.id), now);

        // เพิ่มข้อมูลสำหรับ frontend ในรูปแบบที่ normalize function คาดหวัง
        if (document) {
          mapped.hasSubmission = true;
          mapped.documentId = document.id;
          mapped.documentStatus = document.status;
          mapped.submittedAtLocal = document.submittedAt ? 
            new Date(new Date(document.submittedAt).getTime() + 7 * 60 * 60 * 1000).toISOString() : null;
          
          // เพิ่ม submission object ที่ frontend normalize function ต้องการ
          mapped.submission = {
            submitted: true,
            submittedAt: document.submittedAt || document.created_at,
            late: document.isLate || false,
            status: document.status
          };
        } else {
          mapped.hasSubmission = false;
          mapped.documentId = null;
          mapped.documentStatus = null;
          mapped.submittedAtLocal = null;
          mapped.submission = {
            submitted: false,
            submittedAt: null,
            late: false,
            status: null
          };
        }
        
        return mapped;
      })
      .sort((a, b) => new Date(a.deadlineAt) - new Date(b.deadlineAt));

    res.json({ success: true, data: enriched });
  } catch (error) {
    logger.error('[getAllForStudent] Error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// อาจารย์ที่ปรึกษา: ดึงกำหนดการที่เผยแพร่แล้วจากเจ้าหน้าที่ เพื่อให้วางแผนประกบกับนักศึกษา
module.exports.getAllForTeacher = async (req, res) => {
  try {
    const { academicYear } = req.query;
    const all = await importantDeadlineService.getAll({ academicYear });

    const now = new Date();
    const visible = all.filter(d => isPublishedForAudience(d, now) && isVisibleForTeacher(d));

    const enriched = visible
      .map(d => mapDeadlineForResponse(d, { now }))
      .sort((a, b) => new Date(a.deadlineAt) - new Date(b.deadlineAt));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Excel export: กำหนดการสำคัญทั้งหมด
exports.exportAcademicDeadlines = async (req, res, next) => {
  try {
    const { academicYear, semester } = req.query;
    const deadlines = await importantDeadlineService.getAll({ academicYear, semester });

    const TYPE_MAP = {
      SUBMISSION: 'ส่งเอกสาร',
      ANNOUNCEMENT: 'ประกาศ',
      MILESTONE: 'เหตุการณ์สำคัญ',
    };
    const RELATED_MAP = {
      project: 'โครงงาน',
      project1: 'โครงงาน 1',
      project2: 'โครงงาน 2',
      internship: 'ฝึกงาน',
      general: 'ทั่วไป',
    };

    const columns = [
      { header: 'ชื่อกำหนดการ', key: 'name', width: 35 },
      { header: 'หมวด', key: 'relatedTo', width: 12 },
      { header: 'ปีการศึกษา', key: 'academicYear', width: 12 },
      { header: 'ภาคเรียน', key: 'semester', width: 10 },
      { header: 'ประเภท', key: 'deadlineType', width: 15 },
      { header: 'วันครบกำหนด', key: 'deadlineDate', width: 18 },
      { header: 'สำคัญ', key: 'isCritical', width: 8 },
    ];

    const rows = deadlines.map((d) => {
      const obj = d.toJSON ? d.toJSON() : d;
      return {
        name: obj.name || '-',
        relatedTo: RELATED_MAP[obj.relatedTo] || obj.relatedTo || '-',
        academicYear: obj.academicYear || '-',
        semester: obj.semester || '-',
        deadlineType: TYPE_MAP[obj.deadlineType] || obj.deadlineType || '-',
        deadlineDate: formatThaiDate(obj.deadlineAt || obj.date),
        isCritical: obj.isCritical ? 'ใช่' : 'ไม่',
      };
    });

    await new ExcelExportBuilder('กำหนดการสำคัญ')
      .addSheet('กำหนดการสำคัญ', columns, rows)
      .sendResponse(res);
  } catch (err) {
    next(err);
  }
};