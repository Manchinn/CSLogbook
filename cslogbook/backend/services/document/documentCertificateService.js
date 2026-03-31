const { Op } = require('sequelize');
const {
    User,
    Student,
    Document,
    InternshipDocument,
    Notification,
} = require('../../models');
const logger = require('../../utils/logger');

/**
 * ดึงรายการคำขอหนังสือรับรองทั้งหมด
 */
async function getCertificateRequests(filters = {}, pagination = {}) {
    try {
        const { status, studentId, academicYear, semester, search } = filters;
        const { page = 1, limit = 10 } = pagination;

        const whereClause = {};
        if (status) whereClause.status = status;
        if (studentId) whereClause.studentId = { [Op.like]: `%${studentId}%` };
        // search: ค้นหาจาก studentCode หรือชื่อ (ผ่าน include where ด้านล่าง)
        const searchCondition = search ? { [Op.or]: [
            { '$student.studentCode$': { [Op.like]: `%${search}%` } },
            { '$student.user.firstName$': { [Op.like]: `%${search}%` } },
            { '$student.user.lastName$': { [Op.like]: `%${search}%` } },
        ] } : null;

        const { InternshipCertificateRequest, InternshipLogbook } = require('../../models');

        // สร้าง include สำหรับ internship -> internshipDocument
        const includeArray = [
            {
                model: Student,
                as: 'student',
                attributes: ['studentId', 'studentCode'],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['firstName', 'lastName'],
                    },
                ],
            },
        ];

        // ถ้ามีการกรองด้วย academicYear หรือ semester ต้อง join กับ InternshipDocument
        if (academicYear || semester) {
            const internshipDocWhere = {};
            if (academicYear) internshipDocWhere.academicYear = academicYear;
            if (semester) internshipDocWhere.semester = semester;

            includeArray.push({
                model: InternshipDocument,
                as: 'internship',
                attributes: ['internshipId', 'companyName', 'academicYear', 'semester'],
                where: internshipDocWhere,
                required: true, // inner join เพื่อกรองเฉพาะที่ match
            });
        }

        const requests = await InternshipCertificateRequest.findAndCountAll({
            where: searchCondition ? { ...whereClause, ...searchCondition } : whereClause,
            include: includeArray,
            order: [['requestDate', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
        });

        // ✅ คำนวณ approvedHours จริงๆ จาก logbooks แทนที่จะใช้ค่าจาก database
        const formattedData = await Promise.all(requests.rows.map(async (request) => {
            const requestJSON = request.toJSON();

            // คำนวณ approvedHours จริงๆ
            const logbooks = await InternshipLogbook.findAll({
                where: {
                    studentId: request.studentId,
                    internshipId: request.internshipId,
                },
            });

            const approvedHours = logbooks
                .filter((log) => log.supervisorApproved === 1 || log.supervisorApproved === true)
                .reduce((sum, log) => sum + parseFloat(log.workHours || 0), 0);

            // ถ้ายังไม่มี internship ใน include (กรณีไม่มีการกรองปีการศึกษา) ให้ดึงเพิ่ม
            let internshipData = requestJSON.internship || null;
            if (!internshipData && request.internshipId) {
                const internshipDoc = await InternshipDocument.findByPk(request.internshipId, {
                    attributes: ['internshipId', 'companyName', 'academicYear', 'semester'],
                });
                if (internshipDoc) {
                    internshipData = internshipDoc.toJSON();
                }
            }

            return {
                ...requestJSON,
                totalHours: approvedHours, // ✅ ใช้ approved hours แทน
                _originalTotalHours: requestJSON.totalHours, // เก็บค่าเดิมไว้ (ถ้าต้องการ debug)
                internship: internshipData, // ✅ ส่ง academicYear & semester กลับไป
                student: request.student ? {
                    ...request.student.toJSON(),
                    fullName: `${request.student.user.firstName} ${request.student.user.lastName}`,
                } : null,
            };
        }));

        logger.info(`Retrieved ${requests.count} certificate requests with calculated approved hours`);

        return {
            data: formattedData,
            pagination: {
                total: requests.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(requests.count / parseInt(limit)),
            },
        };
    } catch (error) {
        logger.error('Error in getCertificateRequests service:', error);
        throw error;
    }
}

