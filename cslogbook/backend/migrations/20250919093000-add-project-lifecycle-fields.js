'use strict';
/**
 * เพิ่ม fields สำหรับ lifecycle ของ Project (ใช้กับตาราง project_documents)
 * Fields:
 *  - status ENUM('draft','advisor_assigned','in_progress','completed','archived') DEFAULT 'draft'
 *  - academic_year INT
 *  - semester TINYINT
 *  - created_by_student_id INT NULL
 *  - project_code VARCHAR(30) UNIQUE NULL
 *  - archived_at DATETIME NULL
 * หมายเหตุ: ใช้ ENUM ตาม pattern เดิมของโปรเจค (เช่น documents) หากต้องการขยายภายหลังให้ระวังการ alter ENUM ใน MySQL
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'project_documents';
    // ตรวจสอบก่อนว่า column มีอยู่แล้วหรือยัง (ป้องกันรันซ้ำ)
    const tableDesc = await queryInterface.describeTable(table);

    // Helper function
    const addColumnIfNotExists = async (name, definition) => {
      if (!tableDesc[name]) {
        await queryInterface.addColumn(table, name, definition);
      }
    };

    // status
    await addColumnIfNotExists('status', {
      type: Sequelize.ENUM('draft','advisor_assigned','in_progress','completed','archived'),
      allowNull: false,
      defaultValue: 'draft'
    });

    await addColumnIfNotExists('academic_year', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await addColumnIfNotExists('semester', {
      type: Sequelize.TINYINT,
      allowNull: true
    });

    await addColumnIfNotExists('created_by_student_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'students', key: 'student_id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await addColumnIfNotExists('project_code', {
      type: Sequelize.STRING(30),
      allowNull: true,
      unique: true
    });

    await addColumnIfNotExists('archived_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface) {
    const table = 'project_documents';

    // ต้องลบค่าใน ENUM ก่อน (MySQL ไม่ชอบแก้ ENUM หากยังมีคอลัมน์ใช้งาน)
    // แต่เพื่อความปลอดภัย จะทำแบบ simple: ดรอปคอลัมน์ที่เพิ่ม
    const columns = ['status','academic_year','semester','created_by_student_id','project_code','archived_at'];
    for (const col of columns) {
      try { await queryInterface.removeColumn(table, col); } catch (e) { /* ignore */ }
    }

    // ลบ ENUM type (สำหรับบาง dialect เช่น Postgres); ถ้า MySQL ข้ามได้
    try { await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_project_documents_status\";"); } catch (e) { /* ignore */ }
  }
};
