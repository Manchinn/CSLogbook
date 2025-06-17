const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class NotificationSetting extends Model {
        static associate(models) {
            // สร้างความสัมพันธ์กับ User สำหรับการติดตามผู้แก้ไข
            NotificationSetting.belongsTo(models.User, {
                foreignKey: 'updatedByAdminId', // ชื่อ field ในฐานข้อมูล
                targetKey: 'userId',
                as: 'updatedByUser', // alias สำหรับการ JOIN
                constraints: false, // ไม่บังคับ foreign key constraint
            });
        }

        /**
         * เมธอดสำหรับตรวจสอบว่าการแจ้งเตือนเปิดใช้งานหรือไม่
         */
        isEnabled() {
            return this.is_enabled === true;
        }

        /**
         * เมธอดสำหรับแปลงเป็น Object ธรรมดา
         */
        toSimpleObject() {
            return {
                type: this.notification_type,
                enabled: this.is_enabled,
                description: this.description,
                lastUpdated: this.updated_at,
                updatedBy: this.updated_by_admin,
                updatedByUser: this.updatedByUser ? {
                    id: this.updatedByUser.user_id,
                    username: this.updatedByUser.username,
                    fullName: `${this.updatedByUser.first_name} ${this.updatedByUser.last_name}`.trim()
                } : null
            };
        }
    }

    NotificationSetting.init({
        settingId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'setting_id'
        },
        notificationType: {
            type: DataTypes.ENUM('LOGIN', 'DOCUMENT', 'LOGBOOK', 'EVALUATION', 'APPROVAL'),
            allowNull: false,
            unique: true,
            field: 'notification_type',
            validate: {
                isIn: {
                    args: [['LOGIN', 'DOCUMENT', 'LOGBOOK', 'EVALUATION', 'APPROVAL']],
                    msg: 'ประเภทการแจ้งเตือนต้องเป็น LOGIN, DOCUMENT, LOGBOOK, EVALUATION หรือ APPROVAL'
                }
            }
        },
        isEnabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_enabled'
        },
        description: {
            type: DataTypes.STRING(200),
            allowNull: true,
            validate: {
                len: [0, 200]
            }
        },
        updatedByAdminId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'updated_by_admin'
        }
    }, {
        sequelize,
        modelName: 'NotificationSetting',
        tableName: 'notification_settings',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
        indexes: [
            {
                unique: true,
                name: 'idx_notification_type',
                fields: ['notification_type']
            },
            {
                name: 'idx_notification_enabled',
                fields: ['is_enabled']
            },
            {
                name: 'idx_updated_by_admin',
                fields: ['updated_by_admin']
            }
        ],
        hooks: {
            beforeSave: (setting) => {
                // ตรวจสอบความถูกต้องของ notification type
                const validTypes = ['LOGIN', 'DOCUMENT', 'LOGBOOK', 'EVALUATION', 'APPROVAL'];
                if (!validTypes.includes(setting.notificationType)) {
                    throw new Error(`ประเภทการแจ้งเตือนไม่ถูกต้อง: ${setting.notificationType}`);
                }
            }
        }
    });

    return NotificationSetting;
};