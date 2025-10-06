'use strict';

/**
 * วิธีใช้งาน seeder นี้อย่างรวบรัด
 * 1. เปิดไฟล์แล้วกำหนดค่าใน `MEETING_ID_OVERRIDES` หรือ `PROJECT_ID_OVERRIDES` ให้ตรงตามประเภทโครงงานที่ต้องการ (research/private/govern)
 *    - ถ้าวางค่า `meeting_id` ระบบจะใช้ค่าดังกล่าวทันที (ความสำคัญสูงสุด)
 *    - ถ้าไม่ได้กำหนด `meeting_id` แต่ใส่ `project_id` ระบบจะหา meeting ล่าสุดของโปรเจกต์นั้นให้อัตโนมัติ
 *    - หากไม่กำหนดทั้งคู่ ระบบจะ fallback ไปดึง meeting ล่าสุดของประเภทนั้นเอง
 * 2. รันคำสั่ง seed เฉพาะไฟล์ (จากโฟลเดอร์ backend)
 *    ```powershell
 *    npm run seed:one -- 20251004093000-seed-meeting-logs-project-types.js
 *    ```
 * 3. หากต้องการล้างข้อมูลที่ seeder เพิ่มไว้ ให้สั่ง
 *    ```powershell
 *    npm run seed:undo:one -- 20251004093000-seed-meeting-logs-project-types.js
 *    ```
 * 4. seeder จะลบข้อมูลเดิมที่มี prefix `[SEED-MEETING-LOG]` ให้ก่อน insert เสมอ จึง rerun ได้ปลอดภัย
 *
 * หมายเหตุ: ใส่คอมเมนต์ภาษาไทยเพื่อให้ทีมใช้งานและบำรุงรักษาได้สะดวกตามมาตรฐานของโปรเจกต์
 */

const SEED_PREFIX = '[SEED-MEETING-LOG]';
const APPROVAL_NOTE = 'ข้อมูล seed สำหรับการทดสอบระบบ';

// สามารถแก้ไขค่า meeting_id หรือ project_id ของแต่ละประเภทได้ที่นี่ เพื่อให้ seeding ปรับตามข้อมูลจริงได้รวดเร็ว
const MEETING_ID_OVERRIDES = {
  research: null,
  private: 10,
  govern: null
};

const PROJECT_ID_OVERRIDES = {
  research: null,
  private: 47,
  govern: null
};

const PROJECT_TYPE_LABELS = {
  research: 'โครงงานพิเศษสายวิจัย',
  private: 'โครงงานพิเศษความร่วมมือภาคเอกชน',
  govern: 'โครงงานพิเศษความร่วมมือภาครัฐ'
};

// คำอธิบายย่อสำหรับ agenda แต่ละประเภท เพื่อให้ข้อความอ่านง่ายและสอดคล้องกับบริบทโครงงาน
const TYPE_SUMMARY = {
  research: 'ทดสอบการสรุปผลเชิงวิชาการและการออกแบบการทดลอง',
  private: 'ติดตามความต้องการเชิงธุรกิจกับบริษัทคู่ความร่วมมือ',
  govern: 'ปรับ timeline ให้สอดคล้องกับกฎระเบียบหน่วยงานภาครัฐ'
};

/**
 * ดึงข้อมูล meeting พร้อมตรวจสอบว่าอยู่ใน project_type ที่ต้องการ
 * มี try/catch ในระดับ caller เพื่อให้ข้ามประเภทที่ไม่พบข้อมูลได้แบบควบคุม
 */
async function fetchMeetingInfo(sequelize, meetingId, projectType, transaction) {
  const [rows] = await sequelize.query(
    `SELECT m.meeting_id, m.project_id, m.meeting_title, m.meeting_date, m.created_by,
            pd.project_type, pd.project_name_th, pd.project_name_en
       FROM meetings m
       JOIN project_documents pd ON pd.project_id = m.project_id
      WHERE m.meeting_id = :meetingId
      LIMIT 1;`,
    { replacements: { meetingId }, transaction }
  );

  if (!rows.length) {
    throw new Error(`ไม่พบ meeting_id=${meetingId} ในฐานข้อมูล`);
  }

  const meeting = rows[0];
  if (meeting.project_type !== projectType) {
    throw new Error(`meeting_id=${meetingId} อยู่ใน project_type=${meeting.project_type} ซึ่งไม่ตรงกับ ${projectType}`);
  }

  return meeting;
}

/**
 * หาค่า meeting_id ล่าสุดของ project_type ที่ระบุ หากไม่ได้ override ไว้
 */
async function findFallbackMeetingId(sequelize, projectType, transaction) {
  const [rows] = await sequelize.query(
    `SELECT m.meeting_id
       FROM meetings m
       JOIN project_documents pd ON pd.project_id = m.project_id
      WHERE pd.project_type = :projectType
      ORDER BY m.meeting_date DESC, m.meeting_id DESC
      LIMIT 1;`,
    { replacements: { projectType }, transaction }
  );

  return rows.length ? rows[0].meeting_id : null;
}

/**
 * หา meeting ล่าสุดจาก project_id ที่ระบุ
 */
async function findMeetingIdByProject(sequelize, projectId, transaction) {
  const [rows] = await sequelize.query(
    `SELECT m.meeting_id
       FROM meetings m
      WHERE m.project_id = :projectId
      ORDER BY m.meeting_date DESC, m.meeting_id DESC
      LIMIT 1;`,
    { replacements: { projectId }, transaction }
  );

  return rows.length ? rows[0].meeting_id : null;
}

