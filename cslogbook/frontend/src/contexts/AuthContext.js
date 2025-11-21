import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/apiClient';
import { teacherService } from 'features/user-management/services/teacherService';
import { message } from 'antd';

export const AuthContext = createContext({
  isAuthenticated: false,
  userData: null,
  login: () => {},
  logout: () => {},
});

// baseURL อยู่ใน apiClient แล้ว ดังนั้นไม่ต้องสร้างซ้ำ
// ใน test environment ให้ใช้ค่า default แทนการ throw error
if (!process.env.REACT_APP_API_URL) {
  if (process.env.NODE_ENV === 'test' || process.env.CI) {
    process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
  } else {
    throw new Error('REACT_APP_API_URL is not defined in environment variables');
  }
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
    teacherId: localStorage.getItem('teacherId'),
    teacherCode: localStorage.getItem('teacherCode'),
    teacherType: localStorage.getItem('teacherType'), // เพิ่ม teacher type
    teacherPosition: localStorage.getItem('teacherPosition'),
    canAccessTopicExam: localStorage.getItem('canAccessTopicExam') === 'true',
  canExportProject1: localStorage.getItem('canExportProject1') === 'true',
    totalCredits: parseInt(localStorage.getItem('totalCredits')) || 0,
    majorCredits: parseInt(localStorage.getItem('majorCredits')) || 0,
    isEligibleForInternship: localStorage.getItem('isEligibleForInternship') === 'true',
    isEligibleForProject: localStorage.getItem('isEligibleForProject') === 'true'
  });

  const teacherProfileFetchedRef = useRef(false);

  const handleLogout = useCallback(async () => {
    try {
      // เคลียร์ header จาก apiClient แทน axios ตรง
      delete apiClient.defaults.headers.common['Authorization'];
      
      const keysToRemove = [
        'token', 'refreshToken', 'studentCode', 'firstName', 
        'lastName', 'email', 'role', 'teacherId', 'teacherCode', 'teacherType', 'teacherPosition', 'canAccessTopicExam', 'canExportProject1', 'isEligibleForInternship', 
        'isEligibleForProject', 'totalCredits', 'majorCredits'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));

      setToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
      setUserData(null);
      teacherProfileFetchedRef.current = false;

      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      message.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  }, []);

  // Interceptor จัดการ refresh token (พร้อม queue กันหลายคำขอชนกัน)
  const isRefreshingRef = useRef(false);
  const refreshQueueRef = useRef([]); // เก็บคำสัญญาที่รอ refresh สำเร็จ

  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // ยกเว้น login endpoint ให้จัดการ error เอง
        const isLoginRequest = originalRequest?.url?.includes('/auth/login');
        if (isLoginRequest) {
          return Promise.reject(error);
        }
        
        // ถ้าไม่ใช่ 401 หรือเป็น endpoint refresh เอง ให้ reject ตามปกติ
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        if (!refreshToken) {
          handleLogout();
          return Promise.reject(error);
        }

        // ทำเครื่องหมายว่า retry แล้วเพื่อกัน loop
        originalRequest._retry = true;

        // ถ้ามีการ refresh กำลังดำเนินอยู่ -> รอคิว
        if (isRefreshingRef.current) {
          return new Promise((resolve, reject) => {
            refreshQueueRef.current.push({ resolve, reject });
          })
            .then((newToken) => {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return apiClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        // เริ่ม refresh ใหม่
        isRefreshingRef.current = true;
        try {
          const res = await apiClient.post('/auth/refresh-token', { refreshToken });
          const { token: newToken } = res.data;
          setToken(newToken);
          localStorage.setItem('token', newToken);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

          // ปลุก queue
            refreshQueueRef.current.forEach(p => p.resolve(newToken));
            refreshQueueRef.current = [];

          // ตั้ง header แล้วส่งคำขอเดิมซ้ำ
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          refreshQueueRef.current.forEach(p => p.reject(refreshErr));
          refreshQueueRef.current = [];
          handleLogout();
          return Promise.reject(refreshErr);
        } finally {
          isRefreshingRef.current = false;
        }
      }
    );

    return () => {
      apiClient.interceptors.response.eject(interceptor);
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
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${currToken}`;
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
          const response = await apiClient.post('/auth/refresh-token', { refreshToken });

          const { token: newToken } = response.data;
          setToken(newToken);
          localStorage.setItem('token', newToken);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
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
        teacherId: userData.teacherId,
        teacherCode: userData.teacherCode,
        teacherType: userData.teacherType, // เพิ่ม teacher type
        teacherPosition: userData.teacherPosition,
        canAccessTopicExam: Boolean(userData.canAccessTopicExam),
  canExportProject1: Boolean(userData.canExportProject1),
        totalCredits: userData.totalCredits || 0,
        majorCredits: userData.majorCredits || 0,
        isEligibleForInternship: userData.isEligibleForInternship,
        isEligibleForProject: userData.isEligibleForProject
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
      teacherProfileFetchedRef.current = false;

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    } catch (error) {
      handleAPIError(error, 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      return false;
    }
  };

  useEffect(() => {
    if (!token) {
      teacherProfileFetchedRef.current = false;
      return;
    }

    if (!userData || userData.role !== 'teacher') {
      teacherProfileFetchedRef.current = false;
      return;
    }

    const isProfileIncomplete =
      !userData.teacherPosition ||
      !userData.teacherId ||
  !userData.teacherCode ||
  typeof userData.canAccessTopicExam !== 'boolean' ||
  typeof userData.canExportProject1 !== 'boolean';

    if (!isProfileIncomplete) {
      return;
    }

    if (teacherProfileFetchedRef.current) {
      return;
    }

    const fetchTeacherProfile = async () => {
      teacherProfileFetchedRef.current = true;

      try {
        const profileResponse = await teacherService.getTeacherInfo('me');

        if (profileResponse?.success && profileResponse.data) {
          const {
            teacherId,
            teacherCode,
            position,
            teacherType,
            canAccessTopicExam,
            canExportProject1,
          } = profileResponse.data;

          setUserData((previous) => {
            const prevData = previous || {};
            const updated = {
              ...prevData,
              teacherId: teacherId ?? prevData.teacherId,
              teacherCode: teacherCode ?? prevData.teacherCode,
              teacherType: teacherType ?? prevData.teacherType,
              teacherPosition: position ?? prevData.teacherPosition,
              canAccessTopicExam:
                typeof canAccessTopicExam === 'boolean'
                  ? canAccessTopicExam
                  : prevData.canAccessTopicExam ?? false,
              canExportProject1:
                typeof canExportProject1 === 'boolean'
                  ? canExportProject1
                  : prevData.canExportProject1 ?? false,
            };

            if (updated.teacherId !== undefined && updated.teacherId !== null) {
              localStorage.setItem('teacherId', String(updated.teacherId));
            }
            if (updated.teacherCode) {
              localStorage.setItem('teacherCode', String(updated.teacherCode));
            }
            if (updated.teacherType) {
              localStorage.setItem('teacherType', String(updated.teacherType));
            }
            if (updated.teacherPosition) {
              localStorage.setItem('teacherPosition', updated.teacherPosition);
            }
            if (typeof updated.canAccessTopicExam === 'boolean') {
              localStorage.setItem(
                'canAccessTopicExam',
                String(updated.canAccessTopicExam)
              );
            }
            if (typeof updated.canExportProject1 === 'boolean') {
              localStorage.setItem(
                'canExportProject1',
                String(updated.canExportProject1)
              );
            }

            return updated;
          });
        }
      } catch (error) {
        console.error('Error fetching teacher profile:', error);
        teacherProfileFetchedRef.current = false;
      }
    };

    fetchTeacherProfile();
  }, [token, userData]);

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