const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get all documents or documents by type
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: The type of documents to retrieve (internship or project)
 *     responses:
 *       200:
 *         description: A list of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  const { type } = req.query;

  try {
    let query = '';
    let params = [];

    if (type === 'internship') {
      query = `
        SELECT d.*, i.company_name, i.contact_name, i.contact_phone, i.contact_email, i.uploaded_files
        FROM documents d
        JOIN internship_documents i ON d.document_name = i.company_name
        WHERE d.type = 'internship';
      `;
    } else if (type === 'project') {
      query = `
        SELECT d.*, p.project_name_th, p.project_name_en, p.student_id1, p.student_name1, p.student_type1, p.student_id2, p.student_name2, p.student_type2, p.track, p.project_category
        FROM documents d
        JOIN project_proposals p ON d.document_name = p.project_name_th
        WHERE d.type = 'project';
      `;
    } else if (type) {
      query = 'SELECT * FROM documents WHERE type = ?';
      params.push(type);
    } else {
      query = 'SELECT * FROM documents';
    }

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

/**
 * @swagger
 * /api/documents/{id}/approve:
 *   post:
 *     summary: Approve a document
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the document to approve
 *     responses:
 *       200:
 *         description: Document approved successfully
 *       500:
 *         description: Error approving document
 */
router.post('/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('UPDATE documents SET status = ? WHERE id = ?', ['approved', id]);
    res.status(200).json({ message: 'Document approved successfully' });
  } catch (error) {
    console.error('Error approving document:', error);
    res.status(500).json({ error: 'Error approving document' });
  }
});

/**
 * @swagger
 * /api/documents/{id}/reject:
 *   post:
 *     summary: Reject a document
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the document to reject
 *     responses:
 *       200:
 *         description: Document rejected successfully
 *       500:
 *         description: Error rejecting document
 */
router.post('/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute('UPDATE documents SET status = ? WHERE id = ?', ['rejected', id]);
    res.status(200).json({ message: 'Document rejected successfully' });
  } catch (error) {
    console.error('Error rejecting document:', error);
    res.status(500).json({ error: 'Error rejecting document' });
  }
});

module.exports = router;
