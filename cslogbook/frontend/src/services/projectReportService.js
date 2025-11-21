// src/services/projectReportService.js
// Service สำหรับรายงานโครงงานพิเศษและปริญญานิพนธ์สำหรับงานธุรการ
import apiClient from './apiClient';

/**
 * ดึงรายงานรวมทุกอย่างสำหรับงานธุรการ
 * @param {Object} params - { academicYear, semester }
 * @returns {Promise<Object>} รายงานครบถ้วน (project1, project2, additional, summary)
 */
export async function getAdministrativeReport(params = {}) {
  const { academicYear, semester } = params;
  const res = await apiClient.get('/admin/reports/project/administrative', {
    params: { academicYear, semester }
  });
  return res.data.data;
}

/**
 * ดึงสถิติโครงงานพิเศษ (Project 1)
 * @param {Object} params - { academicYear, semester }
 * @returns {Promise<Object>} สถิติ Project 1
 */
export async function getProject1Statistics(params = {}) {
  const { academicYear, semester } = params;
  const res = await apiClient.get('/admin/reports/project/project1', {
    params: { academicYear, semester }
  });
  return res.data.data;
}

/**
 * ดึงสถิติปริญญานิพนธ์ (Project 2)
 * @param {Object} params - { academicYear, semester }
 * @returns {Promise<Object>} สถิติ Project 2
 */
export async function getProject2Statistics(params = {}) {
  const { academicYear, semester } = params;
  const res = await apiClient.get('/admin/reports/project/project2', {
    params: { academicYear, semester }
  });
  return res.data.data;
}

/**
 * ดึงรายชื่อนักศึกษาตามสถานะ
 * @param {Object} params - { status, academicYear, semester, limit, offset }
 * @returns {Promise<Object>} { total, items, limit, offset }
 */
export async function getStudentsByStatus(params = {}) {
  const { status, academicYear, semester, limit, offset } = params;
  const res = await apiClient.get('/admin/reports/project/students-by-status', {
    params: { status, academicYear, semester, limit, offset }
  });
  return res.data.data;
}

/**
 * ดึงแนวโน้มการสอบผ่าน/ไม่ผ่าน (เปรียบเทียบรายปี)
 * @param {Object} params - { startYear, endYear }
 * @returns {Promise<Array>} แนวโน้มรายปี
 */
export async function getExamTrends(params = {}) {
  const { startYear, endYear } = params;
  const res = await apiClient.get('/admin/reports/project/exam-trends', {
    params: { startYear, endYear }
  });
  return res.data.data;
}

