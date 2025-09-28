'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class StudentWorkflowActivity extends Model {
    static associate(models) {
      // สร้างความสัมพันธ์กับ Student
      StudentWorkflowActivity.belongsTo(models.Student, {
        foreignKey: 'student_id',
        as: 'student'
      });

      // สร้างความสัมพันธ์กับ WorkflowStepDefinition โดยใช้ workflow_type และ current_step_key
      // นี่เป็น "virtual" relationship ที่ไม่ได้เชื่อมผ่าน foreign key โดยตรง
      // แต่จะใช้ในการ query ข้อมูลในภายหลัง
    }

    // Helper method เพื่อหา step definition ปัจจุบัน (ไม่ผ่าน foreign key)
    async getCurrentStepDefinition() {
      try {
        const { WorkflowStepDefinition } = sequelize.models;
        return await WorkflowStepDefinition.findOne({
          where: {
            workflow_type: this.workflowType,
            step_key: this.currentStepKey
          }
        });
      } catch (error) {
        console.error('Error in getCurrentStepDefinition:', error);
        return null;
      }
    }
  }
  
  StudentWorkflowActivity.init({
    activityId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'activity_id'
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'student_id',
      references: {
        model: 'students', // ชื่อตารางในฐานข้อมูล
        key: 'student_id'
      }
    },
    workflowType: {
      type: DataTypes.ENUM('internship', 'project1', 'project2'),
      allowNull: false,
      field: 'workflow_type'
    },
    currentStepKey: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'current_step_key'
    },
    currentStepStatus: {
      type: DataTypes.ENUM(
        'pending',
        'in_progress',
        'awaiting_student_action',
        'awaiting_admin_action',
        'completed',
        'rejected',
        'skipped',
        'blocked'
      ),
      allowNull: false,
      defaultValue: 'pending',
      field: 'current_step_status'
    },
    overallWorkflowStatus: {
      type: DataTypes.ENUM(
        'not_started',
        'eligible',
        'enrolled',
        'in_progress',
        'completed',
        'blocked',
        'failed',
        'archived'
      ),
      allowNull: false,
      defaultValue: 'not_started',
      field: 'overall_workflow_status'
    },
    dataPayload: {
      type: DataTypes.JSON, // เก็บข้อมูลเพิ่มเติมในรูปแบบ JSON
      allowNull: true,
      field: 'data_payload'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'started_at'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    }
  }, {
    sequelize,
    modelName: 'StudentWorkflowActivity',
    tableName: 'student_workflow_activities',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['student_id']
      },
      {
        fields: ['workflow_type']
      },
      {
        unique: true,
        fields: ['student_id', 'workflow_type']
      },
      {
        fields: ['current_step_key']
      }
    ]
  });
  
  return StudentWorkflowActivity;
};