const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all students
router.get('/', async (req, res, next) => {
  try {
    const [students] = await pool.execute(`
      SELECT u.*, sd.isEligibleForInternship, sd.isEligibleForProject 
      FROM users u 
      LEFT JOIN student_data sd ON u.studentID = sd.studentID 
      WHERE u.role = 'student'
    `);
    res.json(students);
  } catch (error) {
    next(error);
  }
});

// Get student by ID
router.get('/:id', async (req, res, next) => {
  try {
    const [student] = await pool.execute(`
      SELECT u.*, sd.isEligibleForInternship, sd.isEligibleForProject 
      FROM users u 
      LEFT JOIN student_data sd ON u.studentID = sd.studentID 
      WHERE u.studentID = ?
    `, [req.params.id]);

    if (!student[0]) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;