/**
 * ดึงรายละเอียดคำขอหนังสือรับรองเดียว (สำหรับ Admin ตรวจสอบก่อนอนุมัติ)
 * รวม: นักศึกษา, การฝึกงาน (เบื้องต้น), eligibility snapshot, evaluation (ถ้ามี)
 */
async function getCertificateRequestDetail(requestId) {
    try {
        const { InternshipCertificateRequest, Internship, InternshipEvaluation, InternshipDocument: InternshipDocModel } = require('../../models');

        const request = await InternshipCertificateRequest.findByPk(requestId, {
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['studentId', 'studentCode', 'phoneNumber'],
                    include: [
                        { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }
                    ]
                },
            ]
        });
        if (!request) throw new Error('ไม่พบคำขอหนังสือรับรอง');

        // ดึงข้อมูล internship หลัก + รายละเอียดจาก internship_documents
        let internshipInfo = null;
        let internshipDoc = null; // จากตาราง internship_documents (InternshipDocument model)
        try {
            if (Internship && request.internshipId) {
                internshipInfo = await Internship.findByPk(request.internshipId);
            }
        } catch (e) {
            logger.warn('ไม่สามารถดึงข้อมูล Internship เพิ่มเติม:', e.message);
        }
        try {
            if (InternshipDocModel && request.internshipId) {
                internshipDoc = await InternshipDocModel.findOne({ where: { internshipId: request.internshipId } });
            }
        } catch (e) {
            logger.warn('ไม่สามารถดึงข้อมูล InternshipDocument:', e.message);
        }

        // ดึงข้อมูลการประเมินล่าสุดจาก InternshipEvaluation
        let evaluationRecord = null;
        try {
            if (InternshipEvaluation) {
                evaluationRecord = await InternshipEvaluation.findOne({
                    where: { studentId: request.studentId },
                    order: [['evaluationDate', 'DESC']],
                });
            }
        } catch (e) {
            logger.warn('ไม่สามารถดึงข้อมูลการประเมิน (InternshipEvaluation):', e.message);
        }

        const overallScore = evaluationRecord?.overallScore != null ? Number(evaluationRecord.overallScore) : null;
        const { PASS_SCORE: passScore, FULL_SCORE: defaultFullScore } = require('../../config/scoring');
        let evaluationPassed = false;
        if (typeof overallScore === 'number') {
            evaluationPassed = overallScore >= passScore;
        } else if (evaluationRecord?.passFail) {
            evaluationPassed = evaluationRecord.passFail.toLowerCase() === 'pass';
        } else if (evaluationRecord?.supervisorPassDecision != null) {
            evaluationPassed = !!evaluationRecord.supervisorPassDecision;
        } else {
            evaluationPassed = request.evaluationStatus === 'completed';
        }

        // สร้าง breakdown จาก evaluationItems หรือคะแนนหมวด
        let breakdown = [];
        try {
            if (evaluationRecord?.evaluationItems) {
                const parsed = JSON.parse(evaluationRecord.evaluationItems);
                if (Array.isArray(parsed)) {
                    const categoryLabels = {
                        discipline: 'วินัยและความรับผิดชอบ',
                        behavior: 'พฤติกรรมและการปฏิบัติตน',
                        performance: 'ผลงาน / คุณภาพงาน',
                        method: 'วิธีการ / ทักษะการทำงาน',
                        relation: 'มนุษยสัมพันธ์ / การทำงานร่วมกัน'
                    };
                    const categoryCounts = {};
                    breakdown = parsed.map((it, idx) => {
                        const catKey = it.category || 'misc';
                        categoryCounts[catKey] = (categoryCounts[catKey] || 0) + 1;
                        const sequence = categoryCounts[catKey];
                        const base = categoryLabels[it.category] || it.category || `หัวข้อที่ ${idx+1}`;
                        const label = it.label || (sequence > 1 ? `${base} (#${sequence})` : base);
                        const score = it.score != null ? Number(it.score) : null;
                        const max = it.max != null ? Number(it.max) : null;
                        let percent = null;
                        if (typeof score === 'number' && typeof max === 'number' && max > 0) {
                            percent = Number(((score / max) * 100).toFixed(2));
                        }
                        return {
                            key: it.id || (it.category ? `${it.category}-${it.item || idx}` : `item-${idx}`),
                            label,
                            category: it.category || null,
                            categoryLabel: base,
                            index: idx + 1,
                            sequence, // ลำดับภายในหมวด
                            score,
                            max,
                            percent,
                            weight: it.weight != null ? Number(it.weight) : null,
                            comment: it.comment || it.notes || null,
                            raw: it // เก็บ raw เผื่อ debug ภายหลัง
                        };
                    });
                }
            } else if (
                evaluationRecord && (
                    evaluationRecord.disciplineScore != null ||
                    evaluationRecord.behaviorScore != null ||
                    evaluationRecord.performanceScore != null ||
                    evaluationRecord.methodScore != null ||
                    evaluationRecord.relationScore != null
                )
            ) {
                const cat = (label, field, key) => evaluationRecord[field] != null ? ({ key, label, score: Number(evaluationRecord[field]), max: null }) : null;
                breakdown = [
                    cat('วินัยและความรับผิดชอบ', 'disciplineScore', 'discipline'),
                    cat('พฤติกรรมและการปฏิบัติตน', 'behaviorScore', 'behavior'),
                    cat('ผลงาน / คุณภาพงาน', 'performanceScore', 'performance'),

                    cat('วิธีการ / ทักษะการทำงาน', 'methodScore', 'method'),
                    cat('มนุษยสัมพันธ์ / การทำงานร่วมกัน', 'relationScore', 'relation'),
                ].filter(Boolean);
            }
        } catch (e) {
            logger.warn('แปลง evaluationItems ล้มเหลว:', e.message);
        }

        const fullName = request.student ? `${request.student.user.firstName} ${request.student.user.lastName}` : null;

        // ✅ คำนวณ approvedHours จริงๆ จาก logbooks
        const { InternshipLogbook } = require('../../models');
        const logbooks = await InternshipLogbook.findAll({
            where: {
                studentId: request.studentId,
                internshipId: request.internshipId,
            },
        });

        const approvedHours = logbooks
            .filter((log) => log.supervisorApproved === 1 || log.supervisorApproved === true)
            .reduce((sum, log) => sum + parseFloat(log.workHours || 0), 0);

        // คำนวณคะแนนเต็มจาก breakdown items — fallback เป็น FULL_SCORE (100) เมื่อ breakdown ไม่มี max
        const breakdownMax = breakdown.length > 0
            ? breakdown.reduce((sum, item) => sum + (typeof item.max === 'number' ? item.max : 0), 0)
            : 0;
        const fullScore = breakdownMax > 0 ? breakdownMax : defaultFullScore;

        const detail = {
            id: request.id,
            status: request.status,
            requestDate: request.requestDate,
            certificateNumber: request.certificateNumber,
            student: {
                studentId: request.student?.studentId,
                studentCode: request.student?.studentCode,
                fullName,
                email: request.student?.user?.email || null,
                phone: request.student?.phoneNumber || null,
                internshipPosition: internshipDoc?.internshipPosition || null, // ตำแหน่งที่ฝึกงาน
            },
            internship: {
                companyName: internshipDoc?.companyName || internshipInfo?.companyName || null,
                location: internshipDoc?.companyAddress || internshipInfo?.province || null, // ใช้ address เป็นที่ตั้ง
                startDate: internshipDoc?.startDate || internshipInfo?.startDate || null,
                endDate: internshipDoc?.endDate || internshipInfo?.endDate || null,
                totalHours: approvedHours, // ✅ ใช้ approved hours แทน
                _originalTotalHours: request.totalHours, // เก็บค่าเดิม (ถ้าต้องการ debug)
                internshipId: request.internshipId || internshipDoc?.internshipId || null,
            },
            eligibility: {
                hours: { current: Number(approvedHours), required: 240, passed: Number(approvedHours) >= 240 },
                evaluation: {
                    status: request.evaluationStatus,
                    overallScore,
                    passScore,
                    fullScore,
                    passed: evaluationPassed
                },
                // summary เดิม (JSON) เปลี่ยนใช้สำหรับตรวจว่าพร้อมสร้าง PDF หรือไม่
                summary: { available: request.summaryStatus === 'submitted' }
            },
            evaluationDetail: {
                overallScore,
                passScore,
                fullScore,
                passed: evaluationPassed,
                submittedAt: evaluationRecord?.evaluationDate || null,
                updatedAt: evaluationRecord?.updated_at || null,
                evaluatorName: evaluationRecord?.evaluatorName || null,
                strengths: evaluationRecord?.strengths || null,
                weaknessesToImprove: evaluationRecord?.weaknessesToImprove || null,
                additionalComments: evaluationRecord?.additionalComments || null,
                breakdown
            }
        };

        return detail;
    } catch (error) {
        logger.error('Error in getCertificateRequestDetail service:', error);
        throw error;
    }
}

