import { useMemo } from 'react';
import { calculateStudentYear } from '../utils/studentUtils';

export const useStudentEligibility = (userData) => {
  return useMemo(() => {
    const defaultResponse = {
      internshipStatus: {
        isEligible: false,
        value: 'ยังไม่พร้อมฝึกงาน',
        color: '#faad14',
        message: 'ไม่มีสิทธิ์เข้าถึงระบบฝึกงาน'
      },
      projectStatus: {
        isEligible: false,
        value: 'ยังไม่พร้อมทำโครงงาน',
        color: '#faad14',
        message: 'ไม่มีสิทธิ์เข้าถึงระบบโครงงาน'
      }
    };

    if (!userData || userData.role !== 'student') {
      return defaultResponse;
    }

    const yearResult = calculateStudentYear(userData.studentCode);
    const studentYear = yearResult.year;
    const totalCredits = userData.totalCredits || 0;
    const majorCredits = userData.majorCredits || 0;

    // ตรวจสอบสิทธิ์ฝึกงาน
    const internshipEligible = studentYear >= 3 && totalCredits >= 81;
    const internshipStatus = {
      isEligible: internshipEligible,
      value: internshipEligible ? 'พร้อมฝึกงาน' : 'ยังไม่พร้อมฝึกงาน',
      color: internshipEligible ? '#52c41a' : '#faad14',
      message: internshipEligible 
        ? 'มีสิทธิ์เข้าถึงระบบฝึกงาน'
        : `ต้องการหน่วยกิตรวม >= 81 (ปัจจุบัน: ${totalCredits})`
    };

    // ตรวจสอบสิทธิ์โครงงาน
    const projectEligible = studentYear >= 4 && totalCredits >= 95 && majorCredits >= 47;
    const projectStatus = {
      isEligible: projectEligible,
      value: projectEligible ? 'พร้อมทำโครงงาน' : 'ยังไม่พร้อมทำโครงงาน',
      color: projectEligible ? '#52c41a' : '#faad14',
      message: projectEligible
        ? 'มีสิทธิ์เข้าถึงระบบโครงงาน'
        : `ต้องการหน่วยกิตรวม >= 95 และหน่วยกิตเฉพาะ >= 47 
           (ปัจจุบัน: ${totalCredits}, ${majorCredits})`
    };

    return {
      internshipStatus,
      projectStatus
    };
  }, [userData]);
};