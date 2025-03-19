import { useMemo } from 'react';
import { calculateStudentYear } from '../utils/studentUtils';

export const useStudentPermissions = (userData) => {
  return useMemo(() => {
    if (!userData || userData.role !== 'student') {
      return {
        canAccessInternship: false,
        canAccessProject: false,
        messages: {
          internship: 'ไม่มีสิทธิ์เข้าถึงระบบฝึกงาน',
          project: 'ไม่มีสิทธิ์เข้าถึงระบบโครงงาน'
        }
      };
    }

    const yearResult = calculateStudentYear(userData.studentCode);
    const studentYear = yearResult.year;

    // เงื่อนไขฝึกงาน: ปี 3 ขึ้นไป และหน่วยกิตรวม >= 81
    const canAccessInternship = studentYear >= 3 && userData.totalCredits >= 81;

    // เงื่อนไขโครงงาน: ปี 4 ขึ้นไป, หน่วยกิตรวม >= 95, หน่วยกิตเฉพาะ >= 47
    const canAccessProject = (
      studentYear >= 4 && 
      userData.totalCredits >= 95 && 
      userData.majorCredits >= 47
    );

    return {
      canAccessInternship,
      canAccessProject,
      messages: {
        internship: canAccessInternship 
          ? 'มีสิทธิ์เข้าถึงระบบฝึกงาน'
          : `ต้องการหน่วยกิตรวม >= 81 (ปัจจุบัน: ${userData.totalCredits})`,
        project: canAccessProject
          ? 'มีสิทธิ์เข้าถึงระบบโครงงาน'
          : `ต้องการหน่วยกิตรวม >= 95 และหน่วยกิตเฉพาะ >= 47 
             (ปัจจุบัน: ${userData.totalCredits}, ${userData.majorCredits})`
      }
    };
  }, [userData]);
};