/**
 * ดึงสรุปภาพรวมการฝึกงาน (summary) สำหรับ admin
 */
async function getInternshipSummary(internshipId) {
    try {
        const { Internship, InternshipEvaluation, InternshipCertificateRequest } = require('../../models');
        const internship = Internship ? await Internship.findByPk(internshipId) : null;
        if (!internship) throw new Error('ไม่พบข้อมูลการฝึกงาน');

        // ดึง evaluation ล่าสุด
        let evaluation = null;
        if (InternshipEvaluation) {
            evaluation = await InternshipEvaluation.findOne({ where: { internshipId }, order: [['evaluationDate', 'DESC']] });
        }
        let breakdown = [];
        if (evaluation?.evaluationItems) {
            try {
                const parsed = JSON.parse(evaluation.evaluationItems);
                if (Array.isArray(parsed)) {
                    breakdown = parsed.map((it, idx) => ({
                        key: it.category ? `${it.category}-${idx}` : `item-${idx}`,
                        category: it.category || null,
                        label: it.label || it.category || `หัวข้อที่ ${idx+1}`,
                        score: it.score ?? null,
                        max: it.max ?? null,
                    }));
                }
            } catch (e) {}
        }

        // หา certificate request ล่าสุดเพื่อดึง totalHours
        let certificateReq = null;
        if (InternshipCertificateRequest) {
            certificateReq = await InternshipCertificateRequest.findOne({ where: { internshipId }, order: [['requestDate','DESC']] });
        }

        return {
            internshipId,
            companyName: internship.companyName || null,
            period: { startDate: internship.startDate, endDate: internship.endDate },
            totalHours: certificateReq?.totalHours || null,
            evaluation: evaluation ? {
                overallScore: evaluation.overallScore,
                evaluatorName: evaluation.evaluatorName,
                evaluationDate: evaluation.evaluationDate,
                passed: evaluation.passFail ? evaluation.passFail.toLowerCase() === 'pass' : null,
                strengths: evaluation.strengths,
                weaknessesToImprove: evaluation.weaknessesToImprove,
                additionalComments: evaluation.additionalComments,
                breakdown
            } : null,
            updatedAt: new Date()
        };
    } catch (error) {
        logger.error('Error in getInternshipSummary service:', error);
        throw error;
    }
}

