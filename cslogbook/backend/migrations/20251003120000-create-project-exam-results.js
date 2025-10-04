'use strict';

/**
 * Migration: สร้างตาราง project_exam_results
 * ใช้เก็บผลการสอบโครงงานพิเศษ (PROJECT1 และ THESIS)
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_exam_results', {
      exam_result_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'project_documents',
          key: 'project_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      exam_type: {
        type: Sequelize.ENUM('PROJECT1', 'THESIS'),
        allowNull: false,
        comment: 'ประเภทการสอบ: โครงงานพิเศษ 1 หรือ ปริญญานิพนธ์'
      },
      result: {
        type: Sequelize.ENUM('PASS', 'FAIL'),
        allowNull: false,
        comment: 'ผลการสอบ: ผ่าน หรือ ไม่ผ่าน'
      },
      score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'คะแนนที่ได้ (ถ้ามี)'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'หมายเหตุ/ข้อเสนอแนะจากคณะกรรมการ'
      },
      require_scope_revision: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'ต้องแก้ไข Scope หรือไม่ (กรณีผ่าน)'
      },
      recorded_by_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'ผู้บันทึกผล (เจ้าหน้าที่/กรรมการ)'
      },
      recorded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'เวลาที่บันทึกผล'
      },
      student_acknowledged_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'เวลาที่นักศึกษารับทราบผล (กรณีไม่ผ่าน)'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // สร้าง index สำหรับการค้นหา
    await queryInterface.addIndex('project_exam_results', ['project_id', 'exam_type'], {
      name: 'idx_project_exam_type',
      unique: true,
      comment: 'ป้องกันการบันทึกผลซ้ำสำหรับแต่ละประเภทการสอบ'
    });

    await queryInterface.addIndex('project_exam_results', ['result'], {
      name: 'idx_exam_result'
    });

    await queryInterface.addIndex('project_exam_results', ['recorded_at'], {
      name: 'idx_recorded_at'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('project_exam_results');
  }
};
