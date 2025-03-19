const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class DocumentRevision extends Model {
        static associate(models) {
            DocumentRevision.belongsTo(models.Document, {
                foreignKey: 'document_id',
                as: 'document'
            });
            DocumentRevision.belongsTo(models.User, {
                foreignKey: 'created_by',
                as: 'creator'
            });
        }
    }

    DocumentRevision.init({
        revisionId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'revision_id'
        },
        documentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'document_id'
        },
        version: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        filePath: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'file_path'
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'created_by'
        }
    }, {
        sequelize,
        modelName: 'DocumentRevision',
        tableName: 'document_revisions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true,
        indexes: [
            {
                name: 'idx_document_version',
                fields: ['document_id', 'version'],
                unique: true
            },
            {
                name: 'idx_revision_creator',
                fields: ['created_by']
            }
        ]
    });

    return DocumentRevision;
};
