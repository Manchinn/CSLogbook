'use strict';

/**
 * สคริปต์ย้ายข้อมูล admin เดิมให้กลายเป็น teacher ประเภท support
 * ยกมาจาก migration 20250101000001-convert-admin-to-teacher-support.js เพื่อให้เรียกใช้งานแบบ manual ได้
 */
module.exports = {
  async run(queryInterface, Sequelize) {
    try {
      const admins = await queryInterface.sequelize.query(`
        SELECT u.user_id, u.username, u.password, u.email, u.first_name, u.last_name,
               u.active_status, u.last_login, a.admin_id, a.admin_code, a.responsibilities, a.contact_extension
        FROM users u
        INNER JOIN admins a ON u.user_id = a.user_id
        WHERE u.role = 'admin'
      `, { type: Sequelize.QueryTypes.SELECT });

      console.log(`Found ${admins.length} admins to convert`);

      for (const admin of admins) {
        await queryInterface.sequelize.query(`
          INSERT INTO teachers (teacher_code, user_id, teacher_type, contact_extension, created_at, updated_at)
          VALUES (?, ?, 'support', ?, NOW(), NOW())
        `, {
          replacements: [
            admin.admin_code || `T${admin.user_id}`,
            admin.user_id,
            admin.contact_extension
          ]
        });

        await queryInterface.sequelize.query(`
          UPDATE users
          SET role = 'teacher', updated_at = NOW()
          WHERE user_id = ?
        `, {
          replacements: [admin.user_id]
        });

        console.log(`Converted admin ${admin.username} to teacher support`);
      }

      console.log('Conversion completed successfully');
    } catch (error) {
      console.error('Conversion failed:', error);
      throw error;
    }
  }
};
