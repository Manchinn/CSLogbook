// services/reportService.js
// Aggregation logic สำหรับรายงาน Support Staff
// หมายเหตุ: บาง metric ยังไม่มีฟิลด์รองรับใน schema ปัจจุบัน จึงใช้ placeholder/approximation
const { Op, fn, col, literal, Sequelize } = require('sequelize');
const db = require('../models');

// Helper ดึง studentIds จาก chain Document -> InternshipDocument (ไม่มีคอลัมน์ student_id ใน internship_documents)
async function fetchInternshipStudentIdsByPeriod({ academicYear, semester }) {
  const sequelize = db.sequelize;
  const replacements = { ay: academicYear };
  let semesterClause = '';
  if (semester) { semesterClause = ' AND idoc.semester = :sem'; replacements.sem = semester; }
  const sql = `SELECT DISTINCT s.student_id AS studentId
               FROM students s
               JOIN documents d ON d.user_id = s.user_id
               JOIN internship_documents idoc ON idoc.document_id = d.document_id
               WHERE idoc.academic_year = :ay${semesterClause}`;
  const rows = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT, replacements });
  return rows.map(r => r.studentId);
}

// Helper: สร้างปีการศึกษาปัจจุบันถ้าไม่ส่งมา
function resolveYear(year) {
  const y = parseInt(year, 10);
  if (!y) {
    const now = new Date();
    return now.getFullYear() + 543; // สมมติปี พ.ศ.
  }
  return y;
}

