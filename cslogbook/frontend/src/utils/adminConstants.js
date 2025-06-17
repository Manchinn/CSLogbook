// สถานะเอกสาร
export const DOCUMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUPERVISOR_EVALUATED: 'supervisor_evaluated' // เพิ่มสถานะใหม่
};

// สถานะการฝึกงานและโครงงาน
export const STUDENT_STATUS = {
  ELIGIBLE_INTERNSHIP: 'eligible_internship',
  ELIGIBLE_PROJECT: 'eligible_project',
  IN_PROGRESS_INTERNSHIP: 'in_progress_internship',
  IN_PROGRESS_PROJECT: 'in_progress_project',
  COMPLETED_INTERNSHIP: 'completed_internship',
  COMPLETED_PROJECT: 'completed_project',
  NO_ELIGIBILITY: 'no_eligibility' // เพิ่มสถานะใหม่

};

// ประเภทผู้ใช้
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
};

// ตัวเลือกสำหรับการกรองสถานะเอกสาร
export const DOCUMENT_STATUS_OPTIONS = [
  { label: 'รอการตรวจสอบ', value: DOCUMENT_STATUS.PENDING },
  { label: 'อนุมัติแล้ว', value: DOCUMENT_STATUS.APPROVED },
  { label: 'ไม่อนุมัติ', value: DOCUMENT_STATUS.REJECTED },
  { label: 'ทั้งหมด', value: '' }
];

// ประเภทเอกสาร
export const DOCUMENT_TYPES = {
  INTERNSHIP: 'internship',
  PROJECT: 'project'
};