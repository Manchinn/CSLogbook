const bcrypt = require('bcrypt');
const pool = require('../config/database'); // ตรวจสอบ path

const updatePassword = async (username, plainPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    await pool.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, username]
    );
    console.log(`Password for ${username} updated successfully.`);
  } catch (error) {
    console.error('Error updating password:', error.message);
  }
};

updatePassword('admin1', 'new_secure_password'); // ตัวอย่างอัปเดต admin1
