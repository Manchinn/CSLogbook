/**
 * เพิ่มช่วงเวลา (windowStartAt/windowEndAt) + allDay ให้ ImportantDeadlines
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('important_deadlines', 'window_start_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('important_deadlines', 'window_end_at', { type: Sequelize.DATE, allowNull: true });
    await queryInterface.addColumn('important_deadlines', 'all_day', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('important_deadlines', 'window_start_at');
    await queryInterface.removeColumn('important_deadlines', 'window_end_at');
    await queryInterface.removeColumn('important_deadlines', 'all_day');
  }
};
