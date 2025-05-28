const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class NotificationSetting extends Model {
        static associate(models) {
            // สร้างความสัมพันธ์กับ Admin สำหรับการติดตามผู้แก้ไข
            NotificationSetting.belongsTo(models.Admin, {
                foreignKey: 'updated_by_admin',
                as: 'adminUpdater',
                allowNull: true
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
                updatedBy: this.updated_by_admin
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
            field: 'updated_by_admin',
            references: {
                model: 'admins',
                key: 'admin_id'
            }
        }
    }, {
        sequelize,
        modelName: 'NotificationSetting',
        tableName: 'notification_settings',
        timestamps: true,
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