const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Student extends Model {
        static associate(models) {
            Student.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            });
            Student.belongsTo(models.Teacher, {
                foreignKey: 'advisorId',
                as: 'advisor'
            });
            Student.hasMany(models.ProjectMember, {
                foreignKey: 'studentId',
                as: 'projectMemberships'
            });
        }
    }

    Student.init({
        studentId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'student_id'
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'user_id'
        },
        studentCode: {
            type: DataTypes.STRING(13),
            allowNull: false,
            unique: true,
            field: 'student_code'
        },
        totalCredits: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'total_credits'
        },
        majorCredits: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'major_credits'
        },
        gpa: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: true
        },
        studyType: {
            type: DataTypes.ENUM('regular', 'special'),
            allowNull: false,
            defaultValue: 'regular',
            field: 'study_type'
        },
        isEligibleInternship: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_eligible_internship'
        },
        isEligibleProject: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_eligible_project'
        },
        advisorId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'advisor_id'
        }
    }, {
        sequelize,
        modelName: 'Student',
        tableName: 'students',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_student_advisor',
                fields: ['advisor_id']
            },
            {
                unique: true,
                name: 'idx_student_code',
                fields: ['student_code']
            }
        ]
    });

    return Student;
};
