/**
 * Backfill Script: เติมข้อมูลเข้า project_workflow_states จากโครงงานที่มีอยู่แล้ว
 * 
 * จุดประสงค์: คำนวณ current_phase จากสถานะปัจจุบันในตาราง project_documents, 
 *             project_exam_results, และ project_defense_requests
 * 
 * วิธีใช้: node backend/scripts/backfillProjectWorkflowStates.js
 */

const { 
  ProjectDocument, 
  ProjectWorkflowState, 
  ProjectExamResult, 
  ProjectDefenseRequest,
  Meeting,
  MeetingLog,
  sequelize 
} = require('../models');

const { Op } = require('sequelize');

/**
 * คำนวณ phase ที่เหมาะสมจากข้อมูลปัจจุบัน
 */
function calculatePhaseFromProject(project, topicExam, thesisExam, topicDefense, thesisDefense) {
  // 1. ตรวจสอบผลสอบปริญญานิพนธ์ก่อน (THESIS)
  if (thesisExam) {
    if (thesisExam.result === 'PASS') {
      return 'COMPLETED'; // เสร็จสิ้นทุกอย่าง
    } else if (thesisExam.result === 'FAIL') {
      // ถ้านักศึกษา acknowledge แล้ว ให้ ARCHIVED
      return project.studentAcknowledgedAt ? 'ARCHIVED' : 'THESIS_FAILED';
    }
  }

  // 2. ถ้ามีคำขอสอบปริญญานิพนธ์ แต่ยังไม่มีผลสอบ
  if (thesisDefense) {
    if (thesisDefense.status === 'scheduled') {
      return 'THESIS_EXAM_SCHEDULED';
    } else if (['submitted', 'advisor_approved', 'staff_verified'].includes(thesisDefense.status)) {
      return 'THESIS_EXAM_PENDING';
    }
  }

  // 3. ตรวจสอบผลสอบหัวข้อ (PROJECT1)
  if (topicExam) {
    if (topicExam.result === 'PASS') {
      // ผ่านสอบหัวข้อแล้ว กำลังดำเนินงาน
      // ตรวจสอบว่ากำลังยื่นสอบปริญญานิพนธ์หรือไม่
      if (project.status === 'thesis_submission') {
        return 'THESIS_SUBMISSION';
      }
      return 'IN_PROGRESS';
    } else if (topicExam.result === 'FAIL') {
      // สอบหัวข้อไม่ผ่าน
      return project.studentAcknowledgedAt ? 'ARCHIVED' : 'TOPIC_FAILED';
    }
  }

  // 4. ถ้ามีคำขอสอบหัวข้อ แต่ยังไม่มีผลสอบ
  if (topicDefense) {
    if (topicDefense.status === 'scheduled') {
      return 'TOPIC_EXAM_SCHEDULED';
    } else if (['submitted', 'advisor_approved', 'staff_verified'].includes(topicDefense.status)) {
      return 'TOPIC_EXAM_PENDING';
    }
  }

  // 5. ตรวจสอบสถานะโครงงาน
  if (project.status === 'topic_submission' || project.status === 'defense_submission') {
    return 'TOPIC_SUBMISSION';
  }

  if (project.status === 'advisor_assigned' || project.status === 'active') {
    return 'ADVISOR_ASSIGNED';
  }

  if (project.status === 'pending_advisor') {
    return 'PENDING_ADVISOR';
  }

  if (project.status === 'archived') {
    return 'ARCHIVED';
  }

  if (project.status === 'completed') {
    return 'COMPLETED';
  }

  // 6. Default เป็น DRAFT
  return 'DRAFT';
}

/**
 * นับจำนวน meeting และ approved meeting
 */
async function countMeetings(projectId) {
  const meetings = await Meeting.findAll({
    where: { projectId },
    include: [{
      model: MeetingLog,
      as: 'logs',
      required: false
    }]
  });

  let totalMeetings = 0;
  let approvedMeetings = 0;

  for (const meeting of meetings) {
    if (meeting.logs && meeting.logs.length > 0) {
      totalMeetings += meeting.logs.length;
      approvedMeetings += meeting.logs.filter(log => log.advisorApprovalStatus === 'approved').length;
    }
  }

  return { totalMeetings, approvedMeetings };
}

/**
 * Main function: Backfill ข้อมูลทั้งหมด
 */
