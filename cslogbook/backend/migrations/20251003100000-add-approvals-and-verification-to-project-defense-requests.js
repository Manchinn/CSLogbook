'use strict';

const STATUS_VALUES = [
  'draft',
  'submitted',
  'advisor_in_review',
  'advisor_approved',
  'staff_verified',
  'scheduled',
  'completed',
  'cancelled'
];

const STATUS_VALUES_DOWN = [
  'draft',
  'submitted',
  'scheduled',
  'completed',
  'cancelled'
];

module.exports = {
  async up(queryInterface, Sequelize) {
    // ขยาย enum status ให้รองรับขั้นอนุมัติอาจารย์และเจ้าหน้าที่ก่อนนัดสอบ
    try {
      await queryInterface.changeColumn('project_defense_requests', 'status', {
        type: Sequelize.ENUM(...STATUS_VALUES),
        allowNull: false,
        defaultValue: 'submitted'
      });
    } catch (error) {
      if (error.message && error.message.includes('enum_project_defense_requests_status')) {
        // Postgres path (เผื่อใช้ได้ในอนาคต)
        for (const value of STATUS_VALUES) {
          await queryInterface.sequelize.query(
            `ALTER TYPE "enum_project_defense_requests_status" ADD VALUE IF NOT EXISTS '${value}';`
          );
        }
      } else {
        throw error;
      }
    }

    await queryInterface.addColumn('project_defense_requests', 'advisor_approved_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('project_defense_requests', 'staff_verified_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('project_defense_requests', 'staff_verified_by_user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('project_defense_requests', 'staff_verification_note', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.createTable('project_defense_request_approvals', {
      approval_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'project_defense_requests',
          key: 'request_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      teacher_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teachers',
          key: 'teacher_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      teacher_role: {
        type: Sequelize.STRING(32),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
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

    await queryInterface.addConstraint('project_defense_request_approvals', {
      type: 'unique',
      name: 'uniq_project1_defense_request_teacher',
      fields: ['request_id', 'teacher_id']
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('project_defense_request_approvals', 'uniq_project1_defense_request_teacher');
    await queryInterface.dropTable('project_defense_request_approvals');

    await queryInterface.removeColumn('project_defense_requests', 'staff_verification_note');
    await queryInterface.removeColumn('project_defense_requests', 'staff_verified_by_user_id');
    await queryInterface.removeColumn('project_defense_requests', 'staff_verified_at');
    await queryInterface.removeColumn('project_defense_requests', 'advisor_approved_at');

    // รีเซ็ตสถานะที่เพิ่มมาให้กลับเป็น submitted ก่อนลด enum
    await queryInterface.sequelize.query(`
      UPDATE project_defense_requests
      SET status = 'submitted'
      WHERE status IN ('advisor_in_review', 'advisor_approved', 'staff_verified');
    `);

    try {
      await queryInterface.changeColumn('project_defense_requests', 'status', {
        type: Sequelize.ENUM(...STATUS_VALUES_DOWN),
        allowNull: false,
        defaultValue: 'submitted'
      });
    } catch (error) {
      if (error.message && error.message.includes('enum_project_defense_requests_status')) {
        // Postgres fallback: recreate enum
        await queryInterface.sequelize.query('ALTER TYPE "enum_project_defense_requests_status" RENAME TO "enum_project_defense_requests_status_old";');
        await queryInterface.sequelize.query(`CREATE TYPE "enum_project_defense_requests_status" AS ENUM ('draft','submitted','scheduled','completed','cancelled');`);
        await queryInterface.sequelize.query('ALTER TABLE "project_defense_requests" ALTER COLUMN "status" TYPE "enum_project_defense_requests_status" USING status::text::"enum_project_defense_requests_status";');
        await queryInterface.sequelize.query('DROP TYPE "enum_project_defense_requests_status_old";');
      } else {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_project_defense_request_approvals_status";');
    } catch (error) {
      // ignore for dialects without enum types
    }
  }
};
