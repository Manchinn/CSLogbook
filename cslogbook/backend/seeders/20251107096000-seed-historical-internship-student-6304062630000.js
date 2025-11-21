'use strict';

const { QueryTypes, Op } = require('sequelize');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const THAI_TZ = 'Asia/Bangkok';
const SEED_KEY = 'HISTORICAL_SEED_6304062630000_BATCH5';
const TARGET_STUDENT_CODES = [
  '6304062630000',
  '6304062630001',
  '6304062630002',
  '6304062630003',
  '6304062630004'
];

const toThaiDate = (dateString) => dayjs.tz(dateString, THAI_TZ).toDate();
const toThaiDateTime = (dateString) => dayjs.tz(dateString, THAI_TZ).toDate();

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      for (const TARGET_STUDENT_CODE of TARGET_STUDENT_CODES) {
        const ACADEMIC_YEAR = 2566;
        const SEMESTER = 1;

        const studentRows = await queryInterface.sequelize.query(
          `SELECT student_id, user_id, internship_status, project_status, is_enrolled_internship, is_enrolled_project
           FROM students WHERE student_code = ? LIMIT 1`,
          {
            replacements: [TARGET_STUDENT_CODE],
            type: QueryTypes.SELECT,
            transaction
          }
        );

        if (studentRows.length === 0) {
          throw new Error(`ไม่พบนักศึกษาที่มี student_code = ${TARGET_STUDENT_CODE}. กรุณารัน seeder สำหรับรายชื่อนักศึกษา batch 63 ก่อน`);
        }

        const targetStudent = studentRows[0];
        const { student_id: studentId, user_id: userId } = targetStudent;

        const existingDocument = await queryInterface.sequelize.query(
          `SELECT document_id FROM documents WHERE user_id = ? AND file_path = ? LIMIT 1`,
          {
            replacements: [userId, `historical/cs05-${TARGET_STUDENT_CODE}.pdf`],
            type: QueryTypes.SELECT,
            transaction
          }
        );

        if (existingDocument.length > 0) {
          console.log(`พบข้อมูล mock workflow สำหรับนักศึกษา ${TARGET_STUDENT_CODE} แล้ว. ข้ามการ seed.`);
          continue;
        }

        const documentPayload = {
          user_id: userId,
          document_type: 'internship',
          document_name: 'CS05',
          category: 'proposal',
          status: 'completed',
          file_path: `historical/cs05-${TARGET_STUDENT_CODE}.pdf`,
          file_size: 204800,
          mime_type: 'application/pdf',
          review_date: toThaiDateTime('2023-02-20T09:15:00'),
          review_comment: 'อนุมัติคำร้องฝึกงานเรียบร้อย',
          due_date: toThaiDateTime('2023-02-15T16:00:00'),
          download_status: 'downloaded',
          downloaded_at: toThaiDateTime('2023-03-01T09:00:00'),
          download_count: 1,
          submitted_at: toThaiDateTime('2023-02-05T14:30:00'),
          is_late: false,
          late_minutes: 0,
          late_reason: null,
          submitted_late: false,
          submission_delay_minutes: null,
          created_at: toThaiDateTime('2023-02-05T14:30:00'),
          updated_at: toThaiDateTime('2023-08-22T15:45:00')
        };

        await queryInterface.bulkInsert('documents', [documentPayload], { transaction });

        const [insertedDocument] = await queryInterface.sequelize.query(
          `SELECT document_id FROM documents WHERE user_id = ? AND file_path = ? ORDER BY document_id DESC LIMIT 1`,
          {
            replacements: [userId, documentPayload.file_path],
            type: QueryTypes.SELECT,
            transaction
          }
        );

        if (!insertedDocument) {
          throw new Error('ไม่สามารถดึง document_id ที่เพิ่งเพิ่มได้');
        }

        const documentId = insertedDocument.document_id;

        const internshipPayload = {
          document_id: documentId,
          company_name: 'บริษัท ทดสอบย้อนหลัง จำกัด',
          company_address: '999 ถ.ประวัติศาสตร์ แขวงบางซื่อ เขตบางซื่อ กรุงเทพมหานคร 10800',
          internship_position: 'Full-stack Developer (Intern)',
          contact_person_name: 'คุณสำเร็จ ครบถ้วน',
          contact_person_position: 'HR Manager',
          supervisor_name: 'คุณสำเร็จ ครบถ้วน',
          supervisor_position: 'Lead Engineer',
          supervisor_phone: '089-999-8888',
          supervisor_email: 'success@historical-test.com',
          start_date: toThaiDate('2023-05-15'),
          end_date: toThaiDate('2023-08-04'),
          academic_year: ACADEMIC_YEAR,
          semester: SEMESTER,
          created_at: toThaiDateTime('2023-02-21T10:00:00'),
          updated_at: toThaiDateTime('2023-08-22T15:45:00')
        };

        await queryInterface.bulkInsert('internship_documents', [internshipPayload], { transaction });

        const [insertedInternship] = await queryInterface.sequelize.query(
          `SELECT internship_id FROM internship_documents WHERE document_id = ? ORDER BY internship_id DESC LIMIT 1`,
          {
            replacements: [documentId],
            type: QueryTypes.SELECT,
            transaction
          }
        );

        if (!insertedInternship) {
          throw new Error('ไม่สามารถดึง internship_id ที่เพิ่งเพิ่มได้');
        }

        const internshipId = insertedInternship.internship_id;

        const logbookEntries = [];
        let currentDate = dayjs.tz('2023-05-15', THAI_TZ);
        const endDate = dayjs.tz('2023-08-04', THAI_TZ);

        while (!currentDate.isAfter(endDate)) {
          const dayOfWeek = currentDate.day();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            const logTitle = `[${SEED_KEY}] บันทึกการฝึกงานประจำวันที่ ${currentDate.format('DD/MM/YYYY')} (${TARGET_STUDENT_CODE})`;
            const workDescription = `งานประจำวันของนักศึกษา ${TARGET_STUDENT_CODE} (seed historical)`;
            const supervisorApprovalAt = currentDate.clone().add(1, 'day').hour(10).minute(30);
            const createdAt = currentDate.clone().hour(18).minute(0);

            logbookEntries.push({
              internship_id: internshipId,
              student_id: studentId,
              academic_year: ACADEMIC_YEAR,
              semester: SEMESTER,
              work_date: currentDate.format('YYYY-MM-DD'),
              log_title: logTitle,
              work_description: workDescription,
              learning_outcome: 'เพิ่มพูนทักษะการพัฒนาระบบและการทำงานร่วมทีม',
              problems: 'ไม่มีปัญหา',
              solutions: 'ดำเนินงานตามแผนที่กำหนด',
              work_hours: 8,
              time_in: '09:00',
              time_out: '17:00',
              supervisor_comment: 'อนุมัติบันทึกและให้ข้อเสนอแนะเพิ่มเติม',
              supervisor_approved: 1,
              supervisor_approved_at: supervisorApprovalAt.toDate(),
              supervisor_rejected_at: null,
              advisor_comment: null,
              advisor_approved: false,
              created_at: createdAt.toDate(),
              updated_at: supervisorApprovalAt.toDate()
            });
          }
          currentDate = currentDate.add(1, 'day');
        }

        if (logbookEntries.length > 0) {
          await queryInterface.bulkInsert('internship_logbooks', logbookEntries, { transaction });
        }

        const evaluationPayload = {
          internship_id: internshipId,
          student_id: studentId,
          evaluator_name: 'คุณสำเร็จ ครบถ้วน',
          evaluation_date: toThaiDateTime('2023-08-08T10:00:00'),
          overall_score: 95,
          strengths: 'มีความรับผิดชอบสูง ทำงานร่วมทีมได้ดี',
          weaknesses_to_improve: 'ควรปรับปรุงความเร็วในการจัดทำเอกสารเทคนิค',
          additional_comments: `[${SEED_KEY}] เป็นนักศึกษาที่สร้างคุณค่าให้กับทีม`,
          status: 'completed',
          evaluated_by_supervisor_at: toThaiDateTime('2023-08-08T10:00:00'),
          evaluation_items: JSON.stringify([
            { category: 'discipline', label: 'ความรับผิดชอบต่อหน้าที่', score: 5, max: 5 },
            { category: 'behavior', label: 'การปฏิบัติตนในสถานประกอบการ', score: 5, max: 5 },
            { category: 'performance', label: 'คุณภาพผลงาน', score: 4, max: 5 },
            { category: 'method', label: 'กระบวนการทำงาน', score: 5, max: 5 },
            { category: 'relation', label: 'ทักษะการทำงานร่วมกัน', score: 5, max: 5 }
          ]),
          discipline_score: 5,
          behavior_score: 5,
          performance_score: 4,
          method_score: 5,
          relation_score: 5,
          supervisor_pass_decision: true,
          pass_fail: 'pass',
          pass_evaluated_at: toThaiDateTime('2023-08-08T10:00:00'),
          created_at: toThaiDateTime('2023-08-08T10:00:00'),
          updated_at: toThaiDateTime('2023-08-08T10:00:00')
        };

        await queryInterface.bulkInsert('internship_evaluations', [evaluationPayload], { transaction });

        const certificatePayload = {
          student_id: TARGET_STUDENT_CODE,
          internship_id: internshipId,
          document_id: documentId,
          request_date: toThaiDateTime('2023-08-15T09:00:00'),
          status: 'approved',
          total_hours: logbookEntries.length * 8,
          evaluation_status: 'completed',
          summary_status: 'submitted',
          requested_by: userId,
          processed_at: toThaiDateTime('2023-08-16T15:30:00'),
          processed_by: 1,
          certificate_number: `CSLOG-2566-${TARGET_STUDENT_CODE.slice(-4)}`,
          downloaded_at: toThaiDateTime('2023-08-17T10:00:00'),
          download_count: 1,
          remarks: `[${SEED_KEY}] จำลองคำขอใบรับรองฝึกงาน`,
          created_at: toThaiDateTime('2023-08-15T09:00:00'),
          updated_at: toThaiDateTime('2023-08-17T10:00:00')
        };

        await queryInterface.bulkInsert('internship_certificate_requests', [certificatePayload], { transaction });

        const workflowPayload = JSON.stringify({
          seedKey: SEED_KEY,
          academicYear: ACADEMIC_YEAR,
          semester: SEMESTER,
          certificateNumber: certificatePayload.certificate_number,
          studentCode: TARGET_STUDENT_CODE,
          steps: [
            { key: 'INTERNSHIP_ELIGIBILITY_MET', status: 'completed', completedAt: '2023-01-10T09:00:00' },
            { key: 'INTERNSHIP_CS05_SUBMITTED', status: 'completed', completedAt: '2023-02-05T14:30:00' },
            { key: 'INTERNSHIP_CS05_APPROVED', status: 'completed', completedAt: '2023-02-20T09:15:00' },
            { key: 'INTERNSHIP_COMPANY_RESPONSE_RECEIVED', status: 'completed', completedAt: '2023-03-15T11:00:00' },
            { key: 'INTERNSHIP_AWAITING_START', status: 'completed', completedAt: '2023-03-15T11:00:00' },
            { key: 'INTERNSHIP_IN_PROGRESS', status: 'completed', completedAt: '2023-05-15T08:30:00' },
            { key: 'INTERNSHIP_SUMMARY_PENDING', status: 'completed', completedAt: '2023-08-04T17:00:00' },
            { key: 'INTERNSHIP_COMPLETED', status: 'completed', completedAt: '2023-08-16T15:30:00' }
          ]
        });

        await queryInterface.bulkInsert('student_workflow_activities', [
          {
            student_id: studentId,
            workflow_type: 'internship',
            current_step_key: 'INTERNSHIP_COMPLETED',
            current_step_status: 'completed',
            overall_workflow_status: 'completed',
            data_payload: workflowPayload,
            started_at: toThaiDateTime('2023-01-10T09:00:00'),
            completed_at: toThaiDateTime('2023-08-16T15:30:00'),
            created_at: toThaiDateTime('2023-01-10T09:00:00'),
            updated_at: toThaiDateTime('2023-08-16T15:30:00')
          }
        ], { transaction });

        await queryInterface.bulkUpdate(
          'students',
          {
            internship_status: 'completed',
            project_status: 'not_started',
            is_enrolled_internship: true,
            is_enrolled_project: false,
            updated_at: toThaiDateTime('2023-08-17T10:00:00')
          },
          { student_id: studentId },
          { transaction }
        );
      }

      await transaction.commit();
      console.log(`Seeded full internship workflow for ${TARGET_STUDENT_CODES.length} students.`);
    } catch (error) {
      await transaction.rollback();
      console.error('Failed to seed full workflow for historical student:', error);
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      for (const TARGET_STUDENT_CODE of TARGET_STUDENT_CODES) {
        const studentRows = await queryInterface.sequelize.query(
          `SELECT student_id, user_id FROM students WHERE student_code = ? LIMIT 1`,
          {
            replacements: [TARGET_STUDENT_CODE],
            type: QueryTypes.SELECT,
            transaction
          }
        );

        if (studentRows.length === 0) {
          console.warn(`ไม่พบนักศึกษาที่มีรหัส ${TARGET_STUDENT_CODE} ในระบบ. ข้ามการ rollback.`);
          continue;
        }

        const { student_id: studentId, user_id: userId } = studentRows[0];

        const [document] = await queryInterface.sequelize.query(
          `SELECT document_id FROM documents WHERE user_id = ? AND file_path = ? LIMIT 1`,
          {
            replacements: [userId, `historical/cs05-${TARGET_STUDENT_CODE}.pdf`],
            type: QueryTypes.SELECT,
            transaction
          }
        );

        const documentId = document?.document_id;

        let internshipId = null;
        if (documentId) {
          const [internship] = await queryInterface.sequelize.query(
            `SELECT internship_id FROM internship_documents WHERE document_id = ? LIMIT 1`,
            {
              replacements: [documentId],
              type: QueryTypes.SELECT,
              transaction
            }
          );
          internshipId = internship?.internship_id || null;
        }

        await queryInterface.bulkDelete(
          'student_workflow_activities',
          {
            student_id: studentId,
            workflow_type: 'internship',
            data_payload: { [Op.like]: `%${SEED_KEY}%` }
          },
          { transaction }
        );

        await queryInterface.bulkDelete(
          'internship_certificate_requests',
          {
            internship_id: internshipId,
            remarks: { [Op.like]: `%${SEED_KEY}%` }
          },
          { transaction }
        );

        if (internshipId) {
          await queryInterface.bulkDelete(
            'internship_evaluations',
            {
              internship_id: internshipId,
              student_id: studentId,
              additional_comments: { [Op.like]: `%${SEED_KEY}%` }
            },
            { transaction }
          );

          await queryInterface.bulkDelete(
            'internship_logbooks',
            {
              internship_id: internshipId,
              student_id: studentId,
              log_title: { [Op.like]: `%${SEED_KEY}%` }
            },
            { transaction }
          );

          await queryInterface.bulkDelete(
            'internship_documents',
            { document_id: documentId },
            { transaction }
          );
        }

        if (documentId) {
          await queryInterface.bulkDelete(
            'documents',
            { document_id: documentId },
            { transaction }
          );
        }

        await queryInterface.bulkUpdate(
          'students',
          {
            internship_status: 'not_started',
            is_enrolled_internship: false,
            updated_at: dayjs.tz(THAI_TZ).toDate()
          },
          { student_id: studentId },
          { transaction }
        );
      }

      await transaction.commit();
      console.log(`Reverted historical workflow seed for students ${TARGET_STUDENT_CODES.join(', ')}.`);
    } catch (error) {
      await transaction.rollback();
      console.error('Failed to revert historical workflow seed:', error);
      throw error;
    }
  }
};

