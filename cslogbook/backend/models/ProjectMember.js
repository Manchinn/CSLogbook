const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ProjectMember extends Model {
        static associate(models) {
            ProjectMember.belongsTo(models.ProjectDocument, {
                foreignKey: 'project_id',
                as: 'project'
            });
            ProjectMember.belongsTo(models.Student, {
                foreignKey: 'student_id',
                as: 'student'
            });
        }
    }

    ProjectMember.init({
        projectId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'project_id'
        },
        studentId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            field: 'student_id'
        },
        role: {
            type: DataTypes.ENUM('leader', 'member'),
            allowNull: false
        },
        joinedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'joined_at'
        }
    }, {
        sequelize,
        modelName: 'ProjectMember',
        tableName: 'project_members',
        timestamps: false,
        indexes: [
            {
                unique: true,
                name: 'idx_project_member',
                fields: ['project_id', 'student_id']
            }
        ]
    });

    return ProjectMember;
};
