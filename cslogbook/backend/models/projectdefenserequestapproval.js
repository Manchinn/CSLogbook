const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ProjectDefenseRequestAdvisorApproval extends Model {
    static associate(models) {
      ProjectDefenseRequestAdvisorApproval.belongsTo(models.ProjectDefenseRequest, {
        foreignKey: 'request_id',
        as: 'request'
      });

      ProjectDefenseRequestAdvisorApproval.belongsTo(models.Teacher, {
        foreignKey: 'teacher_id',
        as: 'teacher'
      });
    }
  }

  ProjectDefenseRequestAdvisorApproval.init({
    approvalId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'approval_id'
    },
    requestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'request_id'
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'teacher_id'
    },
    teacherRole: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'teacher_role'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      field: 'approved_at'
    }
  }, {
    sequelize,
    modelName: 'ProjectDefenseRequestAdvisorApproval',
    tableName: 'project_defense_request_approvals',
    underscored: true,
    timestamps: true
  });

  return ProjectDefenseRequestAdvisorApproval;
};
