const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class TeacherProjectManagement extends Model {
        static associate(models) {
            TeacherProjectManagement.belongsTo(models.Teacher, {
                foreignKey: 'teacher_id',
                as: 'teacher'
            });
        }
    }

    TeacherProjectManagement.init({
        managementId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'management_id'
        },
        teacherId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'teacher_id'
        },
        academicYear: {
            type: DataTypes.STRING(4),
            allowNull: false,
            field: 'academic_year'
        },
        semester: {
            type: DataTypes.TINYINT,
            allowNull: false
        },
        projectType: {
            type: DataTypes.ENUM('advisor', 'committee', 'examiner'),
            allowNull: false,
            field: 'project_type'
        },
        maxProjects: {
            type: DataTypes.INTEGER,
            defaultValue: 5,
            field: 'max_projects'
        },
        currentProjects: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'current_projects'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'TeacherProjectManagement',
        tableName: 'teacher_project_management',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                name: 'unique_teacher_semester',
                fields: ['teacher_id', 'academic_year', 'semester', 'project_type']
            }
        ]
    });

    return TeacherProjectManagement;
};
