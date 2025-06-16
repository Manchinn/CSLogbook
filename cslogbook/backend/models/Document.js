const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Document extends Model {
        static associate(models) {
            Document.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'owner'
            });
            Document.belongsTo(models.User, {
                foreignKey: 'reviewer_id',
                as: 'reviewer'
            });
            Document.hasOne(models.ProjectDocument, {
                foreignKey: 'document_id',
                as: 'projectDocument'
            });
            Document.hasOne(models.InternshipDocument, {
                foreignKey: 'document_id',
                sourceKey: 'documentId',
                as: 'internshipDocument'
            });
            Document.hasMany(models.DocumentLog, {
                foreignKey: 'document_id',
                as: 'documentLogs'
            });
        }
    }

    Document.init({
        documentId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'document_id'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id'
        },
        reviewerId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'reviewer_id'
        },
        documentType: {
            type: DataTypes.ENUM('internship', 'project'),
            allowNull: false,
            field: 'document_type'
        },
        documentName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'document_name'
        },
        filePath: {
            type: DataTypes.STRING(255), // Path to the file
            allowNull: true,
            field: 'file_path'
        },
        status: {
            type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected', 'supervisor_evaluated','acceptance_approved','referral_ready','referral_downloaded'),
            defaultValue: 'draft'
        },
        reviewDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'review_date'
        },
        reviewComment: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'review_comment'
        },
        category: {
            type: DataTypes.ENUM('proposal', 'progress', 'final', 'acceptance'),
            allowNull: false,
            field: 'category'
        },
        dueDate: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'due_date'
        },
        fileSize: {
            type: DataTypes.INTEGER, // File size in bytes
            allowNull: true,
            field: 'file_size'
        },
        mimeType: {
            type: DataTypes.STRING(50), // MIME type of the file
            allowNull: true,
            field: 'mime_type'
        },
        downloadStatus: {
            type: DataTypes.ENUM('not_downloaded', 'downloaded'),
            allowNull: true,
            defaultValue: 'not_downloaded',
            field: 'download_status'
        },
        downloadedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'downloaded_at'
        },
        downloadCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
            field: 'download_count'
        }
    }, {
        sequelize,
        modelName: 'Document',
        tableName: 'documents',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                name: 'idx_document_user',
                fields: ['user_id']
            },
            {
                name: 'idx_document_reviewer',
                fields: ['reviewer_id']
            },
            {
                name: 'idx_document_status',
                fields: ['status']
            },
            {
                name: 'idx_document_type',
                fields: ['document_type']
            },
            {
                name: 'idx_document_created',
                fields: ['created_at']
            },
            {
                name: 'idx_documents_download_status',
                fields: ['download_status']
            },
            {
                name: 'idx_documents_type_download_status', 
                fields: ['document_type', 'download_status']
            },
            {
                name: 'idx_documents_downloaded_at',
                fields: ['downloaded_at']
            }
        ]
    });

    return Document;
};
