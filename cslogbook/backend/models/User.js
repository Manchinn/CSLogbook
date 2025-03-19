const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class User extends Model {
        static associate(models) {
            User.hasOne(models.Student, {
                foreignKey: 'userId',
                as: 'student'
            });
            User.hasOne(models.Teacher, {
                foreignKey: 'userId',
                as: 'teacher'
            });
            User.hasOne(models.Admin, {
                foreignKey: 'userId',
                as: 'admin'
            });
        }
    }

    User.init({
        userId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'user_id'
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        role: {
            type: DataTypes.ENUM('student', 'teacher', 'admin'),
            allowNull: false
        },
        firstName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'first_name'
        },
        lastName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'last_name'
        },
        activeStatus: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'active_status'
        },
        lastLogin: {
            type: DataTypes.DATE,
            field: 'last_login'
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        underscored: true
    });

    return User;
};
