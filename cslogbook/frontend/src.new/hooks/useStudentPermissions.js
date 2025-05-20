import { useState, useEffect } from 'react';
import { message } from 'antd';
import axios from 'axios';
import { useAuth } from '../context/auth/AuthContext'; // Updated path

export const useStudentPermissions = () => {
  const { userData } = useAuth();
  const [permissions, setPermissions] = useState({
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

  const fetchEligibility = async () => {
    if (!userData || userData.role !== 'student') {
      return;
    }

    try {
      setPermissions(prev => ({ ...prev, isLoading: true }));
      
      const token = localStorage.getItem('token');
      // เรียกไปที่ endpoint ที่ถูกต้องตามที่กำหนดใน server.js
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/students/check-eligibility`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPermissions({
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
      } else {
        setPermissions(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error fetching eligibility:', error);
      setPermissions(prev => ({ 
        ...prev, 
        isLoading: false,
        // ตั้งค่าข้อความสำหรับใช้ใน tooltip เมื่อเกิดข้อผิดพลาด
        internshipReason: "ไม่สามารถตรวจสอบสิทธิ์ได้ กรุณาติดต่อผู้ดูแลระบบ",
        projectReason: "ไม่สามารถตรวจสอบสิทธิ์ได้ กรุณาติดต่อผู้ดูแลระบบ"
      }));
      message.error('ไม่สามารถตรวจสอบสิทธิ์ได้');
    }
  };

  useEffect(() => {
    fetchEligibility();
    
    // ตั้งค่าให้อัปเดตทุก 6 ชั่วโมง
    const intervalId = setInterval(fetchEligibility, 6 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []); // Added fetchEligibility to dependency array

  return {
    ...permissions,
    messages: {
      internship: permissions.internshipReason,
      project: permissions.projectReason
    },
    refreshPermissions: fetchEligibility
  };
};
