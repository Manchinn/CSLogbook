'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InternshipLogbookReflection extends Model {
    static associate(models) {
      // สร้างความสัมพันธ์กับ Student
      this.belongsTo(models.Student, {
        foreignKey: 'student_id',
        as: 'student'
      });
      
      // สร้างความสัมพันธ์กับ InternshipDocument
      this.belongsTo(models.InternshipDocument, {
        foreignKey: 'internship_id',
        as: 'internship'
      });
    }
  }
  
  InternshipLogbookReflection.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    internship_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    learning_outcome: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    key_learnings: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    future_application: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    improvements: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'InternshipLogbookReflection',
    tableName: 'internship_logbook_reflections',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return InternshipLogbookReflection;
};
