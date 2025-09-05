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
  };

  return InternshipCertificateRequest;
};