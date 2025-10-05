'use strict';

/**
 * แก้ foreign key ของ project_documents.advisor_id / co_advisor_id
 * ให้ชี้ไปที่ตาราง teachers (เดิมยังค้างเป็น users ทำให้บันทึกผลสอบหัวข้อแล้ว error)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME, COLUMN_NAME
         FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'project_documents'
           AND COLUMN_NAME IN ('advisor_id','co_advisor_id')
           AND REFERENCED_TABLE_NAME IS NOT NULL`,
        { transaction }
      );

      const dropConstraint = async (constraintName) => {
        if (!constraintName) return;
        try {
          await queryInterface.removeConstraint('project_documents', constraintName, { transaction });
        } catch (error) {
          // ถ้า constraint ไม่มีอยู่แล้ว ให้ข้าม (รองรับหลายสภาพฐานข้อมูล)
          if (!/Unknown constraint|does not exist/i.test(error.message)) {
            throw error;
          }
        }
      };

      for (const row of constraints) {
        await dropConstraint(row.CONSTRAINT_NAME);
      }

      const changeAdvisorColumn = async (column) => {
        await queryInterface.changeColumn(
          'project_documents',
          column,
          {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          { transaction }
        );
      };

      await changeAdvisorColumn('advisor_id');
      await changeAdvisorColumn('co_advisor_id');

      // แปลงค่า advisor/co-advisor เดิม (ที่ยังเป็น user_id) -> teacher_id ก่อนสร้าง constraint ใหม่
      await queryInterface.sequelize.query(
        `UPDATE project_documents pd
         INNER JOIN teachers t ON pd.advisor_id = t.user_id
         SET pd.advisor_id = t.teacher_id`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `UPDATE project_documents pd
         INNER JOIN teachers t ON pd.co_advisor_id = t.user_id
         SET pd.co_advisor_id = t.teacher_id`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `UPDATE project_documents pd
         SET pd.advisor_id = NULL
         WHERE pd.advisor_id IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM teachers t WHERE t.teacher_id = pd.advisor_id
           )`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `UPDATE project_documents pd
         SET pd.co_advisor_id = NULL
         WHERE pd.co_advisor_id IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM teachers t WHERE t.teacher_id = pd.co_advisor_id
           )`,
        { transaction }
      );

      const addTeacherConstraint = async (column, name) => {
        await queryInterface.addConstraint('project_documents', {
          fields: [column],
          type: 'foreign key',
          name,
          references: {
            table: 'teachers',
            field: 'teacher_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          transaction
        });
      };

      await addTeacherConstraint('advisor_id', 'fk_project_documents_advisor_teacher');
      await addTeacherConstraint('co_advisor_id', 'fk_project_documents_co_advisor_teacher');

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const dropConstraint = async (name) => {
        try {
          await queryInterface.removeConstraint('project_documents', name, { transaction });
        } catch (error) {
          if (!/Unknown constraint|does not exist/i.test(error.message)) {
            throw error;
          }
        }
      };

      await dropConstraint('fk_project_documents_advisor_teacher');
      await dropConstraint('fk_project_documents_co_advisor_teacher');

      const changeAdvisorColumn = async (column) => {
        await queryInterface.changeColumn(
          'project_documents',
          column,
          {
            type: Sequelize.INTEGER,
            allowNull: true
          },
          { transaction }
        );
      };

      await changeAdvisorColumn('advisor_id');
      await changeAdvisorColumn('co_advisor_id');

      // แปลงกลับ teacher_id -> user_id หาก rollback
      await queryInterface.sequelize.query(
        `UPDATE project_documents pd
         INNER JOIN teachers t ON pd.advisor_id = t.teacher_id
         SET pd.advisor_id = t.user_id`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `UPDATE project_documents pd
         INNER JOIN teachers t ON pd.co_advisor_id = t.teacher_id
         SET pd.co_advisor_id = t.user_id`,
        { transaction }
      );

      const addUserConstraint = async (column, name) => {
        await queryInterface.addConstraint('project_documents', {
          fields: [column],
          type: 'foreign key',
          name,
          references: {
            table: 'users',
            field: 'user_id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          transaction
        });
      };

      await addUserConstraint('advisor_id', 'fk_project_advisor');
      await addUserConstraint('co_advisor_id', 'fk_project_co_advisor');

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
