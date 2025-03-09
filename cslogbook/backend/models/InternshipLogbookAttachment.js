const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class InternshipLogbookAttachment extends Model {
        static associate(models) {
            InternshipLogbookAttachment.belongsTo(models.InternshipLogbook, {
                foreignKey: 'log_id',
                as: 'logbook'
            });
        }
    }

    InternshipLogbookAttachment.init({
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
        logId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'log_id'
        }
    }, {
        sequelize,
        modelName: 'InternshipLogbookAttachment',
        tableName: 'internship_logbook_attachments',
        timestamps: false,
        indexes: [
            {
                name: 'idx_upload_date',
                fields: ['upload_date']
            },
            {
                name: 'fk_attachment_logbook',
                fields: ['log_id']
            }
        ]
    });

    return InternshipLogbookAttachment;
};
