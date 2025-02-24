import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { message } from 'antd';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState({
    studentID: localStorage.getItem('studentID'),
    firstName: localStorage.getItem('firstName'),
    lastName: localStorage.getItem('lastName'),
    email: localStorage.getItem('email'),
    role: localStorage.getItem('role'),
    isEligibleForInternship: localStorage.getItem('isEligibleForInternship') === 'true',
    isEligibleForProject: localStorage.getItem('isEligibleForProject') === 'true'
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
            const response = await axios.post('http://localhost:5000/auth/refresh-token', {
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

  const handleLogin = async ({ token, refreshToken, userData }) => {
    try {
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // เก็บ user data
      const userDataToStore = {
        studentID: userData.studentID,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        isEligibleForInternship: (parseInt(userData.studentID.substring(0, 2)) <= 63) && (userData.totalCredits >= 81),
        isEligibleForProject: (parseInt(userData.studentID.substring(0, 2)) <= 62) && (userData.totalCredits >= 95) && (userData.majorCredits >= 47)
      };

      // บันทึกลง localStorage
      Object.entries(userDataToStore).forEach(([key, value]) => {
        if (value !== undefined) {
          localStorage.setItem(key, String(value));
        }
      });

      setToken(token);
      setRefreshToken(refreshToken);
      setIsAuthenticated(true);
      setUserData(userDataToStore);

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return true;
    } catch (error) {
      console.error('Login error:', error);
      message.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      // ลบ axios default header
      delete axios.defaults.headers.common['Authorization'];
      
      // Clear localStorage
      const keysToRemove = [
        'token', 'refreshToken', 'studentID', 'firstName', 
        'lastName', 'email', 'role', 'isEligibleForInternship', 
        'isEligibleForProject'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Reset states
      setToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
      setUserData(null);

      // Redirect to login
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