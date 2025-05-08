const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class InternshipDocument extends Model {
    static associate(models) {
      InternshipDocument.belongsTo(models.Document, {
        foreignKey: "documentId",
        targetKey: "documentId",
        as: "document",
      });
      InternshipDocument.hasMany(models.InternshipLogbook, {
        foreignKey: "internshipId",
        as: "logbooks",
      });
      // เพิ่มความสัมพันธ์กับ Student (ถ้าจำเป็น)
      InternshipDocument.belongsTo(models.Student, {
        foreignKey: "studentId", // หรือฟิลด์ที่ถูกต้อง
        as: "student",
      });
    }
  }

  InternshipDocument.init(
    {
      internshipId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "internship_id",
      },
      documentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "document_id",
        references: {
          model: "Document",
          key: "document_id",
        },
      },
      companyName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "company_name",
      },
      companyAddress: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "company_address",
      },
      supervisorName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "supervisor_name",
      },
      supervisorPosition: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "supervisor_position",
      },
      supervisorPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: "supervisor_phone",
      },
      supervisorEmail: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "supervisor_email",
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "start_date",
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "end_date",
      },
    },
    {
      sequelize,
      modelName: "InternshipDocument",
      tableName: "internship_documents",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: "idx_internship_company",
          fields: ["company_name"],
        },
        {
          name: "idx_internship_date",
          fields: ["start_date", "end_date"],
        },
      ],
    }
  );

  return InternshipDocument;
};
