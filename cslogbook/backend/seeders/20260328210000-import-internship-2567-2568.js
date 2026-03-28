'use strict';

/**
 * Seeder: Import Internship Records (ฝึกงาน 2567 + 2568)
 *
 * ข้อมูลจาก 3 ไฟล์:
 *   A) ใบรับรองฝึกงาน ประจำปี 2567.docx.xlsx   → รหัสนักศึกษา + บริษัท (primary key)
 *   B) ฝึกงาน 2567.xlsx                         → ชื่อผู้ประสานงาน + วันฝึกงาน
 *   C) ฝึกงาน 2568.xlsx                         → ชื่อผู้ประสานงาน + วันฝึกงาน
 *
 * ผลลัพธ์:
 *   - สร้าง documents (type=INTERNSHIP, category=acceptance, status=approved)
 *   - สร้าง internship_documents (company_name, start_date, end_date, contact_person, etc.)
 *
 * Strategy การ match วันที่:
 *   - จากไฟล์ B/C มีแค่ชื่อ (ไม่มีรหัส) → match ด้วย company_name + student_name แบบ fuzzy
 *   - ถ้า match ไม่เจอ → ใส่ default start_date/end_date จาก DEFAULT_DATES
 *
 * วิธีรัน:
 *   cd cslogbook/backend
 *   npx sequelize-cli db:seed --seed 20260328210000-import-internship-2567-2568.js
 *
 * วิธี rollback:
 *   npx sequelize-cli db:seed:undo --seed 20260328210000-import-internship-2567-2568.js
 */

const path = require('path');
const ExcelJS = require('exceljs');
const { QueryTypes } = require('sequelize');

// ====================================================
// CONFIG — แก้ path ถ้า Excel อยู่คนละที่
// ====================================================
// Docker container: /app/uploads/imports/, Local dev: ~/OneDrive/เอกสาร/
const BASE_UPLOAD_DIR = process.env.IMPORT_DIR || (
  require('fs').existsSync('/app/uploads/imports')
    ? '/app/uploads/imports'
    : path.resolve(process.env.USERPROFILE || process.env.HOME, 'OneDrive/เอกสาร')
);

const FILE_CERT   = path.join(BASE_UPLOAD_DIR, 'ใบรับรองฝึกงาน ประจำปี 2567.docx.xlsx');
const FILE_INT_67 = path.join(BASE_UPLOAD_DIR, 'ฝึกงาน 2567.xlsx');
const FILE_INT_68 = path.join(BASE_UPLOAD_DIR, 'ฝึกงาน 2568.xlsx');

// วันฝึกงาน default ถ้า match ไม่เจอ
const DEFAULT_DATES = {
  2567: { start: '2024-04-01', end: '2024-06-30' },
  2568: { start: '2025-04-01', end: '2025-06-30' }
};

const SEED_FILE_MARKER = 'IMPORT_INTERNSHIP_2567_2568_v1';

// ====================================================
// Helpers
// ====================================================
const THAI_DIGITS = { '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4', '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9' };

const normalizeText = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .trim()
    .replace(/[๐-๙]/g, (ch) => THAI_DIGITS[ch] || ch);
};

const stripPrefix = (name) => {
  // ตัด "นาย", "นางสาว", "นาง" ออกเพื่อ fuzzy match ชื่อ
  return name
    .replace(/^(นาย|นางสาว|นาง)\s*/u, '')
    .trim();
};

// แปลง "1 เมษายน 2568" → "2025-04-01"
const THAI_MONTHS = {
  'มกราคม': '01', 'กุมภาพันธ์': '02', 'มีนาคม': '03', 'เมษายน': '04',
  'พฤษภาคม': '05', 'มิถุนายน': '06', 'กรกฎาคม': '07', 'สิงหาคม': '08',
  'กันยายน': '09', 'ตุลาคม': '10', 'พฤศจิกายน': '11', 'ธันวาคม': '12'
};

const parseThaiDate = (str) => {
  if (!str) return null;
  const s = normalizeText(str).trim();
  const match = s.match(/(\d+)\s+([\u0E00-\u0E7F]+)\s+(\d{4})/);
  if (!match) return null;
  const day = match[1].padStart(2, '0');
  const month = THAI_MONTHS[match[2]];
  const year = parseInt(match[3], 10);
  if (!month) return null;
  // ถ้าปี > 2500 = พ.ศ. แปลงเป็น ค.ศ.
  const adYear = year > 2500 ? year - 543 : year;
  return `${adYear}-${month}-${day}`;
};

// ====================================================
// อ่านไฟล์ A: ใบรับรองฝึกงาน (company + studentName + studentCode)
// ====================================================
async function readCertFile(filePath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.worksheets[0];
  const records = [];

  ws.eachRow((row, rowNum) => {
    if (rowNum <= 2) return; // skip header rows
    const company     = normalizeText(row.getCell(1).value);
    const studentName = normalizeText(row.getCell(2).value);
    const studentCode = normalizeText(row.getCell(3).value);
    if (!studentCode || studentCode.length < 10) return;
    records.push({ company, studentName, studentCode });
  });

  return records;
}

