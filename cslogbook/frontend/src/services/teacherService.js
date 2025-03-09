import apiClient from './apiClient';

export const teacherService = {
  getStats: async () => {
    const response = await apiClient.get('/teacher/stats');
    return response.data;
  }
};