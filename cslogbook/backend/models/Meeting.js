const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Meeting extends Model {
        static associate(models) {
            Meeting.belongsTo(models.ProjectDocument, {
                foreignKey: 'project_id',
                as: 'project'
            });
            Meeting.belongsTo(models.User, {
                foreignKey: 'created_by',
                as: 'creator'
            });
            Meeting.hasMany(models.MeetingParticipant, {
                foreignKey: 'meeting_id',
                as: 'participants'
            });
            Meeting.hasMany(models.MeetingLog, {
                foreignKey: 'meeting_id',
                as: 'logs'
            });
        }
    }

    Meeting.init({
        meetingId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'meeting_id'
        },
        meetingTitle: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'meeting_title'
        },
        meetingDate: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'meeting_date'
        },
        meetingMethod: {
            type: DataTypes.ENUM('onsite', 'online', 'hybrid'),
            allowNull: false,
            field: 'meeting_method'
        },
        meetingLocation: {
            type: DataTypes.STRING(100),
            allowNull: true,
            field: 'meeting_location'
        },
        meetingLink: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'meeting_link'
        },
        status: {
            type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
            defaultValue: 'scheduled'
        },
        projectId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'project_id'
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'created_by'
        }
    }, {
        sequelize,
        modelName: 'Meeting',
        tableName: 'meetings',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_meeting_date',
                fields: ['meeting_date']
            },
            {
                name: 'idx_meeting_status',
                fields: ['status']
            }
        ]
    });

    return Meeting;
};
