const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Academic extends Model {
    static associate(models) {
      // เพิ่มความสัมพันธ์กับโมเดล Curriculum
      Academic.belongsTo(models.Curriculum, {
        foreignKey: 'active_curriculum_id',
        as: 'activeCurriculum'
      });
    }
  }

  Academic.init(
    {
      academicYear: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "academic_year", // ปีการศึกษา
      },
      currentSemester: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "current_semester", // ภาคเรียนปัจจุบัน
      },
      activeCurriculumId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "active_curriculum_id", // รหัสหลักสูตรที่ใช้งานอยู่
        references: {
          model: 'curriculums',
          key: 'curriculum_id'
        }
      },
      semester1Range: {
        type: DataTypes.JSON,
        allowNull: true,
        field: "semester1_range", // ช่วงเวลาภาคเรียนที่ 1 (JSON: {start, end})
      },
      semester2Range: {
        type: DataTypes.JSON,
        allowNull: true,
        field: "semester2_range", // ช่วงเวลาภาคเรียนที่ 2 (JSON: {start, end})
      },
      semester3Range: {
        type: DataTypes.JSON,
        allowNull: true,
        field: "semester3_range", // ช่วงเวลาภาคฤดูร้อน (JSON: {start, end})
      },
      internshipRegistration: {
        type: DataTypes.JSON,
        allowNull: true,
        field: "internship_registration", // ช่วงเวลาลงทะเบียนฝึกงาน (JSON: {startDate, endDate})
      },
      projectRegistration: {
        type: DataTypes.JSON,
        allowNull: true,
        field: "project_registration", // ช่วงเวลาลงทะเบียนโครงงาน (JSON: {startDate, endDate})
      },
      internshipSemesters: {
        type: DataTypes.JSON, // เปลี่ยนจาก ARRAY เป็น JSON
        allowNull: true,
        field: "internship_semesters", // ภาคเรียนที่เปิดให้ลงทะเบียนฝึกงาน
      },
      projectSemesters: {
        type: DataTypes.JSON, // เปลี่ยนจาก ARRAY เป็น JSON
        allowNull: true,
        field: "project_semesters", // ภาคเรียนที่เปิดให้ลงทะเบียนโครงงาน
      },
    },
    {
      sequelize,
      modelName: "Academic",
      tableName: "academics",
      timestamps: true,
      underscored: true,
    }
  );

  return Academic;
};