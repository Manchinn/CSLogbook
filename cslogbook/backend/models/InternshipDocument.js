const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class InternshipDocument extends Model {
    static associate(models) {
      InternshipDocument.belongsTo(models.Document, {
        foreignKey: "document_id",
        targetKey: "documentId",
        as: "document",
      });
      InternshipDocument.hasMany(models.InternshipLogbook, {
        foreignKey: "internship_id",
        as: "logbooks",
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
      internshipPosition: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "internship_position",
      },
      contactPersonName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "contact_person_name",
      },
      contactPersonPosition: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "contact_person_position",
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
      // snapshot ปีการศึกษา (พ.ศ.) ณ เวลาสร้าง/ยื่นเอกสาร CS05
      academicYear: {
        type: DataTypes.INTEGER,
        allowNull: true, // จะ backfill แล้วค่อยพิจารณาเปลี่ยนเป็น false
        field: 'academic_year',
        comment: 'ปีการศึกษา (พ.ศ.) snapshot ของเอกสารฝึกงาน'
      },
      // snapshot ภาคเรียน (1,2,3) ณ เวลาสร้าง/ยื่น
      semester: {
        type: DataTypes.TINYINT,
        allowNull: true,
        field: 'semester',
        comment: 'ภาคเรียน (1,2,3) snapshot ของเอกสารฝึกงาน'
      }
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
        {
          name: 'idx_internship_period_company',
          fields: ['academic_year', 'semester', 'company_name']
        }
      ],
    }
  );

  return InternshipDocument;
};
