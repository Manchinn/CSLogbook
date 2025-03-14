const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class InternshipLogbook extends Model {
        static associate(models) {
            InternshipLogbook.belongsTo(models.InternshipDocument, {
                foreignKey: 'internshipId',
                as: 'internship'
            });
            InternshipLogbook.belongsTo(models.Student, {
                foreignKey: 'studentId',
                as: 'student'
            });
            InternshipLogbook.hasMany(models.InternshipLogbookAttachment, {
                foreignKey: 'logId',
                as: 'attachments'
            });
            InternshipLogbook.hasMany(models.InternshipLogbookRevision, {
                foreignKey: 'logId',
                as: 'revisions'
            });
        }
    }

    InternshipLogbook.init({
        logId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'log_id'
        },
        workDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: 'work_date'
        },
        logTitle: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'log_title'
        },
        workDescription: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'work_description'
        },
        learningOutcome: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'learning_outcome'
        },
        problems: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        solutions: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        workHours: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: false,
            field: 'work_hours'
        },
        supervisorComment: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'supervisor_comment'
        },
        supervisorApproved: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'supervisor_approved'
        },
        advisorComment: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'advisor_comment'
        },
        advisorApproved: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'advisor_approved'
        }
    }, {
        sequelize,
        modelName: 'InternshipLogbook',
        tableName: 'internship_logbooks',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_work_date',
                fields: ['work_date']
            },
            {
                name: 'idx_approval_status',
                fields: ['supervisor_approved', 'advisor_approved']
            }
        ]
    });

    return InternshipLogbook;
};
