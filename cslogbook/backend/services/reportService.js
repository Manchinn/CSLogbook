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
  async getProjectStatusSummary({ year, semester }) {
    const academicYear = resolveYear(year);
    const { ProjectDocument, ProjectExamResult } = db;

    // Base where clause — filter ตาม academic_year (และ semester ถ้าระบุ)
    const yearWhere = { academic_year: academicYear };
    if (semester) yearWhere.semester = semester;

    // นับจำนวนตาม status
    const statusCounts = await ProjectDocument.findAll({
      attributes: ['status', [fn('COUNT', col('project_id')), 'count']],
      where: yearWhere,
      group: ['status'],
      raw: true
    });

    const statusMap = {};
    let totalProjects = 0;
    statusCounts.forEach(r => {
      const c = parseInt(r.count, 10);
      statusMap[r.status] = c;
      totalProjects += c;
    });

    const activeStatuses = ['draft', 'advisor_assigned', 'in_progress'];
    const activeProjects = activeStatuses.reduce((sum, s) => sum + (statusMap[s] || 0), 0);

    // ผลสอบ — join ProjectExamResult กับ ProjectDocument เพื่อ filter ตาม academic_year
    const examResults = await ProjectExamResult.findAll({
      attributes: ['exam_type', 'result', [fn('COUNT', col('exam_result_id')), 'count']],
      include: [{ model: ProjectDocument, as: 'project', attributes: [], where: yearWhere }],
      group: ['exam_type', 'result'],
      raw: true
    });

    const examMap = {
      PROJECT1: { total: 0, passed: 0, failed: 0 },
      THESIS: { total: 0, passed: 0, failed: 0 }
    };
    examResults.forEach(r => {
      const type = r.exam_type;
      const count = parseInt(r.count, 10);
      if (examMap[type]) {
        examMap[type].total += count;
        if (r.result === 'PASS') examMap[type].passed = count;
        if (r.result === 'FAIL') examMap[type].failed = count;
      }
    });

    return {
      academicYear,
      totalProjects,
      activeProjects,
      completedProjects: statusMap['completed'] || 0,
      criticalIssues: statusMap['cancelled'] || 0,
      project1: examMap.PROJECT1,
      project2: examMap.THESIS,
      byStatus: statusCounts.map(r => ({ status: r.status, count: parseInt(r.count, 10) }))
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
      { key: 'discipline', criteriaName: 'ระเบียบวินัย', avgRaw: toNum(a.avgDiscipline), average: scaleToFive(a.avgDiscipline) },
      { key: 'behavior', criteriaName: 'พฤติกรรม', avgRaw: toNum(a.avgBehavior), average: scaleToFive(a.avgBehavior) },
      { key: 'performance', criteriaName: 'ผลงาน', avgRaw: toNum(a.avgPerformance), average: scaleToFive(a.avgPerformance) },
      { key: 'method', criteriaName: 'วิธีการทำงาน', avgRaw: toNum(a.avgMethod), average: scaleToFive(a.avgMethod) },
      { key: 'relation', criteriaName: 'มนุษยสัมพันธ์', avgRaw: toNum(a.avgRelation), average: scaleToFive(a.avgRelation) }
    ];
    const overallAverage = toNum(a.avgOverall);

    // ดึงทุก evaluation เพื่อคำนวณ distribution (อาจพิจารณา paginate ถ้าข้อมูลใหญ่)
  const evaluations = await InternshipEvaluation.findAll({ attributes: ['overall_score'], where: { student_id: docStudentIds }, raw: true });

    const { SCORE_BUCKETS, scoreToBucket } = require('../config/scoring');
    const gradeCounts = {};
    const scoreBuckets = Object.fromEntries(SCORE_BUCKETS.map(b => [b.range, 0]));
    evaluations.forEach(ev => {
      const score = ev.overall_score != null ? parseFloat(ev.overall_score) : null;
      if (score != null) {
        scoreBuckets[scoreToBucket(score)]++;
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
  },
  /**
   * ดึงรายการปีการศึกษาที่มีข้อมูลโครงงาน (distinct academic_year จาก ProjectDocument)
   * ใช้สำหรับสร้างตัวเลือก filter ปีการศึกษาในหน้า ProjectReport / Project management
   */
  async getProjectAcademicYears() {
    const { ProjectDocument } = db;
    const rows = await ProjectDocument.findAll({
      attributes: [[fn('DISTINCT', col('academic_year')), 'academicYear']],
      where: { academic_year: { [Op.ne]: null } },
      order: [[col('academic_year'), 'DESC']],
      raw: true
    });

    return rows
      .map(r => parseInt(r.academicYear, 10))
      .filter(y => !isNaN(y));
  },

  /**
   * ดึงรายละเอียดอาจารย์ (ข้อมูลอาจารย์, นักศึกษาที่ดูแล, โครงงานที่เป็นที่ปรึกษา)
   * @param {number} teacherId - Teacher ID
   * @returns {Promise<Object>} Advisor detail data
   */
  async getAdvisorDetail(teacherId) {
    const { Teacher, Student, ProjectDocument, ProjectMember, User } = db;
    const { Op } = require('sequelize');
    
    const teacher = await Teacher.findByPk(parseInt(teacherId), {
      include: [{
        model: User,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });
    
    if (!teacher) {
      throw new Error('ไม่พบอาจารย์');
    }

    // ดึงนักศึกษาที่ดูแลและโครงงานที่เป็นที่ปรึกษาแบบ parallel
    const [students, projects] = await Promise.all([
      Student.findAll({
        where: { advisor_id: parseInt(teacherId) },
        include: [{
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName']
        }],
        attributes: ['studentId', 'studentCode', 'internshipStatus']
      }),
      ProjectDocument.findAll({
        where: {
          [Op.or]: [
            { advisor_id: parseInt(teacherId) },
            { co_advisor_id: parseInt(teacherId) }
          ]
        },
        attributes: ['projectId', 'projectNameTh', 'status', 'advisorId', 'coAdvisorId'],
        include: [{
          model: ProjectMember,
          as: 'members',
          include: [{
            model: Student,
            as: 'student',
            include: [{
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName']
            }]
          }]
        }]
      })
    ]);

    return {
      teacher: {
        teacherId: teacher.teacherId,
        teacherCode: teacher.teacherCode,
        name: teacher.user ? `${teacher.user.firstName} ${teacher.user.lastName}` : teacher.teacherCode,
        email: teacher.user?.email
      },
      students: students.map(s => ({
        studentId: s.studentId,
        studentCode: s.studentCode,
        name: `${s.user.firstName} ${s.user.lastName}`,
        internshipStatus: s.internshipStatus
      })),
      projects: projects.map(p => ({
        projectId: p.projectId,
        projectName: p.projectNameTh,
        status: p.status,
        role: p.advisorId === parseInt(teacherId) ? 'advisor' : 'co-advisor',
        members: p.members?.map(m => ({
          studentCode: m.student?.studentCode,
          name: m.student?.user ? `${m.student.user.firstName} ${m.student.user.lastName}` : 'N/A'
        })) || []
      })),
      summary: {
        totalStudents: students.length,
        totalProjects: projects.length,
        advisorProjectsCount: projects.filter(p => p.advisorId === parseInt(teacherId)).length,
        coAdvisorProjectsCount: projects.filter(p => p.coAdvisorId === parseInt(teacherId)).length
      }
    };
  },

  /**
   * ดึงรายชื่อนักศึกษาฝึกงานที่ลงทะเบียน
   * @param {Object} filters - { year }
   * @returns {Promise<Array>} Array of enrolled internship students
   */
  /**
   * Document Pipeline Report:
   * สถิติเอกสารแยกตามประเภท (documentName) และสถานะ (status)
   * รองรับ filter ตาม documentType (INTERNSHIP/PROJECT), academicYear, semester
   */
  async getDocumentPipeline({ year, semester, documentType }) {
    const academicYear = resolveYear(year);
    const sem = semester ? parseInt(semester, 10) : null;
    const sequelize = db.sequelize;

    // Base WHERE clause
    const conditions = [];
    const replacements = {};

    if (documentType) {
      conditions.push('d.document_type = :documentType');
      replacements.documentType = documentType;
    }

    // Join internship_documents หรือ project_documents เพื่อ filter ปี/ภาค
    let joinClause = '';
    if (academicYear) {
      // เช็คจากทั้ง internship_documents และ project_documents
      joinClause = `
        LEFT JOIN internship_documents idoc ON idoc.document_id = d.document_id
        LEFT JOIN project_documents pdoc ON pdoc.document_id = d.document_id`;
      conditions.push('(idoc.academic_year = :ay OR pdoc.academic_year = :ay)');
      replacements.ay = academicYear;
      if (sem) {
        conditions.push('(idoc.semester = :sem OR pdoc.semester = :sem)');
        replacements.sem = sem;
      }
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1) สถิติรวมตาม documentName + status
    const pipelineSql = `
      SELECT
        d.document_name AS documentName,
        d.document_type AS documentType,
        d.status,
        COUNT(*) AS count
      FROM documents d
      ${joinClause}
      ${whereClause}
      GROUP BY d.document_name, d.document_type, d.status
      ORDER BY d.document_type, d.document_name, d.status`;

    const rows = await sequelize.query(pipelineSql, {
      type: sequelize.QueryTypes.SELECT,
      replacements
    });

    // 2) จัดกลุ่มเป็น { documentName, documentType, total, statuses: { pending: N, approved: N, ... } }
    const docMap = {};
    rows.forEach(r => {
      const key = `${r.documentType}:${r.documentName}`;
      if (!docMap[key]) {
        docMap[key] = {
          documentName: r.documentName,
          documentType: r.documentType,
          total: 0,
          statuses: {}
        };
      }
      const count = parseInt(r.count, 10);
      docMap[key].statuses[r.status] = count;
      docMap[key].total += count;
    });

    const pipeline = Object.values(docMap).sort((a, b) => b.total - a.total);

    // 3) สรุปรวมทุกประเภท
    const summary = { total: 0, pending: 0, approved: 0, rejected: 0, completed: 0, draft: 0, other: 0 };
    const knownStatuses = ['pending', 'approved', 'rejected', 'completed', 'draft'];
    pipeline.forEach(doc => {
      summary.total += doc.total;
      Object.entries(doc.statuses).forEach(([status, count]) => {
        if (knownStatuses.includes(status)) summary[status] += count;
        else summary.other += count;
      });
    });

    return { academicYear, semester: sem || null, summary, pipeline };
  },

  /**
   * Internship Supervisor Report:
   * สถิติพี่เลี้ยงและบริษัทฝึกงาน (จาก InternshipDocument.supervisorName + companyName)
   * - จำนวนนักศึกษาต่อพี่เลี้ยง/บริษัท
   * - logbook supervisor approval rate
   * - evaluation completion rate
   */
  async getInternshipSupervisorReport({ year, semester }) {
    const academicYear = resolveYear(year);
    const sem = semester ? parseInt(semester, 10) : null;
    const sequelize = db.sequelize;

    // Filter conditions
    const conditions = ['d.status != :cancelled'];
    const replacements = { cancelled: 'cancelled' };
    if (academicYear) {
      conditions.push('idoc.academic_year = :ay');
      replacements.ay = academicYear;
    }
    if (sem) {
      conditions.push('idoc.semester = :sem');
      replacements.sem = sem;
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1) Group by company + supervisor — student counts & logbook stats
    // 2) Evaluation counts per company
    // Run both independent queries in parallel
    const [rows, evalRows] = await Promise.all([
      sequelize.query(`
        SELECT
          idoc.company_name AS companyName,
          COALESCE(idoc.supervisor_name, '-') AS supervisorName,
          idoc.supervisor_email AS supervisorEmail,
          COUNT(DISTINCT d.user_id) AS studentCount,
          COUNT(lb.log_id) AS totalLogs,
          SUM(CASE WHEN lb.supervisor_approved = 1 THEN 1 ELSE 0 END) AS supervisorApprovedLogs,
          SUM(CASE WHEN lb.advisor_approved = 1 THEN 1 ELSE 0 END) AS advisorApprovedLogs
        FROM internship_documents idoc
        INNER JOIN documents d ON d.document_id = idoc.document_id
        LEFT JOIN internship_logbooks lb ON lb.internship_id = idoc.internship_id
        ${whereClause}
        GROUP BY idoc.company_name, idoc.supervisor_name, idoc.supervisor_email
        ORDER BY studentCount DESC
      `, { type: sequelize.QueryTypes.SELECT, replacements }),
      sequelize.query(`
        SELECT
          idoc.company_name AS companyName,
          COALESCE(idoc.supervisor_name, '-') AS supervisorName,
          COUNT(DISTINCT ev.student_id) AS evaluatedStudents
        FROM internship_documents idoc
        INNER JOIN documents d ON d.document_id = idoc.document_id
        LEFT JOIN internship_evaluations ev ON ev.student_id = d.user_id
        ${whereClause}
        GROUP BY idoc.company_name, idoc.supervisor_name
      `, { type: sequelize.QueryTypes.SELECT, replacements })
    ]);

    const evalMap = {};
    evalRows.forEach(r => {
      evalMap[`${r.companyName}::${r.supervisorName}`] = parseInt(r.evaluatedStudents, 10);
    });

    // 3) Build result
    const supervisors = rows.map(r => {
      const studentCount = parseInt(r.studentCount, 10);
      const totalLogs = parseInt(r.totalLogs, 10);
      const supervisorApprovedLogs = parseInt(r.supervisorApprovedLogs, 10);
      const advisorApprovedLogs = parseInt(r.advisorApprovedLogs, 10);
      const evalCount = evalMap[`${r.companyName}::${r.supervisorName}`] || 0;

      return {
        companyName: r.companyName,
        supervisorName: r.supervisorName,
        supervisorEmail: r.supervisorEmail || null,
        studentCount,
        totalLogs,
        supervisorApprovalRate: totalLogs ? +((supervisorApprovedLogs / totalLogs) * 100).toFixed(1) : 0,
        advisorApprovalRate: totalLogs ? +((advisorApprovedLogs / totalLogs) * 100).toFixed(1) : 0,
        evaluationCompletionRate: studentCount ? +((evalCount / studentCount) * 100).toFixed(1) : 0,
        evaluatedStudents: evalCount
      };
    });

    return { academicYear, semester: sem || null, supervisors };
  },

  async getEnrolledInternshipStudents(filters = {}) {
    const { Student, User, Document, InternshipDocument } = db;
    const sequelize = db.sequelize;

    const buddhistYear = () => new Date().getFullYear() + 543;
    const selectedYear = parseInt(filters.year, 10) || buddhistYear();

    const calcStudentYear = (studentCode) => {
      if (!studentCode || studentCode.length < 2) return null;
      const yy = parseInt(studentCode.substring(0, 2), 10);
      if (isNaN(yy)) return null;
      const admissionYear = 2500 + yy;
      const year = selectedYear - admissionYear + 1;
      return year < 1 ? 1 : (year > 8 ? 8 : year);
    };

    const rows = await User.findAll({
      where: { role: 'student' },
      attributes: ['userId', 'firstName', 'lastName'],
      include: [
        {
          model: Student,
          as: 'student',
          required: true,
          where: { is_enrolled_internship: true },
          attributes: ['studentId', 'studentCode', 'internshipStatus', 'advisor_id', 'is_enrolled_internship']
        },
        {
          model: Document,
          as: 'documents',
          required: false,
          where: { documentName: 'CS05' },
          attributes: ['documentId', 'status'],
          include: [{
            model: InternshipDocument,
            as: 'internshipDocument',
            required: false,
            attributes: ['internshipId', 'companyName', 'internshipPosition', 'supervisorName', 'supervisorEmail', 'startDate', 'endDate']
          }]
        }
      ],
      order: [[{ model: Student, as: 'student' }, 'studentCode', 'ASC']]
    });

    // Batch: logbook stats per student (count + totalHours)
    const studentIds = rows.map(r => r.student?.studentId).filter(Boolean);
    let logbookMap = {};
    let evalMap = {};
    let reflectionSet = new Set();
    let certMap = {};

    if (studentIds.length > 0) {
      // Run all 4 independent batch queries in parallel
      const [logStats, evalStats, reflections, certs] = await Promise.all([
        // Logbook: count + sum hours
        sequelize.query(`
          SELECT student_id AS studentId,
            COUNT(log_id) AS logCount,
            COALESCE(SUM(work_hours), 0) AS totalHours,
            SUM(CASE WHEN supervisor_approved = 1 THEN 1 ELSE 0 END) AS supervisorApproved,
            SUM(CASE WHEN advisor_approved = 1 THEN 1 ELSE 0 END) AS advisorApproved
          FROM internship_logbooks
          WHERE student_id IN (:studentIds)
          GROUP BY student_id
        `, { type: sequelize.QueryTypes.SELECT, replacements: { studentIds } }),
        // Evaluation: has evaluation + overall score + pass/fail
        sequelize.query(`
          SELECT student_id AS studentId,
            overall_score AS overallScore,
            pass_fail AS passFail,
            status
          FROM internship_evaluations
          WHERE student_id IN (:studentIds)
        `, { type: sequelize.QueryTypes.SELECT, replacements: { studentIds } }),
        // Reflection: who submitted
        sequelize.query(`
          SELECT DISTINCT student_id AS studentId
          FROM internship_logbook_reflections
          WHERE student_id IN (:studentIds)
        `, { type: sequelize.QueryTypes.SELECT, replacements: { studentIds } }),
        // Certificate: latest status
        sequelize.query(`
          SELECT cr.student_id AS studentId, cr.status, cr.total_hours AS certHours
          FROM internship_certificate_requests cr
          WHERE cr.student_id IN (:sids)
          ORDER BY cr.created_at DESC
        `, { type: sequelize.QueryTypes.SELECT, replacements: { sids: studentIds.map(String) } })
      ]);

      logStats.forEach(r => {
        logbookMap[r.studentId] = {
          logCount: parseInt(r.logCount, 10),
          totalHours: parseFloat(r.totalHours),
          supervisorApproved: parseInt(r.supervisorApproved, 10),
          advisorApproved: parseInt(r.advisorApproved, 10)
        };
      });
      evalStats.forEach(r => {
        evalMap[r.studentId] = {
          evaluated: true,
          overallScore: r.overallScore != null ? parseFloat(r.overallScore) : null,
          passFail: r.passFail || null,
          evalStatus: r.status
        };
      });
      reflections.forEach(r => reflectionSet.add(r.studentId));
      certs.forEach(r => {
        if (!certMap[r.studentId]) certMap[r.studentId] = { certStatus: r.status, certHours: r.certHours };
      });
    }

    return rows.map(r => {
      const student = r.student;
      const cs05Docs = (r.documents || []).filter(d => d.documentName === 'CS05');
      const doc = cs05Docs[0];
      const internshipDoc = doc?.internshipDocument || null;
      const sid = student.studentId;
      const lb = logbookMap[sid] || { logCount: 0, totalHours: 0, supervisorApproved: 0, advisorApproved: 0 };
      const ev = evalMap[sid] || { evaluated: false, overallScore: null, passFail: null, evalStatus: null };
      const cert = certMap[sid] || { certStatus: null, certHours: null };

      return {
        studentId: sid,
        studentCode: student.studentCode,
        fullName: `${r.firstName || ''} ${r.lastName || ''}`.trim(),
        internshipStatus: student.internshipStatus,
        studentYear: calcStudentYear(student.studentCode),
        internshipId: internshipDoc?.internshipId || null,
        companyName: internshipDoc?.companyName || null,
        internshipPosition: internshipDoc?.internshipPosition || null,
        supervisorName: internshipDoc?.supervisorName || null,
        supervisorEmail: internshipDoc?.supervisorEmail || null,
        startDate: internshipDoc?.startDate || null,
        endDate: internshipDoc?.endDate || null,
        documentStatus: doc?.status || null,
        // Logbook stats
        logCount: lb.logCount,
        totalHours: lb.totalHours,
        logSupervisorApproved: lb.supervisorApproved,
        logAdvisorApproved: lb.advisorApproved,
        // Evaluation
        evaluated: ev.evaluated,
        overallScore: ev.overallScore,
        passFail: ev.passFail,
        // Reflection & Certificate
        reflectionSubmitted: reflectionSet.has(sid),
        certificateStatus: cert.certStatus,
      };
    });
  }
};
