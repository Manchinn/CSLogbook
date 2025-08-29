const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ImportantDeadline extends Model {
        static associate(models) {
            // ความสัมพันธ์กับโมเดลอื่น (ถ้ามี)
        }
    }

    ImportantDeadline.init({
        // ใช้คอลัมน์ 'id' เป็น primary key (สอดคล้องกับโครงสร้างจริงที่พบ ขณะนี้ไม่พบคอลัมน์ important_deadline_id ใน DB)
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        // relatedTo: รวมความหมายของ relatedWorkflow เดิม + tag กว้าง (migration 20250829120000)
        // เพิ่มค่า project1, project2 เพื่อแยกชัดเจนจาก project รุ่นเดิม (project ยังคงไว้เพื่อ backward compatibility / down migration)
        relatedTo: {
            type: DataTypes.ENUM('internship', 'project', 'project1', 'project2', 'general'),
            allowNull: false,
            field: 'related_to'
        },
        academicYear: {
            type: DataTypes.STRING(10),
            allowNull: false,
            field: 'academic_year'
        },
        semester: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        isGlobal: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_global'
        },
        // ใหม่: deadline ที่มีเวลา (UTC)
        deadlineAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'deadline_at'
        },
        timezone: {
            type: DataTypes.STRING(64),
            allowNull: false,
            defaultValue: 'Asia/Bangkok'
        },
        // ฟิลด์ใหม่สำหรับระบบแจ้งเตือนและ policy
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        isCritical: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_critical'
        },
        notified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        criticalNotified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'critical_notified'
        },
        acceptingSubmissions: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'accepting_submissions'
        },
        allowLate: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            field: 'allow_late'
        },
        lockAfterDeadline: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'lock_after_deadline'
        },
        gracePeriodMinutes: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'grace_period_minutes'
        },
        // ช่วงเวลา (optional) สำหรับ event หลายวัน เช่น ช่วงสอบ
        windowStartAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'window_start_at'
        },
        windowEndAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'window_end_at'
        },
        allDay: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'all_day'
        },
        // ---------------- ฟิลด์ใหม่ (Phase 1 schema extension) ----------------
        // ประเภทของ deadline: ส่งเอกสาร / ประกาศ / กิจกรรม manual / milestone
        deadlineType: {
            type: DataTypes.ENUM('SUBMISSION','ANNOUNCEMENT','MANUAL','MILESTONE'),
            allowNull: false,
            defaultValue: 'SUBMISSION',
            field: 'deadline_type'
        },
        // สถานะการเผยแพร่ (student จะเห็นเฉพาะที่ publish ใน phase ถัดไป)
        isPublished: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_published'
        },
        publishAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'publish_at'
        },
        visibilityScope: {
            type: DataTypes.ENUM('ALL','INTERNSHIP_ONLY','PROJECT_ONLY','CUSTOM'),
            allowNull: false,
            defaultValue: 'ALL',
            field: 'visibility_scope'
        },
    // relatedWorkflow ถูกลบและ merge เข้า relatedTo (ดู migration 20250829120000) คง comment ไว้เป็นเอกสาร
    // relatedWorkflow: { removed }
    }, {
        sequelize,
        modelName: 'ImportantDeadline',
        tableName: 'important_deadlines',
        timestamps: true,
        underscored: true
    });

    // หมายเหตุ: หากภายหลังมีการเปลี่ยน schema ให้กลับไปใช้ important_deadline_id จะต้องแก้ model นี้อีกครั้ง

    return ImportantDeadline;
};