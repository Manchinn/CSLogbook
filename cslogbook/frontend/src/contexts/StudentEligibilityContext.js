import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import axios from 'axios';
import { useAuth } from './AuthContext';

const StudentEligibilityContext = createContext();

export const useStudentEligibility = () => {
  return useContext(StudentEligibilityContext);
};

export const StudentEligibilityProvider = ({ children }) => {
  const { userData } = useAuth();
  const [eligibility, setEligibility] = useState({
    canAccessInternship: false,
    canAccessProject: false,
    canRegisterInternship: false,
    canRegisterProject: false,
    internshipReason: null,
    projectReason: null,
    requirements: null,
    academicSettings: null,
    isLoading: true,
    lastUpdated: null
  });

  const fetchEligibility = useCallback(async (showMessage = false) => {
    if (!userData || userData.role !== 'student') {
      console.log('StudentEligibilityContext: fetchEligibility skipped - no userData or not a student', { userData }); // <--- LOG HERE
      setEligibility(prev => ({
        ...prev,
        isLoading: false, // Ensure loading is set to false if skipped
        canAccessInternship: false, // Reset to default if skipped
        canAccessProject: false,
        // ... reset other relevant fields if necessary
      }));
      return;
    }

    console.log('StudentEligibilityContext: Starting fetchEligibility...'); // <--- LOG HERE
    setEligibility(prev => ({ ...prev, isLoading: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/students/check-eligibility`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        console.log('StudentEligibilityContext: Eligibility data from API (SUCCESS):', response.data); // <--- LOG HERE
        setEligibility({
          canAccessInternship: response.data.eligibility.internship.canAccessFeature || false,
          canAccessProject: response.data.eligibility.project.canAccessFeature || false,
          canRegisterInternship: response.data.eligibility.internship.canRegister || false,
          canRegisterProject: response.data.eligibility.project.canRegister || false,
          internshipReason: response.data.eligibility.internship.reason,
          projectReason: response.data.eligibility.project.reason,
          requirements: response.data.requirements,
          academicSettings: response.data.academicSettings,
          isLoading: false,
          lastUpdated: new Date()
        });
        console.log('StudentEligibilityContext: State AFTER successful setEligibility:', { // <--- LOG HERE
          canAccessInternship: response.data.eligibility.internship.canAccessFeature || false,
          // ... (log other relevant parts of the new state)
        });
        if (showMessage) {
          message.success('อัพเดตข้อมูลสิทธิ์การเข้าถึงระบบเรียบร้อยแล้ว');
        }
      } else {
        console.warn('StudentEligibilityContext: Eligibility API call NOT successful:', response.data); // <--- LOG HERE
        setEligibility(prev => ({
          ...prev,
          isLoading: false,
          internshipReason: response.data.message || 'ไม่สามารถโหลดข้อมูลสิทธิ์ได้',
          // Reset access flags if API call was not successful but didn't throw an error
          canAccessInternship: false,
          canAccessProject: false,
        }));
        if (showMessage) {
          message.error(response.data.message || 'ไม่สามารถอัพเดตข้อมูลสิทธิ์ได้');
        }
      }
    } catch (error) {
      console.error('StudentEligibilityContext: Error fetching eligibility:', error.response ? error.response.data : error.message); // <--- LOG HERE (ดู error.response.data ด้วย)
      setEligibility(prev => ({
        ...prev,
        isLoading: false,
        internshipReason: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสิทธิ์',
        projectReason: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสิทธิ์',
        canAccessInternship: false, // Reset on error
        canAccessProject: false,
      }));
      if (showMessage) {
        message.error('เกิดข้อผิดพลาดในการเชื่อมต่อเพื่ออัพเดตข้อมูลสิทธิ์');
      }
    }
  }, [userData]); // Removed setEligibility from dependencies as it's a setter from useState

  useEffect(() => {
    console.log('StudentEligibilityContext: useEffect triggered, calling fetchEligibility. userData:', userData); // <--- LOG HERE
    fetchEligibility();
    const intervalId = setInterval(() => fetchEligibility(), 6 * 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [userData, fetchEligibility]); // fetchEligibility is stable due to useCallback

  return (
    <StudentEligibilityContext.Provider value={{ ...eligibility, refreshEligibility: (showMessage = false) => fetchEligibility(showMessage) }}>
      {children}
    </StudentEligibilityContext.Provider>
  );
};