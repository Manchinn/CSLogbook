// เพิ่มคอลัมน์ academic_year และ semester ให้กับตาราง internship_documents
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // เช็คว่ามีคอลัมน์อยู่แล้วหรือยัง (เพื่อรองรับ rerun แบบปลอดภัย)
    const table = await queryInterface.describeTable('internship_documents');

    if (!table.academic_year) {
      await queryInterface.addColumn('internship_documents', 'academic_year', {
        type: Sequelize.INTEGER,
        allowNull: true, // ชั่วคราวสำหรับ backfill จะเปลี่ยนเป็น NOT NULL ภายหลังถ้าต้องการ
        comment: 'ปีการศึกษา (พ.ศ.) ที่เอกสารฝึกงานนี้ถูกสร้าง (snapshot)' ,
        after: 'end_date'
      });
    }

    if (!table.semester) {
      await queryInterface.addColumn('internship_documents', 'semester', {
        type: Sequelize.TINYINT,
        allowNull: true, // ชั่วคราวสำหรับ backfill
        comment: 'ภาคเรียน (1,2,3) ที่เอกสารฝึกงานนี้ถูกสร้าง (snapshot)',
        after: 'academic_year'
      });
    }

    // สร้าง composite index สำหรับ dashboard/filter
    // ใช้ชื่อ index ชัดเจน ป้องกันซ้ำก่อนสร้าง
    const indexes = await queryInterface.showIndex('internship_documents');
    const hasPeriodCompanyIdx = indexes.some(i => i.name === 'idx_internship_period_company');
    if (!hasPeriodCompanyIdx) {
      await queryInterface.addIndex('internship_documents', ['academic_year', 'semester', 'company_name'], {
        name: 'idx_internship_period_company'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const indexes = await queryInterface.showIndex('internship_documents');
    if (indexes.some(i => i.name === 'idx_internship_period_company')) {
      await queryInterface.removeIndex('internship_documents', 'idx_internship_period_company');
    }
    // ลบคอลัมน์ (ถ้ามี)
    const table = await queryInterface.describeTable('internship_documents');
    if (table.semester) {
      await queryInterface.removeColumn('internship_documents', 'semester');
    }
    if (table.academic_year) {
      await queryInterface.removeColumn('internship_documents', 'academic_year');
    }
  }
};
