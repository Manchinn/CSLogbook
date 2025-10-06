'use strict';
/**
 * Migration: เพิ่มฟีเจอร์ Phase 1/2 ของระบบเดดไลน์
 * - เพิ่มคอลัมน์ deadline_type / is_published / publish_at / visibility_scope / related_workflow ให้ important_deadlines
 * - สร้างตาราง deadline_workflow_mappings (สำหรับผูก workflow/document กับ deadline)
 * - สร้างตาราง student_deadline_statuses (manual / non-document completion)
 * - สร้างตาราง important_deadline_audit_logs (audit การเปลี่ยนแปลง)
 * - (เลือกได้) ลบตาราง legacy timeline_steps ถ้ายืนยันว่าไม่ได้ใช้แล้ว
 *
 * หมายเหตุ: ใช้ defensive checks เพื่อให้ migration idempotent ในกรณีรันซ้ำ (dev environment)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) เพิ่มคอลัมน์ใหม่ใน important_deadlines ถ้ายังไม่มี
    const deadlineTable = 'important_deadlines';
    const desc = await queryInterface.describeTable(deadlineTable);

    const addCol = async (name, spec) => {
      if (!desc[name]) {
        await queryInterface.addColumn(deadlineTable, name, spec);
      }
    };

    await addCol('deadline_type', {
      type: Sequelize.ENUM('SUBMISSION','ANNOUNCEMENT','MANUAL','MILESTONE'),
      allowNull: false,
      defaultValue: 'SUBMISSION'
    });
    await addCol('is_published', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    await addCol('publish_at', { type: Sequelize.DATE, allowNull: true });
    await addCol('visibility_scope', { type: Sequelize.ENUM('ALL','INTERNSHIP_ONLY','PROJECT_ONLY','CUSTOM'), allowNull: false, defaultValue: 'ALL' });
    await addCol('related_workflow', { type: Sequelize.ENUM('internship','project1','project2','general'), allowNull: false, defaultValue: 'general' });

    // 2) ตาราง deadline_workflow_mappings
    const dwmTable = 'deadline_workflow_mappings';
    const tables = await queryInterface.showAllTables();
    if (!tables.includes(dwmTable)) {
      await queryInterface.createTable(dwmTable, {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        important_deadline_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: deadlineTable, key: 'id' }, onDelete: 'CASCADE' },
        workflow_type: { type: Sequelize.ENUM('internship','project1','project2'), allowNull: false },
        step_key: { type: Sequelize.STRING(255), allowNull: true },
        document_subtype: { type: Sequelize.STRING(100), allowNull: true },
        auto_assign: { type: Sequelize.ENUM('on_create','on_submit','on_approve','on_generate'), allowNull: false, defaultValue: 'on_submit' },
        active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      });
      await queryInterface.addConstraint(dwmTable, {
        fields: ['workflow_type','step_key','document_subtype'],
        type: 'unique',
        name: 'uq_deadline_mapping_combo'
      });
      await queryInterface.addIndex(dwmTable, ['important_deadline_id']);
      await queryInterface.addIndex(dwmTable, ['workflow_type']);
    }

    // 3) ตาราง student_deadline_statuses
    const sdsTable = 'student_deadline_statuses';
    if (!tables.includes(sdsTable)) {
      await queryInterface.createTable(sdsTable, {
        student_deadline_status_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        student_id: { type: Sequelize.INTEGER, allowNull: false }, // FK optional (ถ้าต้องการ enforce: references: { model: 'students', key: 'studentId' })
        important_deadline_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: deadlineTable, key: 'id' }, onDelete: 'CASCADE' },
        status: { type: Sequelize.ENUM('pending','completed','exempt','late'), allowNull: false, defaultValue: 'pending' },
        completed_at: { type: Sequelize.DATE, allowNull: true },
        completed_by: { type: Sequelize.INTEGER, allowNull: true },
        note: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      });
      await queryInterface.addConstraint(sdsTable, {
        fields: ['student_id','important_deadline_id'],
        type: 'unique',
        name: 'uq_student_deadline_pair'
      });
      await queryInterface.addIndex(sdsTable, ['important_deadline_id']);
      await queryInterface.addIndex(sdsTable, ['student_id']);
      await queryInterface.addIndex(sdsTable, ['status']);
    }

    // 4) ตาราง important_deadline_audit_logs
    const auditTable = 'important_deadline_audit_logs';
    if (!tables.includes(auditTable)) {
      await queryInterface.createTable(auditTable, {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        important_deadline_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: deadlineTable, key: 'id' }, onDelete: 'CASCADE' },
        action: { type: Sequelize.ENUM('CREATE','UPDATE','DELETE','PUBLISH','UNPUBLISH'), allowNull: false },
        changed_by: { type: Sequelize.INTEGER, allowNull: true },
        diff: { type: Sequelize.JSON, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      });
      await queryInterface.addIndex(auditTable, ['important_deadline_id']);
      await queryInterface.addIndex(auditTable, ['action']);
    }

    // 5) ลบตาราง legacy timeline_steps (หากมีและคอนเฟิร์มไม่ได้ใช้) -> ย้ายเป็น _backup ก่อนเผื่อใช้
    if (tables.includes('timeline_steps')) {
      // สำรอง
      await queryInterface.sequelize.query('CREATE TABLE IF NOT EXISTS timeline_steps_backup AS SELECT * FROM timeline_steps');
      // ลบของเดิม
      await queryInterface.dropTable('timeline_steps');
    }
  },

  async down(queryInterface, Sequelize) {
    // NOTE: rollback จะตัด ENUM และตารางที่เพิ่ม (ระวังข้อมูลสูญหาย)
    const deadlineTable = 'important_deadlines';

    // ตารางใหม่
    await queryInterface.dropTable('deadline_workflow_mappings').catch(()=>{});
    await queryInterface.dropTable('student_deadline_statuses').catch(()=>{});
    await queryInterface.dropTable('important_deadline_audit_logs').catch(()=>{});

    // ลบคอลัมน์ + ENUM (ต้องลบ column ก่อน แล้วค่อย queryInterface.sequelize.query เพื่อลบ type ENUM ถ้าจำเป็น)
    const dropCol = async (col) => queryInterface.removeColumn(deadlineTable, col).catch(()=>{});
    await dropCol('deadline_type');
    await dropCol('is_published');
    await dropCol('publish_at');
    await dropCol('visibility_scope');
    await dropCol('related_workflow');

    // ENUM cleanup (เฉพาะ MySQL ไม่จำเป็น explicit drop type)
  }
};
