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

  // ดึงข้อมูลสิทธิ์จาก API
  const fetchEligibility = useCallback(async (showMessage = false) => {
    if (!userData || userData.role !== 'student') {
      return;
    }

    try {
      setEligibility(prev => ({ ...prev, isLoading: true }));
      
      const token = localStorage.getItem('token');
      // เรียกไปที่ endpoint ที่ถูกต้องตามที่กำหนดใน server.js
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/students/check-eligibility`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setEligibility({
          // ใช้ค่า canAccessFeature สำหรับการแสดงเมนู
          canAccessInternship: response.data.eligibility.internship.canAccessFeature || false,
          canAccessProject: response.data.eligibility.project.canAccessFeature || false,
          // เก็บค่า canRegister สำหรับการแสดงปุ่มลงทะเบียน
          canRegisterInternship: response.data.eligibility.internship.canRegister || false,
          canRegisterProject: response.data.eligibility.project.canRegister || false,
          internshipReason: response.data.eligibility.internship.reason,
          projectReason: response.data.eligibility.project.reason,
          requirements: response.data.requirements,
          academicSettings: response.data.academicSettings,
          isLoading: false,
          lastUpdated: new Date()
        });
        
        if (showMessage) {
          message.success('อัพเดตข้อมูลสิทธิ์การเข้าถึงระบบเรียบร้อยแล้ว');
        }
      } else {
        setEligibility(prev => ({ ...prev, isLoading: false }));
        
        if (showMessage) {
          message.error(response.data.message || 'ไม่สามารถอัพเดตข้อมูลสิทธิ์ได้');
        }
      }
    } catch (error) {
      console.error('Error fetching eligibility:', error);
      setEligibility(prev => ({ 
        ...prev, 
        isLoading: false,
        // ตั้งค่าข้อความสำหรับใช้ใน tooltip เมื่อเกิดข้อผิดพลาด
        internshipReason: "ไม่สามารถตรวจสอบสิทธิ์ได้ กรุณาติดต่อผู้ดูแลระบบ",
        projectReason: "ไม่สามารถตรวจสอบสิทธิ์ได้ กรุณาติดต่อผู้ดูแลระบบ"
      }));
      
      if (showMessage) {
        message.error('ไม่สามารถตรวจสอบสิทธิ์ได้');
      }
    }
  }, [userData]);

  // ดึงข้อมูลสิทธิ์เมื่อมีการเปลี่ยนแปลง userData
  useEffect(() => {
    fetchEligibility();
    
    // ตั้งค่าให้อัปเดตทุก 6 ชั่วโมง
    const intervalId = setInterval(() => fetchEligibility(), 6 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [userData, fetchEligibility]);

  const value = {
    // สถานะการเข้าถึงระบบต่างๆ
    canAccessInternship: eligibility.canAccessInternship,
    canAccessProject: eligibility.canAccessProject,
    canRegisterInternship: eligibility.canRegisterInternship,
    canRegisterProject: eligibility.canRegisterProject,
    
    // ข้อความสำหรับแสดงเหตุผล
    messages: {
      internship: eligibility.internshipReason,
      project: eligibility.projectReason
    },
    
    // ข้อมูลเพิ่มเติม
    requirements: eligibility.requirements,
    academicSettings: eligibility.academicSettings,
    isLoading: eligibility.isLoading,
    lastUpdated: eligibility.lastUpdated,
    
    // ฟังก์ชันสำหรับอัพเดตข้อมูลสิทธิ์
    refreshEligibility: (showMessage = false) => fetchEligibility(showMessage)
  };

  return (
    <StudentEligibilityContext.Provider value={value}>
      {children}
    </StudentEligibilityContext.Provider>
  );
};