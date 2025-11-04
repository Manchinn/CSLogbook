// services/reports/deadlineReportService.js
import apiClient from '../apiClient';

/**
 * ดึงรายงานการปฏิบัติตาม deadline
 */
export const getDeadlineCompliance = async (params = {}) => {
  try {
    const response = await apiClient.get('/reports/deadlines/compliance', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching deadline compliance:', error);
    throw error;
  }
};

/**
 * ดึง deadline ที่กำลังจะถึง
 */
export const getUpcomingDeadlines = async (params = {}) => {
  try {
    const response = await apiClient.get('/reports/deadlines/upcoming', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching upcoming deadlines:', error);
    throw error;
  }
};

/**
 * ดึง deadline ที่พ้นแล้ว
 */
export const getOverdueDeadlines = async (params = {}) => {
  try {
    const response = await apiClient.get('/reports/deadlines/overdue', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching overdue deadlines:', error);
    throw error;
  }
};

/**
 * ดึงรายชื่อนักศึกษาที่ส่งช้า/เลยกำหนด
 */
export const getLateSubmissions = async (params = {}) => {
  try {
    const response = await apiClient.get('/reports/deadlines/late-submissions', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching late submissions:', error);
    throw error;
  }
};

/**
 * ดึงประวัติการส่งงานของนักศึกษา
 */
export const getStudentDeadlineHistory = async (studentId, params = {}) => {
  try {
    const response = await apiClient.get(`/reports/students/${studentId}/deadline-history`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching student deadline history:', error);
    throw error;
  }
};
