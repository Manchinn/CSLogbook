// Placeholder for AuthContext.js
// รอย้ายโค้ด หรือสร้างใหม่ตามโครงสร้างที่แนะนำ
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';

export const AuthContext = createContext({
  isAuthenticated: false,
  userData: null,
  login: () => {},
  logout: () => {},
});

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
    studentCode: localStorage.getItem('studentCode'),
    firstName: localStorage.getItem('firstName'),
    lastName: localStorage.getItem('lastName'),
    email: localStorage.getItem('email'),
    role: localStorage.getItem('role'),
    totalCredits: parseInt(localStorage.getItem('totalCredits')) || 0,
    majorCredits: parseInt(localStorage.getItem('majorCredits')) || 0,
    isEligibleForInternship: localStorage.getItem('isEligibleForInternship') === 'true',
    isEligibleForProject: localStorage.getItem('isEligibleForProject') === 'true'
  });

  const handleLogout = useCallback(async () => {
    try {
      delete axios.defaults.headers.common['Authorization'];
      
      const keysToRemove = [
        'token', 'refreshToken', 'studentCode', 'firstName', 
        'lastName', 'email', 'role', 'isEligibleForInternship', 
        'isEligibleForProject', 'totalCredits', 'majorCredits'
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
  }, []);

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
  }, [refreshToken, handleLogout]);

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
  }, [token, handleLogout]);

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
  }, [refreshToken, handleLogout]);

  const handleAPIError = (error, fallbackMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์') => {
    console.error('API Error:', error);
    const errorMessage = error.response?.data?.message || fallbackMessage;
    message.error(errorMessage);
    if (error.response?.status === 401) {
      handleLogout();
    }
  };

  const handleLogin = async ({ token, refreshToken, userData }) => {
    try {
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      const userDataToStore = {
        studentCode: userData.studentCode,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        totalCredits: userData.totalCredits || 0,
        majorCredits: userData.majorCredits || 0
      };

      // Store data first
      Object.entries(userDataToStore).forEach(([key, value]) => {
        if (value !== undefined) {
          localStorage.setItem(key, String(value));
        }
      });

      setToken(token);
      setRefreshToken(refreshToken);
      setIsAuthenticated(true);
      setUserData(userDataToStore);


      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    } catch (error) {
      handleAPIError(error, 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      return false;
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
