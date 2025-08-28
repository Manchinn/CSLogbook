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
        relatedTo: {
            type: DataTypes.ENUM('internship', 'project', 'general'),
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
        }
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