const { InternshipDocument, Document, User } = require('../models');
const pool = require('../config/database');
const path = require('path');

exports.submitInternshipDocuments = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    if (!req.files?.length) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const companyInfo = JSON.parse(req.body.companyInfo);
    const filesInfo = req.files.map(file => ({
      originalname: file.originalname,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    }));

    // สร้าง internship document
    const internshipDoc = await InternshipDocument.create({
      companyName: companyInfo.company_name,
      contactName: companyInfo.contact_name,
      contactPhone: companyInfo.contact_phone,
      contactEmail: companyInfo.contact_email,
      uploadedFiles: filesInfo,
      status: 'pending'
    }, { transaction });

    // สร้าง document status
    await Document.create({
      documentName: companyInfo.company_name,
      studentName: `${req.user.firstName} ${req.user.lastName}`,
      status: 'pending',
      type: 'internship',
      userId: req.user.id
    }, { transaction });

    await transaction.commit();
    res.status(201).json({
      message: 'Internship documents submitted successfully',
      documentId: internshipDoc.id
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error:', error);
    res.status(500).json({ error: 'Error submitting documents' });
  }
};

exports.uploadInternshipDocument = (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.'); // ถ้าไม่มีไฟล์ที่อัพโหลด ส่งสถานะ 400
  }
  res.status(200).send({ fileName: req.file.filename }); // ส่งชื่อไฟล์กลับไป
};

exports.getInternshipDocuments = async (req, res) => {
  try {
    const documents = await InternshipDocument.findAll({
      include: [{
        model: Document,
        include: [{ model: User, attributes: ['firstName', 'lastName'] }]
      }]
    });
    res.json(documents);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching documents' });
  }
};

exports.getInternshipDocumentById = async (req, res) => {
  const { id } = req.params;
  try {
    const [document] = await pool.execute('SELECT * FROM internship_documents WHERE id = ?', [id]);
    if (document.length === 0) {
      return res.status(404).json({ error: 'Document not found' }); // ถ้าไม่พบเอกสาร ส่งสถานะ 404
    }

    // ส่งข้อมูลไฟล์กลับไปโดยตรง ไม่ต้องถอดรหัส
    res.json(document[0]);
  } catch (error) {
    console.error('Error fetching internship document:', error);
    res.status(500).json({ error: 'Error fetching internship document' });
  }
};

exports.approveInternshipDocument = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // อัพเดทสถานะในตาราง internship_documents
    await connection.execute(
      'UPDATE internship_documents SET status = ? WHERE id = ?',
      ['approved', id]
    );
    
    // อัพเดทสถานะในตาราง documents
    await connection.execute(
      'UPDATE documents SET status = ? WHERE document_name = (SELECT company_name FROM internship_documents WHERE id = ?)',
      ['approved', id]
    );

    await connection.commit();
    res.json({ message: 'Internship document approved successfully' });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error approving internship document:', error);
    res.status(500).json({ error: 'Error approving internship document' });
  } finally {
    connection.release();
  }
};

exports.rejectInternshipDocument = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // อัพเดทสถานะในตาราง internship_documents
    await connection.execute(
      'UPDATE internship_documents SET status = ? WHERE id = ?',
      ['rejected', id]
    );
    
    // อัพเดทสถานะในตาราง documents
    await connection.execute(
      'UPDATE documents SET status = ? WHERE document_name = (SELECT company_name FROM internship_documents WHERE id = ?)',
      ['rejected', id]
    );

    await connection.commit();
    res.json({ message: 'Internship document rejected successfully' });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error rejecting internship document:', error);
    res.status(500).json({ error: 'Error rejecting internship document' });
  } finally {
    connection.release();
  }
};