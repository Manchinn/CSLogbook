// backend/controllers/logbookController.js
const pool = require('../config/database');
const moment = require('moment-timezone');

// Get all logbooks for a student
exports.getLogbooks = async (req, res) => {
  try {
    const [logs] = await pool.execute(`
      SELECT 
        id,
        studentID,
        title,
        DATE_FORMAT(CONVERT_TZ(meeting_date, '+00:00', '+07:00'), '%Y-%m-%d %H:%i:%s') as meeting_date,
        meeting_details,
        progress_update,
        status,
        DATE_FORMAT(CONVERT_TZ(created_at, '+00:00', '+07:00'), '%Y-%m-%d %H:%i:%s') as created_at,
        DATE_FORMAT(CONVERT_TZ(updated_at, '+00:00', '+07:00'), '%Y-%m-%d %H:%i:%s') as updated_at
      FROM logbooks 
      WHERE studentID = ? 
      ORDER BY created_at DESC
    `, [req.user.studentID]);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logbooks:', error);
    res.status(500).json({ error: 'Error fetching logbooks' });
  }
};

// Create new logbook
exports.createLogbook = async (req, res) => {
  try {
    const { title, meetingDate, meetingDetails, progressUpdate, status } = req.body;
    
    // แปลงเวลาเป็น UTC ก่อนบันทึก
    const utcMeetingDate = moment.tz(meetingDate, 'Asia/Bangkok').utc().format('YYYY-MM-DD HH:mm:ss');

    const [result] = await pool.execute(`
      INSERT INTO logbooks (
        studentID, 
        title, 
        meeting_date, 
        meeting_details, 
        progress_update, 
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [req.user.studentID, title, utcMeetingDate, meetingDetails, progressUpdate, status]);

    res.status(201).json({
      success: true,
      message: 'Logbook created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating logbook:', error);
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