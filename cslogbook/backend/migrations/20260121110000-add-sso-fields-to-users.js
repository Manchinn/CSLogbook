'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // เพิ่มฟิลด์ sso_provider สำหรับเก็บชื่อ provider (เช่น 'kmutnb')
    await queryInterface.addColumn('users', 'sso_provider', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: null,
      comment: 'SSO provider name (e.g., kmutnb)'
    });

    // เพิ่มฟิลด์ sso_id สำหรับเก็บ username จาก SSO
    await queryInterface.addColumn('users', 'sso_id', {
      type: Sequelize.STRING(100),
      allowNull: true,
      defaultValue: null,
      comment: 'User ID from SSO provider'
    });

    // เพิ่ม index สำหรับ sso_provider และ sso_id
    await queryInterface.addIndex('users', ['sso_provider', 'sso_id'], {
      name: 'idx_users_sso',
      unique: true,
      where: {
        sso_provider: { [Sequelize.Op.ne]: null },
        sso_id: { [Sequelize.Op.ne]: null }
      }
    });

    // อัปเดตให้ password เป็น nullable สำหรับ SSO users
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Nullable for SSO users'
    });
  },

  async down(queryInterface, Sequelize) {
    // ลบ index
    await queryInterface.removeIndex('users', 'idx_users_sso');

    // ลบฟิลด์
    await queryInterface.removeColumn('users', 'sso_provider');
    await queryInterface.removeColumn('users', 'sso_id');

    // คืนค่า password เป็น not null
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING(255),
      allowNull: false
    });
  }
};
