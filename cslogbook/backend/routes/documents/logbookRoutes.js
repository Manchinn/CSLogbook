// backend/routes/logbookRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/authMiddleware');
const authorize = require('../../middleware/authorize');
const internshipLogbookController = require('../../controllers/logbooks/internshipLogbookController');

// ============= เส้นทางสำหรับการดึงข้อมูล =============

/**
 * @route GET /api/logbooks/internship/timesheet
 * @desc ดึงข้อมูลบันทึกการฝึกงานทั้งหมดของนักศึกษา
 * @access Private (Student)
 */
router.get('/timesheet',
    authenticateToken,
    authorize('logbook', 'student'),
    internshipLogbookController.getTimeSheetEntries
);

/**
 * @route GET /api/logbooks/internship/timesheet/stats
 * @desc ดึงข้อมูลสถิติการฝึกงาน
 * @access Private (Student)
 */
router.get('/timesheet/stats',
    authenticateToken,
    authorize('logbook', 'student'),
    internshipLogbookController.getTimeSheetStats
);

/**
 * @route GET /api/logbooks/internship/cs05/date-range
 * @desc ดึงช่วงวันที่ฝึกงานจาก CS05
 * @access Private (Student)
 */
router.get('/cs05/date-range',
    authenticateToken,
    authorize('logbook', 'student'),
    internshipLogbookController.getInternshipDateRange
);

/**
 * @route GET /api/logbooks/internship/workdays
 * @desc สร้างรายการวันทำงานทั้งหมด (ไม่รวมวันหยุด)
 * @access Private (Student)
 */
router.get('/workdays',
    authenticateToken,
    authorize('logbook', 'student'),
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
    authorize('logbook', 'student'),
    internshipLogbookController.saveTimeSheetEntry
);

/**
 * @route POST /api/internship/logbook/check-in
 * @desc บันทึกเวลาเข้างาน
 * @access Private (Student)
 */
router.post('/check-in',
    authenticateToken,
    authorize('logbook', 'student'),
    internshipLogbookController.checkIn
);

/**
 * @route POST /api/internship/logbook/check-out
 * @desc บันทึกเวลาออกงานและรายละเอียดการทำงาน
 * @access Private (Student)
 */
router.post('/check-out',
    authenticateToken,
    authorize('logbook', 'student'),
    internshipLogbookController.checkOut
);

/**
 * @route GET /api/logbooks/internship/timesheet/:id
 * @desc ดึงข้อมูลบันทึกการฝึกงานตาม ID
 * @access Private (Student)
 */
router.get('/timesheet/:id',
    authenticateToken,
    authorize('logbook', 'student'),
    internshipLogbookController.getTimeSheetEntryById
);

/**
 * @route PUT /api/logbooks/internship/timesheet/:id
 * @desc อัพเดทข้อมูลการฝึกงานประจำวัน
 * @access Private (Student)
 */
router.put('/timesheet/:id',
    authenticateToken,
    authorize('logbook', 'student'),
    internshipLogbookController.updateTimeSheetEntry
);

/**
 * @route DELETE /api/logbooks/internship/timesheet/:id
 * @desc ลบบันทึกการฝึกงานประจำวัน (เฉพาะที่ยังไม่ได้รับอนุมัติ)
 * @access Private (Student)
 */
router.delete('/timesheet/:id',
    authenticateToken,
    authorize('logbook', 'student'),
    internshipLogbookController.deleteTimeSheetEntry
);

// ============= เส้นทางสำหรับอาจารย์ที่ปรึกษา =============

/**
 * @route PUT /api/logbooks/internship/timesheet/:id/approve
 * @desc อนุมัติบันทึกการฝึกงาน (สำหรับอาจารย์ที่ปรึกษา)
 * @access Private (Teacher)
 */
router.put('/timesheet/:id/approve',
    authenticateToken,
    authorize('logbook', 'teacherApprove'),
    internshipLogbookController.approveTimeSheetEntry
);

// ============= เส้นทางสำหรับบทสรุปการฝึกงาน =============

/**
 * @route POST /api/logbooks/internship/reflection
 * @desc บันทึกบทสรุปการฝึกงาน
 * @access Private (Student)
 */
router.post('/reflection',
    authenticateToken,
    authorize('logbook', 'student'),
    internshipLogbookController.saveReflection
);

/**
 * @route GET /api/logbooks/internship/reflection
 * @desc ดึงบทสรุปการฝึกงานของนักศึกษา
 * @access Private (Student)
 */
router.get('/reflection',
    authenticateToken,
    authorize('logbook', 'student'),
    internshipLogbookController.getReflection
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
