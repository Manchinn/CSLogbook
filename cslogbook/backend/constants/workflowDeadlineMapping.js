/**
 * Workflow Phase to Deadline Template Mapping
 * 
 * Maps ProjectWorkflowState phases กับ ImportantDeadline templates
 * เพื่อใช้ในการตรวจสอบ deadline ที่เกี่ยวข้องกับแต่ละ phase
 */

/**
 * Internship Workflow to Deadline Mapping
 */
const INTERNSHIP_DEADLINE_MAPPING = {
  // Phase: CS05 Submission
  PENDING_CS05_SUBMISSION: {
    templateId: 'INTERNSHIP_CS05_SUBMISSION',
    deadlineName: 'ยื่นคำร้องขอฝึกงาน (คพ.05)',
    relatedTo: 'internship',
    documentSubtype: 'CS05',
    deadlineType: 'SUBMISSION',
    description: 'ยื่นคำร้องขอฝึกงาน (คพ.05)',
    isRequired: true,
    blockIfLocked: true
  },
  
  // ❌ Phase: Acceptance Letter - ลบออกตาม Business Requirement
  // หนังสือตอบรับจากบริษัทขึ้นอยู่กับกระบวนการของแต่ละบริษัท
  // ไม่สามารถกำหนดกำหนดเวลาที่ชัดเจนได้
  /*
  AWAITING_ACCEPTANCE_LETTER: {
    templateId: 'INTERNSHIP_ACCEPTANCE_SUBMISSION',
    deadlineName: 'ส่งหนังสือตอบรับฝึกงาน',
    relatedTo: 'internship',
    documentSubtype: 'acceptance_letter',
    deadlineType: 'SUBMISSION',
    description: 'ส่งหนังสือตอบรับฝึกงาน',
    isRequired: true,
    blockIfLocked: true
  },
  */
  
  // Phase: Report Submission
  IN_PROGRESS: {
    templateId: 'INTERNSHIP_REPORT_SUBMISSION',
    deadlineName: 'ส่งรายงานผลการฝึกงาน',
    relatedTo: 'internship',
    documentSubtype: 'report',
    deadlineType: 'SUBMISSION',
    description: 'ส่งรายงานผลการฝึกงาน',
    isRequired: true,
    blockIfLocked: true
  }
};

/**
 * Project 1 (Capstone) Workflow to Deadline Mapping
 */
const PROJECT1_DEADLINE_MAPPING = {
  // Phase: Topic Submission
  TOPIC_SUBMISSION: {
    templateId: 'PROJECT1_PROPOSAL_SUBMISSION',
    deadlineName: 'ส่งหัวข้อโครงงานพิเศษ 1',
    relatedTo: 'project1',
    documentSubtype: 'PROJECT1_PROPOSAL',
    deadlineType: 'SUBMISSION',
    description: 'ยื่นหัวข้อโครงงานพิเศษ 1 (Proposal)',
    isRequired: true,
    blockIfLocked: true
  },
  
  // Phase: Defense Request (KP.02)
  TOPIC_EXAM_PENDING: {
    templateId: 'PROJECT1_DEFENSE_REQUEST_SUBMISSION',
    deadlineName: 'ส่งคำร้องขอสอบ (คพ.02)',
    relatedTo: 'project1',
    documentSubtype: 'PROJECT1_DEFENSE_REQUEST',
    deadlineType: 'SUBMISSION',
    description: 'ยื่นคำร้องขอสอบโครงงานพิเศษ 1 (คพ.02)',
    isRequired: true,
    blockIfLocked: true
  }
};

/**
 * Project 2 (Thesis) Workflow to Deadline Mapping
 */
