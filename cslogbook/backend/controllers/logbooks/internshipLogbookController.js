const internshipLogbookService = require('../../services/internshipLogbookService');
const logger = require('../../utils/logger');

// ============= Controller สำหรับสมุดบันทึกประจำวัน =============

/**
 * ดึงข้อมูลบันทึกการฝึกงานทั้งหมดของนักศึกษา
 */
exports.getTimeSheetEntries = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            logger.error('User data not found in request:', req.user);
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        const entries = await internshipLogbookService.getTimeSheetEntries(req.user.userId);

        return res.json({
            success: true,
            message: 'ดึงข้อมูลบันทึกการฝึกงานสำเร็จ',
            data: entries
        });

    } catch (error) {
        logger.error('Get TimeSheet Entries Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลบันทึกการฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * บันทึกข้อมูลการฝึกงานประจำวัน
 */
exports.saveTimeSheetEntry = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        const entry = await internshipLogbookService.saveTimeSheetEntry(req.user.userId, req.body);

        return res.status(201).json({
            success: true,
            message: 'บันทึกข้อมูลการฝึกงานเรียบร้อย',
            data: entry
        });

    } catch (error) {
        logger.error('Save TimeSheet Entry Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลการฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * อัพเดทข้อมูลการฝึกงานประจำวัน
 */
exports.updateTimeSheetEntry = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        const logId = req.params.id;
        const entry = await internshipLogbookService.updateTimeSheetEntry(req.user.userId, logId, req.body);

        return res.json({
            success: true,
            message: 'อัพเดทข้อมูลการฝึกงานเรียบร้อย',
            data: entry
        });

    } catch (error) {
        logger.error('Update TimeSheet Entry Error:', error);
        
        if (error.message === 'ไม่พบข้อมูลบันทึกการฝึกงาน') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message === 'ไม่สามารถแก้ไขบันทึกที่ได้รับการอนุมัติแล้ว') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลการฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ดึงข้อมูลสถิติการฝึกงาน
 */
exports.getTimeSheetStats = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        const stats = await internshipLogbookService.getTimeSheetStats(req.user.userId);

        return res.json({
            success: true,
            message: 'ดึงข้อมูลสถิติการฝึกงานสำเร็จ',
            data: stats
        });

    } catch (error) {
        logger.error('Get TimeSheet Stats Error:', error);
        
        if (error.message === 'ไม่พบข้อมูลนักศึกษา' || error.message.includes('ไม่พบข้อมูล CS05')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติการฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ดึงช่วงวันที่ฝึกงานจาก CS05
 */
exports.getInternshipDateRange = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            logger.error('User data not found in request:', req.user);
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        const dateRange = await internshipLogbookService.getInternshipDateRange(req.user.userId);

        return res.json({
            success: true,
            message: 'ดึงข้อมูลช่วงวันที่ฝึกงานสำเร็จ',
            data: dateRange
        });

    } catch (error) {
        logger.error('Get Internship Date Range Error:', error);
        
        if (error.message === 'ไม่พบข้อมูล CS05 ที่รออนุมัติ') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลช่วงวันที่ฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * สร้างรายการวันทำงานทั้งหมด (ไม่รวมวันหยุด)
 */
exports.generateInternshipDates = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            logger.error('User data not found in request:', req.user);
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        const workdays = await internshipLogbookService.generateInternshipDates(req.user.userId);

        return res.json({
            success: true,
            message: 'สร้างรายการวันทำงานสำเร็จ',
            data: workdays
        });

    } catch (error) {
        logger.error('Generate Internship Dates Error:', error);
        
        if (error.message === 'ไม่พบข้อมูล CS05 ที่รออนุมัติ') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการสร้างรายการวันทำงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ดึงข้อมูลบันทึกการฝึกงานตาม ID
 */
exports.getTimeSheetEntryById = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        const logId = req.params.id;
        const entry = await internshipLogbookService.getTimeSheetEntryById(req.user.userId, logId);

        return res.json({
            success: true,
            message: 'ดึงข้อมูลบันทึกการฝึกงานสำเร็จ',
            data: entry
        });

    } catch (error) {
        logger.error('Get TimeSheet Entry By Id Error:', error);
        
        if (error.message === 'ไม่พบข้อมูลบันทึกการฝึกงาน' || error.message === 'ไม่พบข้อมูลนักศึกษา') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลบันทึกการฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * บันทึกเวลาเข้างาน (Check In)
 */
exports.checkIn = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        const entry = await internshipLogbookService.checkIn(req.user.userId, req.body);

        return res.status(200).json({
            success: true,
            message: 'บันทึกเวลาเข้างานเรียบร้อย' + (req.body.logTitle ? ' พร้อมข้อมูลเพิ่มเติม' : ''),
            data: entry
        });

    } catch (error) {
        logger.error('Check In Error:', error);
        
        if (error.message === 'ไม่พบข้อมูลนักศึกษา' || error.message === 'ไม่พบข้อมูล CS05 ที่รออนุมัติ') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการบันทึกเวลาเข้างาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * บันทึกเวลาออกงาน (Check Out)
 */
exports.checkOut = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        const entry = await internshipLogbookService.checkOut(req.user.userId, req.body);

        return res.status(200).json({
            success: true,
            message: 'บันทึกเวลาออกงานและรายละเอียดเรียบร้อย',
            data: entry
        });

    } catch (error) {
        logger.error('Check Out Error:', error);
        
        if (error.message === 'ไม่พบข้อมูลนักศึกษา' || 
            error.message === 'ไม่พบข้อมูลการบันทึกเวลาเข้างาน กรุณาบันทึกเวลาเข้างานก่อน') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === 'ไม่สามารถแก้ไขบันทึกที่ได้รับการอนุมัติแล้ว' ||
            error.message === 'เวลาออกงานต้องมากกว่าเวลาเข้างาน') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || 'เกิดข้อผิดพลาดในการบันทึกเวลาออกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ฟังก์ชันสำหรับอาจารย์ที่ปรึกษาอนุมัติบันทึก
exports.approveTimeSheetEntry = async (req, res) => {
    try {
        const teacherId = req.user.teacherId;
        const logId = req.params.id;
        const { comment } = req.body;

        const result = await internshipLogbookService.approveTimeSheetEntry(teacherId, logId, comment);

        return res.json({
            success: true,
            message: 'อนุมัติบันทึกการฝึกงานเรียบร้อย',
            data: result
        });

    } catch (error) {
        logger.error('Approve TimeSheet Entry Error:', error);
        
        if (error.message.includes('ไม่พบข้อมูลบันทึก') || error.message.includes('ไม่ใช่อาจารย์ที่ปรึกษา')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอนุมัติบันทึกการฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ============= Controller สำหรับบทสรุปการฝึกงาน =============

/**
 * บันทึกบทสรุปการฝึกงาน
 */
exports.saveReflection = async (req, res) => {
    try {
        // ตรวจสอบว่ามี request.user หรือไม่
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        const { learningOutcome, keyLearnings, futureApplication, improvements } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!learningOutcome || !keyLearnings || !futureApplication) {
            return res.status(400).json({
                success: false,
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
            });
        }

        const reflectionData = {
            learningOutcome,
            keyLearnings,
            futureApplication,
            improvements: improvements || ''
        };

        const result = await internshipLogbookService.saveReflection(req.user.userId, reflectionData);

        return res.status(200).json({
            success: true,
            message: 'บันทึกบทสรุปการฝึกงานเรียบร้อย',
            data: result
        });

    } catch (error) {
        logger.error('Save Reflection Error:', error);
        
        if (error.message.includes('ไม่พบข้อมูล')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการบันทึกบทสรุปการฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ดึงบทสรุปการฝึกงาน
 */
exports.getReflection = async (req, res) => {
    try {
        // ตรวจสอบว่ามี request.user หรือไม่
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        const result = await internshipLogbookService.getReflection(req.user.userId);

        if (!result) {
            return res.status(200).json({
                success: true,
                message: 'ยังไม่มีบทสรุปการฝึกงาน',
                data: null
            });
        }

        return res.status(200).json({
            success: true,
            message: 'ดึงบทสรุปการฝึกงานสำเร็จ',
            data: result
        });

    } catch (error) {
        logger.error('Get Reflection Error:', error);
        
        if (error.message.includes('ไม่พบข้อมูล')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงบทสรุปการฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};