'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workflow_step_definitions', {
      step_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      workflow_type: {
        type: Sequelize.ENUM('internship', 'project1', 'project2'),
        allowNull: false
      },
      step_key: {
        type: Sequelize.STRING,
        allowNull: false
      },
      step_order: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description_template: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    // เพิ่ม Unique Constraint สำหรับ (workflow_type, step_key)
    await queryInterface.addConstraint('workflow_step_definitions', {
      fields: ['workflow_type', 'step_key'],
      type: 'unique',
      name: 'uq_workflow_type_step_key'
    });
    // เพิ่ม Index
    await queryInterface.addIndex('workflow_step_definitions', ['workflow_type', 'step_order'], {
        name: 'idx_workflow_type_step_order'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('workflow_step_definitions');
  }
};
