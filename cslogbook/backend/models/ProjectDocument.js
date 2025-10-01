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
            // หลาย track ต่อ project
            ProjectDocument.hasMany(models.ProjectTrack, {
                foreignKey: 'project_id',
                as: 'tracks'
            });
            ProjectDocument.hasMany(models.ProjectDefenseRequest, {
                foreignKey: 'project_id',
                as: 'defenseRequests'
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
        // track (เดิม) ถูกแทนที่ด้วยตาราง project_tracks (multi-track). คอลัมน์นี้คงไว้ชั่วคราวกรณียังมีข้อมูลเก่า
        track: {
            type: DataTypes.STRING(100),
            allowNull: true
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
        // ฟิลด์รายละเอียดแบบฟอร์มเสนอหัวข้อ (คพ.01)
        objective: { // วัตถุประสงค์
            type: DataTypes.TEXT,
            allowNull: true
        },
        background: { // ที่มา/ปัญหา/เหตุผล
            type: DataTypes.TEXT,
            allowNull: true
        },
        scope: { // ขอบเขตงาน
            type: DataTypes.TEXT,
            allowNull: true
        },
        expectedOutcome: { // ผลลัพธ์ที่คาดหวัง
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'expected_outcome'
        },
        benefit: { // ประโยชน์ที่จะได้รับ
            type: DataTypes.TEXT,
            allowNull: true
        },
        methodology: { // วิธีดำเนินการ/กระบวนการพัฒนา
            type: DataTypes.TEXT,
            allowNull: true
        },
        tools: { // เครื่องมือ เทคโนโลยี ภาษาที่ใช้
            type: DataTypes.TEXT,
            allowNull: true
        },
        timelineNote: { // สรุปแผนดำเนินงาน/กำหนดการย่อ (อาจจะระบุเป็นช่วงเวลา)
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'timeline_note'
        },
        risk: { // ความเสี่ยง/ข้อจำกัดที่อาจเจอ
            type: DataTypes.TEXT,
            allowNull: true
        },
        constraints: { // ข้อจำกัดอื่น ๆ / เงื่อนไขเฉพาะ
            type: DataTypes.TEXT,
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
        },
        // ผลสอบหัวข้อ
        examResult: {
            type: DataTypes.ENUM('passed','failed'),
            allowNull: true,
            field: 'exam_result'
        },
        examFailReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: 'exam_fail_reason'
        },
        examResultAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'exam_result_at'
        },
        studentAcknowledgedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'student_acknowledged_at'
        }
    }, {
        sequelize,
        modelName: 'ProjectDocument',
        tableName: 'project_documents',
        timestamps: true,
        underscored: true,
        defaultScope: {
            attributes: { exclude: ['student_id'] } // กันกรณี Sequelize แทรก field phantom จาก association เก่า
        },
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
