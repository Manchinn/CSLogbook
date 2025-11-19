// services/reports/workflowReportService.js
import apiClient from 'services/apiClient';

/**
 * ดึงรายงานความคืบหน้า workflow
 * @param {Object} params - { workflowType, academicYear, semester }
 */
export const getWorkflowProgress = async (params = {}) => {
  try {
    const response = await apiClient.get('/reports/workflow/progress', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching workflow progress:', error);
    throw error;
  }
};

/**
 * ดึงขั้นตอนที่นักศึกษาติดมากที่สุด
 */
export const getBottlenecks = async (params = {}) => {
  try {
    const response = await apiClient.get('/reports/workflow/bottlenecks', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching bottlenecks:', error);
    throw error;
  }
};

/**
 * ดึง Timeline ของนักศึกษา
 */
export const getStudentTimeline = async (studentId, workflowType) => {
  try {
    const response = await apiClient.get(`/reports/workflow/student-timeline/${studentId}`, {
      params: { workflowType }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching student timeline:', error);
    throw error;
  }
};

/**
 * ดึงรายชื่อนักศึกษาที่ติดขัด
 */
export const getBlockedStudents = async (params = {}) => {
  try {
    const response = await apiClient.get('/reports/workflow/blocked-students', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching blocked students:', error);
    throw error;
  }
};
