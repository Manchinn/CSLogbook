const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ProjectTestRequest extends Model {
    static associate(models) {
      ProjectTestRequest.belongsTo(models.ProjectDocument, {
        foreignKey: 'project_id',
        as: 'project'
      });
      ProjectTestRequest.belongsTo(models.Student, {
        foreignKey: 'submitted_by_student_id',
        as: 'submittedBy'
      });
      ProjectTestRequest.belongsTo(models.Teacher, {
        foreignKey: 'advisor_teacher_id',
        as: 'advisor'
      });
      ProjectTestRequest.belongsTo(models.User, {
        foreignKey: 'staff_user_id',
        as: 'staffUser'
      });
    }
  }

  ProjectTestRequest.init({
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
    submittedByStudentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'submitted_by_student_id'
    },
    status: {
      type: DataTypes.ENUM('pending_advisor', 'advisor_rejected', 'pending_staff', 'staff_rejected', 'staff_approved'),
      allowNull: false,
      defaultValue: 'pending_advisor'
    },
    requestFilePath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'request_file_path'
    },
    requestFileName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'request_file_name'
    },
    studentNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'student_note'
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'submitted_at'
    },
    testStartDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'test_start_date'
    },
    testDueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'test_due_date'
    },
    advisorTeacherId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'advisor_teacher_id'
    },
    advisorDecisionNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'advisor_decision_note'
    },
    advisorDecidedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'advisor_decided_at'
    },
    staffUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'staff_user_id'
    },
    staffDecisionNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'staff_decision_note'
    },
    staffDecidedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'staff_decided_at'
    },
    evidenceFilePath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'evidence_file_path'
    },
    evidenceFileName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'evidence_file_name'
    },
    evidenceSubmittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'evidence_submitted_at'
    }
  }, {
    sequelize,
    modelName: 'ProjectTestRequest',
    tableName: 'project_test_requests',
    underscored: true,
    timestamps: true
  });

  return ProjectTestRequest;
};
