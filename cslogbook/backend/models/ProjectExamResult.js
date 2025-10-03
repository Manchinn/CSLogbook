const { Model, DataTypes } = require('sequelize');

/**
 * Model: ProjectExamResult
 * เก็บผลการสอบโครงงานพิเศษ (PROJECT1 และ THESIS)
 */
module.exports = (sequelize) => {
  class ProjectExamResult extends Model {
    static associate(models) {
      // ความสัมพันธ์กับ ProjectDocument
      ProjectExamResult.belongsTo(models.ProjectDocument, {
        foreignKey: 'project_id',
        as: 'project'
      });

      // ความสัมพันธ์กับ User (ผู้บันทึกผล)
      ProjectExamResult.belongsTo(models.User, {
        foreignKey: 'recorded_by_user_id',
        as: 'recordedBy'
      });
    }

    /**
     * ตรวจสอบว่าโครงงานนี้มีผลสอบแล้วหรือยัง
     */
    static async hasExamResult(projectId, examType) {
      const result = await this.findOne({
        where: { project_id: projectId, exam_type: examType }
      });
      return !!result;
    }

    /**
     * ดึงผลสอบของโครงงาน
     */
    static async getExamResult(projectId, examType) {
      return await this.findOne({
        where: { project_id: projectId, exam_type: examType },
        include: [
          {
            model: sequelize.models.User,
            as: 'recordedBy',
            attributes: ['userId', 'firstName', 'lastName', 'role']
          }
        ]
      });
    }

    /**
     * ตรวจสอบว่านักศึกษารับทราบผลแล้วหรือยัง (กรณีไม่ผ่าน)
     */
    isAcknowledged() {
      return this.result === 'FAIL' && this.student_acknowledged_at !== null;
    }

    /**
     * นักศึกษารับทราบผล
     */
    async acknowledge() {
      if (this.result !== 'FAIL') {
        throw new Error('สามารถรับทราบได้เฉพาะกรณีสอบไม่ผ่านเท่านั้น');
      }
      if (this.student_acknowledged_at) {
        throw new Error('รับทราบผลแล้ว');
      }
      this.student_acknowledged_at = new Date();
      await this.save();
      return this;
    }
  }

  ProjectExamResult.init({
    examResultId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'exam_result_id'
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'project_id'
    },
    examType: {
      type: DataTypes.ENUM('PROJECT1', 'THESIS'),
      allowNull: false,
      field: 'exam_type',
      comment: 'ประเภทการสอบ: โครงงานพิเศษ 1 หรือ ปริญญานิพนธ์'
    },
    result: {
      type: DataTypes.ENUM('PASS', 'FAIL'),
      allowNull: false,
      comment: 'ผลการสอบ: ผ่าน หรือ ไม่ผ่าน'
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'คะแนนที่ได้ (ถ้ามี)'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'หมายเหตุ/ข้อเสนอแนะจากคณะกรรมการ'
    },
    requireScopeRevision: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'require_scope_revision',
      comment: 'ต้องแก้ไข Scope หรือไม่ (กรณีผ่าน)'
    },
    recordedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'recorded_by_user_id',
      comment: 'ผู้บันทึกผล (เจ้าหน้าที่/กรรมการ)'
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'recorded_at',
      comment: 'เวลาที่บันทึกผล'
    },
    studentAcknowledgedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'student_acknowledged_at',
      comment: 'เวลาที่นักศึกษารับทราบผล (กรณีไม่ผ่าน)'
    }
  }, {
    sequelize,
    modelName: 'ProjectExamResult',
    tableName: 'project_exam_results',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return ProjectExamResult;
};
