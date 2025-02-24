/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get all documents or documents by type
 *     tags: [Documents]
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

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the document to retrieve
 *     responses:
 *       200:
 *         description: Document data
 *       404:
 *         description: Document not found
 */

/**
 * @swagger
 * /api/documents/{id}/approve:
 *   post:
 *     summary: Approve a document
 *     tags: [Documents]
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

/**
 * @swagger
 * /api/documents/{id}/reject:
 *   post:
 *     summary: Reject a document
 *     tags: [Documents]
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