/**
 * สร้าง payload ของ meeting_logs ตามแต่ละ project_type
 * ใส่ prefix เฉพาะเพื่อให้ rollback หรือค้นหาภายหลังได้ง่าย
 */
function buildLogEntries(projectType, meeting, now) {
  const label = PROJECT_TYPE_LABELS[projectType] || projectType;
  const summary = TYPE_SUMMARY[projectType] || 'ติดตามความคืบหน้ากับอาจารย์ที่ปรึกษา';
  const basePayload = {
    meeting_id: meeting.meeting_id,
    recorded_by: meeting.created_by,
    approval_status: 'approved',
    approved_by: meeting.created_by,
    approved_at: now,
    approval_note: APPROVAL_NOTE,
    created_at: now,
    updated_at: now
  };

  return [
    {
      ...basePayload,
      discussion_topic: `${SEED_PREFIX} ${label}: ทบทวนภาพรวมโครงการ`,
      current_progress: `ทีม ${meeting.project_name_th} สรุปผลการดำเนินงานรอบล่าสุด พร้อมวิเคราะห์ KPI ตามโจทย์ ${summary}.`,
      problems_issues: 'พบความเสี่ยงเรื่อง timeline กิจกรรม ต้องปรับแผนให้สอดคล้องกับการส่งมอบกลางภาค.',
      next_action_items: 'จัดทำ roadmap รายสัปดาห์ใหม่ และส่งให้ที่ปรึกษาตรวจอีกครั้งภายใน 3 วัน.',
      advisor_comment: 'แนวทางโดยรวมถูกต้อง ให้เน้นการเก็บหลักฐานการทดสอบอย่างเป็นระบบ.'
    },
    {
      ...basePayload,
      discussion_topic: `${SEED_PREFIX} ${label}: เจาะลึกงานเชิงเทคนิค`,
      current_progress: 'นำเสนอผลการทดลอง/ทดสอบฟีเจอร์หลัก พร้อมตัวอย่างสคริปต์หรือรายงานทดสอบ.',
      problems_issues: 'มีภาระงานวิชาการชนกับการเก็บ requirement ต้องแบ่งหน้าที่ให้ชัดเจนขึ้น.',
      next_action_items: 'สรุป action item รายบุคคล และจัดประชุมย่อยกับ stakeholder ก่อนรอบถัดไป.',
      advisor_comment: 'ให้บันทึกหลักฐานการสื่อสารกับคู่โครงการทุกครั้ง และเตรียม log สำหรับการประเมิน.'
    }
  ];
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const sequelize = queryInterface.sequelize;
    const transaction = await sequelize.transaction();
    const now = new Date();

    try {
      const summaries = [];
      const projectTypes = Object.keys(PROJECT_TYPE_LABELS);

      for (const projectType of projectTypes) {
        let meetingId = MEETING_ID_OVERRIDES[projectType];
        if (!meetingId) {
          const projectIdOverride = PROJECT_ID_OVERRIDES[projectType];
          if (projectIdOverride) {
            meetingId = await findMeetingIdByProject(sequelize, projectIdOverride, transaction);
            if (!meetingId) {
              console.warn(`[seed-meeting-logs] ข้าม project_type=${projectType} เพราะ project_id=${projectIdOverride} ไม่มี meeting`);
              continue;
            }
          }
        }

        if (!meetingId) {
          // ถ้าไม่กำหนดค่า override ใด ๆ จะเลือก meeting ล่าสุดของประเภทนั้น
          meetingId = await findFallbackMeetingId(sequelize, projectType, transaction);
        }

        if (!meetingId) {
          console.warn(`[seed-meeting-logs] ข้าม project_type=${projectType} เพราะไม่พบ meeting ในระบบ`);
          continue;
        }

        try {
          const meeting = await fetchMeetingInfo(sequelize, meetingId, projectType, transaction);
          const payload = buildLogEntries(projectType, meeting, now);

          if (!payload.length) {
            continue;
          }

          // ลบข้อมูลเดิมที่มี prefix เดียวกันเพื่อป้องกัน duplicate เวลา rerun seeder
          await queryInterface.bulkDelete(
            'meeting_logs',
            {
              meeting_id: meetingId,
              discussion_topic: { [Sequelize.Op.like]: `${SEED_PREFIX}%` }
            },
            { transaction }
          );

          await queryInterface.bulkInsert('meeting_logs', payload, { transaction });
          summaries.push({ projectType, meetingId, count: payload.length });
        } catch (innerErr) {
          console.warn(`[seed-meeting-logs] ข้าม project_type=${projectType} meeting_id=${meetingId}: ${innerErr.message}`);
        }
      }

      await transaction.commit();
      if (summaries.length) {
        console.log('[seed-meeting-logs] เพิ่มข้อมูลสำเร็จ:', summaries);
      } else {
        console.log('[seed-meeting-logs] ไม่ได้เพิ่ม meeting_logs รายการใหม่');
      }
    } catch (error) {
      await transaction.rollback();
      console.error('[seed-meeting-logs] ล้มเหลว:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete(
        'meeting_logs',
        { discussion_topic: { [Sequelize.Op.like]: `${SEED_PREFIX}%` } },
        { transaction }
      );
      await transaction.commit();
      console.log('[seed-meeting-logs] rollback ลบข้อมูล seed เรียบร้อย');
    } catch (error) {
      await transaction.rollback();
      console.error('[seed-meeting-logs] rollback ล้มเหลว:', error.message);
      throw error;
    }
  }
};
