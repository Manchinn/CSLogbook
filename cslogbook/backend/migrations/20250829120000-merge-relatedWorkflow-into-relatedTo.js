/**
 * Migration: Merge relatedWorkflow column into related_to and extend enum with project1/project2
 * Assumptions:
 *  - Table name: important_deadlines (ตามโครง Sequelize เดิม)
 *  - Column existing: related_to ENUM('project','internship','general') or already extended earlier
 *  - Column to drop: relatedWorkflow (STRING/ENUM) ที่เราเพิ่มไว้ก่อนหน้า
 * Mapping Rules:
 *  1. หาก relatedWorkflow IN ('project1','project2') -> ใช้ค่านั้น
 *  2. หาก relatedWorkflow = 'project' (กรณีเผื่อ) -> map เป็น 'project1'
 *  3. หาก related_to = 'project' แต่ไม่มี relatedWorkflow -> map เป็น 'project1'
 *  4. ค่าอื่น ('internship','general') ใช้ตามเดิม (ถ้า relatedWorkflow มีค่าเหล่านี้ก็ใช้แทน related_to ที่ว่าง)
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'important_deadlines';

    // 1) ขยาย ENUM related_to ให้มี project1, project2 (MySQL ต้อง MODIFY ทั้ง enum)
    // อ่าน definition เดิมไม่ได้ง่ายผ่าน code นี้ จึงประกาศชุดใหม่ที่ครอบคลุมทั้งหมดที่ต้องการหลัง merge
    // NOTE: หากอนาคตมีค่าอื่นเพิ่ม ต้องแก้ชุดนี้
    await queryInterface.sequelize.query(`ALTER TABLE ${table} MODIFY COLUMN related_to ENUM('project','project1','project2','internship','general') DEFAULT 'general';`);

    // 2) อัปเดตข้อมูล รวมค่า
    await queryInterface.sequelize.query(`UPDATE ${table}
      SET related_to = CASE
        WHEN related_workflow IN ('project1','project2') THEN related_workflow
        WHEN related_workflow = 'project' THEN 'project1'
        WHEN related_to = 'project' AND (related_workflow IS NULL OR related_workflow = '') THEN 'project1'
        WHEN related_workflow IN ('internship','general') THEN related_workflow
        ELSE related_to
      END`);

    // 3) ลบคอลัมน์ relatedWorkflow
    // ป้องกัน error ถ้าไม่มีคอลัมน์ ใช้ try/catch
    try {
  await queryInterface.removeColumn(table, 'related_workflow');
    } catch (err) {
      console.warn('removeColumn relatedWorkflow skipped:', err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'important_deadlines';
    // พยายามย้อนกลับ: เพิ่ม relatedWorkflow กลับ (STRING) และ map คร่าว ๆ
  await queryInterface.addColumn(table, 'related_workflow', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Map ย้อน: project1/project2 -> project, ที่เหลือคัดลอกตรง ๆ
    await queryInterface.sequelize.query(`UPDATE ${table}
      SET related_workflow = CASE
        WHEN related_to IN ('project1','project2','project') THEN 'project'
        WHEN related_to IN ('internship','general') THEN related_to
        ELSE NULL
      END`);

    // ย่อ enum กลับ (เหลือค่าเดิม project, internship, general)
    await queryInterface.sequelize.query(`ALTER TABLE ${table} MODIFY COLUMN related_to ENUM('project','internship','general') DEFAULT 'general';`);
    // แปลง project1/project2 ที่เหลือให้เป็น project เพื่อไม่ผิด enum
    await queryInterface.sequelize.query(`UPDATE ${table} SET related_to='project' WHERE related_to IN ('project1','project2');`);
  }
};
