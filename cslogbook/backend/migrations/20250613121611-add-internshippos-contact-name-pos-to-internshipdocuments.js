'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('internship_documents', 'internship_position', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'company_address'
    });

    await queryInterface.addColumn('internship_documents', 'contact_person_name', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'internship_position'
    });

    await queryInterface.addColumn('internship_documents', 'contact_person_position', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'contact_person_name'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('internship_documents', 'internship_position');
    await queryInterface.removeColumn('internship_documents', 'contact_person_name');
    await queryInterface.removeColumn('internship_documents', 'contact_person_position');
  }
};