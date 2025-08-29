const importantDeadlineService = require('../services/importantDeadlineService');

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

// เพิ่มกำหนดการใหม่
exports.create = async (req, res) => {
  try {
    const deadline = await importantDeadlineService.create(req.body);
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
  console.error('[importantDeadlineController.create] Error:', error.message, error.stack);
  res.status(400).json({ success: false, message: error.message });
  }
};

// แก้ไขกำหนดการ
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const deadline = await importantDeadlineService.update(id, req.body);
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

// สำหรับนักศึกษา: ดึง deadline ที่จะถึงภายใน X วัน (default 7)
module.exports.getUpcomingForStudent = async (req, res) => {
  try {
    const days = parseInt(req.query.days || '7', 10);
    const now = new Date();
    const upper = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const all = await importantDeadlineService.getAll({});
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
  const { academicYear } = req.query; // พ.ศ.
  const all = await importantDeadlineService.getAll({ academicYear });
    console.log('[getAllForStudent] raw count:', all.length, 'academicYear param:', academicYear);

    // Phase 1 enrichment: ผสานสถานะการส่งเอกสารของนักศึกษา (อิงการเชื่อม important_deadline_id ใน documents)
    const studentId = req.user?.userId || req.user?.id; // auth middleware อาจตั้ง userId หรือ id
    let documentsByDeadline = new Map();
    if (studentId && all.length) {
      try {
        const { Document } = require('../models');
        const { Op } = require('sequelize');
        const deadlineIds = all.map(d => d.id).filter(Boolean);
        const docs = await Document.findAll({
          where: {
            userId: studentId,
            importantDeadlineId: { [Op.in]: deadlineIds }
          }
        }).catch(err => { console.error('[getAllForStudent] Document query error', err.message); return []; });
        for (const d of docs) {
          documentsByDeadline.set(d.importantDeadlineId, d);
        }
      } catch (e) {
        console.error('[getAllForStudent] enrich documents error', e.message);
      }
    }

  const now = new Date();
  // กรองเฉพาะที่ publish แล้วสำหรับ student
  const visible = all.filter(d => {
      if (d.isPublished === undefined && d.publishAt === undefined) return true; // backward compatibility
      if (d.isPublished) return true;
      if (d.publishAt && new Date(d.publishAt) <= now) return true;
      return false;
    });

    const enriched = visible.map(d => {
      const obj = d.toJSON();
      const pad = n => n.toString().padStart(2,'0');
      // แปลง single deadline
      if (obj.deadlineAt) {
        const utc = new Date(obj.deadlineAt);
        const local = new Date(utc.getTime() + 7*60*60*1000);
        obj.deadlineDate = `${local.getUTCFullYear()}-${pad(local.getUTCMonth()+1)}-${pad(local.getUTCDate())}`;
        obj.deadlineTime = `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`;
      }
      // แปลง window (ถ้ามี)
      if (obj.windowStartAt && obj.windowEndAt) {
        const toLocalParts = (dt) => {
          const l = new Date(new Date(dt).getTime() + 7*60*60*1000);
          return {
            date: `${l.getUTCFullYear()}-${pad(l.getUTCMonth()+1)}-${pad(l.getUTCDate())}`,
            time: `${pad(l.getUTCHours())}:${pad(l.getUTCMinutes())}:${pad(l.getUTCSeconds())}`
          };
        };
        const s = toLocalParts(obj.windowStartAt);
        const e = toLocalParts(obj.windowEndAt);
        obj.windowStartDate = s.date;
        obj.windowStartTime = s.time;
        obj.windowEndDate = e.date;
        obj.windowEndTime = e.time;
        obj.isWindow = true;
      } else {
        obj.isWindow = false;
      }

      // คำนวณ effectiveDeadlineAt สำหรับการเปรียบเทียบ (ปลาย window ถ้ามี มิฉะนั้น deadlineAt)
      const effectiveDeadlineAt = obj.windowEndAt || obj.deadlineAt || null;
      obj.effectiveDeadlineAt = effectiveDeadlineAt;

      // ผสานข้อมูล submission จาก Document (Phase 1)
      let submission = { submitted: false, submittedAt: null, late: false };
      if (documentsByDeadline.has(obj.id)) {
        const doc = documentsByDeadline.get(obj.id);
        submission.submitted = !!doc.submittedAt || ['approved','completed','supervisor_evaluated','acceptance_approved','referral_ready','referral_downloaded'].includes(doc.status);
        submission.submittedAt = doc.submittedAt ? doc.submittedAt : null;
        // ถ้ามี flag isLate ในเอกสาร ใช้แทน หรือคำนวณใหม่ (กันกรณี schema เปลี่ยน)
        if (doc.isLate !== undefined && doc.isLate !== null) {
          submission.late = !!doc.isLate;
        } else if (submission.submittedAt && effectiveDeadlineAt) {
          const submittedMs = new Date(submission.submittedAt).getTime();
          const deadlineMs = new Date(effectiveDeadlineAt).getTime();
          // รวม grace period ถ้ามี
          let deadlineWithGrace = deadlineMs;
            if (obj.gracePeriodMinutes) {
              deadlineWithGrace += obj.gracePeriodMinutes * 60 * 1000;
            }
          submission.late = submittedMs > deadlineWithGrace;
        }
      }
      obj.submission = submission;

      // locked: ถ้าหมดเวลา + policy lockAfterDeadline = true และยังไม่ส่ง
      if (effectiveDeadlineAt && obj.lockAfterDeadline) {
        const effMs = new Date(effectiveDeadlineAt).getTime();
        obj.locked = now.getTime() > effMs && !submission.submitted;
      } else {
        obj.locked = false;
      }

      return obj;
    }).sort((a,b)=> new Date(a.deadlineAt) - new Date(b.deadlineAt));
  console.log('[getAllForStudent] enriched preview:', enriched.slice(0,3).map(x=>({id:x.id,name:x.name,sub:x.submission,deadlineDate:x.deadlineDate,deadlineTime:x.deadlineTime})));
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};