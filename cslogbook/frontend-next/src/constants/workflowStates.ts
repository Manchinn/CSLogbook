/**
 * Workflow State Constants — generated from WORKFLOW_STATES.md
 *
 * ค่าทั้งหมดตรงกับ DB ENUM ที่ใช้จริงใน codebase
 * ใช้เป็น single source of truth สำหรับ status enums, transitions, UI config
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Enums — ตรงกับ DB ENUM ทุกค่า
// ─────────────────────────────────────────────────────────────────────────────

/** สถานะนักศึกษาฝึกงาน (students.internship_status) */
export enum InternshipStudentStatus {
  NOT_STARTED = 'not_started',
  PENDING_APPROVAL = 'pending_approval',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

/** สถานะเอกสารฝึกงาน (documents.status) */
export enum InternshipDocumentStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUPERVISOR_EVALUATED = 'supervisor_evaluated',
  ACCEPTANCE_APPROVED = 'acceptance_approved',
  REFERRAL_READY = 'referral_ready',
  REFERRAL_DOWNLOADED = 'referral_downloaded',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/** สถานะเอกสารโครงงาน (project_documents.status) */
export enum ProjectDocumentStatus {
  DRAFT = 'draft',
  ADVISOR_ASSIGNED = 'advisor_assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled',
}

/** เฟส workflow โครงงาน (project_workflow_states.current_phase) — UPPERCASE ตาม convention */
export enum ProjectWorkflowPhase {
  DRAFT = 'DRAFT',
  PENDING_ADVISOR = 'PENDING_ADVISOR',
  ADVISOR_ASSIGNED = 'ADVISOR_ASSIGNED',
  TOPIC_SUBMISSION = 'TOPIC_SUBMISSION',
  TOPIC_EXAM_PENDING = 'TOPIC_EXAM_PENDING',
  TOPIC_FAILED = 'TOPIC_FAILED',
  IN_PROGRESS = 'IN_PROGRESS',
  THESIS_SUBMISSION = 'THESIS_SUBMISSION',
  THESIS_EXAM_PENDING = 'THESIS_EXAM_PENDING',
  THESIS_EXAM_SCHEDULED = 'THESIS_EXAM_SCHEDULED',
  THESIS_FAILED = 'THESIS_FAILED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED',
}

/** สถานะคำขอสอบ (project_defense_requests.status) */
export enum DefenseRequestStatus {
  DRAFT = 'draft',
  ADVISOR_IN_REVIEW = 'advisor_in_review',
  ADVISOR_APPROVED = 'advisor_approved',
  STAFF_VERIFIED = 'staff_verified',
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/** สถานะคำขอทดสอบระบบ (project_test_requests.status) — รวม evidence_submitted */
export enum SystemTestRequestStatus {
  PENDING_ADVISOR = 'pending_advisor',
  ADVISOR_REJECTED = 'advisor_rejected',
  PENDING_STAFF = 'pending_staff',
  STAFF_REJECTED = 'staff_rejected',
  STAFF_APPROVED = 'staff_approved',
  EVIDENCE_SUBMITTED = 'evidence_submitted',
}

/** สถานะอนุมัติบันทึกการประชุม (meeting_logs.approval_status) */
export enum MeetingLogApproval {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/** ผลสอบ (project_exam_results.result) — UPPERCASE ตาม convention */
export enum ExamResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
}

/** สถานะ Approval Token (approval_tokens.status) */
export enum ApprovalTokenStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  USED = 'used',
}

/** สถานะคำขอใบรับรอง (certificate_requests.status) */
export enum CertificateRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Transition Maps — state ไหน → ไป state ไหนได้ (จาก State Diagrams §1)
//
// Transition maps represent the TARGET SPEC (designed transitions).
// Transitions marked @phantom exist in DB ENUM / design but have no
// explicit code path in the current codebase.
//
// Verified against codebase: 2026-03-08 (Prompt V2)
// ─────────────────────────────────────────────────────────────────────────────

/** Internship Student Status transitions */
export const INTERNSHIP_STUDENT_TRANSITIONS: Record<InternshipStudentStatus, InternshipStudentStatus[]> = {
  [InternshipStudentStatus.NOT_STARTED]: [InternshipStudentStatus.PENDING_APPROVAL, InternshipStudentStatus.IN_PROGRESS],
  [InternshipStudentStatus.PENDING_APPROVAL]: [InternshipStudentStatus.IN_PROGRESS],
  [InternshipStudentStatus.IN_PROGRESS]: [InternshipStudentStatus.COMPLETED],
  [InternshipStudentStatus.COMPLETED]: [],
};

/** Internship Document Status transitions */
export const INTERNSHIP_DOCUMENT_TRANSITIONS: Record<InternshipDocumentStatus, InternshipDocumentStatus[]> = {
  [InternshipDocumentStatus.DRAFT]: [InternshipDocumentStatus.PENDING, InternshipDocumentStatus.REJECTED, InternshipDocumentStatus.CANCELLED],
  [InternshipDocumentStatus.PENDING]: [InternshipDocumentStatus.APPROVED, InternshipDocumentStatus.REJECTED, InternshipDocumentStatus.ACCEPTANCE_APPROVED, InternshipDocumentStatus.CANCELLED],
  [InternshipDocumentStatus.APPROVED]: [
    /** @phantom — set via generic updateStatus() without guard */
    InternshipDocumentStatus.SUPERVISOR_EVALUATED,
    InternshipDocumentStatus.COMPLETED,
    InternshipDocumentStatus.CANCELLED,
  ],
  /** @phantom — implicit re-submit, no explicit code path */
  [InternshipDocumentStatus.REJECTED]: [InternshipDocumentStatus.DRAFT],
  [InternshipDocumentStatus.SUPERVISOR_EVALUATED]: [InternshipDocumentStatus.COMPLETED],
  /** @phantom — referral_ready not set by any code, used in query filter only */
  [InternshipDocumentStatus.ACCEPTANCE_APPROVED]: [InternshipDocumentStatus.REFERRAL_READY],
  /** @phantom — referral_downloaded is frontend-only, not persisted */
  [InternshipDocumentStatus.REFERRAL_READY]: [InternshipDocumentStatus.REFERRAL_DOWNLOADED],
  [InternshipDocumentStatus.REFERRAL_DOWNLOADED]: [],
  [InternshipDocumentStatus.COMPLETED]: [],
  [InternshipDocumentStatus.CANCELLED]: [],
};

/** Project Document Status transitions */
export const PROJECT_DOCUMENT_TRANSITIONS: Record<ProjectDocumentStatus, ProjectDocumentStatus[]> = {
  [ProjectDocumentStatus.DRAFT]: [ProjectDocumentStatus.IN_PROGRESS, ProjectDocumentStatus.CANCELLED],
  /** @phantom — advisor_assigned is seeder-only, not set at runtime */
  [ProjectDocumentStatus.ADVISOR_ASSIGNED]: [ProjectDocumentStatus.IN_PROGRESS],
  [ProjectDocumentStatus.IN_PROGRESS]: [ProjectDocumentStatus.COMPLETED, ProjectDocumentStatus.ARCHIVED, ProjectDocumentStatus.CANCELLED],
  [ProjectDocumentStatus.COMPLETED]: [ProjectDocumentStatus.IN_PROGRESS],
  [ProjectDocumentStatus.ARCHIVED]: [],
  [ProjectDocumentStatus.CANCELLED]: [],
};

/** Project Workflow Phase transitions */
export const PROJECT_WORKFLOW_TRANSITIONS: Record<ProjectWorkflowPhase, ProjectWorkflowPhase[]> = {
  /** @phantom — code jumps DRAFT → TOPIC_EXAM_PENDING via updateFromDefenseRequest */
  [ProjectWorkflowPhase.DRAFT]: [ProjectWorkflowPhase.PENDING_ADVISOR, ProjectWorkflowPhase.CANCELLED],
  /** @phantom */
  [ProjectWorkflowPhase.PENDING_ADVISOR]: [ProjectWorkflowPhase.ADVISOR_ASSIGNED],
  /** @phantom */
  [ProjectWorkflowPhase.ADVISOR_ASSIGNED]: [ProjectWorkflowPhase.TOPIC_SUBMISSION],
  [ProjectWorkflowPhase.TOPIC_SUBMISSION]: [ProjectWorkflowPhase.TOPIC_EXAM_PENDING],
  [ProjectWorkflowPhase.TOPIC_EXAM_PENDING]: [ProjectWorkflowPhase.IN_PROGRESS, ProjectWorkflowPhase.TOPIC_FAILED],
  /** @phantom — re-submit logic not yet implemented */
  [ProjectWorkflowPhase.TOPIC_FAILED]: [ProjectWorkflowPhase.TOPIC_SUBMISSION],
  [ProjectWorkflowPhase.IN_PROGRESS]: [ProjectWorkflowPhase.THESIS_SUBMISSION, ProjectWorkflowPhase.ARCHIVED, ProjectWorkflowPhase.CANCELLED],
  [ProjectWorkflowPhase.THESIS_SUBMISSION]: [ProjectWorkflowPhase.THESIS_EXAM_PENDING],
  [ProjectWorkflowPhase.THESIS_EXAM_PENDING]: [ProjectWorkflowPhase.THESIS_EXAM_SCHEDULED],
  [ProjectWorkflowPhase.THESIS_EXAM_SCHEDULED]: [ProjectWorkflowPhase.COMPLETED, ProjectWorkflowPhase.THESIS_FAILED],
  /** @phantom — re-submit logic not yet implemented */
  [ProjectWorkflowPhase.THESIS_FAILED]: [ProjectWorkflowPhase.THESIS_SUBMISSION],
  /** @phantom — only COMPLETED → CANCELLED exists in code */
  [ProjectWorkflowPhase.COMPLETED]: [ProjectWorkflowPhase.ARCHIVED],
  [ProjectWorkflowPhase.ARCHIVED]: [],
  [ProjectWorkflowPhase.CANCELLED]: [],
};

/** Defense Request Status transitions */
export const DEFENSE_REQUEST_TRANSITIONS: Record<DefenseRequestStatus, DefenseRequestStatus[]> = {
  /** @phantom — defense requests are created directly as advisor_in_review, 'draft' is unused */
  [DefenseRequestStatus.DRAFT]: [DefenseRequestStatus.ADVISOR_IN_REVIEW, DefenseRequestStatus.CANCELLED],
  [DefenseRequestStatus.ADVISOR_IN_REVIEW]: [DefenseRequestStatus.ADVISOR_APPROVED, DefenseRequestStatus.ADVISOR_IN_REVIEW, DefenseRequestStatus.CANCELLED],
  [DefenseRequestStatus.ADVISOR_APPROVED]: [DefenseRequestStatus.STAFF_VERIFIED, DefenseRequestStatus.CANCELLED],
  [DefenseRequestStatus.STAFF_VERIFIED]: [DefenseRequestStatus.SCHEDULED],
  [DefenseRequestStatus.SCHEDULED]: [DefenseRequestStatus.COMPLETED],
  [DefenseRequestStatus.COMPLETED]: [],
  [DefenseRequestStatus.CANCELLED]: [],
};

/** System Test Request Status transitions */
export const SYSTEM_TEST_TRANSITIONS: Record<SystemTestRequestStatus, SystemTestRequestStatus[]> = {
  [SystemTestRequestStatus.PENDING_ADVISOR]: [SystemTestRequestStatus.PENDING_STAFF, SystemTestRequestStatus.ADVISOR_REJECTED],
  [SystemTestRequestStatus.ADVISOR_REJECTED]: [SystemTestRequestStatus.PENDING_ADVISOR],
  [SystemTestRequestStatus.PENDING_STAFF]: [SystemTestRequestStatus.STAFF_APPROVED, SystemTestRequestStatus.STAFF_REJECTED],
  [SystemTestRequestStatus.STAFF_REJECTED]: [SystemTestRequestStatus.PENDING_ADVISOR],
  [SystemTestRequestStatus.STAFF_APPROVED]: [SystemTestRequestStatus.EVIDENCE_SUBMITTED],
  [SystemTestRequestStatus.EVIDENCE_SUBMITTED]: [],
};

/** Meeting Log Approval transitions */
export const MEETING_LOG_TRANSITIONS: Record<MeetingLogApproval, MeetingLogApproval[]> = {
  [MeetingLogApproval.PENDING]: [MeetingLogApproval.APPROVED, MeetingLogApproval.REJECTED],
  [MeetingLogApproval.APPROVED]: [],
  [MeetingLogApproval.REJECTED]: [MeetingLogApproval.PENDING],
};

/**
 * Approval Token Status transitions
 * @phantom — ENUM defined in model but no service-layer implementation yet.
 * Transitions may be handled in controller or planned feature.
 */
export const APPROVAL_TOKEN_TRANSITIONS: Record<ApprovalTokenStatus, ApprovalTokenStatus[]> = {
  [ApprovalTokenStatus.PENDING]: [ApprovalTokenStatus.APPROVED, ApprovalTokenStatus.REJECTED],
  [ApprovalTokenStatus.APPROVED]: [ApprovalTokenStatus.USED],
  [ApprovalTokenStatus.REJECTED]: [ApprovalTokenStatus.USED],
  [ApprovalTokenStatus.USED]: [],
};

/** Certificate Request Status transitions */
export const CERTIFICATE_REQUEST_TRANSITIONS: Record<CertificateRequestStatus, CertificateRequestStatus[]> = {
  [CertificateRequestStatus.PENDING]: [CertificateRequestStatus.APPROVED, CertificateRequestStatus.REJECTED],
  [CertificateRequestStatus.APPROVED]: [],
  [CertificateRequestStatus.REJECTED]: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. UI Config Map — Thai/English labels + semantic tone (จาก §2 Master Tables)
// ─────────────────────────────────────────────────────────────────────────────

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

export interface StatusUIEntry {
  label: string;
  labelEn: string;
  tone: StatusTone;
}

/** UI config สำหรับทุก status — key = DB value, deduplicated across tracks */
export const STATUS_UI_CONFIG: Record<string, StatusUIEntry> = {
  // ── Internship Student ──
  not_started:          { label: 'ยังไม่เริ่ม',           labelEn: 'Not Started',           tone: 'muted' },
  pending_approval:     { label: 'รอการอนุมัติ',          labelEn: 'Pending Approval',      tone: 'warning' },
  in_progress:          { label: 'กำลังดำเนินการ',        labelEn: 'In Progress',           tone: 'warning' },
  completed:            { label: 'เสร็จสิ้น',             labelEn: 'Completed',             tone: 'success' },

  // ── Internship Document ──
  draft:                { label: 'ร่าง',                  labelEn: 'Draft',                 tone: 'info' },
  pending:              { label: 'รอดำเนินการ',           labelEn: 'Pending',               tone: 'warning' },
  approved:             { label: 'อนุมัติแล้ว',            labelEn: 'Approved',              tone: 'success' },
  rejected:             { label: 'ไม่อนุมัติ',             labelEn: 'Rejected',              tone: 'danger' },
  supervisor_evaluated: { label: 'หัวหน้าภาคตรวจแล้ว',    labelEn: 'Supervisor Evaluated',  tone: 'info' },
  acceptance_approved:  { label: 'อนุมัติให้รับเล่ม',      labelEn: 'Acceptance Approved',   tone: 'success' },
  referral_ready:       { label: 'พร้อมส่งต่อ',           labelEn: 'Referral Ready',        tone: 'info' },
  referral_downloaded:  { label: 'ดาวน์โหลดแล้ว',         labelEn: 'Referral Downloaded',   tone: 'info' },
  cancelled:            { label: 'ยกเลิก',                labelEn: 'Cancelled',             tone: 'danger' },

  // ── Project Document ──
  advisor_assigned:     { label: 'มีอาจารย์ที่ปรึกษาแล้ว',  labelEn: 'Advisor Assigned',      tone: 'info' },
  archived:             { label: 'เก็บถาวร',              labelEn: 'Archived',              tone: 'muted' },

  // ── Defense Request ──
  advisor_in_review:    { label: 'รออาจารย์อนุมัติครบ',     labelEn: 'Advisor In Review',     tone: 'info' },
  advisor_approved:     { label: 'อาจารย์อนุมัติ',         labelEn: 'Advisor Approved',      tone: 'warning' },
  staff_verified:       { label: 'เจ้าหน้าที่ตรวจแล้ว',    labelEn: 'Staff Verified',        tone: 'success' },
  scheduled:            { label: 'นัดสอบแล้ว',            labelEn: 'Scheduled',             tone: 'info' },

  // ── System Test Request ──
  pending_advisor:      { label: 'รออาจารย์อนุมัติ',       labelEn: 'Pending Advisor',       tone: 'warning' },
  advisor_rejected:     { label: 'อาจารย์ส่งกลับ',        labelEn: 'Advisor Rejected',      tone: 'danger' },
  pending_staff:        { label: 'รอเจ้าหน้าที่ตรวจสอบ',   labelEn: 'Pending Staff',         tone: 'warning' },
  staff_rejected:       { label: 'เจ้าหน้าที่ส่งกลับ',     labelEn: 'Staff Rejected',        tone: 'danger' },
  staff_approved:       { label: 'อนุมัติ (รอหลักฐาน)',    labelEn: 'Staff Approved',        tone: 'success' },
  evidence_submitted:   { label: 'ส่งหลักฐานแล้ว',        labelEn: 'Evidence Submitted',    tone: 'success' },

  // ── Meeting Log ──
  // pending, approved, rejected — already defined above

  // ── Exam Result (UPPERCASE — project_exam_results.result) ──
  PASS:                 { label: 'ผ่าน',                  labelEn: 'Pass',                  tone: 'success' },
  FAIL:                 { label: 'ไม่ผ่าน',                labelEn: 'Fail',                  tone: 'danger' },
  // ── Exam Result (lowercase — project_documents.exam_result, normalized by service) ──
  passed:               { label: 'ผ่าน',                  labelEn: 'Passed',                tone: 'success' },
  failed:               { label: 'ไม่ผ่าน',                labelEn: 'Failed',                tone: 'danger' },

  // ── Approval Token ──
  used:                 { label: 'ใช้แล้ว',               labelEn: 'Used',                  tone: 'muted' },

  // ── Project Workflow Phases (UPPERCASE) ──
  DRAFT:                    { label: 'ร่าง',                      labelEn: 'Draft',                    tone: 'info' },
  PENDING_ADVISOR:          { label: 'รอที่ปรึกษา',                labelEn: 'Pending Advisor',          tone: 'info' },
  ADVISOR_ASSIGNED:         { label: 'มีที่ปรึกษาแล้ว',            labelEn: 'Advisor Assigned',         tone: 'info' },
  TOPIC_SUBMISSION:         { label: 'ยื่นหัวข้อ',                 labelEn: 'Topic Submission',         tone: 'info' },
  TOPIC_EXAM_PENDING:       { label: 'รอสอบหัวข้อ',               labelEn: 'Topic Exam Pending',       tone: 'warning' },
  TOPIC_FAILED:             { label: 'สอบหัวข้อไม่ผ่าน',           labelEn: 'Topic Failed',             tone: 'danger' },
  IN_PROGRESS:              { label: 'กำลังดำเนินการ',             labelEn: 'In Progress',              tone: 'warning' },
  THESIS_SUBMISSION:        { label: 'ยื่นปริญญานิพนธ์',           labelEn: 'Thesis Submission',        tone: 'info' },
  THESIS_EXAM_PENDING:      { label: 'รอสอบปริญญานิพนธ์',          labelEn: 'Thesis Exam Pending',      tone: 'warning' },
  THESIS_EXAM_SCHEDULED:    { label: 'นัดสอบปริญญานิพนธ์แล้ว',      labelEn: 'Thesis Exam Scheduled',    tone: 'info' },
  THESIS_FAILED:            { label: 'สอบปริญญานิพนธ์ไม่ผ่าน',      labelEn: 'Thesis Failed',            tone: 'danger' },
  COMPLETED:                { label: 'เสร็จสิ้น',                  labelEn: 'Completed',                tone: 'success' },
  ARCHIVED:                 { label: 'เก็บถาวร',                  labelEn: 'Archived',                 tone: 'muted' },
  CANCELLED:                { label: 'ยกเลิก',                    labelEn: 'Cancelled',                tone: 'danger' },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Role-based Transition Rules (จาก §1 State Diagrams + §4 Unlock Conditions)
// ─────────────────────────────────────────────────────────────────────────────

export interface TransitionRule {
  from: string;
  to: string;
  /** role ที่ trigger ได้ */
  roles: string[];
  type: 'manual' | 'system' | 'agent';
}

/** ทุก transition ที่เป็นไปได้ในระบบ พร้อม role และ trigger type */
export const ALL_TRANSITIONS: TransitionRule[] = [
  // ── Internship Student Status ──
  // HEAD approval via acceptanceApprovalController:240
  { from: 'not_started',      to: 'pending_approval',    roles: ['teacher'], type: 'manual' },
  // HEAD approval via acceptanceApprovalController:247
  { from: 'not_started',      to: 'in_progress',         roles: ['teacher'], type: 'manual' },
  { from: 'pending_approval', to: 'in_progress',         roles: ['agent'],   type: 'agent' },
  { from: 'in_progress',      to: 'completed',           roles: ['admin'],   type: 'manual' },

  // ── Internship Document Status ──
  // staff review (reviewById) via cp05ApprovalController:130
  { from: 'draft',     to: 'pending',             roles: ['admin'],            type: 'manual' },
  { from: 'draft',     to: 'rejected',            roles: ['admin'],            type: 'manual' },
  { from: 'pending',   to: 'approved',            roles: ['teacher'],          type: 'manual' },
  { from: 'pending',   to: 'rejected',            roles: ['admin', 'teacher'], type: 'manual' },
  { from: 'pending',   to: 'acceptance_approved', roles: ['system'],           type: 'system' },
  { from: 'approved',  to: 'supervisor_evaluated', roles: ['teacher'],         type: 'manual' },
  { from: 'approved',  to: 'completed',           roles: ['system'],           type: 'system' },
  { from: 'acceptance_approved', to: 'referral_ready',      roles: ['system'], type: 'system' },
  { from: 'referral_ready',     to: 'referral_downloaded',  roles: ['admin'],  type: 'manual' },
  { from: 'rejected',  to: 'draft',               roles: ['student'],          type: 'manual' },
  { from: 'draft',     to: 'cancelled',           roles: ['admin'],            type: 'manual' },
  { from: 'pending',   to: 'cancelled',           roles: ['admin'],            type: 'manual' },
  { from: 'approved',  to: 'cancelled',           roles: ['admin'],            type: 'manual' },

  // ── Project Document Status ──
  { from: 'draft',        to: 'in_progress', roles: ['student'],        type: 'manual' },
  { from: 'in_progress',  to: 'completed',   roles: ['system'],         type: 'system' },
  { from: 'in_progress',  to: 'archived',    roles: ['admin'],          type: 'manual' },
  { from: 'in_progress',  to: 'cancelled',   roles: ['admin'],          type: 'manual' },
  { from: 'completed',    to: 'in_progress', roles: ['system'],         type: 'system' },
  { from: 'draft',        to: 'cancelled',   roles: ['admin'],          type: 'manual' },

  // ── Project Workflow Phase ──
  { from: 'DRAFT',                to: 'PENDING_ADVISOR',      roles: ['student'],        type: 'manual' },
  { from: 'DRAFT',                to: 'CANCELLED',            roles: ['admin'],          type: 'manual' },
  { from: 'PENDING_ADVISOR',      to: 'ADVISOR_ASSIGNED',     roles: ['teacher'],        type: 'manual' },
  { from: 'ADVISOR_ASSIGNED',     to: 'TOPIC_SUBMISSION',     roles: ['system'],         type: 'system' },
  { from: 'TOPIC_SUBMISSION',     to: 'TOPIC_EXAM_PENDING',   roles: ['system'],         type: 'system' },
  { from: 'TOPIC_EXAM_PENDING',   to: 'IN_PROGRESS',          roles: ['system'],         type: 'system' },
  { from: 'TOPIC_EXAM_PENDING',   to: 'TOPIC_FAILED',         roles: ['system'],         type: 'system' },
  { from: 'TOPIC_FAILED',         to: 'TOPIC_SUBMISSION',     roles: ['student'],        type: 'manual' },
  { from: 'IN_PROGRESS',          to: 'THESIS_SUBMISSION',    roles: ['system'],         type: 'system' },
  { from: 'IN_PROGRESS',          to: 'ARCHIVED',             roles: ['admin'],          type: 'manual' },
  { from: 'IN_PROGRESS',          to: 'CANCELLED',            roles: ['admin'],          type: 'manual' },
  { from: 'THESIS_SUBMISSION',    to: 'THESIS_EXAM_PENDING',  roles: ['system'],         type: 'system' },
  { from: 'THESIS_EXAM_PENDING',  to: 'THESIS_EXAM_SCHEDULED', roles: ['admin'],         type: 'manual' },
  { from: 'THESIS_EXAM_SCHEDULED', to: 'COMPLETED',           roles: ['system'],         type: 'system' },
  { from: 'THESIS_EXAM_SCHEDULED', to: 'THESIS_FAILED',       roles: ['system'],         type: 'system' },
  { from: 'THESIS_FAILED',        to: 'THESIS_SUBMISSION',    roles: ['student'],        type: 'manual' },
  { from: 'COMPLETED',            to: 'ARCHIVED',             roles: ['admin'],          type: 'manual' },

  // ── Defense Request ──
  { from: 'draft',             to: 'advisor_in_review',  roles: ['student'],            type: 'manual' },
  { from: 'advisor_in_review', to: 'advisor_approved',   roles: ['teacher'],            type: 'manual' },
  { from: 'advisor_in_review', to: 'advisor_in_review',  roles: ['teacher'],            type: 'manual' },
  { from: 'advisor_approved',  to: 'staff_verified',     roles: ['admin'],              type: 'manual' },
  { from: 'staff_verified',    to: 'scheduled',          roles: ['admin'],              type: 'manual' },
  { from: 'scheduled',         to: 'completed',          roles: ['system'],             type: 'system' },
  { from: 'draft',             to: 'cancelled',          roles: ['student'],            type: 'manual' },
  { from: 'advisor_in_review', to: 'cancelled',          roles: ['admin'],              type: 'manual' },
  { from: 'advisor_approved',  to: 'cancelled',          roles: ['admin'],              type: 'manual' },

  // ── System Test Request ──
  { from: 'pending_advisor',  to: 'pending_staff',     roles: ['teacher'],            type: 'manual' },
  { from: 'pending_advisor',  to: 'advisor_rejected',  roles: ['teacher'],            type: 'manual' },
  { from: 'advisor_rejected', to: 'pending_advisor',   roles: ['student'],            type: 'manual' },
  { from: 'pending_staff',    to: 'staff_approved',    roles: ['admin'],              type: 'manual' },
  { from: 'pending_staff',    to: 'staff_rejected',    roles: ['admin'],              type: 'manual' },
  { from: 'staff_rejected',   to: 'pending_advisor',   roles: ['student'],            type: 'manual' },
  { from: 'staff_approved',   to: 'evidence_submitted', roles: ['student'],           type: 'manual' },

  // ── Meeting Log Approval ──
  { from: 'pending',  to: 'approved', roles: ['teacher'], type: 'manual' },
  { from: 'pending',  to: 'rejected', roles: ['teacher'], type: 'manual' },
  { from: 'rejected', to: 'pending',  roles: ['student'], type: 'manual' },

  // ── Approval Token ──
  { from: 'pending',  to: 'approved', roles: ['system'], type: 'system' },
  { from: 'pending',  to: 'rejected', roles: ['system'], type: 'system' },
  { from: 'approved', to: 'used',     roles: ['system'], type: 'system' },
  { from: 'rejected', to: 'used',     roles: ['system'], type: 'system' },

  // ── Certificate Request ──
  { from: 'pending',  to: 'approved', roles: ['admin'], type: 'manual' },
  { from: 'pending',  to: 'rejected', roles: ['admin'], type: 'manual' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 5. Validation Helper
// ─────────────────────────────────────────────────────────────────────────────

/** Track name → transition map สำหรับ canTransition() */
const TRANSITION_MAPS: Record<string, Record<string, string[]>> = {
  internship_student: INTERNSHIP_STUDENT_TRANSITIONS,
  internship_document: INTERNSHIP_DOCUMENT_TRANSITIONS,
  project_document: PROJECT_DOCUMENT_TRANSITIONS,
  project_workflow: PROJECT_WORKFLOW_TRANSITIONS,
  defense_request: DEFENSE_REQUEST_TRANSITIONS,
  system_test: SYSTEM_TEST_TRANSITIONS,
  meeting_log: MEETING_LOG_TRANSITIONS,
  approval_token: APPROVAL_TOKEN_TRANSITIONS,
  certificate_request: CERTIFICATE_REQUEST_TRANSITIONS,
};

/**
 * ตรวจว่า from → to เป็น valid transition หรือไม่
 *
 * @param track  ชื่อ track เช่น 'defense_request', 'project_workflow'
 * @param fromStatus  สถานะปัจจุบัน
 * @param toStatus  สถานะเป้าหมาย
 * @returns true ถ้า transition ถูกต้อง
 */
export function canTransition(
  track: string,
  fromStatus: string,
  toStatus: string,
): boolean {
  const map = TRANSITION_MAPS[track];
  if (!map) return false;
  const allowed = map[fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
}
