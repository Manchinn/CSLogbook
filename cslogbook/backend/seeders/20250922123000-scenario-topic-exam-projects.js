// Seeder: สร้างชุด Scenario หลากหลายเคสสำหรับ Topic Exam Overview
// ครอบคลุมสถานะ / ความพร้อม / จำนวนสมาชิก / การขาด field บางอย่าง
// ใช้ prefix 'SCENARIO TOPIC' สำหรับ rollback เฉพาะชุดนี้ได้ง่าย

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const t = await sequelize.transaction();
    try {
      // Pool ครู
      const [teachers] = await sequelize.query(`SELECT teacher_id FROM teachers WHERE teacher_type='academic' ORDER BY teacher_id LIMIT 5;`, { transaction: t });
      if (!teachers.length) throw new Error('ไม่พบอาจารย์ (scenario seed)');

      // Pool นักศึกษา (เลือกมากหน่อยเพื่อกระจาย)
      let [students] = await sequelize.query(`SELECT student_id, student_code FROM students ORDER BY is_eligible_project DESC, total_credits DESC, student_id LIMIT 30;`, { transaction: t });
      if (students.length < 8) throw new Error('จำเป็นต้องมีนักศึกษา >= 8 คนสำหรับ scenario');

      const now = new Date();
      const take = (n) => students.splice(0, n); // ฟังก์ชันดึงสมาชิก

      // กำหนดรายการ scenario แต่ละอันระบุ properties ที่ต่างกัน
      const scenarioDefs = [
        { code: 'DRAFT_NO_ADVISOR', status: 'draft', members: take(2), haveTh: true, haveEn: true, advisor: false },
        { code: 'ADVISOR_ASSIGNED_HALF_TITLE', status: 'advisor_assigned', members: take(2), haveTh: true, haveEn: false, advisor: true },
        { code: 'SINGLE_MEMBER_READY', status: 'advisor_assigned', members: take(1), haveTh: true, haveEn: true, advisor: true },
        { code: 'MULTI_READY_TRACK', status: 'advisor_assigned', members: take(3), haveTh: true, haveEn: true, advisor: true, track: 'bilingual' },
        { code: 'IN_PROGRESS_FULL', status: 'in_progress', members: take(2), haveTh: true, haveEn: true, advisor: true, projectType: 'research' },
        { code: 'COMPLETED', status: 'completed', members: take(2), haveTh: true, haveEn: true, advisor: true, projectType: 'private' },
        { code: 'ARCHIVED', status: 'archived', members: take(2), haveTh: true, haveEn: true, advisor: true, projectType: 'govern' },
        { code: 'MISSING_EN_SINGLE_MEMBER', status: 'advisor_assigned', members: take(1), haveTh: true, haveEn: false, advisor: true, projectType: 'research' }
      ].filter(s => s.members.length); // กันกรณี pool ไม่พอ

      const projectRows = [];
      scenarioDefs.forEach((def, idx) => {
        const advisor = def.advisor ? teachers[idx % teachers.length].teacher_id : null;
        const leader = def.members[0];
        projectRows.push({
          project_name_th: def.haveTh ? `SCENARIO TOPIC ${def.code} TH` : null,
          project_name_en: def.haveEn ? `SCENARIO TOPIC ${def.code} EN` : null,
          project_type: def.projectType || null,
          track: def.track || null,
          advisor_id: advisor,
          co_advisor_id: null,
          status: def.status,
          academic_year: 2568,
          semester: 1,
          objective: def.haveTh && def.haveEn ? 'Scenario objective' : null,
          background: null,
          scope: null,
          expected_outcome: def.haveEn ? 'Scenario outcome' : null,
          benefit: null,
          methodology: null,
          tools: null,
          timeline_note: null,
          created_by_student_id: leader.student_id,
          project_code: null,
          archived_at: def.status === 'archived' ? now : null,
          created_at: now,
          updated_at: now
        });
      });

      await queryInterface.bulkInsert('project_documents', projectRows, { transaction: t });

      // ดึง project_id กลุ่มนี้กลับมา
      const [inserted] = await sequelize.query(
        `SELECT project_id, project_name_th FROM project_documents WHERE project_name_th LIKE 'SCENARIO TOPIC%' ORDER BY project_id DESC LIMIT :limit;`,
        { replacements: { limit: projectRows.length }, transaction: t }
      );
      const ordered = [...inserted].reverse();

      const memberRows = [];
      ordered.forEach((proj, i) => {
        const def = scenarioDefs[i];
        if (!def) return;
        def.members.forEach((stu, mIdx) => {
          memberRows.push({
            project_id: proj.project_id,
            student_id: stu.student_id,
            role: mIdx === 0 ? 'leader' : 'member',
            joined_at: now
          });
        });
      });

      await queryInterface.bulkInsert('project_members', memberRows, { transaction: t });

      await t.commit();
      console.log(`Scenario seed: projects=${projectRows.length} members=${memberRows.length}`);
    } catch (e) {
      await t.rollback();
      console.error('Scenario seed failed', e);
      throw e;
    }
  },
  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const t = await sequelize.transaction();
    try {
      const [rows] = await sequelize.query(`SELECT project_id FROM project_documents WHERE project_name_th LIKE 'SCENARIO TOPIC%';`, { transaction: t });
      if (rows.length) {
        const ids = rows.map(r=>r.project_id);
        await queryInterface.bulkDelete('project_members', { project_id: ids }, { transaction: t });
        await queryInterface.bulkDelete('project_documents', { project_id: ids }, { transaction: t });
      }
      await t.commit();
      console.log('Scenario seed rollback success');
    } catch (e) {
      await t.rollback();
      console.error('Scenario seed rollback failed', e);
      throw e;
    }
  }
};
