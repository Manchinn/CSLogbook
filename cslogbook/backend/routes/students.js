const express = require('express');
const router = express.Router();
const mockStudentData = require('../mockStudentData');

router.get('/', async (req, res, next) => {
  try {
    res.json(mockStudentData);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const student = mockStudentData.find(s => s.studentID === req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    next(error);
  }
});

module.exports = router;