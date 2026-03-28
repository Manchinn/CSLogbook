'use strict';

/**
 * Seeder: Import Project Test Requests (โครงงาน ภาค 2/2568)
 *
 * ข้อมูลจาก: รายชื่อยื่นขอทดลองโครงงาน ประจำภาค 2-2568.xlsx
 * สร้าง: project_documents + project_members
 *
 * วิธีรัน:
 *   cd cslogbook/backend
 *   npx sequelize-cli db:seed --seed 20260328200000-import-project-exam-2568-s2.js
 *
 * วิธี rollback:
 *   npx sequelize-cli db:seed:undo --seed 20260328200000-import-project-exam-2568-s2.js
 *
 * ข้อกำหนดก่อนรัน:
 *   - ต้องมีนักศึกษา (student_code) อยู่ใน DB แล้ว
 *   - ต้องมีอาจารย์ (teacher_code) อยู่ใน DB แล้ว
 *   - รันใน environment ที่มี ExcelJS: npm install exceljs (ถ้ายังไม่มี)
 */

const path = require('path');
const ExcelJS = require('exceljs');
const { QueryTypes } = require('sequelize');

// ====================================================
// CONFIG — แก้ path ถ้า Excel อยู่คนละที่
// ====================================================
const EXCEL_PATH = path.resolve(
  process.env.USERPROFILE || process.env.HOME,
  'OneDrive/เอกสาร/รายชื่อยื่นขอทดลองโครงงาน ประจำภาค 2-2568.xlsx'
);

const ACADEMIC_YEAR = 2568;
const SEMESTER = 2;
const SEED_MARKER = 'IMPORT_PROJECT_EXAM_2568_S2_v1'; // ใช้ตรวจสอบว่า seed แล้วหรือยัง

// ====================================================
// Helper: แปลง Thai digit string เป็น normal string
// ====================================================
const THAI_DIGITS = { '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4', '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9' };
const normalizeText = (str) => {
  if (!str) return '';
  return String(str).trim().replace(/[๐-๙]/g, (ch) => THAI_DIGITS[ch] || ch);
};

// ====================================================
// Helper: อ่าน Excel และจัดกลุ่มเป็น projects
// Strategy: อ่านทุกแถว แล้ว group ตามชื่อ topic
//   - แถวที่มี topic เดียวกัน = สมาชิกในโปรเจกต์เดียวกัน
//   - advisor/coAdvisor ใช้จากแถวแรกของกลุ่ม
// ====================================================
async function parseProjectsFromExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const ws = workbook.worksheets[0];

  // อ่านทุกแถวก่อน
  const rows = [];
  ws.eachRow((row, rowNum) => {
    if (rowNum <= 2) return; // Skip header

    const seq      = row.getCell(1).value;
    const topic    = normalizeText(row.getCell(2).value);
    const code     = normalizeText(row.getCell(3).value);
    const name     = normalizeText(row.getCell(4).value);
    const advisor  = normalizeText(row.getCell(5).value).toUpperCase();
    const coAdv    = normalizeText(row.getCell(6).value).toUpperCase();
    const remark   = normalizeText(row.getCell(7).value);

    if (!code) return;

    rows.push({ seq, topic, code, name, advisor, coAdv, remark });
  });

  // Group by topic — สมาชิกที่มี topic เดียวกันอยู่โปรเจกต์เดียวกัน
  // แถวที่ topic ว่าง (สมาชิกเพิ่มเติม) ให้ inherit topic จากแถวก่อนหน้า
  let lastTopic = '';
  for (const row of rows) {
    if (row.topic) {
      lastTopic = row.topic;
    } else {
      row.topic = lastTopic;
    }
  }

  const projectMap = new Map();
  for (const row of rows) {
    if (!projectMap.has(row.topic)) {
      projectMap.set(row.topic, {
        seq: row.seq ? parseInt(String(row.seq), 10) : 0,
        topic: row.topic,
        advisorCode: row.advisor || null,
        coAdvisorCode: row.coAdv || null,
        remark: row.remark || '',
        members: []
      });
    }
    projectMap.get(row.topic).members.push({
      studentCode: row.code,
      studentName: row.name
    });
  }

  return [...projectMap.values()];
}

