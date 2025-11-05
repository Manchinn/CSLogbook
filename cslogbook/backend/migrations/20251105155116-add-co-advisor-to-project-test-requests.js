'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // เพิ่ม column สำหรับ co-advisor
      await queryInterface.addColumn(
        'project_test_requests',
        'co_advisor_teacher_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'teachers',
            key: 'teacher_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          comment: 'อาจารย์ที่ปรึกษาร่วม'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'project_test_requests',
        'co_advisor_decision_note',
        {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'หมายเหตุการพิจารณาของอาจารย์ที่ปรึกษาร่วม'
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'project_test_requests',
        'co_advisor_decided_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'วันที่อาจารย์ที่ปรึกษาร่วมพิจารณา'
        },
        { transaction }
      );

      // เพิ่ม index สำหรับ co_advisor_teacher_id
      await queryInterface.addIndex(
        'project_test_requests',
        ['co_advisor_teacher_id'],
        {
          name: 'idx_project_test_requests_co_advisor_teacher_id',
          transaction
        }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // ลบ index
      await queryInterface.removeIndex(
        'project_test_requests',
        'idx_project_test_requests_co_advisor_teacher_id',
        { transaction }
      );

      // ลบ columns
      await queryInterface.removeColumn('project_test_requests', 'co_advisor_decided_at', { transaction });
      await queryInterface.removeColumn('project_test_requests', 'co_advisor_decision_note', { transaction });
      await queryInterface.removeColumn('project_test_requests', 'co_advisor_teacher_id', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
