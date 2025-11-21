import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// สร้าง axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/students`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// เพิ่ม token ใน header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// จัดการ response และ error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token หมดอายุ หรือไม่ถูกต้อง
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const studentProjectService = {
  // ดูโครงงานของนักศึกษา
  getMyProjects: () => {
    return api.get('/projects');
  },

  // ดูรายละเอียดโครงงานเฉพาะ
  getProjectById: (projectId) => {
    return api.get(`/projects/${projectId}`);
  },

  // แก้ไขข้อมูลโครงงาน
  updateProject: (projectId, data) => {
    return api.put(`/projects/${projectId}`, data);
  },

  // เพิ่มสมาชิกในโครงงาน
  addMember: (projectId, memberData) => {
    return api.post(`/projects/${projectId}/members`, memberData);
  },

  // เปิดใช้งานโครงงาน
  activateProject: (projectId) => {
    return api.put(`/projects/${projectId}/activate`);
  }
};

export default studentProjectService;