const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class User extends Model {
        static associate(models) {
            User.hasOne(models.Student, {
                foreignKey: 'user_id',
                sourceKey: 'userId',
                as: 'student'
            });
            User.hasOne(models.Teacher, {
                foreignKey: 'user_id',
                as: 'teacher'
            });
            User.hasOne(models.Admin, {
                foreignKey: 'user_id',
                sourceKey: 'userId',
                as: 'admin'
            });
            User.hasMany(models.Document, {
                foreignKey: 'user_id',
                sourceKey: 'userId',
                as: 'documents'
            });
            User.hasMany(models.NotificationSetting, {
                foreignKey: 'updatedByAdminId',
                sourceKey: 'userId',
                as: 'notificationUpdates',
                constraints: false // ไม่บังคับ foreign key constraint
            });
        }
                /**
         * เมธอดสำหรับตรวจสอบว่าเป็น admin หรือไม่
         */
        isAdmin() {
            return this.role === 'admin';
        }

        /**
         * เมธอดสำหรับดึงข้อมูล admin ทั้งหมด
         */
        static async getAdmins() {
            return await User.findAll({
                where: { role: 'admin', active_status: true },
                attributes: ['user_id', 'username', 'email', 'first_name', 'last_name', 'active_status']
            });
        }

        /**
         * เมธอดสำหรับแปลงเป็น Admin object
         */
        toAdminObject() {
            if (!this.isAdmin()) {
                throw new Error('User นี้ไม่ใช่ admin');
            }
            
            return {
                admin_id: this.user_id,
                username: this.username,
                email: this.email,
                first_name: this.first_name,
                last_name: this.last_name,
                full_name: `${this.first_name || ''} ${this.last_name || ''}`.trim(),
                active_status: this.active_status
            };
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
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['username']
            },
            {
                unique: true,
                fields: ['email']
            },
            {
                fields: ['role']
            },
            {
                fields: ['active_status']
            }
        ]
    });

    return User;
};
