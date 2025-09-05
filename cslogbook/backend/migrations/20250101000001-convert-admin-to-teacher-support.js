'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // 1. ดึงข้อมูล admin ทั้งหมด
      const admins = await queryInterface.sequelize.query(`
        SELECT u.user_id, u.username, u.password, u.email, u.first_name, u.last_name, 
               u.active_status, u.last_login, a.admin_id, a.admin_code, a.responsibilities, a.contact_extension
        FROM users u
        INNER JOIN admins a ON u.user_id = a.user_id
        WHERE u.role = 'admin'
      `, { type: Sequelize.QueryTypes.SELECT });

      console.log(`Found ${admins.length} admins to convert`);

      for (const admin of admins) {
        // 2. สร้าง teacher record ใหม่
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

        // 3. อัปเดต role ในตาราง users
        await queryInterface.sequelize.query(`
          UPDATE users 
          SET role = 'teacher', updated_at = NOW()
          WHERE user_id = ?
        `, {
          replacements: [admin.user_id]
        });

        console.log(`Converted admin ${admin.username} to teacher support`);
      }

      // 4. ลบตาราง admins (ถ้าต้องการ)
      // await queryInterface.dropTable('admins');

      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // 1. ดึงข้อมูล teacher support ทั้งหมด
      const teacherSupports = await queryInterface.sequelize.query(`
        SELECT u.user_id, u.username, u.password, u.email, u.first_name, u.last_name, 
               u.active_status, u.last_login, t.teacher_id, t.teacher_code, t.contact_extension
        FROM users u
        INNER JOIN teachers t ON u.user_id = t.user_id
        WHERE u.role = 'teacher' AND t.teacher_type = 'support'
      `, { type: Sequelize.QueryTypes.SELECT });

      console.log(`Found ${teacherSupports.length} teacher supports to convert back`);

      for (const teacher of teacherSupports) {
        // 2. สร้าง admin record ใหม่
        await queryInterface.sequelize.query(`
          INSERT INTO admins (admin_code, user_id, responsibilities, contact_extension, created_at, updated_at)
          VALUES (?, ?, 'System Administrator', ?, NOW(), NOW())
        `, {
          replacements: [
            teacher.teacher_code,
            teacher.user_id,
            teacher.contact_extension
          ]
        });

        // 3. อัปเดต role ในตาราง users
        await queryInterface.sequelize.query(`
          UPDATE users 
          SET role = 'admin', updated_at = NOW()
          WHERE user_id = ?
        `, {
          replacements: [teacher.user_id]
        });

        console.log(`Converted teacher support ${teacher.username} back to admin`);
      }

      console.log('Rollback completed successfully');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
}; 