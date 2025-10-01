const { Model, DataTypes, Op } = require('sequelize');

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

        static async ensureSingleActiveProject(instance, options = {}) {
            if (options?.skipActiveMembershipCheck) return;

            const studentId = instance.studentId ?? instance.get?.('studentId');
            const projectId = instance.projectId ?? instance.get?.('projectId');
            if (!studentId) return;

            const transaction = options.transaction;
            const ProjectDocument = sequelize.models.ProjectDocument;

            // ถ้าโครงงานเป้าหมายถูกเก็บถาวรแล้ว อนุญาต (ใช้สำหรับ cleanup เท่านั้น)
            if (ProjectDocument && projectId) {
                const target = await ProjectDocument.findByPk(projectId, {
                    attributes: ['status'],
                    transaction
                });
                if (target?.status === 'archived') return;
            }

            const projectInclude = ProjectDocument ? [{
                model: ProjectDocument,
                as: 'project',
                required: true,
                attributes: ['projectId', 'status'],
                where: { status: { [Op.ne]: 'archived' } }
            }] : [];

            const existing = await ProjectMember.findOne({
                where: {
                    studentId,
                    ...(projectId ? { projectId: { [Op.ne]: projectId } } : {})
                },
                ...(projectInclude.length ? { include: projectInclude } : {}),
                transaction
            });

            if (existing) {
                throw new Error('นักศึกษาคนนี้มีโครงงานที่ยังไม่ถูกเก็บถาวรอยู่แล้ว');
            }
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
        ],
        hooks: {
            beforeCreate: async (member, options) => {
                await ProjectMember.ensureSingleActiveProject(member, options);
            },
            beforeBulkCreate: async (members, options) => {
                for (const member of members) {
                    await ProjectMember.ensureSingleActiveProject(member, options);
                }
            }
        }
    });

    return ProjectMember;
};
