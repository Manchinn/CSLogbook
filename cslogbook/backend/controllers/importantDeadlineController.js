const importantDeadlineService = require('../services/importantDeadlineService');

// ดึงกำหนดการสำคัญทั้งหมด (สามารถกรองด้วยปีการศึกษา/ภาคเรียน)
exports.getAll = async (req, res) => {
  try {
    const { academicYear, semester } = req.query;
    const deadlines = await importantDeadlineService.getAll({ academicYear, semester });
    // enrich deadlineDate/deadlineTime สำหรับ frontend (Asia/Bangkok)
    const enriched = deadlines.map(d => {
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
    const enriched = all.map(d => {
      const obj = d.toJSON();
      if (obj.deadlineAt) {
        const utc = new Date(obj.deadlineAt);
        const local = new Date(utc.getTime() + 7*60*60*1000);
        const pad = n => n.toString().padStart(2,'0');
        obj.deadlineDate = `${local.getUTCFullYear()}-${pad(local.getUTCMonth()+1)}-${pad(local.getUTCDate())}`;
        obj.deadlineTime = `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`;
      }
      return obj;
    }).sort((a,b)=> new Date(a.deadlineAt) - new Date(b.deadlineAt));
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};