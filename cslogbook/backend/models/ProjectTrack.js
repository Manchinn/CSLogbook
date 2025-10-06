const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ProjectTrack extends Model {
    static associate(models) {
      ProjectTrack.belongsTo(models.ProjectDocument, {
        foreignKey: 'project_id',
        as: 'project'
      });
    }
  }

  ProjectTrack.init({
    projectTrackId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'project_track_id'
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'project_id'
    },
    trackCode: {
      type: DataTypes.ENUM('NETSEC','WEBMOBILE','SMART','AI','GAMEMEDIA'),
      allowNull: false,
      field: 'track_code'
    }
  }, {
    sequelize,
    modelName: 'ProjectTrack',
    tableName: 'project_tracks',
    timestamps: true,
    underscored: true
  });

  return ProjectTrack;
};
