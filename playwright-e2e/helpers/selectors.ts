/**
 * Shared selectors — centralized Thai text & common UI elements
 *
 * Grouped by page/feature. Selectors marked [unused] are defined for
 * future tests but not referenced in any current spec file.
 */
export const SEL = {
  // ─── Login Page ────────────────────────────────────────────────────
  SSO_BUTTON: 'a:has-text("เข้าสู่ระบบด้วย SSO KMUTNB")',
  EXPAND_CREDENTIALS: 'button:has-text("ลงชื่อด้วยบัญชี Username/Password")',
  USERNAME_INPUT: '#username',
  PASSWORD_INPUT: '#password',
  LOGIN_SUBMIT: 'button[type="submit"]:has-text("เข้าสู่ระบบ")',

  // ─── Navigation & Layout [unused] ─────────────────────────────────
  SIDEBAR: '[class*="sidebar"]',
  TAB_BAR: '[role="tablist"]',

  // ─── Common UI [unused — reserved for future tests] ───────────────
  CONFIRM_DIALOG: '[role="dialog"]',
  LOADING_SPINNER: '[class*="spinner"], [class*="loading"]',

  // ─── Admin Settings — Layout & Tabs ───────────────────────────────
  SETTINGS_TITLE: '[class*="settingsTitle"]',
  SETTINGS_TAB_BAR: '[class*="settingsTabBar"]',
  SETTINGS_TAB: '[class*="settingsTab"]', // [unused]
  TAB_CURRICULUM: 'a:has-text("หลักสูตร")',
  TAB_ACADEMIC: 'a:has-text("ปีการศึกษา")',
  TAB_NOTIFICATION: 'a:has-text("การแจ้งเตือน")',

  // ─── Admin Settings — Notification ────────────────────────────────
  NOTIF_LIST: '[class*="notifList"]',
  NOTIF_TOGGLE: '[class*="toggle"] input', // [unused]
  BTN_REFRESH: 'button:has-text("รีเฟรช")',
  BTN_ENABLE_ALL: 'button:has-text("เปิดทั้งหมด")',
  BTN_DISABLE_ALL: 'button:has-text("ปิดทั้งหมด")',

  // ─── Admin — User Management ──────────────────────────────────────
  USER_SEARCH: 'input[placeholder*="ค้นหา"]',
  USER_TABLE: 'table, [class*="table"]', // [unused]
  STAT_CARD: '[class*="stats"] > *',
  BTN_CLEAR_FILTER: 'button:has-text("ล้างตัวกรอง")', // [unused]

  // ─── Teacher — Advisor Queue & Shared Decision UI ─────────────────
  SUMMARY_BAR: '[class*="summaryBar"]',
  SUMMARY_BADGE: '[class*="summaryBadge"]', // [unused]
  ADVISOR_FILTER: '[class*="filterSelect"]',
  BTN_APPROVE: '[class*="btnApprove"]',
  BTN_REJECT: '[class*="btnReject"]', // [unused]
  DECISION_MODAL: '[class*="modalContent"]',
  MODAL_CONFIRM: '[class*="btnPrimary"]',
  MODAL_CANCEL: '[class*="btnSecondary"]', // [unused]
  EMPTY_STATE: '[class*="noData"], [class*="empty"]',

  // ─── Teacher — Meeting Approvals ──────────────────────────────────
  APPROVAL_NOTE_INPUT: 'textarea[placeholder*="หมายเหตุ"]',
  BTN_CONFIRM_APPROVE: 'button:has-text("ยืนยันการอนุมัติ")',

  // ─── Student — Meeting Logbook ────────────────────────────────────
  MEETING_CARD: '[class*="meetingCard"]', // [unused]
  MEETING_TITLE_INPUT: 'input[name="meetingTitle"], input[placeholder*="หัวข้อ"]',
  MEETING_DATE_INPUT: 'input[type="datetime-local"]', // [unused]
  MEETING_METHOD_SELECT: 'select[name="meetingMethod"]',
  BTN_ADD_LOG: 'button:has-text("+ เพิ่มบันทึก")',
  LOG_DISCUSSION_INPUT: 'textarea[name="discussionTopic"], textarea[placeholder*="หัวข้อที่สนทนา"]',
  LOG_PROGRESS_INPUT: 'textarea[name="currentProgress"], textarea[placeholder*="ความคืบหน้า"]',
  LOG_NEXT_ITEMS_INPUT: 'textarea[name="nextActionItems"], textarea[placeholder*="งานถัดไป"]',
  BTN_SAVE_LOG: 'button:has-text("บันทึก log")',
  BTN_SAVE_MEETING: 'button:has-text("บันทึกการประชุม")',
  BADGE_PENDING: '[class*="badge-pending"], :text("รออนุมัติ")',
  BADGE_APPROVED: '[class*="badge-approved"], :text("อนุมัติแล้ว")',
  PROGRESS_BAR: '[class*="progressBar"]',

  // ─── Student — Defense Request (KP.02 / KP.03) ───────────────────
  DEFENSE_STEPPER: '[class*="stepper"]',
  DEFENSE_STATUS_TAG: '[class*="tagRow"] [class*="tag"]',
  DEFENSE_FORM: '[class*="form"]', // [unused]
  BTN_SUBMIT_DEFENSE: 'button:has-text("บันทึกคำขอสอบ")',

  // ─── Admin/Officer — Defense Queue ────────────────────────────────
  ADMIN_QUEUE_TABLE: '[class*="tableWrap"] table, [class*="table"]',
  ADMIN_STATUS_FILTER: '[class*="filters"] select',
  BTN_VERIFY: 'button:has-text("ตรวจสอบแล้ว")',
  BTN_DETAILS: 'button:has-text("รายละเอียด")', // [unused]
  DRAWER: '[class*="drawer"]', // [unused]
  DRAWER_CLOSE: 'button:has-text("ปิด")', // [unused]
  VERIFY_MODAL: '[class*="modal"]',
  VERIFY_NOTE: '[class*="modal"] textarea',
  BTN_VERIFY_CONFIRM: '[class*="modal"] button:has-text("ยืนยัน")',

  // ─── Student — System Test (Phase 2) ─────────────────────────────
  BTN_SUBMIT_SYSTEM_TEST: 'button:has-text("ส่งคำขอทดสอบระบบ")',
  BTN_UPLOAD_EVIDENCE: 'button:has-text("อัปโหลดหลักฐาน")', // [unused]
  SYSTEM_TEST_START: '#system-test-start',
  SYSTEM_TEST_END: '#system-test-end', // [unused]
  SYSTEM_TEST_NOTE: '#system-test-note',
  SYSTEM_TEST_STATUS_TAG: '[class*="tagRow"] [class*="tag"]',

  // ─── Student — Thesis Defense (KP.03) ─────────────────────────────
  THESIS_STEPPER: 'nav[aria-label*="ขั้นตอน"]',

  // ─── Admin — Exam Results ─────────────────────────────────────────
  BTN_RECORD_RESULT: 'button:has-text("บันทึกผลสอบ")',

  // ─── Internship — CS05 Registration Form ──────────────────────────
  CS05_COMPANY_NAME: 'input[name="companyName"]',
  CS05_COMPANY_ADDRESS: 'textarea[name="companyAddress"]',
  CS05_POSITION: 'input[name="internshipPosition"]',
  CS05_CONTACT_NAME: 'input[name="contactPersonName"]',
  CS05_CONTACT_POSITION: 'input[name="contactPersonPosition"]',
  CS05_START_DATE: 'input[name="startDate"]',
  CS05_END_DATE: 'input[name="endDate"]',
  CS05_TRANSCRIPT_INPUT: 'input[type="file"][accept="application/pdf"]', // [unused]
  BTN_SUBMIT_CS05: 'button:has-text("ส่งคำร้อง คพ.05")',

  // ─── Internship — Flow Page (downloads + acceptance) ──────────────
  BTN_DOWNLOAD_REFERRAL: 'button:has-text("ดาวน์โหลดหนังสือขอความอนุเคราะห์")',
  BTN_DOWNLOAD_ACCEPTANCE_FORM: ':text("ดาวน์โหลดแบบฟอร์มหนังสือตอบรับ")',
  ACCEPTANCE_FILE_INPUT: '[aria-label="เลือกไฟล์หนังสือตอบรับ PDF"]',
  BTN_UPLOAD_ACCEPTANCE: 'button:has-text("อัปโหลดหนังสือตอบรับ")',
  ACCEPTANCE_STATUS_APPROVED: ':text("✓ อนุมัติแล้ว")',
  ACCEPTANCE_STATUS_PENDING: ':text("⏳ รอตรวจสอบ")',

  // ─── Internship — Company Info ────────────────────────────────────
  SUPERVISOR_NAME: '#supervisor-name',
  SUPERVISOR_POSITION: '#supervisor-position',
  SUPERVISOR_PHONE: '#supervisor-phone',
  SUPERVISOR_EMAIL: '#supervisor-email',
  BTN_SAVE_COMPANY: 'button:has-text("บันทึกข้อมูล")',
  BTN_EDIT_COMPANY: 'button:has-text("แก้ไขข้อมูล")',

  // ─── Internship — Logbook ─────────────────────────────────────────
  LOGBOOK_MODAL: '[aria-labelledby="logbook-modal-title"]',
  LOGBOOK_TIME_IN: '#logbook-time-in',
  LOGBOOK_TIME_OUT: '#logbook-time-out',
  LOGBOOK_TITLE: '#logbook-title',
  LOGBOOK_DESCRIPTION: '#logbook-description',
  LOGBOOK_LEARNING: '#logbook-learning',
  BTN_LOGBOOK_FILL: 'button:has-text("กรอกข้อมูล")',
  BTN_LOGBOOK_EDIT: 'button:has-text("แก้ไข")', // [unused]
  BTN_LOGBOOK_SAVE: 'button:has-text("บันทึกข้อมูล")', // [unused]

  // ─── Admin — Internship Document Review ───────────────────────────
  BTN_FORWARD_DOC: 'button:has-text("ส่งต่อ")', // [unused]
  BTN_BULK_REVIEW: 'button:has-text("ตรวจและส่งต่อ")', // [unused]
  REJECT_REASON_INPUT: 'textarea[placeholder*="กรอกเหตุผลอย่างน้อย"]', // [unused]
  BTN_CONFIRM_REJECT: 'button:has-text("ยืนยันปฏิเสธ")', // [unused]
  ADMIN_FEEDBACK_ALERT: '[class*="alert"]',

  // ─── Admin — Document Management (Internship/Project/Certificates) ──
  ADMIN_DOC_HEADER: ':text("จัดการเอกสาร"), :text("จัดการคำร้อง")',
  ADMIN_DOC_STATS: '[class*="stats"], [class*="stat"]',
  ADMIN_DOC_SEARCH: 'input[placeholder*="ค้นหา"]',
  ADMIN_DOC_STATUS_FILTER: '[class*="filters"] select, select',
  ADMIN_DOC_TABLE: 'table, [class*="table"]',
  ADMIN_DOC_DETAIL_BTN: 'button:has-text("รายละเอียด")',
  ADMIN_DOC_APPROVE_BTN: 'button:has-text("อนุมัติ")',
  ADMIN_DOC_REJECT_BTN: 'button:has-text("ปฏิเสธ")',
  ADMIN_DOC_FORWARD_BTN: 'button:has-text("ส่งต่อ"), button:has-text("ตรวจและส่งต่อ")',
  ADMIN_DOC_RESET_FILTER: 'button:has-text("รีเซ็ตตัวกรอง")',
  ADMIN_DOC_PAGINATION: '[class*="pagination"]',
  ADMIN_DOC_DRAWER: '[class*="drawer"]',

  // ─── Admin — Certificate Management ─────────────────────────────────
  CERT_APPROVE_MODAL: '[class*="modal"], [role="dialog"]',
  CERT_NUMBER_INPUT: '[class*="modal"] input',
  CERT_REJECT_TEXTAREA: '[class*="modal"] textarea',
  CERT_CONFIRM_BTN: '[class*="modal"] button:has-text("ยืนยัน")',
  CERT_CANCEL_BTN: '[class*="modal"] button:has-text("ยกเลิก")',

  // ─── Admin — Exam Results ───────────────────────────────────────────
  EXAM_RESULT_HEADER: ':text("บันทึกผลสอบ")',
  EXAM_PASS_BTN: 'button:has-text("ผ่าน")',
  EXAM_FAIL_BTN: 'button:has-text("ไม่ผ่าน")',
  EXAM_EDIT_BTN: 'button:has-text("แก้ไขผล")',
  EXAM_EXPORT_BTN: 'button:has-text("ส่งออก Excel"), button:has-text("Export")',
  EXAM_PREVIEW_BTN: 'button:has-text("ดูตัวอย่างก่อนส่งออก")',
  EXAM_DETAIL_BTN: 'button:has-text("รายละเอียด")',
  EXAM_MODAL: '[class*="modal"], [role="dialog"]',
  EXAM_MODAL_CANCEL: '[class*="modal"] button:has-text("ยกเลิก")',
  EXAM_FAIL_REASON: '[class*="modal"] textarea',

  // ─── Student — Dashboard ────────────────────────────────────────────
  DASHBOARD_WIDGET: '[class*="widget"], [class*="card"], [class*="section"]',
  DASHBOARD_NAV_LINK: 'a[href*="/project"], a[href*="/internship"], a[href*="/deadlines"]',

  // ─── Public — Timesheet Approval ────────────────────────────────────
  TIMESHEET_BRANDING: ':text("CS Logbook"), :text("อนุมัติบันทึกการฝึกงาน")',
  TIMESHEET_SUMMARY_CARD: '[class*="summaryCard"], [class*="summary"]',
  TIMESHEET_ENTRY_CARD: '[class*="entryCard"], [class*="entry"]',
  TIMESHEET_RADIO_APPROVE: '[class*="radioCard"]:has-text("อนุมัติ")',
  TIMESHEET_RADIO_REJECT: '[class*="radioCard"]:has-text("ปฏิเสธ")',
  TIMESHEET_COMMENT: 'textarea[placeholder*="หมายเหตุ"], textarea[placeholder*="เหตุผล"]',
  TIMESHEET_SUBMIT: 'button:has-text("ยืนยันการดำเนินการ")',

  // ─── Public — Supervisor Evaluation ─────────────────────────────────
  EVAL_HERO: ':text("แบบประเมินผลการฝึกงาน")',
  EVAL_SUPERVISOR_NAME: 'input[placeholder*="นายสมศักดิ์"], input[placeholder*="ชื่อ"]',
  EVAL_SUPERVISOR_POSITION: 'input[placeholder*="Senior"], input[placeholder*="ตำแหน่ง"]',
  EVAL_RATING_BUTTON: '[class*="ratingButton"]',
  EVAL_DECISION_PASS: 'button:has-text("ผ่าน"), [class*="decisionButton"]:has-text("ผ่าน")',
  EVAL_DECISION_FAIL: 'button:has-text("ไม่ผ่าน"), [class*="decisionButton"]:has-text("ไม่ผ่าน")',
  EVAL_STRENGTHS: 'textarea[placeholder*="จุดเด่น"]',
  EVAL_IMPROVEMENTS: 'textarea[placeholder*="ควรปรับปรุง"]',
  EVAL_SUBMIT: 'button:has-text("ส่งแบบประเมิน")',
  EVAL_SCORE_TOTAL: ':text("คะแนนรวม")',
} as const;
