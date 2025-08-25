'use strict';
/**
 * Seeder: Reset ข้อมูลนักศึกษา + เอกสาร/ฝึกงาน/logbooks ที่เกี่ยวข้อง ให้เป็นสถานะว่าง (clean slate)
 * ใช้สำหรับการทดสอบหรือเตรียมฐานข้อมูลใหม่โดยไม่ต้องทิ้งตาราง
 *
 * สิ่งที่จะลบ (เฉพาะข้อมูล Dynamic ของนักศึกษา):
 * - internship_logbook_attachments
 * - internship_logbook_revisions
 * - internship_logbook_reflections
 * - internship_logbooks
 * - internship_evaluations
 * - internship_documents
 * - documents (เฉพาะที่เกี่ยวกับ internship หรือเป็นของ user ที่เป็น student)
 * - student_workflow_activities
 * - student_progresses
 * - timeline_steps (ถ้าผูก student)
 * - project_documents (ของ student)
 * - project_members
 * - students (เปลี่ยนจาก "ลบ" เป็น "รีเซ็ตค่า field" ให้กลับ default และเก็บ studentCode/user mapping ไว้)
 *
 * หมายเหตุ: ไม่ลบ users / teachers / curriculums / academics เพื่อไม่ทำลาย master data
 *
 * การลบไฟล์:
 * - จะพยายาม unlink ไฟล์ใน uploads/ ที่ referenced โดย documents (file_path) และ logbook attachments
 * - ข้ามไฟล์ที่หาไม่เจอ (ไม่ throw)
 *
 * ความปลอดภัย:
 * - ป้องกันรันใน production โดยเช็ค NODE_ENV !== 'production'
 * - สามารถเปิด strict mode ด้วย ENV: ALLOW_RESET=1
 */

const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_RESET !== '1') {
      console.warn('[RESET-STUDENTS] Blocked in production. Set ALLOW_RESET=1 to override.');
      return;
    }

    const transaction = await queryInterface.sequelize.transaction();
    try {
      const sequelize = queryInterface.sequelize;

      // 1. ดึง document path & attachment path ก่อนลบ (เพื่อไปลบไฟล์)
      const [docRows] = await sequelize.query(`SELECT document_id, file_path FROM documents WHERE document_type = 'internship' OR user_id IN (SELECT user_id FROM students)`, { transaction });
      const [attachmentRows] = await sequelize.query(`SELECT file_path FROM internship_logbook_attachments`, { transaction });

      // 2. ลบตามลำดับจาก child -> parent (หลีกเลี่ยง FK constraint)
      // ใช้ raw SQL เพื่อล้างเร็ว (MySQL assumed). ถ้าใช้ DB อื่นปรับคำสั่ง
      const tablesInOrder = [
        'internship_logbook_attachments',
        'internship_logbook_revisions',
        'internship_logbook_reflections',
        'internship_logbooks',
        'internship_evaluations',
        'internship_documents',
        'document_logs',
        'project_documents',
        'project_members',
        'student_workflow_activities',
        'student_progresses',
        'timeline_steps',
  'documents'
      ];

      // เงื่อนไขพิเศษของ documents: limit เฉพาะ internship หรือที่ user เป็น student
      // เลยต้องลบ documents แยก ไม่ใช้ TRUNCATE

      for (const table of tablesInOrder) {
        if (table === 'documents') {
          await sequelize.query(`DELETE FROM documents WHERE document_type = 'internship' OR user_id IN (SELECT user_id FROM students)`, { transaction });
        } else {
          await sequelize.query(`DELETE FROM ${table}`, { transaction });
        }
      }

      // 3. รีเซ็ตค่าในตาราง students (ไม่ลบแถว) ให้กลับเป็น default ที่เหมาะสมสำหรับสถานะเริ่มใหม่
      //   หมายเหตุ: ปรับเฉพาะ field dynamic ที่เกี่ยวกับสถานะการเรียน/ฝึกงาน ไม่แก้ studentCode / userId
      await sequelize.query(`UPDATE students SET 
          total_credits = 0,
          major_credits = 0,
          gpa = NULL,
          internship_status = 'not_started',
          project_status = 'not_started',
          is_enrolled_internship = 0,
          is_enrolled_project = 0,
          is_eligible_internship = 0,
          is_eligible_project = 0,
          advisor_id = NULL
        `, { transaction });

      // 4. (อ็อปชัน) รีเซ็ต AUTO_INCREMENT (MySQL เท่านั้น) สำหรับตารางที่ล้าง (ยกเว้น students ที่ไม่ได้ลบ)
      for (const table of tablesInOrder) {
        try {
          await sequelize.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`, { transaction });
        } catch (e) {
          // ข้ามถ้าตารางไม่มี AUTO_INCREMENT หรือ DB ไม่รองรับ
        }
      }

      await transaction.commit();
      console.log('[RESET-STUDENTS] Related rows deleted & students reset successfully');

      // 5. ลบไฟล์ในระบบหลัง commit (ไม่อยู่ใน transaction)
      const uploadDir = path.join(__dirname, '..', 'uploads');
      const filesToDelete = [];
      docRows.forEach(r => { if (r.file_path) filesToDelete.push(r.file_path); });
      attachmentRows.forEach(r => { if (r.file_path) filesToDelete.push(r.file_path); });

      let deletedCount = 0;
      for (const relPath of filesToDelete) {
        // กรณี path เก็บแบบ 'uploads/xxxx' หรือ full path
        let absPath = relPath;
        if (!path.isAbsolute(absPath)) {
          absPath = path.join(uploadDir, path.basename(relPath));
        }
        try {
          if (fs.existsSync(absPath)) {
            fs.unlinkSync(absPath);
            deletedCount++;
          }
        } catch (err) {
          console.warn(`[RESET-STUDENTS] Failed to delete file: ${absPath} -> ${err.message}`);
        }
      }
      console.log(`[RESET-STUDENTS] Deleted ${deletedCount} uploaded file(s).`);

    } catch (error) {
      await transaction.rollback();
      console.error('[RESET-STUDENTS] ERROR:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // การย้อนกลับทำไม่ได้ (destructive) – อาจเลือก seed นักศึกษา default ใหม่
    console.log('[RESET-STUDENTS] down() noop');
  }
};
