const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PasswordResetToken extends Model {
    static associate(models) {
      // ความสัมพันธ์กับ User
      PasswordResetToken.belongsTo(models.User, {
        foreignKey: 'user_id',
        targetKey: 'userId',
        as: 'user'
      });
    }
  }

  PasswordResetToken.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    purpose: {
      type: DataTypes.ENUM('PASSWORD_CHANGE'),
      allowNull: false,
      defaultValue: 'PASSWORD_CHANGE'
    },
    otpHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'otp_hash'
    },
    // เก็บ hash ของรหัสผ่านใหม่ชั่วคราว ระหว่างขั้นตอน init (ยังไม่ยืนยัน OTP)
    tempNewPasswordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'temp_new_password_hash'
    },
    attemptCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'attempt_count'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'used_at'
    }
  }, {
    sequelize,
    modelName: 'PasswordResetToken',
    tableName: 'password_reset_tokens',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['user_id', 'purpose', 'expires_at'] },
      { fields: ['expires_at'] }
    ]
  });

  return PasswordResetToken;
};
