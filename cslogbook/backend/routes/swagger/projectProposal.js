/**
 * @swagger
 * tags:
 *   name: Project Proposals
 *   description: API for managing project proposals
 * /api/project-proposals:
 *   post:
 *     summary: Submit a project proposal
 *     tags: [Project Proposals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectNameTH:
 *                 type: string
 *               projectNameEN:
 *                 type: string
 *               studentId1:
 *                 type: string
 *               studentName1:
 *                 type: string
 *               studentType1:
 *                 type: string
 *               studentId2:
 *                 type: string
 *               studentName2:
 *                 type: string
 *               studentType2:
 *                 type: string
 *               track:
 *                 type: string
 *               projectCategory:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proposal submitted successfully
 *       500:
 *         description: Error submitting proposal
 */
