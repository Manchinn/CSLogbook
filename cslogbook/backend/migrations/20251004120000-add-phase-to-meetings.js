module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('meetings', 'phase', {
      type: Sequelize.ENUM('phase1', 'phase2'),
      allowNull: false,
      defaultValue: 'phase1'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('meetings', 'phase');

    // ทำความสะอาด enum สำหรับ PostgreSQL หากถูกสร้างขึ้น
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_meetings_phase";');
    }
  }
};
