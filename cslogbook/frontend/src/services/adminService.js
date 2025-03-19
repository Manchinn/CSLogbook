import apiClient from './apiClient';

export const adminService = {
  getStats: async () => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },
  
  uploadStudents: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/admin/upload-students', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};