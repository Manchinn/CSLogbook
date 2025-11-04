'use strict';

/**
 * Migration: เพิ่ม 'MEETING' ใน notification_type ENUM
 * และเพิ่มข้อมูล default setting สำหรับ MEETING
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Alter ENUM เพื่อเพิ่ม MEETING
    await queryInterface.sequelize.query(`
      ALTER TABLE notification_settings 
      MODIFY COLUMN notification_type 
      ENUM('LOGIN', 'DOCUMENT', 'LOGBOOK', 'EVALUATION', 'APPROVAL', 'MEETING') 
      NOT NULL
    `);
    
    console.log('✅ เพิ่ม MEETING ใน ENUM สำเร็จ');
    
    // 2. เพิ่มข้อมูล MEETING setting
    const now = new Date();
    await queryInterface.bulkInsert('notification_settings', [{
      notification_type: 'MEETING',
      is_enabled: false,
      description: 'แจ้งเตือนเมื่อมีการนัดหมายพบอาจารย์',
      created_at: now,
      updated_at: now
    }], { 
      ignoreDuplicates: true 
    });
    
    console.log('✅ เพิ่มข้อมูล MEETING setting สำเร็จ');
  },

  async down(queryInterface, Sequelize) {
    // 1. ลบข้อมูล MEETING ก่อน
    await queryInterface.bulkDelete('notification_settings', {
      notification_type: 'MEETING'
    });
    
    console.log('✅ ลบข้อมูล MEETING setting สำเร็จ');
    
    // 2. Revert ENUM กลับเป็นเดิม
    await queryInterface.sequelize.query(`
      ALTER TABLE notification_settings 
      MODIFY COLUMN notification_type 
      ENUM('LOGIN', 'DOCUMENT', 'LOGBOOK', 'EVALUATION', 'APPROVAL') 
      NOT NULL
    `);
    
    console.log('✅ Revert ENUM สำเร็จ');
  }
};

