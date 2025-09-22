// Seeder: สร้างข้อมูลตัวอย่างสำหรับ Topic Exam Overview (10 โปรเจกต์)
// เลือกนักศึกษาที่ผ่านเกณฑ์ (is_eligible_project = 1) แบบสุ่มจัดกลุ่ม 1-2 คนต่อโปรเจกต์
// เงื่อนไข fallback: ถ้าจำนวนนักศึกษาผ่านเกณฑ์ไม่พอ จะดึงนักศึกษาที่ total_credits >= 90 มาเติม
// หมายเหตุ: ใช้ advisor จากตาราง teachers (academic) หมุนวน
// Rollback: ลบเฉพาะรายการที่ project_name_th ขึ้นต้นด้วย 'DEMO TOPIC'

module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;
    const t = await sequelize.transaction();
    try {
      // 1) ดึงรายชื่ออาจารย์ (advisor pool)
      const [teacherRows] = await sequelize.query(
        `SELECT teacher_id FROM teachers WHERE teacher_type = 'academic' ORDER BY teacher_id LIMIT 10;`,
        { transaction: t }
      );
      if (!teacherRows.length) throw new Error('ไม่พบอาจารย์สำหรับใช้เป็น advisor');

      // 2) ดึงนักศึกษาที่ผ่านเกณฑ์โครงงาน (is_eligible_project=1)
      let [studentRows] = await sequelize.query(
        `SELECT student_id, student_code FROM students WHERE is_eligible_project = 1 ORDER BY student_id;`,
        { transaction: t }
      );

      // Fallback: ถ้าจำนวนน้อยกว่า 20 (เผื่อ 2 คน/โปรเจกต์) ให้ดึงนักศึกษาที่ total_credits >=90 เติม
      if (studentRows.length < 20) {
        const need = 20 - studentRows.length;
        const [fallbackRows] = await sequelize.query(
          `SELECT student_id, student_code FROM students WHERE total_credits >= 90 AND student_id NOT IN (:ids) ORDER BY student_id LIMIT :limit;`,
          { replacements: { ids: studentRows.map(s=>s.student_id).concat([0]), limit: need }, transaction: t }
        );
        studentRows = studentRows.concat(fallbackRows);
      }

      if (studentRows.length === 0) throw new Error('ไม่มีนักศึกษาที่ผ่านเกณฑ์/เข้าเงื่อนไขสำหรับ seed');

      // 3) เตรียมกลุ่มสำหรับ 10 โปรเจกต์ (1-2 คนต่อโปรเจกต์ แบบสลับ)
      const projectsTarget = 10;
      const membersPerProjectPattern = [2,2,1,2,1,2,2,1,2,1]; // รวม 15 คน ถ้าไม่พอจะตัดเหลือ
      const studentsPool = [...studentRows];

      const projectDefinitions = [];
      let studentIndex = 0;
      for (let i=0; i<projectsTarget; i++) {
        const desired = membersPerProjectPattern[i] || 1;
        const slice = studentsPool.slice(studentIndex, studentIndex + desired);
        if (!slice.length) break; // ไม่มีนักศึกษาเหลือแล้ว
        studentIndex += slice.length;
        projectDefinitions.push({ members: slice });
        if (studentIndex >= studentsPool.length) break;
      }

      if (!projectDefinitions.length) throw new Error('จัดกลุ่มนักศึกษาไม่สำเร็จ');

      // 4) เตรียมข้อมูล project_documents
      const now = new Date();
      const thTitles = [
        'DEMO TOPIC ระบบบริหารจัดการคลังสินค้าอัจฉริยะ',
        'DEMO TOPIC แพลตฟอร์มการเรียนรู้ออนไลน์แบบปรับตามผู้ใช้',
        'DEMO TOPIC ระบบช่วยแนะนำเมนูอาหารด้วยปัญญาประดิษฐ์',
        'DEMO TOPIC ระบบตรวจจับพลังงานไฟฟ้าสูญเสียแบบเรียลไทม์',
        'DEMO TOPIC แชทบอทให้คำปรึกษาด้านสุขภาพเบื้องต้น',
        'DEMO TOPIC ระบบวิเคราะห์ความเสี่ยงทางการเงินเอสเอ็มอี',
        'DEMO TOPIC ระบบจัดตารางเรียนอัตโนมัติด้วย Constraint Solver',
        'DEMO TOPIC ระบบตรวจจับข่าวปลอมภาษาไทย',
        'DEMO TOPIC แพลตฟอร์มติดตามงานกลุ่มแบบ Agile',
        'DEMO TOPIC ระบบประเมินทักษะการเขียนโปรแกรมอัตโนมัติ'
      ];
      const enTitles = [
        'DEMO TOPIC Smart Warehouse Management System',
        'DEMO TOPIC Adaptive E-Learning Platform',
        'DEMO TOPIC AI-based Food Menu Recommendation',
        'DEMO TOPIC Real-time Electrical Loss Detection',
        'DEMO TOPIC Health Advisory Chatbot',
        'DEMO TOPIC SME Financial Risk Analytics',
        'DEMO TOPIC Automated Timetable Generator',
        'DEMO TOPIC Thai Fake News Detection',
        'DEMO TOPIC Agile Team Progress Platform',
        'DEMO TOPIC Automatic Programming Skill Assessment'
      ];

      const projectDocs = [];
      const advisorCount = teacherRows.length;

      projectDefinitions.forEach((def, idx) => {
        const advisor = teacherRows[idx % advisorCount];
        const leaderStudent = def.members[0];
        projectDocs.push({
          project_name_th: thTitles[idx] || `DEMO TOPIC โครงงานตัวอย่าง ${idx+1}`,
          project_name_en: enTitles[idx] || `DEMO TOPIC Sample Project ${idx+1}`,
          project_type: 'research',
          track: null,
          advisor_id: advisor.teacher_id,
          co_advisor_id: null,
          status: 'advisor_assigned', // ให้ readiness เป็น true
          academic_year: 2568,
          semester: 1,
          objective: 'Seed objective stub',
          background: 'Seed background stub',
          scope: 'Seed scope stub',
          expected_outcome: 'Seed expected outcome stub',
          benefit: 'Seed benefit stub',
          methodology: 'Seed methodology stub',
          tools: 'Node.js, React, MySQL',
          timeline_note: 'Seed timeline',
          created_by_student_id: leaderStudent.student_id,
          project_code: null, // ให้ hook สร้างเอง
          archived_at: null,
          created_at: now,
          updated_at: now
        });
      });

      // 5) insert project_documents
      await queryInterface.bulkInsert('project_documents', projectDocs, { transaction: t });

      // 6) ดึง project_id ที่เพิ่งเพิ่ม (เรียงตาม created_at ล่าสุด + จำนวนที่เพิ่ม)
      const [insertedProjects] = await sequelize.query(
        `SELECT project_id, project_name_th FROM project_documents WHERE project_name_th LIKE 'DEMO TOPIC%' ORDER BY project_id DESC LIMIT :limit;`,
        { replacements: { limit: projectDocs.length }, transaction: t }
      );

      // mapping ตามลำดับย้อนกลับ (DESC) -> ต้อง reverse เพื่อให้ index ตรง
      const orderedProjects = [...insertedProjects].reverse();

      // 7) เตรียม project_members
      const memberRows = [];
      orderedProjects.forEach((pRow, idx) => {
        const def = projectDefinitions[idx];
        if (!def) return;
        def.members.forEach((stu, mIdx) => {
          memberRows.push({
            project_id: pRow.project_id,
            student_id: stu.student_id,
            role: mIdx === 0 ? 'leader' : 'member',
            joined_at: now
          });
        });
      });

      await queryInterface.bulkInsert('project_members', memberRows, { transaction: t });

      await t.commit();
      console.log(`Seeder demo-topic-exam-projects: สร้างโปรเจกต์ ${projectDocs.length} รายการ และสมาชิก ${memberRows.length} แถว`);
    } catch (err) {
      await t.rollback();
      console.error('Seeder demo-topic-exam-projects FAILED:', err);
      throw err;
    }
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const t = await sequelize.transaction();
    try {
      const [rows] = await sequelize.query(
        `SELECT project_id FROM project_documents WHERE project_name_th LIKE 'DEMO TOPIC%';`,
        { transaction: t }
      );
      if (rows.length) {
        const ids = rows.map(r=>r.project_id);
        await queryInterface.bulkDelete('project_members', { project_id: ids }, { transaction: t });
        await queryInterface.bulkDelete('project_documents', { project_id: ids }, { transaction: t });
      }
      await t.commit();
      console.log('Seeder demo-topic-exam-projects: rollback success');
    } catch (err) {
      await t.rollback();
      console.error('Seeder demo-topic-exam-projects rollback FAILED:', err);
      throw err;
    }
  }
};
