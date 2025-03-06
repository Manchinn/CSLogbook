// backend/controllers/logbookController.js
const pool = require('../config/database');
const moment = require('moment-timezone');

// Get all logbooks for a student
exports.getLogbooks = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const studentID = req.user.studentID;
    
    const [logbooks] = await connection.execute(
      `SELECT 
        id,
        title, 
        meeting_date,
        meeting_details,
        progress_update,
        status,
        created_at,
        updated_at
       FROM logbooks 
       WHERE studentID = ?
       ORDER BY meeting_date DESC`,
      [studentID]
    );

    res.json(logbooks);
  } catch (error) {
    console.error('Error fetching logbooks:', error);
    res.status(500).json({ error: 'Error fetching logbooks' });
  } finally {
    connection.release();
  }
};

// Create new logbook
exports.createLogbook = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { title, meetingDate, meeting_details, progress_update } = req.body;
    const studentID = req.user.studentID; // จาก middleware authentication

    const [result] = await connection.execute(
      `INSERT INTO logbooks (
        studentID,
        title,
        meeting_date,
        meeting_details,
        progress_update,
        status
      ) VALUES (?, ?, ?, ?, ?, 'pending')`,
      [studentID, title, meetingDate, meeting_details, progress_update]
    );

    res.status(201).json({
      success: true,
      message: 'Logbook created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating logbook:', error);
    res.status(500).json({ error: 'Error creating logbook' });
  } finally {
    connection.release();
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