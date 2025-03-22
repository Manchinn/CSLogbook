'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('internship_logbooks', 'time_in', {
      type: Sequelize.STRING(5),
      allowNull: true
    });
    
    await queryInterface.addColumn('internship_logbooks', 'time_out', {
      type: Sequelize.STRING(5),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('internship_logbooks', 'time_in');
    await queryInterface.removeColumn('internship_logbooks', 'time_out');
  }
};