'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, {
        foreignKey: 'userId',
        targetKey: 'userId',
        as: 'user',
        constraints: false
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    type: {
      type: DataTypes.ENUM('DOCUMENT', 'APPROVAL', 'LOGBOOK', 'EVALUATION', 'MEETING'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    message: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read'
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      { name: 'idx_notif_user_read', fields: ['user_id', 'is_read'] },
      { name: 'idx_notif_user_created', fields: ['user_id', 'created_at'] }
    ]
  });

  return Notification;
};
