/**
 * เพิ่มฟิลด์ผลสอบหัวข้อใน project_documents
 * - exam_result: ENUM('passed','failed') null ได้ (ยังไม่สอบ / ยังไม่บันทึก)
 * - exam_fail_reason: TEXT เหตุผลไม่ผ่าน
 * - exam_result_at: DATETIME เวลาเจ้าหน้าที่บันทึกผล
 * - student_acknowledged_at: DATETIME เวลาที่นักศึกษากดรับทราบ (กรณีไม่ผ่าน)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('project_documents', 'exam_result', {
      type: Sequelize.ENUM('passed','failed'),
      allowNull: true
    });
    await queryInterface.addColumn('project_documents', 'exam_fail_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('project_documents', 'exam_result_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('project_documents', 'student_acknowledged_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },
  async down(queryInterface, Sequelize) {
    // ต้องลบ ENUM แยกตอนท้าย (Postgres) แต่ที่นี่ใช้ MySQL (ENUM เป็น metadata ใน column) ลบ column ก็เพียงพอ
    await queryInterface.removeColumn('project_documents', 'student_acknowledged_at');
    await queryInterface.removeColumn('project_documents', 'exam_result_at');
    await queryInterface.removeColumn('project_documents', 'exam_fail_reason');
    await queryInterface.removeColumn('project_documents', 'exam_result');
  }
};
