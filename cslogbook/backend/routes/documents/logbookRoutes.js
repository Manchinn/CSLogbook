// backend/routes/logbookRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../../middleware/authMiddleware');
const internshipLogbookController = require('../../controllers/logbooks/internshipLogbookController');

// ============= เส้นทางสำหรับการดึงข้อมูล =============

/**
 * @route GET /api/logbooks/internship/timesheet
 * @desc ดึงข้อมูลบันทึกการฝึกงานทั้งหมดของนักศึกษา
 * @access Private (Student)
 */
router.get('/timesheet',
    authenticateToken,
    checkRole(['student']),
    internshipLogbookController.getTimeSheetEntries
);

/**
 * @route GET /api/logbooks/internship/timesheet/stats
 * @desc ดึงข้อมูลสถิติการฝึกงาน
 * @access Private (Student)
 */
router.get('/timesheet/stats',
    authenticateToken,
    checkRole(['student']),
    internshipLogbookController.getTimeSheetStats
);

/**
 * @route GET /api/logbooks/internship/cs05/date-range
 * @desc ดึงช่วงวันที่ฝึกงานจาก CS05
 * @access Private (Student)
 */
router.get('/cs05/date-range',
    authenticateToken,
    checkRole(['student']),
    internshipLogbookController.getInternshipDateRange
);

/**
 * @route GET /api/logbooks/internship/workdays
 * @desc สร้างรายการวันทำงานทั้งหมด (ไม่รวมวันหยุด)
 * @access Private (Student)
 */
router.get('/workdays',
    authenticateToken,
    checkRole(['student']),
    internshipLogbookController.generateInternshipDates
);

// ============= เส้นทางสำหรับการบันทึกข้อมูล =============

/**
 * @route POST /api/logbooks/internship/timesheet
 * @desc บันทึกข้อมูลการฝึกงานประจำวัน
 * @access Private (Student)
 */
router.post('/timesheet',
    authenticateToken,
    checkRole(['student']),
    internshipLogbookController.saveTimeSheetEntry
);

/**
 * @route POST /api/internship/logbook/check-in
 * @desc บันทึกเวลาเข้างาน
 * @access Private (Student)
 */
router.post('/check-in',
    authenticateToken,
    checkRole(['student']),
    internshipLogbookController.checkIn
);

/**
 * @route POST /api/internship/logbook/check-out
 * @desc บันทึกเวลาออกงานและรายละเอียดการทำงาน
 * @access Private (Student)
 */
router.post('/check-out',
    authenticateToken,
    checkRole(['student']),
    internshipLogbookController.checkOut
);

/**
 * @route GET /api/logbooks/internship/timesheet/:id
 * @desc ดึงข้อมูลบันทึกการฝึกงานตาม ID
 * @access Private (Student)
 */
router.get('/timesheet/:id',
    authenticateToken,
    checkRole(['student']),
    internshipLogbookController.getTimeSheetEntryById
);

/**
 * @route PUT /api/logbooks/internship/timesheet/:id
 * @desc อัพเดทข้อมูลการฝึกงานประจำวัน
 * @access Private (Student)
 */
router.put('/timesheet/:id',
    authenticateToken,
    checkRole(['student']),
    internshipLogbookController.updateTimeSheetEntry
);

// ============= เส้นทางสำหรับอาจารย์ที่ปรึกษา =============

/**
 * @route PUT /api/logbooks/internship/timesheet/:id/approve
 * @desc อนุมัติบันทึกการฝึกงาน (สำหรับอาจารย์ที่ปรึกษา)
 * @access Private (Teacher)
 */
router.put('/timesheet/:id/approve',
    authenticateToken,
    checkRole(['teacher']),
    internshipLogbookController.approveTimeSheetEntry
);

/**
 * @route GET /api/logbooks/internship/student/:studentId/timesheet
 * @desc ดึงข้อมูลบันทึกการฝึกงานของนักศึกษา (สำหรับอาจารย์ที่ปรึกษา)
 * @access Private (Teacher)
 */
/* router.get('/student/:studentId/timesheet',
    authenticateToken,
    checkRole(['teacher']),
    // ต้องเพิ่มฟังก์ชันสำหรับอาจารย์ดูบันทึกของนักศึกษา
    // internshipLogbookController.getStudentTimeSheetEntries
); */

module.exports = router;