// ====================================================
// อ่านไฟล์ B/C: ฝึกงาน (จดหมาย) — คืน map: company+shortName → {contact, start, end}
// ====================================================
async function readInternshipLetterFile(filePath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.worksheets[0];
  const entries = [];

  ws.eachRow((row, rowNum) => {
    if (rowNum <= 1) return;
    const contactRaw  = normalizeText(row.getCell(3).value); // ช่อง "เรียน"
    const company     = normalizeText(row.getCell(4).value);
    const name1       = normalizeText(row.getCell(6).value);
    const name2       = normalizeText(row.getCell(7).value);
    const periodRaw   = normalizeText(row.getCell(8).value);

    if (!company) return;

    // แยกชื่อผู้ประสานงาน (คุณ X ตำแหน่ง Y)
    const contactMatch = contactRaw.match(/^คุณ(.+?)(?:\s+ตำแหน่ง|\s*$)/u);
    const contactName  = contactMatch ? contactMatch[1].trim() : contactRaw;
    const posMatch     = contactRaw.match(/ตำแหน่ง\s*(.+)/u);
    const contactPos   = posMatch ? posMatch[1].trim() : '';

    // แยกวันที่จาก "1 เมษายน 2568 - 20 มิถุนายน 2568"
    const dateParts = periodRaw.split('-').map((s) => s.trim());
    const startDate = dateParts[0] ? parseThaiDate(dateParts[0]) : null;
    const endDate   = dateParts[1] ? parseThaiDate(dateParts[1]) : null;

    const addEntry = (rawName) => {
      if (!rawName) return;
      const shortName = stripPrefix(rawName);
      entries.push({ company, shortName, contactName, contactPos, startDate, endDate });
    };
    addEntry(name1);
    addEntry(name2);
  });

  return entries;
}

// ====================================================
// Fuzzy match: หา entry จาก company + shortName
// ====================================================
function buildLetterMap(entries) {
  const map = {};
  entries.forEach((e) => {
    const key = `${e.company}||${e.shortName}`;
    map[key] = e;
  });
  return map;
}

const lookupLetter = (letterMap, company, studentName) => {
  const shortName = stripPrefix(studentName);
  const key = `${company}||${shortName}`;
  if (letterMap[key]) return letterMap[key];
  // fuzzy: เอาแค่นามสกุล
  const lastName = shortName.split(' ').pop();
  const found = Object.keys(letterMap).find(
    (k) => k.startsWith(`${company}||`) && k.endsWith(lastName)
  );
  return found ? letterMap[found] : null;
};