const PROJECT2_DEADLINE_MAPPING = {
  // Phase: System Test Request
  IN_PROGRESS: {
    templateId: 'PROJECT_SYSTEM_TEST_REQUEST',
    deadlineName: 'ยื่นคำขอทดสอบระบบ',
    relatedTo: 'project2',
    documentSubtype: 'PROJECT_SYSTEM_TEST_REQUEST',
    deadlineType: 'SUBMISSION',
    description: 'ยื่นคำขอทดสอบระบบ (ล่วงหน้า 30 วัน)',
    isRequired: true,
    blockIfLocked: true,
    advanceNoticeDays: 30
  },
  
  // Phase: Thesis Defense Request (KP.03)
  THESIS_SUBMISSION: {
    templateId: 'THESIS_DEFENSE_REQUEST_SUBMISSION',
    deadlineName: 'ส่งคำร้องขอสอบปริญญานิพนธ์ (คพ.03)',
    relatedTo: 'project2',
    documentSubtype: 'THESIS_DEFENSE_REQUEST',
    deadlineType: 'SUBMISSION',
    description: 'ยื่นคำร้องขอสอบปริญญานิพนธ์ (คพ.03)',
    isRequired: true,
    blockIfLocked: true
  },
  
  // Phase: Final Report
  THESIS_EXAM_PASSED: {
    templateId: 'THESIS_FINAL_SUBMISSION',
    deadlineName: 'ส่งปริญญานิพนธ์ฉบับสมบูรณ์',
    relatedTo: 'project2',
    documentSubtype: 'THESIS_FINAL_REPORT',
    deadlineType: 'SUBMISSION',
    description: 'ส่งปริญญานิพนธ์ฉบับสมบูรณ์',
    isRequired: true,
    blockIfLocked: false // อนุญาตส่งสาย
  }
};

/**
 * Get deadline mapping for a specific workflow phase
 * @param {string} workflowType - 'internship', 'project1', 'project2'
 * @param {string} phase - Current workflow phase
 * @returns {Object|null} Deadline mapping object or null if not found
 */
function getDeadlineMappingForPhase(workflowType, phase) {
  let mapping = null;
  
  switch (workflowType) {
    case 'internship':
      mapping = INTERNSHIP_DEADLINE_MAPPING[phase];
      break;
    case 'project1':
      mapping = PROJECT1_DEADLINE_MAPPING[phase];
      break;
    case 'project2':
      mapping = PROJECT2_DEADLINE_MAPPING[phase];
      break;
    default:
      return null;
  }
  
  return mapping || null;
}

/**
 * Get all applicable deadline template IDs for a workflow type
 * @param {string} workflowType - 'internship', 'project1', 'project2'
 * @returns {Array<string>} Array of template IDs
 */
function getApplicableTemplateIds(workflowType) {
  let mapping = null;
  
  switch (workflowType) {
    case 'internship':
      mapping = INTERNSHIP_DEADLINE_MAPPING;
      break;
    case 'project1':
      mapping = PROJECT1_DEADLINE_MAPPING;
      break;
    case 'project2':
      mapping = PROJECT2_DEADLINE_MAPPING;
      break;
    default:
      return [];
  }
  
  return Object.values(mapping).map(m => m.templateId);
}

/**
 * Determine workflow type from ProjectWorkflowState phase
 * @param {string} phase - Current phase from ProjectWorkflowState
 * @returns {string|null} 'project1' or 'project2' or null
 */
function getWorkflowTypeFromPhase(phase) {
  // Project 1 phases
  const project1Phases = [
    'DRAFT',
    'ADVISOR_ASSIGNED',
    'TOPIC_SUBMISSION',
    'TOPIC_EXAM_PENDING',
    'TOPIC_EXAM_SCHEDULED',
    'TOPIC_FAILED'
  ];
  
  // Project 2 phases
  const project2Phases = [
    'IN_PROGRESS',
    'THESIS_SUBMISSION',
    'THESIS_EXAM_PENDING',
    'THESIS_EXAM_SCHEDULED',
    'THESIS_EXAM_PASSED',
    'THESIS_FAILED'
  ];
  
  if (project1Phases.includes(phase)) {
    return 'project1';
  } else if (project2Phases.includes(phase)) {
    return 'project2';
  }
  
  return null;
}

/**
 * Map phase to relatedTo field for ImportantDeadline query
 * @param {string} phase - Current phase
 * @returns {string|null} 'internship', 'project1', 'project2', or null
 */
function mapPhaseToRelatedTo(phase) {
  const workflowType = getWorkflowTypeFromPhase(phase);
  return workflowType;
}

module.exports = {
  INTERNSHIP_DEADLINE_MAPPING,
  PROJECT1_DEADLINE_MAPPING,
  PROJECT2_DEADLINE_MAPPING,
  getDeadlineMappingForPhase,
  getApplicableTemplateIds,
  getWorkflowTypeFromPhase,
  mapPhaseToRelatedTo
};
