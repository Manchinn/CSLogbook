'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('signatories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      signature_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
      },
      role: {
        // แนะนำให้ใช้ role ชุดนี้ก่อน (ตรงกับ Option C)
        type: Sequelize.ENUM('PRIMARY', 'DEPUTY', 'ACTING'),
        allowNull: false,
        defaultValue: 'PRIMARY'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('signatories', ['is_active'], {
      name: 'idx_signatories_is_active'
    });

    await queryInterface.addIndex('signatories', ['role'], {
      name: 'idx_signatories_role'
    });

    // ป้องกันมีผู้ลงนามหลัก active มากกว่า 1 คน (ถ้าต้องการเข้มงวด)
    // หมายเหตุ: ใช้ partial index ได้กับบาง DB เท่านั้น
    // สำหรับ MySQL แนะนำคุมด้วย service layer เพิ่มเติม
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('signatories', 'idx_signatories_is_active');
    await queryInterface.removeIndex('signatories', 'idx_signatories_role');

    await queryInterface.dropTable('signatories');

    // ลบ ENUM type (รองรับกรณี dialect ที่ต้อง cleanup)
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_signatories_role";');
    }
  }
};