const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class MeetingParticipant extends Model {
        static associate(models) {
            MeetingParticipant.belongsTo(models.Meeting, {
                foreignKey: 'meeting_id',
                as: 'meeting'
            });
            MeetingParticipant.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user'
            });
        }
    }

    MeetingParticipant.init({
        meetingId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'meeting_id'
        },
        userId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'user_id'
        },
        role: {
            type: DataTypes.ENUM('advisor', 'co_advisor', 'student', 'guest'),
            allowNull: false
        },
        attendanceStatus: {
            type: DataTypes.ENUM('present', 'absent', 'late'),
            defaultValue: 'present',
            field: 'attendance_status'
        },
        joinTime: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'join_time'
        },
        leaveTime: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'leave_time'
        }
    }, {
        sequelize,
        modelName: 'MeetingParticipant',
        tableName: 'meeting_participants',
        timestamps: false,
        indexes: [
            {
                name: 'idx_meeting_participant_user',
                fields: ['user_id']
            },
            {
                name: 'idx_meeting_participant_meeting',
                fields: ['meeting_id']
            }
        ]
    });

    return MeetingParticipant;
};
