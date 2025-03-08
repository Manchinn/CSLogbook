import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { message } from 'antd';

const AuthContext = createContext(null);
const API_URL = process.env.REACT_APP_API_URL;

if (!API_URL) {
  throw new Error('REACT_APP_API_URL is not defined in environment variables');
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    userId: localStorage.getItem('user_id'),
    username: localStorage.getItem('username'),
    email: localStorage.getItem('email'),
    firstName: localStorage.getItem('first_name'),
    lastName: localStorage.getItem('last_name'),
    role: localStorage.getItem('role'),
    roleDetails: JSON.parse(localStorage.getItem('role_details') || '{}'),
    studentCode: localStorage.getItem('student_code'),
    totalCredits: Number(localStorage.getItem('total_credits')),
    majorCredits: Number(localStorage.getItem('major_credits')),
    isEligibleInternship: localStorage.getItem('is_eligible_internship') === 'true',
    isEligibleProject: localStorage.getItem('is_eligible_project') === 'true'
  });

  // ตั้งค่า axios interceptor สำหรับจัดการ token
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
          originalRequest._retry = true;

          try {
            const response = await axios.post(`${API_URL}/auth/refresh-token`, {
              refreshToken
            });

            const { token: newToken } = response.data;
            setToken(newToken);
            localStorage.setItem('token', newToken);

            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            handleLogout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshToken]);

  // ลบ token เมื่อผู้ใช้ปิดแท็บ
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.removeItem('refreshToken');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // เช็คสถานะ token เมื่อ component โหลด
  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          // เช็คว่ามี token หรือไม่
          const currToken = localStorage.getItem('token');
          if (!currToken) {
            throw new Error('No token found');
          }

          // set default axios header
          axios.defaults.headers.common['Authorization'] = `Bearer ${currToken}`;
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token validation error:', error);
          handleLogout();
        }
      }
      setIsLoading(false);
    };

    validateToken();
  }, [token]);

  // รีเฟรช token เมื่อผู้ใช้งาน login เกิน 30 นาที
  useEffect(() => {
    const interval = setInterval(async () => {
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken
          });

          const { token: newToken } = response.data;
          setToken(newToken);
          localStorage.setItem('token', newToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        } catch (error) {
          console.error('Error refreshing token:', error);
          handleLogout();
        }
      }
    }, 5 * 60 * 1000); // 5 นาที

    return () => clearInterval(interval);
  }, [refreshToken]);

  const handleAPIError = (error, fallbackMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์') => {
    console.error('API Error:', error);
    const errorMessage = error.response?.data?.message || fallbackMessage;
    message.error(errorMessage);
    if (error.response?.status === 401) {
      handleLogout();
    }
  };

  const handleLogin = async ({ token, userData }) => {
    try {
      // เก็บข้อมูลใน localStorage แบบใหม่
      localStorage.setItem('token', token);
      localStorage.setItem('user_id', userData.userId);
      localStorage.setItem('username', userData.username);
      localStorage.setItem('email', userData.email);
      localStorage.setItem('first_name', userData.firstName);
      localStorage.setItem('last_name', userData.lastName);
      localStorage.setItem('role', userData.role);
      localStorage.setItem('student_code', userData.studentCode);
      localStorage.setItem('total_credits', userData.totalCredits);
      localStorage.setItem('major_credits', userData.majorCredits);
      localStorage.setItem('is_eligible_internship', userData.isEligibleForInternship);
      localStorage.setItem('is_eligible_project', userData.isEligibleForProject);

      setToken(token);
      setUserData(userData);
      setIsAuthenticated(true);

      // ตั้งค่า axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
        delete axios.defaults.headers.common['Authorization'];
        
        const keysToRemove = [
          'token', 'refreshToken', 'user_id', 'username', 
          'email', 'first_name', 'last_name', 'role',
          'student_code', 'total_credits',
          'major_credits', 'is_eligible_internship', 
          'is_eligible_project'
      ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        setToken(null);
        setRefreshToken(null);
        setIsAuthenticated(false);
        setUserData(null);
        
        window.location.href = '/login';
    } catch (error) {
        console.error('Logout error:', error);
        message.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
};

  const value = {
    isAuthenticated,
    isLoading,
    token,
    userData,
    login: handleLogin,
    logout: handleLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};