module.exports = {
  /**
   * Overview:
   * - studentsTotal: จำนวนนักศึกษาทั้งหมด
   * - internshipCount / projectCount: ยังไม่มี academicYear ในตาราง -> นับรวมทั้งหมดชั่วคราว
   * - statusSummary: ยังไม่มี status โครงงาน/ฝึกงานรวม => placeholder
   * - advisorWorkload: นับจำนวนนักศึกษาที่มี advisorId ต่ออาจารย์
   * - deadlineCompliance: ยังไม่มีข้อมูลส่งเทียบ deadline -> placeholder
   */
  async getOverview({ year }) {
    const academicYear = resolveYear(year);

    const [studentsTotal, internshipCount, projectCount] = await Promise.all([
      db.Student.count(),
      db.InternshipDocument.count(),
      db.ProjectDocument.count()
    ]);

    // Advisor workload: group by advisor_id ใน Student
    const advisorRows = await db.Student.findAll({
      attributes: [
        'advisor_id',
        [fn('COUNT', col('student_id')), 'adviseeCount']
      ],
      group: ['advisor_id'],
      raw: true,
      where: { advisor_id: { [Op.ne]: null } }
    });

    // ดึงชื่ออาจารย์
    const teacherIds = advisorRows.map(r => r.advisor_id);
    let teacherMap = {};
    if (teacherIds.length) {
      const teachers = await db.Teacher.findAll({ where: { teacherId: teacherIds } });
      teachers.forEach(t => { teacherMap[t.teacherId] = t; });
    }
    const advisorWorkload = advisorRows.map(r => ({
      teacherId: r.advisor_id,
      name: teacherMap[r.advisor_id] ? `${teacherMap[r.advisor_id].teacherCode}` : 'ไม่พบ',
      count: parseInt(r.adviseeCount, 10)
    })).sort((a,b)=>b.count-a.count);

    return {
      academicYear,
      studentsTotal,
      internshipCount,
      projectCount,
      statusSummary: { pending: 0, inProgress: 0, done: 0, issues: 0 }, // TODO: ต้องเพิ่ม field status ในอนาคต
      advisorWorkload,
      deadlineCompliance: { onTime: 0, late: 0 } // TODO: ต้องอ้างอิง ImportantDeadline + เวลาส่งจริง
    };
  },

  /**
   * Logbook Compliance:
   * - weeklyTrend: group ตาม YEARWEEK(work_date) ล่าสุด N สัปดาห์
   * - onTime / late heuristic:
   *    supervisor_approved = 1 ภายใน 7 วันหลัง work_date => onTime
   *    supervisor_approved = 1 หลัง 7 วัน => late
   *    supervisor_approved = 0 และ work_date เกิน 7 วัน => missing (approximation)
   */
  async getInternshipLogbookCompliance({ year, semester }) {
    const academicYear = resolveYear(year);
    const sem = semester ? parseInt(semester,10) : null; // ถ้าไม่เลือก = รวมทุกภาค

    // ดึง 8 สัปดาห์ล่าสุดของบันทึก (ใช้ raw SQL YEARWEEK)
    const sequelize = db.sequelize;
    const weeklyWhere = { academic_year: academicYear };
    if (sem) weeklyWhere.semester = sem; // ใช้กฎ: ไม่เลือกภาค = รวมทุกภาคในปี
    const weeklyRaw = await db.InternshipLogbook.findAll({
      attributes: [
        [literal('YEARWEEK(work_date, 1)'), 'yearWeek'],
        [fn('COUNT', col('log_id')), 'total'],
        [fn('SUM', literal(`CASE 
          WHEN supervisor_approved = 1 AND DATEDIFF(COALESCE(supervisor_approved_at, NOW()), work_date) <= 7 THEN 1 ELSE 0 END`)), 'onTime'],
        [fn('SUM', literal(`CASE 
          WHEN supervisor_approved = 1 AND DATEDIFF(COALESCE(supervisor_approved_at, NOW()), work_date) > 7 THEN 1 ELSE 0 END`)), 'lateApproved'],
        [fn('SUM', literal(`CASE 
          WHEN supervisor_approved = 0 AND DATEDIFF(NOW(), work_date) > 7 THEN 1 ELSE 0 END`)), 'missing']
      ],
      group: [literal('YEARWEEK(work_date, 1)')],
      order: [[literal('YEARWEEK(work_date, 1)'), 'DESC']],
      limit: 8,
      where: weeklyWhere,
      raw: true
    });

    // จัดเรียงกลับจากเก่า -> ใหม่
    weeklyRaw.reverse();
    const weeklyTrend = weeklyRaw.map(r => ({
      week: r.yearWeek,
      onTime: parseInt(r.onTime,10),
      late: parseInt(r.lateApproved,10),
      missing: parseInt(r.missing,10)
    }));

    const sumOnTime = weeklyTrend.reduce((s,w)=>s+w.onTime,0);
    const sumLate = weeklyTrend.reduce((s,w)=>s+w.late,0);
    const sumMissing = weeklyTrend.reduce((s,w)=>s+w.missing,0);
    const total = sumOnTime + sumLate + sumMissing || 1;
    const rate = {
      onTimePct: +(sumOnTime*100/total).toFixed(1),
      latePct: +(sumLate*100/total).toFixed(1),
      missingPct: +(sumMissing*100/total).toFixed(1)
    };

    // นักศึกษาเสี่ยง: นับ log ที่ missing ต่อเนื่อง > 2 ในช่วงข้อมูล (approx)
    // หมายเหตุ: ต้องการรู้ studentId ใน missing -> query เพิ่ม
    const atRiskStudents = []; // TODO: พัฒนาต่อ (join Student + filter)

  return { academicYear, semester: sem || null, weeklyTrend, rate, atRiskStudents };
  },

  /**
   * Project Status Summary:
   * ปัจจุบัน ProjectDocument ไม่มี field สถานะ proposal/draft/approved -> ใช้ placeholder
   * workflowAging ยังไม่มีตารางเชื่อมครบ (ต้อง workflow instance + timestamps ต่อ step)
   */
  async getProjectStatusSummary({ year }) {
    const academicYear = resolveYear(year);
    const totalProjects = await db.ProjectDocument.count();
    return {
      academicYear,
      proposal: { draft: 0, submitted: totalProjects, approved: 0, rejected: 0 },
      workflowAging: []
    };
  },

  // Advisor Load (Project side only) - Fixed: ไม่นับ students.advisor_id เพราะซ้ำกับ project_documents.advisor_id
  async getAdvisorLoad({ year }) {
    const academicYear = resolveYear(year);

    // นับจำนวนโครงงานที่เป็น advisor หลัก (ที่ปรึกษาหลัก)
    const projectAdvisor = await db.ProjectDocument.findAll({
      attributes: [
        'advisor_id',
        [fn('COUNT', col('project_id')), 'advisorProjectCount']
      ],
      where: { advisor_id: { [Op.ne]: null } },
      group: ['advisor_id'],
      raw: true
    });
    
    // นับจำนวนโครงงานที่เป็น co-advisor (ที่ปรึกษาร่วม)
    const projectCoAdvisor = await db.ProjectDocument.findAll({
      attributes: [
        'co_advisor_id',
        [fn('COUNT', col('project_id')), 'coAdvisorProjectCount']
      ],
      where: { co_advisor_id: { [Op.ne]: null } },
      group: ['co_advisor_id'],
      raw: true
    });

    // รวมเป็น map ตาม teacherId
    const mergeMap = {};
    const ensure = (id) => { 
      if (!id || isNaN(parseInt(id, 10))) return;
      if (!mergeMap[id]) mergeMap[id] = { teacherId: parseInt(id, 10), advisorProjectCount:0, coAdvisorProjectCount:0 }; 
    };
    projectAdvisor.forEach(r=>{ if (r.advisor_id) { ensure(r.advisor_id); mergeMap[r.advisor_id].advisorProjectCount = parseInt(r.advisorProjectCount,10); } });
    projectCoAdvisor.forEach(r=>{ if (r.co_advisor_id) { ensure(r.co_advisor_id); mergeMap[r.co_advisor_id].coAdvisorProjectCount = parseInt(r.coAdvisorProjectCount,10); } });

    const teacherIds = Object.keys(mergeMap).map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    if (teacherIds.length === 0) {
      return { academicYear, advisors: [] };
    }
    const teachers = await db.Teacher.findAll({ where: { teacherId: teacherIds } });
    const teacherUserMap = {};
    const userIds = teachers.map(t => t.userId).filter(Boolean);
    if (userIds.length) {
      const users = await db.User.findAll({ where: { userId: userIds }, attributes: ['userId', 'firstName', 'lastName'] });
      users.forEach(u => { teacherUserMap[u.userId] = u; });
    }
    
    teachers.forEach(t => { 
      if (mergeMap[t.teacherId]) {
        const user = teacherUserMap[t.userId];
        mergeMap[t.teacherId].name = user ? `${user.firstName} ${user.lastName}` : t.teacherCode;
        mergeMap[t.teacherId].teacherCode = t.teacherCode;
        // เพิ่ม count เป็นผลรวม (สำหรับ frontend ใช้งานง่าย)
        mergeMap[t.teacherId].count = mergeMap[t.teacherId].advisorProjectCount + mergeMap[t.teacherId].coAdvisorProjectCount;
      }
    });

    // เรียงตามภาระงานรวม (ที่ปรึกษาหลัก + ที่ปรึกษาร่วม)
    const advisors = Object.values(mergeMap).sort((a,b)=> 
      (b.advisorProjectCount + b.coAdvisorProjectCount) - (a.advisorProjectCount + a.coAdvisorProjectCount)
    );

    return { academicYear, advisors };
  },
  /**
   * สรุปสถานะการฝึกงานของนักศึกษา (heuristic)
   * - started: มีเอกสารฝึกงาน (document_type='internship' และ status != 'draft') หรือมี logbook อย่างน้อย 1
   * - completed: เอกสารฝึกงานสถานะ completed
   * - inProgress: started - completed
   * - notStarted: totalStudents - started
   * TODO: รองรับ filter ตามปีการศึกษาเมื่อ schema มี (เช่น Student.academicYear หรือ InternshipDocument.academicYear)
   */
  async getInternshipStudentSummary({ year, semester }) {
    const academicYear = resolveYear(year);
    const sem = semester ? parseInt(semester,10) : null;
    const { Student, InternshipDocument } = db;

    // 1) ดึงเฉพาะนักศึกษาที่ลงทะเบียนฝึกงานแล้ว (is_enrolled_internship = true)
    //    พร้อมฟิลด์ internship_status เพื่อคำนวณกลุ่มสถานะจริง ๆ
    // ถ้ามีการเลือกปี (academicYear) + optional semester ให้จำกัดเฉพาะนักศึกษาที่มี InternshipDocument ในปี/ภาคนั้น
    // ไม่เลือกภาค = รวมทุกภาคของปีนั้น
    let enrolledStudents = [];
    if (academicYear) {
      const studentIds = await fetchInternshipStudentIdsByPeriod({ academicYear, semester: sem });
      if (studentIds.length === 0) {
        return { academicYear, semester: sem || null, totalStudents: await Student.count(), enrolledCount: 0, started: 0, completed: 0, inProgress: 0, notStarted: 0 };
      }
      enrolledStudents = await Student.findAll({
        attributes: ['student_id', 'internship_status'],
        where: { is_enrolled_internship: true, student_id: studentIds },
        raw: true
      });
    } else {
      enrolledStudents = await Student.findAll({
        attributes: ['student_id', 'internship_status'],
        where: { is_enrolled_internship: true },
        raw: true
      });
    }

    const enrolledCount = enrolledStudents.length;

    // 2) นับสถานะตามฟิลด์ Student.internship_status โดยกันคำสะกด/ค่าที่เป็น null
    //    กรณีระบบบางส่วนอาจใช้ 'complete' หรือ 'completed' ให้ถือเป็น completed เดียวกัน
    let completed = 0;
    let inProgress = 0;
    enrolledStudents.forEach(s => {
      const status = (s.internship_status || '').toLowerCase();
      if (status === 'completed' || status === 'complete') completed++;
      else if (status === 'in_progress') inProgress++;
    });

    // 3) started = inProgress + completed (เฉพาะคนที่เริ่มจริง) ไม่ใช่ทุกคนที่ลงทะเบียน
    const started = inProgress + completed;

    // 4) notStarted = นักศึกษาที่ลงทะเบียนแล้วแต่ยังไม่มีสถานะ in_progress/completed
    const notStarted = Math.max(0, enrolledCount - started);

    // 5) totalStudents: ทั้งหมดในระบบ (คงไว้เพื่อ backward compatibility/UI อื่น)
    const totalStudents = await Student.count();

  return { academicYear, semester: sem || null, totalStudents, enrolledCount, started, completed, inProgress, notStarted };
  },
  /**
   * สรุปผลการประเมินฝึกงาน (Internship Evaluation Summary)
   * NOTE: ยังไม่มีการเก็บ academicYear/semester ในตาราง evaluation -> ตอนนี้นับรวมทั้งหมด แล้วแนบ academicYear ที่ร้องขอ (approximation)
   * Return:
   *  - academicYear, semester
   *  - totalInterns: จำนวนนักศึกษาที่มีบันทึกการฝึกงาน (distinct studentId ใน InternshipDocument หรือ InternshipEvaluation)
   *  - evaluatedCount: จำนวนนักศึกษาที่มี evaluation (distinct studentId ใน InternshipEvaluation)
   *  - notEvaluated = totalInterns - evaluatedCount
   *  - completionPct = evaluatedCount / totalInterns * 100 (1 ทศนิยม)
   *  - gradeCounts: แจกแจงตามเกรด (ใช้ overallGrade ถ้ามี; ถ้าไม่มี map จาก overallScore)
   *  - scoreDistribution: bucket ตามคะแนน (>=80,70-79,60-69,50-59,<50)
   *  - criteriaAverages: ค่าเฉลี่ยแต่ละหัวข้อ q1..q8
   *  - overallAverage: AVG(overallScore)
   */
  async getInternshipEvaluationSummary({ year, semester }) {
    const academicYear = resolveYear(year);
    const sem = semester ? parseInt(semester,10) : null; // null = รวมทุกภาค
  const { InternshipEvaluation, InternshipLogbook } = db;
  const docStudentIds = await fetchInternshipStudentIdsByPeriod({ academicYear, semester: sem });

    if (docStudentIds.length === 0) {
      return { academicYear, semester: sem || null, totalInterns: 0, evaluatedCount: 0, notEvaluated: 0, completionPct: 0, criteriaAverages: [], overallAverage: null, scoreDistribution: [], gradeDistribution: [], gradeCounts: {} };
    }

    // Distinct interns (approx): จำกัดเฉพาะ student ที่มี document ปี/ภาคนี้
    const logbookWhere = { student_id: docStudentIds };
    const logbookStudents = await InternshipLogbook.findAll({ attributes: ['student_id'], where: logbookWhere, group: ['student_id'], raw: true });
    const evalStudents = await InternshipEvaluation.findAll({ attributes: ['student_id'], where: { student_id: docStudentIds }, group: ['student_id'], raw: true });
    const studentSet = new Set();
    logbookStudents.forEach(r => r.student_id && studentSet.add(r.student_id));
    evalStudents.forEach(r => r.student_id && studentSet.add(r.student_id));
    const totalInterns = studentSet.size;

    const evaluatedCount = evalStudents.length;
    const notEvaluated = Math.max(0, totalInterns - evaluatedCount);
    const completionPct = totalInterns ? +((evaluatedCount * 100) / totalInterns).toFixed(1) : 0;

    // Aggregate averages โครงสร้างใหม่ใช้ *_score (แต่ละหมวด 0-20) รวม overall_score (0-100)
    const agg = await InternshipEvaluation.findAll({
      attributes: [
        [fn('AVG', col('discipline_score')), 'avgDiscipline'],
        [fn('AVG', col('behavior_score')), 'avgBehavior'],
        [fn('AVG', col('performance_score')), 'avgPerformance'],
        [fn('AVG', col('method_score')), 'avgMethod'],
        [fn('AVG', col('relation_score')), 'avgRelation'],
        [fn('AVG', col('overall_score')), 'avgOverall']
      ],
      where: { student_id: docStudentIds },
      raw: true
    });
    const a = agg[0] || {};
    const toNum = v => (v == null ? null : +parseFloat(v).toFixed(2));
    // คะแนนหมวดเก็บแบบ 0-20; แปลง scale เป็น 0-5 เพื่อ UI
    const scaleToFive = v => (v == null ? null : +parseFloat((v / 20 * 5)).toFixed(2));
    const criteriaAverages = [
      { key: 'discipline', label: 'ระเบียบวินัย', avgRaw: toNum(a.avgDiscipline), avg: scaleToFive(a.avgDiscipline) },
      { key: 'behavior', label: 'พฤติกรรม', avgRaw: toNum(a.avgBehavior), avg: scaleToFive(a.avgBehavior) },
      { key: 'performance', label: 'ผลงาน', avgRaw: toNum(a.avgPerformance), avg: scaleToFive(a.avgPerformance) },
      { key: 'method', label: 'วิธีการทำงาน', avgRaw: toNum(a.avgMethod), avg: scaleToFive(a.avgMethod) },
      { key: 'relation', label: 'มนุษยสัมพันธ์', avgRaw: toNum(a.avgRelation), avg: scaleToFive(a.avgRelation) }
    ];
    const overallAverage = toNum(a.avgOverall);

    // ดึงทุก evaluation เพื่อคำนวณ distribution (อาจพิจารณา paginate ถ้าข้อมูลใหญ่)
  const evaluations = await InternshipEvaluation.findAll({ attributes: ['overall_score'], where: { student_id: docStudentIds }, raw: true });

    const gradeCounts = {};
    const scoreBuckets = { '>=80':0, '70-79':0, '60-69':0, '50-59':0, '<50':0 };
    evaluations.forEach(ev => {
  // เลิกใช้ overall_grade -> คง logic bucket เฉพาะคะแนน
  const score = ev.overall_score != null ? parseFloat(ev.overall_score) : null;

      if (score != null) {
        if (score >= 80) scoreBuckets['>=80']++;
        else if (score >= 70) scoreBuckets['70-79']++;
        else if (score >= 60) scoreBuckets['60-69']++;
        else if (score >= 50) scoreBuckets['50-59']++;
        else scoreBuckets['<50']++;
      }
    });

    const scoreDistribution = Object.entries(scoreBuckets).map(([range,count])=>({ range, count }));
    const gradeDistribution = Object.entries(gradeCounts).map(([grade,count])=>({ grade, count }));

  return {
      academicYear,
      semester: sem || null,
      totalInterns,
      evaluatedCount,
      notEvaluated,
      completionPct,
      criteriaAverages,
      overallAverage,
      scoreDistribution,
      gradeDistribution,
      gradeCounts
    };
  },
  /**
   * ดึงรายการปีการศึกษาที่มีข้อมูลฝึกงาน (distinct academic_year จาก InternshipDocument)
   * ใช้สำหรับสร้างตัวเลือก filter ปีการศึกษาในหน้า Dashboard/Report
   */
  async getInternshipAcademicYears() {
    const { InternshipDocument } = db;
    const rows = await InternshipDocument.findAll({
      attributes: [[fn('DISTINCT', col('academic_year')), 'academicYear']],
      where: { academic_year: { [Op.ne]: null } },
      order: [[col('academic_year'), 'DESC']],
      raw: true
    });

    // map เป็น array ของปี พ.ศ. (number) และกรอง null/undefined
    return rows
      .map(r => parseInt(r.academicYear, 10))
      .filter(y => !isNaN(y));
  }
};