// ====================================================
// MAIN
// ====================================================
module.exports = {
  async up(queryInterface) {
    const t = await queryInterface.sequelize.transaction();
    const sequelize = queryInterface.sequelize;

    try {
      // Guard
      const [guardCheck] = await sequelize.query(
        `SELECT document_id FROM documents WHERE file_path LIKE ? LIMIT 1`,
        { replacements: [`internship/import-cert-2567/%`], type: QueryTypes.SELECT, transaction: t }
      );
      if (guardCheck) {
        console.log('[seed] พบข้อมูลที่ seed แล้ว ข้ามการ seed');
        await t.rollback();
        return;
      }

      // ---- 1. อ่าน Excel ----
      console.log('[seed] อ่านไฟล์ใบรับรองฝึกงาน...');
      const certRecords = await readCertFile(FILE_CERT);
      console.log(`[seed] พบ ${certRecords.length} รายการในใบรับรอง`);

      console.log('[seed] อ่านไฟล์จดหมายฝึกงาน 2567...');
      const letters67 = await readInternshipLetterFile(FILE_INT_67);
      console.log('[seed] อ่านไฟล์จดหมายฝึกงาน 2568...');
      const letters68 = await readInternshipLetterFile(FILE_INT_68);

      const letterMap67 = buildLetterMap(letters67);
      const letterMap68 = buildLetterMap(letters68);

      // ---- 2. ดึง student_code → {student_id, user_id} ----
      const allCodes = [...new Set(certRecords.map((r) => r.studentCode))];
      const studentRows = await sequelize.query(
        `SELECT student_id, student_code, user_id FROM students
         WHERE student_code IN (${allCodes.map(() => '?').join(',')})`,
        { replacements: allCodes, type: QueryTypes.SELECT, transaction: t }
      );
      const studentMap = {};
      studentRows.forEach((r) => { studentMap[r.student_code] = r; });

      const now = new Date();
      let created = 0;
      let skipped = 0;
      const warnings = [];

      // ---- 3. วน loop สร้าง documents + internship_documents ----
      for (const rec of certRecords) {
        const student = studentMap[rec.studentCode];
        if (!student) {
          warnings.push(`[SKIP] ไม่พบนักศึกษา ${rec.studentCode} (${rec.studentName})`);
          skipped++;
          continue;
        }

        // ตรวจสอบว่ามี internship document แล้วหรือยัง (กัน duplicate)
        const [existDoc] = await sequelize.query(
          `SELECT d.document_id FROM documents d
           INNER JOIN internship_documents id2 ON d.document_id = id2.document_id
           WHERE d.user_id = ? AND id2.company_name = ?
           LIMIT 1`,
          {
            replacements: [student.user_id, rec.company],
            type: QueryTypes.SELECT,
            transaction: t
          }
        );
        if (existDoc) {
          warnings.push(`[SKIP] นักศึกษา ${rec.studentCode} มี internship ที่ ${rec.company} แล้ว`);
          skipped++;
          continue;
        }

        // หาข้อมูลวันที่และผู้ประสาน จากจดหมาย
        // ลอง match จากปี 2567 ก่อน ถ้าไม่เจอลอง 2568
        let letter = lookupLetter(letterMap67, rec.company, rec.studentName)
                  || lookupLetter(letterMap68, rec.company, rec.studentName);

        // ระบุปีการศึกษาจาก student_code prefix (6x = รุ่น 6x)
        const batchYear = parseInt(rec.studentCode.substring(0, 2), 10); // เช่น 65 = 2565
        const thaiYear = batchYear >= 60 ? 2500 + batchYear : 2600 + batchYear;
        // ปีการศึกษาฝึกงาน = ปีเข้า + 3 (ปกติ)
        const internAcYear = thaiYear + 3;
        const defaults = DEFAULT_DATES[internAcYear] || DEFAULT_DATES[2568];

        const startDate  = letter?.startDate  || defaults.start;
        const endDate    = letter?.endDate    || defaults.end;
        const contactName = letter?.contactName || '';
        const contactPos  = letter?.contactPos  || '';
        const acYear      = internAcYear;
        const semester    = 2; // ภาคฤดูร้อน / ภาค 2

        const filePath = `internship/import-cert-2567/${rec.studentCode}-${Date.now()}.pdf`;

        // Insert documents
        await queryInterface.bulkInsert(
          'documents',
          [
            {
              user_id: student.user_id,
              document_type: 'INTERNSHIP',
              document_name: 'CS05',
              category: 'acceptance',
              status: 'approved',
              file_path: filePath,
              file_size: 0,
              mime_type: 'application/pdf',
              review_date: now,
              review_comment: `Import จากไฟล์ใบรับรองฝึกงาน (${SEED_FILE_MARKER})`,
              due_date: null,
              download_status: 'downloaded',
              downloaded_at: now,
              download_count: 1,
              submitted_at: now,
              is_late: false,
              late_minutes: 0,
              late_reason: null,
              submitted_late: false,
              submission_delay_minutes: null,
              created_at: now,
              updated_at: now
            }
          ],
          { transaction: t }
        );

        // ดึง document_id ที่เพิ่งสร้าง
        const [insertedDoc] = await sequelize.query(
          `SELECT document_id FROM documents WHERE user_id = ? AND file_path = ? ORDER BY document_id DESC LIMIT 1`,
          {
            replacements: [student.user_id, filePath],
            type: QueryTypes.SELECT,
            transaction: t
          }
        );

        if (!insertedDoc) {
          throw new Error(`insert documents ไม่สำเร็จสำหรับนักศึกษา ${rec.studentCode}`);
        }

        // Insert internship_documents
        await queryInterface.bulkInsert(
          'internship_documents',
          [
            {
              document_id: insertedDoc.document_id,
              company_name: rec.company,
              company_address: '-',
              internship_position: '',
              contact_person_name: contactName,
              contact_person_position: contactPos,
              supervisor_name: contactName,
              supervisor_position: contactPos,
              supervisor_phone: '',
              supervisor_email: '',
              start_date: startDate,
              end_date: endDate,
              academic_year: acYear,
              semester,
              created_at: now,
              updated_at: now
            }
          ],
          { transaction: t }
        );

        created++;
        if (created % 20 === 0) {
          console.log(`[seed] ... สร้างแล้ว ${created} รายการ`);
        }
      }

      await t.commit();

      console.log('\n========== สรุปผล ==========');
      console.log(`✅ สร้าง internship records สำเร็จ: ${created} รายการ`);
      console.log(`⏭️  ข้าม (ไม่พบนักศึกษา/ซ้ำ): ${skipped} รายการ`);
      if (warnings.length > 0) {
        console.log(`\n⚠️  มี ${warnings.length} คำเตือน (แสดงสูงสุด 20 รายการแรก):`);
        warnings.slice(0, 20).forEach((w) => console.log('  ' + w));
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
      // หา documents ที่ import มา
      const [docs] = await queryInterface.sequelize.query(
        `SELECT document_id FROM documents WHERE file_path LIKE ?`,
        { replacements: [`internship/import-cert-2567/%`], type: QueryTypes.SELECT, transaction: t }
      );

      if (docs.length > 0) {
        const ids = docs.map((d) => d.document_id);
        await queryInterface.bulkDelete('internship_documents', { document_id: ids }, { transaction: t });
        await queryInterface.bulkDelete('documents', { document_id: ids }, { transaction: t });
      }

      await t.commit();
      console.log(`[seed:undo] ลบ internship records ${docs.length} รายการ`);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
};
