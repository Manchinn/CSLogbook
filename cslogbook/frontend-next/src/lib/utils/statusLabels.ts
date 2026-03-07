/**
 * Centralized label maps for all status enum values used in the app.
 * Always use labelStatus() instead of rendering raw enum values in JSX.
 */

export const STATUS_LABELS: Record<string, string> = {
  // Internship / Certificate
  not_requested: "ยังไม่ร้องขอ",
  pending:       "รอดำเนินการ",
  approved:      "อนุมัติแล้ว",
  rejected:      "ไม่อนุมัติ",
  ready:         "พร้อมใช้งาน",
  active:        "ใช้งานอยู่",
  inactive:      "ไม่ใช้งาน",
  completed:     "เสร็จสิ้น",
  cancelled:     "ยกเลิก",

  // Internship workflow
  not_started:       "ยังไม่เริ่ม",
  in_progress:       "กำลังดำเนินการ",
  pending_approval:  "รอการอนุมัติ",

  // Academic schedule
  draft: "ร่าง",

  // Document / Deadline
  open:   "เปิดรับ",
  closed: "ปิดรับ",
  late:   "เลยกำหนด",
  overdue: "เกินกำหนด",

  // Project workflow
  submitted:         "ส่งแล้ว",
  advisor_in_review: "อาจารย์กำลังตรวจ",
  advisor_approved:  "อาจารย์อนุมัติ",
  staff_verified:    "เจ้าหน้าที่ตรวจแล้ว",
  scheduled:         "นัดสอบแล้ว",

  // Project defense / system test workflow
  advisor_assigned:   "มีอาจารย์ที่ปรึกษาแล้ว",
  pending_staff:      "รอเจ้าหน้าที่ตรวจสอบ",
  staff_rejected:     "เจ้าหน้าที่ส่งกลับ",
  staff_approved:     "อนุมัติ (รอหลักฐาน)",
  advisor_rejected:   "อาจารย์ส่งกลับ",
  evidence_submitted: "ส่งหลักฐานแล้ว",
  pending_advisor:    "รออาจารย์ตรวจสอบ",

  // Exam / evaluation results
  pass:   "ผ่าน",
  passed: "ผ่าน",
  fail:   "ไม่ผ่าน",
  failed: "ไม่ผ่าน",

  // Deadline / document timeliness
  very_late: "ส่งช้ามาก",

  // Project workflow phases (uppercase จาก backend)
  topic_exam_pending:    "รอยื่นสอบหัวข้อ",
  topic_exam_scheduled:  "นัดสอบหัวข้อแล้ว",
  topic_failed:          "สอบหัวข้อไม่ผ่าน",
  thesis_in_progress:    "กำลังทำปริญญานิพนธ์",
  thesis_exam_pending:   "รอยื่นสอบปริญญานิพนธ์",
  thesis_exam_scheduled: "นัดสอบปริญญานิพนธ์แล้ว",
  thesis_failed:         "สอบปริญญานิพนธ์ไม่ผ่าน",
  archived:              "จัดเก็บแล้ว",

  // Student eligibility compound states
  in_progress_internship: "กำลังฝึกงาน",
  in_progress_project:    "กำลังทำโครงงาน",
  completed_internship:   "ฝึกงานเสร็จสิ้น",
  completed_project:      "โครงงานเสร็จสิ้น",

  // Internship status for students
  not_eligible:   "ไม่ผ่านเกณฑ์",
  eligible:       "ผ่านเกณฑ์",
};

/**
 * Returns a human-readable Thai label for a raw status enum value.
 * Falls back to the raw value itself if no mapping is found,
 * so unknown statuses are still visible rather than silently hidden.
 *
 * @param value  Raw status string from the API (e.g. "not_requested")
 * @param fallback  Shown when value is null/undefined/empty (default: "-")
 */
export function labelStatus(value?: string | null, fallback = "-"): string {
  if (!value) return fallback;
  // ลอง exact match ก่อน แล้ว fallback เป็น lowercase เพื่อรองรับ backend ที่ส่ง uppercase เช่น IN_PROGRESS, PASS
  return STATUS_LABELS[value] ?? STATUS_LABELS[value.toLowerCase()] ?? value;
}

/**
 * Formats remaining days into a human-readable string.
 * Shows "หมดระยะเวลาแล้ว" when days is negative (period already ended).
 *
 * @param days  Remaining days (can be negative)
 */
export function formatRemainingDays(days?: number | null): string {
  if (days === undefined || days === null) return "-";
  if (days < 0) return "หมดระยะเวลาแล้ว";
  if (days === 0) return "ภายในวันนี้";
  return `เหลือ ${days} วัน`;
}
