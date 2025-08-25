// Migration: add temp_new_password_hash column to password_reset_tokens สำหรับ two-step password change
// ใช้เก็บ hash ของรหัสผ่านใหม่ชั่วคราวระหว่างรอยืนยัน OTP

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('password_reset_tokens', 'temp_new_password_hash', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'otp_hash' // สำหรับ MySQL ให้คอลัมน์ไปอยู่ถัดจาก otp_hash (ถ้า DB รองรับ)
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('password_reset_tokens', 'temp_new_password_hash');
  }
};
