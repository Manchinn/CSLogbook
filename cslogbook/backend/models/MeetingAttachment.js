const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class MeetingAttachment extends Model {
        static associate(models) {
            MeetingAttachment.belongsTo(models.MeetingLog, {
                foreignKey: 'log_id',
                as: 'log'
            });
            MeetingAttachment.belongsTo(models.User, {
                foreignKey: 'uploaded_by',
                as: 'uploader'
            });
        }
    }

    MeetingAttachment.init({
        attachmentId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'attachment_id'
        },
        fileName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'file_name'
        },
        filePath: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'file_path'
        },
        fileType: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'file_type'
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'file_size'
        },
        uploadDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'upload_date'
        },
        uploadedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'uploaded_by'
        },
        logId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'log_id'
        }
    }, {
        sequelize,
        modelName: 'MeetingAttachment',
        tableName: 'meeting_attachments',
        timestamps: false,
        indexes: [
            {
                name: 'idx_attachment_log',
                fields: ['log_id']
            },
            {
                name: 'idx_attachment_uploader',
                fields: ['uploaded_by']
            }
        ]
    });

    return MeetingAttachment;
};
