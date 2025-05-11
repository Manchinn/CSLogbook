const {
    InternshipLogbook,
    InternshipDocument,
    InternshipLogbookReflection,
    Document,
    Student,
    User,
    sequelize
} = require('../../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { calculateWorkdays } = require('../../utils/dateUtils');

// ============= Controller สำหรับสมุดบันทึกประจำวัน =============

/**
 * ดึงข้อมูลบันทึกการฝึกงานทั้งหมดของนักศึกษา
 */
exports.getTimeSheetEntries = async (req, res) => {
    try {
        // แก้ไขตรงนี้ - ตรวจสอบว่า request มี userId หรือไม่
        if (!req.user || !req.user.userId) {
            console.error('User data not found in request:', req.user);
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        // ดึงข้อมูล student และ studentId จาก userId
        let studentId;

        // กรณีที่ต้องดึง studentId จาก userId
        const student = await Student.findOne({
            where: { userId: req.user.userId }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลนักศึกษา'
            });
        }

        studentId = student.studentId; // ใช้ student.id เพราะเป็น primary key

        // ดึงข้อมูลการฝึกงานปัจจุบันของนักศึกษา
        const document = await Document.findOne({
            where: {
                userId: req.user.userId,
                documentName: 'CS05',
                status: ['pending', 'approved']  // ค่อยไล่แก้ไขเป็น approved
            },
            include: [{
                model: InternshipDocument,
                as: 'internshipDocument',
                required: true,
                attributes: ['internshipId', 'startDate', 'endDate', 'updated_at'] // ระบุเฉพาะ attributes ที่ต้องการ
            }],
            order: [['created_at', 'DESC']]
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูล CS05 ที่รออนุมัติ'
            });
        }

        const internshipId = document.internshipDocument.internshipId;

        // ดึงบันทึกการฝึกงานทั้งหมด
        const entries = await InternshipLogbook.findAll({
            where: {
                internshipId,
                studentId  // ใช้ studentId ที่ได้มา
            },
            order: [['work_date', 'ASC']]
        });

        return res.json({
            success: true,
            message: 'ดึงข้อมูลบันทึกการฝึกงานสำเร็จ',
            data: entries
        });

    } catch (error) {
        console.error('Get TimeSheet Entries Error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบันทึกการฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * บันทึกข้อมูลการฝึกงานประจำวัน
 */
exports.saveTimeSheetEntry = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const student = await Student.findOne({
            where: { userId: req.user.userId }
        });
        const studentId = student.studentId;
        const {
            workDate,
            timeIn,
            timeOut,
            workHours,
            logTitle,
            workDescription,
            learningOutcome,
            problems,
            solutions
        } = req.body;

        // ตรวจสอบว่ามี CS05 ที่อนุมัติแล้วหรือไม่
        const document = await Document.findOne({
            where: {
                userId: req.user.userId,
                documentName: 'CS05',
                status: ['pending', 'approved'] // ค่อยไล่แก้ไขเป็น approved
            },
            include: [{
                model: InternshipDocument,
                as: 'internshipDocument',
                required: true,
                attributes: ['internshipId', 'startDate', 'endDate'] // เพิ่ม attributes เฉพาะที่ต้องการ
            }],
            transaction
        });

        if (!document) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูล CS05 ที่รออนุมัติ' // แก้ไขข้อความให้สอดคล้องกับสถานะ 'pending'
            });
        }

        const internshipId = document.internshipDocument.internshipId;

        // ตรวจสอบว่ามีบันทึกสำหรับวันที่นี้แล้วหรือไม่
        const existingEntry = await InternshipLogbook.findOne({
            where: {
                internshipId,
                studentId,
                workDate
            },
            transaction
        });

        let entry;
        if (existingEntry) {
            // อัพเดทบันทึกที่มีอยู่
            entry = await existingEntry.update({
                timeIn,
                timeOut,
                workHours,
                logTitle,
                workDescription,
                learningOutcome,
                problems: problems || '',
                solutions: solutions || ''
            }, { transaction });
        } else {
            // สร้างบันทึกใหม่
            entry = await InternshipLogbook.create({
                internshipId,
                studentId,
                workDate,
                timeIn,
                timeOut,
                workHours,
                logTitle,
                workDescription,
                learningOutcome,
                problems: problems || '',
                solutions: solutions || '',
                supervisorApproved: false,
                advisorApproved: false
            }, { transaction });
        }

        await transaction.commit();

        return res.status(201).json({
            success: true,
            message: 'บันทึกข้อมูลการฝึกงานเรียบร้อย',
            data: entry
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Save TimeSheet Entry Error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลการฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * อัพเดทข้อมูลการฝึกงานประจำวัน
 */
exports.updateTimeSheetEntry = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const student = await Student.findOne({
            where: { userId: req.user.userId }
        });
        const studentId = student.studentId;
        const logId = req.params.id;
        const {
            workDate,
            timeIn,
            timeOut,
            workHours,
            logTitle,
            workDescription,
            learningOutcome,
            problems,
            solutions
        } = req.body;

        // ดึงข้อมูลบันทึกที่ต้องการอัพเดท
        const entry = await InternshipLogbook.findOne({
            where: {
                logId,
                studentId
            },
            transaction
        });

        if (!entry) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลบันทึกการฝึกงาน'
            });
        }

        // ตรวจสอบว่าบันทึกได้รับการอนุมัติแล้วหรือไม่
        if (entry.supervisorApproved || entry.advisorApproved) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'ไม่สามารถแก้ไขบันทึกที่ได้รับการอนุมัติแล้ว'
            });
        }

        // อัพเดทข้อมูล
        await entry.update({
            workDate,
            timeIn,
            timeOut,
            workHours,
            logTitle,
            workDescription,
            learningOutcome,
            problems: problems || '',
            solutions: solutions || ''
        }, { transaction });

        await transaction.commit();

        return res.json({
            success: true,
            message: 'อัพเดทข้อมูลการฝึกงานเรียบร้อย',
            data: entry
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Update TimeSheet Entry Error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลการฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ดึงข้อมูลสถิติการฝึกงาน
 */
exports.getTimeSheetStats = async (req, res) => {
    try {
        // เพิ่มการดึง studentId ที่ถูกต้อง
        const student = await Student.findOne({
            where: { userId: req.user.userId }
        });
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลนักศึกษา'
            });
        }
        
        const studentId = student.studentId;
        console.log('StudentID:', studentId);
        
        // ดึงข้อมูล CS05 - แก้ไขให้รองรับทั้ง pending และ approved
        const document = await Document.findOne({
            where: {
                userId: req.user.userId,
                documentName: 'CS05',
                status: ['pending', 'approved']  // รองรับทั้งสองสถานะ
            },
            include: [{
                model: InternshipDocument,
                as: 'internshipDocument',
                required: true,
                attributes: ['internshipId', 'startDate', 'endDate']
            }],
            order: [['created_at', 'DESC']]
        });

        console.log('Document found:', !!document);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูล CS05 ที่รออนุมัติหรือได้รับการอนุมัติแล้ว'
            });
        }

        const internshipId = document.internshipDocument.internshipId;
        const startDate = document.internshipDocument.startDate;
        const endDate = document.internshipDocument.endDate;
        console.log('Internship dates:', { startDate, endDate });

        // คำนวณวันทำงานทั้งหมด
        const workdays = await calculateWorkdays(startDate, endDate);
        const totalDays = workdays.length;
        console.log('Total workdays:', totalDays);

        // ดึงข้อมูลบันทึกที่บันทึกแล้ว
        const entries = await InternshipLogbook.findAll({
            where: {
                internshipId,
                studentId,
                workHours: {
                    [Op.not]: null
                }
            },
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('log_id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('work_hours')), 'totalHours']
            ],
            raw: true
        });
        console.log('Entries found:', entries);

        // แก้ไขการตรวจสอบข้อมูล
        const hasEntries = entries && entries.length > 0;
        const completedCount = hasEntries ? (parseInt(entries[0].count) || 0) : 0;
        const totalHours = hasEntries ? (parseFloat(entries[0].totalHours) || 0) : 0;
        const pendingCount = totalDays - completedCount;
        const averageHoursPerDay = completedCount > 0 ? totalHours / completedCount : 0;

        // เพิ่มการคำนวณวันที่เหลือจริงๆ
        const today = new Date();
        const endDateObj = new Date(endDate);
        const remainingDays = Math.max(0, Math.ceil((endDateObj - today) / (24 * 60 * 60 * 1000)));

        console.log('Stats calculation:', {
            completedCount,
            totalHours,
            pendingCount,
            averageHoursPerDay,
            remainingDays
        });

        return res.json({
            success: true,
            message: 'ดึงข้อมูลสถิติการฝึกงานสำเร็จ',
            data: {
                total: totalDays,
                completed: parseInt(completedCount),
                pending: pendingCount,
                totalHours: parseFloat(totalHours.toFixed(1)),
                averageHoursPerDay: parseFloat(averageHoursPerDay.toFixed(1)),
                remainingDays: remainingDays,
                approvedBySupervisor: 0  // เพิ่มค่าเริ่มต้น
            }
        });

    } catch (error) {
        console.error('Get TimeSheet Stats Error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติการฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ดึงช่วงวันที่ฝึกงานจาก CS05
 */
exports.getInternshipDateRange = async (req, res) => {
    try {
        // แก้ไขตรงนี้ - ตรวจสอบว่า request มี userId หรือไม่
        if (!req.user || !req.user.userId) {
            console.error('User data not found in request:', req.user);
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        const document = await Document.findOne({
            where: {
                userId: req.user.userId,
                documentName: 'CS05',
                status: ['pending', 'approved']  // ค่อยไล่แก้ไขเป็น approved
            },
            include: [{
                model: InternshipDocument,
                as: 'internshipDocument',
                required: true,
                attributes: ['startDate', 'endDate']
            }],
            order: [['created_at', 'DESC']]
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูล CS05 ที่รออนุมัติ'  // แก้ไขข้อความให้สอดคล้องกับ status: 'pending'
            });
        }

        return res.json({
            success: true,
            message: 'ดึงข้อมูลช่วงวันที่ฝึกงานสำเร็จ',
            data: {
                startDate: document.internshipDocument.startDate,
                endDate: document.internshipDocument.endDate
            }
        });

    } catch (error) {
        console.error('Get Internship Date Range Error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลช่วงวันที่ฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * สร้างรายการวันทำงานทั้งหมด (ไม่รวมวันหยุด)
 */
exports.generateInternshipDates = async (req, res) => {
    try {
        // แก้ไขตรงนี้ - ตรวจสอบว่า request มี userId หรือไม่
        if (!req.user || !req.user.userId) {
            console.error('User data not found in request:', req.user);
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        const document = await Document.findOne({
            where: {
                userId: req.user.userId,
                documentName: 'CS05',
                status: ['pending', 'approved']  // ค่อยไล่แก้ไขเป็น approved
            },
            include: [{
                model: InternshipDocument,
                as: 'internshipDocument',
                required: true,
                attributes: ['startDate', 'endDate']
            }],
            order: [['created_at', 'DESC']]
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูล CS05 ที่รออนุมัติ'  // แก้ไขข้อความให้สอดคล้องกับ status: 'pending'
            });
        }

        const startDate = document.internshipDocument.startDate;
        const endDate = document.internshipDocument.endDate;

        // คำนวณวันทำงานทั้งหมด (ไม่รวมวันหยุด)
        const workdays = await calculateWorkdays(startDate, endDate);

        return res.json({
            success: true,
            message: 'สร้างรายการวันทำงานสำเร็จ',
            data: workdays
        });

    } catch (error) {
        console.error('Generate Internship Dates Error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการสร้างรายการวันทำงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * ดึงข้อมูลบันทึกการฝึกงานตาม ID
 */
exports.getTimeSheetEntryById = async (req, res) => {
    try {
        const student = await Student.findOne({
            where: { userId: req.user.userId }
        });
        const studentId = student.studentId;
        const logId = req.params.id;

        const entry = await InternshipLogbook.findOne({
            where: {
                logId,
                studentId
            }
        });

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลบันทึกการฝึกงาน'
            });
        }

        return res.json({
            success: true,
            message: 'ดึงข้อมูลบันทึกการฝึกงานสำเร็จ',
            data: entry
        });

    } catch (error) {
        console.error('Get TimeSheet Entry By Id Error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบันทึกการฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * บันทึกเวลาเข้างาน (Check In)
 */
exports.checkIn = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const student = await Student.findOne({
            where: { userId: req.user.userId }
        });
        
        if (!student) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลนักศึกษา'
            });
        }
        
        const studentId = student.studentId;
        const { 
            workDate, 
            timeIn,
            // เพิ่มการรองรับข้อมูลเพิ่มเติมตอนบันทึกเวลาเข้างาน
            logTitle, 
            workDescription, 
            learningOutcome, 
            problems, 
            solutions
        } = req.body;

        // ตรวจสอบว่ามี CS05 ที่รออนุมัติหรือไม่
        const document = await Document.findOne({
            where: {
                userId: req.user.userId,
                documentName: 'CS05',
                status: ['pending', 'approved']  // ค่อยไล่แก้ไขเป็น approved
            },
            include: [{
                model: InternshipDocument,
                as: 'internshipDocument',
                required: true,
                attributes: ['internshipId']
            }],
            transaction
        });

        if (!document) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูล CS05 ที่รออนุมัติ'
            });
        }

        const internshipId = document.internshipDocument.internshipId;

        // ตรวจสอบว่ามีบันทึกของวันนี้แล้วหรือไม่
        let entry = await InternshipLogbook.findOne({
            where: {
                internshipId,
                studentId,
                workDate
            },
            transaction
        });

        if (entry) {
            // ถ้ามีบันทึกแล้ว ให้อัพเดทเวลาเข้างาน และข้อมูลเพิ่มเติมหากมี
            const updateData = { timeIn };
            
            // เพิ่มข้อมูลอื่นๆ ถ้ามีการส่งมา
            if (logTitle !== undefined) updateData.logTitle = logTitle;
            if (workDescription !== undefined) updateData.workDescription = workDescription;
            if (learningOutcome !== undefined) updateData.learningOutcome = learningOutcome;
            if (problems !== undefined) updateData.problems = problems || '';
            if (solutions !== undefined) updateData.solutions = solutions || '';
            
            entry = await entry.update(updateData, { transaction });
        } else {
            // ถ้ายังไม่มีบันทึก ให้สร้างบันทึกใหม่ รวมถึงข้อมูลเพิ่มเติมที่อาจมี
            entry = await InternshipLogbook.create({
                internshipId,
                studentId,
                workDate,
                timeIn,
                timeOut: null,
                workHours: 0,
                logTitle: logTitle || '',
                workDescription: workDescription || '',
                learningOutcome: learningOutcome || '',
                problems: problems || '',
                solutions: solutions || '',
                supervisorApproved: false,
                advisorApproved: false
            }, { transaction });
        }

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'บันทึกเวลาเข้างานเรียบร้อย' + (logTitle ? ' พร้อมข้อมูลเพิ่มเติม' : ''),
            data: entry
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Check In Error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการบันทึกเวลาเข้างาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * บันทึกเวลาออกงาน (Check Out)
 */
exports.checkOut = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const student = await Student.findOne({
            where: { userId: req.user.userId }
        });
        
        if (!student) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลนักศึกษา'
            });
        }
        
        const studentId = student.studentId;
        const { 
            workDate, 
            timeOut, 
            logTitle,
            workDescription,
            learningOutcome,
            problems,
            solutions 
        } = req.body;

        // ตรวจสอบว่ามีบันทึกของวันนี้แล้วหรือไม่
        const entry = await InternshipLogbook.findOne({
            where: {
                studentId,
                workDate
            },
            transaction
        });

        if (!entry) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลการบันทึกเวลาเข้างาน กรุณาบันทึกเวลาเข้างานก่อน'
            });
        }

        // ตรวจสอบว่าบันทึกได้รับการอนุมัติแล้วหรือไม่
        if (entry.supervisorApproved || entry.advisorApproved) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'ไม่สามารถแก้ไขบันทึกที่ได้รับการอนุมัติแล้ว'
            });
        }

        // คำนวณชั่วโมงทำงาน
        const timeInParts = entry.timeIn.split(':');
        const timeOutParts = timeOut.split(':');
        
        const timeInMinutes = parseInt(timeInParts[0]) * 60 + parseInt(timeInParts[1]);
        const timeOutMinutes = parseInt(timeOutParts[0]) * 60 + parseInt(timeOutParts[1]);
        
        // ควรเพิ่มการตรวจสอบ
        if (timeOutMinutes <= timeInMinutes) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'เวลาออกงานต้องมากกว่าเวลาเข้างาน'
            });
        }

        // คำนวณชั่วโมงทำงานเป็นทศนิยม 1 ตำแหน่ง
        const workHours = Math.round((timeOutMinutes - timeInMinutes) / 30) / 2;
        
        // อัพเดทข้อมูล
        await entry.update({
            timeOut,
            workHours,
            logTitle,
            workDescription,
            learningOutcome,
            problems: problems || '',
            solutions: solutions || ''
        }, { transaction });

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'บันทึกเวลาออกงานและรายละเอียดเรียบร้อย',
            data: entry
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Check Out Error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการบันทึกเวลาออกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ฟังก์ชันสำหรับอาจารย์ที่ปรึกษาอนุมัติบันทึก
exports.approveTimeSheetEntry = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const teacherId = req.user.teacherId;
        const logId = req.params.id;
        const { comment } = req.body;

        // ดึงข้อมูลบันทึกที่ต้องการอนุมัติ
        const entry = await InternshipLogbook.findOne({
            where: { logId },
            include: [{
                model: Student,
                as: 'student',
                attributes: ['studentId', 'userId', 'advisorId'], // ระบุ attributes เฉพาะที่ต้องการ
                where: {
                    advisorId: teacherId
                },
                required: true
            }],
            transaction
        });

        if (!entry) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลบันทึกการฝึกงานหรือคุณไม่ใช่อาจารย์ที่ปรึกษาของนักศึกษาคนนี้'
            });
        }

        // อัพเดทสถานะการอนุมัติ
        await entry.update({
            advisorComment: comment || null,
            advisorApproved: true
        }, { transaction });

        await transaction.commit();

        return res.json({
            success: true,
            message: 'อนุมัติบันทึกการฝึกงานเรียบร้อย',
            data: entry
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Approve TimeSheet Entry Error:', error);
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
    const transaction = await sequelize.transaction();
    try {
        // ตรวจสอบว่ามี request.user หรือไม่
        if (!req.user || !req.user.userId) {
            await transaction.rollback();
            return res.status(401).json({
                success: false,
                message: 'ไม่พบข้อมูลผู้ใช้ โปรดเข้าสู่ระบบใหม่'
            });
        }

        // ดึงข้อมูลนักศึกษา
        const student = await Student.findOne({
            where: { userId: req.user.userId }
        });

        if (!student) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลนักศึกษา'
            });
        }

        const studentId = student.studentId;

        // ดึงข้อมูล CS05 ที่อนุมัติแล้วหรืออยู่ระหว่างรออนุมัติ
        const document = await Document.findOne({
            where: {
                userId: req.user.userId,
                documentName: 'CS05',
                status: ['pending', 'approved']
            },
            include: [{
                model: InternshipDocument,
                as: 'internshipDocument',
                required: true,
                attributes: ['internshipId']
            }],
            order: [['created_at', 'DESC']],
            transaction
        });

        if (!document) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูล CS05 ที่รออนุมัติหรือได้รับการอนุมัติแล้ว'
            });
        }

        const internshipId = document.internshipDocument.internshipId;
        
        // ตรวจสอบว่ามีข้อมูลที่จำเป็นครบหรือไม่
        const { learningOutcome, keyLearnings, futureApplication, improvements } = req.body;

        if (!learningOutcome || !keyLearnings || !futureApplication) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
            });
        }

        // ตรวจสอบว่ามีบทสรุปอยู่แล้วหรือไม่
        const existingReflection = await InternshipLogbookReflection.findOne({
            where: {
                internship_id: internshipId,
                student_id: studentId
            },
            transaction
        });

        let reflection;
        if (existingReflection) {
            // อัพเดทบทสรุปที่มีอยู่แล้ว
            reflection = await existingReflection.update({
                learning_outcome: learningOutcome,
                key_learnings: keyLearnings,
                future_application: futureApplication,
                improvements: improvements || ''
            }, { transaction });
        } else {
            // สร้างบทสรุปใหม่
            reflection = await InternshipLogbookReflection.create({
                internship_id: internshipId,
                student_id: studentId,
                learning_outcome: learningOutcome,
                key_learnings: keyLearnings,
                future_application: futureApplication,
                improvements: improvements || ''
            }, { transaction });
        }

        await transaction.commit();

        return res.status(200).json({
            success: true,
            message: 'บันทึกบทสรุปการฝึกงานเรียบร้อย',
            data: {
                id: reflection.id,
                learningOutcome: reflection.learning_outcome,
                keyLearnings: reflection.key_learnings,
                futureApplication: reflection.future_application,
                improvements: reflection.improvements
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Save Reflection Error:', error);
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

        // ดึงข้อมูลนักศึกษา
        const student = await Student.findOne({
            where: { userId: req.user.userId }
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูลนักศึกษา'
            });
        }

        const studentId = student.studentId;

        // ดึงข้อมูล CS05 
        const document = await Document.findOne({
            where: {
                userId: req.user.userId,
                documentName: 'CS05',
                status: ['pending', 'approved']
            },
            include: [{
                model: InternshipDocument,
                as: 'internshipDocument',
                required: true,
                attributes: ['internshipId']
            }],
            order: [['created_at', 'DESC']]
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบข้อมูล CS05 ที่รออนุมัติหรือได้รับการอนุมัติแล้ว'
            });
        }

        const internshipId = document.internshipDocument.internshipId;

        // ดึงบทสรุปการฝึกงาน
        const reflection = await InternshipLogbookReflection.findOne({
            where: {
                internship_id: internshipId,
                student_id: studentId
            }
        });

        if (!reflection) {
            return res.status(200).json({
                success: true,
                message: 'ยังไม่มีบทสรุปการฝึกงาน',
                data: null
            });
        }

        return res.status(200).json({
            success: true,
            message: 'ดึงบทสรุปการฝึกงานสำเร็จ',
            data: {
                id: reflection.id,
                learningOutcome: reflection.learning_outcome,
                keyLearnings: reflection.key_learnings,
                futureApplication: reflection.future_application,
                improvements: reflection.improvements,
                createdAt: reflection.created_at,
                updatedAt: reflection.updated_at
            }
        });

    } catch (error) {
        console.error('Get Reflection Error:', error);
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงบทสรุปการฝึกงาน',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};