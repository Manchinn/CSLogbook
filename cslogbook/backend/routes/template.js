const express = require('express');
const path = require('path');
const router = express.Router();

// Download CSV template
router.get('/download-csv-template', (req, res) => {
  const templateType = req.query.type || 'basic'; // basic, detailed, mixed
  let fileName;
  
  switch (templateType) {
    case 'detailed':
      fileName = 'student_template_detailed.csv';
      break;
    case 'mixed':
      fileName = 'student_template_mixed.csv';
      break;
    case 'basic':
    default:
      fileName = 'student_template_basic.csv';
      break;
  }
  
  const filePath = path.join(__dirname, '../templates', fileName);
  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error('Error downloading CSV template:', err);
      res.status(500).send('Error downloading CSV template');
    }
  });
});

// Download Excel template - simplified to just serve CSV for now
router.get('/download-excel-template', (req, res) => {
  // For now, just serve the CSV template since excelGenerator doesn't exist
  const filePath = path.join(__dirname, '../templates/student_template_basic.csv');
  res.download(filePath, 'student_template_basic.csv', (err) => {
    if (err) {
      console.error('Error downloading template:', err);
      res.status(500).send('Error downloading template');
    }
  });
});

// Keep old route for backward compatibility
router.get('/download-template', (req, res) => {
  const filePath = path.join(__dirname, '../templates/student_template_basic.csv');
  res.download(filePath, 'student_template_basic.csv', (err) => {
    if (err) {
      console.error('Error downloading template:', err);
      res.status(500).send('Error downloading template');
    }
  });
});

module.exports = router;
