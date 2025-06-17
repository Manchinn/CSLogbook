module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('curriculums', {
            curriculum_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            code: {
                type: Sequelize.STRING(10),
                allowNull: false,
                unique: true
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            short_name: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            start_year: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            end_year: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            requirements: {
                type: Sequelize.JSON,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('curriculums');
    }
};