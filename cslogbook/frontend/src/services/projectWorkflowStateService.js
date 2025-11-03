/**
 * Project Workflow State Service
 * 
 * Service สำหรับเรียก API ที่เกี่ยวข้องกับ ProjectWorkflowState
 * รวมถึงข้อมูล deadline ที่เกี่ยวข้อง
 */

import apiClient from './apiClient';

/**
 * ดึงสถิติภาพรวมของโครงงานทั้งหมด
 * @param {Object} params - { academicYear, semester }
 * @returns {Promise} { summary, byPhase }
 */
export const getProjectWorkflowStatistics = async (params = {}) => {
  try {
    const response = await apiClient.get('/projects/workflow-states/statistics', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching project workflow statistics:', error);
    throw error;
  }
};

/**
 * ดึงสถานะของโครงงานเฉพาะ
 * @param {number} projectId - Project ID
 * @returns {Promise} Project workflow state with helper methods
 */
export const getProjectWorkflowState = async (projectId) => {
  try {
    const response = await apiClient.get(`/projects/${projectId}/workflow-state`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching workflow state for project ${projectId}:`, error);
    throw error;
  }
};

/**
 * ดึงสถานะของโครงงานพร้อมข้อมูล deadline
 * @param {number} projectId - Project ID
 * @returns {Promise} Project state with deadlines info
 */
export const getProjectStateWithDeadlines = async (projectId) => {
  try {
    const response = await apiClient.get(`/projects/${projectId}/workflow-state/deadlines`);
    
    // Backend จะส่ง deadlines info มาด้วย
    return response.data;
  } catch (error) {
    console.error(`Error fetching project state with deadlines for ${projectId}:`, error);
    throw error;
  }
};

/**
 * ดึงโครงงานที่ต้องให้ความสนใจ (blocked, overdue, pending exam)
 * @param {Object} params - { academicYear, semester, limit }
 * @returns {Promise} Array of projects requiring attention
 */
export const getProjectsRequiringAttention = async (params = {}) => {
  try {
    const response = await apiClient.get('/projects/workflow-states/attention', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching projects requiring attention:', error);
    throw error;
  }
};

/**
 * ดึงสถิติสำหรับ admin dashboard
 * @param {Object} params - { academicYear, semester }
 * @returns {Promise} Admin dashboard statistics
 */
export const getAdminDashboardStatistics = async (params = {}) => {
  try {
    const response = await apiClient.get('/admin/dashboard/project-statistics', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching admin dashboard statistics:', error);
    throw error;
  }
};

/**
 * ดึงโครงงานตาม filter
 * @param {Object} params - { currentPhase, isBlocked, isOverdue, academicYear, semester, limit, offset }
 * @returns {Promise} { total, items, limit, offset }
 */
export const getProjectsByFilter = async (params = {}) => {
  try {
    const response = await apiClient.get('/projects/workflow-states/filter', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching projects by filter:', error);
    throw error;
  }
};

/**
 * ดึง applicable deadlines สำหรับโครงงาน
 * @param {number} projectId - Project ID
 * @returns {Promise} Array of applicable deadlines
 */
export const getApplicableDeadlines = async (projectId) => {
  try {
    // ใช้ getProjectStateWithDeadlines แล้วดึง deadlines.upcoming
    const state = await getProjectStateWithDeadlines(projectId);
    return state.data?.deadlines?.upcoming || [];
  } catch (error) {
    console.error(`Error fetching applicable deadlines for project ${projectId}:`, error);
    throw error;
  }
};

/**
 * ตรวจสอบ overdue status ของโครงงาน
 * @param {number} projectId - Project ID
 * @returns {Promise} { isOverdue, overdueDeadlines, nextDeadline }
 */
export const checkProjectOverdue = async (projectId) => {
  try {
    const state = await getProjectStateWithDeadlines(projectId);
    return {
      isOverdue: state.data?.isOverdue || false,
      overdueDeadlines: state.data?.deadlines?.overdue || [],
      nextDeadline: state.data?.deadlines?.next || null
    };
  } catch (error) {
    console.error(`Error checking overdue for project ${projectId}:`, error);
    throw error;
  }
};

const projectWorkflowStateService = {
  getProjectWorkflowStatistics,
  getProjectWorkflowState,
  getProjectStateWithDeadlines,
  getProjectsRequiringAttention,
  getAdminDashboardStatistics,
  getProjectsByFilter,
  getApplicableDeadlines,
  checkProjectOverdue
};

export default projectWorkflowStateService;
