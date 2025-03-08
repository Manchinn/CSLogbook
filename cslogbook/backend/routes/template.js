const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/download-template', (req, res) => {
  const filePath = path.join(__dirname, '../templates/student_template.csv');
  res.download(filePath, 'student_template.csv', (err) => {
    if (err) {
      console.error('Error downloading template:', err);
      res.status(500).send('Error downloading template');
    }
  });
});

module.exports = router;
