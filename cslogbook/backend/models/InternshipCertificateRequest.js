const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const InternshipCertificateRequest = sequelize.define('InternshipCertificateRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    studentId: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'รหัสนักศึกษา',
    },
    internshipId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'รหัสการฝึกงาน',
    },
    documentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'รหัสเอกสาร CS05',
    },
    requestDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'วันที่ขอหนังสือรับรอง',
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
      comment: 'สถานะคำขอ',
    },
    totalHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: 'จำนวนชั่วโมงฝึกงานทั้งหมด',
    },
    evaluationStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'สถานะการประเมินจากพี่เลี้ยง',
    },
    summaryStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'สถานะการส่งรายงานสรุปผล',
    },
    requestedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ผู้ขอหนังสือรับรอง (userId)',
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'วันที่ดำเนินการโดยเจ้าหน้าที่',
    },
    processedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'เจ้าหน้าที่ที่ดำเนินการ (userId)',
    },
    certificateNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'หมายเลขหนังสือรับรอง',
    },
    downloadedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'วันที่ดาวน์โหลดครั้งแรก',
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'จำนวนครั้งที่ดาวน์โหลด',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'หมายเหตุเพิ่มเติม',
    },
    signatoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'signatory_id',
      comment: 'รหัสผู้ลงนาม',
    },
    signatoryNameSnapshot: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: 'signatory_name_snapshot',
      comment: 'ชื่อผู้ลงนาม ณ เวลาที่อนุมัติ',
    },
    signatoryTitleSnapshot: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: 'signatory_title_snapshot',
      comment: 'ตำแหน่งผู้ลงนาม ณ เวลาที่อนุมัติ',
    },
    signatorySignatureSnapshot: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'signatory_signature_snapshot',
      comment: 'URL ลายเซ็น ณ เวลาที่อนุมัติ',
    },
  }, {
    tableName: 'internship_certificate_requests',
    timestamps: true,
    underscored: true,
  });

  // Associations
  InternshipCertificateRequest.associate = function(models) {
    InternshipCertificateRequest.belongsTo(models.Student, {
      foreignKey: 'studentId',
      targetKey: 'studentId',
      as: 'student',
    });

    InternshipCertificateRequest.belongsTo(models.Document, {
      foreignKey: 'documentId',
      as: 'document',
    });

    InternshipCertificateRequest.belongsTo(models.InternshipDocument, {
      foreignKey: 'internshipId',
      targetKey: 'internshipId',
      as: 'internship',
    });

    InternshipCertificateRequest.belongsTo(models.Signatory, {
      foreignKey: 'signatoryId',
      as: 'signatory',
    });
  };

  return InternshipCertificateRequest;
};