import { useState, useEffect } from 'react';
import { message } from 'antd';
import { calculateStudentYear, isEligibleForProject, isEligibleForInternship } from '../utils/studentUtils';

export const usePermissions = (userData) => {
  const [permissions, setPermissions] = useState({
    isEligibleForInternship: localStorage.getItem('isEligibleForInternship') === 'true',
    isEligibleForProject: localStorage.getItem('isEligibleForProject') === 'true'
  });

  useEffect(() => {
    if (!userData?.studentCode || userData.role !== 'student') return;

    const calculatePermissions = () => {
      try {
        const yearResult = calculateStudentYear(userData.studentCode);
        if (!yearResult.error) {
          const studentYear = yearResult.year;
          
          const internshipStatus = isEligibleForInternship(
            studentYear,
            userData.totalCredits
          );

          const projectStatus = isEligibleForProject(
            studentYear,
            userData.totalCredits,
            userData.majorCredits
          );

          const newPermissions = {
            isEligibleForInternship: internshipStatus.eligible,
            isEligibleForProject: projectStatus.eligible
          };

          setPermissions(newPermissions);

          // Update localStorage
          Object.entries(newPermissions).forEach(([key, value]) => {
            localStorage.setItem(key, String(value));
          });
        }
      } catch (error) {
        console.error('Error calculating permissions:', error);
        message.error('ไม่สามารถตรวจสอบสิทธิ์ได้');
      }
    };

    calculatePermissions();
  }, [userData]);

  return permissions;
};