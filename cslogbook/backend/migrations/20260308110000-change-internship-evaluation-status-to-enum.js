'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Safety: ตรวจว่าไม่มี status ที่ไม่คาดคิด
    const [rows] = await queryInterface.sequelize.query(
      `SELECT DISTINCT status FROM internship_evaluations WHERE status NOT IN ('submitted_by_supervisor', 'completed')`
    );
    if (rows.length > 0) {
      throw new Error(`Unexpected status values found: ${rows.map(r => r.status).join(', ')}. Aborting migration.`);
    }

    await queryInterface.changeColumn('internship_evaluations', 'status', {
      type: Sequelize.ENUM('submitted_by_supervisor', 'completed'),
      allowNull: false,
      defaultValue: 'submitted_by_supervisor',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('internship_evaluations', 'status', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'submitted_by_supervisor',
    });
  }
};
