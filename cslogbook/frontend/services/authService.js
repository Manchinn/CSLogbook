import axios from 'axios';

const API_URL = 'http://localhost:5000';

const authService = {
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      const data = response.data;

      if (data.success) {
        // Store user data
        const userDataToStore = {
          studentID: data.studentID,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: data.role,
          isEligibleForInternship: data.isEligibleForInternship,
          isEligibleForProject: data.isEligibleForProject
        };

        // Store in localStorage
        Object.entries(userDataToStore).forEach(([key, value]) => {
          if (value !== undefined) {
            localStorage.setItem(key, value);
          }
        });
      }
      
      return data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || 
        'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์'
      );
    }
  },

  logout: () => {
    localStorage.clear();
  }
};

export default authService;