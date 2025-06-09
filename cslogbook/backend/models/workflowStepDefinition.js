// filepath: c:\Users\chinn\CSLog\cslogbook\backend\models\workflowStepDefinition.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class WorkflowStepDefinition extends Model {
    static associate(models) {
      // Define associations here if needed in the future
      // For example, if a step can have sub-steps or prerequisites defined in another table
    }
  }
  WorkflowStepDefinition.init({
    stepId: { // เพิ่ม stepId เป็น Primary Key
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'step_id'
    },
    workflowType: {
      type: DataTypes.ENUM('internship', 'project1', 'project2'), // ประเภทของ workflow
      allowNull: false,
      field: 'workflow_type'
    },
    stepKey: { // รหัสอ้างอิงเฉพาะของขั้นตอน (unique ภายใน workflowType)
      type: DataTypes.STRING,
      allowNull: false,
      field: 'step_key'
    },
    stepOrder: { // ลำดับของขั้นตอน
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'step_order'
    },
    title: { // ชื่อขั้นตอนที่แสดงผล
      type: DataTypes.STRING,
      allowNull: false
    },
    descriptionTemplate: { // คำอธิบาย (อาจมี placeholder)
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description_template'
    },
    // defaultStatusOnReach: { // สถานะเริ่มต้นเมื่อนักศึกษามาถึงขั้นตอนนี้ (อาจจะยังไม่ใช้ในตอนแรก)
    //   type: DataTypes.ENUM('pending', 'in_progress', 'requires_action'),
    //   allowNull: true, // หรือ false ถ้าต้องการให้มีเสมอ
    //   field: 'default_status_on_reach'
    // }
    // เพิ่ม createdAt และ updatedAt โดย Sequelize จะจัดการให้ถ้า timestamps: true
  }, {
    sequelize,
    modelName: 'WorkflowStepDefinition',
    tableName: 'workflow_step_definitions', // ชื่อตารางใน database
    timestamps: true, // ให้ Sequelize จัดการ createdAt และ updatedAt
    underscored: true, // ใช้ snake_case สำหรับชื่อฟิลด์ใน database โดยอัตโนมัติ
    indexes: [ // เพิ่ม index เพื่อประสิทธิภาพในการ query
      {
        unique: true,
        fields: ['workflow_type', 'step_key'] // ทำให้ step_key unique ภายในแต่ละ workflow_type
      },
      {
        fields: ['workflow_type', 'step_order']
      }
    ]
  });
  return WorkflowStepDefinition;
};