const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ProjectDefenseRequest extends Model {
    static associate(models) {
      ProjectDefenseRequest.belongsTo(models.ProjectDocument, {
        foreignKey: 'project_id',
        as: 'project'
      });
      ProjectDefenseRequest.belongsTo(models.Student, {
        foreignKey: 'submitted_by_student_id',
        as: 'submittedBy'
      });
      ProjectDefenseRequest.belongsTo(models.User, {
        foreignKey: 'scheduled_by_user_id',
        as: 'scheduledBy'
      });
      ProjectDefenseRequest.belongsTo(models.User, {
        foreignKey: 'staff_verified_by_user_id',
        as: 'staffVerifiedBy'
      });
      ProjectDefenseRequest.hasMany(models.ProjectDefenseRequestAdvisorApproval, {
        foreignKey: 'request_id',
        as: 'advisorApprovals'
      });
      // 🆕 Association with ImportantDeadline for late tracking
      ProjectDefenseRequest.belongsTo(models.ImportantDeadline, {
        foreignKey: 'important_deadline_id',
        as: 'deadline'
      });
    }
  }

  ProjectDefenseRequest.init({
    requestId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'request_id'
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'project_id'
    },
    defenseType: {
      type: DataTypes.ENUM('PROJECT1', 'THESIS'),
      allowNull: false,
      defaultValue: 'PROJECT1',
      field: 'defense_type'
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'advisor_in_review', 'advisor_approved', 'staff_verified', 'scheduled', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'submitted'
    },
    formPayload: {
      type: DataTypes.JSON,
      allowNull: false,
      field: 'form_payload'
    },
    submittedByStudentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'submitted_by_student_id'
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'submitted_at'
    },
    advisorApprovedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'advisor_approved_at'
    },
    defenseScheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'defense_scheduled_at'
    },
    defenseLocation: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'defense_location'
    },
    defenseNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'defense_note'
    },
    scheduledByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'scheduled_by_user_id'
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_at'
    },
    staffVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'staff_verified_at'
    },
    staffVerifiedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'staff_verified_by_user_id'
    },
    staffVerificationNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'staff_verification_note'
    },
    // 🆕 Google Classroom-style late tracking
    submittedLate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'submitted_late',
      comment: 'ส่งคำร้องหลังเวลากำหนดหรือไม่ (Google Classroom style)'
    },
    submissionDelayMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: 'submission_delay_minutes',
      comment: 'จำนวนนาทีที่ส่งช้า (null = ส่งทันหรือไม่ได้ track)'
    },
    importantDeadlineId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: 'important_deadline_id',
      comment: 'เชื่อมโยงกับ deadline ที่ใช้ตรวจสอบ'
    }
  }, {
    sequelize,
    modelName: 'ProjectDefenseRequest',
    tableName: 'project_defense_requests',
    underscored: true,
    timestamps: true
  });

  return ProjectDefenseRequest;
};
