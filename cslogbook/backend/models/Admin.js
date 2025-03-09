const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Admin extends Model {
        static associate(models) {
            Admin.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user'
            });
        }
    }

    Admin.init({
        adminId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'admin_id'
        },
        adminCode: {
            type: DataTypes.STRING(10),
            allowNull: false,
            unique: true,
            field: 'admin_code'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id'
        },
        responsibilities: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        contactExtension: {
            type: DataTypes.STRING(20),
            allowNull: true,
            field: 'contact_extension'
        }
    }, {
        sequelize,
        modelName: 'Admin',
        tableName: 'admins',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_admin_user',
                fields: ['user_id']
            },
            {
                unique: true,
                name: 'idx_admin_code',
                fields: ['admin_code']
            }
        ]
    });

    return Admin;
};
