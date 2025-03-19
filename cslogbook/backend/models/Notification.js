const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Notification extends Model {
        static associate(models) {
            Notification.belongsTo(models.User, {
                foreignKey: 'recipient_id',
                as: 'recipient'
            });
        }
    }

    Notification.init({
        notificationId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'notification_id'
        },
        recipientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'recipient_id'
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        notificationType: {
            type: DataTypes.ENUM('login', 'document', 'system', 'approval'),
            allowNull: false,
            field: 'notification_type'
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_read'
        },
        relatedId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'related_id'
        }
    }, {
        sequelize,
        modelName: 'Notification',
        tableName: 'notifications',
        timestamps: true,
        updatedAt: false,
        createdAt: 'created_at',
        indexes: [
            {
                name: 'idx_notification_user',
                fields: ['recipient_id']
            },
            {
                name: 'idx_notification_type',
                fields: ['notification_type']
            },
            {
                name: 'idx_notification_read',
                fields: ['is_read']
            }
        ]
    });

    return Notification;
};
