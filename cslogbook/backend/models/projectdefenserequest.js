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
      type: DataTypes.ENUM('draft', 'submitted', 'cancelled'),
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
