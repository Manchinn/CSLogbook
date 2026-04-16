'use strict';

/**
 * Migrate staff (admin) + teacher emails:
 *   luepol.p@sci.kmutnb.ac.th  →  luepolp@kmutnb.ac.th
 *
 * Rule: remove dots in local-part, switch domain to @kmutnb.ac.th
 * Scope: role IN ('teacher','admin') AND email LIKE '%@sci.kmutnb.ac.th'
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE users
      SET email = CONCAT(
        REPLACE(SUBSTRING_INDEX(email, '@', 1), '.', ''),
        '@kmutnb.ac.th'
      )
      WHERE role IN ('teacher', 'admin')
        AND email LIKE '%@sci.kmutnb.ac.th'
    `);
  },

  async down() {
    // No automatic revert — original dot positions are not recoverable.
  }
};
