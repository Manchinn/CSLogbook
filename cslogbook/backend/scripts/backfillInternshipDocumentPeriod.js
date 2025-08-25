/**
 * Backfill academicYear & semester for existing internship_documents rows where null.
 * Strategy:
 * 1. Use created_at (or start_date fallback) to derive semester by month.
 * 2. Derive academicYear (Thai year) consistent with getCurrentAcademicYear logic simplified to timestamp.
 *    - Academic year starts at July (month 7). Months 7-12 belong to current Gregorian year + 543.
 *    - Months 1-6 belong to (Gregorian year - 1) + 543.
 * 3. Semester mapping (if not already stored):
 *    - 1: Jul-Nov (7-11)
 *    - 2: Dec-Mar (12,1,2,3)
 *    - 3: Apr-Jun (4,5,6)
 * This approximates; if Academic table has isCurrent, we only need snapshot; historical precision beyond month granularity not present.
 */
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
const { sequelize, InternshipDocument } = require('../models');

function deriveAcademicYearAndSemester(date) {
  const d = new Date(date);
  if (isNaN(d)) return { academicYear: null, semester: null };
  const month = d.getMonth() + 1; // 1-12
  const gregYear = d.getFullYear();
  // academic year (Thai)
  const academicYear = (month >= 7 ? gregYear : gregYear - 1) + 543;
  let semester;
  if (month >= 7 && month <= 11) semester = 1; // Jul-Nov
  else if (month === 12 || month <= 3) semester = 2; // Dec-Mar
  else semester = 3; // Apr-Jun
  return { academicYear, semester };
}

async function run() {
  const t = await sequelize.transaction();
  try {
    const rows = await InternshipDocument.findAll({
      where: { academicYear: null },
      transaction: t
    });
    if (!rows.length) {
      console.log('No rows need backfill.');
      await t.rollback();
      return;
    }
    let updated = 0;
    for (const row of rows) {
      const baseDate = row.created_at || row.startDate || new Date();
      const { academicYear, semester } = deriveAcademicYearAndSemester(baseDate);
      await row.update({ academicYear, semester }, { transaction: t });
      updated++;
    }
    await t.commit();
    console.log(`Backfill complete. Updated ${updated} rows.`);
  } catch (err) {
    await t.rollback();
    console.error('Backfill failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
