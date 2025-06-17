module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('curriculums', 'max_credits', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('curriculums', 'max_credits');
  }
};