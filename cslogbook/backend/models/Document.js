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
                as: 'internshipDocument'
            });
            Document.hasMany(models.DocumentLog, {
                foreignKey: 'document_id',
                as: 'documentLogs'
            });
            Document.hasMany(models.DocumentRevision, {
                foreignKey: 'document_id',
                as: 'documentRevisions'
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
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'file_path'
        },
        status: {
            type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
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
        }
    }, {
        sequelize,
        modelName: 'Document',
        tableName: 'documents',
        timestamps: true,
        underscored: true,
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
            }
        ]
    });

    return Document;
};
