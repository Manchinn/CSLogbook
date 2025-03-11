// backend/controllers/logbookController.js
const { Logbook } = require('../models');
const moment = require('moment-timezone');

// Get all logbooks for a student
exports.getLogbooks = async (req, res) => {
  try {
    const logbooks = await Logbook.findAll({
      where: { studentId: req.user.studentID },
      order: [['meetingDate', 'DESC']]
    });
    res.json(logbooks);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching logbooks' });
  }
};

// Create new logbook
exports.createLogbook = async (req, res) => {
  try {
    const logbook = await Logbook.create({
      studentId: req.user.studentID,
      title: req.body.title,
      meetingDate: req.body.meetingDate,
      meetingDetails: req.body.meeting_details,
      progressUpdate: req.body.progress_update,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Logbook created successfully',
      id: logbook.id
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error creating logbook' });
  }
};

// Update existing logbook
exports.updateLogbook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, meetingDate, meetingDetails, progressUpdate, status } = req.body;

    await pool.execute(`
      UPDATE logbooks 
      SET title = ?, 
          meeting_date = ?, 
          meeting_details = ?, 
          progress_update = ?, 
          status = ?,
          updated_at = NOW()
      WHERE id = ? AND studentID = ?
    `, [title, meetingDate, meetingDetails, progressUpdate, status, id, req.user.studentID]);

    res.json({ 
      success: true, 
      message: 'Logbook updated successfully' 
    });
  } catch (error) {
    console.error('Error updating logbook:', error);
    res.status(500).json({ error: 'Error updating logbook' });
  }
};

// Update logbook status
exports.updateLogbookStatus = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const studentID = req.user.studentID;

    // ตรวจสอบว่า status เป็นค่าที่ถูกต้อง
    if (!['pending', 'complete'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const [result] = await connection.execute(
      `UPDATE logbooks 
       SET status = ?
       WHERE id = ? AND studentID = ?`,
      [status, id, studentID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Logbook not found or unauthorized' });
    }

    res.json({ 
      success: true, 
      message: 'Logbook status updated successfully' 
    });
  } catch (error) {
    console.error('Error updating logbook status:', error);
    res.status(500).json({ error: 'Error updating logbook status' });
  } finally {
    connection.release();
  }
};

// Delete existing logbook
exports.deleteLogbook = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(`
      DELETE FROM logbooks 
      WHERE id = ? AND studentID = ?
    `, [id, req.user.studentID]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Logbook not found or unauthorized' });
    }

    res.json({ 
      success: true, 
      message: 'Logbook deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting logbook:', error);
    res.status(500).json({ error: 'Error deleting logbook' });
  }
};