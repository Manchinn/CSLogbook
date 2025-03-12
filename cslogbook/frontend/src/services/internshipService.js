import axios from 'axios';

const BASE_URL = '/api/internship';

export const internshipService = {
  // CS05 Form
  submitCS05: async (formData) => {
    return await axios.post(`${BASE_URL}/cs05`, formData);
  },

  // Daily Record
  submitDailyRecord: async (record) => {
    return await axios.post(`${BASE_URL}/logbook/daily`, record);
  },

  // Get summary
  getInternshipSummary: async (studentId) => {
    return await axios.get(`${BASE_URL}/summary/${studentId}`);
  }
};