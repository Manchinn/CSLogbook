import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import { studentService } from '../features/user-management/services/studentService';
import { useAuth } from './AuthContext';

const StudentEligibilityContext = createContext();

// Cache configuration (js-cache-storage)
const CACHE_KEY = 'studentEligibilityCache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// Helper functions for localStorage cache
const getCache = (studentCode) => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp, forStudent } = JSON.parse(cached);
    // Check if cache is for the same student and still valid
    if (forStudent === studentCode && Date.now() - timestamp < CACHE_TTL_MS) {
      return data;
    }
    // Cache expired or different student, remove it
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
};

const setCache = (data, studentCode) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
      forStudent: studentCode
    }));
  } catch {
    // Ignore storage errors
  }
};

export const useStudentEligibility = () => {
  return useContext(StudentEligibilityContext);
};

const defaultEligibility = {
  canAccessInternship: false,
  canAccessProject: false,
  canRegisterInternship: false,
  canRegisterProject: false,
  internshipReason: null,
  projectReason: null,
  requirements: null,
  academicSettings: null,
  messages: {},
  status: null,
  student: null,
  isLoading: true,
  lastUpdated: null
};

export const StudentEligibilityProvider = ({ children }) => {
  const { userData } = useAuth();
  const isFetchingRef = useRef(false);
  
  // Lazy state initialization with cache (rerender-lazy-state-init)
  const [eligibility, setEligibility] = useState(() => {
    if (userData?.role === 'student' && userData?.studentCode) {
      const cached = getCache(userData.studentCode);
      if (cached) {
        return { ...cached, isLoading: false };
      }
    }
    return defaultEligibility;
  });

  const fetchEligibility = useCallback(async (showMessage = false, force = false) => {
    if (!userData || userData.role !== 'student') {
      setEligibility(prev => ({
        ...prev,
        isLoading: false,
        canAccessInternship: false,
        canAccessProject: false,
      }));
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current && !force) return;

    // Check localStorage cache first (unless forced)
    if (!force) {
      const cached = getCache(userData.studentCode);
      if (cached) {
        console.log('StudentEligibilityContext: Using localStorage cache');
        if (showMessage) message.info('ข้อมูลสิทธิ์เป็นข้อมูลล่าสุดแล้ว');
        setEligibility({ ...cached, isLoading: false });
        return;
      }
    }

    isFetchingRef.current = true;
    console.log('StudentEligibilityContext: Starting fetchEligibility...');
    setEligibility(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await studentService.checkEligibility();

      if (response.success) {
        console.log('StudentEligibilityContext: Eligibility data from API (SUCCESS)');
        const newEligibility = {
          canAccessInternship: response.eligibility.internship.canAccessFeature || false,
          canAccessProject: response.eligibility.project.canAccessFeature || false,
          canRegisterInternship: response.eligibility.internship.canRegister || false,
          canRegisterProject: response.eligibility.project.canRegister || false,
          internshipReason: response.eligibility.internship.reason,
          projectReason: response.eligibility.project.reason,
          requirements: response.requirements,
          academicSettings: response.academicSettings,
          status: response.status || null,
          student: response.student || null,
          messages: {
            internship: response.eligibility.internship.reason || null,
            project: response.eligibility.project.reason || null,
          },
          isLoading: false,
          lastUpdated: new Date()
        };
        // Save to localStorage cache
        setCache(newEligibility, userData.studentCode);
        setEligibility(newEligibility);
        if (showMessage) {
          message.success('อัพเดตข้อมูลสิทธิ์การเข้าถึงระบบเรียบร้อยแล้ว');
        }
      } else {
        console.warn('StudentEligibilityContext: Eligibility API response not successful');
        setEligibility(prev => ({
          ...prev,
          isLoading: false,
          internshipReason: response.message || 'ไม่สามารถโหลดข้อมูลสิทธิ์ได้',
          // Reset access flags if API call was not successful but didn't throw an error
          canAccessInternship: false,
          canAccessProject: false,
          messages: {
            internship: response.message || 'ไม่สามารถโหลดข้อมูลสิทธิ์ได้',
            project: response.message || 'ไม่สามารถโหลดข้อมูลสิทธิ์ได้'
          }
        }));
        if (showMessage) {
          message.error(response.message || 'ไม่สามารถอัพเดตข้อมูลสิทธิ์ได้');
        }
      }
    } catch (error) {
      console.error('StudentEligibilityContext: Error fetching eligibility:', error.response?.data || error.message);
      setEligibility(prev => ({
        ...prev,
        isLoading: false,
        internshipReason: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสิทธิ์',
        projectReason: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสิทธิ์',
        canAccessInternship: false,
        canAccessProject: false,
        messages: {
          internship: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสิทธิ์',
          project: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสิทธิ์'
        }
      }));
      if (showMessage) {
        message.error('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่ออัพเดตข้อมูลสิทธิ์');
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [userData]);

  useEffect(() => {
    // Only fetch if we don't have valid cached data
    if (userData?.role === 'student' && userData?.studentCode) {
      const cached = getCache(userData.studentCode);
      if (!cached) {
        fetchEligibility();
      }
    }
    // Refresh every 6 hours
    const intervalId = setInterval(() => fetchEligibility(false, true), 6 * 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [userData, fetchEligibility]); // fetchEligibility is stable due to useCallback

  return (
  <StudentEligibilityContext.Provider value={{ ...eligibility, refreshEligibility: (showMessage = false, force = false) => fetchEligibility(showMessage, force) }}>
      {children}
    </StudentEligibilityContext.Provider>
  );
};