'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    const now = new Date();
        
    return queryInterface.bulkInsert('notification_settings', [
      {
        notification_type: 'LOGIN',
        is_enabled: false,
        description: 'แจ้งเตือนเมื่อมีการเข้าสู่ระบบ',
        created_at: now,
        updated_at: now
      },
      {
        notification_type: 'DOCUMENT',
        is_enabled: false,
        description: 'แจ้งเตือนเมื่อมีการอัปเดตเอกสาร',
        created_at: now,
        updated_at: now
      },
      {
        notification_type: 'LOGBOOK',
        is_enabled: false,
        description: 'แจ้งเตือนเมื่อมีการอัปเดต logbook',
        created_at: now,
        updated_at: now
      },
      {
        notification_type: 'EVALUATION',
        is_enabled: false,
        description: 'แจ้งเตือนเมื่อมีการประเมิน',
        created_at: now,
        updated_at: now
      },
      {
        notification_type: 'APPROVAL',
        is_enabled: false,
        description: 'แจ้งเตือนเมื่อมีการอนุมัติ',
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    return queryInterface.bulkDelete('notification_settings', null, {});
  }
};