async function backfillStates() {
  console.log('🚀 เริ่ม backfill project workflow states...\n');

  try {
    // ดึงโครงงานทั้งหมด
    const projects = await ProjectDocument.findAll({
      include: [
        { 
          model: ProjectExamResult, 
          as: 'examResults',
          required: false
        },
        { 
          model: ProjectDefenseRequest, 
          as: 'defenseRequests',
          required: false
        }
      ]
    });

    console.log(`📊 พบโครงงานทั้งหมด: ${projects.length} โครงงาน\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const project of projects) {
      try {
        // ตรวจสอบว่ามี state แล้วหรือยัง
        const existing = await ProjectWorkflowState.findOne({ 
          where: { projectId: project.projectId } 
        });
        
        if (existing) {
          console.log(`⏭️  ข้าม project ${project.projectId} (${project.projectName}) - มี state แล้ว`);
          skipped++;
          continue;
        }

        // ค้นหาข้อมูลที่เกี่ยวข้อง
        const topicExam = project.examResults?.find(e => e.examType === 'PROJECT1');
        const thesisExam = project.examResults?.find(e => e.examType === 'THESIS');
        
        const topicDefense = project.defenseRequests?.find(
          r => r.defenseType === 'PROJECT1' && r.status !== 'cancelled'
        );
        const thesisDefense = project.defenseRequests?.find(
          r => r.defenseType === 'THESIS' && r.status !== 'cancelled'
        );

        // คำนวณ phase
        const phase = calculatePhaseFromProject(
          project, 
          topicExam, 
          thesisExam, 
          topicDefense, 
          thesisDefense
        );

        // นับ meetings
        const { totalMeetings, approvedMeetings } = await countMeetings(project.projectId);

        // ตรวจสอบว่าถูก block หรือไม่
        const isBlocked = phase === 'TOPIC_FAILED' || phase === 'THESIS_FAILED';
        let blockReason = null;
        if (phase === 'TOPIC_FAILED') {
          blockReason = 'สอบหัวข้อไม่ผ่าน ต้องยื่นหัวข้อใหม่';
        } else if (phase === 'THESIS_FAILED') {
          blockReason = 'สอบปริญญานิพนธ์ไม่ผ่าน ต้องดำเนินการแก้ไข';
        }

        // สร้าง state
        await ProjectWorkflowState.create({
          projectId: project.projectId,
          currentPhase: phase,
          projectStatus: project.status,
          topicExamResult: topicExam?.result || null,
          topicExamDate: topicExam?.examDate || null,
          thesisExamResult: thesisExam?.result || null,
          thesisExamDate: thesisExam?.examDate || null,
          topicDefenseRequestId: topicDefense?.requestId || null,
          topicDefenseStatus: topicDefense?.status || null,
          thesisDefenseRequestId: thesisDefense?.requestId || null,
          thesisDefenseStatus: thesisDefense?.status || null,
          meetingCount: totalMeetings,
          approvedMeetingCount: approvedMeetings,
          isBlocked,
          blockReason,
          lastActivityAt: project.updatedAt,
          lastActivityType: 'backfill_initial'
        });

        console.log(`✅ สร้าง state สำหรับ project ${project.projectId} - ${project.projectName}`);
        console.log(`   Phase: ${phase} | Meetings: ${approvedMeetings}/${totalMeetings} | Blocked: ${isBlocked}`);
        created++;

      } catch (error) {
        console.error(`❌ Error processing project ${project.projectId}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 สรุปผลการ Backfill:');
    console.log(`   ✅ สร้างใหม่:     ${created} โครงงาน`);
    console.log(`   ⏭️  ข้าม:         ${skipped} โครงงาน`);
    console.log(`   ❌ Error:        ${errors} โครงงาน`);
    console.log(`   📦 ทั้งหมด:      ${projects.length} โครงงาน`);
    console.log('='.repeat(60));

    // ตรวจสอบสถิติ
    console.log('\n📈 สถิติ Phase ที่สร้าง:');
    const phaseCounts = await ProjectWorkflowState.findAll({
      attributes: [
        'currentPhase',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['currentPhase'],
      raw: true
    });

    for (const row of phaseCounts) {
      console.log(`   ${row.currentPhase.padEnd(25)}: ${row.count}`);
    }

    console.log('\n✅ Backfill เสร็จสมบูรณ์!\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

// รัน script
if (require.main === module) {
  backfillStates()
    .then(() => {
      console.log('👋 เสร็จสิ้นการทำงาน');
      process.exit(0);
    })
    .catch(err => {
      console.error('💥 Error:', err);
      process.exit(1);
    });
}

module.exports = { backfillStates, calculatePhaseFromProject };
