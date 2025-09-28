const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class MeetingLog extends Model {
        static associate(models) {
            MeetingLog.belongsTo(models.Meeting, {
                foreignKey: 'meeting_id',
                as: 'meeting'
            });
            MeetingLog.belongsTo(models.User, {
                foreignKey: 'recorded_by',
                as: 'recorder'
            });
            MeetingLog.belongsTo(models.User, {
                foreignKey: 'approved_by',
                as: 'approver'
            });
            MeetingLog.hasMany(models.MeetingAttachment, {
                foreignKey: 'log_id',
                as: 'attachments'
            });
            MeetingLog.hasMany(models.MeetingActionItem, {
                foreignKey: 'log_id',
                as: 'actionItems'
            });
        }
    }

    MeetingLog.init({
        logId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'log_id'
        },
        meetingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'meeting_id'
        },
        discussionTopic: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'discussion_topic'
        },
        currentProgress: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'current_progress'
        },
        problemsIssues: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'problems_issues'
        },
        nextActionItems: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'next_action_items'
        },
        advisorComment: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'advisor_comment'
        },
        approvalStatus: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
            field: 'approval_status'
        },
        approvedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'approved_by'
        },
        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'approved_at'
        },
        approvalNote: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'approval_note'
        },
        recordedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'recorded_by'
        }
    }, {
        sequelize,
        modelName: 'MeetingLog',
        tableName: 'meeting_logs',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_meeting_log_meeting',
                fields: ['meeting_id']
            },
            {
                name: 'idx_meeting_log_recorder',
                fields: ['recorded_by']
            },
            {
                name: 'idx_meeting_log_approval_status',
                fields: ['approval_status']
            },
            {
                name: 'idx_meeting_log_approved_by',
                fields: ['approved_by']
            }
        ]
    });

    return MeetingLog;
};
