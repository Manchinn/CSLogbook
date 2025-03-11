const { Document, InternshipDocument, ProjectDocument, User } = require('../models');

exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll({
      where: { 
        status: req.query.status || 'pending' 
      },
      include: [
        {
          model: User,
          attributes: ['firstName', 'lastName']
        },
        {
          model: InternshipDocument,
          attributes: ['companyName', 'supervisorName', 'supervisorPhone', 'supervisorEmail'],
          required: false
        },
        {
          model: ProjectDocument,
          attributes: ['projectNameTh', 'projectNameEn', 'projectType', 'track'],
          required: false
        }
      ]
    });

    res.json(documents);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching documents' });
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id, {
      include: [
        { 
          model: User,
          attributes: ['firstName', 'lastName']
        },
        {
          model: InternshipDocument,
          required: false
        },
        {
          model: ProjectDocument,
          required: false,
          include: [{
            model: User,
            as: 'students',
            attributes: ['firstName', 'lastName']
          }]
        }
      ]
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching document' });
  }
};

exports.approveDocument = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.execute('UPDATE documents SET status = ? WHERE id = ?', ['approved', parseInt(id, 10)]);
    res.status(200).json({ message: 'Document approved successfully' });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      query: error.sql
    });
    res.status(500).json({ 
      error: 'Error approving document',
      details: error.message 
    });
  }
};

exports.rejectDocument = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.execute('UPDATE documents SET status = ? WHERE id = ?', ['rejected', id]);
    res.status(200).json({ message: 'Document rejected successfully' });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      query: error.sql
    });
    res.status(500).json({ 
      error: 'Error rejecting document',
      details: error.message 
    });
  }
};