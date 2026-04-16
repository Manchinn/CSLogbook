'use strict';

/**
 * Migrate staff (admin) + teacher emails:
 *   natee.p@sci.ac.th  →  nateep@kmutnb.ac.th
 *
 * Rule: remove dots in local-part, switch domain to @kmutnb.ac.th
 * Scope: role IN ('teacher','admin') AND email LIKE '%@sci.ac.th'
 */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    await sequelize.query(`
      UPDATE users
      SET email = CONCAT(
        REPLACE(SUBSTRING_INDEX(email, '@', 1), '.', ''),
        '@kmutnb.ac.th'
      )
      WHERE role IN ('teacher', 'admin')
        AND email LIKE '%@sci.ac.th'
    `);
  },

  async down(queryInterface) {
    // No automatic revert — original dot positions are not recoverable.
    // Restore from backup if rollback is needed.
  }
};
