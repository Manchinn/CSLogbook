// src/services/reportService.js
// เรียกใช้ API รายงานฝั่ง backend
import apiClient from './apiClient';

export async function getOverview(params = {}) {
  const { year } = params;
  const res = await apiClient.get(`/reports/overview`, { params: { year } });
  return res.data.data;
}

export async function getInternshipLogbookCompliance(params = {}) {
  const { year } = params;
  const res = await apiClient.get(`/reports/internships/logbook-compliance`, { params: { year } });
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
  const { year } = params;
  const res = await apiClient.get(`/reports/internships/student-summary`, { params: { year } });
  return res.data.data;
}

export async function getInternshipEvaluationSummary(params = {}) {
  const { year, semester } = params;
  const res = await apiClient.get(`/reports/internships/evaluations/summary`, { params: { year, semester } });
  return res.data.data;
}

// รายชื่อนักศึกษาที่ลงทะเบียนฝึกงาน (ลด payload จาก /students ทั้งระบบ)
export async function getEnrolledInternshipStudents(params = {}) {
  const { year } = params; // ปัจจุบัน backend ยังไม่ filter year แต่ส่งไว้รองรับอนาคต
  const res = await apiClient.get(`/reports/internships/enrolled-students`, { params: { year } });
  return res.data.data;
}
