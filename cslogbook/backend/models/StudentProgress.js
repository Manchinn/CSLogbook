const { Model, DataTypes, Sequelize } = require('sequelize');

module.exports = (sequelize) => {
    class StudentProgress extends Model {
        static associate(models) {
            StudentProgress.belongsTo(models.Student, {
                foreignKey: 'student_id',
                as: 'student'
            });
        }
    }

    StudentProgress.init({
        studentprogressId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'student_progress_id'
        },
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'student_id'
        },
        progressType: {
            type: DataTypes.ENUM('internship', 'project'),
            allowNull: false,
            field: 'progress_type'
        },
        currentStep: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'current_step'
        },
        totalSteps: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'total_steps'
        },
        progressPercent: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'progress_percent'
        },
        isBlocked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_blocked'
        },
        blockReason: {
            type: DataTypes.TEXT,
            field: 'block_reason'
        },
        nextAction: {
            type: DataTypes.STRING(100),
            field: 'next_action'
        },
        lastUpdated: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'last_updated'
        }
    }, {
        sequelize,
        modelName: 'StudentProgress',
        tableName: 'student_progress',
        timestamps: true,
        underscored: true
    });

    return StudentProgress;
};