module.exports = {
  async up(queryInterface) {
    const t = await queryInterface.sequelize.transaction();
    const sequelize = queryInterface.sequelize;

    try {
      // ---- Guard: ตรวจสอบว่าเคย seed แล้วหรือยัง ----
      const [existing] = await sequelize.query(
        `SELECT project_id FROM project_documents
         WHERE project_name_th LIKE ? LIMIT 1`,
        { replacements: [`[${SEED_MARKER}]%`], type: QueryTypes.SELECT, transaction: t }
      );
      if (existing) {
        console.log(`[seed] พบข้อมูลที่ seed แล้ว (${SEED_MARKER}). ข้ามการ seed.`);
        await t.rollback();
        return;
      }

      // ---- 1. อ่าน Excel ----
      console.log(`[seed] อ่านไฟล์: ${EXCEL_PATH}`);
      let projects;
      try {
        projects = await parseProjectsFromExcel(EXCEL_PATH);
      } catch (e) {
        throw new Error(`อ่านไฟล์ Excel ไม่ได้: ${e.message}\nตรวจสอบ EXCEL_PATH ใน seeder นี้`);
      }
      console.log(`[seed] พบ ${projects.length} โปรเจกต์จาก Excel`);

      // ---- 2. ดึง teacher_code → teacher_id mapping ----
      const [teacherRows] = await sequelize.query(
        `SELECT teacher_id, teacher_code FROM teachers WHERE teacher_code IS NOT NULL`,
        { transaction: t }
      );
      const teacherMap = {};
      teacherRows.forEach((r) => { teacherMap[r.teacher_code.toUpperCase()] = r.teacher_id; });

      // ---- 3. ดึง student_code → {student_id, user_id} mapping ----
      const allStudentCodes = [...new Set(projects.flatMap((p) => p.members.map((m) => m.studentCode)))];
      const studentRows = await sequelize.query(
        `SELECT student_id, student_code, user_id FROM students
         WHERE student_code IN (${allStudentCodes.map(() => '?').join(',')})`,
        { replacements: allStudentCodes, type: QueryTypes.SELECT, transaction: t }
      );
      const studentMap = {};
      studentRows.forEach((r) => { studentMap[r.student_code] = r; });

      const now = new Date();
      let created = 0;
      let skipped = 0;
      const warnings = [];

      // ---- 4. วน loop สร้าง project_documents + project_members ----
      for (const proj of projects) {
        // ตรวจสอบว่ามีนักศึกษาครบ
        const resolvedMembers = proj.members.map((m) => ({
          ...m,
          row: studentMap[m.studentCode]
        }));

        const missing = resolvedMembers.filter((m) => !m.row);
        const found = resolvedMembers.filter((m) => m.row);

        if (missing.length > 0) {
          warnings.push(
            `[WARN] โปรเจกต์ "${proj.topic}" — ไม่พบนักศึกษา: ${missing.map((m) => m.studentCode).join(', ')}`
          );
        }

        if (found.length === 0) {
          warnings.push(`[SKIP] โปรเจกต์ "${proj.topic}" — ไม่พบนักศึกษาเลย`);
          skipped++;
          continue;
        }

        const leader = found[0];
        const advisorId = proj.advisorCode ? (teacherMap[proj.advisorCode] || null) : null;
        const coAdvisorId = proj.coAdvisorCode ? (teacherMap[proj.coAdvisorCode] || null) : null;

        if (proj.advisorCode && !advisorId) {
          warnings.push(`[WARN] โปรเจกต์ "${proj.topic}" — ไม่พบอาจารย์รหัส "${proj.advisorCode}"`);
        }

        // ตรวจสอบว่านักศึกษาคนนี้มีโปรเจกต์ในปีการศึกษานี้แล้วหรือยัง
        const [existProj] = await sequelize.query(
          `SELECT pd.project_id FROM project_documents pd
           INNER JOIN project_members pm ON pd.project_id = pm.project_id
           WHERE pm.student_id = ? AND pd.academic_year = ? AND pd.semester = ?
           LIMIT 1`,
          {
            replacements: [leader.row.student_id, ACADEMIC_YEAR, SEMESTER],
            type: QueryTypes.SELECT,
            transaction: t
          }
        );

        if (existProj) {
          warnings.push(
            `[SKIP] นักศึกษา ${leader.studentCode} มีโปรเจกต์ใน ${ACADEMIC_YEAR}/${SEMESTER} แล้ว`
          );
          skipped++;
          continue;
        }

        // Insert project_documents
        const topicForDb = `[${SEED_MARKER}] ${proj.topic}`.substring(0, 254);
        await queryInterface.bulkInsert(
          'project_documents',
          [
            {
              project_name_th: topicForDb,
              project_name_en: null,
              project_type: 'research',
              status: 'advisor_assigned',
              advisor_id: advisorId,
              co_advisor_id: coAdvisorId,
              academic_year: ACADEMIC_YEAR,
              semester: SEMESTER,
              created_by_student_id: leader.row.student_id,
              objective: '',
              background: '',
              scope: '',
              expected_outcome: '',
              benefit: '',
              methodology: '',
              tools: '',
              timeline_note: proj.remark || '',
              submitted_late: false,
              created_at: now,
              updated_at: now
            }
          ],
          { transaction: t }
        );

        // ดึง project_id ที่เพิ่งสร้าง
        const [inserted] = await sequelize.query(
          `SELECT project_id FROM project_documents WHERE project_name_th = ? ORDER BY project_id DESC LIMIT 1`,
          { replacements: [topicForDb], type: QueryTypes.SELECT, transaction: t }
        );

        if (!inserted) {
          throw new Error(`insert project_documents ไม่สำเร็จสำหรับ "${proj.topic}"`);
        }

        const projectId = inserted.project_id;

        // Insert project_members (เฉพาะที่พบใน DB)
        const memberRows = found.map((m, i) => ({
          project_id: projectId,
          student_id: m.row.student_id,
          role: i === 0 ? 'leader' : 'member',
          joined_at: now
        }));

        await queryInterface.bulkInsert('project_members', memberRows, { transaction: t });

        created++;
        console.log(`[seed] ✓ สร้างโปรเจกต์ #${proj.seq}: ${proj.topic} (${found.length}/${proj.members.length} คน)`);
      }

      await t.commit();

      // สรุปผล
      console.log('\n========== สรุปผล ==========');
      console.log(`✅ สร้างโปรเจกต์สำเร็จ: ${created} รายการ`);
      console.log(`⏭️  ข้าม: ${skipped} รายการ`);
      if (warnings.length > 0) {
        console.log('\n⚠️  คำเตือน:');
        warnings.forEach((w) => console.log('  ' + w));
      }
      console.log('=============================\n');
    } catch (err) {
      await t.rollback();
      console.error('[seed] Error:', err.message);
      throw err;
    }
  },

  async down(queryInterface) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // ลบ project_members ก่อน (FK)
      const projects = await queryInterface.sequelize.query(
        `SELECT project_id FROM project_documents WHERE project_name_th LIKE ?`,
        { replacements: [`[${SEED_MARKER}]%`], type: QueryTypes.SELECT, transaction: t }
      );

      if (projects.length > 0) {
        const ids = projects.map((p) => p.project_id);
        await queryInterface.bulkDelete(
          'project_members',
          { project_id: ids },
          { transaction: t }
        );
        await queryInterface.bulkDelete(
          'project_documents',
          { project_id: ids },
          { transaction: t }
        );
      }

      await t.commit();
      console.log(`[seed:undo] ลบโปรเจกต์ที่ seed แล้ว ${projects.length} รายการ`);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
};
