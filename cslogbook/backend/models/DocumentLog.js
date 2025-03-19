const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class DocumentLog extends Model {
        static associate(models) {
            DocumentLog.belongsTo(models.Document, {
                foreignKey: 'documentId',
                targetKey: 'documentId',
                as: 'document'
            });
            DocumentLog.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            });
        }
    }

    DocumentLog.init({
        logId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'log_id'
        },
        documentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'document_id'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'user_id'
        },
        actionType: {
            type: DataTypes.ENUM('create', 'update', 'delete', 'approve', 'reject'),
            allowNull: false,
            field: 'action_type'
        },
        previousStatus: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'previous_status'
        },
        newStatus: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'new_status'
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'DocumentLog',
        tableName: 'document_logs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true,
        indexes: [
            {
                name: 'idx_doclog_document',
                fields: ['document_id']
            },
            {
                name: 'idx_doclog_user',
                fields: ['user_id']
            },
            {
                name: 'idx_doclog_action',
                fields: ['action_type']
            }
        ]
    });

    return DocumentLog;
};
