const { Model, DataTypes } = require('sequelize');

/**
 * Model: ProjectWorkflowState
 * 
 * Single Source of Truth สำหรับสถานะโครงงานพิเศษ
 * เก็บสถานะปัจจุบันและ snapshot ข้อมูลสำคัญ
 * เพื่อลด query complexity และ join หลายตาราง
 */
module.exports = (sequelize) => {
  class ProjectWorkflowState extends Model {
    static associate(models) {
      ProjectWorkflowState.belongsTo(models.ProjectDocument, {
        foreignKey: 'project_id',
        as: 'project',
        targetKey: 'projectId' // ใช้ attribute name ไม่ใช่ field name
      });
      
      ProjectWorkflowState.belongsTo(models.User, {
        foreignKey: 'last_updated_by',
        as: 'lastUpdatedByUser'
      });
      
      // Optional: เพิ่ม association ไปยัง defense requests
      ProjectWorkflowState.belongsTo(models.ProjectDefenseRequest, {
        foreignKey: 'topic_defense_request_id',
        as: 'topicDefenseRequest',
        constraints: false
      });
      
      ProjectWorkflowState.belongsTo(models.ProjectDefenseRequest, {
        foreignKey: 'thesis_defense_request_id',
        as: 'thesisDefenseRequest',
        constraints: false
      });
    }

    /**
     * Helper: ตรวจสอบว่าสามารถยื่นสอบหัวข้อได้หรือไม่
     */
    canSubmitTopicDefense() {
      return ['ADVISOR_ASSIGNED', 'TOPIC_SUBMISSION', 'TOPIC_FAILED'].includes(this.currentPhase);
    }

    /**
     * Helper: ตรวจสอบว่าสามารถยื่นสอบปริญญานิพนธ์ได้หรือไม่
     */
    canSubmitThesisDefense() {
      return ['IN_PROGRESS', 'THESIS_SUBMISSION'].includes(this.currentPhase);
    }

    /**
     * Helper: ตรวจสอบว่าเป็นขั้นตอนที่ต้องส่งเอกสารหรือไม่
     */
    isDocumentSubmissionPhase() {
      return ['TOPIC_SUBMISSION', 'THESIS_SUBMISSION'].includes(this.currentPhase);
    }

    /**
     * Helper: ตรวจสอบว่าโครงงานเสร็จสมบูรณ์หรือไม่
     */
    isComplete() {
      return ['COMPLETED', 'ARCHIVED'].includes(this.currentPhase);
    }

    /**
     * Helper: ตรวจสอบว่าโครงงานถูกบล็อกหรือไม่
     */
    isBlocked() {
      return this.is_blocked === true;
    }

    /**
     * Static: สร้าง state ใหม่สำหรับโครงงาน
     */
    static async createForProject(projectId, options = {}) {
      const { transaction, phase = 'DRAFT', userId } = options;
      
      return await this.create({
        projectId,
        currentPhase: phase,
        lastActivityAt: new Date(),
        lastActivityType: 'project_created',
        lastUpdatedBy: userId || null
      }, { transaction });
    }

    /**
     * Static: อัปเดตสถานะจากผลสอบ
     */
    static async updateFromExamResult(projectId, examType, result, options = {}) {
      const { transaction, userId, examDate } = options;
      const { ProjectDocument } = sequelize.models;
      
      const state = await this.findOne({ where: { projectId }, transaction });
      if (!state) return null;

      // Sync project_status จาก project_documents.status เพื่อป้องกัน NULL
      const project = await ProjectDocument.findByPk(projectId, {
        attributes: ['status'],
        transaction
      });

      const updates = {
        lastActivityAt: new Date(),
        lastActivityType: `${examType.toLowerCase()}_exam_recorded`,
        lastUpdatedBy: userId || null,
        projectStatus: project?.status || state.projectStatus || 'draft' // ป้องกัน NULL
      };

      if (examType === 'PROJECT1') {
        updates.topicExamResult = result;
        updates.topicExamDate = examDate || new Date();
        
        if (result === 'PASS') {
          updates.currentPhase = 'IN_PROGRESS';
          updates.isBlocked = false;
        } else if (result === 'FAIL') {
          updates.currentPhase = 'TOPIC_FAILED';
          updates.isBlocked = true;
          updates.blockReason = 'สอบหัวข้อไม่ผ่าน ต้องยื่นหัวข้อใหม่';
        }
      } else if (examType === 'THESIS') {
        updates.thesisExamResult = result;
        updates.thesisExamDate = examDate || new Date();
        
        if (result === 'PASS') {
          updates.currentPhase = 'COMPLETED';
          updates.isBlocked = false;
        } else if (result === 'FAIL') {
          updates.currentPhase = 'THESIS_FAILED';
          updates.isBlocked = true;
          updates.blockReason = 'สอบปริญญานิพนธ์ไม่ผ่าน';
        }
      }

      await state.update(updates, { transaction });
      return state;
    }

    /**
     * Static: อัปเดตสถานะจากการยื่นคำขอสอบ
     */
    static async updateFromDefenseRequest(projectId, defenseType, requestId, status, options = {}) {
      const { transaction, userId } = options;
      const { ProjectDocument } = sequelize.models;
      
      const state = await this.findOne({ where: { projectId }, transaction });
      if (!state) return null;

      // Sync project_status จาก project_documents.status เพื่อป้องกัน NULL
      const project = await ProjectDocument.findByPk(projectId, {
        attributes: ['status'],
        transaction
      });

      const updates = {
        lastActivityAt: new Date(),
        lastActivityType: `defense_request_${status}`,
        lastUpdatedBy: userId || null,
        projectStatus: project?.status || state.projectStatus || 'draft' // ป้องกัน NULL
      };

      if (defenseType === 'PROJECT1') {
        updates.topicDefenseRequestId = requestId;
        updates.topicDefenseStatus = status;
        
        if (status === 'submitted') {
          updates.currentPhase = 'TOPIC_EXAM_PENDING';
        } else if (status === 'scheduled') {
          updates.currentPhase = 'TOPIC_EXAM_SCHEDULED';
        }
      } else if (defenseType === 'THESIS') {
        updates.thesisDefenseRequestId = requestId;
        updates.thesisDefenseStatus = status;
        
        if (status === 'submitted') {
          updates.currentPhase = 'THESIS_EXAM_PENDING';
        } else if (status === 'scheduled') {
          updates.currentPhase = 'THESIS_EXAM_SCHEDULED';
        }
      }

      await state.update(updates, { transaction });
      return state;
    }

    /**
     * Static: อัปเดตการนับ meeting
     */
    static async updateMeetingCount(projectId, meetingCount, approvedCount, options = {}) {
      const { transaction, userId } = options;
      const { ProjectDocument } = sequelize.models;
      
      const state = await this.findOne({ where: { projectId }, transaction });
      if (!state) return null;

      // Sync project_status จาก project_documents.status เพื่อป้องกัน NULL
      const project = await ProjectDocument.findByPk(projectId, {
        attributes: ['status'],
        transaction
      });

      await state.update({
        meetingCount: meetingCount || 0,
        approvedMeetingCount: approvedCount || 0,
        lastActivityAt: new Date(),
        lastActivityType: 'meeting_updated',
        lastUpdatedBy: userId || null,
        projectStatus: project?.status || state.projectStatus || 'draft' // ป้องกัน NULL
      }, { transaction });

      return state;
    }
  }

  ProjectWorkflowState.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'project_id'
    },
    currentPhase: {
      type: DataTypes.ENUM(
        'DRAFT',
        'PENDING_ADVISOR',
        'ADVISOR_ASSIGNED',
        'TOPIC_SUBMISSION',
        'TOPIC_EXAM_PENDING',
        'TOPIC_EXAM_SCHEDULED',
        'TOPIC_FAILED',
        'IN_PROGRESS',
        'THESIS_SUBMISSION',
        'THESIS_EXAM_PENDING',
        'THESIS_EXAM_SCHEDULED',
        'THESIS_FAILED',
        'COMPLETED',
        'ARCHIVED',
        'CANCELLED'
      ),
      allowNull: false,
      defaultValue: 'DRAFT',
      field: 'current_phase'
    },
    currentStep: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'current_step'
    },
    projectStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'project_status'
    },
    topicExamResult: {
      type: DataTypes.ENUM('PENDING', 'PASS', 'FAIL'),
      allowNull: true,
      field: 'topic_exam_result'
    },
    topicExamDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'topic_exam_date'
    },
    thesisExamResult: {
      type: DataTypes.ENUM('PENDING', 'PASS', 'FAIL'),
      allowNull: true,
      field: 'thesis_exam_result'
    },
    thesisExamDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'thesis_exam_date'
    },
    topicDefenseRequestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'topic_defense_request_id'
    },
    topicDefenseStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'topic_defense_status'
    },
    thesisDefenseRequestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'thesis_defense_request_id'
    },
    thesisDefenseStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'thesis_defense_status'
    },
    systemTestRequestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'system_test_request_id'
    },
    systemTestStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'system_test_status'
    },
    finalDocumentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'final_document_id'
    },
    finalDocumentStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'final_document_status'
    },
    meetingCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'meeting_count'
    },
    approvedMeetingCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'approved_meeting_count'
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_blocked'
    },
    blockReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'block_reason'
    },
    isOverdue: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_overdue'
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_activity_at'
    },
    lastActivityType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'last_activity_type'
    },
    lastUpdatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'last_updated_by'
    }
  }, {
    sequelize,
    modelName: 'ProjectWorkflowState',
    tableName: 'project_workflow_states',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['current_phase'] },
      { fields: ['is_blocked'] },
      { fields: ['is_overdue'] },
      { fields: ['last_activity_at'] }
    ]
  });

  return ProjectWorkflowState;
};
