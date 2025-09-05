// Service สรุปจำนวนผู้ฝึกงานต่อสถานประกอบการ (นับเฉพาะ CS05 ที่ approved)
// เดิมใช้ Sequelize.QueryTypes จาก destructuring models (ไม่มี) ทำให้ error
// แก้ให้ใช้ instance sequelize + QueryTypes จาก sequelize library โดยตรง
const { InternshipDocument } = require('../models');
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

class InternshipCompanyStatsService {
  /**
   * ดึงสถิติจำนวนผู้ฝึกงานแยกตามบริษัท
   * @param {Object} options
   * @param {number|null} options.academicYear ปีการศึกษา (พ.ศ.) หรือ null
   * @param {number|null} options.semester ภาคเรียน 1/2/3 หรือ null
   * @param {number} options.limit จำนวนสูงสุด (student จะถูกบังคับ)
   * @param {boolean} options.isStaff สิทธิ์เจ้าหน้าที่/อาจารย์ (เห็นเต็ม)
   * @returns {Promise<{meta: object, rows: Array}>}
   */
  async getCompanyStats({ academicYear = null, semester = null, limit = 10, isStaff = false }) {
    // ป้องกัน limit เกิน
    const hardCap = isStaff ? 200 : 20;
    const finalLimit = Math.min(limit || 10, hardCap);

    // เงื่อนไข where สำหรับ snapshot period (ถ้าไม่ได้ระบุ ให้ไม่กรอง)
    const whereInternship = {};
    if (academicYear) whereInternship.academic_year = academicYear;
    if (semester) whereInternship.semester = semester;

    // ใช้ raw query เพื่อควบคุม COUNT DISTINCT ได้ชัดเจน
    const replacements = {
      academicYear,
      semester,
      limit: finalLimit
    };

    // สร้างส่วนเงื่อนไข dynamic
    const periodConditions = [];
    if (academicYear) periodConditions.push('idoc.academic_year = :academicYear');
    if (semester) periodConditions.push('idoc.semester = :semester');
    const periodWhere = periodConditions.length ? (' AND ' + periodConditions.join(' AND ')) : '';

    const sql = `
      SELECT 
        idoc.company_name AS companyName,
        COUNT(DISTINCT d.user_id) AS totalStudents
      FROM internship_documents idoc
      INNER JOIN documents d ON d.document_id = idoc.document_id
      WHERE d.document_name = 'CS05'
        AND d.status = 'approved'
        ${periodWhere}
      GROUP BY idoc.company_name
      ORDER BY totalStudents DESC, idoc.company_name ASC
      LIMIT :limit;
    `;

    const rows = await sequelize.query(sql, {
      type: QueryTypes.SELECT,
      replacements
    });

    // Query รวมทั้งหมด (ไม่จำกัด limit) เพื่อใช้ pagination/overview
    const aggregateSql = `
      SELECT 
        COUNT(*) AS totalAllCompanies,
        COALESCE(SUM(company_student_count),0) AS totalAllStudents
      FROM (
        SELECT idoc.company_name, COUNT(DISTINCT d.user_id) AS company_student_count
        FROM internship_documents idoc
        INNER JOIN documents d ON d.document_id = idoc.document_id
        WHERE d.document_name = 'CS05'
          AND d.status = 'approved'
          ${periodWhere}
        GROUP BY idoc.company_name
      ) t;
    `;

    const aggregateRow = await sequelize.query(aggregateSql, {
      type: QueryTypes.SELECT,
      replacements
    });

    const totalAllCompanies = Number(aggregateRow[0]?.totalAllCompanies || 0);
    const totalAllStudents = Number(aggregateRow[0]?.totalAllStudents || 0);

    // สรุปเฉพาะชุดที่ถูกตัด (top rows) สำหรับแสดงเร็ว
    const topCompaniesCount = rows.length;
    const topStudentsSum = rows.reduce((sum, r) => sum + Number(r.totalStudents || 0), 0);

    return {
      meta: {
        academicYear: academicYear || null,
        semester: semester || null,
        totalCompanies: topCompaniesCount,
        totalStudents: topStudentsSum,
        totalAllCompanies,
        totalAllStudents,
        limit: finalLimit,
        generatedAt: new Date().toISOString()
      },
      rows
    };
  }

  /**
   * ดึงรายละเอียดนักศึกษาที่ได้รับการอนุมัติให้ฝึกในบริษัทหนึ่ง (CS05 approved)
   * @param {Object} options
   * @param {string} options.companyName ชื่อบริษัท (exact match ตาม snapshot)
   */
  async getCompanyDetail({ companyName }) {
    // NOTE: first_name / last_name อยู่ในตาราง users ไม่ใช่ students
    // students มี student_code เท่านั้น จึงต้อง join users เพิ่ม
    const sql = `
      SELECT 
        d.user_id AS userId,
        s.student_code AS studentCode,
        u.first_name AS firstName,
        u.last_name  AS lastName,
        idoc.internship_position AS internshipPosition,
        idoc.start_date AS startDate,
  idoc.end_date   AS endDate,
  DATEDIFF(idoc.end_date, idoc.start_date) + 1 AS internshipDays
      FROM internship_documents idoc
      INNER JOIN documents d ON d.document_id = idoc.document_id
      INNER JOIN students s ON s.user_id = d.user_id
      INNER JOIN users u ON u.user_id = d.user_id
      WHERE d.document_name = 'CS05'
        AND d.status = 'approved'
        AND idoc.company_name = :companyName
      ORDER BY idoc.internship_position ASC, s.student_code ASC;
    `;

    const rows = await sequelize.query(sql, {
      type: QueryTypes.SELECT,
      replacements: { companyName }
    });

    return {
      companyName,
      total: rows.length,
      interns: rows
    };
  }
}

module.exports = new InternshipCompanyStatsService();