/**
 * 🆕 ดึงข้อมูล summary logbook (full) + buffer PDF (เลือกได้) สำหรับ admin
 * @param {number} internshipId
 * @param {object} options { pdf?: boolean }
 */
async function getInternshipLogbookSummary(internshipId, options = {}) {
    const { pdf = false } = options;
    try {
        const summaryFull = await require('../internshipLogbookService').getInternshipSummaryByInternshipId(internshipId);
        if (!summaryFull) throw new Error('ไม่พบข้อมูลสรุปบันทึกฝึกงาน');
        let pdfBuffer = null;
        if (pdf) {
            pdfBuffer = await require('../internshipLogbookService').generateInternshipSummaryPDF(summaryFull);
        }
        return { summaryFull, pdfBuffer };
    } catch (error) {
        logger.error('Error in getInternshipLogbookSummary service:', error);
        throw error;
    }
}

/**
 * อนุมัติคำขอหนังสือรับรอง
 */
async function approveCertificateRequest(requestId, processorId, certificateNumber = null) {
    try {
        const { InternshipCertificateRequest } = require('../../models');

        const request = await InternshipCertificateRequest.findByPk(requestId);
        if (!request) {
            throw new Error('ไม่พบคำขอหนังสือรับรอง');
        }

        if (request.status !== 'pending') {
            throw new Error('คำขอนี้ได้รับการดำเนินการแล้ว');
        }

        // สร้างหมายเลขหนังสือรับรองอัตโนมัติ
        const generateCertificateNumber = () => {
            const year = new Date().getFullYear() + 543; // พ.ศ.
            const month = String(new Date().getMonth() + 1).padStart(2, '0');
            const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
            return `ว ${year}/${month}/${random}`;
        };

        // อัปเดตสถานะ
        await request.update({
            status: 'approved',
            certificateNumber: certificateNumber || generateCertificateNumber(),
            processedAt: new Date(),
            processedBy: processorId,
        });

        // ✅ Update workflow และ Student.internshipStatus - การฝึกงานเสร็จสมบูรณ์
        try {
            const { Internship, Student: StudentModel } = require('../../models');
            const internship = await Internship.findByPk(request.internshipId, {
                include: [{ model: StudentModel, as: 'student' }]
            });

            if (internship?.student) {
                const workflowService = require('../workflowService');

                // 1. อัพเดท workflow
                await workflowService.updateStudentWorkflowActivity(
                    internship.student.studentId,
                    'internship',
                    'INTERNSHIP_COMPLETED',
                    'completed',
                    'completed',
                    {
                        certificateApprovedAt: new Date().toISOString(),
                        certificateNumber: request.certificateNumber,
                        processedBy: processorId
                    }
                );

                // 2. ✅ อัพเดท Student.internshipStatus เป็น 'completed'
                await StudentModel.update(
                    { internshipStatus: 'completed' },
                    { where: { studentId: internship.student.studentId } }
                );

                logger.info(`Updated workflow and student status to COMPLETED for student ${internship.student.studentId} (certificate approved)`);
            }
        } catch (workflowError) {
            logger.error('Error updating workflow and student status after certificate approval:', workflowError);
            // ไม่ throw error เพราะ certificate ได้รับการอนุมัติแล้ว
        }

        // สร้างการแจ้งเตือน
        await createCertificateApprovalNotification(request);

        logger.info(`Certificate request approved: ${requestId} by ${processorId}`);
        return request;
    } catch (error) {
        logger.error('Error in approveCertificateRequest service:', error);
        throw error;
    }
}

