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
        internshipId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'internship_id'
        },
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'student_id'
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
        timeIn: {
            type: DataTypes.STRING(5), // format: "HH:MM"
            allowNull: true,
            field: 'time_in'
        },
        timeOut: {
            type: DataTypes.STRING(5), // format: "HH:MM" 
            allowNull: true,
            field: 'time_out'
        },
        supervisorComment: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'supervisor_comment'
        },
        supervisorApproved: {
            type: DataTypes.INTEGER, // Changed from DataTypes.BOOLEAN
            defaultValue: 0, // Changed from false, 0 for pending
            field: 'supervisor_approved'
        },
        supervisorApprovedAt: { // Added field definition
            type: DataTypes.DATE,
            allowNull: true,
            field: 'supervisor_approved_at' // Snake case for DB
        },
        supervisorRejectedAt: { // Added field definition
            type: DataTypes.DATE,
            allowNull: true,
            field: 'supervisor_rejected_at' // Snake case for DB
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
