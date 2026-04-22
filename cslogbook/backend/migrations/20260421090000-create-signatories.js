'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = (await queryInterface.showAllTables()).map((t) =>
      typeof t === 'string' ? t : t.tableName
    );

    if (!tables.includes('signatories')) {
      await queryInterface.createTable('signatories', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING(150),
          allowNull: false
        },
        title: {
          type: Sequelize.STRING(150),
          allowNull: false
        },
        signature_url: {
          type: Sequelize.STRING(255),
          allowNull: true,
          defaultValue: null
        },
        role: {
          type: Sequelize.ENUM('PRIMARY', 'DEPUTY', 'ACTING'),
          allowNull: false,
          defaultValue: 'PRIMARY'
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW')
        }
      });
    }

    await ensureIndex(queryInterface, 'signatories', ['is_active'], 'idx_signatories_is_active');
    await ensureIndex(queryInterface, 'signatories', ['role'], 'idx_signatories_role');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('signatories', 'idx_signatories_is_active');
    await queryInterface.removeIndex('signatories', 'idx_signatories_role');

    await queryInterface.dropTable('signatories');

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_signatories_role";');
    }
  }
};

async function ensureIndex(queryInterface, table, fields, name) {
  const [rows] = await queryInterface.sequelize.query(
    `SHOW INDEX FROM \`${table}\` WHERE Key_name = :name`,
    { replacements: { name } }
  );
  if (rows.length === 0) {
    await queryInterface.addIndex(table, fields, { name });
  }
}
