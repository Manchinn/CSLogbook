'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ขยาย enum status ให้รองรับสถานะการนัดสอบและหลังบันทึกผล
    try {
      await queryInterface.changeColumn('project_defense_requests', 'status', {
        type: Sequelize.ENUM('draft', 'submitted', 'scheduled', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'submitted'
      });
    } catch (error) {
      if (error.message && error.message.includes('enum_project_defense_requests_status')) {
        // กรณี Postgres: เพิ่มค่าใหม่ใน enum เดิมแทน
        await queryInterface.sequelize.query('ALTER TYPE "enum_project_defense_requests_status" ADD VALUE IF NOT EXISTS \"scheduled\";');
        await queryInterface.sequelize.query('ALTER TYPE "enum_project_defense_requests_status" ADD VALUE IF NOT EXISTS \"completed\";');
      } else {
        throw error;
      }
    }

    await queryInterface.addColumn('project_defense_requests', 'defense_scheduled_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('project_defense_requests', 'defense_location', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('project_defense_requests', 'defense_note', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('project_defense_requests', 'scheduled_by_user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('project_defense_requests', 'scheduled_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('project_defense_requests', 'scheduled_at');
    await queryInterface.removeColumn('project_defense_requests', 'scheduled_by_user_id');
    await queryInterface.removeColumn('project_defense_requests', 'defense_note');
    await queryInterface.removeColumn('project_defense_requests', 'defense_location');
    await queryInterface.removeColumn('project_defense_requests', 'defense_scheduled_at');

    try {
      await queryInterface.changeColumn('project_defense_requests', 'status', {
        type: Sequelize.ENUM('draft', 'submitted', 'cancelled'),
        allowNull: false,
        defaultValue: 'submitted'
      });
    } catch (error) {
      if (error.message && error.message.includes('enum_project_defense_requests_status')) {
        // Postgres: ต้องสร้าง type ใหม่แล้วแทนที่ (simplified)
        await queryInterface.sequelize.query('ALTER TYPE "enum_project_defense_requests_status" RENAME TO "enum_project_defense_requests_status_old";');
        await queryInterface.sequelize.query('CREATE TYPE "enum_project_defense_requests_status" AS ENUM (\'draft\', \'submitted\', \'cancelled\');');
        await queryInterface.sequelize.query('ALTER TABLE "project_defense_requests" ALTER COLUMN "status" TYPE "enum_project_defense_requests_status" USING status::text::"enum_project_defense_requests_status";');
        await queryInterface.sequelize.query('DROP TYPE "enum_project_defense_requests_status_old";');
      } else {
        throw error;
      }
    }
  }
};
