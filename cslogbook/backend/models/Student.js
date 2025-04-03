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
            Student.hasMany(models.InternshipDocument, {
                foreignKey: 'studentId',
                as: 'internshipDocuments'
            });
            Student.hasMany(models.ProjectDocument, {
                foreignKey: 'studentId',
                as: 'projectDocuments'
            });
            Student.hasMany(models.Document, {
                foreignKey: 'userId',
                sourceKey: 'userId',
                as: 'documents'
            });
            /* Student.hasMany(models.TimelineStep, {
                foreignKey: 'student_id',
                as: 'timelineSteps'
            });
            Student.hasMany(models.StudentProgress, {
                foreignKey: 'student_id',
                as: 'progressData'
            }); */
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
        },
        semester: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1,
                max: 3
            }
        },
        academicYear: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'academic_year',
            defaultValue: () => {
                const currentDate = new Date();
                const currentYear = currentDate.getFullYear() + 543;
                const currentMonth = currentDate.getMonth() + 1;
                return currentMonth > 4 ? currentYear : currentYear - 1;
            }
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
            },
            {
                name: 'idx_academic_year',
                fields: ['academic_year']
            }
        ]
    });

    return Student;
};
