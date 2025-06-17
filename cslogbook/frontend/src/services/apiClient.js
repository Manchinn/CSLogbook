import axios from 'axios';
import { message } from 'antd';

const API_URL = process.env.REACT_APP_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // เพิ่ม timeout เป็น 30 วินาที
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ปรับปรุง log ให้แสดงเฉพาะข้อมูลที่มี
    const logData = {
      method: config.method,
      url: config.url,
      ...(config.data && { data: config.data }), // แสดง data เฉพาะเมื่อมีค่า
      ...(config.params && { params: config.params }) // เพิ่มการแสดง query parameters
    };
    
    console.log('API Request:', logData);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        message: 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง'
      });
    }
    if (error.response?.status === 401) {
      message.error('กรุณาเข้าสู่ระบบใหม่');
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;