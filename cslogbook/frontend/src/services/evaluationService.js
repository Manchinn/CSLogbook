import apiClient from './apiClient';

/**
 * Fetches the initial details for a supervisor evaluation form using a token.
 * @param {string} token - The evaluation token.
 * @returns {Promise<object>} The evaluation details.
 */
export const getSupervisorEvaluationDetails = (token) => {
  return apiClient.get(`/internship/supervisor/evaluation/${token}/details`);
};

/**
 * Submits the supervisor's evaluation form.
 * @param {string} token - The evaluation token.
 * @param {object} evaluationData - The data from the evaluation form.
 * @returns {Promise<object>} The API response.
 */
export const submitSupervisorEvaluation = (token, evaluationData) => {
  return apiClient.post(`/internship/supervisor/evaluation/${token}`, evaluationData);
};

// Add other evaluation-related API calls here if needed