/**
 * ปฏิเสธคำขอหนังสือรับรอง
 */
async function rejectCertificateRequest(requestId, processorId, remarks = null) {
    try {
        const { InternshipCertificateRequest } = require('../../models');

        const request = await InternshipCertificateRequest.findByPk(requestId);
        if (!request) {
            throw new Error('ไม่พบคำขอหนังสือรับรอง');
        }

        if (request.status === 'rejected') {
            const err = new Error('คำขอนี้ถูกปฏิเสธแล้ว');
            err.statusCode = 400;
            throw err;
        }
        if (request.status !== 'pending') {
            const err = new Error('คำขอนี้ได้รับการดำเนินการแล้ว');
            err.statusCode = 400;
            throw err;
        }

        // อัปเดตสถานะ
        await request.update({
            status: 'rejected',
            remarks: remarks || 'ไม่ผ่านเงื่อนไขการขอหนังสือรับรอง',
            processedAt: new Date(),
            processedBy: processorId,
        });

        // สร้างการแจ้งเตือน
        await createCertificateRejectionNotification(request, remarks);

        logger.info(`Certificate request rejected: ${requestId} by ${processorId}`);
        return request;
    } catch (error) {
        logger.error('Error in rejectCertificateRequest service:', error);
        throw error;
    }
}

