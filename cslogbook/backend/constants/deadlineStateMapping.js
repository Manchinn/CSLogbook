/**
 * Deadline State Mapping Configuration
 * 
 * Maps ImportantDeadline names to their corresponding workflow states
 * Used by DeadlineStatusUpdater agent to automatically transition project states
 * 
 * Structure:
 * - pendingState: Normal submission state (before deadline_at)
 * - lateState: Late submission state (after deadline_at, before end_date)
 * - overdueState: Overdue/locked state (after end_date)
 */

module.exports = {
  // ============= PROJECT 1 (โครงงานพิเศษ 1) =============
  PROJECT_1: {
    // Phase 1: Proposal Submission
    PROPOSAL_SUBMISSION: {
      deadlineField: 'PROJECT_1_PROPOSAL_DEADLINE',
      pendingState: 'PROJECT_PROPOSAL_PENDING_STUDENT_SUBMISSION',
      lateState: 'PROJECT_PROPOSAL_PENDING_LATE_SUBMISSION',
      overdueState: 'PROJECT_PROPOSAL_OVERDUE'
    },
    
    // Phase 2: Defense Request
    DEFENSE_REQUEST: {
      deadlineField: 'PROJECT_1_DEFENSE_REQUEST_DEADLINE',
      pendingState: 'PROJECT_DEFENSE_PENDING_STUDENT_SUBMISSION',
      lateState: 'PROJECT_DEFENSE_PENDING_LATE_SUBMISSION',
      overdueState: 'PROJECT_DEFENSE_OVERDUE'
    },
    
    // Phase 3: Final Document Submission
    FINAL_DOCUMENT: {
      deadlineField: 'PROJECT_1_FINAL_DOCUMENT_DEADLINE',
      pendingState: 'PROJECT_FINAL_DOCUMENT_PENDING_SUBMISSION',
      lateState: 'PROJECT_FINAL_DOCUMENT_PENDING_LATE_SUBMISSION',
      overdueState: 'PROJECT_FINAL_DOCUMENT_OVERDUE'
    }
  },

  // ============= PROJECT 2 (ปริญญานิพนธ์) =============
  PROJECT_2: {
    // Phase 1: Thesis Proposal Submission
    PROPOSAL_SUBMISSION: {
      deadlineField: 'THESIS_PROPOSAL_DEADLINE',
      pendingState: 'THESIS_PROPOSAL_PENDING_STUDENT_SUBMISSION',
      lateState: 'THESIS_PROPOSAL_PENDING_LATE_SUBMISSION',
      overdueState: 'THESIS_PROPOSAL_OVERDUE'
    },
    
    // Phase 2: Thesis Defense Request
    DEFENSE_REQUEST: {
      deadlineField: 'THESIS_DEFENSE_REQUEST_DEADLINE',
      pendingState: 'THESIS_DEFENSE_PENDING_STUDENT_SUBMISSION',
      lateState: 'THESIS_DEFENSE_PENDING_LATE_SUBMISSION',
      overdueState: 'THESIS_DEFENSE_OVERDUE'
    },
    
    // Phase 3: Final Thesis Submission
    FINAL_DOCUMENT: {
      deadlineField: 'THESIS_FINAL_DOCUMENT_DEADLINE',
      pendingState: 'THESIS_FINAL_DOCUMENT_PENDING_SUBMISSION',
      lateState: 'THESIS_FINAL_DOCUMENT_PENDING_LATE_SUBMISSION',
      overdueState: 'THESIS_FINAL_DOCUMENT_OVERDUE'
    }
  }
};

/**
 * Helper function: Get state mapping for a deadline
 * @param {string} workflowType - 'project1' or 'project2'
 * @param {string} deadlineName - Name from ImportantDeadline.name
 * @returns {object|null} Mapping object or null if not found
 */
function getStateMappingForDeadline(workflowType, deadlineName) {
  const normalizedWorkflow = workflowType.toUpperCase().replace(/(\d)/, '_$1');
  const workflowMapping = module.exports[normalizedWorkflow];
  
  if (!workflowMapping) {
    return null;
  }

  // Search through all phases for matching deadline
  for (const [phaseName, mapping] of Object.entries(workflowMapping)) {
    if (deadlineName.includes(mapping.deadlineField) || 
        mapping.deadlineField.includes(deadlineName)) {
      return mapping;
    }
  }

  return null;
}

module.exports.getStateMappingForDeadline = getStateMappingForDeadline;
