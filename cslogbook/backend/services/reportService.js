// services/reportService.js
// Aggregation logic สำหรับรายงาน Support Staff
// หมายเหตุ: บาง metric ยังไม่มีฟิลด์รองรับใน schema ปัจจุบัน จึงใช้ placeholder/approximation
const { Op, fn, col, literal, Sequelize } = require('sequelize');
const db = require('../models');

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
  async getInternshipLogbookCompliance({ year }) {
    const academicYear = resolveYear(year);

    // ดึง 8 สัปดาห์ล่าสุดของบันทึก (ใช้ raw SQL YEARWEEK)
    const sequelize = db.sequelize;
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

    return { academicYear, weeklyTrend, rate, atRiskStudents };
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

  // Advisor Load (Project side + student advisee)
  async getAdvisorLoad({ year }) {
    const academicYear = resolveYear(year);

    // โหลดจำนวนโครงงานที่เป็น advisor / co-advisor
    const projectAdvisor = await db.ProjectDocument.findAll({
      attributes: [
        'advisor_id',
        [fn('COUNT', col('project_id')), 'advisorProjectCount']
      ],
      group: ['advisor_id'],
      raw: true
    });
    const projectCoAdvisor = await db.ProjectDocument.findAll({
      attributes: [
        'co_advisor_id',
        [fn('COUNT', col('project_id')), 'coAdvisorProjectCount']
      ],
      where: { co_advisor_id: { [Op.ne]: null } },
      group: ['co_advisor_id'],
      raw: true
    });

    const advisorStudent = await db.Student.findAll({
      attributes: [
        'advisor_id',
        [fn('COUNT', col('student_id')), 'adviseeCount']
      ],
      where: { advisor_id: { [Op.ne]: null } },
      group: ['advisor_id'],
      raw: true
    });

    // รวมเป็น map ตาม teacherId
    const mergeMap = {};
    const ensure = (id) => { if(!mergeMap[id]) mergeMap[id] = { teacherId: id, advisorProjectCount:0, coAdvisorProjectCount:0, adviseeCount:0 }; };
    projectAdvisor.forEach(r=>{ ensure(r.advisor_id); mergeMap[r.advisor_id].advisorProjectCount = parseInt(r.advisorProjectCount,10); });
    projectCoAdvisor.forEach(r=>{ ensure(r.co_advisor_id); mergeMap[r.co_advisor_id].coAdvisorProjectCount = parseInt(r.coAdvisorProjectCount,10); });
    advisorStudent.forEach(r=>{ ensure(r.advisor_id); mergeMap[r.advisor_id].adviseeCount = parseInt(r.adviseeCount,10); });

    const teachers = await db.Teacher.findAll({ where: { teacherId: Object.keys(mergeMap) } });
    teachers.forEach(t => { if (mergeMap[t.teacherId]) mergeMap[t.teacherId].name = t.teacherCode; });

    const advisors = Object.values(mergeMap).sort((a,b)=> (b.adviseeCount + b.advisorProjectCount) - (a.adviseeCount + a.advisorProjectCount));

    return { academicYear, advisors };
  }
  ,
  /**
   * สรุปสถานะการฝึกงานของนักศึกษา (heuristic)
   * - started: มีเอกสารฝึกงาน (document_type='internship' และ status != 'draft') หรือมี logbook อย่างน้อย 1
   * - completed: เอกสารฝึกงานสถานะ completed
   * - inProgress: started - completed
   * - notStarted: totalStudents - started
   * TODO: รองรับ filter ตามปีการศึกษาเมื่อ schema มี (เช่น Student.academicYear หรือ InternshipDocument.academicYear)
   */
  async getInternshipStudentSummary({ year }) {
    const academicYear = resolveYear(year);
    const { Student, Document } = db;

    // ฐานใหม่: ใช้ฟิลด์ is_enrolled_internship เป็นการนับ enrolled โดยตรง
    const enrolledCount = await Student.count({ where: { is_enrolled_internship: true } });

    // Completed: ใช้เอกสารฝึกงานที่ status = 'completed' (จะ mapping ผ่าน user_id -> student)
    const completedRows = await Document.findAll({
      attributes: ['user_id'],
      where: { document_type: 'internship', status: 'completed' },
      group: ['user_id'],
      raw: true
    });
    const completed = completedRows.length;
    const started = enrolledCount; // ปรับ started = enrolled เพื่อสอดคล้อง UI
    const inProgress = Math.max(0, started - completed);

    // totalStudents: ทั้งระบบ (baseline เปรียบเทียบ) – อาจมีมากกว่าผู้ลงทะเบียน
    const totalStudents = await Student.count();
    const notStarted = Math.max(0, totalStudents - started);

    return { academicYear, totalStudents, enrolledCount, started, completed, inProgress, notStarted };
  }
  ,
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
    const sem = semester || 1;
  const { InternshipEvaluation, InternshipLogbook } = db;

  // Distinct interns (approx): ใช้ student_id จาก logbook และ evaluation (union)
  const logbookStudents = await InternshipLogbook.findAll({ attributes: ['student_id'], group: ['student_id'], raw: true });
  const evalStudents = await InternshipEvaluation.findAll({ attributes: ['student_id'], group: ['student_id'], raw: true });
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
  const evaluations = await InternshipEvaluation.findAll({ attributes: ['overall_score'], raw: true });

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
      semester: sem,
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
  }
};
