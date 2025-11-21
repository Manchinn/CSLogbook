/* eslint-disable no-console */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('academics', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'draft',
      after: 'is_current',
    });

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
          UPDATE academics
          SET status = CASE WHEN is_current = 1 THEN 'active' ELSE 'published' END
        `,
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('academics', 'status');
  },
};

