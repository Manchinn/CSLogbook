const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class UploadHistory extends Model {
        static associate(models) {
            UploadHistory.belongsTo(models.User, {
                foreignKey: 'uploaded_by',
                as: 'uploader'
            });
        }
    }

    UploadHistory.init({
        historyId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'history_id'
        },
        uploadedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'uploaded_by'
        },
        fileName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'file_name'
        },
        totalRecords: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'total_records'
        },
        successfulUpdates: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'successful_updates'
        },
        failedUpdates: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'failed_updates'
        },
        details: {
            type: DataTypes.JSON,
            allowNull: true
        },
        uploadType: {
            type: DataTypes.ENUM('students', 'grades'),
            defaultValue: 'students',
            field: 'upload_type'
        }
    }, {
        sequelize,
        modelName: 'UploadHistory',
        tableName: 'upload_history',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true,
        indexes: [
            {
                name: 'idx_upload_history_uploader',
                fields: ['uploaded_by']
            }
        ]
    });

    return UploadHistory;
};
