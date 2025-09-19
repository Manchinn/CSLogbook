const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ProjectMilestone extends Model {
    static associate(models) {
      ProjectMilestone.belongsTo(models.ProjectDocument, {
        foreignKey: 'project_id',
        as: 'project'
      });
    }
  }

  ProjectMilestone.init({
    milestoneId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'milestone_id'
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'project_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'due_date'
    },
    progress: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('pending','submitted','accepted','rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'submitted_at'
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at'
    }
  }, {
    sequelize,
    modelName: 'ProjectMilestone',
    tableName: 'project_milestones',
    underscored: true,
    timestamps: true
  });

  return ProjectMilestone;
};