/**
 * สร้าง PDF หนังสือรับรอง
 */
async function generateCertificatePDF(requestId) {
    try {
        const { InternshipCertificateRequest } = require('../../models');
        const internshipCertificateService = require('../internship/certificate.service');

        // Query request เพื่อหา userId ของนักศึกษา
        const request = await InternshipCertificateRequest.findByPk(requestId, {
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['userId'],
                },
            ],
        });

        if (!request) {
            throw new Error('ไม่พบคำขอหนังสือรับรอง');
        }

        if (request.status !== 'approved') {
            throw new Error('คำขอยังไม่ได้รับการอนุมัติ');
        }

        // ใช้ certificate.service.js ที่มี pdfkit + Thai font จริง
        const userId = request.student.userId;
        const certificateData = await internshipCertificateService.getCertificateData(userId);
        const pdfBuffer = await internshipCertificateService.createCertificatePDF(certificateData);

        logger.info(`Certificate PDF generated for request: ${requestId}`);
        return pdfBuffer;
    } catch (error) {
        logger.error('Error in generateCertificatePDF service:', error);
        throw error;
    }
}

/**
 * ส่งการแจ้งเตือนการอนุมัติ
 */
async function createCertificateApprovalNotification(request) {
    try {
        await Notification.create({
            userId: request.requestedBy,
            title: 'หนังสือรับรองการฝึกงานได้รับการอนุมัติแล้ว',
            message: `หนังสือรับรองการฝึกงานหมายเลข ${request.certificateNumber} ได้รับการอนุมัติแล้ว สามารถดาวน์โหลดได้ที่หน้าสถานะการฝึกงาน`,
            type: 'certificate_approved',
            referenceId: request.id,
            isRead: false
        });
        logger.info('Certificate approval notification created');
    } catch (error) {
        logger.error('Error creating certificate approval notification:', error);
        // ไม่ throw error เนื่องจากเป็น optional feature
    }
}

/**
 * ส่งการแจ้งเตือนการปฏิเสธ
 */
async function createCertificateRejectionNotification(request, remarks) {
    try {
        await Notification.create({
            userId: request.requestedBy,
            title: 'หนังสือรับรองการฝึกงานถูกปฏิเสธ',
            message: `คำขอหนังสือรับรองการฝึกงานของคุณถูกปฏิเสธ เหตุผล: ${remarks || 'ไม่ระบุเหตุผล'}`,
            type: 'certificate_rejected',
            referenceId: request.id,
            isRead: false
        });
        logger.info('Certificate rejection notification created');
    } catch (error) {
        logger.error('Error creating certificate rejection notification:', error);
        // ไม่ throw error เนื่องจากเป็น optional feature
    }
}

module.exports = {
    getCertificateRequests,
    getCertificateRequestDetail,
    approveCertificateRequest,
    rejectCertificateRequest,
    generateCertificatePDF,
    getInternshipSummary,
    getInternshipLogbookSummary,
    createCertificateApprovalNotification,
    createCertificateRejectionNotification,
};
