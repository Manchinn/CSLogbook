const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ProjectArtifact extends Model {
    static associate(models) {
      ProjectArtifact.belongsTo(models.ProjectDocument, {
        foreignKey: 'project_id',
        as: 'project'
      });
      ProjectArtifact.belongsTo(models.Student, {
        foreignKey: 'uploaded_by_student_id',
        as: 'uploader'
      });
    }
  }

  ProjectArtifact.init({
    artifactId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'artifact_id'
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'project_id'
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'file_path'
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'original_name'
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'mime_type'
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    uploadedByStudentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'uploaded_by_student_id'
    },
    checksum: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'uploaded_at'
    }
  }, {
    sequelize,
    modelName: 'ProjectArtifact',
    tableName: 'project_artifacts',
    underscored: true,
    timestamps: true
  });

  return ProjectArtifact;
};
