// migration สำหรับสร้างตาราง student_academic_histories เพื่อ track ประวัติปีการศึกษา/ภาคเรียน/สถานะ ของนักศึกษาแต่ละปี
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('student_academic_histories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'รหัสนักศึกษาที่อ้างอิง',
        references: {
          model: 'students',
          key: 'student_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      academic_year: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ปีการศึกษา'
      },
      semester: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ภาคเรียน (1, 2, 3)'
      },
      status: {
        type: Sequelize.STRING(32),
        allowNull: false,
        comment: 'สถานะ เช่น enrolled, leave, repeat, graduated'
      },
      note: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'หมายเหตุเพิ่มเติม'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('student_academic_histories');
  }
}; 