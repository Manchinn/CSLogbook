const { Model, DataTypes } = require('sequelize');

/**
 * StudentDeadlineStatus
 *
 * ตาราง student_deadline_statuses เก็บ 2 ความหมาย:
 *   1) Submission tracking (status / completed_at / completed_by / note) — เดิม
 *   2) Per-student deadline override (Phase 1 ใหม่):
 *        - extended_until : extend effective deadline สำหรับนักศึกษารายนี้
 *        - bypass_lock    : ข้าม lockAfterDeadline แต่ยังคำนวณ late
 *        - granted_at / granted_by / reason / revoked_at
 *
 * UNIQUE (student_id, important_deadline_id) — หนึ่งแถวต่อคู่
 */
module.exports = (sequelize) => {
  class StudentDeadlineStatus extends Model {
    static associate(models) {
      if (models.ImportantDeadline) {
        StudentDeadlineStatus.belongsTo(models.ImportantDeadline, {
          foreignKey: 'important_deadline_id',
          as: 'deadline'
        });
      }
      if (models.Student) {
        StudentDeadlineStatus.belongsTo(models.Student, {
          foreignKey: 'student_id',
          targetKey: 'studentId',
          as: 'student'
        });
      }
      if (models.User) {
        StudentDeadlineStatus.belongsTo(models.User, {
          foreignKey: 'granted_by',
          as: 'grantedByUser'
        });
        StudentDeadlineStatus.belongsTo(models.User, {
          foreignKey: 'completed_by',
          as: 'completedByUser'
        });
      }
    }

    /**
     * คืน true เมื่อแถวนี้มี active override ที่ยังไม่ถูก revoke
     */
    hasActiveOverride() {
      if (!this.grantedAt) return false;
      if (this.revokedAt) return false;
      return Boolean(this.extendedUntil) || Boolean(this.bypassLock);
    }
  }

  StudentDeadlineStatus.init({
    studentDeadlineStatusId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'student_deadline_status_id'
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'student_id'
    },
    importantDeadlineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'important_deadline_id'
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'exempt', 'late'),
      allowNull: false,
      defaultValue: 'pending'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    },
    completedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'completed_by'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // ---- Override fields (Phase 1) ----
    extendedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'extended_until'
    },
    bypassLock: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'bypass_lock'
    },
    grantedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'granted_by'
    },
    grantedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'granted_at'
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'StudentDeadlineStatus',
    tableName: 'student_deadline_statuses',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return StudentDeadlineStatus;
};
