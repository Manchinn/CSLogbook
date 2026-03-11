'use strict';

/**
 * UAT Happy-Path Seeder
 * สร้างข้อมูลสำหรับทดสอบ 3 tracks: Internship, Special Project (PROJECT1), Thesis (THESIS)
 *
 * Users ที่สร้าง:
 *   - teacher: uat_advisor / password123
 *   - teacher: uat_committee / password123
 *   - admin:   uat_admin / password123
 *   - student: uat_intern / password123   → Internship track
 *   - student: uat_proj   / password123   → Special Project track
 *   - student: uat_thesis / password123   → Thesis track
 */

const bcrypt = require('bcrypt');

// ค่าคงที่สำหรับ cleanup
const UAT_USERNAMES = [
  'uat_advisor', 'uat_committee', 'uat_admin',
  'uat_intern', 'uat_proj', 'uat_thesis'
];
const UAT_PROJECT_PREFIX = '[UAT]';

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      const now = new Date();
      const passwordHash = await bcrypt.hash('password123', 10);

      // ─── helper: query หา row แรกหลัง insert ─────────────────────
      const selectOne = async (sql, replacements = {}) => {
        const rows = await queryInterface.sequelize.query(sql, {
          replacements,
          type: Sequelize.QueryTypes.SELECT,
          transaction: t
        });
        return rows[0] ?? null;
      };

      // ─── 0. หา curriculum ที่ active อยู่ ──────────────────────────
      const curriculum = await selectOne(
        `SELECT curriculum_id, internship_base_credits, project_base_credits, project_major_base_credits
         FROM curriculums WHERE active = true ORDER BY curriculum_id DESC LIMIT 1`
      );
      if (!curriculum) throw new Error('ไม่พบ curriculum ที่ active — ต้อง run curriculum seeder ก่อน');

      const curriculumId = curriculum.curriculum_id;

      // ─── 1. Users ─────────────────────────────────────────────────
      await queryInterface.bulkInsert('users', [
        // Teachers
        {
          username: 'uat_advisor',
          password: passwordHash,
          email: 'uat_advisor@kmutnb.ac.th',
          role: 'teacher',
          first_name: 'อาจารย์ทดสอบ',
          last_name: 'ที่ปรึกษา',
          active_status: true,
          created_at: now,
          updated_at: now
        },
        {
          username: 'uat_committee',
          password: passwordHash,
          email: 'uat_committee@kmutnb.ac.th',
          role: 'teacher',
          first_name: 'อาจารย์ทดสอบ',
          last_name: 'กรรมการ',
          active_status: true,
          created_at: now,
          updated_at: now
        },
        // Admin
        {
          username: 'uat_admin',
          password: passwordHash,
          email: 'uat_admin@kmutnb.ac.th',
          role: 'admin',
          first_name: 'เจ้าหน้าที่ทดสอบ',
          last_name: 'UAT',
          active_status: true,
          created_at: now,
          updated_at: now
        },
        // Students
        {
          username: 'uat_intern',
          password: passwordHash,
          email: 'uat_intern@stu.kmutnb.ac.th',
          role: 'student',
          first_name: 'นศ.ฝึกงาน',
          last_name: 'ทดสอบ',
          active_status: true,
          created_at: now,
          updated_at: now
        },
        {
          username: 'uat_proj',
          password: passwordHash,
          email: 'uat_proj@stu.kmutnb.ac.th',
          role: 'student',
          first_name: 'นศ.โปรเจค',
          last_name: 'ทดสอบ',
          active_status: true,
          created_at: now,
          updated_at: now
        },
        {
          username: 'uat_thesis',
          password: passwordHash,
          email: 'uat_thesis@stu.kmutnb.ac.th',
          role: 'student',
          first_name: 'นศ.วิทยานิพนธ์',
          last_name: 'ทดสอบ',
          active_status: true,
          created_at: now,
          updated_at: now
        }
      ], { transaction: t });

      // ─── ดึง user_id ที่เพิ่ง insert ────────────────────────────
      const advisorUser   = await selectOne(`SELECT user_id FROM users WHERE username = 'uat_advisor'`);
      const committeeUser = await selectOne(`SELECT user_id FROM users WHERE username = 'uat_committee'`);
      const adminUser     = await selectOne(`SELECT user_id FROM users WHERE username = 'uat_admin'`);
      const internUser    = await selectOne(`SELECT user_id FROM users WHERE username = 'uat_intern'`);
      const projUser      = await selectOne(`SELECT user_id FROM users WHERE username = 'uat_proj'`);
      const thesisUser    = await selectOne(`SELECT user_id FROM users WHERE username = 'uat_thesis'`);

      // ─── 2. Teachers ──────────────────────────────────────────────
      await queryInterface.bulkInsert('teachers', [
        {
          user_id: advisorUser.user_id,
          teacher_code: 'UAT001',
          teacher_type: 'academic',
          position: 'ผู้ช่วยศาสตราจารย์',
          can_access_topic_exam: true,
          can_export_project1: true,
          created_at: now,
          updated_at: now
        },
        {
          user_id: committeeUser.user_id,
          teacher_code: 'UAT002',
          teacher_type: 'academic',
          position: 'อาจารย์',
          can_access_topic_exam: true,
          can_export_project1: false,
          created_at: now,
          updated_at: now
        }
      ], { transaction: t });

      const advisorTeacher = await selectOne(
        `SELECT teacher_id FROM teachers WHERE user_id = :uid`,
        { uid: advisorUser.user_id }
      );

      // ─── 3. Admin ─────────────────────────────────────────────────
      await queryInterface.bulkInsert('admins', [{
        user_id: adminUser.user_id,
        admin_code: 'UATA01',
        responsibilities: 'UAT testing',
        created_at: now,
        updated_at: now
      }], { transaction: t });

      // ─── 4. Students ──────────────────────────────────────────────
      // ให้ credits เพียงพอสำหรับทั้ง internship และ project
      const internshipCredits = curriculum.internship_base_credits || 81;
      const projectCredits    = curriculum.project_base_credits || 95;
      const majorCredits      = curriculum.project_major_base_credits || 47;

      await queryInterface.bulkInsert('students', [
        {
          user_id: internUser.user_id,
          student_code: '9900062610100',
          classroom: 'RA',
          total_credits: internshipCredits + 5,
          major_credits: majorCredits + 5,
          gpa: 3.25,
          study_type: 'regular',
          is_eligible_internship: true,
          is_eligible_project: false,
          is_enrolled_internship: true,
          is_enrolled_project: false,
          internship_status: 'not_started',
          project_status: 'not_started',
          advisor_id: advisorTeacher.teacher_id,
          curriculum_id: curriculumId,
          created_at: now,
          updated_at: now
        },
        {
          user_id: projUser.user_id,
          student_code: '9900062610101',
          classroom: 'RA',
          total_credits: projectCredits + 5,
          major_credits: majorCredits + 5,
          gpa: 3.50,
          study_type: 'regular',
          is_eligible_internship: true,
          is_eligible_project: true,
          is_enrolled_internship: false,
          is_enrolled_project: true,
          internship_status: 'not_started',
          project_status: 'not_started',
          advisor_id: advisorTeacher.teacher_id,
          curriculum_id: curriculumId,
          created_at: now,
          updated_at: now
        },
        {
          user_id: thesisUser.user_id,
          student_code: '9900062610102',
          classroom: 'RB',
          total_credits: projectCredits + 10,
          major_credits: majorCredits + 10,
          gpa: 3.75,
          study_type: 'regular',
          is_eligible_internship: true,
          is_eligible_project: true,
          is_enrolled_internship: false,
          is_enrolled_project: true,
          internship_status: 'not_started',
          project_status: 'not_started',
          advisor_id: advisorTeacher.teacher_id,
          curriculum_id: curriculumId,
          created_at: now,
          updated_at: now
        }
      ], { transaction: t });

      const internStudent = await selectOne(`SELECT student_id FROM students WHERE user_id = :uid`, { uid: internUser.user_id });
      const projStudent   = await selectOne(`SELECT student_id FROM students WHERE user_id = :uid`, { uid: projUser.user_id });
      const thesisStudent = await selectOne(`SELECT student_id FROM students WHERE user_id = :uid`, { uid: thesisUser.user_id });

      // ═════════════════════════════════════════════════════════════
      // TRACK 1: Internship — happy path ถึง completed
      // ═════════════════════════════════════════════════════════════

      // 5a. Document (parent)
      await queryInterface.bulkInsert('documents', [{
        user_id: internUser.user_id,
        document_type: 'INTERNSHIP',
        document_name: 'CS05',
        category: 'proposal',
        status: 'approved',
        submitted_at: now,
        created_at: now,
        updated_at: now
      }], { transaction: t });

      const internDoc = await selectOne(
        `SELECT document_id FROM documents WHERE user_id = :uid AND document_type = 'INTERNSHIP' AND document_name = 'CS05' ORDER BY document_id DESC LIMIT 1`,
        { uid: internUser.user_id }
      );

      // 5b. InternshipDocument
      const internStartDate = new Date('2026-04-01');
      const internEndDate   = new Date('2026-06-30');

      await queryInterface.bulkInsert('internship_documents', [{
        document_id: internDoc.document_id,
        company_name: '[UAT] บริษัท ทดสอบ จำกัด',
        company_address: '123 ถ.พิบูลสงคราม แขวงบางซื่อ เขตบางซื่อ กทม. 10800',
        internship_position: 'Software Developer Intern',
        contact_person_name: 'คุณสมชาย ทดสอบ',
        contact_person_position: 'ผู้จัดการฝ่ายบุคคล',
        supervisor_name: 'คุณสมหญิง ทดสอบ',
        supervisor_position: 'Senior Developer',
        supervisor_phone: '0812345678',
        supervisor_email: 'supervisor@example.com',
        start_date: internStartDate,
        end_date: internEndDate,
        academic_year: 2569,
        semester: 3,
        created_at: now,
        updated_at: now
      }], { transaction: t });

      const internship = await selectOne(
        `SELECT internship_id FROM internship_documents WHERE document_id = :docId`,
        { docId: internDoc.document_id }
      );

      // 5c. Logbook entries (3 สัปดาห์)
      const logbookEntries = [];
      for (let week = 0; week < 3; week++) {
        const workDate = new Date(internStartDate);
        workDate.setDate(workDate.getDate() + (week * 7));
        logbookEntries.push({
          internship_id: internship.internship_id,
          student_id: internStudent.student_id,
          academic_year: 2569,
          semester: 3,
          work_date: workDate,
          log_title: `${UAT_PROJECT_PREFIX} สัปดาห์ที่ ${week + 1}`,
          work_description: `ทำงานพัฒนา feature สัปดาห์ที่ ${week + 1}`,
          learning_outcome: `เรียนรู้เทคโนโลยีใหม่สัปดาห์ที่ ${week + 1}`,
          work_hours: 8.00,
          problems: week === 2 ? null : `ปัญหาเล็กน้อยสัปดาห์ที่ ${week + 1}`,
          created_at: now,
          updated_at: now
        });
      }
      await queryInterface.bulkInsert('internship_logbooks', logbookEntries, { transaction: t });

      // 5d. Evaluation (supervisor ประเมินแล้ว)
      await queryInterface.bulkInsert('internship_evaluations', [{
        internship_id: internship.internship_id,
        student_id: internStudent.student_id,
        evaluator_name: 'คุณสมหญิง ทดสอบ',
        evaluation_date: now,
        overall_score: 85.00,
        discipline_score: 4,
        behavior_score: 5,
        performance_score: 4,
        method_score: 4,
        relation_score: 5,
        strengths: 'ขยัน ตั้งใจ เรียนรู้เร็ว',
        weaknesses_to_improve: 'ควรฝึก communication skills เพิ่ม',
        supervisor_pass_decision: true,
        pass_fail: 'PASS',
        pass_evaluated_at: now,
        status: 'completed',
        evaluated_by_supervisor_at: now,
        created_at: now,
        updated_at: now
      }], { transaction: t });

      // ═════════════════════════════════════════════════════════════
      // TRACK 2: Special Project (PROJECT1) — happy path ถึง topic exam PASS
      // ═════════════════════════════════════════════════════════════

      // 6a. Document (parent)
      await queryInterface.bulkInsert('documents', [{
        user_id: projUser.user_id,
        document_type: 'PROJECT',
        document_name: `${UAT_PROJECT_PREFIX} โปรเจคพิเศษ`,
        category: 'proposal',
        status: 'approved',
        submitted_at: now,
        created_at: now,
        updated_at: now
      }], { transaction: t });

      const projDoc = await selectOne(
        `SELECT document_id FROM documents WHERE user_id = :uid AND document_type = 'PROJECT' AND document_name LIKE '[UAT]%' ORDER BY document_id DESC LIMIT 1`,
        { uid: projUser.user_id }
      );

      // 6b. ProjectDocument
      await queryInterface.bulkInsert('project_documents', [{
        document_id: projDoc.document_id,
        project_name_th: `${UAT_PROJECT_PREFIX} ระบบจัดการข้อมูลด้วย AI`,
        project_name_en: `${UAT_PROJECT_PREFIX} AI-Powered Data Management System`,
        project_type: 'research',
        advisor_id: advisorTeacher.teacher_id,
        status: 'in_progress',
        academic_year: 2569,
        semester: 1,
        objective: 'พัฒนาระบบจัดการข้อมูลอัจฉริยะโดยใช้ AI',
        background: 'ปัจจุบันการจัดการข้อมูลยังต้องพึ่งพาแรงงานคนเป็นหลัก',
        scope: 'ระบบ web application สำหรับจัดการข้อมูลภายในองค์กร',
        expected_outcome: 'ระบบที่ช่วยลดเวลาจัดการข้อมูลลง 50%',
        exam_result: 'passed',
        exam_result_at: now,
        created_at: now,
        updated_at: now
      }], { transaction: t });

      const project1 = await selectOne(
        `SELECT project_id FROM project_documents WHERE document_id = :docId`,
        { docId: projDoc.document_id }
      );

      // 6c. ProjectMember
      await queryInterface.bulkInsert('project_members', [{
        project_id: project1.project_id,
        student_id: projStudent.student_id,
        role: 'leader',
        joined_at: now
      }], { transaction: t });

      // 6d. ProjectTrack
      await queryInterface.bulkInsert('project_tracks', [{
        project_id: project1.project_id,
        track_code: 'AI',
        created_at: now,
        updated_at: now
      }], { transaction: t });

      // 6e. ProjectExamResult (topic exam ผ่าน)
      await queryInterface.bulkInsert('project_exam_results', [{
        project_id: project1.project_id,
        exam_type: 'PROJECT1',
        result: 'PASS',
        score: 78.50,
        notes: 'หัวข้อน่าสนใจ ขอบเขตชัดเจน',
        require_scope_revision: false,
        recorded_by_user_id: committeeUser.user_id,
        recorded_at: now,
        created_at: now,
        updated_at: now
      }], { transaction: t });

      // 6f. Meeting + MeetingLog
      await queryInterface.bulkInsert('meetings', [{
        meeting_title: `${UAT_PROJECT_PREFIX} ประชุมติดตามความก้าวหน้าครั้งที่ 1`,
        meeting_date: now,
        meeting_method: 'onsite',
        meeting_location: 'ห้อง 401 ตึก IT',
        status: 'completed',
        phase: 'phase1',
        project_id: project1.project_id,
        created_by: projUser.user_id,
        created_at: now,
        updated_at: now
      }], { transaction: t });

      const meeting1 = await selectOne(
        `SELECT meeting_id FROM meetings WHERE project_id = :pid AND meeting_title LIKE '[UAT]%' ORDER BY meeting_id DESC LIMIT 1`,
        { pid: project1.project_id }
      );

      await queryInterface.bulkInsert('meeting_logs', [{
        meeting_id: meeting1.meeting_id,
        discussion_topic: 'ทบทวนหัวข้อและขอบเขตโครงงาน',
        current_progress: 'ศึกษา literature review เสร็จ 60%',
        problems_issues: 'ข้อมูลตัวอย่างยังไม่เพียงพอ',
        next_action_items: 'หาข้อมูลเพิ่มเติม ออกแบบ ER diagram',
        advisor_comment: 'ดำเนินงานได้ดี ให้เร่งทำส่วน design',
        approval_status: 'approved',
        approved_by: advisorUser.user_id,
        approved_at: now,
        recorded_by: projUser.user_id,
        created_at: now,
        updated_at: now
      }], { transaction: t });

      // 6g. ProjectWorkflowState
      await queryInterface.bulkInsert('project_workflow_states', [{
        project_id: project1.project_id,
        current_phase: 'IN_PROGRESS',
        project_status: 'in_progress',
        topic_exam_result: 'PASS',
        topic_exam_date: now,
        meeting_count: 1,
        approved_meeting_count: 1,
        is_blocked: false,
        is_overdue: false,
        last_activity_at: now,
        last_activity_type: 'meeting_approved',
        last_updated_by: advisorUser.user_id,
        created_at: now,
        updated_at: now
      }], { transaction: t });

      // ═════════════════════════════════════════════════════════════
      // TRACK 3: Thesis — happy path ถึง thesis exam PASS → COMPLETED
      // ═════════════════════════════════════════════════════════════

      // 7a. Document (parent)
      await queryInterface.bulkInsert('documents', [{
        user_id: thesisUser.user_id,
        document_type: 'PROJECT',
        document_name: `${UAT_PROJECT_PREFIX} วิทยานิพนธ์`,
        category: 'final',
        status: 'approved',
        submitted_at: now,
        created_at: now,
        updated_at: now
      }], { transaction: t });

      const thesisDoc = await selectOne(
        `SELECT document_id FROM documents WHERE user_id = :uid AND document_type = 'PROJECT' AND document_name LIKE '[UAT]%' ORDER BY document_id DESC LIMIT 1`,
        { uid: thesisUser.user_id }
      );

      // 7b. ProjectDocument
      await queryInterface.bulkInsert('project_documents', [{
        document_id: thesisDoc.document_id,
        project_name_th: `${UAT_PROJECT_PREFIX} การวิเคราะห์ประสิทธิภาพ Deep Learning สำหรับ NLP`,
        project_name_en: `${UAT_PROJECT_PREFIX} Performance Analysis of Deep Learning for NLP`,
        project_type: 'research',
        advisor_id: advisorTeacher.teacher_id,
        status: 'completed',
        academic_year: 2569,
        semester: 2,
        objective: 'วิเคราะห์ประสิทธิภาพโมเดล Deep Learning สำหรับงาน NLP ภาษาไทย',
        background: 'การประมวลผลภาษาธรรมชาติเป็นสาขาที่กำลังเติบโต',
        scope: 'เปรียบเทียบ BERT, GPT, T5 สำหรับงาน text classification ภาษาไทย',
        expected_outcome: 'แนวทางเลือกใช้โมเดลที่เหมาะสมกับงาน NLP ภาษาไทย',
        exam_result: 'passed',
        exam_result_at: now,
        created_at: now,
        updated_at: now
      }], { transaction: t });

      const thesisProject = await selectOne(
        `SELECT project_id FROM project_documents WHERE document_id = :docId`,
        { docId: thesisDoc.document_id }
      );

      // 7c. ProjectMember
      await queryInterface.bulkInsert('project_members', [{
        project_id: thesisProject.project_id,
        student_id: thesisStudent.student_id,
        role: 'leader',
        joined_at: now
      }], { transaction: t });

      // 7d. ProjectTrack
      await queryInterface.bulkInsert('project_tracks', [{
        project_id: thesisProject.project_id,
        track_code: 'AI',
        created_at: now,
        updated_at: now
      }], { transaction: t });

      // 7e. ProjectExamResult — topic exam + thesis exam ผ่านทั้งคู่
      await queryInterface.bulkInsert('project_exam_results', [
        {
          project_id: thesisProject.project_id,
          exam_type: 'PROJECT1',
          result: 'PASS',
          score: 82.00,
          notes: 'หัวข้อวิจัยดี methodology ชัดเจน',
          require_scope_revision: false,
          recorded_by_user_id: committeeUser.user_id,
          recorded_at: now,
          created_at: now,
          updated_at: now
        },
        {
          project_id: thesisProject.project_id,
          exam_type: 'THESIS',
          result: 'PASS',
          score: 88.00,
          notes: 'ผลงานวิจัยดีเยี่ยม มีคุณภาพเพียงพอสำหรับตีพิมพ์',
          require_scope_revision: false,
          recorded_by_user_id: committeeUser.user_id,
          recorded_at: now,
          created_at: now,
          updated_at: now
        }
      ], { transaction: t });

      // 7f. Meetings + MeetingLogs (2 ครั้ง: phase1 + phase2)
      const meetingData = [
        {
          meeting_title: `${UAT_PROJECT_PREFIX} ประชุมติดตามวิทยานิพนธ์ ครั้งที่ 1`,
          phase: 'phase1',
          discussion: 'ทบทวน literature และวาง หmethodology',
          progress: 'สำรวจ paper ที่เกี่ยวข้อง 20 ฉบับ',
          next: 'เริ่ม implement baseline model',
          comment: 'ดี ให้เร่งทำ experiment'
        },
        {
          meeting_title: `${UAT_PROJECT_PREFIX} ประชุมติดตามวิทยานิพนธ์ ครั้งที่ 2`,
          phase: 'phase2',
          discussion: 'ทบทวนผลการทดลองและเขียนบทสรุป',
          progress: 'ทดลองเสร็จ 100% accuracy 92%',
          next: 'เขียนบทที่ 5 สรุปผลและข้อเสนอแนะ',
          comment: 'ผลออกมาดีมาก พร้อมสอบป้องกัน'
        }
      ];

      for (const m of meetingData) {
        await queryInterface.bulkInsert('meetings', [{
          meeting_title: m.meeting_title,
          meeting_date: now,
          meeting_method: 'hybrid',
          meeting_location: 'ห้อง 501 ตึก IT',
          meeting_link: 'https://meet.google.com/uat-test',
          status: 'completed',
          phase: m.phase,
          project_id: thesisProject.project_id,
          created_by: thesisUser.user_id,
          created_at: now,
          updated_at: now
        }], { transaction: t });

        const mtg = await selectOne(
          `SELECT meeting_id FROM meetings WHERE project_id = :pid AND meeting_title = :title ORDER BY meeting_id DESC LIMIT 1`,
          { pid: thesisProject.project_id, title: m.meeting_title }
        );

        await queryInterface.bulkInsert('meeting_logs', [{
          meeting_id: mtg.meeting_id,
          discussion_topic: m.discussion,
          current_progress: m.progress,
          problems_issues: null,
          next_action_items: m.next,
          advisor_comment: m.comment,
          approval_status: 'approved',
          approved_by: advisorUser.user_id,
          approved_at: now,
          recorded_by: thesisUser.user_id,
          created_at: now,
          updated_at: now
        }], { transaction: t });
      }

      // 7g. ProjectWorkflowState — COMPLETED
      await queryInterface.bulkInsert('project_workflow_states', [{
        project_id: thesisProject.project_id,
        current_phase: 'COMPLETED',
        project_status: 'completed',
        topic_exam_result: 'PASS',
        topic_exam_date: now,
        thesis_exam_result: 'PASS',
        thesis_exam_date: now,
        meeting_count: 2,
        approved_meeting_count: 2,
        is_blocked: false,
        is_overdue: false,
        last_activity_at: now,
        last_activity_type: 'thesis_exam_pass',
        last_updated_by: committeeUser.user_id,
        created_at: now,
        updated_at: now
      }], { transaction: t });

      await t.commit();
      console.log('[UAT seed] สร้างข้อมูล happy-path สำเร็จ (3 tracks)');
    } catch (error) {
      await t.rollback();
      console.error('[UAT seed] ล้มเหลว:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      // ดึง user_ids ของ UAT users ทั้งหมด
      const uatUsers = await queryInterface.sequelize.query(
        `SELECT user_id FROM users WHERE username IN (:usernames)`,
        {
          replacements: { usernames: UAT_USERNAMES },
          type: Sequelize.QueryTypes.SELECT,
          transaction: t
        }
      );
      const userIds = uatUsers.map(u => u.user_id);

      if (userIds.length === 0) {
        console.log('[UAT seed] ไม่พบ UAT users — ไม่ต้อง rollback');
        await t.commit();
        return;
      }

      // ดึง student_ids
      const uatStudents = await queryInterface.sequelize.query(
        `SELECT student_id FROM students WHERE user_id IN (:userIds)`,
        { replacements: { userIds }, type: Sequelize.QueryTypes.SELECT, transaction: t }
      );
      const studentIds = uatStudents.map(s => s.student_id);

      // ดึง document_ids
      const uatDocs = await queryInterface.sequelize.query(
        `SELECT document_id FROM documents WHERE user_id IN (:userIds)`,
        { replacements: { userIds }, type: Sequelize.QueryTypes.SELECT, transaction: t }
      );
      const docIds = uatDocs.map(d => d.document_id);

      // ดึง internship_ids
      let internshipIds = [];
      if (docIds.length > 0) {
        const uatInternships = await queryInterface.sequelize.query(
          `SELECT internship_id FROM internship_documents WHERE document_id IN (:docIds)`,
          { replacements: { docIds }, type: Sequelize.QueryTypes.SELECT, transaction: t }
        );
        internshipIds = uatInternships.map(i => i.internship_id);
      }

      // ดึง project_ids
      let projectIds = [];
      if (docIds.length > 0) {
        const uatProjects = await queryInterface.sequelize.query(
          `SELECT project_id FROM project_documents WHERE document_id IN (:docIds)`,
          { replacements: { docIds }, type: Sequelize.QueryTypes.SELECT, transaction: t }
        );
        projectIds = uatProjects.map(p => p.project_id);
      }

      // ดึง meeting_ids
      let meetingIds = [];
      if (projectIds.length > 0) {
        const uatMeetings = await queryInterface.sequelize.query(
          `SELECT meeting_id FROM meetings WHERE project_id IN (:projectIds)`,
          { replacements: { projectIds }, type: Sequelize.QueryTypes.SELECT, transaction: t }
        );
        meetingIds = uatMeetings.map(m => m.meeting_id);
      }

      // ลบตามลำดับ FK dependency (ลูก → พ่อ)
      if (meetingIds.length > 0) {
        await queryInterface.bulkDelete('meeting_logs', { meeting_id: meetingIds }, { transaction: t });
        await queryInterface.bulkDelete('meetings', { meeting_id: meetingIds }, { transaction: t });
      }

      if (projectIds.length > 0) {
        await queryInterface.bulkDelete('project_workflow_states', { project_id: projectIds }, { transaction: t });
        await queryInterface.bulkDelete('project_exam_results', { project_id: projectIds }, { transaction: t });
        await queryInterface.bulkDelete('project_tracks', { project_id: projectIds }, { transaction: t });
        await queryInterface.bulkDelete('project_members', { project_id: projectIds }, { transaction: t });
        await queryInterface.bulkDelete('project_documents', { project_id: projectIds }, { transaction: t });
      }

      if (internshipIds.length > 0) {
        await queryInterface.bulkDelete('internship_evaluations', { internship_id: internshipIds }, { transaction: t });
        await queryInterface.bulkDelete('internship_logbooks', { internship_id: internshipIds }, { transaction: t });
        await queryInterface.bulkDelete('internship_documents', { internship_id: internshipIds }, { transaction: t });
      }

      if (docIds.length > 0) {
        await queryInterface.bulkDelete('documents', { document_id: docIds }, { transaction: t });
      }

      if (studentIds.length > 0) {
        await queryInterface.bulkDelete('students', { student_id: studentIds }, { transaction: t });
      }

      await queryInterface.bulkDelete('admins', { user_id: userIds }, { transaction: t });
      await queryInterface.bulkDelete('teachers', { user_id: userIds }, { transaction: t });
      await queryInterface.bulkDelete('users', { user_id: userIds }, { transaction: t });

      await t.commit();
      console.log('[UAT seed] rollback สำเร็จ — ลบข้อมูล UAT ทั้งหมดแล้ว');
    } catch (error) {
      await t.rollback();
      console.error('[UAT seed] rollback ล้มเหลว:', error.message);
      throw error;
    }
  }
};
