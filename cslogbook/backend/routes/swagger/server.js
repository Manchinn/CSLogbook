/**
 * @swagger
 * tags:
 *   name: Server
 *   description: Server related endpoints
 */

/**
 * @swagger
 * /template/download-template:
 *   get:
 *     summary: Download CSV template
 *     tags: [Server]
 *     responses:
 *       200:
 *         description: Template downloaded successfully
 *       500:
 *         description: Error downloading template
 */

/**
 * @swagger
 * /upload-csv:
 *   post:
 *     summary: Upload a CSV file
 *     tags: [Server]
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
 *       500:
 *         description: Error uploading file
 */