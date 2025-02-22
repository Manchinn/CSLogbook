/**
 * @swagger
 * tags:
 *   name: InternshipDocuments
 *   description: Internship document management endpoints
 */

/**
 * @swagger
 * /api/internship-documents:
 *   post:
 *     summary: Submit internship documents
 *     tags: [InternshipDocuments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyInfo:
 *                 type: object
 *               uploadedFiles:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Documents submitted successfully
 *       500:
 *         description: Error submitting documents
 */

/**
 * @swagger
 * /api/internship-documents/upload-internship-doc:
 *   post:
 *     summary: Upload an internship document
 *     tags: [InternshipDocuments]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: No file uploaded
 */

/**
 * @swagger
 * /api/internship-documents:
 *   get:
 *     summary: Get all internship documents
 *     tags: [InternshipDocuments]
 *     responses:
 *       200:
 *         description: A list of internship documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /api/internship-documents/{id}:
 *   get:
 *     summary: Get internship document by ID
 *     tags: [InternshipDocuments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the internship document to retrieve
 *     responses:
 *       200:
 *         description: Internship document data
 *       404:
 *         description: Document not found
 */

/**
 * @swagger
 * /api/internship-documents/{id}/approve:
 *   post:
 *     summary: Approve an internship document
 *     tags: [InternshipDocuments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the internship document to approve
 *     responses:
 *       200:
 *         description: Internship document approved successfully
 *       500:
 *         description: Error approving internship document
 */

/**
 * @swagger
 * /api/internship-documents/{id}/reject:
 *   post:
 *     summary: Reject an internship document
 *     tags: [InternshipDocuments]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the internship document to reject
 *     responses:
 *       200:
 *         description: Internship document rejected successfully
 *       500:
 *         description: Error rejecting internship document
 */