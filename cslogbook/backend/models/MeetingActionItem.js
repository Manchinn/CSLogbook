const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class MeetingActionItem extends Model {
        static associate(models) {
            MeetingActionItem.belongsTo(models.MeetingLog, {
                foreignKey: 'log_id',
                as: 'log'
            });
            MeetingActionItem.belongsTo(models.User, {
                foreignKey: 'assigned_to',
                as: 'assignee'
            });
        }
    }

    MeetingActionItem.init({
        itemId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'item_id'
        },
        logId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'log_id'
        },
        actionDescription: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'action_description'
        },
        assignedTo: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'assigned_to'
        },
        dueDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'due_date'
        },
        status: {
            type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'delayed'),
            defaultValue: 'pending',
            allowNull: true
        },
        completionDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'completion_date'
        }
    }, {
        sequelize,
        modelName: 'MeetingActionItem',
        tableName: 'meeting_action_items',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_action_due',
                fields: ['due_date']
            },
            {
                name: 'idx_action_status',
                fields: ['status']
            },
            {
                name: 'idx_action_assignee',
                fields: ['assigned_to']
            }
        ]
    });

    return MeetingActionItem;
};
