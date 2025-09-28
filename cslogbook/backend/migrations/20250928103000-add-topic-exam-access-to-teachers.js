'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('teachers', 'can_access_topic_exam', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'กำหนดว่าสามารถเข้าถึง Topic Exam Overview ได้หรือไม่'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('teachers', 'can_access_topic_exam');
  }
};
