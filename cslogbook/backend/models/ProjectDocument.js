const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ProjectDocument extends Model {
        static associate(models) {
            ProjectDocument.belongsTo(models.Teacher, {
                foreignKey: 'advisor_id',
                as: 'advisor'
            });
            ProjectDocument.belongsTo(models.Teacher, {
                foreignKey: 'co_advisor_id',
                as: 'coAdvisor'
            });
            ProjectDocument.belongsTo(models.Document, {
                foreignKey: 'document_id',
                as: 'document'
            });
            ProjectDocument.hasMany(models.ProjectMember, {
                foreignKey: 'project_id',
                as: 'members'
            });
            ProjectDocument.hasMany(models.Meeting, {
                foreignKey: 'project_id',
                as: 'meetings'
            });
        }
    }

    ProjectDocument.init({
        projectId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'project_id'
        },
        documentId: {
            type: DataTypes.INTEGER,
            field: 'document_id'
        },
        projectNameTh: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'project_name_th'
        },
        projectNameEn: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'project_name_en'
        },
        projectType: {
            type: DataTypes.ENUM('govern', 'private', 'research'),
            allowNull: false,
            field: 'project_type'
        },
        track: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        advisorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'advisor_id'
        },
        coAdvisorId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'co_advisor_id'
        }
    }, {
        sequelize,
        modelName: 'ProjectDocument',
        tableName: 'project_documents',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                name: 'idx_project_name',
                fields: ['project_name_th']
            },
            {
                name: 'idx_project_type',
                fields: ['project_type']
            }
        ]
    });

    return ProjectDocument;
};
