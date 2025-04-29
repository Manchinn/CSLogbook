'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('timeline_steps', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      timestampsId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'student_id',
        references: {
          model: 'students',
          key: 'student_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('internship', 'project'),
        allowNull: false
      },
      stepOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'step_order'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'blocked'),
        defaultValue: 'pending'
      },
      date: {
        type: Sequelize.DATE
      },
      startDate: {
        type: Sequelize.DATE,
        field: 'start_date'
      },
      endDate: {
        type: Sequelize.DATE,
        field: 'end_date'
      },
      deadline: {
        type: Sequelize.DATE
      },
      documentType: {
        type: Sequelize.STRING,
        field: 'document_type'
      },
      actionText: {
        type: Sequelize.STRING,
        field: 'action_text'
      },
      actionLink: {
        type: Sequelize.STRING,
        field: 'action_link'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    });

    // สร้าง index สำหรับการค้นหาที่เร็วขึ้น
    // ไม่ต้องสร้าง index สำหรับ student_id อีก เพราะถูกสร้างอัตโนมัติจาก foreign key
    await queryInterface.addIndex('timeline_steps', ['type', 'step_order']);
    await queryInterface.addIndex('timeline_steps', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('timeline_steps');
  }
};