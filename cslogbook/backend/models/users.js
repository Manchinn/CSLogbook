const pool = require('../config/database');

class User {
  static async findByUsername(username) {
    const [rows] = await pool.execute(`
        SELECT u.*, s.isEligibleForInternship, s.isEligibleForProject 
        FROM users u
        LEFT JOIN student_data s ON u.studentID = s.studentID
        WHERE u.username = ?
      `, [username]);
  }

  static async findById(studentID) {
    const [rows] = await pool.execute(
      'SELECT users.*, student_eligibility.isEligibleForInternship, student_eligibility.isEligibleForProject FROM users LEFT JOIN student_eligibility ON users.studentID = student_eligibility.studentID WHERE users.studentID = ?',
      [studentID]
    );
    return rows[0];
  }

  static async create(userData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [userResult] = await connection.execute(
        'INSERT INTO users (username, password, studentID, firstName, lastName, email, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userData.username, userData.password, userData.studentID, userData.firstName, userData.lastName, userData.email, userData.role]
      );

      if (userData.role === 'student') {
        await connection.execute(
          'INSERT INTO student_eligibility (studentID, isEligibleForInternship, isEligibleForProject) VALUES (?, ?, ?)',
          [userData.studentID, userData.isEligibleForInternship || false, userData.isEligibleForProject || false]
        );
      }

      await connection.commit();
      return userResult.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async updateLoginNotification(username) {
    await pool.execute(
      'UPDATE users SET lastLoginNotification = CURRENT_TIMESTAMP WHERE username = ?',
      [username]
    );
  }
}

module.exports = User;