const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class TimelineStep extends Model {
        static associate(models) {
            TimelineStep.belongsTo(models.Student, {
                foreignKey: 'student_id',
                as: 'student'
            });
        }
    }

    TimelineStep.init({
        timestampsId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'timestamps_id'
        },
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'student_id',
            references: {
                model: 'students',
                key: 'student_id'
            }
        },
        type: {
            type: DataTypes.ENUM('internship', 'project'),
            allowNull: false
        },
        stepOrder: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'step_order'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        status: {
            type: DataTypes.ENUM('waiting', 'in_progress', 'completed', 'blocked'),
            defaultValue: 'waiting'
        },
        date: {
            type: DataTypes.DATE
        },
        startDate: {
            type: DataTypes.DATE,
            field: 'start_date'
        },
        endDate: {
            type: DataTypes.DATE,
            field: 'end_date'
        },
        deadline: {
            type: DataTypes.DATE
        },
        documentType: {
            type: DataTypes.STRING,
            field: 'document_type'
        },
        actionText: {
            type: DataTypes.STRING,
            field: 'action_text'
        },
        actionLink: {
            type: DataTypes.STRING,
            field: 'action_link'
        }
    }, {
        sequelize,
        modelName: 'TimelineStep',
        tableName: 'timeline_steps',
        timestamps: true,
        underscored: true
    });

    return TimelineStep;
};
