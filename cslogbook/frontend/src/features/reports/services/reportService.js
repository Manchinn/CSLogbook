// src/services/reportService.js
// เรียกใช้ API รายงานฝั่ง backend
import apiClient from 'services/apiClient';

export async function getOverview(params = {}) {
  const { year } = params;
  const res = await apiClient.get(`/reports/overview`, { params: { year } });
  return res.data.data;
}

export async function getInternshipLogbookCompliance(params = {}) {
  const { year, semester } = params;
  const res = await apiClient.get(`/reports/internships/logbook-compliance`, { params: { year, semester } });
  return res.data.data;
}

export async function getProjectStatusSummary(params = {}) {
  const { year } = params;
  const res = await apiClient.get(`/reports/projects/status-summary`, { params: { year } });
  return res.data.data;
}

export async function getAdvisorLoad(params = {}) {
  const { year } = params;
  const res = await apiClient.get(`/reports/projects/advisor-load`, { params: { year } });
  return res.data.data;
}

export async function getInternshipStudentSummary(params = {}) {
  const { year, semester } = params;
  const res = await apiClient.get(`/reports/internships/student-summary`, { params: { year, semester } });
  return res.data.data;
}

export async function getInternshipEvaluationSummary(params = {}) {
  const { year, semester } = params;
  const res = await apiClient.get(`/reports/internships/evaluations/summary`, { params: { year, semester } });
  return res.data.data;
}

// รายการปีการศึกษาที่มีข้อมูลฝึกงาน (distinct academic_year)
export async function getInternshipAcademicYears() {
  const res = await apiClient.get(`/reports/internships/academic-years`);
  return res.data.data || [];
}

// รายการปีการศึกษาที่มีข้อมูลโครงงาน (distinct academic_year)
export async function getProjectAcademicYears() {
  const res = await apiClient.get(`/reports/projects/academic-years`);
  return res.data.data || [];
}

// รายชื่อนักศึกษาที่ลงทะเบียนฝึกงาน (ลด payload จาก /students ทั้งระบบ)
export async function getEnrolledInternshipStudents(params = {}) {
  const { year } = params; // ปัจจุบัน backend ยังไม่ filter year แต่ส่งไว้รองรับอนาคต
  const res = await apiClient.get(`/reports/internships/enrolled-students`, { params: { year } });
  return res.data.data;
}
