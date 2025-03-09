const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class SystemLog extends Model {
        static associate(models) {
            SystemLog.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user'
            });
        }
    }

    SystemLog.init({
        logId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'log_id'
        },
        actionType: {
            type: DataTypes.STRING(50),
            allowNull: false,
            field: 'action_type'
        },
        actionDescription: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'action_description'
        },
        ipAddress: {
            type: DataTypes.STRING(45),
            allowNull: true,
            field: 'ip_address'
        },
        userAgent: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'user_agent'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'user_id'
        }
    }, {
        sequelize,
        modelName: 'SystemLog',
        tableName: 'system_logs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true,
        indexes: [
            {
                name: 'idx_log_user',
                fields: ['user_id']
            },
            {
                name: 'idx_log_action',
                fields: ['action_type']
            },
            {
                name: 'idx_log_date',
                fields: ['created_at']
            }
        ]
    });

    return SystemLog;
};
