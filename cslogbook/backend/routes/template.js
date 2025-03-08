const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/student-template.csv', (req, res) => {
  const filePath = path.join(__dirname, '../templates/student_template.csv');
  // สร้างชื่อไฟล์ที่จะดาวน์โหลด
  const currentDate = new Date().toISOString().split('T')[0];
  const downloadFileName = `student_template_${currentDate}.csv`;
  
  res.download(filePath, downloadFileName, (err) => {
    if (err) {
      console.error('Error downloading template:', err);
      res.status(500).json({
        error: 'Error downloading template file'
      });
    }
  });
});

module.exports = router;
