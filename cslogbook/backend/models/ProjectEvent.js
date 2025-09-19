const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ProjectEvent extends Model {
    static associate(models) {
      ProjectEvent.belongsTo(models.ProjectDocument, {
        foreignKey: 'project_id',
        as: 'project'
      });
    }
  }

  ProjectEvent.init({
    eventId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'event_id'
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'project_id'
    },
    eventType: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: 'event_type'
    },
    actorRole: {
      type: DataTypes.STRING(40),
      allowNull: true,
      field: 'actor_role'
    },
    actorUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'actor_user_id'
    },
    metaJson: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'meta_json'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'ProjectEvent',
    tableName: 'project_events',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return ProjectEvent;
};
