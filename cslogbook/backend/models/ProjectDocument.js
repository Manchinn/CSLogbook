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
            allowNull: true, // อนุญาตว่างตอน draft แล้วให้บังคับในขั้น promote
            field: 'project_name_th'
        },
        projectNameEn: {
            type: DataTypes.STRING(255),
            allowNull: true,
            field: 'project_name_en'
        },
        projectType: {
            type: DataTypes.ENUM('govern', 'private', 'research'),
            allowNull: true, // ทำ optional ใน draft
            field: 'project_type'
        },
        track: {
            type: DataTypes.STRING(100),
            allowNull: true // optional at draft
        },
        advisorId: {
            type: DataTypes.INTEGER,
            allowNull: true, // ตั้งทีหลังได้ (Phase2 quick advisor assign) -> promote ต้องไม่ null
            field: 'advisor_id'
        },
        coAdvisorId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'co_advisor_id'
        },
        // Lifecycle fields ที่เพิ่มใน migration
        status: {
            type: DataTypes.ENUM('draft','advisor_assigned','in_progress','completed','archived'),
            allowNull: false,
            defaultValue: 'draft'
        },
        academicYear: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'academic_year'
        },
        semester: {
            type: DataTypes.TINYINT,
            allowNull: true
        },
        createdByStudentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'created_by_student_id'
        },
        projectCode: {
            type: DataTypes.STRING(30),
            allowNull: true,
            unique: true,
            field: 'project_code'
        },
        archivedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'archived_at'
        }
    }, {
        sequelize,
        modelName: 'ProjectDocument',
        tableName: 'project_documents',
        timestamps: true,
        underscored: true,
        indexes: [
            { name: 'idx_project_name', fields: ['project_name_th'] },
            { name: 'idx_project_type', fields: ['project_type'] },
            { name: 'idx_project_code_unique', unique: true, fields: ['project_code'] }
        ],
        hooks: {
            // สร้าง project_code อัตโนมัติถ้าไม่มี (ฟอร์แมต: PRJ<ปี><รหัสภายใน 6 หลัก>)
            async beforeCreate(instance) {
                if (!instance.projectCode) {
                    const year = (new Date().getFullYear() + 543).toString();
                    // ดึงค่า max id ปัจจุบัน (ไม่ perfect racing แต่เพียงพอเบื้องต้น; ถ้าต้องเป๊ะใช้ sequence แยก)
                    const maxIdRow = await sequelize.models.ProjectDocument.findOne({
                        attributes: [[sequelize.fn('MAX', sequelize.col('project_id')), 'maxId']],
                        raw: true
                    });
                    const next = (parseInt(maxIdRow?.maxId || 0, 10) + 1).toString().padStart(4, '0');
                    instance.projectCode = `PRJ${year}-${next}`; // เช่น PRJ2568-0007
                }
            }
        }
    });

    return ProjectDocument;
};
