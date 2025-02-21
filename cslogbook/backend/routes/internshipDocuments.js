const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const pool = require('../config/database');

// ตั้งค่า multer สำหรับการอัพโหลดไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../upload/')); // ไฟล์จะถูกเก็บในโฟลเดอร์ uploads
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // ตั้งชื่อไฟล์ด้วย timestamp และชื่อไฟล์เดิม
  },
});

const upload = multer({ storage });

// จัดการการอัพโหลดไฟล์
router.post('/upload-internship-doc', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.'); // ถ้าไม่มีไฟล์ที่อัพโหลด ส่งสถานะ 400
  }
  res.status(200).send({ fileName: req.file.filename }); // ส่งชื่อไฟล์กลับไป
});

router.post('/', async (req, res) => {
  const { companyInfo, uploadedFiles } = req.body;

  // ตรวจสอบว่าพารามิเตอร์ทั้งหมดถูกกำหนด
  const companyName = companyInfo.company_name || null;
  const contactName = companyInfo.contact_name || null;
  const contactPhone = companyInfo.contact_phone || null;
  const contactEmail = companyInfo.contact_email || null;

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' }); // ถ้าไม่มีชื่อบริษัท ส่งสถานะ 400
  }

  console.log("Received data from frontend:", { companyInfo, uploadedFiles });

  try {
    const [result] = await pool.execute(
      'INSERT INTO internship_documents (company_name, contact_name, contact_phone, contact_email, uploaded_files) VALUES (?, ?, ?, ?, ?)',
      [companyName, contactName, contactPhone, contactEmail, JSON.stringify(uploadedFiles)]
    );

    // เพิ่มการบันทึกข้อมูลลงในตาราง documents
    await pool.execute(
      'INSERT INTO documents (document_name, student_name, upload_date, status, type) VALUES (?, ?, NOW(), ?, ?)',
      [companyName, contactName, 'Pending', 'internship']
    );

    res.status(201).json({ message: 'Internship documents submitted successfully', documentId: result.insertId });
  } catch (error) {
    console.error('Error submitting internship documents:', error);
    res.status(500).json({ error: 'Error submitting internship documents' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [documents] = await pool.execute('SELECT * FROM internship_documents');
    res.json(documents); // ส่งข้อมูลเอกสารทั้งหมดกลับไป
  } catch (error) {
    console.error('Error fetching internship documents:', error);
    res.status(500).json({ error: 'Error fetching internship documents' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [document] = await pool.execute('SELECT * FROM internship_documents WHERE id = ?', [id]);
    if (document.length === 0) {
      return res.status(404).json({ error: 'Document not found' }); // ถ้าไม่พบเอกสาร ส่งสถานะ 404
    }
    res.json(document[0]); // ส่งข้อมูลเอกสารกลับไป
  } catch (error) {
    console.error('Error fetching internship document:', error);
    res.status(500).json({ error: 'Error fetching internship document' });
  }
});

router.post('/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('UPDATE documents SET status = ? WHERE document_name = (SELECT company_name FROM internship_documents WHERE id = ?)', ['approved', id]);
    res.json({ message: 'Internship document approved successfully' }); // ส่งข้อความยืนยันการอนุมัติเอกสาร
  } catch (error) {
    console.error('Error approving internship document:', error);
    res.status(500).json({ error: 'Error approving internship document' });
  }
});

router.post('/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('UPDATE documents SET status = ? WHERE document_name = (SELECT company_name FROM internship_documents WHERE id = ?)', ['rejected', id]);
    res.json({ message: 'Internship document rejected successfully' }); // ส่งข้อความยืนยันการปฏิเสธเอกสาร
  } catch (error) {
    console.error('Error rejecting internship document:', error);
    res.status(500).json({ error: 'Error rejecting internship document' });
  }
});

module.exports = router;
